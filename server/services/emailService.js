const nodemailer = require("nodemailer");
const User = require("../models/User.js");
const { decrypt } = require("../utils/encription.js");

const sendEmail = async (email, to, subject, body, attachment) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("user data not found");

    const decryptedPassword = decrypt(user.encryptedAppPassword, user.iv);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
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

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending to ${to}: ${err.message}`);
    throw err;
  }
};

module.exports = sendEmail;
