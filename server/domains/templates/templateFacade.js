/**
 * Template domain facade — coordinates repositories and engine.
 */

const documentTemplateRepo = require('../../repositories/documentTemplateRepository');
const emailTemplateRepo = require('../../repositories/templateRepository');
const templateService = require('../../services/templates/templateService');
const { mapEmailRow, mapDocumentRow, toSystemTemplateDto } = require('./models/templateDomain');
const { enrichTemplateWithStructure } = require('./utils/structure');
const { templateListResponse } = require('./utils/apiResponse');
const { prepareAiContext, renderHtml, generatePreview } = require('./engine/templateEngineCore');
const { getCurrentUserId } = require('../../middleware/requestContext');

async function listDocumentTemplatesForUser(userId, filters = {}) {
  let templates;
  if (filters.publicOnly) {
    templates = await documentTemplateRepo.listPublic();
  } else {
    templates = await documentTemplateRepo.listForUser(userId);
  }

  if (filters.type) {
    const normalized = documentTemplateRepo.normalizeType(filters.type);
    templates = templates.filter((t) => t.type === normalized);
  }

  const enriched = templates.map((t) => mapDocumentRow(enrichTemplateWithStructure(t)));
  const starredIds = userId ? await templateService.getUserStarredIds(userId) : [];
  return templateListResponse(enriched, { starredIds }).data;
}

async function listSystemTemplates() {
  const all = await documentTemplateRepo.listAll();
  return all
    .filter((t) => t.isAdminTemplate)
    .map((t) => toSystemTemplateDto(mapDocumentRow(enrichTemplateWithStructure(t))));
}

async function getDocumentTemplateById(id) {
  const row = await documentTemplateRepo.getById(id);
  if (!row) return null;
  return mapDocumentRow(enrichTemplateWithStructure(row));
}

async function resolveForGeneration(templateId, documentType) {
  const raw = await templateService.resolveTemplateForGeneration(templateId, documentType);
  return raw ? mapDocumentRow(enrichTemplateWithStructure(raw)) : null;
}

async function listEmailTemplates(userId) {
  const rows = await emailTemplateRepo.listTemplates(userId);
  return rows.map(mapEmailRow);
}

async function resolvePipelineContext(options, documentType) {
  if (!options?.templateId) {
    return prepareAiContext(null);
  }
  try {
    const template = await resolveForGeneration(options.templateId, documentType);
    return prepareAiContext(template);
  } catch (err) {
    console.warn('[templateFacade] pipeline context failed:', err.message);
    return prepareAiContext(null);
  }
}

module.exports = {
  listDocumentTemplatesForUser,
  listSystemTemplates,
  getDocumentTemplateById,
  resolveForGeneration,
  listEmailTemplates,
  resolvePipelineContext,
  prepareAiContext,
  renderHtml,
  generatePreview,
};
