const BaseRepository = require('../infrastructure/db/BaseRepository');
const { encrypt, decrypt } = require("../utils/encryption");
const fileStore = require("../utils/fileStore");

const FILENAME = "admin_smtp.json";
const adminSmtpRepo = new BaseRepository(FILENAME);

const getAllAdminSmtps = () => {
  const raw = adminSmtpRepo.readAll();
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      ...s,
      name: String(s.name || "").trim(),
      username: String(s.username || s.email || "").trim().toLowerCase(),
      host: String(s.host || "").trim(),
      port: Number(s.port) || 587,
      secure: Boolean(s.secure),
      password: s.password || s.appPassword || s.encryptedPassword || null,
      iv: typeof s.iv === "string" ? s.iv : null,
      isActive: s.isActive === true,
    }))
    .filter((s) => s.username);
};

const getAdminSmtpById = (id) => {
  const all = getAllAdminSmtps();
  return all.find((s) => String(s.id) === String(id)) || null;
};

const getActiveAdminSmtp = () => {
  const all = getAllAdminSmtps();
  return all.find((s) => s.isActive === true) || null;
};

const createAdminSmtp = (data) => {
  const existing = getAllAdminSmtps();
  const isActive = existing.length === 0 || !!data.isActive;

  let password = data.password || null;
  let iv = data.iv || null;
  if (typeof password === "string" && password.trim() && !iv) {
    const encrypted = encrypt(password);
    password = encrypted.encryptedPassword;
    iv = encrypted.iv;
  }

  const newSmtp = {
    name: String(data.name || "").trim(),
    username: String(data.username || "").trim().toLowerCase(),
    host: String(data.host || "").trim(),
    port: Number(data.port) || 587,
    secure: !!data.secure,
    password,
    iv,
    isActive,
  };

  const record = adminSmtpRepo.create(newSmtp);

  if (isActive) {
    setActiveAdminSmtp(record.id);
  }

  return record;
};

const updateAdminSmtp = (id, updates) => {
  const result = adminSmtpRepo.update(id, updates);

  fileStore.update(FILENAME, (s) => String(s.id) === String(id), (s) => {
    const next = {};
    if (updates.password && !updates.iv) {
      const { encryptedPassword, iv } = encrypt(updates.password);
      next.password = encryptedPassword;
      next.iv = iv;
    }
    if (updates.name !== undefined) next.name = String(updates.name || "").trim();
    if (updates.username !== undefined) next.username = String(updates.username || "").trim().toLowerCase();
    if (updates.host !== undefined) next.host = String(updates.host || "").trim();
    if (updates.port !== undefined) next.port = Number(updates.port) || 587;
    if (updates.secure !== undefined) next.secure = !!updates.secure;
    return next;
  });

  if (updates.isActive) {
    setActiveAdminSmtp(id);
  }

  return getAdminSmtpById(id);
};

const deleteAdminSmtp = (id) => {
  const wasActive = getAdminSmtpById(id)?.isActive;
  const count = adminSmtpRepo.delete(id);
  
  if (wasActive) {
    const remaining = getAllAdminSmtps();
    if (remaining.length > 0) {
      setActiveAdminSmtp(remaining[0].id);
    }
  }
  return count;
};

const setActiveAdminSmtp = (id) => {
  const all = getAllAdminSmtps();
  const next = all.map((s) => ({
    ...s,
    isActive: String(s.id) === String(id),
  }));
  fileStore.write(FILENAME, next);
};

const getDecryptedPassword = (smtp) => {
  if (!smtp.password || !smtp.iv) return null;
  return decrypt(smtp.password, smtp.iv);
};

module.exports = {
  getAllAdminSmtps,
  getAdminSmtpById,
  getActiveAdminSmtp,
  createAdminSmtp,
  updateAdminSmtp,
  deleteAdminSmtp,
  setActiveAdminSmtp,
  getDecryptedPassword,
};
