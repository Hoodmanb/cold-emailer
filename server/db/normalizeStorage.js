const { safeRead, atomicWrite } = require("./jsonDb");

const ARRAY_FILES = [
  "users.json",
  "projects.json",
  "jobs.json",
  "emails.json",
  "templates.json",
  "documentTemplates.json",
  "audit.json",
  "auditLogs.json",
  "recipients.json",
  "smtp.json",
  "uploads.json",
  "documents.json",
  "categories.json",
  "schedules.json",
  "artifacts.json",
  "creditPacks.json",
  "transactions.json",
];

const OBJECT_FILES = [
  "profiles.json",
  "settings.json",
  "ai-configs.json",
  "chats.json",
  "gatewaySettings.json",
];

const GLOBAL_FILES = new Set(["users.json", "gatewaySettings.json", "creditPacks.json", "transactions.json"]);

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeValue(filename, value) {
  if (OBJECT_FILES.includes(filename)) {
    return isPlainObject(value) ? value : {};
  }
  if (!Array.isArray(value)) return [];
  return value.filter((row) => isPlainObject(row));
}

function normalizeScopedFile(filename, raw) {
  if (GLOBAL_FILES.has(filename)) return normalizeValue(filename, raw);
  if (!isPlainObject(raw) || raw.__scoped !== true) {
    return { __scoped: true, users: {} };
  }

  const users = isPlainObject(raw.users) ? raw.users : {};
  const nextUsers = Object.entries(users).reduce((acc, [userId, userData]) => {
    acc[userId] = normalizeValue(filename, userData);
    return acc;
  }, {});
  return { __scoped: true, users: nextUsers };
}

function normalizeStorage() {
  const files = [...ARRAY_FILES, ...OBJECT_FILES];
  for (const filename of files) {
    const current = safeRead(filename, GLOBAL_FILES.has(filename) ? [] : { __scoped: true, users: {} });
    const normalized = normalizeScopedFile(filename, current);
    atomicWrite(filename, normalized);
  }
}

module.exports = { normalizeStorage };
