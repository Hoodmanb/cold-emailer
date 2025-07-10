const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const connection = require("../lib/redis")

const emailQueue = new Queue("emailQueue", { connection });

async function enqueueEmail(to, subject, body, attachment, key, scheduleId) {
  const jobId = `${to}-${key}`;
  await emailQueue.add(
    "sendEmail",
    {
      to,
      subject,
      body,
      attachment,
      key,
      sender,
      scheduleId,
    },
    {
      attempts: 3, // Retry up to 3 times on failure
      backoff: 5000, // Wait 5 seconds before retrying
    }
  );
}

module.exports = enqueueEmail;
