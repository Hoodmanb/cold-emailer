// LEGACY SYSTEM - DISABLED. Supabase is now source of truth.
// This module is retained for reference only. No production code should import it.
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { filePath, safeRead, atomicWrite, withLock } = require("../db/jsonDb");
const { getCurrentUserId } = require("../middleware/requestContext");
const debugLog = require("./debugLogger");
const { asErrorMessage } = require("./safeError");

const GLOBAL_FILES = new Set([
  "users.json",
  "admin_smtp.json",
  "communication_settings.json",
  "feedback.json",
  "documentTemplates.json",
]);
const OBJECT_FILES = new Set(["profiles.json", "settings.json", "ai-configs.json", "chats.json", "communication_settings.json"]);

function resolveUserId(explicitUserId) {
  const uid = explicitUserId ?? getCurrentUserId();
  return uid ? String(uid) : null;
}

/**
 * Returns default empty state for a given file.
 */
function defaultFor(filename) {
  if (OBJECT_FILES.has(filename)) return {};
  return [];
}

/**
 * Determines if a file should be scoped by userId.
 */
function isScopedFile(filename) {
  return !GLOBAL_FILES.has(filename);
}

/**
 * Bumps the userVersion in users.json for a given userId.
 * Used internally to signal state changes to the frontend.
 */
function bumpUserVersion(userId) {
  if (!userId) return;
  try {
    withLock("users.json", () => {
      const users = safeRead("users.json", []);
      const index = users.findIndex((u) => String(u.id) === String(userId));
      if (index !== -1) {
        users[index].userVersion = (users[index].userVersion || 1) + 1;
        users[index].updatedAt = new Date().toISOString();
        atomicWrite("users.json", users);
      }
    });
  } catch (err) {
    console.error(`[fileStore] Failed to bump version for user ${userId}:`, err.message);
  }
}

/**
 * Retrieves data scoped to the current user.
 */
function getScopedData(filename, raw, userId) {
  if (!isScopedFile(filename) || !userId) {
    debugLog("getScopedData SKIP", { filename, isScoped: isScopedFile(filename), userId });
    return raw;
  }

  // Scoped files are stored as { __scoped: true, users: { [userId]: data } }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.__scoped === true) {
    const data = raw.users?.[userId] ?? defaultFor(filename);
    debugLog("getScopedData SCOPED", { 
      filename, 
      userId, 
      found: !!raw.users?.[userId], 
      keys: Object.keys(raw.users || {}) 
    });
    return data;
  }

  // If file exists but isn't scoped yet, return it as-is (graceful fallback before migration)
  debugLog("getScopedData FALLBACK", { filename, userId });
  return raw;
}

function normalizeShape(filename, value) {
  const fallback = defaultFor(filename);
  if (OBJECT_FILES.has(filename)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
    return value;
  }
  if (!Array.isArray(value)) return fallback;
  return value.filter((row) => row && typeof row === "object" && !Array.isArray(row));
}

function normalizeScopedFile(filename, raw) {
  const fallback = defaultFor(filename);
  if (!isScopedFile(filename)) return normalizeShape(filename, raw);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  if (raw.__scoped !== true) return raw;

  const users = raw.users && typeof raw.users === "object" && !Array.isArray(raw.users) ? raw.users : {};
  const normalizedUsers = Object.entries(users).reduce((acc, [userId, userValue]) => {
    acc[userId] = normalizeShape(filename, userValue);
    return acc;
  }, {});

  return { __scoped: true, users: normalizedUsers, _fallback: fallback };
}

/**
 * Sets data scoped to the current user within a global file.
 */
function setScopedData(filename, raw, userId, nextUserData) {
  if (!isScopedFile(filename) || !userId) return nextUserData;

  const base = (raw && typeof raw === "object" && !Array.isArray(raw) && raw.__scoped === true)
    ? raw
    : { __scoped: true, users: {} };

  base.users = base.users || {};
  base.users[userId] = nextUserData;
  return base;
}

/**
 * Injects mandatory fields into a record.
 */
function enrichRecord(record, userId) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return record;
  const now = new Date().toISOString();
  return {
    id: record.id || uuidv4(),
    userId: record.userId || userId,
    createdAt: record.createdAt || now,
    updatedAt: now,
    ...record,
  };
}

/**
 * High-level API for repositories.
 */
const fileStore = {
  /**
   * Reads data from a file (scoped to current user if applicable).
   */
  read: (filename, explicitUserId) => {
    const userId = resolveUserId(explicitUserId);
    const raw = safeRead(filename, defaultFor(filename));
    const normalizedRaw = normalizeScopedFile(filename, raw);
    const data = normalizeShape(filename, getScopedData(filename, normalizedRaw, userId));
    console.log(`[fileStore] READ ${filename} for user: ${userId} | Items: ${Array.isArray(data) ? data.length : (data ? 1 : 0)}`);
    return data;
  },

  /**
   * Overwrites data in a file (scoped to current user if applicable).
   */
  write: (filename, data, explicitUserId) => {
    return withLock(filename, () => {
      const userId = resolveUserId(explicitUserId);
      const existingRaw = normalizeScopedFile(filename, safeRead(filename, defaultFor(filename)));
      const nextUserData = normalizeShape(filename, data);
      const nextRaw = setScopedData(filename, existingRaw, userId, nextUserData);
      atomicWrite(filename, nextRaw);
      
      if (isScopedFile(filename) && userId) {
        bumpUserVersion(userId);
      }
      
      return nextUserData;
    });
  },

  /**
   * Appends a record to a collection (scoped to current user).
   */
  append: (filename, item, explicitUserId) => {
    return withLock(filename, () => {
      const userId = resolveUserId(explicitUserId);
      const existingRaw = normalizeScopedFile(filename, safeRead(filename, defaultFor(filename)));
      const currentData = normalizeShape(filename, getScopedData(filename, existingRaw, userId));

      const enriched = enrichRecord(item, userId);
      const nextData = [...currentData, enriched];

      const nextRaw = setScopedData(filename, existingRaw, userId, nextData);
      atomicWrite(filename, nextRaw);

      if (userId) {
        bumpUserVersion(userId);
      }

      return enriched;
    });
  },

  /**
   * Updates records in a collection matching a predicate.
   */
  update: (filename, predicate, updater, explicitUserId) => {
    return withLock(filename, () => {
      const userId = resolveUserId(explicitUserId);
      const existingRaw = normalizeScopedFile(filename, safeRead(filename, defaultFor(filename)));
      const currentData = normalizeShape(filename, getScopedData(filename, existingRaw, userId));

      if (!Array.isArray(currentData)) return null;

      const updatedRecords = [];
      const nextData = currentData.map(item => {
        if (!predicate(item)) return item;
        const updated = updater(item) || {};
        const nextRecord = enrichRecord({ ...item, ...updated }, userId);
        updatedRecords.push(nextRecord);
        return nextRecord;
      });

      if (updatedRecords.length > 0) {
        const nextRaw = setScopedData(filename, existingRaw, userId, nextData);
        atomicWrite(filename, nextRaw);
        
        if (userId) {
          bumpUserVersion(userId);
        }
      }

      if (updatedRecords.length === 0) return null;
      if (updatedRecords.length === 1) return updatedRecords[0];
      return updatedRecords;
    });
  },

  /**
   * Removes records from a collection matching a predicate.
   */
  remove: (filename, predicate, explicitUserId) => {
    return withLock(filename, () => {
      const userId = resolveUserId(explicitUserId);
      const existingRaw = normalizeScopedFile(filename, safeRead(filename, defaultFor(filename)));
      const currentData = normalizeShape(filename, getScopedData(filename, existingRaw, userId));

      if (!Array.isArray(currentData)) return 0;

      const nextData = currentData.filter(item => !predicate(item));
      const removedCount = currentData.length - nextData.length;

      if (removedCount > 0) {
        const nextRaw = setScopedData(filename, existingRaw, userId, nextData);
        atomicWrite(filename, nextRaw);

        if (userId) {
          bumpUserVersion(userId);
        }
      }

      return removedCount;
    });
  },

  readWhere: (filename, predicate, explicitUserId) => {
    const rows = fileStore.read(filename, explicitUserId);
    if (!Array.isArray(rows)) return [];
    if (typeof predicate !== "function") return rows;
    try {
      return rows.filter(predicate);
    } catch (err) {
      console.warn(`[fileStore] readWhere predicate failed for ${filename}: ${asErrorMessage(err)}`);
      return [];
    }
  },
};

module.exports = fileStore;
module.exports.GLOBAL_FILES = GLOBAL_FILES;
module.exports.OBJECT_FILES = OBJECT_FILES;
module.exports.isScopedFile = isScopedFile;
module.exports.defaultFor = defaultFor;
