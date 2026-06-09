const axios = require('axios');
const { ExternalApiError } = require('../../../shared/errors/customErrors');
const { mapAxiosToExternalApiError } = require('../../../utils/externalApiErrorMapper');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function completeOpenRouter({ apiKey, model, messages, options = {} }) {
  if (!apiKey) {
    throw new ExternalApiError(
      'Invalid or missing API key for external AI provider',
      'openrouter',
      { upstreamStatus: null, endpoint: OPENROUTER_URL, reason: 'missing_api_key' }
    );
  }

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1200,
    ...(options.extraBody && typeof options.extraBody === 'object' ? options.extraBody : {}),
  };

  try {
    const response = await axios.post(OPENROUTER_URL, body, {
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

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new ExternalApiError(
        'OpenRouter returned empty content',
        'openrouter',
        { upstreamStatus: response.status, endpoint: OPENROUTER_URL, reason: 'empty_response' }
      );
    }

    const usage = response.data?.usage;
    if (usage) {
      const { addUsageEntry } = require('../../../middleware/requestContext');
      addUsageEntry({
        provider: 'openrouter',
        model,
        inputTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
      });
    }

    return String(content).trim();
  } catch (err) {
    if (err instanceof ExternalApiError) throw err;
    throw mapAxiosToExternalApiError(err, 'openrouter', OPENROUTER_URL);
  }
}

module.exports = { completeOpenRouter };
