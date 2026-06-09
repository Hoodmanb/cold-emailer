/**
 * Simple in-memory execution lock to prevent overlapping runs/retries.
 * 
 * TODO: This in-memory implementation is acceptable because the application
 * currently runs as a single instance on Render. If multiple server instances
 * are introduced in the future, this locking mechanism MUST move to a shared
 * store (such as Redis/Upstash Redis) to prevent distributed race conditions.
 */
const activeLocks = new Set();

/**
 * Acquire a lock for a given key.
 * @param {string} key - Lock key (e.g. schedule ID)
 * @returns {boolean} - True if lock was acquired, false if already locked
 */
function acquire(key) {
  if (activeLocks.has(key)) {
    return false;
  }
  activeLocks.add(key);
  return true;
}

/**
 * Release a lock for a given key.
 * @param {string} key - Lock key
 */
function release(key) {
  activeLocks.delete(key);
}

module.exports = {
  acquire,
  release
};
