const sendEmail = require("../services/emailService");

async function sendEmails(email, recipients) {
  try {
    const emailPromises = recipients.map((recipient, index) => {
      if (!recipient.to || !recipient.subject || !recipient.body) {
        throw new Error(`all fields are required`);
      }
      return sendEmail({
        email,
        to: recipient.to,
        subject: recipient.subject,
        body: recipient.body,
      });
    });

    await Promise.all(emailPromises);
    return { success: true, message: "All emails sent successfully!" };
  } catch (error) {
    return { success: false, error };
  }
}

module.exports = {
  sendEmails,
};
