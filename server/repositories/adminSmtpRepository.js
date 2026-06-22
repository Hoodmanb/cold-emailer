const Supabase = require('../services/supabaseService');
const { encrypt, decrypt } = require("../utils/encryption");

const TABLE_NAME = 'admin_smtp';

const getAllAdminSmtps = async () => {
  const { data, error } = await Supabase.select(TABLE_NAME);
  if (error) throw error;
  const raw = Array.isArray(data) ? data : [];
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

const getAdminSmtpById = async (id) => {
  const all = await getAllAdminSmtps();
  return all.find((s) => String(s.id) === String(id)) || null;
};

const getActiveAdminSmtp = async () => {
  const all = await getAllAdminSmtps();
  return all.find((s) => s.isActive === true) || null;
};

const createAdminSmtp = async (data) => {
  const existing = await getAllAdminSmtps();
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

  const { data: inserted, error } = await Supabase.insert(TABLE_NAME, newSmtp);
  if (error) throw error;
  const record = inserted ? inserted[0] : null;

  if (isActive && record) {
    await setActiveAdminSmtp(record.id);
  }

  return record;
};

const updateAdminSmtp = async (id, updates) => {
  // Handle password encryption if needed
  if (updates.password && !updates.iv) {
    const { encryptedPassword, iv } = encrypt(updates.password);
    updates.password = encryptedPassword;
    updates.iv = iv;
  }

  const { data, error } = await Supabase.update(TABLE_NAME, { id }, updates);
  if (error) throw error;
  const updatedRecord = data && data.length ? data[0] : null;

  if (updates.isActive && updatedRecord) {
    await setActiveAdminSmtp(id);
  }

  return await getAdminSmtpById(id);
};

const deleteAdminSmtp = async (id) => {
  const wasActive = (await getAdminSmtpById(id))?.isActive;
  const { data, error } = await Supabase.delete(TABLE_NAME, { id });
  if (error) throw error;
  const count = data ? data.length : 0;

  if (wasActive) {
    const remaining = await getAllAdminSmtps();
    if (remaining.length > 0) {
      await setActiveAdminSmtp(remaining[0].id);
    }
  }
  return count;
};

const setActiveAdminSmtp = async (id) => {
  // Deactivate all
  const all = await getAllAdminSmtps();
  const deactivatePromises = all.map((s) => {
    if (s.isActive) {
      return Supabase.update(TABLE_NAME, { id: s.id }, { isActive: false });
    }
    return Promise.resolve();
  });
  await Promise.all(deactivatePromises);

  // Activate target
  await Supabase.update(TABLE_NAME, { id }, { isActive: true });
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
