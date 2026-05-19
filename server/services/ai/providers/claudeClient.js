const axios = require('axios');

const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

async function completeClaude({ apiKey, model, messages, options = {} }) {
  const system = messages.find((m) => m.role === 'system')?.content || '';
  const userTurns = messages.filter((m) => m.role !== 'system').map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));
  const response = await axios.post(
    CLAUDE_URL,
    {
      model,
      max_tokens: options.max_tokens ?? 1200,
      temperature: options.temperature ?? 0.7,
      system,
      messages: userTurns,
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );
  const content = response.data?.content?.[0]?.text;
  if (!content) throw new Error('Claude returned empty content');
  return String(content).trim();
}

module.exports = { completeClaude };
