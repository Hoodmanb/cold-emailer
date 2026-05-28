/**
 * Hardened Scoped Email Repository
 * Wraps base persistence with strict FSM transition assertions
 * and request structure schema validation.
 */
const BaseRepository = require('../infrastructure/db/BaseRepository');
const SCHEMAS = require('../shared/validators/schemas');
const { EMAIL_TRANSITIONS, TransitionService } = require('../shared/constants/transitions');

const FILE = 'emails.json';
const emailRepo = new BaseRepository(FILE, SCHEMAS.email);

const listEmails = ({ jobId } = {}) => {
  const all = emailRepo.readAll();
  return jobId ? all.filter((e) => String(e.jobId) === String(jobId)) : all;
};

const getEmail = (id) => emailRepo.readById(id);

const saveEmail = (emailData) => {
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
  return emailRepo.create(payload);
};

const updateEmail = (id, updates) => {
  const current = getEmail(id);
  if (!current) throw new Error(`Email draft with ID '${id}' was not found.`);

  // Enforce central Finite State Machine validation if status mutation is requested
  if (updates.status && updates.status !== current.status) {
    TransitionService.enforceTransition(id, current.status, updates.status, EMAIL_TRANSITIONS);
  }

  return emailRepo.update(id, updates);
};

const approveEmail = (id) => {
  const current = getEmail(id);
  if (!current) throw new Error(`Email with ID '${id}' was not found.`);

  TransitionService.enforceTransition(id, current.status, 'approved', EMAIL_TRANSITIONS);

  return emailRepo.update(id, {
    status: 'approved',
    approvedAt: new Date().toISOString(),
  });
};

const markSent = (id, result) => {
  const current = getEmail(id);
  if (!current) throw new Error(`Email with ID '${id}' was not found.`);

  const targetStatus = result.success ? 'sent' : 'failed';
  TransitionService.enforceTransition(id, current.status, targetStatus, EMAIL_TRANSITIONS);

  return emailRepo.update(id, {
    status: targetStatus,
    sentAt: new Date().toISOString(),
    sendResult: result,
  });
};

const deleteEmail = (id) => emailRepo.delete(id);

module.exports = { listEmails, getEmail, saveEmail, updateEmail, approveEmail, markSent, deleteEmail };
