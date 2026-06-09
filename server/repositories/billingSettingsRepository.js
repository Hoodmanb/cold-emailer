const { safeRead, atomicWrite, withLock } = require('../db/jsonDb');

const FILE_NAME = 'billing_settings.json';

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

function getBillingSettings() {
  const settings = safeRead(FILE_NAME, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

function updateBillingSettings(updates = {}) {
  return withLock(FILE_NAME, () => {
    const current = getBillingSettings();
    const next = {
      ...current,
      ...updates,
      id: 'billing-config',
      versionId: `v-${Date.now()}`,
      updated_at: new Date().toISOString(),
    };
    atomicWrite(FILE_NAME, next);
    return next;
  });
}

function seedBillingSettings() {
  withLock(FILE_NAME, () => {
    const current = safeRead(FILE_NAME, null);
    if (!current || typeof current !== 'object' || !current.id) {
      atomicWrite(FILE_NAME, DEFAULT_SETTINGS);
    }
  });
}

module.exports = {
  getBillingSettings,
  updateBillingSettings,
  seedBillingSettings,
};
