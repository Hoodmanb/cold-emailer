/**
 * Job Workflow Service
 * ─────────────────────────────────────────────────────────
 * Orchestrates the full pipeline for a job submission:
 *
 *   1. Parse job description
 *   2. Run local ATS score
 *   3. Generate resume draft (AI)
 *   4. Generate cover letter draft (AI)
 *   5. Generate cold email draft (AI)
 *   6. Score the email
 *   7. Save all drafts to repositories
 *   8. Update the job record
 *   9. Write audit log entries
 *  10. Return full workflow result
 *
 * All generated content is in DRAFT status — nothing is sent.
 * User must explicitly approve before anything goes out.
 */

const { parseJob } = require('../../modules/job/jobParser');
const { scoreATS } = require('../../modules/job/atsEngine');
const aiService = require('../aiService');
const { scoreEmail } = require('../../modules/email/emailScorer');
const jobRepo = require('../../repositories/jobRepository');
const documentRegistry = require('../document/documentRegistry');
const emailRepo = require('../../repositories/emailRepository');
const { log, ACTION_TYPES } = require('../../logs/auditLogger');
const { ExternalApiError } = require('../../shared/errors/customErrors');
const { normalizeTailoringLevel } = require('../../domains/ai/core/tailoringConfig');
const { normalizeFormat } = require('../document/documentPersistenceService');
const templateService = require('../templates/templateService');

function resolveTemplateIdForType(templateIds, type) {
  if (!templateIds || typeof templateIds !== 'object') return null;
  const id = templateIds[type];
  return id ? String(id) : null;
}

async function buildTemplateFields(templateId, documentType) {
  if (!templateId) return {};
  const template = await templateService.resolveTemplateForGeneration(templateId, documentType);
  if (!template) return {};
  return {
    templateId: template.id,
    templateName: template.name,
    metadata: { templateId: template.id, templateName: template.name },
  };
}

function buildAiOptions(baseOptions, templateId, documentType) {
  if (!templateId) return baseOptions;
  return { ...baseOptions, templateId };
}

const runAiStep = async (stepName, fn, fallbackValue) => {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[workflow] ${stepName} failed:`, err.message);
    if (fallbackValue !== undefined) return fallbackValue;
    throw err;
  }
};

/**
 * Run the full job workflow pipeline.
 *
 * @param {object} options
 * @param {string} options.jobId - Existing job ID to process
 * @param {object} options.profile - User career profile
 * @param {object} [options.recipientData] - Optional recipient for email personalization
 * @returns {object} Workflow result with all generated drafts
 */
const runJobWorkflow = async ({ jobId, profile, recipientData = {}, userId }) => {
  if (!userId) throw new Error('userId is required for workflow execution');
  const startTime = Date.now();

  // ── Audit: Workflow started ────────────────────────────────
  log(ACTION_TYPES.WORKFLOW_STARTED, {
    module: 'workflow',
    jobId,
    model: (await aiService.resolveFeatureConfig('resume_generation')).model,
    details: 'Full pipeline started',
  });

  try {
    // ── Step 1: Load job ──────────────────────────────────────
    const job = await jobRepo.getJob(jobId, userId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    // ── Step 2: Parse job description ────────────────────────
    let parsedData = job.parsedData;
    if (!parsedData || Object.keys(parsedData).length === 0) {
      parsedData = parseJob(job.rawDescription, {
        title: job.title,
        company: job.company,
        location: job.location,
      });
      await jobRepo.updateJob(jobId, { parsedData }, userId);
    }

    // ── Step 3: Local ATS score ───────────────────────────────
    let atsResult;
    try {
      const aiAts = await aiService.analyzeATS({ ...job, parsedData }, profile);
      atsResult = {
        score: Number(aiAts.score) || 0,
        matchedKeywords: Array.isArray(aiAts.matchedKeywords) ? aiAts.matchedKeywords : [],
        missingKeywords: Array.isArray(aiAts.missingKeywords) ? aiAts.missingKeywords : [],
        breakdown: aiAts.breakdown || {},
        scoredAt: new Date().toISOString(),
        meta: aiAts.meta,
        schemaVersion: aiAts.schemaVersion,
      };
    } catch (_err) {
      atsResult = scoreATS(parsedData, profile);
    }
    await jobRepo.updateJob(jobId, { atsScore: atsResult.score, atsBreakdown: atsResult }, userId);

    // ── Step 4: AI Resume (draft) ─────────────────────────────
    const resumeConfig = await aiService.resolveFeatureConfig('resume_generation');
    const resumeContent = await runAiStep(
      'resume_generation',
      () => aiService.generateResume({ ...job, parsedData }, profile)
    );

    const resumeDoc = await documentRegistry.createDocument({
      jobId, type: 'resume', content: resumeContent, model: resumeConfig.model, status: 'draft',
      source: 'workflow',
    });

    await jobRepo.linkDocument(jobId, resumeDoc.id, userId);

    log(ACTION_TYPES.AI_GENERATED, {
      module: 'resume',
      jobId,
      entityId: resumeDoc.id,
      entityType: 'document',
      model: resumeConfig.model,
      details: 'Resume draft generated',
    });

    log(ACTION_TYPES.DRAFT_CREATED, {
      module: 'resume',
      entityId: resumeDoc.id,
      entityType: 'document',
      details: 'Resume set to draft status',
    });

    // ── Step 5: AI Cover Letter (draft) ─────────────────────
    const coverConfig = await aiService.resolveFeatureConfig('cover_letter_generation');
    const coverLetterContent = await runAiStep(
      'cover_letter_generation',
      () => aiService.generateCoverLetter({ ...job, parsedData }, profile)
    );

    const coverLetterDoc = await documentRegistry.createDocument({
      jobId,
      type: 'cover-letter',
      content: coverLetterContent,
      model: coverConfig.model,
      status: 'draft',
    });

    await jobRepo.linkDocument(jobId, coverLetterDoc.id, userId);

    log(ACTION_TYPES.AI_GENERATED, {
      module: 'cover-letter',
      jobId,
      entityId: coverLetterDoc.id,
      entityType: 'document',
      model: coverConfig.model,
      details: 'Cover letter draft generated',
    });

    log(ACTION_TYPES.DRAFT_CREATED, {
      module: 'cover-letter',
      entityId: coverLetterDoc.id,
      entityType: 'document',
    });

    // ── Step 6: AI Cold Email (draft) ───────────────────────
    const emailConfig = await aiService.resolveFeatureConfig('email_generation');
    const emailContent = await runAiStep(
      'email_generation',
      () => aiService.generateEmail({ ...job, parsedData }, profile, recipientData)
    );

    // Parse subject + body from AI output
    const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = emailContent.match(/BODY:\s*([\s\S]+)/i);
    const emailSubject = subjectMatch?.[1]?.trim() || `Application for ${job.title} at ${job.company}`;
    const emailBody = bodyMatch?.[1]?.trim() || emailContent;

    // Score the email
    const emailScores = scoreEmail(emailBody, {
      recipientData,
      jobData: { ...job, parsedData },
      profile,
    });

    const emailRecord = await emailRepo.saveEmail({
      jobId,
      to: recipientData.email || '',
      subject: emailSubject,
      body: emailBody,
      model: emailConfig.model,
      status: 'draft',
      scores: emailScores,
    }, userId);

    await jobRepo.linkEmail(jobId, emailRecord.id, userId);

    log(ACTION_TYPES.AI_GENERATED, {
      module: 'cold-email',
      jobId,
      entityId: emailRecord.id,
      entityType: 'email',
      model: emailConfig.model,
      details: `Cold email draft generated. Scores: P=${emailScores.personalization}, R=${emailScores.relevance}, T=${emailScores.tone}`,
    });

    log(ACTION_TYPES.DRAFT_CREATED, {
      module: 'cold-email',
      entityId: emailRecord.id,
      entityType: 'email',
    });

    // ── Step 7: Final result ──────────────────────────────────
    const durationMs = Date.now() - startTime;

    log(ACTION_TYPES.WORKFLOW_COMPLETED, {
      module: 'workflow',
      jobId,
      model: emailConfig.model,
      details: `Pipeline completed in ${durationMs}ms`,
    });

    return {
      success: true,
      jobId,
      model: emailConfig.model,
      durationMs,
      ats: atsResult,
      resume: resumeDoc,
      coverLetter: coverLetterDoc,
      email: emailRecord,
      parsedJob: parsedData,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    log(ACTION_TYPES.WORKFLOW_FAILED, {
      module: 'workflow',
      jobId,
      model: (await aiService.resolveFeatureConfig('email_generation')).model,
      details: error.message,
      durationMs,
    });

    if (error instanceof ExternalApiError || error.type === 'external_api_error') {
      return {
        success: false,
        jobId,
        partial: true,
        type: 'external_api_error',
        error: error.message || 'External service temporarily unavailable',
        message: error.message || 'External service temporarily unavailable',
        durationMs,
      };
    }

    throw error;
  }
};

/**
 * Regenerate a single document type (resume | cover-letter | email).
 * Creates a new draft — does not overwrite the existing one.
 */
const regenerateDocument = async ({ jobId, type, profile, recipientData = {}, userId }) => {
  if (!userId) throw new Error('userId is required for document regeneration');
  const job = await jobRepo.getJob(jobId, userId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  let content;
  let doc;

  try {
    if (type === 'resume') {
      const cfg = await aiService.resolveFeatureConfig('resume_generation');
      content = await aiService.generateResume(job, profile);
      doc = await documentRegistry.createDocument({ jobId, type: 'resume', content, model: cfg.model, status: 'draft' });
    } else if (type === 'cover-letter') {
      const cfg = await aiService.resolveFeatureConfig('cover_letter_generation');
      content = await aiService.generateCoverLetter(job, profile);
      doc = await documentRegistry.createDocument({ jobId, type: 'cover-letter', content, model: cfg.model, status: 'draft' });
    } else if (type === 'email') {
      const cfg = await aiService.resolveFeatureConfig('email_generation');
      content = await aiService.generateEmail(job, profile, recipientData);
      const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
      const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);
      const emailScores = scoreEmail(bodyMatch?.[1]?.trim() || content, {
        recipientData, jobData: job, profile,
      });
      doc = await emailRepo.saveEmail({
        jobId,
        to: recipientData.email || '',
        subject: subjectMatch?.[1]?.trim() || '',
        body: bodyMatch?.[1]?.trim() || content,
        model: cfg.model,
        status: 'draft',
        scores: emailScores,
      }, userId);
    } else {
      throw new Error(`Unknown document type: ${type}`);
    }
  } catch (err) {
    if (err instanceof ExternalApiError || err.type === 'external_api_error') {
      const wrapped = new Error(err.message || 'External service temporarily unavailable');
      wrapped.statusCode = err.statusCode || 502;
      wrapped.type = 'external_api_error';
      wrapped.errorCode = 'EXTERNAL_API_ERROR';
      throw wrapped;
    }
    throw err;
  }

  const model = doc.model || (await aiService.resolveFeatureConfig('email_generation')).model;
  log(ACTION_TYPES.AI_GENERATED, {
    module: type,
    jobId,
    entityId: doc.id,
    entityType: type === 'email' ? 'email' : 'document',
    model,
    details: `${type} regenerated as new draft`,
  });

  return doc;
};

/**
 * Run ATS analysis only — no document generation.
 * Use this to show the user their ATS score before they decide what to generate.
 */
const runAtsOnly = async ({ jobId, profile, userId }) => {
  if (!userId) throw new Error('userId is required for ATS analysis');
  const startTime = Date.now();
  const job = await jobRepo.getJob(jobId, userId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  let parsedData = job.parsedData;
  if (!parsedData || Object.keys(parsedData).length === 0) {
    parsedData = parseJob(job.rawDescription, {
      title: job.title,
      company: job.company,
      location: job.location,
    });
    await jobRepo.updateJob(jobId, { parsedData }, userId);
  }

  let atsResult;
  try {
    const aiAts = await aiService.analyzeATS({ ...job, parsedData }, profile);
    atsResult = {
      score: Number(aiAts.score) || 0,
      matchedKeywords: Array.isArray(aiAts.matchedKeywords) ? aiAts.matchedKeywords : [],
      missingKeywords: Array.isArray(aiAts.missingKeywords) ? aiAts.missingKeywords : [],
      breakdown: aiAts.breakdown || {},
      scoredAt: new Date().toISOString(),
      meta: aiAts.meta,
      schemaVersion: aiAts.schemaVersion,
    };
  } catch (_err) {
    atsResult = scoreATS(parsedData, profile);
  }

  await jobRepo.updateJob(jobId, { atsScore: atsResult.score, atsBreakdown: atsResult }, userId);

  log(ACTION_TYPES.WORKFLOW_COMPLETED, {
    module: 'workflow',
    jobId,
    details: `ATS-only analysis completed in ${Date.now() - startTime}ms`,
  });

  return {
    success: true,
    jobId,
    ats: atsResult,
    parsedJob: parsedData,
    durationMs: Date.now() - startTime,
  };
};

/**
 * Generate only the document types selected by the user.
 * Replaces the auto-generate-everything workflow for production UX.
 *
 * @param {object} options
 * @param {string}   options.jobId
 * @param {object}   options.profile
 * @param {string[]} options.types - e.g. ['resume', 'cover-letter', 'email']
 * @param {object} [options.formats] - per-type format map e.g. { resume: 'pdf', 'cover-letter': 'docx' }
 * @param {string}   [options.format] - legacy global format fallback
 * @param {string}   [options.tailoringLevel] - conservative | balanced | aggressive
 * @param {object}   [options.recipientData]
 */
const generateSelectedDocuments = async ({
  jobId,
  profile,
  types,
  formats = {},
  format = 'pdf',
  tailoringLevel = 'balanced',
  recipientData = {},
  templateIds = {},
  userId,
}) => {
  if (!userId) throw new Error('userId is required for document generation');
  const startTime = Date.now();
  const job = await jobRepo.getJob(jobId, userId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  let parsedData = job.parsedData;
  if (!parsedData || Object.keys(parsedData).length === 0) {
    parsedData = parseJob(job.rawDescription, { title: job.title, company: job.company, location: job.location });
    await jobRepo.updateJob(jobId, { parsedData }, userId);
  }

  const validTypes = Array.isArray(types) && types.length ? types : ['resume'];
  const safeTailoring = normalizeTailoringLevel(tailoringLevel);
  const legacyFormat = normalizeFormat(format, 'pdf');
  const aiOptions = { tailoringLevel: safeTailoring };
  const results = {};

  const resolveTypeFormat = (type) => normalizeFormat(formats[type] || legacyFormat, 'pdf');

  log(ACTION_TYPES.WORKFLOW_STARTED, {
    module: 'workflow',
    jobId,
    details: `Selective generation started: [${validTypes.join(', ')}] tailoring=${safeTailoring}`,
  });

  try {
    if (validTypes.includes('resume')) {
      const cfg = await aiService.resolveFeatureConfig('resume_generation');
      const typeFormat = resolveTypeFormat('resume');
      const resumeTemplateId = resolveTemplateIdForType(templateIds, 'resume');
      const resumeTemplateFields = await buildTemplateFields(resumeTemplateId, 'resume');
      const content = await runAiStep('resume_generation', () =>
        aiService.generateResume({ ...job, parsedData }, profile, buildAiOptions(aiOptions, resumeTemplateId, 'resume'))
      );
      const doc = await documentRegistry.createDocument({
        jobId,
        generatedFromJobId: jobId,
        type: 'resume',
        editableContent: content,
        content,
        contentSource: 'ai',
        format: typeFormat,
        exportFormat: typeFormat,
        status: 'draft',
        model: cfg.model,
        tailoringLevel: safeTailoring,
        title: `Resume — ${job.title} at ${job.company}`,
        source: 'workflow',
        ...resumeTemplateFields,
        metadata: {
          ...(resumeTemplateFields.metadata || {}),
        },
      });
      await jobRepo.linkDocument(jobId, doc.id, userId);
      log(ACTION_TYPES.AI_GENERATED, { module: 'resume', jobId, entityId: doc.id, entityType: 'document', model: cfg.model, details: 'Resume draft generated (selective)' });
      results.resume = doc;
    }

    if (validTypes.includes('professional-cv')) {
      const cfg = await aiService.resolveFeatureConfig('professional_cv_generation');
      const typeFormat = resolveTypeFormat('professional-cv');
      const cvTemplateId = resolveTemplateIdForType(templateIds, 'professional-cv');
      const cvTemplateFields = await buildTemplateFields(cvTemplateId, 'professional-cv');
      const content = await runAiStep('professional_cv_generation', () =>
        aiService.generateProfessionalCv({ ...job, parsedData }, profile, buildAiOptions(aiOptions, cvTemplateId, 'professional-cv'))
      );
      const doc = await documentRegistry.createDocument({
        jobId,
        generatedFromJobId: jobId,
        type: 'professional-cv',
        editableContent: content,
        content,
        contentSource: 'ai',
        format: typeFormat,
        exportFormat: typeFormat,
        status: 'draft',
        model: cfg.model,
        tailoringLevel: safeTailoring,
        source: 'workflow',
        title: `Professional CV — ${job.title} at ${job.company}`,
        ...cvTemplateFields,
        metadata: {
          ...(cvTemplateFields.metadata || {}),
        },
      });
      await jobRepo.linkDocument(jobId, doc.id, userId);
      log(ACTION_TYPES.AI_GENERATED, { module: 'professional-cv', jobId, entityId: doc.id, entityType: 'document', model: cfg.model, details: 'Professional CV generated (selective)' });
      results.professionalCv = doc;
    }

    if (validTypes.includes('cover-letter')) {
      const cfg = await aiService.resolveFeatureConfig('cover_letter_generation');
      const typeFormat = resolveTypeFormat('cover-letter');
      const clTemplateId = resolveTemplateIdForType(templateIds, 'cover-letter');
      const clTemplateFields = await buildTemplateFields(clTemplateId, 'cover-letter');
      const content = await runAiStep('cover_letter_generation', () =>
        aiService.generateCoverLetter({ ...job, parsedData }, profile, buildAiOptions(aiOptions, clTemplateId, 'cover-letter'))
      );
      const doc = await documentRegistry.createDocument({
        jobId,
        generatedFromJobId: jobId,
        type: 'cover-letter',
        editableContent: content,
        content,
        contentSource: 'ai',
        format: typeFormat,
        exportFormat: typeFormat,
        status: 'draft',
        model: cfg.model,
        tailoringLevel: safeTailoring,
        title: `Cover Letter — ${job.title} at ${job.company}`,
        source: 'workflow',
        ...clTemplateFields,
        metadata: {
          ...(clTemplateFields.metadata || {}),
        },
      });
      await jobRepo.linkDocument(jobId, doc.id, userId);
      log(ACTION_TYPES.AI_GENERATED, { module: 'cover-letter', jobId, entityId: doc.id, entityType: 'document', model: cfg.model, details: 'Cover letter draft generated (selective)' });
      results.coverLetter = doc;
    }

    if (validTypes.includes('email')) {
      const cfg = await aiService.resolveFeatureConfig('email_generation');
      const typeFormat = resolveTypeFormat('email');
      const emailTemplateId = resolveTemplateIdForType(templateIds, 'email');
      const emailTemplateFields = await buildTemplateFields(emailTemplateId, 'email');
      const emailContent = await runAiStep('email_generation', () =>
        aiService.generateEmail({ ...job, parsedData }, profile, recipientData, buildAiOptions(aiOptions, emailTemplateId, 'email'))
      );
      const subjectMatch = emailContent.match(/SUBJECT:\s*(.+)/i);
      const bodyMatch = emailContent.match(/BODY:\s*([\s\S]+)/i);
      const emailSubject = subjectMatch?.[1]?.trim() || `Application for ${job.title} at ${job.company}`;
      const emailBody = bodyMatch?.[1]?.trim() || emailContent;
      const emailScores = scoreEmail(emailBody, { recipientData, jobData: { ...job, parsedData }, profile });
      const emailRecord = await emailRepo.saveEmail({
        jobId, to: recipientData.email || '', subject: emailSubject, body: emailBody,
        model: cfg.model, status: 'draft', scores: emailScores,
      }, userId);
      await jobRepo.linkEmail(jobId, emailRecord.id, userId);

      const emailDocContent = `SUBJECT: ${emailSubject}\n\nBODY:\n${emailBody}`;
      const emailDoc = await documentRegistry.createDocument({
        jobId,
        generatedFromJobId: jobId,
        type: 'email',
        editableContent: emailDocContent,
        content: emailDocContent,
        contentSource: 'ai',
        format: typeFormat,
        exportFormat: typeFormat,
        status: 'draft',
        model: cfg.model,
        tailoringLevel: safeTailoring,
        title: `Cold Email — ${job.title} at ${job.company}`,
        metadata: { emailId: emailRecord.id, subject: emailSubject, ...(emailTemplateFields.metadata || {}) },
        templateId: emailTemplateFields.templateId,
        templateName: emailTemplateFields.templateName,
        source: 'workflow',
      });
      await jobRepo.linkDocument(jobId, emailDoc.id, userId);

      log(ACTION_TYPES.AI_GENERATED, { module: 'cold-email', jobId, entityId: emailRecord.id, entityType: 'email', model: cfg.model, details: 'Email draft generated (selective)' });
      results.email = emailRecord;
      results.emailDocument = emailDoc;
    }

    const durationMs = Date.now() - startTime;
    log(ACTION_TYPES.WORKFLOW_COMPLETED, { module: 'workflow', jobId, details: `Selective generation completed in ${durationMs}ms` });

    return {
      success: true,
      jobId,
      tailoringLevel: safeTailoring,
      formats: Object.fromEntries(validTypes.map((t) => [t, resolveTypeFormat(t)])),
      generatedTypes: validTypes,
      durationMs,
      ...results,
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    log(ACTION_TYPES.WORKFLOW_FAILED, { module: 'workflow', jobId, details: error.message, durationMs });

    if (error instanceof ExternalApiError || error.type === 'external_api_error') {
      return {
        success: false, jobId, type: 'external_api_error',
        error: error.message || 'External service temporarily unavailable',
        message: error.message || 'External service temporarily unavailable',
        durationMs,
      };
    }
    throw error;
  }
};

module.exports = { runJobWorkflow, regenerateDocument, runAtsOnly, generateSelectedDocuments };
