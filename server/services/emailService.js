// services/emailService.js
const nodemailer = require("nodemailer");
const User = require("../models/User.js");
const { decrypt } = require("../utils/encription.js");

const sendEmail = async ({ email, to, subject, body, attachment }) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("user data not found");

    const decryptedPassword = decrypt(user.encryptedAppPassword, user.iv);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: decryptedPassword,
      },
    });

    const mailOptions = {
      from: email,
      to,
      subject,
      html: body,
    };

    if (attachment) {
      mailOptions.attachments = [attachment];
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent to ${to}`);
    return { to, success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    console.error(`❌ Error sending to ${to}: ${error.message}`);
    return { to, success: false, error: error.message };
  }
};

module.exports = sendEmail;
