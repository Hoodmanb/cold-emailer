const Supabase = require('../services/supabaseService');

const TABLE = 'template_preview_data';

const DEFAULT_PREVIEW_DATA = {
  name: 'Johnathan Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  summary: 'Experienced software engineer with expertise in full-stack development, cloud architecture, and team leadership.',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  githubUrl: 'https://github.com/johndoe',
  experience: [
    {
      role: 'Senior Software Engineer',
      company: 'Tech Corp Inc.',
      startDate: '2020-01',
      endDate: 'Present',
      description: 'Leading backend development for microservices architecture. Improved application performance by 40% using Node.js and Redis caching.',
    },
    {
      role: 'Software Developer',
      company: 'StartupXYZ',
      startDate: '2018-06',
      endDate: '2019-12',
      description: 'Full-stack development using React and Express. Designed and implemented responsive UI components.',
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      institution: 'University of Technology',
      startDate: '2014',
      endDate: '2018',
    }
  ],
  skills: [
    { name: 'JavaScript' },
    { name: 'TypeScript' },
    { name: 'React' },
    { name: 'Node.js' },
    { name: 'Python' },
    { name: 'AWS' }
  ],
  projects: [
    {
      title: 'E-commerce Platform',
      description: 'Built a scalable e-commerce solution serving 10K+ daily users using Next.js and PostgreSQL.',
      link: 'https://github.com/johndoe/ecommerce',
    }
  ],
  certificates: [
    { name: 'AWS Certified Solutions Architect', authority: 'Amazon Web Services', date: '2022' }
  ]
};

async function getPreviewDataRow() {
  try {
    const { data, error } = await Supabase.selectOne(TABLE, { id: 'default-profile' });
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

async function getPreviewData() {
  try {
    const row = await getPreviewDataRow();
    if (!row || !row.data || (typeof row.data === 'object' && !Object.keys(row.data).length)) {
      return DEFAULT_PREVIEW_DATA;
    }
    return { ...DEFAULT_PREVIEW_DATA, ...row.data };
  } catch (err) {
    console.warn('[previewDataRepository] Table not found or error, using default:', err.message);
    return DEFAULT_PREVIEW_DATA;
  }
}

async function savePreviewData(data) {
  const existing = await getPreviewDataRow();
  const payload = { data, updated_at: new Date().toISOString() };
  if (existing) {
    const { error } = await Supabase.update(TABLE, { id: 'default-profile' }, payload);
    if (error) throw error;
  } else {
    const { error } = await Supabase.insert(TABLE, { id: 'default-profile', ...payload });
    if (error) throw error;
  }
  return data;
}

module.exports = {
  getPreviewData,
  savePreviewData,
  DEFAULT_PREVIEW_DATA,
};
