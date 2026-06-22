const cronParser = require('cron-parser');
const logger = require('../../utils/logger');
const scheduleRepo = require('./scheduleRepo');
const executionRepo = require('./executionRepo');
const publisher = require('../../services/qstash/publisher');
const registry = require('./registry');
const lock = require('./lock');
const { setCurrentUserId } = require('../../middleware/requestContext');
const Supabase = require('../../services/supabaseService');

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

async function checkAndSetIdempotency(messageId) {
  if (!messageId) return true;
  const { data: existing } = await Supabase.selectOne('scheduler_idempotency', { message_id: messageId });
  if (existing) return false;
  const { error } = await Supabase.insert('scheduler_idempotency', { message_id: messageId });
  if (error) {
    if (error.code === '23505') return false;
    throw error;
  }
  return true;
}

async function createSchedule(data) {
  const nextRun = getNextRun(data.cron);

  const schedule = await scheduleRepo.create({
    ...data,
    status: 'active',
    lastRun: null,
    nextRun,
  });

  logger.info(`scheduleCreated: ${schedule.id} (${schedule.name})`);

  try {
    const { qstashScheduleId, qstashMessageId } = await publisher.publishJob(schedule);
    return scheduleRepo.update(schedule.id, {
      qstashScheduleId,
      qstashMessageId,
    });
  } catch (err) {
    logger.error(`[Scheduler] QStash scheduling failed for ${schedule.id}: ${err.message}`);
    await scheduleRepo.delete(schedule.id);
    throw err;
  }
}

async function updateSchedule(id, updates) {
  const current = await scheduleRepo.readById(id);
  if (!current) {
    throw new Error('Schedule not found');
  }

  const merged = { ...current, ...updates };
  let qstashUpdates = {};

  const cronChanged = updates.cron !== undefined && updates.cron !== current.cron;
  const payloadChanged =
    updates.payload !== undefined &&
    JSON.stringify(updates.payload) !== JSON.stringify(current.payload);
  const typeChanged = updates.type !== undefined && updates.type !== current.type;

  if (cronChanged || payloadChanged || typeChanged) {
    logger.info(`[Scheduler] Schedule triggers changed. Re-publishing schedule ${id} to QStash.`);
    try {
      await publisher.cancelJob(current);
    } catch (err) {
      logger.warn(`[Scheduler] Cancel failed during update for ${id}: ${err.message}`);
    }

    if (merged.status === 'active') {
      const qstashRes = await publisher.publishJob(merged);
      qstashUpdates = qstashRes;
    }
  }

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

  const updated = await scheduleRepo.update(id, finalUpdates);
  logger.info(`scheduleUpdated: ${id}`);
  return updated;
}

async function pauseSchedule(id) {
  const current = await scheduleRepo.readById(id);
  if (!current) {
    throw new Error('Schedule not found');
  }

  if (current.status !== 'active') {
    throw new Error('Only active schedules can be paused');
  }

  if (current.qstashScheduleId) {
    await publisher.pauseJob(current.qstashScheduleId);
  }

  const updated = await scheduleRepo.update(id, {
    status: 'paused',
    nextRun: null,
  });

  logger.info(`schedulePaused: ${id}`);
  return updated;
}

async function resumeSchedule(id) {
  const current = await scheduleRepo.readById(id);
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
  const updated = await scheduleRepo.update(id, {
    status: 'active',
    nextRun,
  });

  logger.info(`scheduleResumed: ${id}`);
  return updated;
}

async function deleteSchedule(id) {
  const current = await scheduleRepo.readById(id);
  if (!current) {
    throw new Error('Schedule not found');
  }

  try {
    await publisher.cancelJob(current);
  } catch (err) {
    logger.warn(`[Scheduler] QStash cancel failed during deletion of ${id}: ${err.message}`);
  }

  await scheduleRepo.delete(id);
  logger.info(`scheduleDeleted: ${id}`);
  return true;
}

async function executeWebhook(scheduleId, messageId) {
  const schedule = await scheduleRepo.getGlobal(scheduleId);
  if (!schedule) {
    logger.warn(`webhookRejected: schedule ${scheduleId} not found`);
    throw new Error(`Schedule ${scheduleId} not found`);
  }

  if (schedule.status !== 'active') {
    logger.warn(`webhookRejected: schedule ${scheduleId} is status: ${schedule.status}`);
    return { success: false, message: `Schedule status is ${schedule.status}` };
  }

  const isUnique = await checkAndSetIdempotency(messageId);
  if (!isUnique) {
    logger.warn(`webhookRejected: duplicate messageId ${messageId}`);
    return { success: true, message: 'Duplicate execution skipped' };
  }

  const lockAcquired = lock.acquire(scheduleId);
  if (!lockAcquired) {
    logger.warn(`webhookRejected: overlapping execution lock for schedule ${scheduleId}`);
    const err = new Error('Schedule is already running');
    err.status = 429;
    throw err;
  }

  logger.info(`scheduleTriggered: ${scheduleId}`);
  let execution;

  try {
    setCurrentUserId(schedule.userId);

    execution = await executionRepo.create({
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

    const runResult = await handler(schedule);

    await executionRepo.update(execution.id, {
      status: 'success',
      finishedAt: new Date().toISOString(),
    });

    const nextRun = getNextRun(schedule.cron);
    await scheduleRepo.updateGlobal(scheduleId, {
      lastRun: new Date().toISOString(),
      nextRun,
    });

    logger.info(`scheduleSucceeded: ${scheduleId}`);
    return { success: true, executionId: execution.id, result: runResult };
  } catch (err) {
    logger.error(`scheduleFailed: ${scheduleId} | Error: ${err.message}`);

    if (execution) {
      await executionRepo.update(execution.id, {
        status: 'failed',
        finishedAt: new Date().toISOString(),
        error: err.message,
      });
    }

    const nextRun = getNextRun(schedule.cron);
    await scheduleRepo.updateGlobal(scheduleId, {
      lastRun: new Date().toISOString(),
      nextRun,
    });

    throw err;
  } finally {
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
