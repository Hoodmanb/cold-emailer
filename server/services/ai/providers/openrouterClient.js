const axios = require('axios');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function completeOpenRouter({ apiKey, model, messages, options = {} }) {
  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1200,
    ...(options.extraBody && typeof options.extraBody === 'object' ? options.extraBody : {}),
  };

  const response = await axios.post(
    OPENROUTER_URL,
    body,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://career-bot.local',
        'X-Title': 'Career Automation Platform',
      },
      timeout: 60000,
    }
  );
  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned empty content');
  return String(content).trim();
}

module.exports = { completeOpenRouter };
