const Supabase = require('../services/supabaseService');

const TABLE = 'settings';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultModel: 'openai/gpt-4o',
  notificationsEnabled: true,
};

async function getSettingsRow(userId) {
  const { data, error } = await Supabase.selectOne(TABLE, { user_id: userId }, userId);
  if (error) throw error;
  return data;
}

const getSettings = async (userId) => {
  const row = await getSettingsRow(userId);
  const normalized = row?.settings && typeof row.settings === 'object' ? row.settings : {};
  return { ...DEFAULT_SETTINGS, ...normalized };
};

const updateSettings = async (updates, userId) => {
  const current = await getSettings(userId);
  const next = { ...current, ...updates };
  const existing = await getSettingsRow(userId);
  if (existing) {
    const { error } = await Supabase.update(TABLE, { id: existing.id }, { settings: next }, userId);
    if (error) throw error;
  } else {
    const { error } = await Supabase.insert(TABLE, { settings: next }, userId);
    if (error) throw error;
  }
  return next;
};

module.exports = {
  getSettings,
  updateSettings,
};
