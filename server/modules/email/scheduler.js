const { listSchedules, saveSchedule } = require('../../repositories/scheduleRepository');
const { enqueue } = require('./emailQueue');
const logger = require('../../utils/logger');

const STATUS_ORDER = ['scheduleOne', 'scheduleTwo', 'scheduleThree', 'scheduleFour'];

const getTemplateByKey = (schedule, key) => {
  const map = {
    scheduleOne: schedule.template,
    scheduleTwo: schedule.templateOne,
    scheduleThree: schedule.templateTwo,
    scheduleFour: schedule.templateThree,
  };
  return map[key] || null;
};

/**
 * Run all due schedules.
 * Called by the /api/schedule/run endpoint (cron-triggered).
 */
const runScheduler = async () => {
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay();
  const dayOfMonth = now.getUTCDate();

  logger.info(`🕒 Scheduler triggered at ${now.toISOString()} (UTC Hour: ${hour})`);

  const schedules = listSchedules().filter((s) => !s.disabled);

  const dueSchedules = schedules.filter(
    (s) =>
      (s.frequency === 'weekly' && s.day === dayOfWeek && s.hour === hour) ||
      (s.frequency === 'monthly' && s.day === dayOfMonth && s.hour === hour)
  );

  if (dueSchedules.length === 0) {
    logger.info('🚫 No schedules due at this time.');
    return { ran: 0 };
  }

  let totalQueued = 0;

  for (const schedule of dueSchedules) {
    for (const recipient of schedule.recipients || []) {
      if (!recipient || recipient.disabled) continue;

      for (let i = 0; i < STATUS_ORDER.length; i++) {
        const key = STATUS_ORDER[i];
        const status = recipient.statuses?.[key];

        if (status === 'sent') continue;
        if (status === 'void') {
          recipient.disabled = true;
          break;
        }

        // Ensure previous stage is sent before sending next
        if (i > 0) {
          const prevKey = STATUS_ORDER[i - 1];
          if (recipient.statuses?.[prevKey] !== 'sent') break;
        }

        const template = getTemplateByKey(schedule, key);
        if (!template?.subject || !template?.body) {
          recipient.statuses[key] = 'void';
          recipient.disabled = true;
          break;
        }

        enqueue(
          {
            to: recipient.email,
            subject: template.subject,
            body: template.body,
            attachment: template.attachment || null,
          },
          () => {
            recipient.statuses[key] = 'sent';
            saveSchedule(schedule);
            logger.info(`✅ Sent ${key} to ${recipient.email}`);
          },
          (err) => {
            recipient.statuses[key] = 'failed';
            saveSchedule(schedule);
            logger.error(`❌ Failed ${key} to ${recipient.email}: ${err.message}`);
          }
        );

        totalQueued++;
        break; // One stage per run
      }

      // Disable if all stages sent
      const allSent = STATUS_ORDER.every((k) => recipient.statuses?.[k] === 'sent');
      if (allSent) recipient.disabled = true;
    }

    saveSchedule(schedule);
  }

  logger.info(`✅ Scheduler complete. Queued ${totalQueued} emails.`);
  return { ran: dueSchedules.length, queued: totalQueued };
};

module.exports = { runScheduler };
