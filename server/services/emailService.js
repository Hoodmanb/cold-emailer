// services/emailService.js
const nodemailer = require("nodemailer");
const User = require("../models/User.js");
const { decrypt } = require("../utils/encription.js");

const sendEmail = async ({ email, to, subject, body, attachment }) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("user mail password not set");

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
    return { success: true, message: "email sent successfully", results: info.response };
  } catch (error) {
    console.error(`❌ Error sending to ${to}: ${error.message}`);
    return { success: false, message: error.message };
  }
};

module.exports = sendEmail;
