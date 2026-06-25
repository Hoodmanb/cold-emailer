const {
  estimateFeatureCost,
  estimateExecutableCost,
  getCreditBalance,
} = require('../services/billing/billingService');
const { getUserBilling } = require('../repositories/billingUserRepository');

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
  if (url.includes('/api/scheduler') && req.method === 'POST') {
    return 'schedule_creation';
  }
  return null;
}

async function checkCredits(req, res, next) {
  if (!req.user || !req.user.id) {
    return next();
  }

  try {
    const role = String(req.user.role || '').toLowerCase();
    if (role === 'admin') return next();
    const billing = await getUserBilling(req.user.id);
    if (String(billing?.role || '').toLowerCase() === 'admin') return next();

    const featureId = mapUrlToFeatureId(req);
    if (!featureId) return next();

    let minRequired = 0;
    if (featureId === '__full_workflow__') {
      for (const id of FULL_WORKFLOW_FEATURES) {
        minRequired += await estimateExecutableCost(req.user.id, id, req.body || {});
      }
    } else if (featureId === '__selected_workflow__') {
      const featureIds = (Array.isArray(req.body?.types) && req.body.types.length ? req.body.types : ['resume'])
        .map((type) => WORKFLOW_TYPE_TO_FEATURE[type])
        .filter(Boolean);
      for (const id of [...new Set(featureIds)]) {
        minRequired += await estimateExecutableCost(req.user.id, id, req.body || {});
      }
    } else if (featureId) {
      minRequired = await estimateExecutableCost(req.user.id, featureId, req.body || {});
    }

    if (minRequired <= 0) return next();

    const balance = await getCreditBalance(req.user.id);

    if (minRequired > 0 && balance < minRequired) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Your balance of ${balance} credits is below the required ${minRequired} credits for this action. Please purchase more credits.`,
        required: minRequired,
        balance,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { checkCredits, mapUrlToFeatureId };
