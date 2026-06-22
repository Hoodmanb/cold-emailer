const { v4: uuidv4 } = require('uuid');
const Supabase = require('../../../services/supabaseService');

const TABLE = 'uploads';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    publicId: row.public_id,
    url: row.url,
    format: row.format,
    resourceType: row.resource_type,
    bytes: row.bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(meta, userId) {
  const now = new Date().toISOString();
  return {
    id: meta.id || uuidv4(),
    user_id: userId || meta.userId,
    public_id: meta.publicId || meta.public_id,
    url: meta.url,
    format: meta.format || null,
    resource_type: meta.resourceType || meta.resource_type || 'image',
    bytes: meta.bytes || null,
    created_at: meta.createdAt || now,
    updated_at: now,
  };
}

async function listUploads(userId) {
  if (!userId) return [];
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function addUpload(meta) {
  if (!meta?.userId) throw new Error('userId is required');
  const userId = String(meta.userId);
  const row = toRow(meta, userId);
  const { data, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(data?.[0] || row);
}

async function deleteUpload(id, userId) {
  if (!userId) return false;
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return (data?.length || 0) > 0;
}

async function getUpload(id, userId) {
  if (userId) {
    const { data, error } = await Supabase.selectOne(TABLE, { id }, userId);
    if (error) throw error;
    return fromRow(data);
  }
  const { data, error } = await Supabase.selectOne(TABLE, { id });
  if (error) throw error;
  return fromRow(data);
}

module.exports = { listUploads, addUpload, deleteUpload, getUpload };
