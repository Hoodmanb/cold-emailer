const fs = require("fs");
const path = require("path");
const { asErrorMessage } = require("../utils/safeError");

const SERVER_ROOT = path.resolve(__dirname, "..");
const DB_DIR = process.env.TEST_STORAGE_PATH ? path.resolve(process.env.TEST_STORAGE_PATH) : path.resolve(SERVER_ROOT, "storage", "data");
const BACKUP_DIR = path.resolve(SERVER_ROOT, "storage", "backups");

const LOCK_LEASE_MS = 2500; // Lock stale lease limit

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
  "schedules.json": [],
  "executions.json": [],
  "idempotency.json": [],
  "categories.json": [],
  "artifacts.json": [],
  "attachments.json": [],
  "documentTemplates.json": [],
  "auditLogs.json": [],
  "creditPacks.json": [],
  "transactions.json": [],
  "gatewaySettings.json": {},
  "billing_settings.json": {},
  "credits_wallets.json": [],
  "credit_transactions.json": [],
  "ai_model_pricing.json": [],
  "ai_usage_logs.json": [],
  "ai_model_catalog.json": {},
  "admin_smtp.json": [],
  "communication_settings.json": {},
  "feedback.json": [],
};

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function filePath(filename) {
  return path.join(DB_DIR, filename);
}

/**
 * Versioned rotating backups helper (Retains up to 3 levels)
 */
function rotateBackups(filename) {
  const target = filePath(filename);
  const bak1 = path.join(BACKUP_DIR, `${filename}.bak.1`);
  const bak2 = path.join(BACKUP_DIR, `${filename}.bak.2`);
  const bak3 = path.join(BACKUP_DIR, `${filename}.bak.3`);

  try {
    if (fs.existsSync(bak2)) {
      fs.copyFileSync(bak2, bak3);
    }
    if (fs.existsSync(bak1)) {
      fs.copyFileSync(bak1, bak2);
    }
    if (fs.existsSync(target)) {
      fs.copyFileSync(target, bak1);
      console.log(`[db-backup] Created backup version 1 for: ${filename}`);
    }
  } catch (err) {
    console.error(`[db-backup] Failed rotating backups for ${filename}:`, asErrorMessage(err));
  }
}

/**
 * Restore corruption recovery mechanism
 */
function restoreFromBackup(filename) {
  const target = filePath(filename);
  const backups = [
    path.join(BACKUP_DIR, `${filename}.bak.1`),
    path.join(BACKUP_DIR, `${filename}.bak.2`),
    path.join(BACKUP_DIR, `${filename}.bak.3`)
  ];

  for (let i = 0; i < backups.length; i++) {
    const backup = backups[i];
    if (fs.existsSync(backup)) {
      try {
        const raw = fs.readFileSync(backup, "utf-8");
        JSON.parse(raw); // Structural integrity check
        console.warn(`[db-recovery] 🔄 Restoring '${filename}' from healthy backup level ${i + 1}`);
        fs.copyFileSync(backup, target);
        return true;
      } catch (_) {
        console.warn(`[db-recovery] ⚠️ Backup level ${i + 1} for ${filename} was also corrupt. Trying next level.`);
      }
    }
  }
  return false;
}

/**
 * Resilient File locking with Stale Lock detection and Process active checking
 */
function withLock(filename, fn) {
  const lockPath = `${filePath(filename)}.lock`;
  let retries = 0;
  let locked = false;

  while (!locked && retries < 250) {
    try {
      if (fs.existsSync(lockPath)) {
        const stats = fs.statSync(lockPath);
        const age = Date.now() - stats.mtimeMs;
        
        let isAlive = true;
        try {
          const rawPid = fs.readFileSync(lockPath, "utf-8").trim();
          const pid = parseInt(rawPid, 10);
          if (pid) {
            process.kill(pid, 0); // Check if process is alive
          }
        } catch (_) {
          isAlive = false;
        }

        if (age > LOCK_LEASE_MS || !isAlive) {
          console.warn(`[db-lock] Evicting stale lock file for '${filename}' (age: ${Math.round(age)}ms, pid-alive: ${isAlive})`);
          try { fs.unlinkSync(lockPath); } catch (_) {}
        }
      }

      fs.writeFileSync(lockPath, String(process.pid), { flag: "wx" });
      locked = true;
      console.log(`[db-lock] Lock acquired for: ${filename}`);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      retries += 1;
      const start = Date.now();
      while (Date.now() - start < 4) {} // Spinning wait
    }
  }

  if (!locked) {
    throw new Error(`[db-lock] Lock acquisition timeout for '${filename}' after 250 spinning loops.`);
  }

  try {
    return fn();
  } finally {
    if (locked && fs.existsSync(lockPath)) {
      try {
        fs.unlinkSync(lockPath);
        console.log(`[db-lock] Lock released for: ${filename}`);
      } catch (_) {}
    }
  }
}

/**
 * Corruption-safe JSON file reader
 */
function safeRead(filename, fallback) {
  const target = filePath(filename);
  
  if (!fs.existsSync(target)) {
    const recovered = restoreFromBackup(filename);
    if (!recovered) return fallback;
  }

  try {
    const raw = fs.readFileSync(target, "utf-8");
    if (!raw || !raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[db-corruption] Malformed data in '${filename}':`, asErrorMessage(err));
    const restored = restoreFromBackup(filename);
    if (restored) {
      try {
        return JSON.parse(fs.readFileSync(target, "utf-8"));
      } catch (_) {}
    }
    return fallback;
  }
}

/**
 * Write-Ahead Validation and Synchronous Atomic temporary swap
 */
function atomicWrite(filename, data) {
  const target = filePath(filename);
  
  // 1. Serialization check
  let stringified;
  try {
    stringified = JSON.stringify(data, null, 2);
    if (!stringified) throw new Error("Resulting data string is empty");
  } catch (err) {
    throw new Error(`[db-write] Write-ahead check failed. Serialization error: ${err.message}`);
  }

  const tmp = `${target}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    // 2. Rotate backups before overwrite
    rotateBackups(filename);

    // 3. Write temp buffer
    fs.writeFileSync(tmp, stringified, "utf-8");

    // 4. Atomic swap rename
    fs.renameSync(tmp, target);
    console.log(`[db-write] Atomic commit successfully completed for: ${filename}`);
  } catch (err) {
    console.error(`[db-write] Atomic transaction commit failed for ${filename}:`, asErrorMessage(err));
    if (fs.existsSync(tmp)) {
      try { fs.unlinkSync(tmp); } catch (_) {}
    }
    throw err;
  }
}

/**
 * Multi-File Transaction management with Pre-Lock Snapshots and Automatic Rollbacks
 */
const activeTransactionFiles = new Set();

function executeTransaction(filenames, transactionFn) {
  for (const file of filenames) {
    if (activeTransactionFiles.has(file)) {
      throw new Error(`[db-transaction] circular locking / transaction nesting detected for: ${file}`);
    }
  }

  const sortedFiles = [...new Set(filenames)].sort();
  const rollbackSnapshots = {};

  // Take safe snapshots of current files state prior to locking
  for (const file of sortedFiles) {
    const target = filePath(file);
    if (fs.existsSync(target)) {
      rollbackSnapshots[file] = fs.readFileSync(target, "utf-8");
    } else {
      rollbackSnapshots[file] = null;
    }
  }

  const releaseTransactionLocks = () => {
    for (const file of sortedFiles) {
      activeTransactionFiles.delete(file);
    }
  };

  const acquireAndRun = (index) => {
    if (index >= sortedFiles.length) {
      for (const file of sortedFiles) {
        activeTransactionFiles.add(file);
      }
      try {
        console.log(`[db-transaction] Beginning transaction execution context on:`, sortedFiles);
        const result = transactionFn();
        releaseTransactionLocks();
        console.log(`[db-transaction] Transaction successfully committed for:`, sortedFiles);
        return result;
      } catch (err) {
        console.error(`[db-transaction] Transaction aborted due to error: '${err.message}'. Initiating rollbacks.`);
        // Rollback all files to initial snapshots
        for (const file of sortedFiles) {
          const snapshot = rollbackSnapshots[file];
          const target = filePath(file);
          try {
            if (snapshot !== null) {
              fs.writeFileSync(target, snapshot, "utf-8");
            } else if (fs.existsSync(target)) {
              fs.unlinkSync(target);
            }
          } catch (restoreErr) {
            console.error(`[db-transaction-fatal] Failed restoring snapshot for ${file}:`, restoreErr.message);
          }
        }
        releaseTransactionLocks();
        throw err;
      }
    }

    return withLock(sortedFiles[index], () => acquireAndRun(index + 1));
  };

  return acquireAndRun(0);
}

function ensureFile(filename, defaultValue) {
  const target = filePath(filename);
  if (fs.existsSync(target)) return;
  console.log(`[db-init] Creating fresh data table ${filename}`);
  atomicWrite(filename, defaultValue);
}

// Table Initialization
for (const [filename, initial] of Object.entries(DEFAULT_FILES)) {
  ensureFile(filename, initial);
}

module.exports = {
  DB_DIR,
  filePath,
  safeRead,
  atomicWrite,
  withLock,
  transaction: executeTransaction
};
