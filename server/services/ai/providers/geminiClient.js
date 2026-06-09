const axios = require('axios');

function toGeminiParts(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }],
  }));
}

async function completeGemini({ apiKey, model, messages, options = {} }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await axios.post(
    url,
    {
      contents: toGeminiParts(messages),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.max_tokens ?? 1200,
        ...(options.geminiGenerationConfig && typeof options.geminiGenerationConfig === 'object'
          ? options.geminiGenerationConfig
          : {}),
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );
  const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Gemini returned empty content');

  const usage = response.data?.usageMetadata;
  if (usage) {
    const { addUsageEntry } = require('../../../middleware/requestContext');
    addUsageEntry({
      provider: 'gemini',
      model,
      inputTokens: usage.promptTokenCount ?? usage.input_tokens ?? 0,
      outputTokens: usage.candidatesTokenCount ?? usage.output_tokens ?? 0,
    });
  }

  return String(content).trim();
}

module.exports = { completeGemini };
