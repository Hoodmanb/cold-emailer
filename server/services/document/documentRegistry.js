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
 * @returns {object} hydrated document
 */
function createDocument(input = {}) {
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

  const created = documentRepo.saveDocument(payload);
  return hydrateDocument(created);
}

function updateDocument(id, updates = {}) {
  if (!id) throw new Error('[DocumentRegistry] document id is required');
  const existing = documentRepo.getDocument(id);
  if (!existing) return null;
  const normalized = applyContentUpdate(existing, updates);
  const updated = documentRepo.updateDocument(id, normalized);
  return hydrateDocument(updated);
}

function getDocument(id) {
  return documentRepo.getDocument(id);
}

function listDocuments(jobId) {
  return documentRepo.listDocuments(jobId);
}

function duplicateDocument(id) {
  const copy = documentRepo.duplicateDocument(id);
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
