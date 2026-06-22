const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

const TABLE = 'projects';

function fromRow(row) {
  if (!row) return null;
  const meta = row.meta && typeof row.meta === 'object' ? row.meta : {};
  return {
    ...meta,
    id: row.id,
    title: row.title || meta.title || meta.projectName || '',
    description: row.description || meta.description || '',
    userId: row.user_id,
    createdAt: row.created_at || meta.createdAt,
    updatedAt: row.updated_at || meta.updatedAt,
  };
}

function toRow(project, userId) {
  const now = new Date().toISOString();
  const { id, userId: uid, user_id, title, description, createdAt, updatedAt, ...rest } = project;
  return {
    id: id || uuidv4(),
    user_id: userId || uid || user_id,
    title: String(title || rest.projectName || 'Untitled Project').trim(),
    description: description || rest.description || '',
    meta: {
      ...rest,
      title: title || rest.projectName,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    },
    created_at: createdAt || now,
    updated_at: now,
  };
}

const getAllProjects = async (userId) => {
  const { data, error } = await Supabase.select(TABLE, {}, userId);
  if (error) throw error;
  return (data || []).map(fromRow);
};

const getProjectById = async (id, userId) => {
  const { data, error } = await Supabase.selectOne(TABLE, { id }, userId);
  if (error) throw error;
  return fromRow(data);
};

const createProject = async (data, userId) => {
  const row = toRow(data, userId);
  const { data: inserted, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(inserted?.[0] || row);
};

const updateProject = async (id, updates, userId) => {
  const current = await getProjectById(id, userId);
  if (!current) return null;
  const row = toRow({ ...current, ...updates, id }, userId);
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    {
      title: row.title,
      description: row.description,
      meta: row.meta,
      updated_at: new Date().toISOString(),
    },
    userId,
  );
  if (error) throw error;
  return fromRow(data[0] || row);
};

const deleteProject = async (id, userId) => {
  const { data, error } = await Supabase.delete(TABLE, { id }, userId);
  if (error) throw error;
  return data ? data.length : 0;
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
