const { v4: uuidv4 } = require('uuid');
const fileStore = require('../utils/fileStore');
const { ensureArray } = require('../utils/jsonNormalizer');

const FILE = 'categories.json';

const listCategories = (userId) => ensureArray(fileStore.read(FILE, userId));

const getCategory = (id, userId) =>
  listCategories(userId).find((c) => String(c.id) === String(id)) || null;

const getCategoryByName = (name, userId) => {
  const normalizedName = String(name || '').trim().toLowerCase();
  if (!normalizedName) return null;
  return (
    listCategories(userId).find(
      (c) => String(c.category || '').toLowerCase() === normalizedName,
    ) || null
  );
};

const createCategory = (data, userId) => {
  const category = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    category: data.category,
  };
  return fileStore.append(FILE, category, userId);
};

const updateCategory = (id, updates, userId) =>
  fileStore.update(FILE, (c) => c.id === id, () => ({ ...updates }), userId);

const deleteCategory = (id, userId) =>
  fileStore.remove(FILE, (c) => c.id === id, userId);

module.exports = {
  listCategories,
  getCategory,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};
