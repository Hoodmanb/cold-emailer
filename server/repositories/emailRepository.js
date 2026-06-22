const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const SCHEMAS = require('../shared/validators/schemas');
const { EMAIL_TRANSITIONS, TransitionService } = require('../shared/constants/transitions');

const TABLE = 'emails';

function fromRow(row) {
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    ...meta,
    id: row.id,
    userId: row.user_id,
    to: row.to_email || meta.to || '',
    subject: row.subject || meta.subject || '',
    body: row.body || meta.body || '',
    sentAt: row.sent_at || meta.sentAt || null,
    createdAt: row.created_at || meta.createdAt,
    updatedAt: row.updated_at || meta.updatedAt,
  };
}

function toRow(email, userId) {
  const now = new Date().toISOString();
  const {
    id,
    userId: uid,
    user_id,
    to,
    subject,
    body,
    sentAt,
    createdAt,
    updatedAt,
    ...rest
  } = email;
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id,
    to_email: to || rest.to || '',
    subject: subject || '',
    body: body || '',
    sent_at: sentAt || null,
    metadata: {
      ...rest,
      to: to || rest.to,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

const listEmails = async ({ jobId, userId } = {}) => {
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  const all = (data || []).map(fromRow);
  return jobId ? all.filter((e) => String(e.jobId) === String(jobId)) : all;
};

const getEmail = async (id, userId) => {
  const { data, error } = await Supabase.selectOne(TABLE, { id }, userId);
  if (error) throw error;
  return fromRow(data);
};

const saveEmail = async (emailData, userId) => {
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
  SCHEMAS.email?.validate?.(payload);
  const row = toRow(payload, userId);
  const { data, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(data?.[0] || row);
};

const updateEmail = async (id, updates, userId) => {
  const current = await getEmail(id, userId);
  if (!current) throw new Error(`Email draft with ID '${id}' was not found.`);

  if (updates.status && updates.status !== current.status) {
    TransitionService.enforceTransition(id, current.status, updates.status, EMAIL_TRANSITIONS);
  }

  return updateEmailRecord(id, updates, userId, current);
};

async function updateEmailRecord(id, updates, userId, current) {
  const merged = { ...current, ...updates };
  const row = toRow(merged, userId);
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    {
      to_email: row.to_email,
      subject: row.subject,
      body: row.body,
      sent_at: row.sent_at,
      metadata: row.metadata,
      updated_at: new Date().toISOString(),
    },
    userId,
  );
  if (error) throw error;
  return fromRow(data[0] || row);
}

const approveEmail = async (id, userId) => {
  const current = await getEmail(id, userId);
  if (!current) throw new Error(`Email with ID '${id}' was not found.`);
  TransitionService.enforceTransition(id, current.status, 'approved', EMAIL_TRANSITIONS);
  return updateEmailRecord(
    id,
    { status: 'approved', approvedAt: new Date().toISOString() },
    userId,
    current,
  );
};

const markSent = async (id, result, userId) => {
  const current = await getEmail(id, userId);
  if (!current) throw new Error(`Email with ID '${id}' was not found.`);
  const targetStatus = result.success ? 'sent' : 'failed';
  TransitionService.enforceTransition(id, current.status, targetStatus, EMAIL_TRANSITIONS);
  return updateEmailRecord(
    id,
    {
      status: targetStatus,
      sentAt: new Date().toISOString(),
      sendResult: result,
    },
    userId,
    current,
  );
};

const deleteEmail = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

module.exports = { listEmails, getEmail, saveEmail, updateEmail, approveEmail, markSent, deleteEmail };
