const fileStore = require('../utils/fileStore');
const { v4: uuidv4 } = require('uuid');

const FILE = 'documentTemplates.json';

const VALID_TYPES = new Set(['resume', 'cv', 'cover_letter', 'email']);

function normalizeType(type) {
  const raw = String(type || '').trim().toLowerCase();
  if (raw === 'professional-cv' || raw === 'professional_cv') return 'cv';
  if (raw === 'cover-letter' || raw === 'cover_letter') return 'cover_letter';
  if (VALID_TYPES.has(raw)) return raw;
  return null;
}

function normalizeTemplate(record = {}) {
  const type = normalizeType(record.type);
  if (!type) return null;

  return {
    id: record.id || uuidv4(),
    name: String(record.name || 'Untitled Template').trim(),
    type,
    structure: Array.isArray(record.structure)
      ? record.structure.map((s) => String(s).trim()).filter(Boolean)
      : [],
    style: record.style && typeof record.style === 'object' ? record.style : {},
    aiRules: String(record.aiRules || '').trim(),
    preview: record.preview ? String(record.preview) : null,
    isPublic: Boolean(record.isPublic),
    createdBy: record.createdBy ? String(record.createdBy) : null,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

const listAll = () => fileStore.read(FILE);

const listForUser = (userId) => {
  const all = listAll();
  return all.filter((t) => t.isPublic || String(t.createdBy) === String(userId));
};

const getById = (id) => listAll().find((t) => String(t.id) === String(id)) || null;

const create = (data, userId) => {
  const normalized = normalizeTemplate({
    ...data,
    id: uuidv4(),
    createdBy: userId || data.createdBy || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if (!normalized) throw new Error('Invalid template type');
  return fileStore.append(FILE, normalized);
};

const update = (id, updates, userId) => {
  const existing = getById(id);
  if (!existing) return null;
  if (existing.createdBy && userId && String(existing.createdBy) !== String(userId) && !existing.isPublic) {
    throw new Error('Not authorized to update this template');
  }

  const nextType = updates.type !== undefined ? normalizeType(updates.type) : existing.type;
  if (!nextType) throw new Error('Invalid template type');

  return fileStore.update(FILE, (t) => String(t.id) === String(id), (t) => ({
    ...t,
    ...updates,
    type: nextType,
    structure: updates.structure !== undefined
      ? (Array.isArray(updates.structure) ? updates.structure.map((s) => String(s).trim()).filter(Boolean) : t.structure)
      : t.structure,
    style: updates.style !== undefined
      ? (updates.style && typeof updates.style === 'object' ? updates.style : t.style)
      : t.style,
    aiRules: updates.aiRules !== undefined ? String(updates.aiRules || '').trim() : t.aiRules,
    updatedAt: new Date().toISOString(),
  }));
};

const remove = (id, userId) => {
  const existing = getById(id);
  if (!existing) return false;
  if (existing.createdBy && userId && String(existing.createdBy) !== String(userId)) {
    throw new Error('Not authorized to delete this template');
  }
  return fileStore.remove(FILE, (t) => String(t.id) === String(id));
};

const upsertMany = (templates = []) => {
  const existing = listAll();
  const byId = new Map(existing.map((t) => [String(t.id), t]));
  for (const raw of templates) {
    const normalized = normalizeTemplate(raw);
    if (!normalized) continue;
    byId.set(String(normalized.id), normalized);
  }
  fileStore.write(FILE, Array.from(byId.values()));
  return Array.from(byId.values());
};

module.exports = {
  FILE,
  VALID_TYPES,
  normalizeType,
  normalizeTemplate,
  listAll,
  listForUser,
  getById,
  create,
  update,
  remove,
  upsertMany,
};
