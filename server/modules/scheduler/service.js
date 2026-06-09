const cronParser = require('cron-parser');
const logger = require('../../utils/logger');
const scheduleRepo = require('./scheduleRepo');
const executionRepo = require('./executionRepo');
const publisher = require('../../services/qstash/publisher');
const registry = require('./registry');
const lock = require('./lock');
const { setCurrentUserId } = require('../../middleware/requestContext');
const { safeRead, withLock, atomicWrite } = require('../../db/jsonDb');

/**
 * Calculates the next run time from a cron expression.
 * @param {string} cronExpression
 * @returns {string|null} ISO date string
 */
function getNextRun(cronExpression) {
  if (!cronExpression) return null;
  try {
    const interval = cronParser.parseExpression(cronExpression);
    return interval.next().toDate().toISOString();
  } catch (err) {
    logger.error(`[Scheduler] Failed to parse cron expression next run: ${err.message}`);
    return null;
  }
}

/**
 * Persistently tracks and checks processed messageIds for idempotency.
 * @param {string} messageId
 * @returns {boolean} True if messageId is unique and registered, false if duplicate
 */
function checkAndSetIdempotency(messageId) {
  if (!messageId) return true; // Bypass if no messageId is present
  return withLock('idempotency.json', () => {
    const list = safeRead('idempotency.json', []);
    if (list.includes(messageId)) {
      return false; // Duplicate found
    }
    list.push(messageId);
    // Prune to keep last 1000 items
    if (list.length > 1000) {
      list.shift();
    }
    atomicWrite('idempotency.json', list);
    return true;
  });
}

/**
 * Create a new schedule.
 */
async function createSchedule(data) {
  const nextRun = getNextRun(data.cron);
  
  // 1. Persist initial schedule record
  const schedule = scheduleRepo.create({
    ...data,
    status: 'active',
    lastRun: null,
    nextRun,
  });

  logger.info(`scheduleCreated: ${schedule.id} (${schedule.name})`);

  try {
    // 2. Publish to QStash
    const { qstashScheduleId, qstashMessageId } = await publisher.publishJob(schedule);
    
    // 3. Update with QStash details
    return scheduleRepo.update(schedule.id, {
      qstashScheduleId,
      qstashMessageId,
    });
  } catch (err) {
    logger.error(`[Scheduler] QStash scheduling failed for ${schedule.id}: ${err.message}`);
    // Rollback from DB to avoid ghost schedules
    scheduleRepo.delete(schedule.id);
    throw err;
  }
}

/**
 * Update an existing schedule.
 */
async function updateSchedule(id, updates) {
  const current = scheduleRepo.readById(id);
  if (!current) {
    throw new Error('Schedule not found');
  }

  const merged = { ...current, ...updates };
  let qstashUpdates = {};

  // If cron, type, or payload changed, re-publish to QStash
  const cronChanged = updates.cron !== undefined && updates.cron !== current.cron;
  const payloadChanged = updates.payload !== undefined && JSON.stringify(updates.payload) !== JSON.stringify(current.payload);
  const typeChanged = updates.type !== undefined && updates.type !== current.type;

  if (cronChanged || payloadChanged || typeChanged) {
    logger.info(`[Scheduler] Schedule triggers changed. Re-publishing schedule ${id} to QStash.`);
    // Cancel existing QStash job
    try {
      await publisher.cancelJob(current);
    } catch (err) {
      logger.warn(`[Scheduler] Cancel failed during update for ${id}: ${err.message}`);
    }

    // Publish new QStash job if schedule is active
    if (merged.status === 'active') {
      const qstashRes = await publisher.publishJob(merged);
      qstashUpdates = qstashRes;
    }
  }

  // Recalculate nextRun
  let nextRun = current.nextRun;
  if (cronChanged || updates.status === 'active') {
    nextRun = getNextRun(merged.cron);
  } else if (updates.status === 'paused' || updates.status === 'archived') {
    nextRun = null;
  }

  const finalUpdates = {
    ...updates,
    ...qstashUpdates,
    nextRun,
  };

  const updated = scheduleRepo.update(id, finalUpdates);
  logger.info(`scheduleUpdated: ${id}`);
  return updated;
}

/**
 * Pause a recurring schedule.
 */
async function pauseSchedule(id) {
  const current = scheduleRepo.readById(id);
  if (!current) {
    throw new Error('Schedule not found');
  }

  if (current.status !== 'active') {
    throw new Error('Only active schedules can be paused');
  }

  if (current.qstashScheduleId) {
    await publisher.pauseJob(current.qstashScheduleId);
  }

  const updated = scheduleRepo.update(id, {
    status: 'paused',
    nextRun: null,
  });

  logger.info(`schedulePaused: ${id}`);
  return updated;
}

/**
 * Resume a paused schedule.
 */
async function resumeSchedule(id) {
  const current = scheduleRepo.readById(id);
  if (!current) {
    throw new Error('Schedule not found');
  }

  if (current.status !== 'paused') {
    throw new Error('Only paused schedules can be resumed');
  }

  if (current.qstashScheduleId) {
    await publisher.resumeJob(current.qstashScheduleId);
  }

  const nextRun = getNextRun(current.cron);
  const updated = scheduleRepo.update(id, {
    status: 'active',
    nextRun,
  });

  logger.info(`scheduleResumed: ${id}`);
  return updated;
}

/**
 * Delete a schedule.
 */
async function deleteSchedule(id) {
  const current = scheduleRepo.readById(id);
  if (!current) {
    throw new Error('Schedule not found');
  }

  try {
    await publisher.cancelJob(current);
  } catch (err) {
    logger.warn(`[Scheduler] QStash cancel failed during deletion of ${id}: ${err.message}`);
  }

  scheduleRepo.delete(id);
  logger.info(`scheduleDeleted: ${id}`);
  return true;
}

/**
 * Webhook execution flow triggered by QStash.
 */
async function executeWebhook(scheduleId, messageId) {
  // 1. Verify schedule exists globally
  const schedule = scheduleRepo.getGlobal(scheduleId);
  if (!schedule) {
    logger.warn(`webhookRejected: schedule ${scheduleId} not found`);
    throw new Error(`Schedule ${scheduleId} not found`);
  }

  // 2. Verify schedule is active
  if (schedule.status !== 'active') {
    logger.warn(`webhookRejected: schedule ${scheduleId} is status: ${schedule.status}`);
    return { success: false, message: `Schedule status is ${schedule.status}` };
  }

  // 3. Check idempotency (duplicate prevention)
  const isUnique = checkAndSetIdempotency(messageId);
  if (!isUnique) {
    logger.warn(`webhookRejected: duplicate messageId ${messageId}`);
    return { success: true, message: 'Duplicate execution skipped' };
  }

  // 4. Concurrency lock
  const lockAcquired = lock.acquire(scheduleId);
  if (!lockAcquired) {
    logger.warn(`webhookRejected: overlapping execution lock for schedule ${scheduleId}`);
    const err = new Error('Schedule is already running');
    err.status = 429;
    throw err;
  }

  // 5. Execute handler inside request context
  logger.info(`scheduleTriggered: ${scheduleId}`);
  let execution;
  
  try {
    // Hydrate the context user ID so scoped operations run correctly
    setCurrentUserId(schedule.userId);

    // Persist start of execution log
    execution = executionRepo.create({
      scheduleId,
      messageId,
      status: 'started',
      startedAt: new Date().toISOString(),
      retryCount: 0,
    });

    const handler = registry.getHandler(schedule.type);
    if (!handler) {
      throw new Error(`No registered handler for job type "${schedule.type}"`);
    }

    // Call the idempotent handler
    const runResult = await handler(schedule);

    // Update execution history to success
    executionRepo.update(execution.id, {
      status: 'success',
      finishedAt: new Date().toISOString(),
    });

    // Update schedule's next run time and last run timestamp
    const nextRun = getNextRun(schedule.cron);
    scheduleRepo.updateGlobal(scheduleId, {
      lastRun: new Date().toISOString(),
      nextRun,
    });

    logger.info(`scheduleSucceeded: ${scheduleId}`);
    return { success: true, executionId: execution.id, result: runResult };
  } catch (err) {
    logger.error(`scheduleFailed: ${scheduleId} | Error: ${err.message}`);
    
    if (execution) {
      executionRepo.update(execution.id, {
        status: 'failed',
        finishedAt: new Date().toISOString(),
        error: err.message,
      });
    }

    // Important: Do not pause recurring schedules on failure! Just let next runs execute.
    // However, we still update the nextRun and lastRun globally to keep the cron cycle alive.
    const nextRun = getNextRun(schedule.cron);
    scheduleRepo.updateGlobal(scheduleId, {
      lastRun: new Date().toISOString(),
      nextRun,
    });

    throw err;
  } finally {
    // 6. Release lock
    lock.release(scheduleId);
  }
}

module.exports = {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  pauseSchedule,
  resumeSchedule,
  executeWebhook,
  getNextRun,
};
