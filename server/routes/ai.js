const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');
const { checkCredits } = require('../middleware/checkCredits');

router.get('/models', ctrl.getModelList);
router.post('/generate', checkCredits, ctrl.generate);

module.exports = router;
