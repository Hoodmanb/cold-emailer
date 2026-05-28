/**
 * Centralized prompt template registry and placeholder renderer
 */
const { AI_FEATURES } = require('../../../services/ai/featureConfigs');
const { getAiSettings } = require('../../../repositories/aiRepository');

function renderTemplate(template, variables = {}) {
  let rendered = String(template || '');
  Object.keys(variables).forEach((key) => {
    const value = variables[key];
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value === undefined || value === null ? '' : value);
  });
  return rendered;
}

function resolvePrompt(featureId) {
  const featureDef = AI_FEATURES.find((f) => f.id === featureId);
  if (!featureDef) {
    throw new Error(`[prompt-registry] Unsupported AI feature ID: '${featureId}'`);
  }

  try {
    const settings = getAiSettings() || {};
    const config = settings.featureMap?.[featureId];
    if (config && config.useCustomPrompt && config.customPrompt) {
      return config.customPrompt;
    }
  } catch (_) {
    // Graceful fallback to default prompt if repositories/settings unavailable
  }

  return featureDef.defaultPrompt;
}

module.exports = {
  resolvePrompt,
  render: renderTemplate
};
