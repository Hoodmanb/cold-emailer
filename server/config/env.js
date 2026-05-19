const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  port: process.env.PORT || 9000,
  logLevel: process.env.LOG_LEVEL || 'medium',
};
