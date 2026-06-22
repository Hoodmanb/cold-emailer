const {
  getCustomModelsByProvider,
  addCustomModel: persistCustomModel,
  removeCustomModel: persistCustomModelRemoval,
} = require('../../repositories/modelCatalogRepository');

const PROVIDERS = ['openai', 'claude', 'gemini', 'openrouter'];

const BASELINE_MODELS_BY_PROVIDER = {
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

function isBaselineModel(provider, modelId) {
  const p = normalizeProvider(provider);
  const id = String(modelId || '').trim();
  return (BASELINE_MODELS_BY_PROVIDER[p] || []).some((row) => row.id === id);
}

async function mergeProviderModels(provider) {
  const p = normalizeProvider(provider);
  const merged = new Map();

  (BASELINE_MODELS_BY_PROVIDER[p] || []).forEach((row) => {
    merged.set(row.id, { id: row.id, name: row.name, source: 'baseline' });
  });

  const custom = await getCustomModelsByProvider(p);
  if (Array.isArray(custom)) {
    custom.forEach((row) => {
      merged.set(row.id, { id: row.id, name: row.name, source: 'custom' });
    });
  }

  return [...merged.values()];
}

function getProviders() {
  return [...PROVIDERS];
}

async function getModelsByProvider(provider) {
  const list = await mergeProviderModels(provider);
  return list.map(({ id, name }) => ({ id, name }));
}

async function getAllModelsGrouped() {
  return Promise.all(PROVIDERS.map(async (provider) => ({
    provider,
    models: await mergeProviderModels(provider),
  })));
}

async function isValidModelForProvider(provider, model) {
  const p = normalizeProvider(provider);
  const m = String(model || '').trim();
  if (!p || !m) return false;
  const list = await mergeProviderModels(p);
  return list.some((row) => row.id === m);
}

async function addCustomModel(provider, { id, name }) {
  const p = normalizeProvider(provider);
  const modelId = String(id || '').trim();
  if (!PROVIDERS.includes(p)) {
    const err = new Error(`Unsupported provider: ${provider}`);
    err.statusCode = 400;
    throw err;
  }
  if (await isValidModelForProvider(p, modelId)) {
    const err = new Error(`Model "${modelId}" is already in the catalog`);
    err.statusCode = 409;
    throw err;
  }
  await persistCustomModel(p, { id: modelId, name: name || modelId });
  const list = await mergeProviderModels(p);
  return list.find((row) => row.id === modelId);
}

async function removeCustomModel(provider, modelId) {
  const p = normalizeProvider(provider);
  const id = String(modelId || '').trim();
  if (isBaselineModel(p, id)) {
    const err = new Error('Built-in models cannot be removed');
    err.statusCode = 400;
    throw err;
  }
  const custom = await getCustomModelsByProvider(p);
  if (!custom.some((row) => row.id === id)) {
    const err = new Error(`Custom model "${id}" not found`);
    err.statusCode = 404;
    throw err;
  }
  await persistCustomModelRemoval(p, id);
  return { provider: p, model: id };
}

module.exports = {
  PROVIDERS,
  BASELINE_MODELS_BY_PROVIDER,
  MODELS_BY_PROVIDER: BASELINE_MODELS_BY_PROVIDER,
  getProviders,
  getModelsByProvider,
  getAllModelsGrouped,
  isValidModelForProvider,
  isBaselineModel,
  addCustomModel,
  removeCustomModel,
};
