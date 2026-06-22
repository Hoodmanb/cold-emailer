const SCHEMAS = require('../shared/validators/schemas');
const Supabase = require('../services/supabaseService');
const projectRepo = require('./projectRepository');

const TABLE = 'profiles';

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

async function getProfileRow(userId) {
  const { data, error } = await Supabase.selectOne(TABLE, { id: userId });
  if (error) throw error;
  return data;
}

const getProfile = async (userId) => {
  const row = await getProfileRow(userId);
  const normalized = row?.data && typeof row.data === 'object' ? row.data : {};
  const projects = await projectRepo.getAllProjects(userId);
  return { ...DEFAULT_PROFILE, ...normalized, projects };
};

const updateProfile = async (data, userId) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Profile update payload must be an object');
  }
  const current = await getProfile(userId);
  const { projects, ...cleanData } = data;
  const next = { ...current, ...cleanData };
  delete next.projects;

  if (SCHEMAS.profile) {
    SCHEMAS.profile.validate(next);
  }

  const { data: upserted, error } = await Supabase.upsert(
    TABLE,
    {
      id: userId,
      data: next,
      updated_at: new Date().toISOString(),
    },
    userId,
    'id',
  );
  if (error) throw error;
  return getProfile(userId);
};

module.exports = {
  getProfile,
  updateProfile,
};
