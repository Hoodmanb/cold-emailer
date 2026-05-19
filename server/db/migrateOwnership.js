const fs = require("fs");
const path = require("path");
const { filePath, DB_DIR, safeRead, atomicWrite } = require("./jsonDb");

const GLOBAL_FILES = new Set(["users.json"]);

function readJsonSafe(absPath, fallback) {
  try {
    if (!fs.existsSync(absPath)) return fallback;
    return JSON.parse(fs.readFileSync(absPath, "utf-8"));
  } catch (_err) {
    return fallback;
  }
}

function writeJsonAtomic(absPath, data) {
  const tmp = `${absPath}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, absPath);
}

function hasChanged(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function normalizeArrayRecords(rows, userId) {
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      ...row,
      userId: String(row.userId || userId),
      createdBy: String(row.createdBy || row.userId || userId),
    }));
}

function migrateFile(filename) {
  if (GLOBAL_FILES.has(filename)) return;
  const abs = filePath(filename);
  const raw = readJsonSafe(abs, null);
  if (raw === null) return;

  if (Array.isArray(raw)) {
    const users = readJsonSafe(filePath("users.json"), []);
    const defaultUserId = users[0]?.id || "system";

    const scoped = { __scoped: true, users: {} };
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const uid = String(row.userId || defaultUserId);
      if (!scoped.users[uid]) scoped.users[uid] = [];
      scoped.users[uid].push({
        ...row,
        userId: uid,
        createdBy: String(row.createdBy || uid),
      });
    }
    if (hasChanged(raw, scoped)) {
      writeJsonAtomic(abs, scoped);
    }
    return;
  }

  if (raw && typeof raw === "object" && raw.__scoped === true) {
    const users = raw.users && typeof raw.users === "object" ? raw.users : {};
    const normalizedUsers = {};
    for (const [uid, value] of Object.entries(users)) {
      const userId = String(uid);
      if (Array.isArray(value)) normalizedUsers[userId] = normalizeArrayRecords(value, userId);
      else if (value && typeof value === "object")
        normalizedUsers[userId] = {
          ...value,
          userId: String(value.userId || userId),
          createdBy: String(value.createdBy || value.userId || userId),
        };
    }
    const next = { __scoped: true, users: normalizedUsers };
    if (hasChanged(raw, next)) {
      writeJsonAtomic(abs, next);
    }
    return;
  }

  if (raw && typeof raw === "object") {
    const next = { __scoped: true, users: {} };
    if (hasChanged(raw, next)) {
      writeJsonAtomic(abs, next);
    }
  }
}

function runOwnershipMigration() {
  console.log("🚀 Starting ownership migration...");
  const files = fs.readdirSync(DB_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    console.log(`📦 Migrating ${file}...`);
    migrateFile(file);
  }
  console.log("✅ Ownership migration complete.");
}

module.exports = { runOwnershipMigration };
