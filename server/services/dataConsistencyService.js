const attachmentsRepo = require('../modules/documents/attachments/repository');
const documentRepo = require('../repositories/documentRepository');
const uploadsRepo = require('../modules/documents/uploads/repository');
const scheduleRepo = require('../repositories/scheduleRepository');
const walletRepo = require('../repositories/walletRepository');
const { safeRead } = require('../db/jsonDb');

async function auditAttachmentReferences(userId) {
  const issues = [];
  let checked = 0;

  if (userId) {
    const attachments = attachmentsRepo.listAllForUser(userId);
    checked += attachments.length;
    for (const attachment of attachments) {
      if (!attachment.sourceDocumentId) continue;
      const doc = documentRepo.getDocument(attachment.sourceDocumentId, userId);
      if (doc) continue;
      const upload = await uploadsRepo.getUpload(attachment.sourceDocumentId, userId);
      if (!upload || String(upload.userId) !== String(userId)) {
        issues.push({
          type: 'orphaned_attachment',
          attachmentId: attachment.id,
          sourceDocumentId: attachment.sourceDocumentId,
          parentId: attachment.parentId,
          parentType: attachment.parentType,
        });
      }
    }
  }

  const raw = safeRead('attachments.json', { __scoped: true, users: {} });
  const users = raw.users && typeof raw.users === 'object' ? raw.users : {};
  const allAttachments = Object.values(users).flatMap((rows) => (Array.isArray(rows) ? rows : []));
  const attachmentIds = new Set(allAttachments.map((a) => a.id));
  const schedules = userId ? scheduleRepo.listSchedules(userId) : [];
  checked += schedules.length;
  for (const schedule of schedules) {
    const templateFields = ['template', 'templateOne', 'templateTwo', 'templateThree'];
    for (const field of templateFields) {
      const tmplId = schedule[field];
      if (tmplId && !attachmentIds.has(tmplId)) {
        issues.push({
          type: 'missing_template_attachment',
          scheduleId: schedule.id,
          field,
          attachmentId: tmplId,
        });
      }
    }
  }

  const wallets = walletRepo.readWalletList ? walletRepo.readWalletList() : [];
  const usersList = safeRead('users.json', []);
  const userIds = new Set(Array.isArray(usersList) ? usersList.map((u) => u.id) : []);
  checked += wallets.length;
  for (const wallet of wallets) {
    if (!userIds.has(wallet.user_id)) {
      issues.push({
        type: 'orphaned_wallet',
        walletId: wallet.id,
        userId: wallet.user_id,
      });
    }
  }

  return {
    checked,
    issueCount: issues.length,
    issues,
  };
}

async function audit(userId) {
  return auditAttachmentReferences(userId);
}

module.exports = { auditAttachmentReferences, audit };
