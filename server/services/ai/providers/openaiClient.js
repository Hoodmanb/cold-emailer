const axios = require('axios');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

async function completeOpenAI({ apiKey, model, messages, options = {} }) {
  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1200,
    ...(options.extraBody && typeof options.extraBody === 'object' ? options.extraBody : {}),
  };

  const response = await axios.post(
    OPENAI_URL,
    body,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );
  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty content');

  const usage = response.data?.usage;
  if (usage) {
    const { addUsageEntry } = require('../../../middleware/requestContext');
    addUsageEntry({
      provider: 'openai',
      model,
      inputTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
    });
  }

  return String(content).trim();
}

module.exports = { completeOpenAI };
