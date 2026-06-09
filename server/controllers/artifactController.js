const fs = require('fs');
const multer = require('multer');
const artifactRepo = require('../repositories/artifactRepository');
const { base64ToBuffer } = require('../utils/artifactBuffer');
const {
  resolveArtifactFilePath,
  isPreviewAllowedMime,
  safeContentDispositionFilename,
} = require('../utils/artifactSecurity');
const { requireUserId } = require('../utils/requireUserId');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const listArtifacts = (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const items = artifactRepo.listArtifacts(userId).map(artifactRepo.toPublic);
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createArtifact = (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'file is required (multipart field "file")',
      });
    }

    const record = artifactRepo.createArtifact({
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: artifactRepo.toPublic(record),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getArtifactMeta = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const art = artifactRepo.getArtifact(req.params.id, userId);
  if (!art || String(art.userId || "") !== String(userId)) {
    return res.status(404).json({ success: false, message: 'Artifact not found' });
  }
  return res.status(200).json({
    success: true,
    data: artifactRepo.toPublic(art),
  });
};

function pipeFileDownload(res, absPath, artifact, disposition) {
  const safeName = safeContentDispositionFilename(artifact.filename);
  res.setHeader('Content-Type', artifact.mimetype || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);

  const stream = fs.createReadStream(absPath);
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).end();
  });
  return stream.pipe(res);
}

const downloadArtifact = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const art = artifactRepo.getArtifact(req.params.id, userId);
  if (!art || String(art.userId || "") !== String(userId)) {
    return res.status(404).json({ success: false, message: 'Artifact not found' });
  }

  try {
    if (art.storageType === 'base64') {
      const safeName = safeContentDispositionFilename(art.filename);
      res.setHeader('Content-Type', art.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      return res.send(base64ToBuffer(art.base64Data));
    }
    if (art.storageType === 'file') {
      const abs = resolveArtifactFilePath(art);
      return pipeFileDownload(res, abs, art, 'attachment');
    }
    return res.status(500).json({ success: false, message: 'Invalid storage' });
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: err.message });
    }
    return undefined;
  }
};

const previewArtifact = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const art = artifactRepo.getArtifact(req.params.id, userId);
  if (!art || String(art.userId || "") !== String(userId)) {
    return res.status(404).json({ success: false, message: 'Artifact not found' });
  }

  if (!isPreviewAllowedMime(art.mimetype)) {
    return res.status(415).json({
      success: false,
      message: 'Preview not allowed for this file type',
    });
  }

  try {
    const safeName = safeContentDispositionFilename(art.filename);
    res.setHeader('Content-Type', art.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

    if (art.storageType === 'base64') {
      return res.send(base64ToBuffer(art.base64Data));
    }
    if (art.storageType === 'file') {
      const abs = resolveArtifactFilePath(art);
      const stream = fs.createReadStream(abs);
      stream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
      return stream.pipe(res);
    }
    return res.status(500).end();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: err.message });
    }
    return undefined;
  }
};

module.exports = {
  listArtifacts,
  createArtifact,
  getArtifactMeta,
  downloadArtifact,
  previewArtifact,
  upload,
};
