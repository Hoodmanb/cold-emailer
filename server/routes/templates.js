const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/templateController');

router.get('/', ctrl.listTemplates);
router.post('/', ctrl.createTemplate);
router.get('/:id', ctrl.getTemplate);
router.put('/:id', ctrl.updateTemplate);
router.delete('/:id', ctrl.deleteTemplate);

module.exports = router;
