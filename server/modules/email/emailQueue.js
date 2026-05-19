const { sendEmail } = require('./emailService');
const logger = require('../../utils/logger');

/**
 * Simple in-process async email queue.
 * Replaces BullMQ/Redis with a lightweight FIFO queue.
 * Concurrency = 1 (emails are sent one at a time to avoid rate limits).
 */

const queue = [];
let isProcessing = false;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process the queue sequentially.
 */
const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;
      try {
        const result = await sendEmail(job.payload);
        if (result.success) {
          if (job.onSuccess) job.onSuccess(result);
          break;
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        logger.error(`[EmailQueue] Attempt ${attempts}/${MAX_RETRIES} failed for ${job.payload.to}: ${err.message}`);
        if (attempts < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempts);
        } else {
          if (job.onFailure) job.onFailure(err);
        }
      }
    }

    // Small delay between emails
    if (queue.length > 0) await sleep(500);
  }

  isProcessing = false;
};

/**
 * Enqueue an email for sending.
 * @param {object} payload - { to, subject, body, attachment }
 * @param {function} onSuccess - Callback on success
 * @param {function} onFailure - Callback on failure
 */
const enqueue = (payload, onSuccess, onFailure) => {
  queue.push({ payload, onSuccess, onFailure });
  processQueue(); // Start processing if not already running
};

/**
 * Enqueue and await the result (promise-based).
 */
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

module.exports = { enqueue, enqueueAsync, getQueueLength, isQueueProcessing };
