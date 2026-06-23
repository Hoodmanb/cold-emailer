const path = require('path');
const fs = require('fs');
const documentRepo = require('../../repositories/documentRepository');
const uploadsRepo = require('../documents/uploads/repository');
const documentExporter = require('../../utils/documentExporter');
const { getEditableContent } = require('../../services/document/documentPersistenceService');
const { getCurrentUserId } = require('../../middleware/requestContext');

const UPLOAD_DIR = path.join(__dirname, '../../storage/uploads');

async function resolveDocumentToAttachment(documentId, userId, customName) {
  const doc = await documentRepo.getDocument(documentId);
  if (doc) {
    const format = String(doc.exportFormat || doc.format || 'pdf').toLowerCase();
    const filename = `${customName || doc.title || doc.type || 'document'}.${format}`;
    const sourceContent = getEditableContent(doc);
    const content = await documentExporter.exportToFormat(sourceContent, format);
    return {
      filename,
      content,
      contentType:
        format === 'pdf'
          ? 'application/pdf'
          : format === 'html'
            ? 'text/html'
            : 'text/plain',
    };
  }

  const upload = await uploadsRepo.getUpload(documentId);
  if (!upload || String(upload.userId) !== String(userId)) {
    throw new Error(`Document not found: ${documentId}`);
  }

  const safeTitle = upload.title.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = path.join(UPLOAD_DIR, `${upload.id}_${safeTitle}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Upload file missing: ${documentId}`);
  }

  return {
    filename: customName || upload.title,
    path: filePath,
    contentType: upload.fileType || 'application/octet-stream',
  };
}

async function buildDocumentAttachments(payload) {
  const userId = getCurrentUserId();
  const ids = [];

  if (payload.documentIds && Array.isArray(payload.documentIds)) {
    ids.push(...payload.documentIds);
  }
  if (payload.attachments && Array.isArray(payload.attachments)) {
    for (const item of payload.attachments) {
      if (typeof item === 'string') ids.push(item);
      else if (item?.sourceDocumentId) ids.push(item.sourceDocumentId);
      else if (item?.id) ids.push(item.id);
    }
  }

  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const list = [];
  for (const id of uniqueIds) {
    list.push(await resolveDocumentToAttachment(id, userId));
  }
  return list;
}

module.exports = { buildDocumentAttachments, resolveDocumentToAttachment };
