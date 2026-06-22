const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const normalizeString = require('../utils/normalizeString');

const TABLE = 'recipients';

function fromRow(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    ...meta,
    id: row.id,
    userId: row.user_id,
    name: row.name || meta.name || '',
    email: normalizeString(row.email || meta.email),
    createdAt: row.created_at || meta.createdAt,
    updatedAt: row.updated_at || meta.updatedAt,
  };
}

function toRow(recipient, userId) {
  const now = new Date().toISOString();
  const {
    id,
    userId: uid,
    user_id,
    name,
    email,
    createdAt,
    updatedAt,
    ...rest
  } = recipient;
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id,
    name: name || '',
    email: normalizeString(email),
    metadata: {
      ...rest,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

const listRecipients = async (userId) => {
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
};

const getRecipient = async (id, userId) => {
  const list = await listRecipients(userId);
  return list.find((r) => String(r.id) === String(id)) || null;
};

const getRecipientByEmail = async (email, userId) => {
  const target = normalizeString(email);
  const list = await listRecipients(userId);
  return list.find((r) => normalizeString(r.email) === target) || null;
};

const createRecipient = async (data, userId) => {
  const recipient = {
    name: data.name,
    email: normalizeString(data.email),
    company: data.company || '',
    category: data.category || '',
    role: data.role || '',
    usageCount: 0,
    lastUsedAt: null,
  };
  const row = toRow(recipient, userId);
  const { data: inserted, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(inserted?.[0] || row);
};

const updateRecipient = async (id, updates, userId) => {
  const current = await getRecipient(id, userId);
  if (!current) return null;
  const row = toRow({ ...current, ...updates, id }, userId);
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    {
      name: row.name,
      email: row.email,
      metadata: row.metadata,
      updated_at: new Date().toISOString(),
    },
    userId,
  );
  if (error) throw error;
  return fromRow(data[0] || row);
};

const bumpRecipientUsage = async (id, userId) => {
  const r = await getRecipient(id, userId);
  if (!r) return null;
  return updateRecipient(
    id,
    {
      usageCount: (Number(r.usageCount) || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    },
    userId,
  );
};

const deleteRecipient = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

module.exports = {
  listRecipients,
  getRecipient,
  getRecipientByEmail,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  bumpRecipientUsage,
};
