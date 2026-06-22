const documentTemplateRepo = require('../../repositories/documentTemplateRepository');
const { findUserById, updateUserRecord } = require('../../repositories/userRepository');
const { getCurrentUserId } = require('../../middleware/requestContext');
const { seedDefaultTemplates } = require('./defaultTemplates');

async function ensureSeeded() {
  return seedDefaultTemplates(documentTemplateRepo);
}

async function getAllTemplates(filters = {}) {
  await ensureSeeded();
  const userId = getCurrentUserId();
  
  let templates;
  if (filters.publicOnly) {
    templates = await documentTemplateRepo.listPublic();
  } else if (userId) {
    templates = await documentTemplateRepo.listForUser(userId);
  } else {
    templates = await documentTemplateRepo.listPublic();
  }

  if (filters.type) {
    const normalized = documentTemplateRepo.normalizeType(filters.type);
    if (normalized) templates = templates.filter((t) => t.type === normalized);
  }

  return templates;
}

async function getTemplateById(id) {
  await ensureSeeded();
  const userId = getCurrentUserId();
  const template = await documentTemplateRepo.getById(id);
  if (!template) return null;
  
  const isAuthorized = 
    template.isAdminTemplate || 
    (template.isPublic && template.isApproved) ||
    (userId && String(template.userId) === String(userId));
    
  if (!isAuthorized) return null;
  return template;
}

async function createTemplate(data) {
  await ensureSeeded();
  const userId = getCurrentUserId();
  return documentTemplateRepo.create(data, userId);
}

async function checkOwnershipOrAdmin(templateId, userId) {
  if (!userId) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    throw err;
  }
  const template = await documentTemplateRepo.getById(templateId);
  if (!template) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }
  
  if (template.isAdminTemplate) {
    const user = await findUserById(userId);
    if (user?.role !== 'admin') {
      const err = new Error('Not authorized to modify admin templates');
      err.statusCode = 403;
      throw err;
    }
    return template;
  }
  
  if (String(template.userId) !== String(userId)) {
    const user = await findUserById(userId);
    if (user?.role !== 'admin') {
      const err = new Error('Not authorized to modify this template');
      err.statusCode = 403;
      throw err;
    }
  }
  return template;
}

async function updateTemplate(id, data) {
  await ensureSeeded();
  const userId = getCurrentUserId();
  await checkOwnershipOrAdmin(id, userId);
  return documentTemplateRepo.update(id, data, userId);
}

async function deleteTemplate(id) {
  await ensureSeeded();
  const userId = getCurrentUserId();
  await checkOwnershipOrAdmin(id, userId);
  const removed = await documentTemplateRepo.remove(id, userId);
  if (removed && userId) {
    const user = await findUserById(userId);
    if (user && Array.isArray(user.starredTemplates)) {
      await updateUserRecord(userId, {
        starredTemplates: user.starredTemplates.filter((tid) => String(tid) !== String(id)),
      });
    }
  }
  return removed;
}

async function getUserStarredIds(userId) {
  if (!userId) return [];
  const user = await findUserById(userId);
  return Array.isArray(user?.starredTemplates) ? user.starredTemplates : [];
}

async function starTemplate(userId, templateId) {
  if (!userId || !templateId) throw new Error('userId and templateId are required');
  const template = await documentTemplateRepo.getById(templateId);
  if (!template) throw new Error('Template not found');

  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');

  const starred = Array.isArray(user.starredTemplates) ? [...user.starredTemplates] : [];
  if (!starred.some((id) => String(id) === String(templateId))) {
    starred.push(String(templateId));
  }
  await updateUserRecord(userId, { starredTemplates: starred });
  return starred;
}

async function unstarTemplate(userId, templateId) {
  if (!userId || !templateId) throw new Error('userId and templateId are required');
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');

  const starred = (Array.isArray(user.starredTemplates) ? user.starredTemplates : [])
    .filter((id) => String(id) !== String(templateId));
  await updateUserRecord(userId, { starredTemplates: starred });
  return starred;
}

async function getStarredTemplates(userId) {
  await ensureSeeded();
  const starredIds = await getUserStarredIds(userId);
  if (!starredIds.length) return [];

  const all = await getAllTemplates();
  const byId = new Map(all.map((t) => [String(t.id), t]));
  return starredIds.map((id) => byId.get(String(id))).filter(Boolean);
}

async function getApprovedPublicTemplates() {
  await ensureSeeded();
  return documentTemplateRepo.listApprovedPublic();
}

async function getCommunityTemplates(userId) {
  await ensureSeeded();
  return documentTemplateRepo.listCommunityForUser(userId);
}

async function getAiTemplates(userId) {
  await ensureSeeded();
  return (await getAllTemplates({ publicOnly: false })).filter(
    (t) => String(t.userId) !== String(userId) || t.isAdminTemplate,
  );
}

async function getPendingApprovalTemplates() {
  await ensureSeeded();
  return documentTemplateRepo.listPendingApproval();
}

async function approveTemplate(id, userId) {
  await ensureSeeded();
  return documentTemplateRepo.approve(id, userId);
}

async function rejectTemplate(id, userId, reason) {
  await ensureSeeded();
  return documentTemplateRepo.reject(id, userId, reason);
}

async function listUserTemplates(targetUserId) {
  await ensureSeeded();
  const userId = getCurrentUserId();
  const currentUser = userId ? await findUserById(userId) : null;
  const isAdmin = currentUser?.role === 'admin';
  
  if (String(userId) !== String(targetUserId) && !isAdmin) {
    throw new Error('Not authorized to access user templates');
  }
  
  const all = await documentTemplateRepo.listAll();
  return all.filter(t => String(t.userId) === String(targetUserId));
}

async function submitTemplateForReview(id) {
  await ensureSeeded();
  const userId = getCurrentUserId();
  await checkOwnershipOrAdmin(id, userId);
  return documentTemplateRepo.submitForApproval(id, userId);
}

async function resolveTemplateForGeneration(templateId, documentType) {
  if (!templateId) return null;
  try {
    const template = await getTemplateById(templateId);
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
  getPendingApprovalTemplates,
  getCommunityTemplates,
  getAiTemplates,
  approveTemplate,
  rejectTemplate,
  listUserTemplates,
  submitTemplateForReview,
};
