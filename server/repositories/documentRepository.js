const { v4: uuidv4 } = require('uuid');
const fileStore = require("../utils/fileStore")

const FILE = 'documents.json';

/**
 * Document types: 'resume' | 'cover-letter'
 * Statuses: 'draft' | 'approved' | 'archived'
 */

const listDocuments = (jobId) =>
  fileStore.readWhere(FILE, jobId ? (d) => String(d.jobId) === String(jobId) : null);

// const getDocument = (id) => findOne(FILE, (d) => d.id === id);
const getDocument = (id) => listDocuments().find((d) => String(d.id) === String(id)) || null;

const saveDocument = (docData) => {
  const doc = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    jobId: null,
    type: 'resume', // 'resume' | 'cover-letter'
    content: '',
    model: '',
    status: 'draft', // DRAFT MODE: all AI output starts as draft
    editedManually: false,
    ...docData,
  };
  return fileStore.append(FILE, doc);
};

const updateDocument = (id, updates) =>
  fileStore.update(FILE, (d) => d.id === id, () => ({
    ...updates,
    updatedAt: new Date().toISOString(),
    editedManually: updates.content !== undefined ? true : undefined,
  }));

const approveDocument = (id) =>
  fileStore.update(FILE, (d) => d.id === id, () => ({
    status: 'approved',
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

const deleteDocument = (id) => fileStore.remove(FILE, (d) => d.id === id);

module.exports = {
  listDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  approveDocument,
  deleteDocument,
};
