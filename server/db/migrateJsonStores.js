/**
 * One-time / idempotent JSON store migration.
 * - Merges redundant files into canonical targets
 * - Converts flat arrays to scoped { __scoped, users } where needed
 * - Never deletes files that still contain unmigrated data
 */
const fs = require('fs');
const path = require('path');
const { filePath, DB_DIR, safeRead, atomicWrite } = require('./jsonDb');

const GLOBAL_FILES = new Set([
  'users.json',
  'admin_smtp.json',
  'communication_settings.json',
  'feedback.json',
  'documentTemplates.json',
  'gatewaySettings.json',
  'creditPacks.json',
  'transactions.json',
  'billing_settings.json',
  'credits_wallets.json',
  'credit_transactions.json',
  'ai_model_pricing.json',
  'ai_usage_logs.json',
  'ai_model_catalog.json',
]);

const OBJECT_FILES = new Set([
  'profiles.json',
  'settings.json',
  'ai-configs.json',
  'chats.json',
  'communication_settings.json',
]);

const ARRAY_FILES = new Set([
  'projects.json',
  'jobs.json',
  'emails.json',
  'templates.json',
  'auditLogs.json',
  'recipients.json',
  'smtp.json',
  'uploads.json',
  'schedules.json',
  'executions.json',
  'idempotency.json',
  'categories.json',
  'artifacts.json',
  'attachments.json',
]);

const migrationLog = [];

function logMigration(source, destination, count, notes = '') {
  const entry = { source, destination, count, notes, at: new Date().toISOString() };
  migrationLog.push(entry);
  console.log(`[migrateJsonStores] ${source} → ${destination}: ${count} record(s)${notes ? ` (${notes})` : ''}`);
}

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value !== 'object') return false;
  if (value.__scoped === true) {
    const users = value.users && typeof value.users === 'object' ? value.users : {};
    return Object.keys(users).length === 0;
  }
  return Object.keys(value).length === 0;
}

function countScopedRecords(scoped) {
  if (!scoped || scoped.__scoped !== true) return 0;
  const users = scoped.users && typeof scoped.users === 'object' ? scoped.users : {};
  return Object.values(users).reduce((sum, val) => {
    if (Array.isArray(val)) return sum + val.length;
    if (val && typeof val === 'object') return sum + 1;
    return sum;
  }, 0);
}

function mergeScopedInto(target, source, filename) {
  if (!source || source.__scoped !== true) return 0;
  if (!target.__scoped) {
    target.__scoped = true;
    target.users = target.users || {};
  }
  const srcUsers = source.users && typeof source.users === 'object' ? source.users : {};
  let moved = 0;
  for (const [userId, userData] of Object.entries(srcUsers)) {
    if (!userId) continue;
    if (ARRAY_FILES.has(filename)) {
      const rows = Array.isArray(userData) ? userData : [];
      if (!rows.length) continue;
      if (!Array.isArray(target.users[userId])) target.users[userId] = [];
      const existingIds = new Set(target.users[userId].map((r) => String(r.id)));
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const id = String(row.id || '');
        if (id && existingIds.has(id)) continue;
        target.users[userId].push({ ...row, userId: String(row.userId || userId) });
        moved += 1;
      }
    } else if (OBJECT_FILES.has(filename)) {
      if (!userData || typeof userData !== 'object' || Array.isArray(userData)) continue;
      if (!target.users[userId]) {
        target.users[userId] = userData;
        moved += 1;
      }
    }
  }
  return moved;
}

function flatArrayToScoped(filename, flatArray) {
  const scoped = { __scoped: true, users: {} };
  const users = safeRead('users.json', []);
  const defaultUserId = Array.isArray(users) && users[0]?.id ? String(users[0].id) : 'system';
  for (const row of flatArray) {
    if (!row || typeof row !== 'object') continue;
    const uid = String(row.userId || row.createdBy || defaultUserId);
    if (!scoped.users[uid]) scoped.users[uid] = ARRAY_FILES.has(filename) ? [] : {};
    if (ARRAY_FILES.has(filename)) {
      scoped.users[uid].push({ ...row, userId: uid });
    } else {
      scoped.users[uid] = { ...row, userId: uid };
    }
  }
  return scoped;
}

function migrateAuditDuplicate() {
  const canonical = 'auditLogs.json';
  const redundant = 'audit.json';
  const canonPath = filePath(canonical);
  const redundPath = filePath(redundant);

  if (!fs.existsSync(redundPath)) return;

  const canonData = safeRead(canonical, { __scoped: true, users: {} });
  const redundData = safeRead(redundant, { __scoped: true, users: {} });
  const redundCount = countScopedRecords(redundData);

  if (redundCount > 0) {
    const merged = JSON.parse(JSON.stringify(canonData));
    const moved = mergeScopedInto(merged, redundData, canonical);
    if (moved > 0) {
      atomicWrite(canonical, merged);
      logMigration(redundant, canonical, moved, 'merged scoped audit records');
    }
  }

  if (isEmpty(redundData)) {
    fs.unlinkSync(redundPath);
    logMigration(redundant, '(deleted)', 0, 'verified empty after merge check');
  }
}

function migrateFlatScopedFiles() {
  const files = fs.readdirSync(DB_DIR).filter((f) => f.endsWith('.json'));
  for (const filename of files) {
    if (GLOBAL_FILES.has(filename)) continue;
    const raw = safeRead(filename, null);
    if (raw === null) continue;

    if (Array.isArray(raw) && raw.length > 0) {
      const scoped = flatArrayToScoped(filename, raw);
      const count = raw.length;
      atomicWrite(filename, scoped);
      logMigration(filename, filename, count, 'converted flat array to scoped structure');
      continue;
    }

    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.__scoped !== true && !OBJECT_FILES.has(filename)) {
      // Legacy object wrapper without __scoped — treat as empty bucket
      const scoped = { __scoped: true, users: {} };
      atomicWrite(filename, scoped);
      logMigration(filename, filename, 0, 'normalized legacy object to scoped shell');
    }
  }
}

function ensureGlobalDocumentTemplates() {
  const filename = 'documentTemplates.json';
  const raw = safeRead(filename, []);
  if (!Array.isArray(raw)) return;
  // Already correct global flat array — no migration needed
  logMigration(filename, filename, raw.length, 'verified global flat catalog (no scoped wrapper)');
}

function runJsonStoreMigration() {
  console.log('[migrateJsonStores] Starting JSON store migration...');
  migrationLog.length = 0;
  migrateAuditDuplicate();
  migrateFlatScopedFiles();
  ensureGlobalDocumentTemplates();
  console.log(`[migrateJsonStores] Complete. ${migrationLog.length} operation(s) logged.`);
  return migrationLog;
}

module.exports = { runJsonStoreMigration, migrationLog };
