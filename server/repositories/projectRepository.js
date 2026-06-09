const fileStore = require('../utils/fileStore');

const FILENAME = 'projects.json';

const getAllProjects = (userId) => {
  const projects = fileStore.read(FILENAME, userId);
  return Array.isArray(projects) ? projects : [];
};

const getProjectById = (id, userId) => {
  const projects = getAllProjects(userId);
  return projects.find((p) => String(p.id) === String(id)) || null;
};

const createProject = (data, userId) => fileStore.append(FILENAME, data, userId);

const updateProject = (id, updates, userId) =>
  fileStore.update(
    FILENAME,
    (p) => String(p.id) === String(id),
    (p) => ({ ...p, ...updates }),
    userId,
  );

const deleteProject = (id, userId) =>
  fileStore.remove(FILENAME, (p) => String(p.id) === String(id), userId);

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
