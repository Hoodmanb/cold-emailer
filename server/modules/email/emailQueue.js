/**
 * Adapter module for Email Queue redirection.
 * Decorates the new single source-of-truth sequential dispatch queue
 * under infrastructure/queue/emailQueue.js to maintain backward compatibility.
 */
const queueEngine = require('../../infrastructure/queue/emailQueue');

module.exports = {
  enqueue: queueEngine.enqueue,
  enqueueAsync: queueEngine.enqueueAsync,
  getQueueLength: queueEngine.getQueueLength,
  isQueueProcessing: queueEngine.isQueueProcessing
};
