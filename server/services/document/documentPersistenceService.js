/**
 * Document Persistence Service
 * Dual-layer model: editableContent is source of truth; content is kept in sync for backward compat.
 * PDF/DOCX/TXT are export outputs generated on demand from editableContent.
 */

const VALID_FORMATS = ['pdf', 'docx', 'txt', 'html', 'markdown'];

function getEditableContent(doc) {
  if (!doc) return '';
  if (typeof doc.editableContent === 'string' && doc.editableContent.trim()) {
    return doc.editableContent;
  }
  return typeof doc.content === 'string' ? doc.content : '';
}

function normalizeFormat(format, fallback = 'pdf') {
  const raw = String(format || fallback).toLowerCase();
  return VALID_FORMATS.includes(raw) ? raw : fallback;
}

function buildDocumentPayload(input = {}) {
  const editableContent = typeof input.editableContent === 'string'
    ? input.editableContent
    : (typeof input.content === 'string' ? input.content : '');

  const exportFormat = normalizeFormat(input.exportFormat || input.format, 'pdf');

  return {
    jobId: input.jobId ?? null,
    generatedFromJobId: input.generatedFromJobId ?? input.jobId ?? null,
    type: input.type || 'resume',
    title: input.title || '',
    editableContent,
    content: editableContent,
    contentSource: input.contentSource || 'ai',
    format: exportFormat,
    exportFormat,
    model: input.model || '',
    status: input.status || 'draft',
    editedManually: Boolean(input.editedManually),
    tailoringLevel: input.tailoringLevel || 'balanced',
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    exportHistory: Array.isArray(input.exportHistory) ? input.exportHistory : [],
  };
}

function applyContentUpdate(existing, updates = {}) {
  const next = { ...updates };

  if (updates.editableContent !== undefined) {
    next.editableContent = String(updates.editableContent);
    next.content = next.editableContent;
    next.editedManually = true;
    next.contentSource = 'manual';
  } else if (updates.content !== undefined) {
    next.content = String(updates.content);
    next.editableContent = next.content;
    next.editedManually = true;
    next.contentSource = 'manual';
  }

  if (updates.title !== undefined) {
    next.title = String(updates.title).trim();
  }

  if (updates.exportFormat !== undefined || updates.format !== undefined) {
    next.exportFormat = normalizeFormat(updates.exportFormat || updates.format, existing.exportFormat || existing.format || 'pdf');
    next.format = next.exportFormat;
  }

  return next;
}

function recordExport(doc, format) {
  const safeFormat = normalizeFormat(format, doc.exportFormat || doc.format || 'pdf');
  const history = Array.isArray(doc.exportHistory) ? [...doc.exportHistory] : [];
  history.unshift({
    format: safeFormat,
    exportedAt: new Date().toISOString(),
  });
  return history.slice(0, 20);
}

function hydrateDocument(doc) {
  if (!doc) return doc;
  const editableContent = getEditableContent(doc);
  return {
    ...doc,
    editableContent,
    content: editableContent,
    exportFormat: normalizeFormat(doc.exportFormat || doc.format, 'pdf'),
    format: normalizeFormat(doc.exportFormat || doc.format, 'pdf'),
    generatedFromJobId: doc.generatedFromJobId ?? doc.jobId ?? null,
    tailoringLevel: doc.tailoringLevel || 'balanced',
    metadata: doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : {},
    exportHistory: Array.isArray(doc.exportHistory) ? doc.exportHistory : [],
  };
}

module.exports = {
  VALID_FORMATS,
  getEditableContent,
  normalizeFormat,
  buildDocumentPayload,
  applyContentUpdate,
  recordExport,
  hydrateDocument,
};
