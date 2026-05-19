
const fileStore = require("../utils/fileStore");
const { v4: uuidv4 } = require('uuid');

const FILE = 'templates.json';

const listTemplates = () => fileStore.read(FILE);

const getTemplate = (id) => listTemplates().find((l) => String(l.id) === String(id)) || null;

const createTemplate = (data) => {
  const template = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: '',
    subject: '',
    body: '',
    isPublic: false,
    usageCount: 0,
    lastUsedAt: null,
    ...data,
  };
  return fileStore.append(FILE, template);
};

const updateTemplate = (id, updates) =>
  fileStore.update(FILE, (t) => t.id === id, () => ({
    ...updates,
    updatedAt: new Date().toISOString(),
  }));

const bumpTemplateUsage = (id) => {
  const t = getTemplate(id);
  if (!t) return null;
  return updateTemplate(id, {
    usageCount: (Number(t.usageCount) || 0) + 1,
    lastUsedAt: new Date().toISOString(),
  });
};

const deleteTemplate = (id) => fileStore.remove(FILE, (t) => t.id === id);

module.exports = { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, bumpTemplateUsage };
