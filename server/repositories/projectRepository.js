const fileStore = require("../utils/fileStore");

const FILENAME = "projects.json";

const getAllProjects = () => {
  const projects = fileStore.read(FILENAME);
  return Array.isArray(projects) ? projects : [];
};

const getProjectById = (id) => {
  const projects = getAllProjects();
  return projects.find((p) => String(p.id) === String(id)) || null;
};

const createProject = (data) => {
  return fileStore.append(FILENAME, data);
};

const updateProject = (id, updates) => {
  return fileStore.update(FILENAME, (p) => String(p.id) === String(id), (p) => ({
    ...p,
    ...updates,
  }));
};

const deleteProject = (id) => {
  return fileStore.remove(FILENAME, (p) => String(p.id) === String(id));
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
