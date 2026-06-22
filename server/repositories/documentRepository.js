const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const {
  buildDocumentPayload,
  applyContentUpdate,
  hydrateDocument,
} = require('../services/document/documentPersistenceService');

const TABLE = 'documents';

function fromRow(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return hydrateDocument({
    ...meta,
    id: row.id,
    userId: row.user_id,
    title: row.title || meta.title,
    storagePath: row.storage_path || meta.storagePath,
    createdAt: row.created_at || meta.createdAt,
    updatedAt: row.updated_at || meta.updatedAt,
  });
}

function toRow(doc, userId) {
  const hydrated = hydrateDocument(doc);
  const now = new Date().toISOString();
  const {
    id,
    userId: uid,
    user_id,
    title,
    storagePath,
    storage_path,
    createdAt,
    updatedAt,
    ...rest
  } = hydrated;
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id,
    title: title || rest.type || 'Untitled',
    storage_path: storagePath || storage_path || null,
    metadata: {
      ...rest,
      title,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

const listDocuments = async (jobId, userId) => {
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  const all = (data || []).map(fromRow);
  return jobId ? all.filter((d) => String(d.jobId) === String(jobId)) : all;
};

const getDocument = async (id, userId) => {
  const { data, error } = await Supabase.selectOne(TABLE, { id }, userId);
  if (error) throw error;
  return fromRow(data);
};

const saveDocument = async (docData, userId) => {
  const payload = buildDocumentPayload(docData);
  const row = toRow(payload, userId);
  const { data, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(data?.[0] || row);
};

const updateDocument = async (id, updates, userId) => {
  const existing = await getDocument(id, userId);
  if (!existing) return null;
  const normalized = applyContentUpdate(existing, updates);
  const row = toRow(normalized, userId);
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    {
      title: row.title,
      storage_path: row.storage_path,
      metadata: row.metadata,
      updated_at: new Date().toISOString(),
    },
    userId,
  );
  if (error) throw error;
  return fromRow(data[0] || row);
};

const approveDocument = async (id, userId) =>
  updateDocument(
    id,
    { status: 'approved', approvedAt: new Date().toISOString() },
    userId,
  );

const deleteDocument = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

const duplicateDocument = async (id, userId) => {
  const existing = await getDocument(id, userId);
  if (!existing) return null;
  return saveDocument(
    {
      ...existing,
      id: undefined,
      title: `${existing.title || existing.type} (Copy)`,
      status: 'draft',
      editedManually: existing.editedManually,
      approvedAt: undefined,
      exportHistory: [],
      createdAt: undefined,
      updatedAt: undefined,
    },
    userId,
  );
};

module.exports = {
  listDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  approveDocument,
  deleteDocument,
  duplicateDocument,
};
