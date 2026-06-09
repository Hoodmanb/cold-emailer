const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const schedulerEnabled = process.env.SCHEDULER_ENABLED !== 'false';

if (schedulerEnabled) {
  const missing = [];
  if (!process.env.QSTASH_TOKEN) missing.push('QSTASH_TOKEN');
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY) missing.push('QSTASH_CURRENT_SIGNING_KEY');
  if (!process.env.QSTASH_NEXT_SIGNING_KEY) missing.push('QSTASH_NEXT_SIGNING_KEY');

  if (missing.length > 0) {
    throw new Error(`Fatal Startup Error: QStash Scheduler is enabled but missing required environment variables: ${missing.join(', ')}. Set SCHEDULER_ENABLED=false to bypass in development.`);
  }
}

module.exports = {
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  port: process.env.PORT || 9000,
  logLevel: process.env.LOG_LEVEL || 'medium',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  adminEmail: process.env.ADMIN_EMAIL,
  
  // QStash configuration
  schedulerEnabled,
  qstashToken: process.env.QSTASH_TOKEN,
  qstashUrl: process.env.QSTASH_URL || 'https://qstash.upstash.io',
  qstashCurrentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  qstashNextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 9000}`,
};

