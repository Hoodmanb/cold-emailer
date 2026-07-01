const jobRepo = require('../repositories/jobRepository');
const { parseJob } = require('../modules/job/jobParser');
const { scoreATS } = require('../modules/job/atsEngine');
const { getProfile } = require('../repositories/profileRepository');
const { log, ACTION_TYPES } = require('../logs/auditLogger');
const { extractJobFromImage } = require('../modules/ai/aiService');
const logger = require('../utils/logger');
const { requireUserId } = require('../utils/requireUserId');

const listJobs = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const jobs = await jobRepo.listJobs(userId);
    return res.status(200).json({ success: true, message: 'retrieved successfully', data: jobs });
  } catch (err) {
    next(err);
  }
};

const getJob = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const job = await jobRepo.getJob(req.params.id, userId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    return res.status(200).json({ success: true, message: 'retrieved successfully', data: job });
  } catch (err) {
    next(err);
  }
};

const createJob = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { title, company, location, type, rawDescription } = req.body;

    if (!rawDescription) {
      return res.status(400).json({ success: false, message: 'rawDescription is required' });
    }

    const parsedData = parseJob(rawDescription, { title, company, location });
    const profile = await getProfile(userId);
    const atsResult = scoreATS(parsedData, profile);

    const job = await jobRepo.createJob({
      title,
      company,
      location,
      type,
      rawDescription,
      parsedData,
      atsScore: atsResult.score,
      atsBreakdown: atsResult,
    }, userId);

    await log(ACTION_TYPES.JOB_CREATED, {
      module: 'job',
      entityId: job.id,
      entityType: 'job',
      details: `${title} at ${company} — ATS score: ${atsResult.score}`,
    });

    return res.status(201).json({ success: true, message: 'created successfully', data: job });
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const updated = await jobRepo.updateJob(req.params.id, req.body, userId);
    if (!updated) return res.status(404).json({ success: false, message: 'Job not found' });

    await log('job_updated', {
      module: 'job',
      entityId: req.params.id,
      details: `Updated job details for ${req.body.title || updated.title}`,
    });

    return res.status(200).json({ success: true, message: 'updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const count = await jobRepo.deleteJob(req.params.id, userId);
    if (count === 0) return res.status(404).json({ success: false, message: 'Job not found' });

    await log(ACTION_TYPES.JOB_DELETED, { module: 'job', entityId: req.params.id });
    return res.status(200).json({ success: true, message: 'deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const parseImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const extractedData = await extractJobFromImage(base64Image, mimeType, 'openai/gpt-4o');

    return res.status(200).json({
      success: true,
      message: 'Extracted successfully',
      data: extractedData
    });
  } catch (err) {
    logger.error('[JobController] Image Parse Error', { error: err.message });
    next(err);
  }
};

const rerunATS = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = req.params;
    const job = await jobRepo.getJob(id, userId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const profile = await getProfile(userId);
    const atsResult = scoreATS(job.parsedData, profile);

    const updated = await jobRepo.updateJob(id, {
      atsScore: atsResult.score,
      atsBreakdown: atsResult,
      atsUpdatedAt: new Date().toISOString(),
    }, userId);

    await log(ACTION_TYPES.JOB_UPDATED, {
      module: 'job',
      entityId: id,
      details: `ATS score re-calculated: ${atsResult.score}`,
    });

    return res.status(200).json({ success: true, message: 'ATS analysis re-run successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { listJobs, getJob, createJob, updateJob, deleteJob, parseImage, rerunATS };
