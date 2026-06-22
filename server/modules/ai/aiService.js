const axios = require('axios');
const coreAI = require('../../services/aiService');

const generateResume = async (job, profile, options) => coreAI.generateResume(job, profile, options);

const generateCoverLetter = async (job, profile, options) => coreAI.generateCoverLetter(job, profile, options);

const generateEmail = async (job, profile, _model, recipientData = {}, options = {}) =>
  coreAI.generateEmail(job, profile, recipientData, options);

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

const extractJobFromImage = async (base64Image, mimeType, forcedModel = null) =>
  coreAI.extractJobFromImage(base64Image, mimeType, forcedModel);

const summarizeProject = async (projectData) => coreAI.generateProjectSummary(projectData);

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
