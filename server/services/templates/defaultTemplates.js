const { v4: uuidv4 } = require('uuid');

const DEFAULT_DOCUMENT_TEMPLATES = [
  {
    id: 'd9e9c9c3-7e4d-4a11-85b4-2977461a293b', // Fixed UUID for ATS Classic
    name: 'ATS Classic Resume',
    description: 'A clean, single-column ATS optimized resume template.',
    type: 'cv',
    layout: {
      type: 'single-column',
      blocks: ['profile', 'experience', 'education', 'skills', 'projects', 'certificates']
    },
    blocks: {
      profile: { type: 'profile', title: 'Profile Summary' },
      experience: { type: 'experience', title: 'Professional Experience' },
      education: { type: 'education', title: 'Education' },
      skills: { type: 'skills', title: 'Key Skills' },
      projects: { type: 'projects', title: 'Projects' },
      certificates: { type: 'certificates', title: 'Certifications' }
    },
    style: {
      fontFamily: 'Inter, "Segoe UI", sans-serif',
      primaryColor: '#111111',
      fontSize: 12,
      spacing: 12
    },
    isPublic: true,
    isApproved: true,
    isAdminTemplate: true,
    userId: null,
  },
  {
    id: 'f391b1a7-89df-419b-a01c-7f55f284e311', // Fixed UUID for Modern Two-Column
    name: 'Modern Two-Column CV',
    description: 'A stylish, two-column layout highlighting your profile and skills in a sidebar.',
    type: 'cv',
    layout: {
      type: 'two-column',
      columns: [
        { width: '30%', blocks: ['profile', 'skills', 'certificates'] },
        { width: '70%', blocks: ['experience', 'projects', 'education'] }
      ]
    },
    blocks: {
      profile: { type: 'profile', title: 'About Me' },
      experience: { type: 'experience', title: 'Work History' },
      education: { type: 'education', title: 'Education' },
      skills: { type: 'skills', title: 'Expertise' },
      projects: { type: 'projects', title: 'Key Projects' },
      certificates: { type: 'certificates', title: 'Certifications' }
    },
    style: {
      fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
      primaryColor: '#2563eb',
      fontSize: 11,
      spacing: 10
    },
    isPublic: true,
    isApproved: true,
    isAdminTemplate: true,
    userId: null,
  }
];

async function seedDefaultTemplates(repo) {
  try {
    const existing = await repo.listAll();
    
    // Seed only if no admin templates exist
    const hasAdminTemplates = existing.some(t => t.isAdminTemplate);
    if (hasAdminTemplates) return existing;

    console.log('[defaultTemplates] Seeding default document templates...');
    
    const seeded = DEFAULT_DOCUMENT_TEMPLATES.map((t) => ({
      ...t,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const results = await repo.upsertMany(seeded);
    console.log(`[defaultTemplates] Seeded ${results.length} default templates`);
    return results;
  } catch (err) {
    console.error('[defaultTemplates] Seeding failed:', err.message);
    return [];
  }
}

module.exports = { DEFAULT_DOCUMENT_TEMPLATES, seedDefaultTemplates };
