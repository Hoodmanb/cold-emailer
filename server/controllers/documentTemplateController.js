const templateService = require('../services/templates/templateService');
const { generatePreviewPages } = require('../services/templates/previewGenerator');
const { successResponse } = require('../utils/response');
const { getCurrentUserId } = require('../middleware/requestContext');

const listTemplates = (req, res) => {
  const { type, publicOnly } = req.query;
  const templates = templateService.getAllTemplates({
    type,
    publicOnly: publicOnly === 'true' || publicOnly === '1',
  });
  const userId = getCurrentUserId();
  const starredIds = templateService.getUserStarredIds(userId);
  return successResponse(res, {
    message: 'Templates retrieved',
    data: { templates, starredIds },
  });
};

const getPublicTemplates = (req, res) => {
  const { type } = req.query;
  const templates = templateService.getAllTemplates({ type, publicOnly: true });
  const userId = getCurrentUserId();
  const starredIds = userId ? templateService.getUserStarredIds(userId) : [];
  return successResponse(res, {
    message: 'Public templates retrieved',
    data: { templates, starredIds },
  });
};

const getTemplate = (req, res) => {
  const template = templateService.getTemplateById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  return successResponse(res, { message: 'Template retrieved', data: template });
};

const createTemplateHandler = (req, res) => {
  const template = templateService.createTemplate(req.body || {});
  return successResponse(res, {
    status: 201,
    message: 'Template created',
    data: template,
  });
};

const updateTemplateHandler = (req, res) => {
  const updated = templateService.updateTemplate(req.params.id, req.body || {});
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  return successResponse(res, { message: 'Template updated', data: updated });
};

const deleteTemplateHandler = (req, res) => {
  const removed = templateService.deleteTemplate(req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  return successResponse(res, { message: 'Template deleted' });
};

const starTemplate = (req, res) => {
  const userId = getCurrentUserId();
  const starredIds = templateService.starTemplate(userId, req.params.id);
  return successResponse(res, { message: 'Template starred', data: { starredIds } });
};

const unstarTemplate = (req, res) => {
  const userId = getCurrentUserId();
  const starredIds = templateService.unstarTemplate(userId, req.params.id);
  return successResponse(res, { message: 'Template unstarred', data: { starredIds } });
};

const getStarredTemplates = (req, res) => {
  const userId = getCurrentUserId();
  const templates = templateService.getStarredTemplates(userId);
  return successResponse(res, {
    message: 'Starred templates retrieved',
    data: { templates, starredIds: templateService.getUserStarredIds(userId) },
  });
};

const listPendingTemplates = (req, res) => {
  const templates = templateService.getPendingApprovalTemplates();
  return successResponse(res, { message: 'Pending templates retrieved', data: { templates } });
};

const approveTemplate = (req, res) => {
  const userId = getCurrentUserId();
  const updated = templateService.approveTemplate(req.params.id, userId);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  return successResponse(res, { message: 'Template approved', data: updated });
};

const rejectTemplate = (req, res) => {
  const userId = getCurrentUserId();
  const updated = templateService.rejectTemplate(req.params.id, userId, req.body?.reason);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  return successResponse(res, { message: 'Template rejected', data: updated });
};

const getTemplatePreview = (req, res) => {
  const template = templateService.getTemplateById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  let html = template[`previewPage${page}`] || (Array.isArray(template.previewPages) ? template.previewPages[page - 1]?.html : null);
  if (!html) {
    // Generate preview on the fly if missing
    const previewData = generatePreviewPages(template);
    // Persist generated preview data back to storage
    const documentTemplateRepo = require('../repositories/documentTemplateRepository');
    const { FILE } = documentTemplateRepo;
    const fileStore = require('../utils/fileStore');
    // Update the stored template with generated preview fields
    fileStore.update(FILE, (t) => String(t.id) === String(template.id), (t) => ({
      ...t,
      ...previewData,
      previewPages: previewData.previewPages.map(p => p.html),
    }));
    Object.assign(template, previewData);
    html = previewData.previewPages[page - 1]?.html || null;
    if (!html) {
      return res.status(404).json({ success: false, message: 'Preview not found' });
    }
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
};

module.exports = {
  listTemplates,
  getPublicTemplates,
  getTemplate,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  starTemplate,
  unstarTemplate,
  getStarredTemplates,
  listPendingTemplates,
  approveTemplate,
  rejectTemplate,
  getTemplatePreview,
};
