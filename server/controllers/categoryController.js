const categoryRepo = require('../repositories/categoryRepository');

const listCategories = (req, res) => {
  const categories = categoryRepo.listCategories();
  if (categories.length === 0) {
    return res.status(404).json({ message: 'no category found' });
  }
  return res.status(200).json({ message: 'retrieved successfully', data: categories });
};

const getCategory = (req, res) => {
  const category = categoryRepo.getCategory(req.params.id);
  if (!category) return res.status(404).json({ message: 'category not found' });
  return res.status(200).json({ message: 'retrieved successfully', data: category });
};

const createCategory = (req, res) => {
  const { category } = req.body;
  if (!category) {
    return res.status(400).json({ message: 'validation error', errors: [{ message: 'category is required', path: ['category'] }] });
  }

  const existing = categoryRepo.getCategoryByName(category);
  if (existing) {
    return res.status(409).json({ message: 'field error', errors: { category: 'category already exists' } });
  }

  const newCategory = categoryRepo.createCategory({ category });
  return res.status(200).json({ message: 'created successfully', data: newCategory });
};

const updateCategory = (req, res) => {
  const updated = categoryRepo.updateCategory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'category not found' });
  return res.status(200).json({ message: 'updated successfully', data: updated });
};

const deleteCategory = (req, res) => {
  const count = categoryRepo.deleteCategory(req.params.id);
  if (count === 0) return res.status(404).json({ message: 'category not found' });
  return res.status(204).send();
};

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
