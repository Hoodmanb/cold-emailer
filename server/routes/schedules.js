const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scheduleController');
const execCtrl = require('../controllers/scheduleExecutionController');

// Existing schedule endpoints
router.get('/run', ctrl.runSchedule);
router.get('/', ctrl.listSchedules);
router.post('/', ctrl.createSchedule);
router.put('/:id', ctrl.updateSchedule);
router.get('/:id', ctrl.getSchedule);
router.post('/:id/recipients', ctrl.addRecipient);
router.delete('/:id', ctrl.deleteSchedule);

// New history endpoint
router.get('/history', execCtrl.listHistory);

module.exports = router;
