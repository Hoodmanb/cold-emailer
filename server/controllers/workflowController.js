const { runJobWorkflow, regenerateDocument } = require('../services/workflow/jobWorkflowService');
const { getProfile } = require('../repositories/profileRepository');

const run = async (req, res, next) => {
  try {
    const { jobId, recipientData } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const profile = getProfile();

    if (!profile.name && !profile.summary) {
      return res.status(400).json({
        success: false,
        message: 'Profile is incomplete. Please fill out your career profile before running the workflow.',
      });
    }
    const result = await runJobWorkflow({ jobId, profile, recipientData });
    return res.status(200).json({ success: true, message: 'Workflow completed successfully', data: result });
  } catch (err) {
    next(err);
  }
};

const regenerate = async (req, res, next) => {
  try {
    const { jobId, type, recipientData } = req.body;

    if (!jobId || !type) {
      return res.status(400).json({ success: false, message: 'jobId and type are required' });
    }

    const profile = getProfile();
    const doc = await regenerateDocument({ jobId, type, profile, recipientData });
    return res.status(200).json({ success: true, message: 'Document regenerated successfully', data: doc });
  } catch (err) {
    next(err);
  }
};

module.exports = { run, regenerate };
