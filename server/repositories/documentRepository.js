/**
 * Hardened Scoped Document Repository
 */
const BaseRepository = require('../infrastructure/db/BaseRepository');
const {
  buildDocumentPayload,
  applyContentUpdate,
  hydrateDocument,
} = require('../services/document/documentPersistenceService');

const FILE = 'documents.json';
const docRepo = new BaseRepository(FILE);

const listDocuments = (jobId, userId) => {
  const all = docRepo.readAll(userId).map(hydrateDocument);
  return jobId ? all.filter((d) => String(d.jobId) === String(jobId)) : all;
};

const getDocument = (id, userId) => {
  const doc = docRepo.readById(id, userId);
  return doc ? hydrateDocument(doc) : null;
};

const saveDocument = (docData, userId) => {
  const payload = buildDocumentPayload(docData);
  const created = docRepo.create(payload, userId);
  return hydrateDocument(created);
};

const updateDocument = (id, updates, userId) => {
  const existing = docRepo.readById(id, userId);
  if (!existing) return null;
  const normalized = applyContentUpdate(existing, updates);
  const updated = docRepo.update(id, normalized, userId);
  return hydrateDocument(updated);
};

const approveDocument = (id, userId) => {
  const updated = docRepo.update(
    id,
    {
      status: 'approved',
      approvedAt: new Date().toISOString(),
    },
    userId,
  );
  return hydrateDocument(updated);
};

const deleteDocument = (id, userId) => docRepo.delete(id, userId);

const duplicateDocument = (id, userId) => {
  const existing = docRepo.readById(id, userId);
  if (!existing) return null;
  const hydrated = hydrateDocument(existing);
  const copy = docRepo.create(
    {
      ...hydrated,
      id: undefined,
      title: `${hydrated.title || hydrated.type} (Copy)`,
      status: 'draft',
      editedManually: hydrated.editedManually,
      approvedAt: undefined,
      exportHistory: [],
      createdAt: undefined,
      updatedAt: undefined,
    },
    userId,
  );
  return hydrateDocument(copy);
};

module.exports = {
  listDocuments,
  getDocument,
  saveDocument,
  updateDocument,
  approveDocument,
  deleteDocument,
  duplicateDocument,
};
