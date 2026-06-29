const Supabase = require('../services/supabaseService');

const TABLE_NAME = 'ai_settings';

/**
 * Retrieves AI settings for a specific user.
 * If no settings exist, returns a default empty object.
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getAiSettings(userId) {
  const { getCurrentUserId } = require('../middleware/requestContext');
  const finalUserId = userId || getCurrentUserId();
  if (!finalUserId || finalUserId === 'null') {
    return { apiKeys: [], featureMap: {} };
  }

  const { data, error } = await Supabase.select(TABLE_NAME, { user_id: finalUserId });
  if (error) {
    console.error('Error fetching AI settings:', error);
    throw error;
  }
  // Return existing settings or a default structure if none found
  return data?.[0]?.settings || { apiKeys: [], featureMap: {} };
}

/**
 * Upserts an API key for a given provider for a user.
 * @param {string} userId
 * @param {object} keyData - { provider: string, apiKey: string, label?: string, isActive?: boolean }
 * @returns {Promise<object>} The updated settings object.
 */
async function upsertApiKey(userId, keyData) {
  const { provider, apiKey } = keyData;
  const currentSettings = await getAiSettings(userId);
  const apiKeys = currentSettings.apiKeys || [];

  const existingKeyIndex = apiKeys.findIndex(k => k.provider === provider);
  if (existingKeyIndex > -1) {
    apiKeys[existingKeyIndex] = { ...apiKeys[existingKeyIndex], ...keyData };
  } else {
    apiKeys.push(keyData);
  }

  const updatedSettings = { ...currentSettings, apiKeys };
  const { data, error } = await Supabase.upsert(
    TABLE_NAME,
    { user_id: userId, settings: updatedSettings, updated_at: new Date().toISOString() },
    userId,
    'user_id',
  );
  if (error) {
    console.error('Error upserting API key:', error);
    throw error;
  }
  return data?.[0]?.settings || updatedSettings;
}

/**
 * Deletes an API key for a given provider for a user.
 * @param {string} userId
 * @param {string} provider
 * @returns {Promise<object>} The updated settings object.
 */
async function deleteApiKey(userId, provider) {
  const currentSettings = await getAiSettings(userId);
  const apiKeys = (currentSettings.apiKeys || []).filter(k => k.provider !== provider);

  const updatedSettings = { ...currentSettings, apiKeys };
  const { data, error } = await Supabase.upsert(
    TABLE_NAME,
    { user_id: userId, settings: updatedSettings, updated_at: new Date().toISOString() },
    userId,
    'user_id',
  );
  if (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
  return data?.[0]?.settings || updatedSettings;
}

/**
 * Updates the entire feature map for a user.
 * @param {string} userId
 * @param {object} featureMap
 * @returns {Promise<object>}
 */
async function updateFeatureMap(userId, featureMap) {
  const { assertFeatureMapPromptsValid } = require('../services/ai/promptPlaceholderValidation');
  assertFeatureMapPromptsValid(featureMap);

  const currentSettings = await getAiSettings(userId);
  const updatedSettings = { ...currentSettings, featureMap };

  const { error } = await Supabase.upsert(
    TABLE_NAME,
    { user_id: userId, settings: updatedSettings, updated_at: new Date().toISOString() },
    userId,
    'user_id',
  );
  if (error) {
    console.error('Error updating AI feature map:', error);
    throw error;
  }
  return updatedSettings;
}

/**
 * Updates configuration for a specific feature.
 * @param {string} userId
 * @param {string} featureId
 * @param {object} updates
 * @returns {Promise<object>}
 */
async function updateFeatureConfig(userId, featureId, updates) {
  const { assertCustomPromptValid } = require('../services/ai/promptPlaceholderValidation');
  const currentSettings = await getAiSettings(userId);
  const featureMap = currentSettings.featureMap || {};
  const merged = { ...(featureMap[featureId] || {}), ...updates };
  assertCustomPromptValid(featureId, merged);
  featureMap[featureId] = merged;

  const updatedSettings = { ...currentSettings, featureMap };
  const { error } = await Supabase.upsert(
    TABLE_NAME,
    { user_id: userId, settings: updatedSettings, updated_at: new Date().toISOString() },
    userId,
    'user_id',
  );
  if (error) throw error;
  return updatedSettings;
}

const { AI_FEATURES } = require('../services/ai/featureConfigs');
const FEATURE_IDS = new Set(AI_FEATURES.map((f) => f.id));
const SUPPORTED_AI_PROVIDERS = ['openai', 'claude', 'gemini', 'openrouter'];

const DEFAULT_FEATURE_MAP = AI_FEATURES.reduce((acc, f) => {
  acc[f.id] = {
    provider: 'openrouter',
    model: f.id === 'ats_analysis' ? 'deepseek/deepseek-r1' : 'openai/gpt-4o-mini',
    useCustomPrompt: false,
    customPrompt: '',
  };
  return acc;
}, {});

function normalizeFeatureConfig(featureId, value) {
  const fallback = DEFAULT_FEATURE_MAP[featureId] || {
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    useCustomPrompt: false,
    customPrompt: '',
  };
  const raw = value && typeof value === 'object' ? value : {};
  const provider = SUPPORTED_AI_PROVIDERS.includes(String(raw.provider || '').trim().toLowerCase())
    ? String(raw.provider).trim().toLowerCase()
    : fallback.provider;
  return {
    provider,
    model: String(raw.model || fallback.model || '').trim(),
    useCustomPrompt: raw.useCustomPrompt === true,
    customPrompt: typeof raw.customPrompt === 'string' ? raw.customPrompt : '',
  };
}

const resolveFeatureConfig = async (featureId, userId) => {
  const normalizedFeatureId = String(featureId || '').trim();
  if (!FEATURE_IDS.has(normalizedFeatureId)) {
    throw new Error(`Invalid feature ID: ${normalizedFeatureId || '<empty>'}`);
  }
  const { getBillingExecutionMode, getCurrentUserId } = require('../middleware/requestContext');
  if (getBillingExecutionMode() === 'token') {
    const { getSystemFeatureConfig } = require('../services/billing/systemProviderKeys');
    return getSystemFeatureConfig(normalizedFeatureId);
  }
  const finalUserId = userId || getCurrentUserId();
  const settings = await getAiSettings(finalUserId);
  return normalizeFeatureConfig(normalizedFeatureId, settings.featureMap?.[normalizedFeatureId]);
};

const resolveActivePrompt = async (featureId, userId) => {
  const normalizedFeatureId = String(featureId || '').trim();
  if (!FEATURE_IDS.has(normalizedFeatureId)) {
    throw new Error(`Invalid feature ID: ${normalizedFeatureId || '<empty>'}`);
  }
  const { resolvePrompt } = require('../domains/ai/core/promptRegistry');
  return resolvePrompt(normalizedFeatureId, userId);
};

const normalizeProviderName = (provider) => String(provider || '').trim().toLowerCase();

const getDecryptedKey = async (provider, userId) => {
  const finalUserId = userId || require('../middleware/requestContext').getCurrentUserId();
  const settings = await getAiSettings(finalUserId);
  const normalizedProvider = normalizeProviderName(provider);
  const keyEntry = (settings.apiKeys || []).find((k) => (
    normalizeProviderName(k.provider) === normalizedProvider &&
    k.isActive !== false &&
    String(k.apiKey || '').trim()
  ));
  if (!keyEntry) return null;
  return keyEntry.apiKey || null;
};

module.exports = {
  getAiSettings,
  upsertApiKey,
  deleteApiKey,
  updateFeatureMap,
  updateFeatureConfig,
  resolveFeatureConfig,
  resolveActivePrompt,
  getDecryptedKey,
  SUPPORTED_AI_PROVIDERS,
  DEFAULT_FEATURE_MAP,
};