const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

const FILE_NAME = 'ai_model_catalog.json';

const DEFAULT_CATALOG = {
  id: 'model-catalog',
  customModels: {},
  updated_at: new Date().toISOString(),
};

async function readCatalog() {
  const { data, error } = await Supabase.select('model_catalog');
  if (error) throw error;
  if (!data || data.length === 0) {
    // Seed default catalog if missing
    await Supabase.insert('model_catalog', DEFAULT_CATALOG);
    return { ...DEFAULT_CATALOG };
  }
  const raw = data[0];
  return {
    ...DEFAULT_CATALOG,
    ...raw,
    customModels: raw.customModels && typeof raw.customModels === 'object' ? raw.customModels : {},
  };
}

async function getCustomModelsByProvider(provider) {
  const catalog = await readCatalog();
  const customModels = catalog?.customModels || {};

  if (!provider) {
    const result = { openai: [], claude: [], gemini: [], openrouter: [] };
    Object.keys(customModels).forEach(key => {
      result[key] = Array.isArray(customModels[key]) ? customModels[key] : [];
    });
    return result;
  }

  const key = String(provider).trim().toLowerCase();
  const rows = customModels[key];
  return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [];
}

async function addCustomModel(provider, { id, name }) {
  const key = String(provider || '').trim().toLowerCase();
  const modelId = String(id || '').trim();
  const displayName = String(name || modelId).trim();
  if (!key || !modelId) {
    const err = new Error('provider and model id are required');
    err.statusCode = 400;
    throw err;
  }
  const catalog = await readCatalog();
  const existing = Array.isArray(catalog.customModels[key]) ? catalog.customModels[key] : [];
  if (existing.some((row) => row.id === modelId)) {
    const err = new Error(`Model "${modelId}" already exists for ${key}`);
    err.statusCode = 409;
    throw err;
  }
  const nextRow = {
    id: modelId,
    name: displayName,
    added_at: new Date().toISOString(),
    catalog_entry_id: uuidv4(),
  };
  const updatedCatalog = {
    ...catalog,
    customModels: {
      ...catalog.customModels,
      [key]: [...existing, nextRow],
    },
    updated_at: new Date().toISOString(),
  };
  // Use upsert instead of delete+insert for better concurrency and performance
  await Supabase.upsert('model_catalog', updatedCatalog, null, 'id');
  return nextRow;
}

async function removeCustomModel(provider, modelId) {
  const key = String(provider || '').trim().toLowerCase();
  const id = String(modelId || '').trim();
  if (!key || !id) {
    const err = new Error('provider and model id are required');
    err.statusCode = 400;
    throw err;
  }
  const catalog = await readCatalog();
  const existing = Array.isArray(catalog.customModels[key]) ? catalog.customModels[key] : [];
  const nextRows = existing.filter((row) => row.id !== id);
  if (nextRows.length === existing.length) {
    const err = new Error(`Custom model "${id}" not found for ${key}`);
    err.statusCode = 404;
    throw err;
  }
  const updatedCatalog = {
    ...catalog,
    customModels: {
      ...catalog.customModels,
      [key]: nextRows,
    },
    updated_at: new Date().toISOString(),
  };
  await Supabase.upsert('model_catalog', updatedCatalog, null, 'id');
  return { provider: key, model: id };
}

async function seedModelCatalog() {
  const { data, error } = await Supabase.select('model_catalog');
  if (error) throw error;
  if (!data || data.length === 0) {
    await Supabase.insert('model_catalog', DEFAULT_CATALOG);
  }
}

module.exports = {
  readCatalog,
  getCustomModelsByProvider,
  addCustomModel,
  removeCustomModel,
  seedModelCatalog,
};
