const Schedule = require('../models/Schedule');
const sendEmail = require('./emailService');

// Helper to get the correct template for the current round
const getTemplateByRound = (job) => {
  switch (job.round) {
    case 0:
      return job.template;
    case 1:
      return job.templateOne;
    case 2:
      return job.templateTwo;
    case 3:
      return job.templateThree;
    default:
      return null;
  }
};

// Helper to determine the last available round based on which optional templates are filled
const getLastTemplateRound = (job) => {
  const templates = [job.templateOne, job.templateTwo, job.templateThree];
  let lastRound = 0;

  templates.forEach((tpl, index) => {
    if (tpl && tpl.subject && tpl.body) {
      lastRound = index + 1;
    }
  });

  return lastRound;
};

const runSchedule = async (req, res) => {
  try {
    const currentUTC = new Date();
    const hour = currentUTC.getUTCHours();
    const dayOfWeek = currentUTC.getUTCDay();
    const dayOfMonth = currentUTC.getUTCDate();

    const schedules = await Schedule.find({ disabled: { $ne: true } });

    const jobsToSend = schedules.filter((job) => {
      return (
        (job.frequency === 'weekly' && job.day === dayOfWeek && job.hour === hour) ||
        (job.frequency === 'monthly' && job.day === dayOfMonth && job.hour === hour)
      );
    });

    const emailPromises = jobsToSend.map(async (job) => {
      const template = getTemplateByRound(job);

      if (!template || !template.subject || !template.body) {
        console.warn(`❗ Skipping job: Missing template for round ${job.round}`);
        job.failed += 1;
        await job.save();
        return Promise.reject(new Error('Template missing'));
      }

      try {
        await sendEmail({
          to: job.recipients.join(','),
          subject: template.subject,
          body: template.body,
          attachment: template.attachment || null
        });

        job.successful += 1;

        const lastRound = getLastTemplateRound(job);
        if (job.round >= lastRound) {
          job.disabled = true;
        } else {
          job.round += 1;
        }

        await job.save();
        return Promise.resolve();
      } catch (err) {
        job.failed += 1;
        await job.save();
        return Promise.reject(err);
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    const message = `📨 Email job complete. Sent: ${successful}, Failed: ${failed}`;
    console.log(message);

    if (res) {
      return res.status(200).json({ message, sent: successful, failed });
    }
  } catch (error) {
    console.error('❌ Error running scheduleEmails:', error);
    if (res) {
      return res.status(500).json({
        message: 'Error running scheduled emails',
        error: error.message || error,
      });
    }
  }
};

module.exports = runSchedule;
