const path = require('path');
const fs = require('fs');

const UPLOAD_RELATIVE = path.join('storage', 'uploads', 'artifacts');

/**
 * Resolve stored relative path to absolute path under uploads/artifacts only.
 * @param {{ storageType: string, filePath?: string }} artifact
 */
function resolveArtifactFilePath(artifact) {
  if (!artifact || artifact.storageType !== 'file' || !artifact.filePath) {
    throw new Error('Not a file-backed artifact');
  }

  const serverRoot = path.resolve(__dirname, '..');
  const normalizedRelative = artifact.filePath.replace(/\\/g, '/');
  const resolved = path.resolve(serverRoot, ...normalizedRelative.split('/'));

  const allowedRoot = path.resolve(serverRoot, UPLOAD_RELATIVE);
  const prefix = allowedRoot.endsWith(path.sep) ? allowedRoot : allowedRoot + path.sep;

  if (!resolved.startsWith(prefix)) {
    throw new Error('Path traversal blocked');
  }

  if (!fs.existsSync(resolved)) {
    throw new Error('Artifact file missing');
  }

  return resolved;
}

function isPreviewAllowedMime(mimetype) {
  if (!mimetype || typeof mimetype !== 'string') return false;
  if (mimetype === 'application/pdf') return true;
  if (mimetype.startsWith('image/')) return true;
  return false;
}

function safeContentDispositionFilename(name) {
  return String(name || 'file')
    .replace(/[/\\]/g, '_')
    .replace(/"/g, "'")
    .slice(0, 200);
}

module.exports = {
  resolveArtifactFilePath,
  isPreviewAllowedMime,
  safeContentDispositionFilename,
  UPLOAD_RELATIVE,
};
