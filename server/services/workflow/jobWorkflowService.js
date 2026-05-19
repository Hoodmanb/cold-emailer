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
const documentRepo = require('../../repositories/documentRepository');
const emailRepo = require('../../repositories/emailRepository');
const { log, ACTION_TYPES } = require('../../logs/auditLogger');

/**
 * Run the full job workflow pipeline.
 *
 * @param {object} options
 * @param {string} options.jobId - Existing job ID to process
 * @param {object} options.profile - User career profile
 * @param {object} [options.recipientData] - Optional recipient for email personalization
 * @returns {object} Workflow result with all generated drafts
 */
const runJobWorkflow = async ({ jobId, profile, recipientData = {} }) => {
  const startTime = Date.now();

  // ── Audit: Workflow started ────────────────────────────────
  log(ACTION_TYPES.WORKFLOW_STARTED, {
    module: 'workflow',
    jobId,
    model: aiService.resolveFeatureConfig('resume_generation').model,
    details: 'Full pipeline started',
  });

  try {
    // ── Step 1: Load job ──────────────────────────────────────
    const job = jobRepo.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    // ── Step 2: Parse job description ────────────────────────
    let parsedData = job.parsedData;
    if (!parsedData || Object.keys(parsedData).length === 0) {
      parsedData = parseJob(job.rawDescription, {
        title: job.title,
        company: job.company,
        location: job.location,
      });
      jobRepo.updateJob(jobId, { parsedData });
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
    jobRepo.updateJob(jobId, { atsScore: atsResult.score, atsBreakdown: atsResult });

    // ── Step 4: AI Resume (draft) ─────────────────────────────
    const resumeConfig = aiService.resolveFeatureConfig('resume_generation');
    const resumeContent = await aiService.generateResume({ ...job, parsedData }, profile);

    const resumeDoc = documentRepo.saveDocument({
      jobId,
      type: 'resume',
      content: resumeContent,
      model: resumeConfig.model,
      status: 'draft',
    });

    jobRepo.linkDocument(jobId, resumeDoc.id);

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
    const coverConfig = aiService.resolveFeatureConfig('cover_letter_generation');
    const coverLetterContent = await aiService.generateCoverLetter({ ...job, parsedData }, profile);

    const coverLetterDoc = documentRepo.saveDocument({
      jobId,
      type: 'cover-letter',
      content: coverLetterContent,
      model: coverConfig.model,
      status: 'draft',
    });

    jobRepo.linkDocument(jobId, coverLetterDoc.id);

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
    const emailConfig = aiService.resolveFeatureConfig('email_generation');
    const emailContent = await aiService.generateEmail(
      { ...job, parsedData },
      profile,
      recipientData
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

    const emailRecord = emailRepo.saveEmail({
      jobId,
      to: recipientData.email || '',
      subject: emailSubject,
      body: emailBody,
      model: emailConfig.model,
      status: 'draft',
      scores: emailScores,
    });

    jobRepo.linkEmail(jobId, emailRecord.id);

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
      model: aiService.resolveFeatureConfig('email_generation').model,
      details: error.message,
      durationMs,
    });

    throw error;
  }
};

/**
 * Regenerate a single document type (resume | cover-letter | email).
 * Creates a new draft — does not overwrite the existing one.
 */
const regenerateDocument = async ({ jobId, type, profile, recipientData = {} }) => {
  const job = jobRepo.getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  let content, doc;

  if (type === 'resume') {
    const cfg = aiService.resolveFeatureConfig('resume_generation');
    content = await aiService.generateResume(job, profile);
    doc = documentRepo.saveDocument({ jobId, type: 'resume', content, model: cfg.model, status: 'draft' });
  } else if (type === 'cover-letter') {
    const cfg = aiService.resolveFeatureConfig('cover_letter_generation');
    content = await aiService.generateCoverLetter(job, profile);
    doc = documentRepo.saveDocument({ jobId, type: 'cover-letter', content, model: cfg.model, status: 'draft' });
  } else if (type === 'email') {
    const cfg = aiService.resolveFeatureConfig('email_generation');
    content = await aiService.generateEmail(job, profile, recipientData);
    const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);
    const emailScores = scoreEmail(bodyMatch?.[1]?.trim() || content, {
      recipientData, jobData: job, profile,
    });
    doc = emailRepo.saveEmail({
      jobId,
      to: recipientData.email || '',
      subject: subjectMatch?.[1]?.trim() || '',
      body: bodyMatch?.[1]?.trim() || content,
      model: cfg.model,
      status: 'draft',
      scores: emailScores,
    });
  } else {
    throw new Error(`Unknown document type: ${type}`);
  }

  const model = doc.model || aiService.resolveFeatureConfig('email_generation').model;
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

module.exports = { runJobWorkflow, regenerateDocument };
