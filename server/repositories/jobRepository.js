const fileStore = require("../utils/fileStore")
const { v4: uuidv4 } = require('uuid');

const FILE = 'jobs.json';

const listJobs = () => fileStore.read(FILE);

const getJob = (id) => listJobs().find((j) => String(j.id) === String(id)) || null;

const createJob = (jobData) => {
  const job = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: '',
    company: '',
    location: '',
    type: '',
    rawDescription: '',
    parsedData: {},
    atsScore: null,
    linkedDocuments: [],
    linkedEmails: [],
    status: 'active',
    ...jobData,
  };
  return fileStore.append(FILE, job);
};

const updateJob = (id, updates) =>
  fileStore.update(FILE, (j) => j.id === id, () => ({ ...updates, updatedAt: new Date().toISOString() }));

const deleteJob = (id) => fileStore.remove(FILE, (j) => j.id === id);

const linkDocument = (jobId, documentId) =>
  fileStore.update(FILE, (j) => j.id === jobId, (j) => ({
    linkedDocuments: [...new Set([...(Array.isArray(j.linkedDocuments) ? j.linkedDocuments : []), documentId])],
  }));

const linkEmail = (jobId, emailId) =>
  fileStore.update(FILE, (j) => j.id === jobId, (j) => ({
    linkedEmails: [...new Set([...(Array.isArray(j.linkedEmails) ? j.linkedEmails : []), emailId])],
  }));

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, linkDocument, linkEmail };
