/**
 * Unified Document Registry
 * ALL document creation must go through createDocument().
 * PDF/DOCX/TXT are export outputs; editableContent is the source of truth.
 */
const documentRepo = require('../../repositories/documentRepository');
const {
  buildDocumentPayload,
  hydrateDocument,
  applyContentUpdate,
} = require('./documentPersistenceService');
const { getCurrentUserId } = require('../../middleware/requestContext');

const VALID_SOURCES = new Set([
  'widget',
  'workflow',
  'ats',
  'manual',
  'ai-pipeline',
  'editor',
  'duplicate',
  'advanced-generation',
]);

function normalizeSource(source) {
  const raw = String(source || 'manual').toLowerCase();
  return VALID_SOURCES.has(raw) ? raw : 'manual';
}

/**
 * Create and persist a document through the unified registry.
 * @param {object} input
 * @returns {Promise<object>} hydrated document
 */
async function createDocument(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error('[DocumentRegistry] createDocument requires a payload object');
  }

  const source = normalizeSource(input.source || input.metadata?.source);
  const payload = buildDocumentPayload({
    ...input,
    metadata: {
      ...(input.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
      source,
      createdVia: input.createdVia || source,
    },
  });

  if (!payload.type) {
    throw new Error('[DocumentRegistry] document type is required');
  }

  const userId = getCurrentUserId();
  const created = await documentRepo.saveDocument(payload, userId);
  return hydrateDocument(created);
}

async function updateDocument(id, updates = {}) {
  if (!id) throw new Error('[DocumentRegistry] document id is required');
  const userId = getCurrentUserId();
  const existing = await documentRepo.getDocument(id, userId);
  if (!existing) return null;
  const normalized = applyContentUpdate(existing, updates);
  const updated = await documentRepo.updateDocument(id, normalized, userId);
  return hydrateDocument(updated);
}

async function getDocument(id) {
  const userId = getCurrentUserId();
  return documentRepo.getDocument(id, userId);
}

async function listDocuments(jobId) {
  const userId = getCurrentUserId();
  return documentRepo.listDocuments(jobId, userId);
}

async function duplicateDocument(id) {
  const userId = getCurrentUserId();
  const copy = await documentRepo.duplicateDocument(id, userId);
  if (!copy) return null;
  return hydrateDocument({
    ...copy,
    metadata: { ...(copy.metadata || {}), source: 'duplicate' },
  });
}

module.exports = {
  VALID_SOURCES,
  createDocument,
  updateDocument,
  getDocument,
  listDocuments,
  duplicateDocument,
};
