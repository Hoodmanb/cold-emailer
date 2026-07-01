const templateRepo = require('../repositories/templateRepository');
const attachmentsRepo = require('../modules/documents/attachments/repository');
const { requireUserId } = require('../utils/requireUserId');

async function syncTemplateAttachments(templateId, attachmentRecords = [], userId) {
  if (!userId || !templateId) return;
  await attachmentsRepo.deleteAttachmentsForParent(templateId, 'email_template', userId);
  for (const record of attachmentRecords) {
    await attachmentsRepo.addAttachment({
      userId,
      parentId: templateId,
      parentType: 'email_template',
      ...record,
    });
  }
}

const listTemplates = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const templates = await templateRepo.listTemplates(userId);
  return res.status(200).json({ message: 'retrieved successfully', data: templates });
};

const getTemplate = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const template = await templateRepo.getTemplate(req.params.id, userId);
  if (!template) return res.status(404).json({ message: 'No template found' });
  return res.status(200).json({ message: 'retrieved successfully', data: template });
};

const createTemplate = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { name, subject, body, isPublic, attachmentRecords } = req.body;
  if (!name || !body) {
    return res.status(400).json({ message: 'name and body are required' });
  }
  const template = await templateRepo.createTemplate({ name, subject, body, isPublic }, userId);
  if (Array.isArray(attachmentRecords) && attachmentRecords.length) {
    await syncTemplateAttachments(template.id, attachmentRecords, userId);
  }
  return res.status(200).json({ message: 'template created successfully', data: template });
};

const updateTemplate = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { attachmentRecords, ...updates } = req.body || {};
  const updated = await templateRepo.updateTemplate(req.params.id, updates, userId);
  if (!updated) return res.status(404).json({ message: 'Template not found' });
  if (Array.isArray(attachmentRecords)) {
    await syncTemplateAttachments(req.params.id, attachmentRecords, userId);
  }
  return res.status(200).json({ message: 'Template updated successfully', data: updated, template: updated });
};

const deleteTemplate = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const count = await templateRepo.deleteTemplate(req.params.id, userId);
  if (count === 0) return res.status(404).json({ message: 'no template found' });
  return res.status(200).json({ message: 'deleted successfully' });
};

module.exports = { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate };
