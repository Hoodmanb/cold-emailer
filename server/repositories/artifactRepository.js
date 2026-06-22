const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const { UPLOAD_RELATIVE } = require('../utils/artifactSecurity');

const MAX_INLINE_BYTES = 500 * 1024;
const TABLE_NAME = 'artifacts';

function ensureUploadDir(absDir) {
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }
}

function fromRow(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const storageType = meta.storageType || (meta.base64Data ? 'base64' : row.storage_path ? 'file' : null);
  return {
    id: row.id,
    userId: row.user_id,
    filename: row.filename || 'file',
    mimetype: row.mime_type || 'application/octet-stream',
    mime_type: row.mime_type || 'application/octet-stream',
    storageType,
    base64Data: meta.base64Data || null,
    filePath: row.storage_path || null,
    storage_path: row.storage_path || null,
    size: meta.size || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function createArtifact(input) {
  const { buffer, filename, mimetype, userId } = input;
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('buffer is required');
  }
  if (!userId) throw new Error('userId is required');

  const id = uuidv4();
  const ext = path.extname(filename || '') || '';
  const storedFileName = `${id}${ext}`;

  const serverRoot = path.resolve(__dirname, '..');
  const absUploadDir = path.join(serverRoot, UPLOAD_RELATIVE);

  let storageType;
  let base64Data = null;
  let storagePath = null;

  if (buffer.length <= MAX_INLINE_BYTES) {
    storageType = 'base64';
    base64Data = buffer.toString('base64');
  } else {
    storageType = 'file';
    ensureUploadDir(absUploadDir);
    const absFile = path.join(absUploadDir, storedFileName);
    fs.writeFileSync(absFile, buffer);
    storagePath = path.join(UPLOAD_RELATIVE, storedFileName).replace(/\\/g, '/');
  }

  const now = new Date().toISOString();
  const record = {
    id,
    user_id: String(userId),
    filename: filename || 'file',
    mime_type: mimetype || 'application/octet-stream',
    storage_path: storagePath,
    metadata: {
      storageType,
      size: buffer.length,
      ...(base64Data ? { base64Data } : {}),
    },
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await Supabase.insert(TABLE_NAME, record, userId);
  if (error) throw error;
  return fromRow(data?.[0] || record);
}

async function listArtifacts(userId) {
  const { data, error } = await Supabase.select(TABLE_NAME, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function getArtifact(id, userId) {
  const { data, error } = await Supabase.selectOne(TABLE_NAME, { id }, userId);
  if (error) throw error;
  return fromRow(data);
}

function toPublic(artifact) {
  if (!artifact) return null;
  const { base64Data, ...rest } = artifact;
  return rest;
}

module.exports = {
  createArtifact,
  getArtifact,
  listArtifacts,
  toPublic,
  MAX_INLINE_BYTES,
};
