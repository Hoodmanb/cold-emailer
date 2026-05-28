const { v4: uuidv4 } = require('uuid');

const DEFAULT_DOCUMENT_TEMPLATES = [
  {
    id: 'tpl-resume-ats-classic',
    name: 'ATS Classic Resume',
    type: 'resume',
    structure: ['Header', 'Professional Summary', 'Core Skills', 'Experience', 'Education', 'Certifications'],
    style: { tone: 'professional', bulletStyle: 'quantified', atsOptimized: true, maxPages: 1 },
    aiRules: 'Use concise bullet points with quantified achievements. Keep language ATS-friendly with standard section headings. Avoid tables, columns, or graphics.',
    preview: 'Clean single-page ATS resume with quantified bullets',
    isPublic: true,
    createdBy: null,
  },
  {
    id: 'tpl-resume-modern-impact',
    name: 'Modern Impact Resume',
    type: 'resume',
    structure: ['Header', 'Summary', 'Key Achievements', 'Experience', 'Skills', 'Education'],
    style: { tone: 'confident', bulletStyle: 'impact-first', atsOptimized: true, maxPages: 1 },
    aiRules: 'Lead each experience entry with measurable impact. Use strong action verbs. Summary should be 3-4 lines highlighting top value proposition.',
    preview: 'Impact-focused resume emphasizing achievements',
    isPublic: true,
    createdBy: null,
  },
  {
    id: 'tpl-cv-executive',
    name: 'Executive Professional CV',
    type: 'cv',
    structure: ['Header', 'Executive Summary', 'Career Highlights', 'Professional Experience', 'Leadership & Projects', 'Education', 'Skills', 'Publications & Awards'],
    style: { tone: 'executive', bulletStyle: 'detailed', multiPage: true, maxPages: 3 },
    aiRules: 'Write a detailed multi-page CV with expanded role descriptions. Include context, scope, and outcomes for each position. Use narrative paragraphs where appropriate.',
    preview: 'Detailed executive-style professional CV',
    isPublic: true,
    createdBy: null,
  },
  {
    id: 'tpl-cv-academic',
    name: 'Academic Professional CV',
    type: 'cv',
    structure: ['Header', 'Research Summary', 'Education', 'Research Experience', 'Publications', 'Teaching', 'Skills', 'References'],
    style: { tone: 'formal', bulletStyle: 'detailed', multiPage: true },
    aiRules: 'Use formal academic tone. Expand research and teaching sections. Include publication-style formatting where relevant.',
    preview: 'Academic-oriented professional CV layout',
    isPublic: true,
    createdBy: null,
  },
  {
    id: 'tpl-cover-standard',
    name: 'Standard Cover Letter',
    type: 'cover_letter',
    structure: ['Header', 'Opening Hook', 'Why This Company', 'Relevant Experience', 'Closing Call to Action'],
    style: { tone: 'professional', length: 'medium', paragraphs: 4 },
    aiRules: 'Write 3-4 concise paragraphs. Opening must reference the specific role. Connect candidate strengths to job requirements. End with a confident call to action.',
    preview: 'Classic 4-paragraph cover letter structure',
    isPublic: true,
    createdBy: null,
  },
  {
    id: 'tpl-cover-story',
    name: 'Story-Driven Cover Letter',
    type: 'cover_letter',
    structure: ['Header', 'Personal Hook', 'Problem-Solution Narrative', 'Value Proposition', 'Closing'],
    style: { tone: 'engaging', length: 'medium', paragraphs: 4 },
    aiRules: 'Open with a brief compelling story or insight. Show genuine enthusiasm for the company mission. Keep tone warm but professional.',
    preview: 'Narrative cover letter with personal hook',
    isPublic: true,
    createdBy: null,
  },
  {
    id: 'tpl-email-outreach',
    name: 'Cold Outreach Email',
    type: 'email',
    structure: ['Subject Line', 'Greeting', 'Value Hook', 'Credibility Proof', 'Soft CTA', 'Sign-off'],
    style: { tone: 'concise', maxWords: 150 },
    aiRules: 'Keep under 150 words. Subject line must be specific and curiosity-driven. One clear soft call to action. No overly salesy language.',
    preview: 'Short cold outreach email template',
    isPublic: true,
    createdBy: null,
  },
];

function seedDefaultTemplates(repo) {
  const existing = repo.listAll();
  if (existing.length > 0) return existing;

  const seeded = DEFAULT_DOCUMENT_TEMPLATES.map((t) => ({
    ...t,
    id: t.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return repo.upsertMany(seeded);
}

module.exports = { DEFAULT_DOCUMENT_TEMPLATES, seedDefaultTemplates };
