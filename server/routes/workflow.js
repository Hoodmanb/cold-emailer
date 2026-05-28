const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workflowController');
const { asyncHandler } = require('../middleware/asyncHandler');

router.post('/run', asyncHandler(ctrl.run));
router.post('/run-ats', asyncHandler(ctrl.runAts));
router.post('/generate-selected', asyncHandler(ctrl.generateSelected));
router.post('/regenerate', asyncHandler(ctrl.regenerate));

module.exports = router;
