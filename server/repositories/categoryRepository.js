const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');
const { ensureArray } = require('../utils/jsonNormalizer');

const TABLE_NAME = 'categories';

function fromRow(row) {
  if (!row) return null;
  return {
    ...row,
    category: row.name || row.category || '',
  };
}

const listCategories = async (userId) => {
  const { data, error } = await Supabase.select(TABLE_NAME, {}, userId);
  if (error) throw error;
  return ensureArray(data).map(fromRow);
};

const getCategory = async (id, userId) => {
  const list = await listCategories(userId);
  return list.find((c) => String(c.id) === String(id)) || null;
};

const getCategoryByName = async (name, userId) => {
  const normalizedName = String(name || '').trim().toLowerCase();
  if (!normalizedName) return null;
  const list = await listCategories(userId);
  return list.find((c) => String(c.name || c.category || '').toLowerCase() === normalizedName) || null;
};

const createCategory = async (data, userId) => {
  const categoryName = String(data.category || data.name || '').trim();
  const category = {
    id: uuidv4(),
    created_at: new Date().toISOString(),
    name: categoryName,
    user_id: String(userId),
  };
  const { data: inserted, error } = await Supabase.insert(TABLE_NAME, category, userId);
  if (error) throw error;
  return fromRow(inserted ? inserted[0] : category);
};

const updateCategory = async (id, updates, userId) => {
  const payload = { ...updates };
  if (payload.category !== undefined && payload.name === undefined) {
    payload.name = payload.category;
    delete payload.category;
  }
  const { data, error } = await Supabase.update(TABLE_NAME, { id }, payload, userId);
  if (error) throw error;
  return data && data.length ? fromRow(data[0]) : null;
};

const deleteCategory = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE_NAME, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

module.exports = {
  listCategories,
  getCategory,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};
