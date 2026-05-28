const axios = require('axios');
const { ExternalApiError } = require('../../shared/errors/customErrors');
const { mapAxiosToExternalApiError } = require('../../utils/externalApiErrorMapper');
const { openRouterApiKey, isProd } = require('../../config/env');
const logger = require('../../utils/logger');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const complete = async (model, messages, options = {}) => {
  const apiKey = openRouterApiKey;

  if (!apiKey) {
    if (isProd) {
      throw new ExternalApiError(
        'OPENROUTER_API_KEY is missing in production environment. AI generation is disabled.',
        'openrouter',
        { upstreamStatus: null, endpoint: OPENROUTER_URL, reason: 'missing_api_key' }
      );
    }
    logger.warn('[OpenRouter] No API key set in development — returning graceful fallback message');
    return '[API KEY MISSING] Please add your OpenRouter API key to use AI features. Real AI generation is currently disabled in development mode.';
  }

  const payload = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2000,
  };

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(OPENROUTER_URL, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://career-bot.local',
          'X-Title': 'Career Automation Platform',
        },
        timeout: 60000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 401) {
        throw new ExternalApiError(
          'Invalid or missing API key for external AI provider',
          'openrouter',
          { upstreamStatus: 401, endpoint: OPENROUTER_URL, reason: 'invalid_api_key' }
        );
      }

      if (response.status === 429) {
        throw new ExternalApiError(
          'External AI provider rate limit exceeded. Please try again shortly.',
          'openrouter',
          { upstreamStatus: 429, endpoint: OPENROUTER_URL, reason: 'rate_limit', statusCode: 429 }
        );
      }

      if (response.status >= 400) {
        throw new ExternalApiError(
          response.data?.error?.message || 'External service temporarily unavailable',
          'openrouter',
          { upstreamStatus: response.status, endpoint: OPENROUTER_URL, reason: 'request_failed' }
        );
      }

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      }

      throw new ExternalApiError(
        'Unexpected OpenRouter response structure',
        'openrouter',
        { upstreamStatus: response.status, endpoint: OPENROUTER_URL, reason: 'empty_response' }
      );
    } catch (err) {
      lastError = err instanceof ExternalApiError ? err : mapAxiosToExternalApiError(err, 'openrouter', OPENROUTER_URL);
      const isRetryable =
        lastError.details?.upstreamStatus >= 500 ||
        lastError.details?.reason === 'network_error' ||
        err.code === 'ECONNABORTED';
      if (!isRetryable || attempt === MAX_RETRIES) break;
      logger.warn(`[OpenRouter] Attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS * attempt}ms...`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError;
};

module.exports = { complete };
