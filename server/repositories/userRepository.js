const fileStore = require("../utils/fileStore");
const { ensureArray } = require("../utils/jsonNormalizer");
const { getProfile } = require("./profileRepository");
const { getAllProjects } = require("./projectRepository");
const { getSettings } = require("./settingsRepository");
const { getAiSettings } = require("./aiRepository");

const USERS_FILE = "users.json";

/**
 * Global user management (unscoped)
 */
/**
 * Global user management (unscoped)
 */
const findUserByEmail = (email) => {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return null;
  const users = ensureArray(fileStore.read(USERS_FILE));
  return users.find((u) => String(u.email || "").toLowerCase() === target) || null;
};

const findUserById = (id) => {
  const users = ensureArray(fileStore.read(USERS_FILE));
  return users.find((u) => String(u.id) === String(id)) || null;
};

const createUser = (userData) => {
  const newUser = {
    ...userData,
    starredTemplates: Array.isArray(userData.starredTemplates) ? userData.starredTemplates : [],
    userVersion: 1,
    updatedAt: new Date().toISOString(),
  };
  return fileStore.append(USERS_FILE, newUser);
};

const updateUserRecord = (id, updates) => {
  return fileStore.update(
    USERS_FILE,
    (u) => String(u.id) === String(id),
    (u) => ({
      ...u,
      ...updates,
    })
  );
};

/**
 * Unified user data view (scoped)
 */
const getUserFullData = (userId) => ({
  profile: getProfile(userId),
  projects: getAllProjects(userId),
  settings: getSettings(userId),
  aiSettings: getAiSettings(userId),
});

const PURGEABLE_SCOPED_FILES = [
  "profiles.json",
  "projects.json",
  "settings.json",
  "jobs.json",
  "emails.json",
  "templates.json",
  "recipients.json",
  "smtp.json",
  "ai-configs.json",
  "chats.json",
  "uploads.json",
  "artifacts.json",
  "schedules.json",
  "categories.json"
];

const deleteUserAndCleanup = (userId) => {
  if (!userId) throw new Error("User ID is required for deletion");

  const { safeRead, atomicWrite, withLock } = require("../db/jsonDb");
  console.log(`[userRepository] Initializing permanent account deletion for user: ${userId}`);

  // 1. Remove user from users.json
  withLock(USERS_FILE, () => {
    const users = safeRead(USERS_FILE, []);
    const filtered = users.filter((u) => String(u.id) !== String(userId));
    atomicWrite(USERS_FILE, filtered);
    console.log(`[userRepository] Removed user ${userId} from ${USERS_FILE}`);
  });

  // 2. Remove user-created document templates from global catalog
  try {
    withLock('documentTemplates.json', () => {
      const raw = safeRead('documentTemplates.json', []);
      if (Array.isArray(raw)) {
        const filtered = raw.filter((t) => String(t.createdBy || '') !== String(userId));
        if (filtered.length !== raw.length) {
          atomicWrite('documentTemplates.json', filtered);
          console.log('[userRepository] Removed user templates from documentTemplates.json');
        }
      }
    });
  } catch (err) {
    console.error(`[userRepository] Failed to purge document templates for ${userId}:`, err.message);
  }

  // 3. Clear user-scoped records from allowed tables
  for (const file of PURGEABLE_SCOPED_FILES) {
    try {
      withLock(file, () => {
        const raw = safeRead(file, null);
        if (raw && typeof raw === "object" && raw.__scoped === true && raw.users) {
          if (raw.users[userId]) {
            delete raw.users[userId];
            atomicWrite(file, raw);
            console.log(`[userRepository] Successfully purged scoped user data in ${file}`);
          }
        }
      });
    } catch (err) {
      console.error(`[userRepository] Failed to purge user ${userId} from ${file}:`, err.message);
    }
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserRecord,
  getUserFullData,
  deleteUserAndCleanup,
};
