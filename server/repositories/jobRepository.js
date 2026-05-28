/**
 * Hardened Job Repository
 * Enforces schema validations on raw/parsed job details.
 */
const BaseRepository = require('../infrastructure/db/BaseRepository');
const SCHEMAS = require('../shared/validators/schemas');
const fileStore = require('../utils/fileStore');

const FILE = 'jobs.json';
const jobRepo = new BaseRepository(FILE, SCHEMAS.job);

const listJobs = () => jobRepo.readAll();

const getJob = (id) => jobRepo.readById(id);

const createJob = (jobData) => {
  const payload = {
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
  return jobRepo.create(payload);
};

const updateJob = (id, updates) => jobRepo.update(id, updates);

const deleteJob = (id) => jobRepo.delete(id);

const linkDocument = (jobId, documentId) =>
  fileStore.update(FILE, (j) => j.id === jobId, (j) => ({
    linkedDocuments: [...new Set([...(Array.isArray(j.linkedDocuments) ? j.linkedDocuments : []), documentId])],
  }));

const linkEmail = (jobId, emailId) =>
  fileStore.update(FILE, (j) => j.id === jobId, (j) => ({
    linkedEmails: [...new Set([...(Array.isArray(j.linkedEmails) ? j.linkedEmails : []), emailId])],
  }));

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, linkDocument, linkEmail };
