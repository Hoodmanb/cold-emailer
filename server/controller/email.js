// controllers/emailController.js
const sendEmail = require("../services/emailService");

async function sendEmails(email, template, emails) {
  try {
    if (!template.subject || !template.body) {
      throw new Error("missing required field");
    }

    const emailPromises = emails.map((to) =>
      sendEmail({
        email,
        to,
        subject: template.subject,
        body: template.body,
        attachment: template.attachment || null,
      })
    );

    const results = await Promise.all(emailPromises);

    return {
      success: true,
      message: "Emails processed",
      results,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  sendEmails,
};
