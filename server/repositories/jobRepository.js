const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const SCHEMAS = require('../shared/validators/schemas');

const TABLE = 'jobs';

function fromRow(row) {
  if (!row) return null;
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  return {
    ...payload,
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id || payload.projectId,
    status: row.status || payload.status || 'active',
    createdAt: row.created_at || payload.createdAt,
    updatedAt: row.updated_at || payload.updatedAt,
  };
}

function toRow(job, userId) {
  const now = new Date().toISOString();
  const {
    id,
    userId: uid,
    user_id,
    projectId,
    project_id,
    status,
    createdAt,
    updatedAt,
    ...rest
  } = job;
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id,
    project_id: projectId || project_id || null,
    status: status || 'active',
    payload: {
      ...rest,
      status: status || 'active',
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

const listJobs = async (userId) => {
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
};

const getJob = async (id, userId) => {
  const { data, error } = await Supabase.selectOne(TABLE, { id }, userId);
  if (error) throw error;
  return fromRow(data);
};

const createJob = async (jobData, userId) => {
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
  SCHEMAS.job.validate(payload);
  const row = toRow(payload, userId);
  const { data, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(data?.[0] || row);
};

const updateJob = async (id, updates, userId) => {
  const current = await getJob(id, userId);
  if (!current) throw new Error(`Record with ID '${id}' was not found in jobs.`);
  const merged = { ...current, ...updates };
  SCHEMAS.job.validate(merged);
  const row = toRow(merged, userId);
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    {
      status: row.status,
      project_id: row.project_id,
      payload: row.payload,
      updated_at: new Date().toISOString(),
    },
    userId,
  );
  if (error) throw error;
  return fromRow(data[0] || row);
};

const deleteJob = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

const linkDocument = async (jobId, documentId, userId) => {
  const job = await getJob(jobId, userId);
  if (!job) return null;
  const linkedDocuments = [
    ...new Set([...(Array.isArray(job.linkedDocuments) ? job.linkedDocuments : []), documentId]),
  ];
  return updateJob(jobId, { linkedDocuments }, userId);
};

const linkEmail = async (jobId, emailId, userId) => {
  const job = await getJob(jobId, userId);
  if (!job) return null;
  const linkedEmails = [
    ...new Set([...(Array.isArray(job.linkedEmails) ? job.linkedEmails : []), emailId]),
  ];
  return updateJob(jobId, { linkedEmails }, userId);
};

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, linkDocument, linkEmail };
