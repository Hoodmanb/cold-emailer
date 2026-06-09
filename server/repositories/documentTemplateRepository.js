const fileStore = require('../utils/fileStore');
const { ensureArray } = require('../utils/jsonNormalizer');
const { v4: uuidv4 } = require('uuid');
const { detectTemplateKind, extractPlaceholders } = require('../utils/placeholderParser');
const { generatePreviewPages } = require('../services/templates/previewGenerator');

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

  const content = record.content !== undefined ? String(record.content || '') : undefined;
  const templateKind =
    record.templateKind ||
    detectTemplateKind({
      content: content ?? record.aiRules,
      aiRules: record.aiRules,
      structure: record.structure,
    });

  const isPublic = Boolean(record.isPublic);
  let approvalStatus = record.approvalStatus;
  if (!approvalStatus) {
    approvalStatus = isPublic ? 'pending_approval' : 'draft';
  }

  const normalized = {
    id: record.id || uuidv4(),
    name: String(record.name || 'Untitled Template').trim(),
    type,
    templateKind,
    structure: Array.isArray(record.structure)
      ? record.structure.map((s) => String(s).trim()).filter(Boolean)
      : [],
    style: record.style && typeof record.style === 'object' ? record.style : {},
    aiRules: String(record.aiRules || '').trim(),
    content: content !== undefined ? content : String(record.content || ''),
    placeholders: Array.isArray(record.placeholders)
      ? record.placeholders
      : extractPlaceholders(content ?? record.aiRules ?? ''),
    category: record.category ? String(record.category) : 'general',
    version: Number(record.version) || 1,
    preview: record.preview ? String(record.preview) : null,
    previewPages: Array.isArray(record.previewPages) ? record.previewPages : [],
    isPublic,
    approvalStatus,
    featured: Boolean(record.featured),
    createdBy: record.createdBy ? String(record.createdBy) : null,
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString(),
    shareCode: record.shareCode || uuidv4().split('-')[0],
  };

  for (let i = 1; i <= 5; i += 1) {
    const key = `previewPage${i}`;
    if (record[key]) normalized[key] = record[key];
  }

  return normalized;
}

function applyPreviewFields(template) {
  const previewData = generatePreviewPages(template);
  return {
    ...template,
    ...previewData,
    previewPages: previewData.previewPages.map((p) => p.html),
    updatedAt: new Date().toISOString(),
  };
}

const listAll = () => ensureArray(fileStore.read(FILE));

const listForUser = (userId) => {
  const all = listAll();
  return all.filter(
    (t) =>
      String(t.createdBy) === String(userId) ||
      (t.isPublic && (t.approvalStatus === 'approved' || !t.approvalStatus)),
  );
};

const listCommunityForUser = (userId) => {
  const all = listAll();
  return all.filter((t) => String(t.createdBy) === String(userId) || t.isPublic);
};

const listPendingApproval = () =>
  listAll().filter((t) => t.approvalStatus === 'pending_approval');

const listApprovedPublic = () =>
  listAll().filter(
    (t) => t.isPublic && (t.approvalStatus === 'approved' || !t.approvalStatus),
  );

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
  const withPreview = applyPreviewFields(normalized);
  return fileStore.append(FILE, withPreview);
};

const update = (id, updates, userId) => {
  const existing = getById(id);
  if (!existing) return null;
  if (existing.createdBy && userId && String(existing.createdBy) !== String(userId) && !existing.isPublic) {
    throw new Error('Not authorized to update this template');
  }

  const nextType = updates.type !== undefined ? normalizeType(updates.type) : existing.type;
  if (!nextType) throw new Error('Invalid template type');

  return fileStore.update(FILE, (t) => String(t.id) === String(id), (t) => {
    const merged = {
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
      content: updates.content !== undefined ? String(updates.content || '') : t.content,
      updatedAt: new Date().toISOString(),
    };

    if (updates.isPublic === true && merged.approvalStatus === 'draft') {
      merged.approvalStatus = 'pending_approval';
    }

    merged.templateKind = detectTemplateKind(merged);
    merged.placeholders = extractPlaceholders(merged.content || merged.aiRules || '');

    return applyPreviewFields(merged);
  });
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

const approve = (id, userId) => {
  const existing = getById(id);
  if (!existing) return null;
  return update(id, { approvalStatus: 'approved', isPublic: true }, userId);
};

const reject = (id, userId, reason) => {
  const existing = getById(id);
  if (!existing) return null;
  return update(id, { approvalStatus: 'rejected', rejectionReason: reason || '' }, userId);
};

module.exports = {
  FILE,
  VALID_TYPES,
  normalizeType,
  normalizeTemplate,
  listAll,
  listForUser,
  listCommunityForUser,
  listPendingApproval,
  listApprovedPublic,
  getById,
  create,
  update,
  remove,
  upsertMany,
  approve,
  reject,
};
