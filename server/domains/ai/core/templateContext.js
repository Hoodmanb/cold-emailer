/**
 * Resolves optional document template context for AI pipelines.
 * Safe fallback: returns empty suffix when no template or on error.
 */
const templateService = require('../../../services/templates/templateService');
const { buildTemplatePromptSuffix } = require('../../../services/templates/templatePromptHelper');
const { applyTemplate } = require('../../../services/templates/templateEngine');

function resolvePipelineTemplate(options = {}, documentType) {
  if (!options?.templateId) {
    return { template: null, promptSuffix: '', postProcess: (output) => output };
  }

  try {
    const template = templateService.resolveTemplateForGeneration(options.templateId, documentType);
    if (!template) {
      return { template: null, promptSuffix: '', postProcess: (output) => output };
    }

    const promptSuffix = buildTemplatePromptSuffix(template);
    return {
      template,
      promptSuffix,
      postProcess: (output) => applyTemplate(output, template),
    };
  } catch (err) {
    console.warn('[templateContext] Failed to resolve template, continuing without:', err.message);
    return { template: null, promptSuffix: '', postProcess: (output) => output };
  }
}

module.exports = { resolvePipelineTemplate };
