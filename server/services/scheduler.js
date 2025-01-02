const cron = require('node-cron');
const { sendEmail } = require('./emailService');
const Template = require('../models/Template');
const Recipient = require('../models/Recipient');

const scheduleEmails = () => {
  cron.schedule('0 9 * * *', async () => {
    // Fetch recipients and templates
    const recipients = await Recipient.find().populate('category');
    const template = await Template.findOne(); // Example: fetch first template

    recipients.forEach(async (recipient) => {
      const body = template.body.replace('{{name}}', recipient.name || 'there');
      await sendEmail({ to: recipient.email, subject: template.subject, body });
    });
  });
};

module.exports = { scheduleEmails };