/**
 * Resolves optional document template context for AI pipelines.
 * Delegates to unified template domain facade.
 */
const templateFacade = require('../../../domains/templates/templateFacade');

async function resolvePipelineTemplate(options = {}, documentType) {
  return templateFacade.resolvePipelineContext(options, documentType);
}

module.exports = { resolvePipelineTemplate };
