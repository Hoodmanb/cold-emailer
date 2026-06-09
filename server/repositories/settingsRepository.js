const fileStore = require('../utils/fileStore');

const FILENAME = 'settings.json';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultModel: 'openai/gpt-4o',
  notificationsEnabled: true,
};

const getSettings = (userId) => {
  const settings = fileStore.read(FILENAME, userId);
  const normalized =
    settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
  return { ...DEFAULT_SETTINGS, ...normalized };
};

const updateSettings = (updates, userId) => {
  const current = getSettings(userId);
  const next = { ...current, ...updates };
  return fileStore.write(FILENAME, next, userId);
};

module.exports = {
  getSettings,
  updateSettings,
};
