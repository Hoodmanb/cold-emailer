require("dotenv").config();
const connectDB = require("./utils/db");
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const Schedule = require("./models/Schedule");
const sendEmail = require("./services/emailService");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const statusOrder = [
  "scheduleOne",
  "scheduleTwo",
  "scheduleThree",
  "scheduleFour",
];

const getTemplateByStatusKey = (schedule, key) => {
  switch (key) {
    case "scheduleOne":
      return schedule.template;
    case "scheduleTwo":
      return schedule.templateOne;
    case "scheduleThree":
      return schedule.templateTwo;
    case "scheduleFour":
      return schedule.templateThree;
    default:
      return null;
  }
};

const startWorker = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected in worker");

    const worker = new Worker(
      "emailQueue",
      async (job) => {
        const { to, subject, body, attachment, key, sender, scheduleId } =
          job.data;

        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) throw new Error("Schedule not found");

        const recipient = schedule.recipients.find((r) => r.email === to);
        if (!recipient) throw new Error("Recipient not found");

        const status = recipient.statuses?.[key];

        if (status === "sent") return;
        if (status === "void") {
          recipient.disabled = true;
          await schedule.save();
          return;
        }

        const index = statusOrder.indexOf(key);
        if (index > 0) {
          const prevKey = statusOrder[index - 1];
          if (recipient.statuses?.[prevKey] !== "sent") return;
        }

        const template = getTemplateByStatusKey(schedule, key);
        if (!template || !template.subject || !template.body) {
          recipient.statuses[key] = "failed";
          // recipient.disabled = true;
          await schedule.save();
          return;
        }

        try {
          await sendEmail({ sender, to, subject, body, attachment });
          recipient.statuses[key] = "sent";
        } catch (err) {
          console.error(`❌ Error sending to ${to}: ${err.message}`);
          recipient.statuses[key] = "failed";
        }

        const allSent = statusOrder.every(
          (k) => recipient.statuses?.[k] === "sent"
        );
        if (allSent) recipient.disabled = true;

        await schedule.save();
        console.log(`📬 Updated status for ${to} → ${recipient.statuses[key]}`);

        await job.remove();
      },
      { connection }
    );

    console.log("👷 Worker is running...");
  } catch (err) {
    console.error("❌ Worker startup failed:", err.message);
  }
};

startWorker();
