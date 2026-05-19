const templateRepo = require('../repositories/templateRepository');

const listTemplates = (req, res) => {
  const templates = templateRepo.listTemplates();
  return res.status(200).json({ message: 'retrieved successfully', data: templates });
};

const getTemplate = (req, res) => {
  const template = templateRepo.getTemplate(req.params.id);
  if (!template) return res.status(404).json({ message: 'No template found' });
  return res.status(200).json({ message: 'retrieved successfully', data: template });
};

const createTemplate = (req, res) => {
  const { name, subject, body, isPublic } = req.body;
  if (!name || !body) {
    return res.status(400).json({ message: 'name and body are required' });
  }
  const template = templateRepo.createTemplate({ name, subject, body, isPublic });
  return res.status(200).json({ message: 'template created successfully', data: template });
};

const updateTemplate = (req, res) => {
  const updated = templateRepo.updateTemplate(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Template not found' });
  return res.status(200).json({ message: 'Template updated successfully', template: updated });
};

const deleteTemplate = (req, res) => {
  const count = templateRepo.deleteTemplate(req.params.id);
  if (count === 0) return res.status(404).json({ message: 'no template found' });
  return res.status(200).json({ message: 'deleted successfully' });
};

module.exports = { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate };
