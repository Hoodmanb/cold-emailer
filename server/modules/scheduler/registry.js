const logger = require('../../utils/logger');
const { sendEmail } = require('../email/emailService');
const { runScheduler } = require('../email/scheduler');
const { runAtsOnly, generateSelectedDocuments } = require('../../services/workflow/jobWorkflowService');
const { getProfile } = require('../../repositories/profileRepository');
const emailRepo = require('../../repositories/emailRepository');

const registry = {};

/**
 * Register a handler for a given job type.
 * @param {string} type
 * @param {Function} handler - async function(schedule, context)
 */
function register(type, handler) {
  if (typeof handler !== 'function') {
    throw new Error(`Handler for type ${type} must be a function`);
  }
  registry[type] = handler;
}

/**
 * Retrieve a registered handler.
 * @param {string} type
 * @returns {Function|null}
 */
function getHandler(type) {
  return registry[type] || null;
}

/**
 * Get list of all registered types.
 * @returns {string[]}
 */
function getTypes() {
  return Object.keys(registry);
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler Implementations with Idempotency Protection
// ─────────────────────────────────────────────────────────────────────────────

// 1. job-search handler
register('job-search', async (schedule) => {
  logger.info(`[Scheduler] Executing job-search for schedule ${schedule.id}`);
  // Mocks job search logic or calls any external APIs.
  return { success: true, jobsFound: 0, message: 'Job search executed successfully (mock)' };
});

// 2. resume-generation handler
register('resume-generation', async (schedule) => {
  logger.info(`[Scheduler] Executing resume-generation for schedule ${schedule.id}`);
  const { jobId, tailoringLevel } = schedule.payload || {};
  if (!jobId) {
    throw new Error('jobId is required in payload for resume-generation');
  }

  const profile = await getProfile(schedule.userId);
  if (!profile || (!profile.name && !profile.summary)) {
    throw new Error('Profile is incomplete – cannot generate resume');
  }

  const result = await generateSelectedDocuments({
    jobId,
    profile,
    types: ['resume'],
    tailoringLevel: tailoringLevel || 'medium',
  });

  return { success: result.success !== false, data: result };
});

// 3. cover-letter-generation handler
register('cover-letter-generation', async (schedule) => {
  logger.info(`[Scheduler] Executing cover-letter-generation for schedule ${schedule.id}`);
  const { jobId, tailoringLevel } = schedule.payload || {};
  if (!jobId) {
    throw new Error('jobId is required in payload for cover-letter-generation');
  }

  const profile = await getProfile(schedule.userId);
  if (!profile || (!profile.name && !profile.summary)) {
    throw new Error('Profile is incomplete – cannot generate cover letter');
  }

  const result = await generateSelectedDocuments({
    jobId,
    profile,
    types: ['cover-letter'],
    tailoringLevel: tailoringLevel || 'medium',
  });

  return { success: result.success !== false, data: result };
});

// 4. ats-analysis handler
register('ats-analysis', async (schedule) => {
  logger.info(`[Scheduler] Executing ats-analysis for schedule ${schedule.id}`);
  const { jobId } = schedule.payload || {};
  if (!jobId) {
    throw new Error('jobId is required in payload for ats-analysis');
  }

  const profile = await getProfile(schedule.userId);
  const result = await runAtsOnly({ jobId, profile });
  return { success: true, atsScore: result.atsScore, data: result };
});

// 5. cold-email-send handler (with strict idempotency check)
register('cold-email-send', async (schedule) => {
  logger.info(`[Scheduler] Executing cold-email-send for schedule ${schedule.id}`);
  const { to, subject, body, jobId, templateId } = schedule.payload || {};
  if (!to || !subject || !body) {
    throw new Error('to, subject, and body are required in payload for cold-email-send');
  }

  // Idempotency: Check if an email has already been sent to this recipient for this schedule
  const userId = schedule.userId;
  const sentEmails = (await emailRepo.listEmails({ jobId, userId })) || [];
  const alreadySent = sentEmails.some(
    (e) => e.to.toLowerCase() === to.toLowerCase() && 
           e.subject === subject && 
           e.scheduleId === schedule.id && 
           e.status === 'sent'
  );

  if (alreadySent) {
    logger.warn(`[Scheduler] Idempotency block: Email already sent to ${to} for schedule ${schedule.id}. Skipping.`);
    return { success: true, message: 'Email already sent (idempotency skip)' };
  }

  const emailRecord = await emailRepo.saveEmail({
    jobId: jobId || null,
    scheduleId: schedule.id, // Store schedule ID in email record
    to,
    subject,
    body,
    status: 'approved', // Pre-approve to allow direct sending
  }, userId);

  const result = await sendEmail({
    to,
    subject,
    body,
    templateId,
  });

  if (result.success) {
    await emailRepo.markSent(emailRecord.id, result, userId);
    return { success: true, messageId: result.messageId };
  } else {
    await emailRepo.updateEmail(emailRecord.id, { status: 'failed', sendResult: result }, userId);
    throw new Error(result.message || 'SMTP delivery failed');
  }
});

// 6. follow-up-email handler (with strict idempotency check)
register('follow-up-email', async (schedule) => {
  logger.info(`[Scheduler] Executing follow-up-email for schedule ${schedule.id}`);
  const { to, subject, body, jobId, templateId } = schedule.payload || {};
  if (!to || !subject || !body) {
    throw new Error('to, subject, and body are required in payload for follow-up-email');
  }

  // Idempotency: Check if an email has already been sent to this recipient for this schedule
  const userId = schedule.userId;
  const sentEmails = (await emailRepo.listEmails({ jobId, userId })) || [];
  const alreadySent = sentEmails.some(
    (e) => e.to.toLowerCase() === to.toLowerCase() && 
           e.subject === subject && 
           e.scheduleId === schedule.id && 
           e.status === 'sent'
  );

  if (alreadySent) {
    logger.warn(`[Scheduler] Idempotency block: Follow-up already sent to ${to} for schedule ${schedule.id}. Skipping.`);
    return { success: true, message: 'Follow-up already sent (idempotency skip)' };
  }

  const emailRecord = await emailRepo.saveEmail({
    jobId: jobId || null,
    scheduleId: schedule.id,
    to,
    subject,
    body,
    status: 'approved',
  }, userId);

  const result = await sendEmail({
    to,
    subject,
    body,
    templateId,
  });

  if (result.success) {
    await emailRepo.markSent(emailRecord.id, result, userId);
    return { success: true, messageId: result.messageId };
  } else {
    await emailRepo.updateEmail(emailRecord.id, { status: 'failed', sendResult: result }, userId);
    throw new Error(result.message || 'SMTP delivery failed');
  }
});

// 7. campaign-execution handler (inherently idempotent due to campaign status flags)
register('campaign-execution', async (schedule) => {
  logger.info(`[Scheduler] Executing campaign drip execution for schedule ${schedule.id}`);
  const result = await runScheduler();
  return { success: true, ...result };
});

module.exports = {
  register,
  getHandler,
  getTypes,
};
