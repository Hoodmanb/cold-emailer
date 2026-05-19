const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/suggestionsController');

router.get('/recipients', ctrl.recipients);
router.get('/templates', ctrl.templates);
router.get('/smtp', ctrl.smtp);
router.post('/track', ctrl.track);

module.exports = router;
