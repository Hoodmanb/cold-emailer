const documentTemplateRepo = require('../../repositories/documentTemplateRepository');
const { findUserById, updateUserRecord } = require('../../repositories/userRepository');
const { getCurrentUserId } = require('../../middleware/requestContext');
const { seedDefaultTemplates } = require('./defaultTemplates');

function ensureSeeded() {
  return seedDefaultTemplates(documentTemplateRepo);
}

function getAllTemplates(filters = {}) {
  ensureSeeded();
  const userId = getCurrentUserId();
  let templates = userId
    ? documentTemplateRepo.listForUser(userId)
    : documentTemplateRepo.listAll().filter((t) => t.isPublic);

  if (filters.type) {
    const normalized = documentTemplateRepo.normalizeType(filters.type);
    if (normalized) templates = templates.filter((t) => t.type === normalized);
  }

  if (filters.publicOnly) {
    templates = templates.filter((t) => t.isPublic);
  }

  return templates;
}

function getTemplateById(id) {
  ensureSeeded();
  const userId = getCurrentUserId();
  const template = documentTemplateRepo.getById(id);
  if (!template) return null;
  if (!template.isPublic && userId && String(template.createdBy) !== String(userId)) {
    return null;
  }
  return template;
}

function createTemplate(data) {
  ensureSeeded();
  const userId = getCurrentUserId();
  return documentTemplateRepo.create(data, userId);
}

function updateTemplate(id, data) {
  ensureSeeded();
  const userId = getCurrentUserId();
  return documentTemplateRepo.update(id, data, userId);
}

function deleteTemplate(id) {
  ensureSeeded();
  const userId = getCurrentUserId();
  const removed = documentTemplateRepo.remove(id, userId);
  if (removed && userId) {
    const user = findUserById(userId);
    if (user && Array.isArray(user.starredTemplates)) {
      updateUserRecord(userId, {
        starredTemplates: user.starredTemplates.filter((tid) => String(tid) !== String(id)),
      });
    }
  }
  return removed;
}

function getUserStarredIds(userId) {
  if (!userId) return [];
  const user = findUserById(userId);
  return Array.isArray(user?.starredTemplates) ? user.starredTemplates : [];
}

function starTemplate(userId, templateId) {
  if (!userId || !templateId) throw new Error('userId and templateId are required');
  const template = documentTemplateRepo.getById(templateId);
  if (!template) throw new Error('Template not found');

  const user = findUserById(userId);
  if (!user) throw new Error('User not found');

  const starred = Array.isArray(user.starredTemplates) ? [...user.starredTemplates] : [];
  if (!starred.some((id) => String(id) === String(templateId))) {
    starred.push(String(templateId));
  }
  updateUserRecord(userId, { starredTemplates: starred });
  return starred;
}

function unstarTemplate(userId, templateId) {
  if (!userId || !templateId) throw new Error('userId and templateId are required');
  const user = findUserById(userId);
  if (!user) throw new Error('User not found');

  const starred = (Array.isArray(user.starredTemplates) ? user.starredTemplates : [])
    .filter((id) => String(id) !== String(templateId));
  updateUserRecord(userId, { starredTemplates: starred });
  return starred;
}

function getStarredTemplates(userId) {
  ensureSeeded();
  const starredIds = getUserStarredIds(userId);
  if (!starredIds.length) return [];

  const all = getAllTemplates();
  const byId = new Map(all.map((t) => [String(t.id), t]));
  return starredIds.map((id) => byId.get(String(id))).filter(Boolean);
}

function resolveTemplateForGeneration(templateId, documentType) {
  if (!templateId) return null;
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      console.warn(`[templateService] Template ${templateId} not found`);
      return null;
    }
    const expected = documentTemplateRepo.normalizeType(documentType);
    if (expected && template.type !== expected) {
      console.warn(`[templateService] Template type mismatch for ${templateId}`);
      return null;
    }
    return template;
  } catch (err) {
    console.warn('[templateService] resolveTemplateForGeneration failed:', err.message);
    return null;
  }
}

module.exports = {
  ensureSeeded,
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  starTemplate,
  unstarTemplate,
  getStarredTemplates,
  getUserStarredIds,
  resolveTemplateForGeneration,
};
