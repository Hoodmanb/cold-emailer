const { base64ToBuffer } = require('./artifactBuffer');
const { resolveArtifactFilePath } = require('./artifactSecurity');

/**
 * Build a Nodemailer attachment from a persisted artifact row (includes base64 or file path).
 * @param {object} artifact
 */
function toNodemailerAttachment(artifact) {
  if (!artifact) {
    throw new Error('Artifact not found');
  }

  if (artifact.storageType === 'base64') {
    return {
      filename: artifact.filename,
      content: base64ToBuffer(artifact.base64Data),
      contentType: artifact.mimetype,
    };
  }

  if (artifact.storageType === 'file') {
    return {
      filename: artifact.filename,
      path: resolveArtifactFilePath(artifact),
      contentType: artifact.mimetype,
    };
  }

  throw new Error('Invalid artifact storage');
}

module.exports = { toNodemailerAttachment };
