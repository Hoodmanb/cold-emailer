const axios = require('axios');
const coreAI = require('../../services/aiService');
const aiStandards = require('../../services/ai/aiGenerationStandards');

const generateResume = async (job, profile) => coreAI.generateResume(job, profile);

const generateCoverLetter = async (job, profile) => coreAI.generateCoverLetter(job, profile);

const generateEmail = async (job, profile, _model, recipientData = {}) =>
  coreAI.generateEmail(job, profile, recipientData);

const analyzeJob = async (job, profile) => coreAI.analyzeATS(job, profile);

const scoreMatch = async (job, profile) => {
  const analysis = await analyzeJob(job, profile);
  return {
    score: analysis.score,
    breakdown: analysis.breakdown,
    matchedKeywords: analysis.matchedKeywords,
    missingKeywords: analysis.missingKeywords,
    meta: analysis.meta,
    schemaVersion: analysis.schemaVersion,
  };
};

const generateText = async (prompt, _model, options = {}) => {
  const result = await coreAI.generateForFeature({
    featureId: 'chatbot_assistant',
    prompt,
    options,
  });
  return result.data;
};

/**
 * Extract job details from a base64 screenshot image using a multimodal model.
 */
const extractJobFromImage = async (base64Image, mimeType) => {
  const promptTemplate = coreAI.resolveActivePrompt('job_extraction_image');
  
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: promptTemplate },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
      ]
    }
  ];

  const raw = await coreAI.generateForFeature({
    featureId: 'job_extraction_image',
    messages,
    options: { temperature: 0.1, max_tokens: 1500 },
  });

  const parsed = aiStandards.parseStructuredJsonFromModel(raw.data, {
    dedupeArrays: ['skills', 'atsKeywords'],
  });
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Failed to parse AI extraction from image');
  }
  let out = { ...parsed };
  if (out.data && typeof out.data === 'object') {
    out = { ...out.data, schemaVersion: out.schemaVersion || aiStandards.SCHEMA_VERSION };
  }
  if (!out.schemaVersion) out.schemaVersion = aiStandards.SCHEMA_VERSION;
  if (Array.isArray(out.skills)) out.skills = aiStandards.dedupeStringArray(out.skills);
  if (Array.isArray(out.atsKeywords)) out.atsKeywords = aiStandards.dedupeStringArray(out.atsKeywords);
  return out;
};

const summarizeProject = async (projectData) => {
  const result = await coreAI.generateProjectSummary(projectData);
  return result;
};

module.exports = {
  generateResume,
  generateCoverLetter,
  generateEmail,
  analyzeJob,
  scoreMatch,
  generateText,
  extractJobFromImage,
  summarizeProject,
};
