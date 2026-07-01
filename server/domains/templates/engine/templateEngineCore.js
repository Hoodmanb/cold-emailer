/**
 * Unified Template Engine
 * Single pipeline: load → AI context → render → preview → post-process
 *
 * Rendering never reads aiRules/promptRules.
 * AI context never reads style (font/color).
 */

const { enrichTemplateWithStructure } = require('../utils/structure');
const { buildTemplatePromptSuffix } = require('../../../services/templates/templatePromptHelper');
const { applyTemplate } = require('../../../services/templates/templateEngine');
const { renderTemplate } = require('../../../utils/renderJsonTemplate');
const { generatePreviewPages } = require('../../../services/templates/previewGenerator');

function loadTemplate(rawTemplate) {
  if (!rawTemplate) return null;
  return enrichTemplateWithStructure(rawTemplate);
}

function prepareAiContext(template) {
  const loaded = loadTemplate(template);
  if (!loaded) {
    return { template: null, promptSuffix: '', postProcess: (output) => output };
  }
  const promptSuffix = buildTemplatePromptSuffix(loaded);
  return {
    template: loaded,
    promptSuffix,
    postProcess: (output) => applyTemplate(output, loaded),
  };
}

function renderHtml(template, userData = {}) {
  const loaded = loadTemplate(template);
  if (!loaded) return '';
  return renderTemplate(loaded, userData);
}

async function generatePreview(template, userData = null) {
  const loaded = loadTemplate(template);
  if (!loaded) return { html: '', pages: [] };
  if (userData) {
    const html = renderHtml(loaded, userData);
    return { html, pages: [html] };
  }
  const pages = await generatePreviewPages(loaded);
  const html = Array.isArray(pages) ? pages.join('\n') : String(pages || '');
  return { html, pages: Array.isArray(pages) ? pages : [html] };
}

function postProcessAiOutput(aiOutput, template) {
  const loaded = loadTemplate(template);
  return applyTemplate(aiOutput, loaded);
}

module.exports = {
  loadTemplate,
  prepareAiContext,
  renderHtml,
  generatePreview,
  postProcessAiOutput,
};
