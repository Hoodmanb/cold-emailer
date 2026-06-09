const BaseRepository = require('../../infrastructure/db/BaseRepository');

const FILE = 'scheduleExecutions.json';

class ExecutionRepo extends BaseRepository {
  constructor() {
    super(FILE, null);
  }

  /**
   * List execution history records for a specific schedule.
   * @param {string} scheduleId
   * @returns {Object[]}
   */
  listForSchedule(scheduleId) {
    const list = this.readAll() || [];
    return list.filter((item) => String(item.scheduleId) === String(scheduleId));
  }

  listAll() {
    return this.readAll();
  }
}

module.exports = new ExecutionRepo();
