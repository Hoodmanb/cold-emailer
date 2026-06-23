const categoryRepo = require('../repositories/categoryRepository');
const { requireUserId } = require('../utils/requireUserId');

const listCategories = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const categories = await categoryRepo.listCategories(userId);
    if (categories.length === 0) {
      return res.status(404).json({ message: 'no category found' });
    }
    return res.status(200).json({ message: 'retrieved successfully', data: categories });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const getCategory = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const category = await categoryRepo.getCategory(req.params.id, userId);
    if (!category) return res.status(404).json({ message: 'category not found' });
    return res.status(200).json({ message: 'retrieved successfully', data: category });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({
        message: 'validation error',
        errors: [{ message: 'category is required', path: ['category'] }],
      });
    }

    const existing = await categoryRepo.getCategoryByName(category, userId);
    if (existing) {
      return res.status(409).json({ message: 'field error', errors: { category: 'category already exists' } });
    }

    const newCategory = await categoryRepo.createCategory({ category }, userId);
    return res.status(200).json({ message: 'created successfully', data: newCategory });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const updated = await categoryRepo.updateCategory(req.params.id, req.body, userId);
    if (!updated) return res.status(404).json({ message: 'category not found' });
    return res.status(200).json({ message: 'updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const count = await categoryRepo.deleteCategory(req.params.id, userId);
    if (count === 0) return res.status(404).json({ message: 'category not found' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
