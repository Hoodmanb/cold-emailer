const fileStore = require("../utils/fileStore");
const projectRepo = require("./projectRepository");

const FILENAME = "profiles.json";

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  phone: "",
  phoneNumber: "", // WhatsApp
  githubUrl: "",
  linkedinUrl: "",
  location: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  certificates: [],
  certifications: [], // Keeping for backward compatibility if any
  links: { github: "", linkedin: "", portfolio: "" },
};

const getProfile = () => {
  const profile = fileStore.read(FILENAME);
  const projects = projectRepo.getAllProjects();
  return { ...DEFAULT_PROFILE, ...profile, projects };
};

const updateProfile = (data) => {
  const current = getProfile();
  // Filter out projects from the data object as they are stored in projects.json
  const { projects, ...cleanData } = data;
  const next = { ...current, ...cleanData };
  // We also don't want to persist projects inside profiles.json anymore to avoid duplication
  delete next.projects;
  return fileStore.write(FILENAME, next);
};

module.exports = {
  getProfile,
  updateProfile,
};
