const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

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

async function listModelPricing() {
  const { data, error } = await Supabase.select('model_pricing');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function getModelPricing(provider, model) {
  const list = await listModelPricing();
  const prov = String(provider || '').trim().toLowerCase();
  const mdl = String(model || '').trim().toLowerCase();

  // 1. Try exact match in DB list
  let matched = list.find((p) => p.active && p.provider.toLowerCase() === prov && p.model.toLowerCase() === mdl);

  // 2. Try wildcard model for this provider in DB list
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

async function createModelPricing(data) {
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

  const { data: inserted, error } = await Supabase.insert('model_pricing', record);
  if (error) throw error;
  return inserted ? inserted[0] : null;
}

async function updateModelPricing(id, updates = {}) {
  const { data, error } = await Supabase.update('model_pricing', { id }, updates);
  if (error) throw error;
  // Supabase returns updated rows; return first if exists
  return data && data.length ? data[0] : null;
}

async function seedModelPricing() {
  const { data, error } = await Supabase.select('model_pricing');
  if (error) throw error;
  if (!data || data.length === 0) {
    const seeded = BASELINE_PRICING.map((p) => ({
      id: uuidv4(),
      ...p,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    const { error: insErr } = await Supabase.insert('model_pricing', seeded);
    if (insErr) throw insErr;
  }
}

module.exports = {
  listModelPricing,
  getModelPricing,
  createModelPricing,
  updateModelPricing,
  seedModelPricing,
};
