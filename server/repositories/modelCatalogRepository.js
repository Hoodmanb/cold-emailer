const { v4: uuidv4 } = require('uuid');
const { safeRead, atomicWrite, withLock } = require('../db/jsonDb');

const FILE_NAME = 'ai_model_catalog.json';

const DEFAULT_CATALOG = {
  id: 'model-catalog',
  customModels: {},
  updated_at: new Date().toISOString(),
};

function readCatalog() {
  const raw = safeRead(FILE_NAME, DEFAULT_CATALOG);
  return {
    ...DEFAULT_CATALOG,
    ...(raw && typeof raw === 'object' ? raw : {}),
    customModels:
      raw?.customModels && typeof raw.customModels === 'object' ? raw.customModels : {},
  };
}

function getCustomModelsByProvider(provider) {
  const catalog = readCatalog();
  const key = String(provider || '').trim().toLowerCase();
  const rows = catalog.customModels[key];
  return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [];
}

function addCustomModel(provider, { id, name }) {
  const key = String(provider || '').trim().toLowerCase();
  const modelId = String(id || '').trim();
  const displayName = String(name || modelId).trim();
  if (!key || !modelId) {
    const err = new Error('provider and model id are required');
    err.statusCode = 400;
    throw err;
  }

  return withLock(FILE_NAME, () => {
    const catalog = readCatalog();
    const existing = Array.isArray(catalog.customModels[key])
      ? catalog.customModels[key]
      : [];
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

    const next = {
      ...catalog,
      customModels: {
        ...catalog.customModels,
        [key]: [...existing, nextRow],
      },
      updated_at: new Date().toISOString(),
    };
    atomicWrite(FILE_NAME, next);
    return nextRow;
  });
}

function removeCustomModel(provider, modelId) {
  const key = String(provider || '').trim().toLowerCase();
  const id = String(modelId || '').trim();
  if (!key || !id) {
    const err = new Error('provider and model id are required');
    err.statusCode = 400;
    throw err;
  }

  return withLock(FILE_NAME, () => {
    const catalog = readCatalog();
    const existing = Array.isArray(catalog.customModels[key])
      ? catalog.customModels[key]
      : [];
    const nextRows = existing.filter((row) => row.id !== id);
    if (nextRows.length === existing.length) {
      const err = new Error(`Custom model "${id}" not found for ${key}`);
      err.statusCode = 404;
      throw err;
    }

    const next = {
      ...catalog,
      customModels: {
        ...catalog.customModels,
        [key]: nextRows,
      },
      updated_at: new Date().toISOString(),
    };
    atomicWrite(FILE_NAME, next);
    return { provider: key, model: id };
  });
}

function seedModelCatalog() {
  withLock(FILE_NAME, () => {
    const current = safeRead(FILE_NAME, null);
    if (!current || typeof current !== 'object' || !current.id) {
      atomicWrite(FILE_NAME, DEFAULT_CATALOG);
    }
  });
}

module.exports = {
  readCatalog,
  getCustomModelsByProvider,
  addCustomModel,
  removeCustomModel,
  seedModelCatalog,
};
