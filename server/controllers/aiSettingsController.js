const {
  getAiSettings: getAISettings,
  upsertApiKey: upsertProviderApiKey,
  deleteApiKey: deleteProviderApiKey,
  updateFeatureMap: saveAIFeatureMap, // Placeholder, needs implementation in aiRepository
  updateFeatureConfig, // Placeholder, needs implementation in aiRepository
} = require('../repositories/aiRepository');
const { AI_FEATURES } = require('../services/ai/featureConfigs');
const { getCurrentUserId } = require('../middleware/requestContext');

const {
  getOrCreateSession,
  getLatestSession,
  listSessionMessages,
  appendMessages,
} = require('../repositories/chatRepository');
const { getProviders, getModelsByProvider, getAllModelsGrouped } = require('../services/ai/modelCatalog');
const { safeGenerateForFeature, chatForFeature } = require('../services/aiService');
const { validateProviderKey, validateFeatureConfig } = require('../services/ai/providerValidation');
const { resolveProvider } = require('../domains/ai/core/providerRouter');
const { getUserBilling } = require('../repositories/billingUserRepository');
const { assertSystemProviderReady, getSystemFeatureConfig } = require('../services/billing/systemProviderKeys');

const reqLog = (req) => console.log('➡️', req.method, req.originalUrl || req.url, req.body);

/** Retrieve user ID from context or request object fallback */
const getUid = (req) => {
  const uid = getCurrentUserId(req) || req.user?.id || req.user?.sub;
  // Strict check to prevent passing "null" or invalid values to Supabase
  if (!uid || uid === 'null' || uid === 'undefined') {
    return null;
  }
  return uid;
};

const getAISettingsHandler = async (req, res, next) => {
  try {
    reqLog(req);
    const userId = getUid(req);
    const settings = (await getAISettings(userId)) || { apiKeys: [], featureMap: {} };

    // Enrich feature map with metadata for the UI
    const enrichedFeatureMap = {};
    AI_FEATURES.forEach(f => {
      const config = settings?.featureMap?.[f.id] || {};
      enrichedFeatureMap[f.id] = {
        ...f,
        ...config,
      };
    });

    const masked = {
      ...settings,
      apiKeys: (settings.apiKeys || []).map(({ apiKey, encryptedApiKey, iv, ...safe }) => safe),
      providers: getProviders(),
      featureMap: enrichedFeatureMap,
    };
    return res.status(200).json({ success: true, message: 'retrieved successfully', data: masked });
  } catch (err) {
    next(err);
  }
};

const updateFeatureConfigHandler = async (req, res, next) => {
  try {
    reqLog(req);
    const { featureId } = req.params;
    const updates = req.body || {};
    if (!featureId) {
      return res.status(400).json({
        success: false,
        message: "featureId is required",
        errors: ["Missing route parameter: featureId"],
      });
    }
    const userId = getUid(req);
    const data = await updateFeatureConfig(userId, featureId, updates);
    return res.status(200).json({ success: true, message: 'Feature configuration updated', data });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Failed to update feature",
      errorCode: err.errorCode || undefined,
      details: err.details || undefined,
      errors: [err.message || "Invalid feature configuration update"],
    });
  }
};

const upsertAIKeyHandler = async (req, res, next) => {
  try {
    reqLog(req);
    const userId = getUid(req);
    const billing = userId ? await getUserBilling(userId) : null;
    if (billing?.billingType === 'token') {
      return res.status(403).json({
        success: false,
        message: 'Credit users use the app AI key and cannot add personal API keys.',
        errorCode: 'PERSONAL_AI_KEYS_NOT_ALLOWED',
      });
    }
    const data = await upsertProviderApiKey(userId, req.body || {});
    return res.status(200).json({ success: true, message: 'API key saved', data });
  } catch (err) {
    next(err);
  }
};

const deleteAIKeyHandler = async (req, res, next) => {
  try {
    reqLog(req);
    const userId = getUid(req);
    const updatedSettings = await deleteProviderApiKey(userId, req.params.provider);
    return res.status(200).json({
      success: true,
      message: 'API key deleted',
      data: {
        ...updatedSettings,
        apiKeys: (updatedSettings?.apiKeys || []).map(({ apiKey, encryptedApiKey, iv, ...safe }) => safe),
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateFeatureMapHandler = async (req, res, next) => {
  try {
    reqLog(req);
    const userId = getUid(req);
    const map = await saveAIFeatureMap(userId, req.body?.featureMap || req.body || {});
    return res.status(200).json({ success: true, message: 'AI feature map updated', data: map });
  } catch (err) {
    next(err);
  }
};

const getModelsHandler = async (req, res, next) => {
  try {
    const provider = String(req.query.provider || '').trim().toLowerCase();
    const data = provider ? (await getModelsByProvider(provider) || []) : (await getAllModelsGrouped() || []);
    return res.status(200).json({ success: true, message: 'retrieved successfully', data });
  } catch (err) {
    next(err);
  }
};

const featureGenerateHandler = async (req, res, next) => {
  try {
    reqLog(req);
    const { featureId, prompt, messages, options } = req.body || {};
    const normalizedFeatureId = String(featureId || "").trim();
    if (!normalizedFeatureId) {
      return res.status(400).json({
        success: false,
        message: "featureId is required",
        errors: ["Missing featureId in request body"],
      });
    }
    const result = await safeGenerateForFeature({ featureId: normalizedFeatureId, prompt, messages, options });
    if (!result.success) {
      return res.status(502).json({
        success: false,
        type: result.type || 'external_api_error',
        error: result.error || result.message || 'External service temporarily unavailable',
        message: result.message || 'AI request failed',
      });
    }
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const chatHandler = async (req, res, next) => {
  try {
    reqLog(req);
    const { sessionId, messages, options } = req.body || {};
    const session = await getOrCreateSession(sessionId);
    const existingMessages = await listSessionMessages(session.id);
    const incoming = Array.isArray(messages) ? messages : [];
    const deltaStart = Math.max(existingMessages.length, 0);
    const newIncoming = incoming.slice(deltaStart).map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content || ''),
      createdAt: m?.createdAt,
      id: m?.id,
    }));

    if (newIncoming.length) {
      await appendMessages(session.id, newIncoming);
    }

    const finalHistory = await listSessionMessages(session.id);
    const result = await chatForFeature({ featureId: 'chatbot_assistant', messages: finalHistory, options });
    if (!result?.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Unable to process chat request',
        errors: result?.error ? [String(result.error)] : [],
      });
    }

    const assistantContent = String(result?.data || '').trim();
    const inserted = await appendMessages(session.id, [
      { role: 'assistant', content: assistantContent, createdAt: new Date().toISOString() },
    ]);
    const assistantMessage = inserted[0] || null;
    return res.status(200).json({
      success: true,
      message: 'Chat response generated successfully',
      data: assistantContent,
      meta: {
        sessionId: session.id,
        assistantMessage,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unable to process chat request',
      errors: [err.message || 'Unknown AI error'],
    });
  }
};

const getChatSessionHandler = async (req, res, next) => {
  try {
    const session = await getOrCreateSession(req.params.sessionId);
    const messages = await listSessionMessages(session.id);
    return res.status(200).json({
      success: true,
      message: 'Chat session retrieved successfully',
      data: {
        sessionId: session.id,
        messages,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getLatestChatSessionHandler = async (req, res, next) => {
  try {
    const latest = await getLatestSession();
    if (!latest) {
      const session = await getOrCreateSession();
      return res.status(200).json({
        success: true,
        message: 'Chat session retrieved successfully',
        data: {
          sessionId: session.id,
          messages: [],
        },
      });
    }
    const messages = await listSessionMessages(latest.id);
    return res.status(200).json({
      success: true,
      message: 'Chat session retrieved successfully',
      data: {
        sessionId: latest.id,
        messages,
      },
    });
  } catch (err) {
    next(err);
  }
};

const testConnectionHandler = async (req, res, next) => {
  try {
    const { provider } = req.body || {};
    const userId = getUid(req);
    const settings = await getAISettings(userId);
    const normalizedProvider = String(provider || '').trim().toLowerCase();
    const keyData = (settings?.apiKeys || []).find((k) => (
      String(k.provider || '').trim().toLowerCase() === normalizedProvider &&
      k.isActive !== false
    ));

    if (!keyData || !keyData.apiKey) {
      return res.status(400).json({
        success: false,
        message: `No active API key found for ${normalizedProvider || 'this provider'}. Please save or activate a key first.`,
      });
    }

    const exec = resolveProvider(normalizedProvider);
    await exec({
      model: normalizedProvider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 10,
      temperature: 0,
    });

    return res.status(200).json({
      success: true,
      message: `Connection to ${normalizedProvider} verified successfully`,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: err.message || 'Connection test failed',
      type: err.type || 'external_api_error',
    });
  }
};

const validateFeatureHandler = async (req, res, next) => {
  try {
    const { featureId } = req.params;
    const userId = getUid(req);
    const billing = userId ? await getUserBilling(userId) : null;
    if (billing?.billingType === 'token') {
      const system = assertSystemProviderReady();
      const config = getSystemFeatureConfig(featureId);
      return res.status(200).json({
        success: true,
        valid: true,
        featureId,
        featureName: AI_FEATURES.find((f) => f.id === featureId)?.name || featureId,
        provider: system.provider,
        model: config.model,
        config,
      });
    }

    const result = await validateFeatureConfig(featureId);
    if (!result.valid && billing?.billingType === 'gateway') {
      const access = billing.gatewayAccess || {};
      const gatewayActive = access.isActive && access.expiresAt && new Date(access.expiresAt).getTime() > Date.now();
      if (gatewayActive) {
        const system = assertSystemProviderReady();
        const config = getSystemFeatureConfig(featureId);
        return res.status(200).json({
          success: true,
          valid: true,
          featureId,
          featureName: AI_FEATURES.find((f) => f.id === featureId)?.name || featureId,
          provider: system.provider,
          model: config.model,
          config,
          billingMode: 'gateway_app_key',
          message: 'Gateway AI will use app credits for this feature because no personal OpenRouter key is configured.',
        });
      }
    }
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        ...result,
        errorCode: result.code || 'AI_NOT_CONFIGURED',
        details: {
          userAction: 'Configure API keys and models in Settings → AI Workflows',
        },
      });
    }
    return res.status(200).json({ success: true, valid: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAISettingsHandler,
  updateFeatureConfigHandler,
  upsertAIKeyHandler,
  deleteAIKeyHandler,
  updateFeatureMapHandler,
  getModelsHandler,
  featureGenerateHandler,
  chatHandler,
  getChatSessionHandler,
  getLatestChatSessionHandler,
  testConnectionHandler,
  validateFeatureHandler,
};
