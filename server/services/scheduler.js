const Schedule = require("../models/Schedule");
const queueEmail = require("../utils/queue");

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

const runSchedule = async (req, res) => {
  try {
    const accessKey = req.headers["x-cron-key"];

    if (accessKey !== process.env.CRON_ACCESS_KEY) {
      return res.status(403).send("Forbidden: Invalid access key");
    }

    const now = new Date();
    const hour = now.getUTCHours();
    const dayOfWeek = now.getUTCDay();
    const dayOfMonth = now.getUTCDate();

    console.log(
      `🕒 Scheduler triggered at ${now.toISOString()} (UTC Hour: ${hour}, DayOfWeek: ${dayOfWeek}, DayOfMonth: ${dayOfMonth})`
    );

    const schedules = await Schedule.find({ disabled: { $ne: true } });
    const jobsToRun = schedules.filter(
      (job) =>
        (job.frequency === "weekly" &&
          job.day === dayOfWeek &&
          job.hour === hour) ||
        (job.frequency === "monthly" &&
          job.day === dayOfMonth &&
          job.hour === hour)
    );

    if (jobsToRun.length === 0) {
      console.log(`🚫 No schedules to run at this hour.`);
      if (res)
        return res.status(200).json({ message: "No jobs to run at this time" });
      return;
    }

    const queuePromises = jobsToRun.map(async (schedule) => {
      for (const recipient of schedule.recipients || []) {
        if (!recipient || recipient.disabled) continue;

        for (let i = 0; i < statusOrder.length; i++) {
          const key = statusOrder[i];
          const status = recipient.statuses?.[key];

          console.log(`📦 Checking '${key}' for ${recipient.email}: ${status}`);

          if (status === "sent") continue;

          if (status === "void") {
            console.log(
              `🛑 Marking ${recipient.email} as disabled due to void template at ${key}`
            );
            recipient.disabled = true;
            break;
          }

          if (i > 0) {
            const prevKey = statusOrder[i - 1];
            const prevStatus = recipient.statuses?.[prevKey];
            if (prevStatus !== "sent") {
              console.log(
                `⛔ Skipping ${key} for ${recipient.email} — previous '${prevKey}' is '${prevStatus}'`
              );
              break;
            }
          }

          const template = getTemplateByStatusKey(schedule, key);
          if (!template || !template.subject || !template.body) {
            console.warn(
              `❗ Missing subject/body for ${key}. Marking as void.`
            );
            recipient.statuses[key] = "void";
            recipient.disabled = true;
            break;
          }

          try {
            await queueEmail(
              recipient.email,
              template.subject,
              template.body,
              template.attachment || null,
              key,
              schedule._id
            );
            console.log(`📩 Queued email to ${recipient.email} for ${key}`);
          } catch (err) {
            console.error(
              `❌ Queue error for ${recipient.email} [${key}]: ${err.message}`
            );
            recipient.statuses[key] = "failed";
          }

          break; // Send only one stage per run
        }

        // Disable if all statuses are 'sent'
        const allSent = statusOrder.every(
          (k) => recipient.statuses?.[k] === "sent"
        );
        if (allSent) {
          recipient.disabled = true;
          console.log(
            `⚠️ All emails sent to ${recipient.email}, disabling recipient.`
          );
        }
      }

      await schedule.save();
      console.log(`💾 Schedule ${schedule._id} saved`);
    });

    await Promise.allSettled(queuePromises);
    const msg = `✅ Scheduler run completed at ${now.toISOString()}`;
    console.log(msg);
    if (res) return res.status(200).json({ message: msg });
  } catch (err) {
    console.error("💥 Scheduler error:", err);
    if (res)
      return res
        .status(500)
        .json({ message: "Failed to run scheduler", error: err.message });
  }
};

module.exports = runSchedule;
