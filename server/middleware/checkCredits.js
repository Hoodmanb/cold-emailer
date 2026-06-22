const { getOrCreateWallet } = require('../repositories/walletRepository');
const { getUserBilling } = require('../repositories/billingUserRepository');
const { estimateFeatureCost } = require('../services/billing/billingService');

const AI_TYPE_TO_FEATURE = {
  resume: 'resume_generation',
  'cover-letter': 'cover_letter_generation',
  email: 'email_generation',
  analysis: 'ats_analysis',
  score: 'ats_analysis',
};

const WORKFLOW_TYPE_TO_FEATURE = {
  resume: 'resume_generation',
  'professional-cv': 'professional_cv_generation',
  'cover-letter': 'cover_letter_generation',
  email: 'email_generation',
};

const FULL_WORKFLOW_FEATURES = [
  'ats_analysis',
  'resume_generation',
  'cover_letter_generation',
  'email_generation',
];

async function estimateWorkflowCost(types = []) {
  const featureIds = (Array.isArray(types) && types.length ? types : ['resume'])
    .map((type) => WORKFLOW_TYPE_TO_FEATURE[type])
    .filter(Boolean);
  const unique = [...new Set(featureIds)];
  let total = 0;
  for (const featureId of unique) {
    total += await estimateFeatureCost(featureId, {});
  }
  return total;
}

async function estimateFullWorkflowCost() {
  let total = 0;
  for (const featureId of FULL_WORKFLOW_FEATURES) {
    total += await estimateFeatureCost(featureId, {});
  }
  return total;
}

function mapUrlToFeatureId(req) {
  const url = req.originalUrl || req.url || '';
  if (req.body && req.body.featureId) {
    return req.body.featureId;
  }
  if (url.includes('/api/ai/generate') && req.body?.type) {
    return AI_TYPE_TO_FEATURE[req.body.type] || null;
  }
  if (url.includes('/parse-image')) {
    return 'job_extraction_image';
  }
  if (url.includes('/run-ats')) {
    return 'ats_analysis';
  }
  if (url.includes('/ats-rerun')) {
    return null;
  }
  if (url.includes('/generate-professional-cv')) {
    return 'professional_cv_generation';
  }
  if (url.includes('/generate-advanced')) {
    return 'advanced_doc_generation';
  }
  if (url.includes('/workflow/run')) {
    return '__full_workflow__';
  }
  if (url.includes('/workflow/generate-selected')) {
    return '__selected_workflow__';
  }
  if (url.includes('/workflow/regenerate') && req.body?.type) {
    return WORKFLOW_TYPE_TO_FEATURE[req.body.type] || null;
  }
  return null;
}

async function checkCredits(req, res, next) {
  if (!req.user || !req.user.id) {
    return next();
  }

  try {
    const billing = await getUserBilling(req.user.id);
    if (billing && billing.billingType === 'gateway') {
      const access = billing.gatewayAccess || {};
      if (access.isActive && access.expiresAt && new Date(access.expiresAt).getTime() > Date.now()) {
        return next();
      }
    }

    const wallet = await getOrCreateWallet(req.user.id);
    if (wallet.balance <= 0) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: 'Please purchase more credits.',
      });
    }

    const featureId = mapUrlToFeatureId(req);
    let minRequired = 0;
    if (featureId === '__full_workflow__') {
      minRequired = await estimateFullWorkflowCost();
    } else if (featureId === '__selected_workflow__') {
      minRequired = await estimateWorkflowCost(req.body?.types);
    } else if (featureId) {
      minRequired = await estimateFeatureCost(featureId, req.body || {});
    }

    if (minRequired > 0 && wallet.balance < minRequired) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Your balance of ${wallet.balance} credits is below the required ${minRequired} credits for this action. Please purchase more credits.`,
        required: minRequired,
        balance: wallet.balance,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { checkCredits, mapUrlToFeatureId };
