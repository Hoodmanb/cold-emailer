/**
 * Central AI Orchestration Interface (Refactored adapter wrapper)
 * Directs incoming feature demands to concrete, pure domain pipeline executions
 * while fully preserving original service signatures for backward compatibility.
 */
const { resolveFeatureConfig, resolveActivePrompt } = require('../repositories/aiRepository');
const { executeAtsPipelineSafe } = require('../domains/ai/pipelines/atsPipeline');
const { executeResumePipeline } = require('../domains/ai/pipelines/resumePipeline');
const { executeCoverLetterPipeline } = require('../domains/ai/pipelines/coverLetterPipeline');
const { executeEmailPipeline } = require('../domains/ai/pipelines/emailPipeline');
const { executeImageExtractionPipeline } = require('../domains/ai/pipelines/imageExtractionPipeline');
const { executeProfessionalCvFromProfile, executeProfessionalCvPipeline } = require('../domains/ai/pipelines/professionalCvPipeline');
const { assertFeatureReady } = require('./ai/providerValidation');

const generateResume = async (job, profile, options = {}) => {
  assertFeatureReady('resume_generation');
  const config = resolveFeatureConfig('resume_generation');
  return executeResumePipeline(job, profile, config, options);
};

const generateProfessionalCv = async (jobOrProfile, profileOrOptions = {}, options = {}) => {
  assertFeatureReady('professional_cv_generation');
  const config = resolveFeatureConfig('professional_cv_generation');
  // Support both (profile, options) and (job, profile, options) signatures
  if (jobOrProfile && (jobOrProfile.rawDescription || jobOrProfile.parsedData || jobOrProfile.title)) {
    return executeProfessionalCvPipeline(jobOrProfile, profileOrOptions, config, options);
  }
  return executeProfessionalCvFromProfile(jobOrProfile, profileOrOptions, config);
};

const generateCoverLetter = async (job, profile, options = {}) => {
  assertFeatureReady('cover_letter_generation');
  const config = resolveFeatureConfig('cover_letter_generation');
  return executeCoverLetterPipeline(job, profile, config, options);
};

const generateEmail = async (job, profile, recipientData = {}, options = {}) => {
  assertFeatureReady('email_generation');
  const config = resolveFeatureConfig('email_generation');
  return executeEmailPipeline(job, profile, recipientData, config, options);
};

const analyzeATS = async (job, profile) => {
  assertFeatureReady('ats_analysis');
  const config = resolveFeatureConfig('ats_analysis');
  return executeAtsPipelineSafe(job, profile, config);
};

const extractJobFromImage = async (base64Image, mimeType, forcedModel = null) => {
  assertFeatureReady('job_extraction_image');
  const resolvedConfig = resolveFeatureConfig('job_extraction_image');
  const config = {
    provider: resolvedConfig.provider,
    model: forcedModel || resolvedConfig.model
  };
  return executeImageExtractionPipeline(base64Image, mimeType, config);
};

// Generic generate fallback
const generateForFeature = async ({ featureId, prompt, messages, options = {} }) => {
  const normalizedFeatureId = String(featureId || "").trim();
  if (!normalizedFeatureId) {
    throw new Error("featureId is required for AI generation");
  }

  const { config } = assertFeatureReady(normalizedFeatureId);
  const { resolveProvider } = require('../domains/ai/core/providerRouter');
  const provider = resolveProvider(config.provider);

  let finalMessages = messages;
  if (!Array.isArray(messages) || !messages.length) {
    let content = String(prompt || '');
    if (!content) {
      content = resolveActivePrompt(normalizedFeatureId);
    }
    finalMessages = [{ role: 'user', content }];
  }

  const raw = await provider({
    model: config.model,
    messages: finalMessages,
    temperature: options.temperature ?? 0.5,
    max_tokens: options.max_tokens ?? 1000
  });

  return { success: true, data: raw };
};

const chatForFeature = async ({ featureId = 'chatbot_assistant', messages, options = {} }) => {
  if (!Array.isArray(messages) || !messages.length) {
    throw new Error("messages array is required for chat");
  }
  const normalizedFeatureId = String(featureId || "chatbot_assistant").trim();
  const systemPrompt = resolveActivePrompt(normalizedFeatureId);
  const finalMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];
  return generateForFeature({ featureId: normalizedFeatureId, messages: finalMessages, options });
};

const generateProjectSummary = async (projectData = {}) => {
  const promptTemplate = resolveActivePrompt('project_summary_generation');
  const projectBlock = JSON.stringify(projectData && typeof projectData === 'object' ? projectData : {}, null, 2);
  const prompt = `${promptTemplate}\n\nPROJECT DATA:\n${projectBlock}`;
  return generateForFeature({
    featureId: 'project_summary_generation',
    prompt,
    options: { temperature: 0.4, max_tokens: 900 },
  });
};

const safeGenerateForFeature = async (payload) => {
  try {
    return await generateForFeature(payload);
  } catch (err) {
    return {
      success: false,
      type: err.type || 'external_api_error',
      message: err.message || 'AI request failed',
      error: err.message || 'External service temporarily unavailable',
    };
  }
};

module.exports = {
  resolveFeatureConfig,
  resolveActivePrompt,
  generateResume,
  generateProfessionalCv,
  generateCoverLetter,
  generateEmail,
  analyzeATS,
  extractJobFromImage,
  generateProjectSummary,
  generateForFeature,
  chatForFeature,
  safeGenerateForFeature
};
