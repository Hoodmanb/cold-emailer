const attachmentsRepo = require('./repository');
const documentRepo = require('../../../repositories/documentRepository');
const uploadsRepo = require('../uploads/repository');
const { successResponse } = require('../../../utils/response');

const listAttachments = async (req, res) => {
  const userId = req.user?.id;
  const { parentId, parentType } = req.query;
  if (!parentId || !parentType) {
    const attachments = await attachmentsRepo.listAllForUser(userId);
    return res.status(200).json({ message: 'retrieved successfully', data: attachments });
  }
  const attachments = await attachmentsRepo.listAttachments(parentId, parentType, userId);
  return res.status(200).json({ message: 'retrieved successfully', data: attachments });
};

const createAttachment = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  const { sourceDocumentId, parentId, parentType, customName, title, type, format, fileUrl, source } =
    req.body || {};

  if (!parentId || !parentType) {
    return res.status(400).json({ message: 'parentId and parentType are required' });
  }

  let meta = { title, type, format, fileUrl, source };
  if (sourceDocumentId) {
    const docMeta = await documentRepo.getDocument(sourceDocumentId, userId);
    if (docMeta) {
      meta = {
        title: customName || docMeta.title || docMeta.type,
        type: docMeta.type,
        format: docMeta.format || docMeta.exportFormat || 'pdf',
        fileUrl: `/api/documents/${sourceDocumentId}/download`,
        source: 'ai_generated',
      };
    } else {
      const uploadMeta = await uploadsRepo.getUpload(sourceDocumentId);
      if (!uploadMeta || String(uploadMeta.userId) !== String(userId)) {
        return res.status(404).json({ message: 'Source document not found' });
      }
      meta = {
        title: customName || uploadMeta.title,
        type: uploadMeta.type || 'upload',
        format: uploadMeta.format || 'pdf',
        fileUrl: uploadMeta.fileUrl,
        source: 'user_upload',
      };
    }
  }

  const attachment = await attachmentsRepo.addAttachment({
    userId,
    sourceDocumentId,
    parentId,
    parentType,
    customName,
    ...meta,
  });

  return res.status(201).json({ message: 'attachment created successfully', data: attachment });
};

const deleteAttachment = async (req, res) => {
  const userId = req.user?.id;
  const removed = await attachmentsRepo.deleteAttachment(req.params.id, userId);
  if (!removed) return res.status(404).json({ message: 'Attachment not found' });
  return res.status(200).json({ message: 'deleted successfully' });
};

const auditConsistency = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });
  const { auditAttachmentReferences } = require('../../../services/dataConsistencyService');
  const report = await auditAttachmentReferences(userId);
  return successResponse(res, { message: 'Consistency audit completed', data: report });
};

const listDocumentLibrary = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  const aiDocs = (await documentRepo.listDocuments(undefined, userId)).map((doc) => ({
    id: doc.id,
    title: doc.title || doc.type || 'Untitled',
    type: doc.type || 'document',
    format: doc.format || doc.exportFormat || 'pdf',
    source: 'ai_generated',
    createdAt: doc.createdAt,
    fileUrl: `/api/documents/${doc.id}/download`,
    previewUrl: `/api/documents/${doc.id}/preview`,
  }));

  const uploads = (await uploadsRepo.listUploads(userId)).map((upload) => ({
    id: upload.id,
    title: upload.title,
    type: upload.type || 'upload',
    format: upload.format || 'txt',
    source: 'user_upload',
    createdAt: upload.createdAt,
    fileUrl: upload.fileUrl,
    previewUrl: `/api/documents/uploads/${upload.id}/preview`,
  }));

  const combined = [...aiDocs, ...uploads].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );

  return successResponse(res, { message: 'Document library retrieved', data: combined });
};

module.exports = {
  listAttachments,
  createAttachment,
  deleteAttachment,
  listDocumentLibrary,
  auditConsistency,
};
