const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

const TABLE = 'templates';

function fromRow(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    ...meta,
    id: row.id,
    userId: row.user_id,
    name: row.name || meta.name || '',
    subject: row.subject || meta.subject || '',
    body: row.body || meta.body || '',
    type: row.type || meta.type || 'email',
    createdAt: row.created_at || meta.createdAt,
    updatedAt: row.updated_at || meta.updatedAt,
  };
}

function toRow(template, userId) {
  const now = new Date().toISOString();
  const {
    id,
    userId: uid,
    user_id,
    name,
    subject,
    body,
    type,
    createdAt,
    updatedAt,
    ...rest
  } = template;
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id,
    name: name || '',
    subject: subject || '',
    body: body || '',
    type: type || 'email',
    metadata: {
      ...rest,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

const listTemplates = async (userId) => {
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
};

const getTemplate = async (id, userId) => {
  const list = await listTemplates(userId);
  return list.find((l) => String(l.id) === String(id) || String(l._id) === String(id)) || null;
};

const createTemplate = async (data, userId) => {
  const template = {
    name: '',
    subject: '',
    body: '',
    isPublic: false,
    usageCount: 0,
    lastUsedAt: null,
    ...data,
  };
  const row = toRow(template, userId);
  const { data: inserted, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(inserted?.[0] || row);
};

const updateTemplate = async (id, updates, userId) => {
  const current = await getTemplate(id, userId);
  if (!current) return null;
  const row = toRow({ ...current, ...updates, id }, userId);
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    {
      name: row.name,
      subject: row.subject,
      body: row.body,
      type: row.type,
      metadata: row.metadata,
      updated_at: new Date().toISOString(),
    },
    userId,
  );
  if (error) throw error;
  return fromRow(data[0] || row);
};

const bumpTemplateUsage = async (id, userId) => {
  const t = await getTemplate(id, userId);
  if (!t) return null;
  return updateTemplate(
    id,
    {
      usageCount: (Number(t.usageCount) || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    },
    userId,
  );
};

const deleteTemplate = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  bumpTemplateUsage,
};
