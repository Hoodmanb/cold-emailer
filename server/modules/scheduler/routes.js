const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const service = require('./service');
const { successResponse, errorResponse } = require('../../utils/response');
const execCtrl = require('../../controllers/scheduleExecutionController');

/**
 * Public QStash Webhook callback handler.
 * Called by index.js with rawBody pre-processed and signature validated.
 */
async function handleWebhook(req, res, next) {
  try {
    const { scheduleId } = req.body;
    const messageId = req.headers['upstash-message-id'];

    if (!scheduleId) {
      return errorResponse(res, {
        status: 400,
        message: 'Missing scheduleId in payload',
        errorCode: 'MISSING_SCHEDULE_ID',
      });
    }

    const result = await service.executeWebhook(scheduleId, messageId);
    return successResponse(res, {
      message: 'Webhook processed successfully',
      data: result,
    });
  } catch (err) {
    const status = err.status || 500;
    return errorResponse(res, {
      status,
      message: err.message,
      errorCode: status === 429 ? 'LOCK_ACQUISITION_FAILED' : 'EXECUTION_FAILED',
    });
  }
}

// REST CRUD endpoints
router.get('/health', ctrl.getHealth);
router.get('/', ctrl.listSchedules);
router.post('/', ctrl.createSchedule);
router.get('/:id', ctrl.getSchedule);
router.put('/:id', ctrl.updateSchedule);
router.delete('/:id', ctrl.deleteSchedule);
router.post('/:id/pause', ctrl.pauseSchedule);
router.post('/:id/resume', ctrl.resumeSchedule);
router.get('/history', execCtrl.listHistory);

module.exports = {
  router,
  handleWebhook,
};
