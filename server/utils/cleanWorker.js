const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis("redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

const emailQueue = new Queue("emailQueue", { connection });

(async () => {
  // Remove completed jobs older than 0 milliseconds (i.e. everything)
  await emailQueue.clean(0, 1000, "completed");

  // Remove failed jobs too
  await emailQueue.clean(0, 1000, "failed");

  // Also remove delayed & waiting jobs
  await emailQueue.obliterate({ force: true });

  console.log("🧼 Queue cleared!");
  process.exit(0);
})();
