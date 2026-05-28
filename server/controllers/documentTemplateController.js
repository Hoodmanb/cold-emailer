const templateService = require('../services/templates/templateService');
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
};
