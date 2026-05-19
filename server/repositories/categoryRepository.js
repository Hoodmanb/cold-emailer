const { v4: uuidv4 } = require('uuid');
const fileStore = require("../utils/fileStore");

const FILE = 'categories.json';

const listCategories = () => fileStore.read(FILE);

const getCategory = (id) => listCategories().find((c) => String(c.id) === String(id)) || null;

const getCategoryByName = (name) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  if (!normalizedName) return null;
  return listCategories().find((c) => String(c.category || "").toLowerCase() === normalizedName) || null;
};

const createCategory = (data) => {
  const category = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    category: data.category,
  };
  return fileStore.append(FILE, category);
};

const updateCategory = (id, updates) =>
  fileStore.update(FILE, (c) => c.id === id, () => ({ ...updates }));

const deleteCategory = (id) => fileStore.remove(FILE, (c) => c.id === id);

module.exports = {
  listCategories,
  getCategory,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};
