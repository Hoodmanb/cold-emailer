const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_RELATIVE } = require('../utils/artifactSecurity');
const fileStore = require('../utils/fileStore');

const FILE = 'artifacts.json';
const MAX_INLINE_BYTES = 500 * 1024;

function ensureUploadDir(absDir) {
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }
}

function createArtifact(input) {
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
  let filePathRel = null;

  if (buffer.length <= MAX_INLINE_BYTES) {
    storageType = 'base64';
    base64Data = buffer.toString('base64');
  } else {
    storageType = 'file';
    ensureUploadDir(absUploadDir);
    const absFile = path.join(absUploadDir, storedFileName);
    fs.writeFileSync(absFile, buffer);
    filePathRel = path.join(UPLOAD_RELATIVE, storedFileName).replace(/\\/g, '/');
  }

  const record = {
    id,
    userId: String(userId),
    filename: filename || 'file',
    mimetype: mimetype || 'application/octet-stream',
    storageType,
    size: buffer.length,
    createdAt: new Date().toISOString(),
    ...(storageType === 'base64' ? { base64Data } : { filePath: filePathRel }),
  };

  fileStore.append(FILE, record, userId);
  return record;
}

function listArtifacts(userId) {
  return ensureArray(fileStore.read(FILE, userId));
}

function getArtifact(id, userId) {
  return listArtifacts(userId).find((a) => String(a.id) === String(id)) || null;
}

function ensureArray(data) {
  return Array.isArray(data) ? data : [];
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
