/**
 * AI Provider Validation Layer
 * Validates provider configuration before any AI request is made.
 * Ensures ONLY user-configured keys from Settings are used.
 */
const { resolveFeatureConfig } = require('../../repositories/aiRepository');
const { resolveProviderApiKey } = require('../../domains/ai/core/providerRouter');
const { AI_FEATURES } = require('../ai/featureConfigs');
const { ExternalApiError } = require('../../shared/errors/customErrors');

const FEATURE_IDS = new Set(AI_FEATURES.map((f) => f.id));

function validateProviderKey(provider) {
  const name = String(provider || '').trim().toLowerCase();
  if (!name) {
    return { valid: false, code: 'PROVIDER_REQUIRED', message: 'AI provider is not configured.' };
  }
  const apiKey = resolveProviderApiKey(name);
  if (!apiKey) {
    return {
      valid: false,
      code: 'API_KEY_MISSING',
      message: `No active API key found for "${name}". Add your key in Settings → AI Workflows.`,
      provider: name,
    };
  }
  return { valid: true, provider: name };
}

function validateFeatureConfig(featureId) {
  const id = String(featureId || '').trim();
  if (!id) {
    return { valid: false, code: 'FEATURE_REQUIRED', message: 'AI feature ID is required.' };
  }
  if (!FEATURE_IDS.has(id)) {
    return { valid: false, code: 'FEATURE_INVALID', message: `Unknown AI feature: ${id}` };
  }

  let config;
  try {
    config = resolveFeatureConfig(id);
  } catch (err) {
    return { valid: false, code: 'FEATURE_CONFIG_ERROR', message: err.message };
  }

  if (!config.provider) {
    return { valid: false, code: 'PROVIDER_NOT_SET', message: `No provider configured for ${id}. Go to Settings.` };
  }
  if (!config.model) {
    return { valid: false, code: 'MODEL_NOT_SET', message: `No model selected for ${id}. Go to Settings.` };
  }

  const keyCheck = validateProviderKey(config.provider);
  if (!keyCheck.valid) {
    return { ...keyCheck, featureId: id, model: config.model };
  }

  return { valid: true, featureId: id, provider: config.provider, model: config.model, config };
}

function assertFeatureReady(featureId) {
  const result = validateFeatureConfig(featureId);
  if (!result.valid) {
    throw new ExternalApiError(
      result.message,
      result.provider || 'unknown',
      {
        reason: result.code,
        featureId: result.featureId || featureId,
        userAction: 'Configure API keys and models in Settings → AI Workflows',
      }
    );
  }
  return result;
}

module.exports = {
  validateProviderKey,
  validateFeatureConfig,
  assertFeatureReady,
};
