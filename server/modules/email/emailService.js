const nodemailer = require('nodemailer');
const smtpRepo = require('../../repositories/smtpRepository');
const logger = require('../../utils/logger');
const { buildMailAttachments } = require('./artifactMail');
const { buildDocumentAttachments } = require('./documentAttachmentMail');
const { recordSendContext } = require('../../services/contextUsageService');
const { getCurrentUserId } = require('../../middleware/requestContext');
const { getProfile } = require('../../repositories/profileRepository');
const { fillPlaceholders } = require('../../utils/placeholderParser');

/**
 * Send an email using the user's configured Gmail SMTP.
 * Credentials are read from user.json and decrypted on-the-fly.
 */
const sendEmail = async (payload) => {
  const { to, subject, body, templateId, userId } = payload;
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

    // Safe variable interpolation for email body and subject without Handlebars
    const currentUserId = userId || getCurrentUserId();
    let finalSubject = subject;
    let finalBody = body;

    if (currentUserId) {
      try {
        const profile = await getProfile(currentUserId);
        const interpolationData = {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || profile.phoneNumber || '',
          location: profile.location || '',
          ...profile
        };
        finalSubject = fillPlaceholders(subject, interpolationData);
        finalBody = fillPlaceholders(body, interpolationData);
      } catch (_err) {
        logger.warn('[emailService] failed to fetch profile for placeholder interpolation', _err.message);
      }
    }

    const mailOptions = {
      from: config.email,
      to,
      subject: finalSubject,
      html: finalBody,
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
