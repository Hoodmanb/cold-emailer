const { normalizeTailoringLevel } = require('../../domains/ai/core/tailoringConfig');

const BASE_FEATURE_COSTS = {
  resume_generation: 5,
  professional_cv_generation: 8,
  cover_letter_generation: 4,
  email_generation: 4,
  ats_analysis: 10,
  chatbot_assistant: 1,
  project_summary_generation: 3,
  advanced_doc_generation: 6,
  job_extraction_image: 5,
  schedule_creation: 1,
};

const TAILORING_MULTIPLIERS = {
  conservative: 1,
  balanced: 1.2,
  aggressive: 1.5,
};

function getBaseFeatureCost(featureId, settings = {}) {
  const id = String(featureId || '').trim();
  const dbCosts = settings.featureCosts || {};
  return dbCosts[id] ?? BASE_FEATURE_COSTS[id] ?? 1;
}

function getTailoringMultiplier(tailoringLevel) {
  const level = normalizeTailoringLevel(tailoringLevel);
  return TAILORING_MULTIPLIERS[level] ?? 1;
}

function calculateFeatureCost(featureId, settings = {}, options = {}) {
  const base = getBaseFeatureCost(featureId, settings);
  const multiplier = getTailoringMultiplier(options.tailoringLevel);
  return Math.max(1, Math.ceil(base * multiplier));
}

function listFeatureCosts(settings = {}) {
  const dbCosts = settings.featureCosts || {};
  const mergedCosts = { ...BASE_FEATURE_COSTS, ...dbCosts };
  return Object.entries(mergedCosts).map(([featureId, baseCost]) => ({
    featureId,
    baseCost,
    tailoringMultipliers: TAILORING_MULTIPLIERS,
  }));
}

module.exports = {
  BASE_FEATURE_COSTS,
  TAILORING_MULTIPLIERS,
  getBaseFeatureCost,
  getTailoringMultiplier,
  calculateFeatureCost,
  listFeatureCosts,
};
