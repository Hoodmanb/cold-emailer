/** Strip secret fields from SMTP row for API responses. */
function sanitizeSmtp(smtp) {
  const { appPassword, iv, ...safeSmtp } = smtp;
  return safeSmtp;
}

module.exports = { sanitizeSmtp };
