const artifactRepo = require('../../repositories/artifactRepository');
const { toNodemailerAttachment } = require('../../utils/artifactNodemailer');

/**
 * Resolve payload fields into an array of Nodemailer attachment objects.
 * Supports: artifactId, artifactIds, attachment { artifactId }, attachments: [{ artifactId }], legacy raw attachments.
 * @param {object} payload
 * @returns {object[]}
 */
function buildMailAttachments(payload) {
  const list = [];
  const { attachment, attachments, artifactId, artifactIds } = payload;

  if (artifactId) {
    const art = artifactRepo.getArtifact(artifactId);
    if (!art) throw new Error(`Artifact not found: ${artifactId}`);
    list.push(toNodemailerAttachment(art));
  }

  if (artifactIds && Array.isArray(artifactIds)) {
    for (const id of artifactIds) {
      const art = artifactRepo.getArtifact(id);
      if (!art) throw new Error(`Artifact not found: ${id}`);
      list.push(toNodemailerAttachment(art));
    }
  }

  if (attachment) {
    if (attachment.artifactId) {
      const art = artifactRepo.getArtifact(attachment.artifactId);
      if (!art) throw new Error(`Artifact not found: ${attachment.artifactId}`);
      list.push(toNodemailerAttachment(art));
    } else {
      list.push(attachment);
    }
  }

  if (attachments && Array.isArray(attachments)) {
    for (const a of attachments) {
      if (!a) continue;
      if (a.artifactId) {
        const art = artifactRepo.getArtifact(a.artifactId);
        if (!art) throw new Error(`Artifact not found: ${a.artifactId}`);
        list.push(toNodemailerAttachment(art));
      } else {
        list.push(a);
      }
    }
  }

  return list;
}

module.exports = { buildMailAttachments };
