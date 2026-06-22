const axios = require('axios');
const { resolveSystemApiKey } = require('../billing/systemProviderKeys');
const { getDecryptedKey } = require('../../repositories/aiRepository');

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';
const CLAUDE_MODELS_URL = 'https://api.anthropic.com/v1/models';
const GEMINI_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function normalizeProvider(provider) {
  return String(provider || '').trim().toLowerCase();
}

async function resolveVerificationApiKey(provider) {
  const name = normalizeProvider(provider);
  return resolveSystemApiKey(name) || (await getDecryptedKey(name));
}

function geminiModelCandidates(modelId) {
  const raw = String(modelId || '').trim();
  if (!raw) return [];
  const stripped = raw.replace(/^models\//, '');
  return [...new Set([raw, stripped, `models/${stripped}`])];
}

async function verifyOpenRouterModel(apiKey, modelId) {
  const response = await axios.get(OPENROUTER_MODELS_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 30000,
    validateStatus: (status) => status < 500,
  });

  if (response.status === 401) {
    return { valid: false, message: 'Invalid OpenRouter API key for verification' };
  }
  if (response.status >= 400) {
    return { valid: false, message: 'Could not fetch OpenRouter model list' };
  }

  const match = (response.data?.data || []).find((row) => row.id === modelId);
  if (!match) {
    return { valid: false, message: `Model "${modelId}" was not found on OpenRouter` };
  }

  return {
    valid: true,
    message: 'Model verified on OpenRouter',
    upstreamName: match.name || modelId,
    provider: 'openrouter',
    model: modelId,
  };
}

async function verifyOpenAiModel(apiKey, modelId) {
  const response = await axios.get(OPENAI_MODELS_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 30000,
    validateStatus: (status) => status < 500,
  });

  if (response.status === 401) {
    return { valid: false, message: 'Invalid OpenAI API key for verification' };
  }
  if (response.status >= 400) {
    return { valid: false, message: 'Could not fetch OpenAI model list' };
  }

  const match = (response.data?.data || []).find((row) => row.id === modelId);
  if (match) {
    return {
      valid: true,
      message: 'Model verified on OpenAI',
      upstreamName: match.id,
      provider: 'openai',
      model: modelId,
    };
  }

  return verifyWithMinimalCompletion({
    provider: 'openai',
    apiKey,
    modelId,
    url: 'https://api.openai.com/v1/chat/completions',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model: modelId,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 5,
      temperature: 0,
    },
    invalidMessage: `Model "${modelId}" was not found on OpenAI`,
  });
}

async function verifyClaudeModel(apiKey, modelId) {
  try {
    const response = await axios.get(CLAUDE_MODELS_URL, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      timeout: 30000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 401) {
      return { valid: false, message: 'Invalid Claude API key for verification' };
    }

    if (response.status < 400) {
      const rows = response.data?.data || response.data?.models || [];
      const match = rows.find((row) => row.id === modelId || row.name === modelId);
      if (match) {
        return {
          valid: true,
          message: 'Model verified on Anthropic',
          upstreamName: match.display_name || match.name || modelId,
          provider: 'claude',
          model: modelId,
        };
      }
    }
  } catch {
    // Fall through to minimal message probe.
  }

  return verifyWithMinimalCompletion({
    provider: 'claude',
    apiKey,
    modelId,
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: {
      model: modelId,
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    },
    invalidMessage: `Model "${modelId}" was not found on Anthropic`,
  });
}

async function verifyGeminiModel(apiKey, modelId) {
  const candidates = geminiModelCandidates(modelId);

  for (const candidate of candidates) {
    const resource = candidate.startsWith('models/') ? candidate : `models/${candidate}`;
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/${resource}`,
      {
        params: { key: apiKey },
        timeout: 30000,
        validateStatus: (status) => status < 500,
      },
    );

    if (response.status === 200) {
      return {
        valid: true,
        message: 'Model verified on Gemini',
        upstreamName: response.data?.displayName || candidate.replace(/^models\//, ''),
        provider: 'gemini',
        model: candidate.replace(/^models\//, ''),
      };
    }
  }

  try {
    const response = await axios.get(GEMINI_MODELS_URL, {
      params: { key: apiKey },
      timeout: 30000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 401 || response.status === 403) {
      return { valid: false, message: 'Invalid Gemini API key for verification' };
    }

    if (response.status < 400) {
      const rows = response.data?.models || [];
      const match = rows.find((row) => {
        const name = String(row.name || '').replace(/^models\//, '');
        return candidates.some((candidate) => candidate.replace(/^models\//, '') === name);
      });
      if (match) {
        return {
          valid: true,
          message: 'Model verified on Gemini',
          upstreamName: match.displayName || modelId,
          provider: 'gemini',
          model: modelId.replace(/^models\//, ''),
        };
      }
    }
  } catch {
    // Fall through.
  }

  return {
    valid: false,
    message: `Model "${modelId}" was not found on Gemini`,
  };
}

async function verifyWithMinimalCompletion({
  provider,
  apiKey,
  modelId,
  url,
  headers,
  body,
  invalidMessage,
}) {
  try {
    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 45000,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 401) {
      return { valid: false, message: `Invalid ${provider} API key for verification` };
    }

    if (response.status === 404) {
      return { valid: false, message: invalidMessage };
    }

    if (response.status >= 400) {
      const detail =
        response.data?.error?.message ||
        response.data?.message ||
        invalidMessage;
      if (/model|not found|does not exist|unknown/i.test(String(detail))) {
        return { valid: false, message: invalidMessage };
      }
      return { valid: false, message: detail };
    }

    return {
      valid: true,
      message: `Model verified on ${provider}`,
      upstreamName: modelId,
      provider,
      model: modelId,
    };
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message || invalidMessage;
    if (/model|not found|does not exist|unknown/i.test(String(detail))) {
      return { valid: false, message: invalidMessage };
    }
    return { valid: false, message: detail };
  }
}

async function verifyModelExists(provider, modelId) {
  const normalizedProvider = normalizeProvider(provider);
  const model = String(modelId || '').trim();

  if (!normalizedProvider || !model) {
    return { valid: false, message: 'Provider and model id are required' };
  }

  const apiKey = await resolveVerificationApiKey(normalizedProvider);
  if (!apiKey) {
    return {
      valid: false,
      message: `No API key available for ${normalizedProvider}. Add a system env key or configure one in Settings → AI.`,
    };
  }

  switch (normalizedProvider) {
    case 'openrouter':
      return verifyOpenRouterModel(apiKey, model);
    case 'openai':
      return verifyOpenAiModel(apiKey, model);
    case 'claude':
      return verifyClaudeModel(apiKey, model);
    case 'gemini':
      return verifyGeminiModel(apiKey, model);
    default:
      return { valid: false, message: `Unsupported provider: ${normalizedProvider}` };
  }
}

module.exports = {
  verifyModelExists,
  resolveVerificationApiKey,
};
