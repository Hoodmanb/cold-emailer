const billingService = require('./billingService');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
let intervalRef = null;

function runCreditExpiryJob() {
  try {
    const updated = billingService.expireOldCredits();
    if (updated > 0) {
      console.log(`[billing] Expired credits for ${updated} user(s)`);
    }
  } catch (err) {
    console.error('[billing] Credit expiry job failed:', err.message);
  }
}

function startCreditExpiryScheduler() {
  runCreditExpiryJob();
  if (intervalRef) clearInterval(intervalRef);
  intervalRef = setInterval(runCreditExpiryJob, ONE_DAY_MS);
}

module.exports = {
  runCreditExpiryJob,
  startCreditExpiryScheduler,
};
