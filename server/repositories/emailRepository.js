const fileStore = require("../utils/fileStore");
const { v4: uuidv4 } = require('uuid');

const FILE = 'emails.json';

/**
 * Email statuses: 'draft' | 'approved' | 'sending' | 'sent' | 'failed'
 */

const listEmails = ({ jobId } = {}) =>
  fileStore.readWhere(FILE, jobId ? (e) => String(e.jobId) === String(jobId) : null);

const getEmail = (id) => listEmails().find((e) => String(e.id) === String(id)) || null;

const saveEmail = (emailData) => {
  const email = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    jobId: null,
    to: '',
    subject: '',
    body: '',
    model: '',
    status: 'draft', // DRAFT MODE: all AI emails start as drafts
    editedManually: false,
    scores: { personalization: 0, relevance: 0, tone: 0 },
    sentAt: null,
    ...emailData,
  };
  return fileStore.append(FILE, email);
};

const updateEmail = (id, updates) =>
  fileStore.update(FILE, (e) => e.id === id, () => ({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));

const approveEmail = (id) =>
  fileStore.update(FILE, (e) => e.id === id, () => ({
    status: 'approved',
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

const markSent = (id, result) =>
  fileStore.update(FILE, (e) => e.id === id, () => ({
    status: result.success ? 'sent' : 'failed',
    sentAt: new Date().toISOString(),
    sendResult: result,
    updatedAt: new Date().toISOString(),
  }));

const deleteEmail = (id) => fileStore.remove(FILE, (e) => e.id === id);

module.exports = { listEmails, getEmail, saveEmail, updateEmail, approveEmail, markSent, deleteEmail };
