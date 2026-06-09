const nodemailer = require('nodemailer');
const adminSmtpRepo = require('../repositories/adminSmtpRepository');
const commSettingsRepo = require('../repositories/communicationSettingsRepository');
const logger = require('../utils/logger');

const sendFeedbackEmail = async (feedbackData) => {
  try {
    const activeSmtp = adminSmtpRepo.getActiveAdminSmtp();
    const settings = commSettingsRepo.getSettings();

    // Recipient email is the configured support email
    let recipientEmail = settings.supportEmail?.email;
    if (!recipientEmail || !settings.supportEmail?.enabled) {
      // Fallback to ADMIN_EMAIL in environment variables
      recipientEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    }

    if (!activeSmtp) {
      logger.warn('No active Admin SMTP profile configured. Feedback email notification skipped.');
      return { success: false, message: 'SMTP not configured' };
    }

    const decryptedPassword = adminSmtpRepo.getDecryptedPassword(activeSmtp);
    if (!decryptedPassword) {
      logger.warn('Active Admin SMTP configuration password could not be decrypted. Feedback email skipped.');
      return { success: false, message: 'Decryption failed' };
    }

    const transporter = nodemailer.createTransport({
      host: activeSmtp.host,
      port: activeSmtp.port,
      secure: activeSmtp.secure,
      auth: {
        user: activeSmtp.username,
        pass: decryptedPassword,
      },
    });

    const timestampFormatted = new Date(feedbackData.timestamp || new Date()).toLocaleString();

    // Clean HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1f2937;
              background-color: #f9fafb;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #4f46e5;
              color: #ffffff;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
              font-weight: 700;
            }
            .content {
              padding: 24px;
            }
            .field-group {
              margin-bottom: 16px;
              border-bottom: 1px solid #f3f4f6;
              padding-bottom: 12px;
            }
            .field-group:last-child {
              border-bottom: none;
              padding-bottom: 0;
              margin-bottom: 0;
            }
            .label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            }
            .value {
              font-size: 15px;
              color: #111827;
              line-height: 1.5;
            }
            .message-box {
              background-color: #f3f4f6;
              border-radius: 6px;
              padding: 16px;
              white-space: pre-wrap;
              font-size: 14px;
            }
            .footer {
              background-color: #f9fafb;
              color: #9ca3af;
              padding: 16px;
              text-align: center;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Platform Feedback Received</h1>
            </div>
            <div class="content">
              <div class="field-group">
                <div class="label">Subject</div>
                <div class="value" style="font-weight: 600;">${feedbackData.subject}</div>
              </div>
              <div class="field-group">
                <div class="label">Category</div>
                <div class="value">
                  <span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
                    ${feedbackData.category}
                  </span>
                </div>
              </div>
              <div class="field-group">
                <div class="label">User Details</div>
                <div class="value">
                  <strong>Name:</strong> ${feedbackData.userName || 'N/A'}<br>
                  <strong>Email:</strong> ${feedbackData.userEmail}<br>
                  <strong>ID:</strong> ${feedbackData.userId}
                </div>
              </div>
              <div class="field-group">
                <div class="label">Feedback Message</div>
                <div class="value message-box">${feedbackData.message}</div>
              </div>
              ${feedbackData.pageUrl ? `
              <div class="field-group">
                <div class="label">Page URL</div>
                <div class="value" style="font-family: monospace; font-size: 13px;">${feedbackData.pageUrl}</div>
              </div>
              ` : ''}
              ${feedbackData.browserInfo ? `
              <div class="field-group">
                <div class="label">Browser Info</div>
                <div class="value" style="font-size: 13px; color: #4b5563;">${feedbackData.browserInfo}</div>
              </div>
              ` : ''}
              <div class="field-group">
                <div class="label">Submitted At</div>
                <div class="value">${timestampFormatted}</div>
              </div>
            </div>
            <div class="footer">
              This is an automated notification from the Career Automation Platform.
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${feedbackData.userName || 'Platform User'}" <${activeSmtp.username}>`,
      to: recipientEmail,
      subject: `[Feedback - ${feedbackData.category}] ${feedbackData.subject}`,
      html: htmlContent,
      replyTo: feedbackData.userEmail,
    });

    logger.info(`✅ Feedback email notification successfully sent to ${recipientEmail} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Failed to send feedback email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendFeedbackEmail,
};
