// Test scheduler imports load correctly
try {
  // Set fake env variables to prevent Env validation error during test
  process.env.QSTASH_TOKEN = 'test-token';
  process.env.QSTASH_CURRENT_SIGNING_KEY = 'key1';
  process.env.QSTASH_NEXT_SIGNING_KEY = 'key2';

  const env = require('../config/env');
  console.log('✅ env.js loaded successfully');
  
  const qstashClient = require('../services/qstash/client');
  console.log('✅ qstash/client.js loaded successfully');

  const qstashPublisher = require('../services/qstash/publisher');
  console.log('✅ qstash/publisher.js loaded successfully');

  const qstashVerify = require('../services/qstash/verify');
  console.log('✅ qstash/verify.js loaded successfully');

  const schedulerRepo = require('../modules/scheduler/scheduleRepo');
  console.log('✅ scheduler/scheduleRepo.js loaded successfully');

  const executionRepo = require('../modules/scheduler/executionRepo');
  console.log('✅ scheduler/executionRepo.js loaded successfully');

  const schedulerLock = require('../modules/scheduler/lock');
  console.log('✅ scheduler/lock.js loaded successfully');

  const schedulerRegistry = require('../modules/scheduler/registry');
  console.log('✅ scheduler/registry.js loaded successfully');

  const schedulerValidators = require('../modules/scheduler/validators');
  console.log('✅ scheduler/validators.js loaded successfully');

  const schedulerService = require('../modules/scheduler/service');
  console.log('✅ scheduler/service.js loaded successfully');

  const schedulerController = require('../modules/scheduler/controller');
  console.log('✅ scheduler/controller.js loaded successfully');

  const schedulerRoutes = require('../modules/scheduler/routes');
  console.log('✅ scheduler/routes.js loaded successfully');

  console.log('\n🎉 ALL SCHEDULER IMPORTS LOADED SUCCESSFULLY WITHOUT ERRORS!');
  process.exit(0);
} catch (err) {
  console.error('❌ Failed loading scheduler components:', err);
  process.exit(1);
}
