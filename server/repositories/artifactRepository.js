const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_RELATIVE } = require('../utils/artifactSecurity');
const fileStore = require("../utils/fileStore");

const FILE = 'artifacts.json';
const MAX_INLINE_BYTES = 500 * 1024;

function ensureUploadDir(absDir) {
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }
}

/**
 * @param {{ buffer: Buffer, filename?: string, mimetype?: string, userId?: string }} input
 */
function createArtifact(input) {
  const { buffer, filename, mimetype, userId } = input;
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('buffer is required');
  }

  const id = uuidv4();
  const ext = path.extname(filename || '') || '';
  const storedFileName = `${id}${ext}`;

  const serverRoot = path.resolve(__dirname, '..');
  const absUploadDir = path.join(serverRoot, UPLOAD_RELATIVE);

  /** @type {'base64' | 'file'} */
  let storageType;
  /** @type {string | null} */
  let base64Data = null;
  /** @type {string | null} */
  let filePath = null;

  if (buffer.length <= MAX_INLINE_BYTES) {
    storageType = 'base64';
    base64Data = buffer.toString('base64');
  } else {
    storageType = 'file';
    ensureUploadDir(absUploadDir);
    const absFile = path.join(absUploadDir, storedFileName);
    fs.writeFileSync(absFile, buffer);
    filePath = path.join(UPLOAD_RELATIVE, storedFileName).replace(/\\/g, '/');
  }

  const record = {
    id,
    userId: String(userId || ""),
    filename: filename || 'file',
    mimetype: mimetype || 'application/octet-stream',
    storageType,
    size: buffer.length,
    createdAt: new Date().toISOString(),
    ...(storageType === 'base64' ? { base64Data } : { filePath }),
  };

  fileStore.append(FILE, record);
  return record;
}

function getArtifact(id) {
  const artifacts = listArtifacts()
  const artifact = artifacts.find((a) => String(a.id) === String(id)) || null;
  return artifact
}

function listArtifacts() {
  return fileStore.read(FILE);
}

/**
 * Strip heavy fields for API list/detail responses.
 */
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
