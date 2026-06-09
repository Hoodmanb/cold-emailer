/**
 * Hardened Job Repository
 * Enforces schema validations on raw/parsed job details.
 */
const BaseRepository = require('../infrastructure/db/BaseRepository');
const SCHEMAS = require('../shared/validators/schemas');
const fileStore = require('../utils/fileStore');

const FILE = 'jobs.json';
const jobRepo = new BaseRepository(FILE, SCHEMAS.job);

const listJobs = (userId) => jobRepo.readAll(userId);

const getJob = (id, userId) => jobRepo.readById(id, userId);

const createJob = (jobData, userId) => {
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
  return jobRepo.create(payload, userId);
};

const updateJob = (id, updates, userId) => jobRepo.update(id, updates, userId);

const deleteJob = (id, userId) => jobRepo.delete(id, userId);

const linkDocument = (jobId, documentId, userId) =>
  fileStore.update(
    FILE,
    (j) => j.id === jobId,
    (j) => ({
      linkedDocuments: [
        ...new Set([...(Array.isArray(j.linkedDocuments) ? j.linkedDocuments : []), documentId]),
      ],
    }),
    userId,
  );

const linkEmail = (jobId, emailId, userId) =>
  fileStore.update(
    FILE,
    (j) => j.id === jobId,
    (j) => ({
      linkedEmails: [
        ...new Set([...(Array.isArray(j.linkedEmails) ? j.linkedEmails : []), emailId]),
      ],
    }),
    userId,
  );

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, linkDocument, linkEmail };
