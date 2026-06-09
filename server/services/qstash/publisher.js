const qstash = require('./client');
const env = require('../../config/env');

// Construct the public callback webhook URL that QStash will invoke
const getWebhookUrl = () => {
  return `${env.appUrl}/api/webhooks/qstash`;
};

/**
 * Publish a new job (one-off or recurring) to QStash.
 * @param {Object} schedule - schedule definition from scheduleRepo
 * @param {string} schedule.id - internal UUID
 * @param {string} schedule.type - job type (ats-analysis, etc.)
 * @param {Object} schedule.payload - payload data passed to handler
 * @param {string} [schedule.cron] - optional cron expression
 * @returns {Promise<Object>} - { qstashMessageId, qstashScheduleId }
 */
async function publishJob(schedule) {
  const webhookUrl = getWebhookUrl();
  const body = {
    scheduleId: schedule.id,
    type: schedule.type,
    payload: schedule.payload,
  };

  if (schedule.cron) {
    // Recurring schedule using QStash schedules API
    const result = await qstash.schedules.create({
      scheduleId: schedule.id, // Custom schedule ID to allow easy management and updates
      destination: webhookUrl,
      cron: schedule.cron,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return {
      qstashScheduleId: result.scheduleId || schedule.id,
      qstashMessageId: null,
    };
  } else {
    // One-off message published directly
    const result = await qstash.publishJSON({
      url: webhookUrl,
      body: body,
    });
    return {
      qstashScheduleId: null,
      qstashMessageId: result.messageId,
    };
  }
}

/**
 * Cancel a pending one-off job or delete a recurring schedule from QStash.
 * @param {Object} schedule
 */
async function cancelJob(schedule) {
  if (schedule.qstashScheduleId) {
    await qstash.schedules.delete(schedule.qstashScheduleId);
  } else if (schedule.qstashMessageId) {
    await qstash.delete(schedule.qstashMessageId);
  }
  return true;
}

/**
 * Pause a recurring schedule.
 * @param {string} qstashScheduleId
 */
async function pauseJob(qstashScheduleId) {
  if (!qstashScheduleId) {
    throw new Error('QStash schedule ID required to pause');
  }
  await qstash.schedules.pause({ schedule: qstashScheduleId });
  return true;
}

/**
 * Resume a recurring schedule.
 * @param {string} qstashScheduleId
 */
async function resumeJob(qstashScheduleId) {
  if (!qstashScheduleId) {
    throw new Error('QStash schedule ID required to resume');
  }
  await qstash.schedules.resume({ schedule: qstashScheduleId });
  return true;
}

module.exports = {
  publishJob,
  cancelJob,
  pauseJob,
  resumeJob,
};
