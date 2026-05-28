const path = require('path');
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { isProd, openRouterApiKey, port, logLevel } = require('./config/env');
const logger = require('./utils/logger');
const { errorResponse } = require('./utils/response');
const { errorHandler } = require('./middleware/errorHandler');
const { runWithRequestContext } = require('./middleware/requestContext');
const { requireAuth } = require('./middleware/requireAuth');
const { runOwnershipMigration } = require('./db/migrateOwnership');
const { normalizeStorage } = require('./db/normalizeStorage');
const { bootstrapBilling } = require('./db/billingBootstrap');
const { startCreditExpiryScheduler } = require('./services/billing/creditExpiryJob');
const templateService = require('./services/templates/templateService');

const app = express();
const PORT = port;
app.use(runWithRequestContext);
normalizeStorage();
runOwnershipMigration();
bootstrapBilling();
templateService.ensureSeeded();

// ─── Global Request Interceptor (Must be FIRST) ──────────────────────────────
app.use((req, res, next) => {
  const debugLog = require('./utils/debugLogger');
  debugLog("➡️ REQUEST HIT", {
    method: req.method,
    url: req.url,
  });
  logger.info("➡️ REQUEST HIT:", {
    method: req.method,
    url: req.url,
    time: new Date().toISOString(),
  });
  next();
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-bypass-global-toast',
    'X-Bypass-Global-Toast',
    'X-Requested-With',
    'Accept',
  ],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.post(
  '/api/billing/webhook/paystack',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    try {
      req.rawBody = req.body?.toString('utf8') || '';
      req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch (_err) {
      req.body = {};
    }
    next();
  },
  require('./controllers/billingController').paystackWebhook
);

// ─── Request Logging Middleware (Detailed tracing) ────────────────────────────
app.use((req, res, next) => {
  // if (logLevel === 'high') {
  logger.debug(`[REQ] ${req.method} ${req.url}`);
  // }
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.get('/api/billing/config', require('./controllers/billingController').getPublicConfig);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/ai', requireAuth, require('./routes/ai'));
app.use('/api/workflow', requireAuth, require('./routes/workflow'));
app.use('/api/jobs', requireAuth, require('./routes/jobs'));
app.use('/api/documents', requireAuth, require('./routes/documents'));
app.use('/api/profile', requireAuth, require('./routes/profile'));
app.use('/api/email', requireAuth, require('./routes/email'));
app.use('/api/template', requireAuth, require('./routes/templates'));
app.use('/api/document-templates', requireAuth, require('./routes/documentTemplates'));
app.use('/api/recipient', requireAuth, require('./routes/recipients'));
app.use('/api/category', requireAuth, require('./routes/categories'));
app.use('/api/schedule', requireAuth, require('./routes/schedules'));
app.use('/api/audit', requireAuth, require('./routes/audit'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard'));
app.use('/api/smtp', requireAuth, require('./routes/smtp'));
app.use('/api/artifacts', requireAuth, require('./routes/artifacts'));
app.use('/api/suggestions', requireAuth, require('./routes/suggestions'));
app.use('/api/settings', requireAuth, require('./routes/aiSettings'));
app.use('/api/system-templates', requireAuth, require('./routes/systemTemplates'));
app.post(
  '/api/billing/webhook/paystack',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    try {
      req.rawBody = req.body?.toString('utf8') || '';
      req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch (_err) {
      req.body = {};
    }
    next();
  },
  require('./controllers/billingController').paystackWebhook
);
app.use('/api/billing', requireAuth, require('./routes/billing'));
app.use('/api/admin', requireAuth, require('./middleware/requireAdmin').requireAdmin, require('./routes/admin'));

// const { requireAdmin } = require('./middleware/requireAdmin');

// const adminRouter = require('./routes/admin');

// app.use('/api/admin', (req, res, next) => {
//   console.log("🔥 ADMIN ROUTE HIT:", req.method, req.url);
//   next();
// });

// app.use('/api/admin', requireAuth);

// app.use('/api/admin', (req, res, next) => {
//   console.log("🔐 AFTER AUTH:", req.user);
//   next();
// });

// app.use('/api/admin', requireAdmin);

// app.use('/api/admin', adminRouter);

// ─── Static Template Previews ─────────────────────────────────────────────────
app.use('/templates/previews', express.static(path.join(__dirname, 'templates/previews')));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  return errorResponse(res, {
    status: 404,
    message: `Route not found: ${req.method} ${req.path}`,
    errorCode: 'ROUTE_NOT_FOUND',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  startCreditExpiryScheduler();
  logger.info(`\n🚀 Career Bot Server running on http://localhost:${PORT}`);
  logger.info(`📁 Storage: ${path.join(__dirname, 'storage/data')}`);
  logger.info(`🤖 AI: ${openRouterApiKey ? 'OpenRouter connected' : '⚠️  No API key — gracefully failing in dev'}`);
  logger.info(`📧 Email: ${isProd ? 'production' : 'development'} mode\n`);
});

module.exports = app;
