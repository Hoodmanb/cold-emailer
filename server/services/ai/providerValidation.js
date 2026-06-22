/**
 * AI Provider Validation Layer
 * Validates provider configuration before any AI request is made.
 * Ensures ONLY user-configured keys from Settings are used.
 */
const { resolveFeatureConfig } = require('../../repositories/aiRepository');
const { resolveProviderApiKey } = require('../../domains/ai/core/providerRouter');
const { AI_FEATURES } = require('../ai/featureConfigs');
const { AIConfigurationError } = require('../../shared/errors/customErrors');
const { getBillingExecutionMode } = require('../../middleware/requestContext');
const { assertSystemProviderReady } = require('../billing/systemProviderKeys');

const FEATURE_IDS = new Set(AI_FEATURES.map((f) => f.id));
const FEATURE_BY_ID = new Map(AI_FEATURES.map((f) => [f.id, f]));

function getFeatureName(featureId) {
  return FEATURE_BY_ID.get(featureId)?.name || featureId;
}

function formatProvider(provider) {
  const name = String(provider || '').trim().toLowerCase();
  if (name === 'openrouter') return 'OpenRouter';
  if (name === 'openai') return 'OpenAI';
  if (name === 'claude') return 'Claude';
  if (name === 'gemini') return 'Gemini';
  return provider || 'AI provider';
}

async function validateProviderKey(provider, featureId) {
  const name = String(provider || '').trim().toLowerCase();
  const featureName = getFeatureName(featureId);
  if (!name) {
    return {
      valid: false,
      code: 'PROVIDER_REQUIRED',
      message: `${featureName} is missing an AI provider. Configure this feature in Settings → AI Workflows.`,
      featureId,
      featureName,
    };
  }
  const apiKey = await resolveProviderApiKey(name);
  if (!apiKey) {
    return {
      valid: false,
      code: 'API_KEY_MISSING',
      message: `${featureName} is configured to use ${formatProvider(name)}, but no active ${formatProvider(name)} API key was found. Add or activate that key in Settings → AI Workflows.`,
      provider: name,
      featureId,
      featureName,
    };
  }
  return { valid: true, provider: name, featureId, featureName };
}

async function validateFeatureConfig(featureId) {
  const id = String(featureId || '').trim();
  if (!id) {
    return { valid: false, code: 'FEATURE_REQUIRED', message: 'AI feature ID is required.' };
  }
  if (!FEATURE_IDS.has(id)) {
    return { valid: false, code: 'FEATURE_INVALID', message: `Unknown AI feature: ${id}` };
  }
  const featureName = getFeatureName(id);

  let config;
  try {
    config = await resolveFeatureConfig(id);
  } catch (err) {
    return {
      valid: false,
      code: 'FEATURE_CONFIG_ERROR',
      message: `${featureName} could not load its AI configuration: ${err.message}`,
      featureId: id,
      featureName,
    };
  }

  if (!config.provider) {
    return {
      valid: false,
      code: 'PROVIDER_NOT_SET',
      message: `${featureName} is missing an AI provider. Configure this feature in Settings → AI Workflows.`,
      featureId: id,
      featureName,
    };
  }
  if (!config.model) {
    return {
      valid: false,
      code: 'MODEL_NOT_SET',
      message: `${featureName} is configured to use ${formatProvider(config.provider)}, but no model is selected. Choose a model in Settings → AI Workflows.`,
      featureId: id,
      featureName,
      provider: config.provider,
    };
  }

  const keyCheck = await validateProviderKey(config.provider, id);
  if (!keyCheck.valid) {
    return { ...keyCheck, featureId: id, featureName, model: config.model };
  }

  return { valid: true, featureId: id, featureName, provider: config.provider, model: config.model, config };
}

async function assertFeatureReady(featureId) {
  if (getBillingExecutionMode() === 'token') {
    const system = assertSystemProviderReady();
    return {
      valid: true,
      featureId,
      provider: system.provider,
      model: system.model,
      config: await resolveFeatureConfig(featureId),
    };
  }

  const result = await validateFeatureConfig(featureId);
  if (!result.valid) {
    throw new AIConfigurationError(result.message, {
      code: result.code || 'AI_NOT_CONFIGURED',
      featureId: result.featureId || featureId,
      featureName: result.featureName || getFeatureName(featureId),
      provider: result.provider,
      model: result.model,
    });
  }
  return result;
}

module.exports = {
  validateProviderKey,
  validateFeatureConfig,
  assertFeatureReady,
};
