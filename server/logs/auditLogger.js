const { v4: uuidv4 } = require('uuid');
const { getCurrentUserId } = require('../middleware/requestContext');
const Supabase = require('../services/supabaseService');

const TABLE = 'audit_logs';

const ACTION_TYPES = {
  AI_GENERATED: 'ai_generated',
  AI_FAILED: 'ai_failed',
  DRAFT_CREATED: 'draft_created',
  DRAFT_APPROVED: 'draft_approved',
  DRAFT_REJECTED: 'draft_rejected',
  DRAFT_EDITED: 'draft_edited',
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed',
  EMAIL_SCHEDULED: 'email_scheduled',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_DELETED: 'document_deleted',
  JOB_CREATED: 'job_created',
  JOB_DELETED: 'job_deleted',
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_FAILED: 'workflow_failed',
  PROFILE_UPDATED: 'profile_updated',
  EMAIL_CONFIG_UPDATED: 'email_config_updated',
  ACCOUNT_DELETED: 'account_deleted',
};

const log = async (action, details = {}) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return;
    const entry = {
      id: uuidv4(),
      user_id: userId,
      action,
      details: {
        createdBy: userId,
        timestamp: new Date().toISOString(),
        ...details,
      },
      created_at: new Date().toISOString(),
    };
    await Supabase.insert(TABLE, entry, userId);
  } catch (err) {
    console.error('[AuditLogger] Failed to write log:', err.message);
  }
};

const readLogs = async ({ limit = 100, action: actionFilter, userId } = {}) => {
  try {
    const uid = userId || getCurrentUserId();
    const { data, error } = uid
      ? await Supabase.select(TABLE, {}, uid)
      : await Supabase.selectAll(TABLE);
    if (error) throw error;
    let entries = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      timestamp: row.created_at,
      ...(row.details || {}),
    }));
    if (actionFilter) entries = entries.filter((e) => e.action === actionFilter);
    return entries.slice(0, limit);
  } catch (_err) {
    return [];
  }
};

module.exports = { log, readLogs, ACTION_TYPES };
