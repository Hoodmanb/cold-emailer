const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const adminController = require('../controllers/adminController');

const router = express.Router();

// ─── Gateway ───────────────────────────────────────────────────────────────
router.get('/gateway', asyncHandler(adminController.getGatewayConfig));
router.put('/gateway', asyncHandler(adminController.updateGatewayConfig));

// ─── Credit Packs ──────────────────────────────────────────────────────────
router.get('/credit-packs', asyncHandler(adminController.getCreditPacksAdmin));
router.post('/credit-packs', asyncHandler(adminController.createCreditPackAdmin));
router.put('/credit-packs/:packId', asyncHandler(adminController.updateCreditPackAdmin));

// ─── Users ─────────────────────────────────────────────────────────────────
router.get('/users', asyncHandler(adminController.listUsersAdmin));
router.get('/users/:userId/billing', asyncHandler(adminController.getUserBillingAdmin));
router.post('/users/:userId/grant-credits', asyncHandler(adminController.grantCreditsAdmin));
router.post('/users/:userId/revoke-credits', asyncHandler(adminController.revokeCreditsAdmin));
router.post('/users/:userId/extend-gateway', asyncHandler(adminController.extendGatewayAdmin));
router.post('/users/:userId/revoke-gateway', asyncHandler(adminController.revokeGatewayAdmin));
router.put('/users/:userId/billing-type', asyncHandler(adminController.setUserBillingTypeAdmin));
router.post('/users/:userId/adjust-wallet', asyncHandler(adminController.adjustWalletAdmin));

// ─── Transactions ──────────────────────────────────────────────────────────
router.get('/transactions', asyncHandler(adminController.listTransactionsAdmin));

// ─── Billing Settings ──────────────────────────────────────────────────────
router.get('/billing/settings', asyncHandler(adminController.getBillingSettingsAdmin));
router.put('/billing/settings', asyncHandler(adminController.updateBillingSettingsAdmin));
router.get('/billing/config', asyncHandler(adminController.getBillingSettingsAdmin));
router.put('/billing/config', asyncHandler(adminController.updateBillingSettingsAdmin));
router.get('/billing/model-catalog', asyncHandler(adminController.getBillingModelCatalogAdmin));
router.post('/billing/model-catalog/verify', asyncHandler(adminController.verifyModelCatalogAdmin));
router.post('/billing/model-catalog/models', asyncHandler(adminController.addModelCatalogAdmin));
router.delete('/billing/model-catalog/models', asyncHandler(adminController.removeModelCatalogAdmin));

// ─── Model Pricing ─────────────────────────────────────────────────────────
router.get('/pricing', asyncHandler(adminController.listModelPricingAdmin));
router.post('/pricing', asyncHandler(adminController.createModelPricingAdmin));
router.put('/pricing/:pricingId', asyncHandler(adminController.updateModelPricingAdmin));

// ─── Usage Logs & Analytics ────────────────────────────────────────────────
router.get('/billing/usage-logs', asyncHandler(adminController.getUsageLogsAdmin));
router.get('/billing/analytics', asyncHandler(adminController.getBillingAnalyticsAdmin));

// ─── Communication Settings & SMTP Profiles ───────────────────────────────
const adminCommController = require('../controllers/adminCommunicationController');
router.get('/communication', asyncHandler(adminCommController.getCommunicationSettings));
router.put('/communication/settings', asyncHandler(adminCommController.updateCommunicationSettings));
router.post('/communication/smtp', asyncHandler(adminCommController.createSmtpProfile));
router.put('/communication/smtp/:id', asyncHandler(adminCommController.updateSmtpProfile));
router.delete('/communication/smtp/:id', asyncHandler(adminCommController.deleteSmtpProfile));
router.post('/communication/smtp/:id/test', asyncHandler(adminCommController.testSmtpConnection));
router.post('/communication/smtp/:id/set-active', asyncHandler(adminCommController.setActiveSmtpProfile));

// ─── Feedback Management ──────────────────────────────────────────────────
const feedbackController = require('../controllers/feedbackController');
router.get('/feedback', asyncHandler(feedbackController.listFeedbackAdmin));
router.patch('/feedback/:id/status', asyncHandler(feedbackController.updateFeedbackStatusAdmin));

// ─── Document Templates Moderation ──────────────────────────────────────────
const docTplCtrl = require('../controllers/documentTemplateController');
router.get('/document-templates/pending', asyncHandler(docTplCtrl.listPendingTemplates));
router.post('/document-templates/:id/approve', asyncHandler(docTplCtrl.approveTemplate));
router.post('/document-templates/:id/reject', asyncHandler(docTplCtrl.rejectTemplate));

// ─── Template Preview Data ────────────────────────────────────────────────
router.get('/document-templates/preview-data', asyncHandler(adminController.getPreviewDataAdmin));
router.put('/document-templates/preview-data', asyncHandler(adminController.updatePreviewDataAdmin));

router.post('/consistency-check', asyncHandler(adminController.runConsistencyCheck));

module.exports = router;
