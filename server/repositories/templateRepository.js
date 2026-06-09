const fileStore = require('../utils/fileStore');
const { ensureArray } = require('../utils/jsonNormalizer');
const { v4: uuidv4 } = require('uuid');

const FILE = 'templates.json';

const listTemplates = (userId) => ensureArray(fileStore.read(FILE, userId));

const getTemplate = (id, userId) =>
  listTemplates(userId).find(
    (l) => String(l.id) === String(id) || String(l._id) === String(id),
  ) || null;

const createTemplate = (data, userId) => {
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
  return fileStore.append(FILE, template, userId);
};

const updateTemplate = (id, updates, userId) =>
  fileStore.update(
    FILE,
    (t) => t.id === id,
    () => ({
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
    userId,
  );

const bumpTemplateUsage = (id, userId) => {
  const t = getTemplate(id, userId);
  if (!t) return null;
  return updateTemplate(
    id,
    {
      usageCount: (Number(t.usageCount) || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    },
    userId,
  );
};

const deleteTemplate = (id, userId) =>
  fileStore.remove(FILE, (t) => t.id === id, userId);

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  bumpTemplateUsage,
};
