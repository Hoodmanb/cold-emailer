const { extractPlaceholders } = require('../../utils/placeholderParser');
const { AI_FEATURES } = require('./featureConfigs');

/**
 * Placeholders each pipeline injects via promptRegistry.render().
 * Custom prompts must include these or user/job data is never sent to the model.
 */
const REQUIRED_BY_FEATURE = {
  resume_generation: ['job_description', 'candidate_profile'],
  professional_cv_generation: ['job_description', 'candidate_profile'],
  cover_letter_generation: ['job_title', 'company_name', 'job_description', 'candidate_profile'],
  email_generation: [
    'job_title',
    'company_name',
    'recipient_info',
    'candidate_name',
    'candidate_skills',
    'candidate_summary',
  ],
  ats_analysis: ['job_description', 'candidate_profile'],
  project_summary_generation: ['project_title', 'project_description', 'technologies'],
};

const PLACEHOLDER_HELP = {
  candidate_profile: 'your profile data',
  job_description: 'the job description',
  job_title: 'the job title',
  company_name: 'the company name',
  recipient_info: 'recipient details',
  candidate_name: 'your name',
  candidate_skills: 'your skills',
  candidate_summary: 'your summary',
  project_title: 'the project title',
  project_description: 'the project description',
  technologies: 'technologies used',
};

const FEATURE_NAMES = new Map(AI_FEATURES.map((f) => [f.id, f.name]));

function formatPlaceholderToken(name) {
  return `{{${name}}}`;
}

function buildValidationMessage(featureId, missing) {
  const featureName = FEATURE_NAMES.get(featureId) || featureId;
  const tokens = missing.map(formatPlaceholderToken).join(', ');
  const dataLabels = missing.map((p) => PLACEHOLDER_HELP[p] || p).join(', ');
  return (
    `Cannot save custom prompt for ${featureName}: your prompt must include ${tokens}. ` +
    `Those placeholders inject ${dataLabels} at generation time — without them the AI never receives your data and may invent content. ` +
    `Copy the default prompt or add the missing placeholders exactly as shown.`
  );
}

function validateCustomPrompt(featureId, config = {}) {
  const id = String(featureId || '').trim();
  const required = REQUIRED_BY_FEATURE[id];
  if (!required?.length) {
    return { valid: true, featureId: id, missing: [] };
  }

  if (!config.useCustomPrompt) {
    return { valid: true, featureId: id, missing: [] };
  }

  const text = String(config.customPrompt || '').trim();
  if (!text) {
    return {
      valid: false,
      featureId: id,
      missing: required,
      errorCode: 'PROMPT_PLACEHOLDERS_MISSING',
      message: buildValidationMessage(id, required),
    };
  }

  const found = new Set(extractPlaceholders(text));
  const missing = required.filter((p) => !found.has(p));
  if (missing.length) {
    return {
      valid: false,
      featureId: id,
      missing,
      errorCode: 'PROMPT_PLACEHOLDERS_MISSING',
      message: buildValidationMessage(id, missing),
    };
  }

  return { valid: true, featureId: id, missing: [] };
}

function assertCustomPromptValid(featureId, config) {
  const result = validateCustomPrompt(featureId, config);
  if (!result.valid) {
    const err = new Error(result.message);
    err.statusCode = 400;
    err.errorCode = result.errorCode;
    err.type = 'validation_error';
    err.details = { featureId: result.featureId, missing: result.missing };
    throw err;
  }
  return result;
}

function validateFeatureMapPrompts(featureMap = {}) {
  const invalid = [];
  for (const [featureId, config] of Object.entries(featureMap)) {
    const result = validateCustomPrompt(featureId, config);
    if (!result.valid) invalid.push(result);
  }
  return invalid;
}

function assertFeatureMapPromptsValid(featureMap = {}) {
  const invalid = validateFeatureMapPrompts(featureMap);
  if (invalid.length) {
    const err = new Error(invalid[0].message);
    err.statusCode = 400;
    err.errorCode = 'PROMPT_PLACEHOLDERS_MISSING';
    err.type = 'validation_error';
    err.details = { failures: invalid.map((r) => ({ featureId: r.featureId, missing: r.missing })) };
    throw err;
  }
}

module.exports = {
  REQUIRED_BY_FEATURE,
  PLACEHOLDER_HELP,
  validateCustomPrompt,
  assertCustomPromptValid,
  validateFeatureMapPrompts,
  assertFeatureMapPromptsValid,
  buildValidationMessage,
};
