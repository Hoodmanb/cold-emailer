const attachmentsRepo = require('../modules/documents/attachments/repository');
const documentRepo = require('../repositories/documentRepository');
const uploadsRepo = require('../modules/documents/uploads/repository');
const scheduleRepo = require('../repositories/scheduleRepository');
const walletRepo = require('../repositories/walletRepository');
const Supabase = require('../services/supabaseService');
const logger = require('../utils/logger');

async function auditAttachmentReferences(userId) {
  try {
    const issues = [];
    let checked = 0;

    if (userId) {
      const attachments = await attachmentsRepo.listAllForUser(userId);
      checked += attachments.length;
      for (const attachment of attachments) {
        if (!attachment.sourceDocumentId) continue;
        const doc = await documentRepo.getDocument(attachment.sourceDocumentId, userId);
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

    const { data: allAttachments, error: attErr } = await Supabase.selectAll('attachments');
    if (attErr) throw attErr;
    const attachmentIds = new Set((allAttachments || []).map((a) => a.id));
    const schedules = userId ? await scheduleRepo.listSchedules(userId) : [];
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

    let wallets = [];
    try {
      wallets = walletRepo.readWalletList ? await walletRepo.readWalletList() : [];
    } catch (e) {
      logger.error('Failed to read wallets for data consistency audit', { error: e });
    }

    const { data: usersList, error: userErr } = await Supabase.selectAll('users');
    if (userErr) throw userErr;
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

    return { checked, issueCount: issues.length, issues };
  } catch (err) {
    logger.error('Unexpected error during data consistency audit', { error: err });
    return { checked: 0, issueCount: 0, issues: [] };
  }
}

async function audit(userId) {
  return auditAttachmentReferences(userId);
}

module.exports = { auditAttachmentReferences, audit };
