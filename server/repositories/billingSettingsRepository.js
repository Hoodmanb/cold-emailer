const Supabase = require('../services/supabaseService');

const DEFAULT_SETTINGS = {
  id: 'billing-config',
  versionId: 'v-initial',
  credit_value_usd: 0.01,
  minimum_credit_charge: 1.0,
  global_ai_markup_multiplier: 4.0,
  providerModelMarkup: {},
  featureCosts: {},
  minimum_ai_charge_credits: 1,
  minimum_feature_charge_credits: 0,
  percentage_bonus_on_purchase: 0,
  updated_at: new Date().toISOString(),
};

async function getGlobalRow() {
  const { data, error } = await Supabase.selectAll('billing_settings');
  if (error) throw error;
  const rows = data || [];
  return rows.find((row) => !row.user_id) || rows[0] || null;
}

async function getBillingSettings() {
  const row = await getGlobalRow();
  const config = row?.config && typeof row.config === 'object' ? row.config : {};
  return { ...DEFAULT_SETTINGS, ...config };
}

async function updateBillingSettings(updates = {}) {
  const current = await getBillingSettings();
  const next = {
    ...current,
    ...updates,
    id: 'billing-config',
    versionId: `v-${Date.now()}`,
    updated_at: new Date().toISOString(),
  };
  const row = await getGlobalRow();
  const payload = {
    config: next,
    updated_at: new Date().toISOString(),
    user_id: null,
  };
  if (row?.id) {
    await Supabase.update('billing_settings', { id: row.id }, payload);
  } else {
    await Supabase.insert('billing_settings', payload);
  }
  return next;
}

async function seedBillingSettings() {
  const row = await getGlobalRow();
  if (!row) {
    await Supabase.insert('billing_settings', {
      user_id: null,
      config: DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    });
  }
}

module.exports = {
  getBillingSettings,
  updateBillingSettings,
  seedBillingSettings,
};
