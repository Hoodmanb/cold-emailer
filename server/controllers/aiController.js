const aiService = require('../modules/ai/aiService');
const { getAllModelsGrouped } = require('../services/ai/modelCatalog');
const { getProfile } = require('../repositories/profileRepository');
const { getJob } = require('../repositories/jobRepository');
const { log, ACTION_TYPES } = require('../logs/auditLogger');
const { requireUserId } = require('../utils/requireUserId');

const generate = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { type, model, jobId, jobData, userProfile, recipientData } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: 'type is required' });
    }

    const profile = userProfile || await getProfile(userId);
    const job = jobId ? await getJob(jobId, userId) : jobData;

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    let result;
    switch (type) {
      case 'resume':
        result = await aiService.generateResume(job, profile);
        break;
      case 'cover-letter':
        result = await aiService.generateCoverLetter(job, profile);
        break;
      case 'email':
        result = await aiService.generateEmail(job, profile, undefined, recipientData || {});
        break;
      case 'analysis':
        result = await aiService.analyzeJob(job, profile);
        break;
      case 'score':
        result = await aiService.scoreMatch(job, profile);
        break;
      default:
        return res.status(400).json({ success: false, message: `Unknown generation type: ${type}` });
    }

    await log(ACTION_TYPES.AI_GENERATED, {
      module: type,
      jobId: jobId || null,
      model: model || 'feature-mapped',
      details: `Direct generate called for type: ${type}`,
    });

    return res.status(200).json({ success: true, message: 'generated successfully', data: result });
  } catch (err) {
    await log(ACTION_TYPES.AI_FAILED, { module: req.body?.type || 'unknown', model: req.body?.model || 'feature-mapped', details: err.message });
    next(err);
  }
};

const getModelList = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, message: 'retrieved successfully', data: (await getAllModelsGrouped()) || [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, getModelList };
