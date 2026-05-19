const fileStore = require("../utils/fileStore");

const FILENAME = "settings.json";

const DEFAULT_SETTINGS = {
  theme: "dark",
  defaultModel: "openai/gpt-4o",
  notificationsEnabled: true,
};

const getSettings = () => {
  const settings = fileStore.read(FILENAME);
  return { ...DEFAULT_SETTINGS, ...settings };
};

const updateSettings = (updates) => {
  const current = getSettings();
  const next = { ...current, ...updates };
  return fileStore.write(FILENAME, next);
};

module.exports = {
  getSettings,
  updateSettings,
};
