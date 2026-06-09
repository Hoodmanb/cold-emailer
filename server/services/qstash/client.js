const { Client } = require('@upstash/qstash');
const env = require('../../config/env');

if (env.schedulerEnabled && !env.qstashToken) {
  throw new Error('QStash client initialization failed: QStASH_TOKEN is required');
}

const qstash = new Client({
  token: env.qstashToken || 'placeholder-for-startup-if-disabled',
  baseUrl: env.qstashUrl || 'https://qstash.upstash.io',
});

module.exports = qstash;
