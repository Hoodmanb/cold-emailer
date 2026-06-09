const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const repository = require('./repository');
const attachmentsRepo = require('../attachments/repository');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../storage/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// POST /api/documents/uploads
const uploadFile = (req, res) => {
  upload.single('file')(req, res, async err => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload error' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }
    const id = uuidv4();
    const safeName = `${id}_${path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const finalPath = path.join(uploadDir, safeName);
    // Move file to final name
    fs.renameSync(req.file.path, finalPath);
    // const metadata = {
    //   id,
    //   userId,
    //   title: req.file.originalname,
    //   fileUrl: `/api/documents/uploads/${id}/download`,
    //   fileType: req.file.mimetype,
    //   size: req.file.size,
    //   source: 'user_upload',
    //   createdAt: new Date().toISOString(),
    // };

    // ---- Normalise metadata to the unified document schema ----
    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    const formatMap = { pdf: 'pdf', docx: 'docx', txt: 'txt' };
    const inferredFormat = formatMap[ext] || 'txt';

    // Very simple auto‑detection of the document “type” – reuse the same logic the UI uses
    const name = req.file.originalname.toLowerCase();
    const inferredType =
      name.includes('resume') ? 'resume' :
        name.includes('cv') || name.includes('professional-cv') ? 'professional-cv' :
          name.includes('cover') ? 'cover-letter' :
            name.includes('email') ? 'email' :
              '';   // empty → UI will fallback to “resume” later

    const metadata = {
      id,
      userId,
      title: req.file.originalname,
      fileUrl: `/api/documents/uploads/${id}/download`,
      // Unified fields
      format: inferredFormat,          // <-- NEW
      type: inferredType,              // <-- NEW
      // Keep the raw MIME for fallback if you need it
      fileType: req.file.mimetype,    // (optional, keep for debugging)
      size: req.file.size,
      source: 'user_upload',
      createdAt: new Date().toISOString(),
    };
    await repository.addUpload(metadata);
    return res.status(201).json({ message: 'File uploaded', data: metadata });
  });
};

// GET /api/documents/uploads
const listUploads = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
  const uploads = await repository.listUploads(userId);
  return res.status(200).json({ message: 'Retrieved', data: uploads });
};

// DELETE /api/documents/uploads/:id
const deleteUpload = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
  const { id } = req.params;
  const record = await repository.getUpload(id);
  if (!record) {
    return res.status(404).json({ message: 'File not found' });
  }
  if (record.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  // Block deletion if there are attachments referencing this document
  if (attachmentsRepo.isDocumentReferenced(id)) {
    return res.status(409).json({ message: 'Document is referenced by attachments and cannot be deleted' });
  }
  const filePath = path.join(uploadDir, `${record.id}_${record.title.replace(/[^a-zA-Z0-9._-]/g, '')}`);
  // Delete the physical file if it exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  await repository.deleteUpload(id, userId);
  return res.status(200).json({ message: 'File deleted' });
};

// Download an uploaded document
const previewUpload = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
  const { id } = req.params;
  const record = await repository.getUpload(id);
  if (!record) {
    return res.status(404).json({ message: 'File not found' });
  }
  if (record.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const filePath = path.join(uploadDir, `${record.id}_${record.title.replace(/[^a-zA-Z0-9._-]/g, '')}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  // Set inline disposition for preview
  res.setHeader('Content-Type', record.fileType || 'application/octet-stream');
  res.setHeader('Content-Disposition', 'inline');
  return res.sendFile(filePath);
};
// Download an uploaded document (force download)
const downloadUpload = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
  const { id } = req.params;
  const record = await repository.getUpload(id);
  if (!record) {
    return res.status(404).json({ message: 'File not found' });
  }
  if (record.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const filePath = path.join(uploadDir, `${record.id}_${record.title.replace(/[^a-zA-Z0-9._-]/g, '')}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  // Force download with appropriate headers
  res.setHeader('Content-Type', record.fileType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${record.title}"`);
  return res.sendFile(filePath);
};
module.exports = { uploadFile, listUploads, deleteUpload, downloadUpload, previewUpload };
