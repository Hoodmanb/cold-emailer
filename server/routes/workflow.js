const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workflowController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { checkCredits } = require('../middleware/checkCredits');

router.post('/run', checkCredits, asyncHandler(ctrl.run));
router.post('/run-ats', checkCredits, asyncHandler(ctrl.runAts));
router.post('/generate-selected', checkCredits, asyncHandler(ctrl.generateSelected));
router.post('/regenerate', checkCredits, asyncHandler(ctrl.regenerate));

module.exports = router;
