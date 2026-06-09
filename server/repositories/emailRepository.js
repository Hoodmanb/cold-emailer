/**
 * Hardened Scoped Email Repository
 */
const BaseRepository = require('../infrastructure/db/BaseRepository');
const SCHEMAS = require('../shared/validators/schemas');
const { EMAIL_TRANSITIONS, TransitionService } = require('../shared/constants/transitions');

const FILE = 'emails.json';
const emailRepo = new BaseRepository(FILE, SCHEMAS.email);

const listEmails = ({ jobId, userId } = {}) => {
  const all = emailRepo.readAll(userId);
  return jobId ? all.filter((e) => String(e.jobId) === String(jobId)) : all;
};

const getEmail = (id, userId) => emailRepo.readById(id, userId);

const saveEmail = (emailData, userId) => {
  const payload = {
    jobId: null,
    to: '',
    subject: '',
    body: '',
    model: '',
    status: 'draft',
    editedManually: false,
    scores: { personalization: 0, relevance: 0, tone: 0 },
    sentAt: null,
    ...emailData,
  };
  return emailRepo.create(payload, userId);
};

const updateEmail = (id, updates, userId) => {
  const current = getEmail(id, userId);
  if (!current) throw new Error(`Email draft with ID '${id}' was not found.`);

  if (updates.status && updates.status !== current.status) {
    TransitionService.enforceTransition(id, current.status, updates.status, EMAIL_TRANSITIONS);
  }

  return emailRepo.update(id, updates, userId);
};

const approveEmail = (id, userId) => {
  const current = getEmail(id, userId);
  if (!current) throw new Error(`Email with ID '${id}' was not found.`);

  TransitionService.enforceTransition(id, current.status, 'approved', EMAIL_TRANSITIONS);

  return emailRepo.update(
    id,
    {
      status: 'approved',
      approvedAt: new Date().toISOString(),
    },
    userId,
  );
};

const markSent = (id, result, userId) => {
  const current = getEmail(id, userId);
  if (!current) throw new Error(`Email with ID '${id}' was not found.`);

  const targetStatus = result.success ? 'sent' : 'failed';
  TransitionService.enforceTransition(id, current.status, targetStatus, EMAIL_TRANSITIONS);

  return emailRepo.update(
    id,
    {
      status: targetStatus,
      sentAt: new Date().toISOString(),
      sendResult: result,
    },
    userId,
  );
};

const deleteEmail = (id, userId) => emailRepo.delete(id, userId);

module.exports = { listEmails, getEmail, saveEmail, updateEmail, approveEmail, markSent, deleteEmail };
