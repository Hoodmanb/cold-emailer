const { v4: uuidv4 } = require("uuid");
const { getCurrentUserId } = require("../middleware/requestContext");
const fileStore = require("../utils/fileStore");

const FILE = "auditLogs.json";

const ACTION_TYPES = {
  AI_GENERATED: "ai_generated",
  AI_FAILED: "ai_failed",
  DRAFT_CREATED: "draft_created",
  DRAFT_APPROVED: "draft_approved",
  DRAFT_REJECTED: "draft_rejected",
  DRAFT_EDITED: "draft_edited",
  EMAIL_SENT: "email_sent",
  EMAIL_FAILED: "email_failed",
  EMAIL_SCHEDULED: "email_scheduled",
  DOCUMENT_DOWNLOADED: "document_downloaded",
  DOCUMENT_DELETED: "document_deleted",
  JOB_CREATED: "job_created",
  JOB_DELETED: "job_deleted",
  WORKFLOW_STARTED: "workflow_started",
  WORKFLOW_COMPLETED: "workflow_completed",
  WORKFLOW_FAILED: "workflow_failed",
  PROFILE_UPDATED: "profile_updated",
  EMAIL_CONFIG_UPDATED: "email_config_updated",
  ACCOUNT_DELETED: "account_deleted",
};

const log = (action, details = {}) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return;
    const entry = {
      id: uuidv4(),
      userId,
      createdBy: userId,
      timestamp: new Date().toISOString(),
      action,
      ...details,
    };
    const entries = fileStore.read(FILE);
    const next = [entry, ...entries].slice(0, 1000);
    fileStore.write(FILE, next);
  } catch (err) {
    console.error("[AuditLogger] Failed to write log:", err.message);
  }
};

const readLogs = ({ limit = 100, action: actionFilter } = {}) => {
  try {
    let entries = fileStore.read(FILE);
    if (actionFilter) entries = entries.filter((e) => e.action === actionFilter);
    return entries.slice(0, limit);
  } catch (_err) {
    return [];
  }
};

module.exports = { log, readLogs, ACTION_TYPES };
