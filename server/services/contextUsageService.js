const logger = require('../utils/logger');
const recipientRepo = require('../repositories/recipientRepository');
const templateRepo = require('../repositories/templateRepository');
const smtpRepo = require('../repositories/smtpRepository');

/**
 * After a successful send, bump usage stats for learning / suggestions.
 * @param {{ to?: string, templateId?: string, smtpId?: string }} params
 */
function recordSendContext(params) {
  const { to, templateId, smtpId } = params || {};
  try {
    if (to && typeof to === 'string') {
      const r = recipientRepo.getRecipientByEmail(to);
      if (r) recipientRepo.bumpRecipientUsage(r.id);
    }
    if (templateId && typeof templateId === 'string') {
      templateRepo.bumpTemplateUsage(templateId);
    }
    if (smtpId && typeof smtpId === 'string') {
      smtpRepo.recordSmtpLastUsed(smtpId);
    }
  } catch (err) {
    logger.warn('[contextUsage] recordSendContext skipped:', err.message);
  }
}

/**
 * @param {{ type: 'recipient'|'template'|'smtp', id?: string, email?: string }} body
 */
function recordSelection(body) {
  const { type, id, email } = body || {};
  try {
    if (type === 'recipient') {
      if (id) recipientRepo.bumpRecipientUsage(id);
      else if (email) {
        const r = recipientRepo.getRecipientByEmail(email);
        if (r) recipientRepo.bumpRecipientUsage(r.id);
      } else return { ok: false, message: 'recipient id or email required' };
      return { ok: true };
    }
    if (type === 'template' && id) {
      templateRepo.bumpTemplateUsage(id);
      return { ok: true };
    }
    if (type === 'smtp' && id) {
      smtpRepo.recordSmtpLastUsed(id);
      return { ok: true };
    }
    return { ok: false, message: 'Invalid track payload' };
  } catch (err) {
    logger.warn('[contextUsage] recordSelection:', err.message);
    return { ok: false, message: err.message };
  }
}

module.exports = { recordSendContext, recordSelection };
