const Supabase = require('../services/supabaseService');

const DEFAULT_SETTINGS = {
  whatsapp: { url: '', enabled: false },
  instagram: { url: '', enabled: false },
  twitter: { url: '', enabled: false },
  supportEmail: { email: '', enabled: false },
};

async function getGlobalRow() {
  const { data, error } = await Supabase.selectAll('communication_settings');
  if (error) throw error;
  const rows = data || [];
  return rows.find((row) => !row.user_id) || rows[0] || null;
}

async function getSettings() {
  const row = await getGlobalRow();
  const config = row?.config && typeof row.config === 'object' ? row.config : {};
  return { ...DEFAULT_SETTINGS, ...config };
}

async function updateSettings(updates = {}) {
  const current = await getSettings();
  const next = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const row = await getGlobalRow();
  const payload = {
    config: next,
    updated_at: new Date().toISOString(),
    user_id: null,
  };
  if (row?.id) {
    await Supabase.update('communication_settings', { id: row.id }, payload);
  } else {
    await Supabase.insert('communication_settings', payload);
  }
  return next;
}

module.exports = {
  getSettings,
  updateSettings,
};
