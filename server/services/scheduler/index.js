// server/services/scheduler/index.js

/**
 * SchedulerFacade – abstracts the underlying scheduler provider (QStash or mock).
 *
 * The facade reads environment variables:
 *   - process.env.SCHEDULER_ENABLED ("true"/"false")
 *   - process.env.SCHEDULER_PROVIDER (e.g., "qstash")
 *
 * It exposes the same methods used by routes:
 *   - publishSchedule(schedulePayload)
 *   - getSchedules()
 *   - getScheduleHistory(id)
 *   - cancelSchedule(id)
 *   - status() – returns { enabled, provider, healthy }
 */

const env = require('../../config/env'); // adjust path as needed

let provider;

function loadProvider() {
  const enabled = env.schedulerEnabled === 'true' || env.schedulerEnabled === true;
  const prov = env.schedulerProvider || 'mock';

  if (!enabled) {
    provider = require('./mockProvider'); // simple in‑memory mock
    return { enabled: false, provider: prov, healthy: true };
  }

  switch (prov) {
    case 'qstash':
      provider = require('../../services/qstash/publisher');
      break;
    default:
      provider = require('./mockProvider');
  }
  return { enabled, provider: prov, healthy: true };
}

// Load once at module init
const statusInfo = loadProvider();

module.exports = {
  /** Returns health/status info */
  status: () => statusInfo,

  /** Publish a schedule (create or update) */
  publishSchedule: async (payload) => {
    if (!statusInfo.enabled && statusInfo.provider === 'mock') {
      return provider.publishSchedule(payload); // mock still works
    }
    return provider.publishSchedule(payload);
  },

  /** Retrieve schedules */
  getSchedules: async () => provider.getSchedules(),

  /** Retrieve schedule history */
  getScheduleHistory: async (id) => provider.getScheduleHistory(id),

  /** Cancel a schedule */
  cancelSchedule: async (id) => provider.cancelSchedule(id),
};
