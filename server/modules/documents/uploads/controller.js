const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const repository = require('./repository');
const attachmentsRepo = require('../attachments/repository');
const { uploadBuffer, deleteAsset } = require('../../../utils/cloudinaryClient');

const upload = multer({
  storage: multer.memoryStorage(),
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

function sanitizeBaseName(fileName) {
  const parsed = path.parse(fileName || 'document');
  return (parsed.name || 'document').replace(/[^a-zA-Z0-9_-]/g, '') || 'document';
}

function safeHeaderFilename(fileName) {
  return String(fileName || 'document')
    .replace(/[/\\]/g, '_')
    .replace(/"/g, "'")
    .slice(0, 200);
}

function withFormatExtension(title, format) {
  const safeTitle = String(title || 'document');
  if (!format) return safeTitle;
  return safeTitle.toLowerCase().endsWith(`.${format}`) ? safeTitle : `${safeTitle}.${format}`;
}

async function streamUpload(record, res, { inline = false } = {}) {
  if (!record.url) {
    return res.status(404).json({ message: 'File not found' });
  }

  const upstream = await axios.get(record.url, { responseType: 'stream' });
  const contentType = record.fileType || upstream.headers['content-type'] || 'application/octet-stream';
  const filename = safeHeaderFilename(withFormatExtension(record.title, record.format));
  const disposition = inline ? 'inline' : `attachment; filename="${filename}"`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', inline ? `${disposition}; filename="${filename}"` : disposition);
  upstream.data.on('error', (error) => res.destroy(error));
  return upstream.data.pipe(res);
}

// POST /api/documents/uploads
const uploadFile = (req, res, next) => {
  upload.single('file')(req, res, async err => {
    try {
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
      const publicId = `${id}_${sanitizeBaseName(req.file.originalname)}`;

      // ---- Normalise metadata to the unified document schema ----
      const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
      const formatMap = { pdf: 'pdf', docx: 'docx', txt: 'txt' };
      const inferredFormat = formatMap[ext] || 'txt';

      console.log("process.env.CLOUDINARY_UPLOAD_FOLDER", process.env.CLOUDINARY_UPLOAD_FOLDER)
      console.log("process.env.CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME)
      console.log("process.env.CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY)
      console.log("process.env.CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET)

      const cloudinaryResult = await uploadBuffer(req.file.buffer, {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'job_bot',
        public_id: publicId,
      });

      // Very simple auto-detection of the document type - reuse the same logic the UI uses
      const name = req.file.originalname.toLowerCase();
      const inferredType =
        name.includes('resume') ? 'resume' :
          name.includes('cv') || name.includes('professional-cv') ? 'professional-cv' :
            name.includes('cover') ? 'cover-letter' :
              name.includes('email') ? 'email' :
                '';   // empty -> UI will fallback to "resume" later

      const metadata = {
        id,
        userId,
        publicId: cloudinaryResult.public_id,
        title: req.file.originalname,
        fileUrl: `/api/documents/uploads/${id}/download`,
        previewUrl: `/api/documents/uploads/${id}/preview`,
        url: cloudinaryResult.secure_url || cloudinaryResult.url,
        // Unified fields
        format: inferredFormat,
        type: inferredType,
        // Keep the raw MIME for fallback if you need it
        fileType: req.file.mimetype,
        size: req.file.size,
        bytes: cloudinaryResult.bytes || req.file.size,
        resourceType: cloudinaryResult.resource_type || 'raw',
        source: 'user_upload',
        createdAt: new Date().toISOString(),
      };
      const saved = await repository.addUpload(metadata);
      return res.status(201).json({ message: 'File uploaded', data: { ...saved, type: inferredType } });
    } catch (error) {
      console.error('⚠️ Upload controller error:', error);
      return next(error);
    }
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
const deleteUpload = async (req, res, next) => {
  try {
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
    if (await attachmentsRepo.isDocumentReferenced(id)) {
      return res.status(409).json({ message: 'Document is referenced by attachments and cannot be deleted' });
    }
    await deleteAsset(record.publicId, record.resourceType || 'raw');
    await repository.deleteUpload(id, userId);
    return res.status(200).json({ message: 'File deleted' });
  } catch (error) {
    return next(error);
  }
};

// Download an uploaded document
const previewUpload = async (req, res, next) => {
  try {
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
    return streamUpload(record, res, { inline: true });
  } catch (error) {
    return next(error);
  }
};
// Download an uploaded document (force download)
const downloadUpload = async (req, res, next) => {
  try {
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
    return streamUpload(record, res, { inline: false });
  } catch (error) {
    return next(error);
  }
};
module.exports = { uploadFile, listUploads, deleteUpload, downloadUpload, previewUpload };
