const BaseRepository = require('../../infrastructure/db/BaseRepository');
const { safeRead, withLock, atomicWrite } = require('../../db/jsonDb');

const FILE = 'schedules.json';

class ScheduleRepo extends BaseRepository {
  constructor() {
    super(FILE, null); // custom validation done via Zod in service/controller layers
  }

  /**
   * Unscoped global read by ID.
   * Traverses all user blocks in the scoped JSON table schedules.json.
   * @param {string} id
   * @returns {Object|null}
   */
  getGlobal(id) {
    const raw = safeRead(FILE, null);
    if (raw && raw.__scoped === true && raw.users) {
      for (const [userId, userSchedules] of Object.entries(raw.users)) {
        const found = userSchedules.find((s) => String(s.id) === String(id));
        if (found) {
          return { ...found, userId }; // Ensure userId is attached
        }
      }
    }
    return null;
  }

  /**
   * Unscoped global update by ID.
   * @param {string} id
   * @param {Object} updates
   * @returns {Object|null}
   */
  updateGlobal(id, updates) {
    return withLock(FILE, () => {
      const raw = safeRead(FILE, null);
      if (raw && raw.__scoped === true && raw.users) {
        for (const [userId, userSchedules] of Object.entries(raw.users)) {
          const index = userSchedules.findIndex((s) => String(s.id) === String(id));
          if (index !== -1) {
            const updated = {
              ...userSchedules[index],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            userSchedules[index] = updated;
            atomicWrite(FILE, raw);
            return updated;
          }
        }
      }
      return null;
    });
  }
}

module.exports = new ScheduleRepo();
