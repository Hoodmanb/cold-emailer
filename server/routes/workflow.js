const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workflowController');

router.post('/run', ctrl.run);
router.post('/regenerate', ctrl.regenerate);

module.exports = router;
