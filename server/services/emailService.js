const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, body }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Cold Email App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: body,
  });
};

module.exports = sendEmail;
