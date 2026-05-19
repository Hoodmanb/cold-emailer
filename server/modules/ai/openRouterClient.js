const axios = require('axios');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const { isProd, openRouterApiKey } = require('../../config/env');
const logger = require('../../utils/logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a chat completion request to OpenRouter.
 * Retries up to MAX_RETRIES times with exponential backoff.
 *
 * @param {string} model - OpenRouter model ID (e.g. 'openai/gpt-4o')
 * @param {Array} messages - OpenAI-format messages array
 * @param {object} options - Optional overrides (temperature, max_tokens)
 * @returns {string} - The raw text response from the model
 */
const complete = async (model, messages, options = {}) => {
  const apiKey = openRouterApiKey;

  if (!apiKey) {
    if (isProd) {
      throw new Error('OPENROUTER_API_KEY is missing in production environment. AI generation is disabled.');
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
      });

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      }

      throw new Error('Unexpected OpenRouter response structure');
    } catch (err) {
      lastError = err;
      const isRetryable = err.response?.status >= 500 || err.code === 'ECONNABORTED';
      if (!isRetryable || attempt === MAX_RETRIES) break;
      logger.warn(`[OpenRouter] Attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS * attempt}ms...`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error(`OpenRouter request failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
};



module.exports = { complete };
