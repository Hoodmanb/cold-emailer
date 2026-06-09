const nodemailer = require('nodemailer');
const smtpRepo = require('../../repositories/smtpRepository');
const logger = require('../../utils/logger');
const { buildMailAttachments } = require('./artifactMail');
const { buildDocumentAttachments } = require('./documentAttachmentMail');
const { recordSendContext } = require('../../services/contextUsageService');

/**
 * Send an email using the user's configured Gmail SMTP.
 * Credentials are read from user.json and decrypted on-the-fly.
 */
const sendEmail = async (payload) => {
  const { to, subject, body, templateId } = payload;
  try {
    const config = smtpRepo.getActiveSmtp();

    if (!config) {
      throw new Error('No active SMTP configuration found. Please set a default SMTP in Settings.');
    }

    if (!config.appPassword) {
      throw new Error('Active SMTP configuration is missing the password.');
    }

    const decryptedPassword = smtpRepo.getDecryptedPassword(config);
    if (!decryptedPassword) {
      throw new Error('Active SMTP credentials are invalid or corrupted. Please re-save the SMTP password.');
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.email,
        pass: decryptedPassword,
      },
    });

    const mailAttachments = [
      ...buildMailAttachments(payload),
      ...(await buildDocumentAttachments(payload)),
    ];

    const mailOptions = {
      from: config.email,
      to,
      subject,
      html: body,
    };

    if (mailAttachments.length > 0) {
      mailOptions.attachments = mailAttachments;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Email sent to ${to}: ${info.messageId}`);
    recordSendContext({
      to,
      templateId: templateId && String(templateId).trim() ? String(templateId).trim() : undefined,
      smtpId: config.id,
    });
    return { success: true, message: 'Email sent successfully', messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Email send failed to ${to}: ${error.message}`);
    return { success: false, message: error.message };
  }
};

module.exports = { sendEmail };
