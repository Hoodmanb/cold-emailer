/**
 * Centralized Provider Routing Registry
 * Maps dynamic provider requirements to concrete API clients.
 */
const openaiClient = require('../../../services/ai/providers/openaiClient');
const claudeClient = require('../../../services/ai/providers/claudeClient');
const geminiClient = require('../../../services/ai/providers/geminiClient');
const openrouterClient = require('../../../services/ai/providers/openrouterClient');
const { getDecryptedKey } = require('../../../repositories/aiRepository');
const { ExternalApiError } = require('../../../shared/errors/customErrors');
const { getBillingExecutionMode } = require('../../../middleware/requestContext');
const { resolveSystemApiKey } = require('../../../services/billing/systemProviderKeys');
const {
  getProviderEndpoint,
  mapAxiosToExternalApiError,
} = require('../../../utils/externalApiErrorMapper');

async function resolveProviderApiKey(providerName) {
  const name = String(providerName || '').trim().toLowerCase();
  if (getBillingExecutionMode() === 'token') {
    const systemKey = resolveSystemApiKey(name);
    if (systemKey) return systemKey;
  }
  const stored = await getDecryptedKey(name);
  if (stored) return stored;
  return null;
}

function normalizeClientParams(params = {}) {
  const { temperature, max_tokens, options = {}, ...rest } = params;
  return {
    ...rest,
    options: {
      ...options,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(max_tokens !== undefined ? { max_tokens } : {}),
    },
  };
}

function wrapProviderClient(providerName, clientFn) {
  return async (params = {}) => {
    const apiKey = await resolveProviderApiKey(providerName);
    const endpoint = getProviderEndpoint(providerName);

    if (!apiKey) {
      throw new ExternalApiError(
        `Invalid or missing API key for ${providerName}`,
        providerName,
        { upstreamStatus: null, endpoint, reason: 'missing_api_key' }
      );
    }

    try {
      return await clientFn(normalizeClientParams({ ...params, apiKey }));
    } catch (err) {
      if (err instanceof ExternalApiError) throw err;
      throw mapAxiosToExternalApiError(err, providerName, endpoint);
    }
  };
}

const PROVIDERS = {
  openai: wrapProviderClient('openai', openaiClient.completeOpenAI),
  claude: wrapProviderClient('claude', claudeClient.completeClaude),
  gemini: wrapProviderClient('gemini', geminiClient.completeGemini),
  openrouter: wrapProviderClient('openrouter', openrouterClient.completeOpenRouter),
};

const resolveProvider = (providerName) => {
  const name = String(providerName || '').trim().toLowerCase();
  const exec = PROVIDERS[name];
  if (!exec) {
    throw new ExternalApiError(
      `[provider-router] Unsupported AI Provider requested: '${providerName}'`,
      name || 'unknown',
      { reason: 'unsupported_provider' }
    );
  }
  return exec;
};

module.exports = { resolveProvider, resolveProviderApiKey };
