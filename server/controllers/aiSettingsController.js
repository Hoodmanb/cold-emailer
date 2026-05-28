const {
  getAiSettings: getAISettings,
  upsertApiKey: upsertProviderApiKey,
  deleteApiKey: deleteProviderApiKey,
  updateFeatureMap: saveAIFeatureMap,
  updateFeatureConfig,
} = require('../repositories/aiRepository');
const { AI_FEATURES } = require('../services/ai/featureConfigs');
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

const reqLog = (req) => console.log('➡️', req.method, req.originalUrl || req.url, req.body);

const getAISettingsHandler = (req, res, next) => {
  try {
    reqLog(req);
    const settings = getAISettings();
    
    // Enrich feature map with metadata for the UI
    const enrichedFeatureMap = {};
    AI_FEATURES.forEach(f => {
      const config = settings.featureMap[f.id] || {};
      enrichedFeatureMap[f.id] = {
        ...f,
        ...config,
      };
    });

    const masked = {
      ...settings,
      apiKeys: settings.apiKeys.map(({ encryptedApiKey, iv, ...safe }) => safe),
      providers: getProviders(),
      featureMap: enrichedFeatureMap,
    };
    return res.status(200).json({ success: true, message: 'retrieved successfully', data: masked });
  } catch (err) {
    next(err);
  }
};

const updateFeatureConfigHandler = (req, res, next) => {
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
    const data = updateFeatureConfig(featureId, updates);
    return res.status(200).json({ success: true, message: 'Feature configuration updated', data });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update feature",
      errors: [err.message || "Invalid feature configuration update"],
    });
  }
};

const upsertAIKeyHandler = (req, res, next) => {
  try {
    reqLog(req);
    const data = upsertProviderApiKey(req.body || {});
    return res.status(200).json({ success: true, message: 'API key saved', data });
  } catch (err) {
    next(err);
  }
};

const deleteAIKeyHandler = (req, res, next) => {
  try {
    reqLog(req);
    const settings = deleteProviderApiKey(req.params.provider);
    return res.status(200).json({
      success: true,
      message: 'API key deleted',
      data: {
        ...settings,
        apiKeys: settings.apiKeys.map(({ encryptedApiKey, iv, ...safe }) => safe),
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateFeatureMapHandler = (req, res, next) => {
  try {
    reqLog(req);
    const map = saveAIFeatureMap(req.body?.featureMap || req.body || {});
    return res.status(200).json({ success: true, message: 'AI feature map updated', data: map });
  } catch (err) {
    next(err);
  }
};

const getModelsHandler = (req, res, next) => {
  try {
    const provider = String(req.query.provider || '').trim().toLowerCase();
    const data = provider ? getModelsByProvider(provider) : getAllModelsGrouped();
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
    const session = getOrCreateSession(sessionId);
    const existingMessages = listSessionMessages(session.id);
    const incoming = Array.isArray(messages) ? messages : [];
    const deltaStart = Math.max(existingMessages.length, 0);
    const newIncoming = incoming.slice(deltaStart).map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content || ''),
      createdAt: m?.createdAt,
      id: m?.id,
    }));

    if (newIncoming.length) {
      appendMessages(session.id, newIncoming);
    }

    const finalHistory = listSessionMessages(session.id);
    const result = await chatForFeature({ featureId: 'chatbot_assistant', messages: finalHistory, options });
    if (!result?.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Unable to process chat request',
        errors: result?.error ? [String(result.error)] : [],
      });
    }

    const assistantContent = String(result?.data || '').trim();
    const inserted = appendMessages(session.id, [
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

const getChatSessionHandler = (req, res, next) => {
  try {
    const session = getOrCreateSession(req.params.sessionId);
    const messages = listSessionMessages(session.id);
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

const getLatestChatSessionHandler = (req, res, next) => {
  try {
    const latest = getLatestSession();
    if (!latest) {
      const session = getOrCreateSession();
      return res.status(200).json({
        success: true,
        message: 'Chat session retrieved successfully',
        data: {
          sessionId: session.id,
          messages: [],
        },
      });
    }
    const messages = listSessionMessages(latest.id);
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
    const keyCheck = validateProviderKey(provider);
    if (!keyCheck.valid) {
      return res.status(400).json({
        success: false,
        message: keyCheck.message,
        code: keyCheck.code,
      });
    }

    const exec = resolveProvider(keyCheck.provider);
    await exec({
      model: keyCheck.provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 10,
      temperature: 0,
    });

    return res.status(200).json({
      success: true,
      message: `Connection to ${keyCheck.provider} verified successfully`,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: err.message || 'Connection test failed',
      type: err.type || 'external_api_error',
    });
  }
};

const validateFeatureHandler = (req, res) => {
  const { featureId } = req.params;
  const result = validateFeatureConfig(featureId);
  if (!result.valid) {
    return res.status(400).json({ success: false, ...result });
  }
  return res.status(200).json({ success: true, ...result });
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
