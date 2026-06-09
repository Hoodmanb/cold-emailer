const { getOrCreateWallet } = require('../repositories/walletRepository');
const { getUserBilling } = require('../repositories/billingUserRepository');
const { estimateFeatureCost } = require('../services/billing/billingService');

function mapUrlToFeatureId(req) {
  const url = req.originalUrl || req.url || '';
  if (req.body && req.body.featureId) {
    return req.body.featureId;
  }
  if (url.includes('/parse-image')) {
    return 'job_extraction_image';
  }
  if (url.includes('/ats-rerun') || url.includes('/run-ats')) {
    return 'ats_analysis';
  }
  if (url.includes('/generate-professional-cv')) {
    return 'professional_cv_generation';
  }
  if (url.includes('/generate-advanced')) {
    return 'advanced_doc_generation';
  }
  if (url.includes('/workflow/run')) {
    return 'resume_generation';
  }
  return null;
}

function checkCredits(req, res, next) {
  if (!req.user || !req.user.id) {
    return next();
  }

  // Bypass checks if gateway mode is active and not expired
  const billing = getUserBilling(req.user.id);
  if (billing && billing.billingType === 'gateway') {
    const access = billing.gatewayAccess || {};
    if (access.isActive && access.expiresAt && new Date(access.expiresAt).getTime() > Date.now()) {
      return next();
    }
  }

  try {
    const wallet = getOrCreateWallet(req.user.id);
    if (wallet.balance <= 0) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: 'Please purchase more credits.',
      });
    }

    const featureId = mapUrlToFeatureId(req);
    if (featureId) {
      const minRequired = estimateFeatureCost(featureId, req.body || {});
      if (wallet.balance < minRequired) {
        return res.status(402).json({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: `Your balance of ${wallet.balance} credits is below the required ${minRequired} credits for this action. Please purchase more credits.`,
          required: minRequired,
          balance: wallet.balance,
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { checkCredits, mapUrlToFeatureId };
