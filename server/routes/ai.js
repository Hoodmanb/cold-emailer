const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');

router.get('/models', ctrl.getModelList);
router.post('/generate', ctrl.generate);

module.exports = router;
