const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const { encrypt, decrypt } = require('../utils/encryption');

const TABLE = 'smtp_providers';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    email: String(row.email || '').trim().toLowerCase(),
    host: String(row.host || '').trim(),
    port: Number(row.port) || 587,
    secure: Boolean(row.secure),
    appPassword: row.appPassword || null,
    iv: typeof row.iv === 'string' ? row.iv : null,
    isDefault: row.isDefault === true,
    status: row.status || 'pending',
    lastVerifiedAt: row.lastVerifiedAt || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(smtp, userId) {
  const now = new Date().toISOString();
  return {
    id: smtp.id || uuidv4(),
    user_id: userId || smtp.userId,
    email: String(smtp.email || '').trim().toLowerCase(),
    host: String(smtp.host || '').trim(),
    port: Number(smtp.port) || 587,
    secure: !!smtp.secure,
    appPassword: smtp.appPassword || null,
    iv: smtp.iv || null,
    status: smtp.status || 'pending',
    isDefault: smtp.isDefault === true,
    lastVerifiedAt: smtp.lastVerifiedAt || null,
    created_at: smtp.createdAt || now,
    updated_at: now,
  };
}

const getAllSmtps = async (userId) => {
  const { data, error } = userId
    ? await Supabase.select(TABLE, {}, userId)
    : await Supabase.selectAll(TABLE);
  if (error) throw error;
  return (data || []).map(fromRow).filter((s) => s.email);
};

const getSmtpById = async (id, userId) => {
  const all = await getAllSmtps(userId);
  return all.find((s) => String(s.id) === String(id)) || null;
};

const getActiveSmtp = async (userId) => {
  const all = await getAllSmtps(userId);
  return all.find((s) => s.isDefault === true) || null;
};

const getSmtpByEmail = async (email, userId) => {
  const target = String(email || '').trim().toLowerCase();
  if (!target) return null;
  const all = await getAllSmtps(userId);
  return all.find((s) => s.email === target) || null;
};

const createSmtp = async (data, userId) => {
  const existing = await getAllSmtps(userId);
  const isDefault = existing.length === 0 || !!data.isDefault;

  let appPassword = data.appPassword || data.encryptedAppPassword || null;
  let iv = data.iv || null;
  if (typeof appPassword === 'string' && appPassword.trim() && !iv) {
    const encrypted = encrypt(appPassword);
    appPassword = encrypted.encryptedPassword;
    iv = encrypted.iv;
  }

  const row = toRow(
    {
      email: data.email,
      host: data.host,
      port: data.port,
      secure: data.secure,
      appPassword,
      iv,
      status: data.status || 'pending',
      isDefault,
      lastVerifiedAt: null,
    },
    userId,
  );

  const { data: inserted, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  const record = fromRow(inserted?.[0] || row);

  if (isDefault) {
    await setDefaultSmtp(record.id, userId);
  }

  return record;
};

const updateSmtp = async (id, updates, userId) => {
  const current = await getSmtpById(id, userId);
  if (!current) return null;

  const next = { ...current, ...updates };
  if (updates.appPassword && !updates.iv) {
    const { encryptedPassword, iv } = encrypt(updates.appPassword);
    next.appPassword = encryptedPassword;
    next.iv = iv;
  }
  if (updates.email !== undefined) next.email = String(updates.email || '').trim().toLowerCase();
  if (updates.host !== undefined) next.host = String(updates.host || '').trim();
  if (updates.port !== undefined) next.port = Number(updates.port) || 587;

  const row = toRow(next, userId);
  const { error } = await Supabase.update(TABLE, { id }, row, userId);
  if (error) throw error;

  if (updates.isDefault) {
    await setDefaultSmtp(id, userId);
  }

  return getSmtpById(id, userId);
};

const deleteSmtp = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

const setDefaultSmtp = async (id, userId) => {
  const all = await getAllSmtps(userId);
  for (const smtp of all) {
    const isDefault = String(smtp.id) === String(id);
    if (smtp.isDefault !== isDefault) {
      await Supabase.update(TABLE, { id: smtp.id }, { isDefault }, userId);
    }
  }
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
