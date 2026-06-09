/**
 * Hardened Scoped Profile Repository
 * Enforces career profile schema structures while preserving default shapes.
 */
const SCHEMAS = require('../shared/validators/schemas');
const projectRepo = require('./projectRepository');
const fileStore = require('../utils/fileStore');

const FILENAME = 'profiles.json';

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  phone: '',
  phoneNumber: '',
  githubUrl: '',
  linkedinUrl: '',
  location: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  certificates: [],
  certifications: [],
  links: { github: '', linkedin: '', portfolio: '' },
};

const getProfile = (userId) => {
  const profile = fileStore.read(FILENAME, userId);
  const normalized =
    profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
  const projects = projectRepo.getAllProjects(userId);
  return { ...DEFAULT_PROFILE, ...normalized, projects };
};

const updateProfile = (data, userId) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Profile update payload must be an object');
  }
  const current = getProfile(userId);
  const { projects, ...cleanData } = data;
  const next = { ...current, ...cleanData };
  delete next.projects;

  if (SCHEMAS.profile) {
    SCHEMAS.profile.validate(next);
  }

  fileStore.write(FILENAME, next, userId);
  return getProfile(userId);
};

module.exports = {
  getProfile,
  updateProfile,
};
