const {
  runJobWorkflow,
  regenerateDocument,
  runAtsOnly,
  generateSelectedDocuments,
} = require('../services/workflow/jobWorkflowService');
const { getProfile } = require('../repositories/profileRepository');
const { requireUserId } = require('../utils/requireUserId');

function requireProfile(profile, res) {
  if (!profile.name && !profile.summary) {
    res.status(400).json({
      success: false,
      message: 'Profile is incomplete. Please fill out your career profile before running the workflow.',
    });
    return false;
  }
  return true;
}

const run = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { jobId, recipientData } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });

    const profile = await getProfile(userId);
    if (!requireProfile(profile, res)) return;

    const result = await runJobWorkflow({ jobId, profile, recipientData, userId });
    if (result?.success === false) {
      return res.status(502).json({
        success: false,
        type: result.type || 'external_api_error',
        error: result.error || 'External service temporarily unavailable',
        message: result.message || 'Workflow completed with external service errors',
        data: result,
      });
    }
    return res.status(200).json({ success: true, message: 'Workflow completed successfully', data: result });
  } catch (err) {
    next(err);
  }
};

const runAts = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });

    const profile = await getProfile(userId);
    if (!requireProfile(profile, res)) return;

    const result = await runAtsOnly({ jobId, profile, userId });
    return res.status(200).json({ success: true, message: 'ATS analysis completed', data: result });
  } catch (err) {
    next(err);
  }
};

const generateSelected = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { jobId, types, format, formats, tailoringLevel, recipientData, templateIds } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });
    if (!Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ success: false, message: 'types must be a non-empty array' });
    }

    const validTypes = ['resume', 'professional-cv', 'cover-letter', 'email'];
    const invalid = types.filter((t) => !validTypes.includes(t));
    if (invalid.length) {
      return res.status(400).json({ success: false, message: `Invalid types: ${invalid.join(', ')}` });
    }

    const profile = await getProfile(userId);
    if (!requireProfile(profile, res)) return;

    const result = await generateSelectedDocuments({
      jobId,
      profile,
      types,
      format,
      formats: formats && typeof formats === 'object' ? formats : {},
      tailoringLevel,
      recipientData,
      templateIds: templateIds && typeof templateIds === 'object' ? templateIds : {},
      userId,
    });
    if (result?.success === false) {
      return res.status(502).json({
        success: false,
        type: result.type || 'external_api_error',
        error: result.error || 'External service temporarily unavailable',
        message: result.message || 'Generation failed',
        data: result,
      });
    }
    return res.status(200).json({ success: true, message: 'Documents generated successfully', data: result });
  } catch (err) {
    next(err);
  }
};

const regenerate = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { jobId, type, recipientData } = req.body;
    if (!jobId || !type) {
      return res.status(400).json({ success: false, message: 'jobId and type are required' });
    }

    const profile = await getProfile(userId);
    const doc = await regenerateDocument({ jobId, type, profile, recipientData, userId });
    return res.status(200).json({ success: true, message: 'Document regenerated successfully', data: doc });
  } catch (err) {
    next(err);
  }
};

module.exports = { run, runAts, generateSelected, regenerate };
