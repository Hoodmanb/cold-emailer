const { openRouterApiKey } = require('../../config/env');

const SYSTEM_PROVIDER = String(process.env.SYSTEM_AI_PROVIDER || 'openrouter').trim().toLowerCase();
const SYSTEM_MODEL = String(process.env.SYSTEM_AI_MODEL || 'openai/gpt-4o-mini').trim();

const SYSTEM_KEY_ENV_MAP = {
  openai: 'SYSTEM_OPENAI_API_KEY',
  claude: 'SYSTEM_CLAUDE_API_KEY',
  gemini: 'SYSTEM_GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

function resolveSystemApiKey(providerName) {
  const name = String(providerName || SYSTEM_PROVIDER).trim().toLowerCase();
  const envKey = SYSTEM_KEY_ENV_MAP[name];
  if (envKey && process.env[envKey]) {
    return String(process.env[envKey]).trim();
  }
  if (name === 'openrouter' && openRouterApiKey) {
    return String(openRouterApiKey).trim();
  }
  return null;
}

function getSystemFeatureConfig(featureId) {
  return {
    provider: SYSTEM_PROVIDER,
    model: SYSTEM_MODEL,
    useCustomPrompt: false,
    customPrompt: '',
    featureId,
  };
}

function assertSystemProviderReady() {
  const apiKey = resolveSystemApiKey(SYSTEM_PROVIDER);
  if (!apiKey) {
    const err = new Error('System AI provider is not configured. Contact support.');
    err.statusCode = 503;
    err.errorCode = 'SYSTEM_AI_UNAVAILABLE';
    err.type = 'billing_error';
    throw err;
  }
  return { provider: SYSTEM_PROVIDER, model: SYSTEM_MODEL, apiKey };
}

module.exports = {
  SYSTEM_PROVIDER,
  SYSTEM_MODEL,
  resolveSystemApiKey,
  getSystemFeatureConfig,
  assertSystemProviderReady,
};
