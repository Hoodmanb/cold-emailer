const PROVIDERS = ['openai', 'claude', 'gemini', 'openrouter'];

const MODELS_BY_PROVIDER = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ],
  claude: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  ],
  gemini: [
    { id: 'gemini-pro', name: 'Gemini Pro' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ],
  openrouter: [
    { id: 'openai/gpt-4o', name: 'OpenRouter · GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'OpenRouter · GPT-4o Mini' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'OpenRouter · Claude 3.5 Sonnet' },
    { id: 'deepseek/deepseek-r1', name: 'OpenRouter · DeepSeek R1' },
    { id: 'mistralai/mistral-large', name: 'OpenRouter · Mistral Large' },
  ],
};

const normalizeProvider = (provider) => String(provider || '').trim().toLowerCase();

function getProviders() {
  return [...PROVIDERS];
}

function getModelsByProvider(provider) {
  const p = normalizeProvider(provider);
  return MODELS_BY_PROVIDER[p] ? [...MODELS_BY_PROVIDER[p]] : [];
}

function getAllModelsGrouped() {
  return PROVIDERS.map((provider) => ({
    provider,
    models: getModelsByProvider(provider),
  }));
}

function isValidModelForProvider(provider, model) {
  const p = normalizeProvider(provider);
  const m = String(model || '').trim();
  if (!p || !m) return false;
  return getModelsByProvider(p).some((row) => row.id === m);
}

module.exports = {
  PROVIDERS,
  MODELS_BY_PROVIDER,
  getProviders,
  getModelsByProvider,
  getAllModelsGrouped,
  isValidModelForProvider,
};
