/**
 * Normalized document model definitions.
 * These are the contracts between AI output and template rendering.
 * The AI produces raw JSON → validated → cast to one of these models → fed to template engine.
 */

/**
 * Creates a default ResumeDocument model.
 * @param {Partial<ResumeDocument>} data
 */
function createResumeDocument(data = {}) {
  return {
    contact: {
      name: String(data.contact?.name || ''),
      email: String(data.contact?.email || ''),
      phone: String(data.contact?.phone || ''),
      location: String(data.contact?.location || ''),
      linkedin: String(data.contact?.linkedin || ''),
      website: String(data.contact?.website || ''),
    },
    summary: String(data.summary || ''),
    experience: Array.isArray(data.experience)
      ? data.experience.map(exp => ({
          title: String(exp.title || ''),
          company: String(exp.company || ''),
          location: String(exp.location || ''),
          startDate: String(exp.startDate || ''),
          endDate: String(exp.endDate || 'Present'),
          bullets: Array.isArray(exp.bullets) ? exp.bullets.map(String) : [],
        }))
      : [],
    education: Array.isArray(data.education)
      ? data.education.map(edu => ({
          degree: String(edu.degree || ''),
          institution: String(edu.institution || ''),
          year: String(edu.year || ''),
          gpa: String(edu.gpa || ''),
        }))
      : [],
    skills: Array.isArray(data.skills) ? data.skills.map(String) : [],
    certifications: Array.isArray(data.certifications) ? data.certifications.map(String) : [],
    atsKeywords: Array.isArray(data.atsKeywords) ? data.atsKeywords.map(String) : [],
  };
}

/**
 * Creates a default CoverLetterDocument model.
 */
function createCoverLetterDocument(data = {}) {
  return {
    senderName: String(data.senderName || ''),
    senderEmail: String(data.senderEmail || ''),
    senderPhone: String(data.senderPhone || ''),
    date: String(data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })),
    recipientName: String(data.recipientName || 'Hiring Manager'),
    recipientTitle: String(data.recipientTitle || ''),
    companyName: String(data.companyName || ''),
    jobTitle: String(data.jobTitle || ''),
    paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs.map(String) : [],
    closing: String(data.closing || 'Sincerely'),
  };
}

/**
 * Creates a default ColdEmailDocument model.
 */
function createColdEmailDocument(data = {}) {
  return {
    subject: String(data.subject || ''),
    recipientName: String(data.recipientName || ''),
    body: String(data.body || ''),
    senderName: String(data.senderName || ''),
    senderTitle: String(data.senderTitle || ''),
  };
}

/**
 * Creates a default ATSReportDocument model.
 */
function createATSReportDocument(data = {}) {
  return {
    score: Number(data.score || 0),
    matchedKeywords: Array.isArray(data.matchedKeywords) ? data.matchedKeywords.map(String) : [],
    missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords.map(String) : [],
    breakdown: {
      technicalSkills: Number(data.breakdown?.technicalSkills || 0),
      keywordMatch: Number(data.breakdown?.keywordMatch || 0),
      softSkills: Number(data.breakdown?.softSkills || 0),
    },
    recommendation: String(data.recommendation || ''),
  };
}

/**
 * Creates a default ProjectSummaryDocument model.
 */
function createProjectSummaryDocument(data = {}) {
  return {
    title: String(data.title || ''),
    tagline: String(data.tagline || ''),
    summary: String(data.summary || ''),
    impact: String(data.impact || ''),
    technologies: Array.isArray(data.technologies) ? data.technologies.map(String) : [],
    highlights: Array.isArray(data.highlights) ? data.highlights.map(String) : [],
    url: String(data.url || ''),
  };
}

/**
 * Creates a default ProposalDocument model.
 */
function createProposalDocument(data = {}) {
  return {
    title: String(data.title || ''),
    subtitle: String(data.subtitle || ''),
    authorName: String(data.authorName || ''),
    authorTitle: String(data.authorTitle || ''),
    date: String(data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })),
    targetAudience: String(data.targetAudience || ''),
    executiveSummary: String(data.executiveSummary || ''),
    sections: Array.isArray(data.sections)
      ? data.sections.map(s => ({
          heading: String(s.heading || ''),
          body: String(s.body || ''),
          bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [],
        }))
      : [],
    closing: String(data.closing || ''),
  };
}

const MODEL_FACTORIES = {
  resume_generation: createResumeDocument,
  cover_letter_generation: createCoverLetterDocument,
  email_generation: createColdEmailDocument,
  ats_analysis: createATSReportDocument,
  project_summary_generation: createProjectSummaryDocument,
  advanced_doc_generation: createProposalDocument,
};

/**
 * Casts raw AI data into the normalized model for the given feature.
 * @param {string} featureId
 * @param {object} rawData
 */
function castToModel(featureId, rawData) {
  const factory = MODEL_FACTORIES[featureId];
  if (!factory) {
    throw new Error(`No document model defined for featureId: ${featureId}`);
  }
  return factory(rawData || {});
}

module.exports = {
  createResumeDocument,
  createCoverLetterDocument,
  createColdEmailDocument,
  createATSReportDocument,
  createProjectSummaryDocument,
  createProposalDocument,
  castToModel,
  MODEL_FACTORIES,
};
