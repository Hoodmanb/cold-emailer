/**
 * Hardened Scoped Profile Repository
 * Enforces career profile schema structures while preserving default shapes.
 */
const BaseRepository = require('../infrastructure/db/BaseRepository');
const SCHEMAS = require('../shared/validators/schemas');
const projectRepo = require("./projectRepository");
const fileStore = require("../utils/fileStore");

const FILENAME = "profiles.json";
const profileRepo = new BaseRepository(FILENAME, SCHEMAS.profile);

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
  certifications: [], // Keeping for backward compatibility
  links: { github: "", linkedin: "", portfolio: "" },
};

const getProfile = () => {
  const profile = profileRepo.readAll();
  const projects = projectRepo.getAllProjects();
  return { ...DEFAULT_PROFILE, ...profile, projects };
};

const updateProfile = (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Profile update payload must be an object");
  }
  const current = getProfile();
  const { projects, ...cleanData } = data;
  const next = { ...current, ...cleanData };
  delete next.projects;

  if (SCHEMAS.profile) {
    SCHEMAS.profile.validate(next);
  }

  fileStore.write(FILENAME, next);
  return getProfile();
};

module.exports = {
  getProfile,
  updateProfile,
};
