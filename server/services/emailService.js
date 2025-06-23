const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, body, attachment }) => {
  const mailOptions = {
    from: `"Cold Email App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: body,
  };

  if (attachment) {
    mailOptions.attachments = [attachment];
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Error sending to ${to}: ${err.message}`);
    throw err;
  }
};

module.exports = sendEmail;
