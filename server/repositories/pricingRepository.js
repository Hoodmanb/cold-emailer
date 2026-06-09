const { v4: uuidv4 } = require('uuid');
const { safeRead, atomicWrite, withLock } = require('../db/jsonDb');

const FILE_NAME = 'ai_model_pricing.json';

const BASELINE_PRICING = [
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    input_cost_per_million: 0.15,
    output_cost_per_million: 0.60,
    markup_multiplier: 4.0,
    active: true,
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    input_cost_per_million: 2.50,
    output_cost_per_million: 10.00,
    markup_multiplier: 3.0,
    active: true,
  },
  {
    provider: 'claude',
    model: 'claude-3-5-sonnet-latest',
    input_cost_per_million: 3.00,
    output_cost_per_million: 15.00,
    markup_multiplier: 3.0,
    active: true,
  },
  {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    input_cost_per_million: 0.075,
    output_cost_per_million: 0.30,
    markup_multiplier: 4.0,
    active: true,
  },
  {
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1',
    input_cost_per_million: 0.55,
    output_cost_per_million: 2.19,
    markup_multiplier: 3.0,
    active: true,
  },
  {
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    input_cost_per_million: 0.15,
    output_cost_per_million: 0.60,
    markup_multiplier: 4.0,
    active: true,
  },
  // Wildcard provider fallbacks
  {
    provider: 'openai',
    model: '*',
    input_cost_per_million: 0.15,
    output_cost_per_million: 0.60,
    markup_multiplier: 4.0,
    active: true,
  },
  {
    provider: 'claude',
    model: '*',
    input_cost_per_million: 3.00,
    output_cost_per_million: 15.00,
    markup_multiplier: 3.0,
    active: true,
  },
  {
    provider: 'gemini',
    model: '*',
    input_cost_per_million: 0.075,
    output_cost_per_million: 0.30,
    markup_multiplier: 4.0,
    active: true,
  },
  {
    provider: 'openrouter',
    model: '*',
    input_cost_per_million: 0.15,
    output_cost_per_million: 0.60,
    markup_multiplier: 4.0,
    active: true,
  },
];

function listModelPricing() {
  const pricings = safeRead(FILE_NAME, []);
  return Array.isArray(pricings) ? pricings : [];
}

function getModelPricing(provider, model) {
  const list = listModelPricing();
  const prov = String(provider || '').trim().toLowerCase();
  const mdl = String(model || '').trim().toLowerCase();

  // 1. Try exact match
  let matched = list.find((p) => p.active && p.provider.toLowerCase() === prov && p.model.toLowerCase() === mdl);

  // 2. Try wildcard model for this provider
  if (!matched) {
    matched = list.find((p) => p.active && p.provider.toLowerCase() === prov && p.model === '*');
  }

  // 3. Try global baseline list fallback
  if (!matched) {
    matched = BASELINE_PRICING.find((p) => p.provider.toLowerCase() === prov && p.model.toLowerCase() === mdl);
  }

  // 4. Try global baseline wildcard fallback
  if (!matched) {
    matched = BASELINE_PRICING.find((p) => p.provider.toLowerCase() === prov && p.model === '*');
  }

  // 5. Hardcoded absolute fallback
  if (!matched) {
    matched = {
      provider: prov || 'unknown',
      model: mdl || 'unknown',
      input_cost_per_million: 0.15,
      output_cost_per_million: 0.60,
      markup_multiplier: 4.0,
      active: true,
    };
  }

  return matched;
}

function createModelPricing(data) {
  const record = {
    id: uuidv4(),
    provider: String(data.provider || 'unknown').trim().toLowerCase(),
    model: String(data.model || '*').trim(),
    input_cost_per_million: Number(data.input_cost_per_million) || 0,
    output_cost_per_million: Number(data.output_cost_per_million) || 0,
    markup_multiplier: Number(data.markup_multiplier) || 1.0,
    active: data.active !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return withLock(FILE_NAME, () => {
    const list = listModelPricing();
    list.push(record);
    atomicWrite(FILE_NAME, list);
    return record;
  });
}

function updateModelPricing(id, updates = {}) {
  return withLock(FILE_NAME, () => {
    const list = listModelPricing();
    const idx = list.findIndex((p) => String(p.id) === String(id));
    if (idx < 0) throw new Error('Model pricing not found');

    list[idx] = {
      ...list[idx],
      ...updates,
      id: list[idx].id, // keep original ID
      updated_at: new Date().toISOString(),
    };
    atomicWrite(FILE_NAME, list);
    return list[idx];
  });
}

function seedModelPricing() {
  withLock(FILE_NAME, () => {
    const list = safeRead(FILE_NAME, []);
    if (!list.length) {
      const seeded = BASELINE_PRICING.map((p) => ({
        id: uuidv4(),
        ...p,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      atomicWrite(FILE_NAME, seeded);
    }
  });
}

module.exports = {
  listModelPricing,
  getModelPricing,
  createModelPricing,
  updateModelPricing,
  seedModelPricing,
};
