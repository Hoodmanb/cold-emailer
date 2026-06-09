const { Receiver } = require('@upstash/qstash');
const env = require('../../config/env');
const logger = require('../../utils/logger');

let receiver = null;

if (env.qstashCurrentSigningKey && env.qstashNextSigningKey) {
  receiver = new Receiver({
    currentSigningKey: env.qstashCurrentSigningKey,
    nextSigningKey: env.qstashNextSigningKey,
  });
}

/**
 * Express middleware that verifies the Upstash webhook signature.
 * If verification fails, responds with 401 and logs the event.
 */
async function qstashVerify(req, res, next) {
  const signature = req.headers['upstash-signature'];
  
  if (!signature) {
    logger.warn('webhookRejected: missing Upstash-Signature header');
    return res.status(401).json({ success: false, message: 'Missing Upstash-Signature header' });
  }

  // Allow bypass in local development if QStash signing keys are not configured
  if (env.isDev && !receiver) {
    logger.warn('webhookVerified: Bypassing signature verification in development mode (no keys configured)');
    return next();
  }

  if (!receiver) {
    logger.error('webhookRejected: signing keys are not configured');
    return res.status(500).json({ success: false, message: 'QStash signing keys are not configured on the server' });
  }

  // Raw body must be verified as a string
  const rawBody = req.rawBody || '';
  
  try {
    const isValid = await receiver.verify({
      body: rawBody,
      signature: signature,
    });

    if (!isValid) {
      logger.warn('webhookRejected: signature verification failed');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    logger.info('webhookVerified');
    next();
  } catch (err) {
    logger.error(`webhookRejected: verification error: ${err.message}`);
    res.status(401).json({ success: false, message: `Signature verification error: ${err.message}` });
  }
}

module.exports = { qstashVerify };
