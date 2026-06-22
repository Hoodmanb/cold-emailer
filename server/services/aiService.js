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
const billingService = require('./billing/billingService');
const { getCurrentUserId } = require('../middleware/requestContext');
const { ExternalApiError } = require('../shared/errors/customErrors');
const { RESUME_FALLBACK } = require('../domains/ai/pipelines/resumePipeline');
const { COVER_LETTER_FALLBACK } = require('../domains/ai/pipelines/coverLetterPipeline');
const { EMAIL_FALLBACK } = require('../domains/ai/pipelines/emailPipeline');
const { CV_FALLBACK } = require('../domains/ai/pipelines/professionalCvPipeline');
const { ATS_FALLBACK } = require('../domains/ai/pipelines/atsPipeline');

const FALLBACK_STRINGS = new Set([
  RESUME_FALLBACK,
  COVER_LETTER_FALLBACK,
  EMAIL_FALLBACK,
  CV_FALLBACK,
]);

function isAiFallbackResult(result) {
  if (typeof result === 'string') {
    if (FALLBACK_STRINGS.has(result)) return true;
    if (result.includes('[Draft unavailable]')) return true;
  }
  if (result && typeof result === 'object' && result.meta?.source === 'fallback') {
    return true;
  }
  if (result && typeof result === 'object' && result.score === ATS_FALLBACK.score && result.meta?.source === 'fallback') {
    return true;
  }
  return false;
}

async function withBilling(featureId, options, fn) {
  const userId = getCurrentUserId();
  if (!userId) {
    await assertFeatureReady(featureId);
    return fn();
  }
  const prep = await billingService.assertCanExecuteAI(userId, featureId, options);
  try {
    await assertFeatureReady(featureId);
    const result = await fn();
    if (isAiFallbackResult(result)) {
      await billingService.completeAIExecution(userId, featureId, options, { ...prep, charged: false, cost: 0 });
      throw new ExternalApiError(
        'AI generation failed and returned fallback content',
        'ai',
        { reason: 'ai_fallback', featureId },
      );
    }
    await billingService.completeAIExecution(userId, featureId, options, prep);
    return result;
  } catch (err) {
    await billingService.completeAIExecution(userId, featureId, options, { ...prep, charged: false, cost: 0 });
    throw err;
  }
}

const generateResume = async (job, profile, options = {}) =>
  withBilling('resume_generation', options, async () => {
    const config = await resolveFeatureConfig('resume_generation');
    return executeResumePipeline(job, profile, config, options);
  });

const generateProfessionalCv = async (jobOrProfile, profileOrOptions = {}, options = {}) =>
  withBilling('professional_cv_generation', options, async () => {
    const config = await resolveFeatureConfig('professional_cv_generation');
    if (jobOrProfile && (jobOrProfile.rawDescription || jobOrProfile.parsedData || jobOrProfile.title)) {
      return executeProfessionalCvPipeline(jobOrProfile, profileOrOptions, config, options);
    }
    return executeProfessionalCvFromProfile(jobOrProfile, config, profileOrOptions);
  });

const generateCoverLetter = async (job, profile, options = {}) =>
  withBilling('cover_letter_generation', options, async () => {
    const config = await resolveFeatureConfig('cover_letter_generation');
    return executeCoverLetterPipeline(job, profile, config, options);
  });

const generateEmail = async (job, profile, recipientData = {}, options = {}) =>
  withBilling('email_generation', options, async () => {
    const config = await resolveFeatureConfig('email_generation');
    return executeEmailPipeline(job, profile, recipientData, config, options);
  });

const analyzeATS = async (job, profile) =>
  withBilling('ats_analysis', {}, async () => {
    const config = await resolveFeatureConfig('ats_analysis');
    return executeAtsPipelineSafe(job, profile, config);
  });

const extractJobFromImage = async (base64Image, mimeType, forcedModel = null) =>
  withBilling('job_extraction_image', {}, async () => {
    const resolvedConfig = await resolveFeatureConfig('job_extraction_image');
    const config = {
      provider: resolvedConfig.provider,
      model: forcedModel || resolvedConfig.model,
    };
    return executeImageExtractionPipeline(base64Image, mimeType, config);
  });

const generateForFeature = async ({ featureId, prompt, messages, options = {} }) => {
  const normalizedFeatureId = String(featureId || "").trim();
  if (!normalizedFeatureId) {
    throw new Error("featureId is required for AI generation");
  }

  return withBilling(normalizedFeatureId, options, async () => {
    const { config } = await assertFeatureReady(normalizedFeatureId);
    const { resolveProvider } = require('../domains/ai/core/providerRouter');
    const provider = resolveProvider(config.provider);

    let finalMessages = messages;
    if (!Array.isArray(messages) || !messages.length) {
      let content = String(prompt || '');
      if (!content) {
        content = await resolveActivePrompt(normalizedFeatureId);
      }
      finalMessages = [{ role: 'user', content }];
    }

    const raw = await provider({
      model: config.model,
      messages: finalMessages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.max_tokens ?? 1000,
    });

    return { success: true, data: raw };
  });
};

const chatForFeature = async ({ featureId = 'chatbot_assistant', messages, options = {} }) => {
  if (!Array.isArray(messages) || !messages.length) {
    throw new Error("messages array is required for chat");
  }
  const normalizedFeatureId = String(featureId || "chatbot_assistant").trim();
  const systemPrompt = await resolveActivePrompt(normalizedFeatureId);
  const finalMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];
  return generateForFeature({ featureId: normalizedFeatureId, messages: finalMessages, options });
};

const generateProjectSummary = async (projectData = {}) => {
  const promptTemplate = await resolveActivePrompt('project_summary_generation');
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
