const { v4: uuidv4 } = require('uuid');
const fileStore = require('../../../utils/fileStore');
const { getCurrentUserId } = require('../../../middleware/requestContext');

const FILE = 'attachments.json';

const VALID_PARENT_TYPES = new Set([
  'email',
  'email_template',
  'schedule',
  'template',
  'mail_widget',
]);

function listAllForUser(userId) {
  if (!userId) return [];
  return fileStore.read(FILE, userId);
}

function getById(id, userId) {
  const record = fileStore.read(FILE, userId).find((a) => String(a.id) === String(id));
  if (!record) return null;
  if (userId && String(record.userId) !== String(userId)) return null;
  return record;
}

function addAttachment({
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

  const attachment = {
    id: uuidv4(),
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
    createdAt: new Date().toISOString(),
  };

  return fileStore.append(FILE, attachment, uid);
}

function listAttachments(parentId, parentType, userId) {
  const uid = userId || getCurrentUserId();
  return fileStore.read(FILE, uid).filter(
    (a) =>
      String(a.parentId) === String(parentId) &&
      String(a.parentType) === String(parentType) &&
      (!uid || String(a.userId) === String(uid)),
  );
}

function deleteAttachment(id, userId) {
  const uid = userId || getCurrentUserId();
  const existing = getById(id, uid);
  if (!existing) return false;
  return fileStore.remove(FILE, (a) => String(a.id) === String(id), uid);
}

function deleteAttachmentsForParent(parentId, parentType, userId) {
  const uid = userId || getCurrentUserId();
  const all = fileStore.read(FILE, uid);
  const remaining = all.filter(
    (a) =>
      !(
        String(a.parentId) === String(parentId) &&
        String(a.parentType) === String(parentType) &&
        String(a.userId) === String(uid)
      ),
  );
  if (remaining.length === all.length) return 0;
  fileStore.write(FILE, remaining, uid);
  return all.length - remaining.length;
}

function isDocumentReferenced(documentId) {
  const { safeRead } = require('../../../db/jsonDb');
  const raw = safeRead(FILE, { __scoped: true, users: {} });
  const users = raw.users && typeof raw.users === 'object' ? raw.users : {};
  for (const rows of Object.values(users)) {
    if (!Array.isArray(rows)) continue;
    if (rows.some((a) => String(a.sourceDocumentId) === String(documentId))) return true;
  }
  return false;
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
