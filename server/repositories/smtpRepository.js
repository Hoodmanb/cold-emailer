/**
 * Hardened SMTP Repository
 * Handles AES-256-CBC encryption hooks and standardizes on BaseRepository operations.
 */
const BaseRepository = require('../infrastructure/db/BaseRepository');
const { encrypt, decrypt } = require("../utils/encryption");
const fileStore = require("../utils/fileStore");

const FILENAME = "smtp.json";
const smtpRepo = new BaseRepository(FILENAME);

const getAllSmtps = () => {
  const raw = smtpRepo.readAll();
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      ...s,
      email: String(s.email || "").trim().toLowerCase(),
      host: String(s.host || "").trim(),
      port: Number(s.port) || 587,
      secure: Boolean(s.secure),
      appPassword: s.appPassword || s.encryptedAppPassword || null,
      iv: typeof s.iv === "string" ? s.iv : null,
      isDefault: s.isDefault === true,
      status: s.status || "pending",
    }))
    .filter((s) => s.email);
};

const getSmtpById = (id) => {
  const all = getAllSmtps();
  return all.find((s) => String(s.id) === String(id)) || null;
};

const getActiveSmtp = () => {
  const all = getAllSmtps();
  return all.find((s) => s.isDefault === true) || null;
};

const getSmtpByEmail = (email) => {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return null;
  const all = getAllSmtps();
  return all.find((s) => s.email === target) || null;
};

const createSmtp = (data) => {
  const existing = getAllSmtps();
  const isDefault = existing.length === 0 || !!data.isDefault;

  let appPassword = data.appPassword || data.encryptedAppPassword || null;
  let iv = data.iv || null;
  if (typeof appPassword === "string" && appPassword.trim() && !iv) {
    const encrypted = encrypt(appPassword);
    appPassword = encrypted.encryptedPassword;
    iv = encrypted.iv;
  }

  const newSmtp = {
    email: String(data.email || "").trim().toLowerCase(),
    host: String(data.host || "").trim(),
    port: Number(data.port) || 587,
    secure: !!data.secure,
    appPassword,
    iv,
    status: data.status || "pending",
    isDefault,
    lastVerifiedAt: null,
  };

  const record = smtpRepo.create(newSmtp);

  if (isDefault) {
    setDefaultSmtp(record.id);
  }

  return record;
};

const updateSmtp = (id, updates) => {
  const result = smtpRepo.update(id, updates);

  fileStore.update(FILENAME, (s) => String(s.id) === String(id), (s) => {
    const next = {};
    if (updates.appPassword && !updates.iv) {
      const { encryptedPassword, iv } = encrypt(updates.appPassword);
      next.appPassword = encryptedPassword;
      next.iv = iv;
    }
    if (updates.email !== undefined) next.email = String(updates.email || "").trim().toLowerCase();
    if (updates.host !== undefined) next.host = String(updates.host || "").trim();
    if (updates.port !== undefined) next.port = Number(updates.port) || 587;
    return next;
  });

  if (updates.isDefault) {
    setDefaultSmtp(id);
  }

  return getSmtpById(id);
};

const deleteSmtp = (id) => {
  return smtpRepo.delete(id);
};

const setDefaultSmtp = (id) => {
  const all = getAllSmtps();
  const next = all.map((s) => ({
    ...s,
    isDefault: String(s.id) === String(id),
  }));
  fileStore.write(FILENAME, next);
};

const getDecryptedPassword = (smtp) => {
  if (!smtp.appPassword || !smtp.iv) return null;
  return decrypt(smtp.appPassword, smtp.iv);
};

module.exports = {
  getAllSmtps,
  getSmtpById,
  getActiveSmtp,
  getSmtpByEmail,
  createSmtp,
  updateSmtp,
  deleteSmtp,
  setDefaultSmtp,
  getDecryptedPassword,
};
