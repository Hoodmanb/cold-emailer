const service = require('./service');
const scheduleRepo = require('./scheduleRepo');
const executionRepo = require('./executionRepo');
const { scheduleSchema } = require('./validators');
const { successResponse, errorResponse } = require('../../utils/response');
const env = require('../../config/env');

const listSchedules = async (req, res, next) => {
  try {
    const list = scheduleRepo.readAll() || [];
    return successResponse(res, {
      message: 'Schedules retrieved successfully',
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

const getSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = scheduleRepo.readById(id);
    if (!schedule) {
      return errorResponse(res, {
        status: 404,
        message: 'Schedule not found',
        errorCode: 'SCHEDULE_NOT_FOUND',
      });
    }

    const executions = executionRepo.listForSchedule(id);

    return successResponse(res, {
      message: 'Schedule retrieved successfully',
      data: {
        ...schedule,
        executions,
      },
    });
  } catch (err) {
    next(err);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const parsed = scheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, {
        status: 400,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => e.message),
        errorCode: 'VALIDATION_FAILED',
      });
    }

    const schedule = await service.createSchedule(parsed.data);
    return successResponse(res, {
      status: 201,
      message: 'Schedule created successfully',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Partial schema validation for updates
    const parsed = scheduleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, {
        status: 400,
        message: 'Validation failed',
        errors: parsed.error.errors.map((e) => e.message),
        errorCode: 'VALIDATION_FAILED',
      });
    }

    const schedule = await service.updateSchedule(id, parsed.data);
    return successResponse(res, {
      message: 'Schedule updated successfully',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await service.deleteSchedule(id);
    return successResponse(res, {
      message: 'Schedule deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

const pauseSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await service.pauseSchedule(id);
    return successResponse(res, {
      message: 'Schedule paused successfully',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

const resumeSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await service.resumeSchedule(id);
    return successResponse(res, {
      message: 'Schedule resumed successfully',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

const getHealth = async (req, res, next) => {
  try {
    const health = {
      schedulerEnabled: env.schedulerEnabled,
      qstashConfigured: !!env.qstashToken && !!env.qstashCurrentSigningKey,
      timestamp: new Date().toISOString(),
    };
    return successResponse(res, {
      message: 'Scheduler health status retrieved',
      data: health,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  pauseSchedule,
  resumeSchedule,
  getHealth,
};
