const { ExternalApiError } = require('../shared/errors/customErrors');
const logger = require('./logger');

const PROVIDER_ENDPOINTS = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
};

function getProviderEndpoint(provider) {
  return PROVIDER_ENDPOINTS[String(provider || '').toLowerCase()] || 'unknown';
}

function mapAxiosToExternalApiError(err, provider = 'unknown', endpoint) {
  const providerName = String(provider || 'unknown').toLowerCase();
  const resolvedEndpoint = endpoint || getProviderEndpoint(providerName);
  const upstreamStatus = err?.response?.status || null;

  logger.error('[ExternalAPI] Provider request failed', {
    provider: providerName,
    statusCode: upstreamStatus,
    endpoint: resolvedEndpoint,
    code: err?.code || null,
    message: err?.message || 'Unknown external API error',
  });

  if (upstreamStatus === 401) {
    return new ExternalApiError(
      'Invalid or missing API key for external AI provider',
      providerName,
      { upstreamStatus: 401, endpoint: resolvedEndpoint, reason: 'invalid_api_key' }
    );
  }

  if (upstreamStatus === 429) {
    return new ExternalApiError(
      'External AI provider rate limit exceeded. Please try again shortly.',
      providerName,
      { upstreamStatus: 429, endpoint: resolvedEndpoint, reason: 'rate_limit', statusCode: 429 }
    );
  }

  if (upstreamStatus && upstreamStatus >= 500) {
    return new ExternalApiError(
      'External service temporarily unavailable',
      providerName,
      { upstreamStatus, endpoint: resolvedEndpoint, reason: 'provider_downtime' }
    );
  }

  if (err?.code === 'ECONNABORTED') {
    return new ExternalApiError(
      'External service request timed out',
      providerName,
      { upstreamStatus: null, endpoint: resolvedEndpoint, reason: 'timeout' }
    );
  }

  if (err?.code === 'ERR_NETWORK' || !err?.response) {
    return new ExternalApiError(
      'External service temporarily unavailable',
      providerName,
      { upstreamStatus: null, endpoint: resolvedEndpoint, reason: 'network_error' }
    );
  }

  const upstreamMessage =
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    'External service request failed';

  return new ExternalApiError(String(upstreamMessage), providerName, {
    upstreamStatus,
    endpoint: resolvedEndpoint,
    reason: 'request_failed',
  });
}

module.exports = {
  getProviderEndpoint,
  mapAxiosToExternalApiError,
};
