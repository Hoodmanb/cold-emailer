const logger = require('../utils/logger');
const recipientRepo = require('../repositories/recipientRepository');
const templateRepo = require('../repositories/templateRepository');
const smtpRepo = require('../repositories/smtpRepository');
const { getCurrentUserId } = require('../middleware/requestContext');

/**
 * After a successful send, bump usage stats for learning / suggestions.
 * @param {{ to?: string, templateId?: string, smtpId?: string }} params
 */
async function recordSendContext(params) {
  const { to, templateId, smtpId } = params || {};
  try {
    if (to && typeof to === 'string') {
      const r = await recipientRepo.getRecipientByEmail(to);
      if (r) await recipientRepo.bumpRecipientUsage(r.id);
    }
    if (templateId && typeof templateId === 'string') {
      const userId = getCurrentUserId();
      await templateRepo.bumpTemplateUsage(templateId, userId);
    }
    if (smtpId && typeof smtpId === 'string') {
      await smtpRepo.recordSmtpLastUsed(smtpId);
    }
  } catch (err) {
    logger.warn('[contextUsage] recordSendContext skipped:', err.message);
  }
}

/**
 * @param {{ type: 'recipient'|'template'|'smtp', id?: string, email?: string }} body
 */
async function recordSelection(body) {
  const { type, id, email } = body || {};
  try {
    if (type === 'recipient') {
      if (id) await recipientRepo.bumpRecipientUsage(id);
      else if (email) {
        const r = await recipientRepo.getRecipientByEmail(email);
        if (r) await recipientRepo.bumpRecipientUsage(r.id);
      } else return { ok: false, message: 'recipient id or email required' };
      return { ok: true };
    }
    if (type === 'template' && id) {
      const userId = getCurrentUserId();
      await templateRepo.bumpTemplateUsage(id, userId);
      return { ok: true };
    }
    if (type === 'smtp' && id) {
      await smtpRepo.recordSmtpLastUsed(id);
      return { ok: true };
    }
    return { ok: false, message: 'Invalid track payload' };
  } catch (err) {
    logger.warn('[contextUsage] recordSelection:', err.message);
    return { ok: false, message: err.message };
  }
}

module.exports = { recordSendContext, recordSelection };
