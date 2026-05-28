/**
 * Unified Hardened Sequential Dispatch Queue
 * Implements Concurrency=1, progressive retry delays,
 * and dead-letter handling boundaries.
 */
const { sendEmail } = require('../../modules/email/emailService');
const logger = require('../../utils/logger');

const queue = [];
let isProcessing = false;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    let attempts = 0;
    let success = false;
    let lastError = null;

    logger.info(`[EmailQueue] Processing sequential dispatch to: ${job.payload.to}`);

    while (attempts < MAX_RETRIES) {
      attempts++;
      try {
        const result = await sendEmail(job.payload);
        if (result && result.success) {
          success = true;
          logger.info(`[EmailQueue] Successfully dispatched email to ${job.payload.to} on attempt ${attempts}`);
          if (job.onSuccess) job.onSuccess(result);
          break;
        } else {
          throw new Error(result?.message || 'SMTP transport returned failed status');
        }
      } catch (err) {
        lastError = err;
        logger.error(`[EmailQueue] Attempt ${attempts}/${MAX_RETRIES} failed for ${job.payload.to}: ${err.message}`);
        
        if (attempts < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempts;
          logger.info(`[EmailQueue] Sleeping for ${delay}ms before retrying...`);
          await sleep(delay);
        }
      }
    }

    if (!success) {
      logger.error(`[EmailQueue] 💥 Dead-Letter trigger: Dispatch permanently failed to ${job.payload.to} after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
      if (job.onFailure) job.onFailure(lastError);
    }

    // Cooldown interval between pops
    if (queue.length > 0) {
      await sleep(500);
    }
  }

  isProcessing = false;
};

const enqueue = (payload, onSuccess, onFailure) => {
  queue.push({ payload, onSuccess, onFailure });
  processQueue();
};

const enqueueAsync = (payload) => {
  return new Promise((resolve) => {
    enqueue(
      payload,
      (result) => resolve({ ...result, success: true }),
      (err) => resolve({ success: false, message: err.message })
    );
  });
};

const getQueueLength = () => queue.length;
const isQueueProcessing = () => isProcessing;

module.exports = {
  enqueue,
  enqueueAsync,
  getQueueLength,
  isQueueProcessing
};
