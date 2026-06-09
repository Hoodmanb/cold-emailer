const { safeRead, atomicWrite, withLock } = require('../db/jsonDb');

const FILE_NAME = 'communication_settings.json';

const DEFAULT_SETTINGS = {
  whatsapp: { url: "", enabled: false },
  instagram: { url: "", enabled: false },
  twitter: { url: "", enabled: false },
  supportEmail: { email: "", enabled: false },
};

function getSettings() {
  const settings = safeRead(FILE_NAME, DEFAULT_SETTINGS);
  return {
    whatsapp: { url: "", enabled: false, ...((settings && settings.whatsapp) || {}) },
    instagram: { url: "", enabled: false, ...((settings && settings.instagram) || {}) },
    twitter: { url: "", enabled: false, ...((settings && settings.twitter) || {}) },
    supportEmail: { email: "", enabled: false, ...((settings && settings.supportEmail) || {}) },
  };
}

function updateSettings(updates = {}) {
  return withLock(FILE_NAME, () => {
    const current = getSettings();
    const next = {
      whatsapp: { ...current.whatsapp, ...(updates.whatsapp || {}) },
      instagram: { ...current.instagram, ...(updates.instagram || {}) },
      twitter: { ...current.twitter, ...(updates.twitter || {}) },
      supportEmail: { ...current.supportEmail, ...(updates.supportEmail || {}) },
    };
    atomicWrite(FILE_NAME, next);
    return next;
  });
}

module.exports = {
  getSettings,
  updateSettings,
};
