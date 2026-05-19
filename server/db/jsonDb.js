const fs = require("fs");
const path = require("path");
const { asErrorMessage } = require("../utils/safeError");

const SERVER_ROOT = path.resolve(__dirname, "..");
const DB_DIR = path.resolve(SERVER_ROOT, "storage", "data");

const DEFAULT_FILES = {
  "users.json": [],
  "projects.json": [],
  "profiles.json": {},
  "settings.json": {},
  "jobs.json": [],
  "emails.json": [],
  "templates.json": [],
  "audit.json": [],
  "recipients.json": [],
  "smtp.json": [],
  "ai-configs.json": {},
  "chats.json": { sessions: [] },
  "uploads.json": [],
};

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function filePath(filename) {
  return path.join(DB_DIR, filename);
}

function withLock(filename, fn) {
  const lockPath = `${filePath(filename)}.lock`;
  let retries = 0;
  let locked = false;
  while (!locked && retries < 200) {
    try {
      fs.writeFileSync(lockPath, String(process.pid), { flag: "wx" });
      locked = true;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      retries += 1;
      const start = Date.now();
      while (Date.now() - start < 5) { }
    }
  }

  try {
    return fn();
  } finally {
    if (locked && fs.existsSync(lockPath)) {
      try {
        fs.unlinkSync(lockPath);
      } catch (_err) { }
    }
  }
}

function safeRead(filename, fallback) {
  const target = filePath(filename);
  if (!fs.existsSync(target)) return fallback;
  try {
    const raw = fs.readFileSync(target, "utf-8");
    if (!raw || !raw.trim()) return fallback;
    console.log(`[DB READ] ${filename}`);
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[DB ERROR] Failed to read ${filename}:`, asErrorMessage(err));
    return fallback;
  }
}

function atomicWrite(filename, data) {
  const target = filePath(filename);
  const tmp = `${target}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    console.log(`[DB WRITE] ${filename}`);
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmp, target);
  } catch (err) {
    console.error(`[DB ERROR] Failed to write ${filename}:`, asErrorMessage(err));
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw err;
  }
}

function ensureFile(filename, defaultValue) {
  const target = filePath(filename);
  if (fs.existsSync(target)) return;
  console.log(`[DB INIT] creating ${filename} at ${target}`);
  atomicWrite(filename, defaultValue);
}

for (const [filename, initial] of Object.entries(DEFAULT_FILES)) {
  ensureFile(filename, initial);
}

module.exports = {
  DB_DIR,
  filePath,
  safeRead,
  atomicWrite,
  withLock,
};
