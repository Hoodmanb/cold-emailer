const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scheduleController');

router.get('/run', ctrl.runSchedule);
router.get('/', ctrl.listSchedules);
router.post('/', ctrl.createSchedule);
router.get('/:id', ctrl.getSchedule);
router.post('/:id/recipients', ctrl.addRecipient);
router.delete('/:id', ctrl.deleteSchedule);

module.exports = router;
