const artifactRepo = require('../../repositories/artifactRepository');
const { toNodemailerAttachment } = require('../../utils/artifactNodemailer');
const { getCurrentUserId } = require('../../middleware/requestContext');

function assertArtifactOwnership(artifact, userId) {
  if (!artifact) throw new Error('Artifact not found');
  if (userId && artifact.userId && String(artifact.userId) !== String(userId)) {
    throw new Error('Not authorized to use this attachment');
  }
}

/**
 * Resolve payload fields into an array of Nodemailer attachment objects.
 * Supports: artifactId, artifactIds, attachment { artifactId }, attachments: [{ artifactId }].
 * Legacy raw attachment passthrough is rejected for security.
 */
async function buildMailAttachments(payload) {
  const list = [];
  const userId = getCurrentUserId();
  const { attachment, attachments, artifactId, artifactIds } = payload;

  if (artifactId) {
    const art = await artifactRepo.getArtifact(artifactId);
    assertArtifactOwnership(art, userId);
    list.push(toNodemailerAttachment(art));
  }

  if (artifactIds && Array.isArray(artifactIds)) {
    for (const id of artifactIds) {
      const art = await artifactRepo.getArtifact(id);
      assertArtifactOwnership(art, userId);
      list.push(toNodemailerAttachment(art));
    }
  }

  if (attachment) {
    if (attachment.artifactId) {
      const art = await artifactRepo.getArtifact(attachment.artifactId);
      assertArtifactOwnership(art, userId);
      list.push(toNodemailerAttachment(art));
    } else {
      throw new Error('Invalid attachment payload');
    }
  }

  if (attachments && Array.isArray(attachments)) {
    for (const a of attachments) {
      if (!a) continue;
      if (a.artifactId) {
        const art = await artifactRepo.getArtifact(a.artifactId);
        assertArtifactOwnership(art, userId);
        list.push(toNodemailerAttachment(art));
      } else if (typeof a === 'string') {
        // Document IDs resolved separately in emailService
        continue;
      } else if (a.sourceDocumentId) {
        continue;
      } else {
        throw new Error('Invalid attachment payload');
      }
    }
  }

  return list;
}

module.exports = { buildMailAttachments };
