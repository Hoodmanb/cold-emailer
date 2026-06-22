const { v4: uuidv4 } = require('uuid');
const Supabase = require('../../../services/supabaseService');
const { getCurrentUserId } = require('../../../middleware/requestContext');

const TABLE = 'attachments';
const FILE = 'attachments.json';

const VALID_PARENT_TYPES = new Set([
  'email',
  'email_template',
  'schedule',
  'template',
  'mail_widget',
]);

function fromRow(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    id: row.id,
    userId: row.user_id || meta.userId,
    sourceDocumentId: meta.sourceDocumentId || null,
    parentId: meta.parentId,
    parentType: meta.parentType,
    title: meta.title || 'Attachment',
    customName: meta.customName || null,
    type: meta.type || '',
    format: row.format || meta.format || '',
    fileUrl: row.url || meta.fileUrl || '',
    source: meta.source || 'document',
    createdAt: row.created_at || meta.createdAt,
  };
}

function toRow(attachment, userId) {
  const now = new Date().toISOString();
  const uid = userId || attachment.userId;
  return {
    id: attachment.id || uuidv4(),
    user_id: uid,
    public_id: attachment.publicId || attachment.id || uuidv4(),
    url: attachment.fileUrl || attachment.url || '',
    format: attachment.format || null,
    bytes: attachment.bytes || null,
    metadata: {
      userId: String(uid),
      sourceDocumentId: attachment.sourceDocumentId || null,
      parentId: String(attachment.parentId),
      parentType: String(attachment.parentType),
      title: String(attachment.title || attachment.customName || 'Attachment').trim(),
      customName: attachment.customName || null,
      type: attachment.type || '',
      format: attachment.format || '',
      fileUrl: attachment.fileUrl || '',
      source: attachment.source || 'document',
      createdAt: attachment.createdAt || now,
    },
    created_at: attachment.createdAt || now,
  };
}

async function listAllForUser(userId) {
  if (!userId) return [];
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function getById(id, userId) {
  const { data, error } = await Supabase.selectOne(TABLE, { id }, userId);
  if (error) throw error;
  const record = fromRow(data);
  if (!record) return null;
  if (userId && String(record.userId) !== String(userId)) return null;
  return record;
}

async function addAttachment({
  userId,
  sourceDocumentId,
  parentId,
  parentType,
  title,
  type,
  format,
  fileUrl,
  source,
  customName,
}) {
  const uid = userId || getCurrentUserId();
  if (!uid) throw new Error('userId is required');
  if (!parentId || !parentType) throw new Error('parentId and parentType are required');
  if (!VALID_PARENT_TYPES.has(parentType)) throw new Error('Invalid parentType');

  const row = toRow(
    {
      userId: String(uid),
      sourceDocumentId: sourceDocumentId ? String(sourceDocumentId) : null,
      parentId: String(parentId),
      parentType: String(parentType),
      title: String(title || customName || 'Attachment').trim(),
      customName: customName ? String(customName).trim() : null,
      type: type ? String(type) : '',
      format: format ? String(format) : '',
      fileUrl: fileUrl ? String(fileUrl) : '',
      source: source ? String(source) : 'document',
    },
    uid,
  );

  const { data, error } = await Supabase.insert(TABLE, row, uid);
  if (error) throw error;
  return fromRow(data?.[0] || row);
}

async function listAttachments(parentId, parentType, userId) {
  const uid = userId || getCurrentUserId();
  const all = await listAllForUser(uid);
  return all.filter(
    (a) =>
      String(a.parentId) === String(parentId) &&
      String(a.parentType) === String(parentType) &&
      (!uid || String(a.userId) === String(uid)),
  );
}

async function deleteAttachment(id, userId) {
  const uid = userId || getCurrentUserId();
  const existing = await getById(id, uid);
  if (!existing) return false;
  const { data, error } = await Supabase.delete(TABLE, { id }, uid);
  if (error) throw error;
  return (data?.length || 0) > 0;
}

async function deleteAttachmentsForParent(parentId, parentType, userId) {
  const uid = userId || getCurrentUserId();
  const all = await listAllForUser(uid);
  const toDelete = all.filter(
    (a) =>
      String(a.parentId) === String(parentId) &&
      String(a.parentType) === String(parentType) &&
      String(a.userId) === String(uid),
  );
  for (const attachment of toDelete) {
    await Supabase.delete(TABLE, { id: attachment.id }, uid);
  }
  return toDelete.length;
}

async function isDocumentReferenced(documentId) {
  const { data, error } = await Supabase.selectAll(TABLE);
  if (error) throw error;
  return (data || []).some((row) => {
    const meta = row.metadata || {};
    return String(meta.sourceDocumentId) === String(documentId);
  });
}

module.exports = {
  FILE,
  VALID_PARENT_TYPES,
  listAllForUser,
  getById,
  addAttachment,
  listAttachments,
  deleteAttachment,
  deleteAttachmentsForParent,
  isDocumentReferenced,
};
