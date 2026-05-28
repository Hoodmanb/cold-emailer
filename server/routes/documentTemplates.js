const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentTemplateController');
const { asyncHandler } = require('../middleware/asyncHandler');

router.get('/public', asyncHandler(ctrl.getPublicTemplates));
router.get('/starred', asyncHandler(ctrl.getStarredTemplates));
router.get('/', asyncHandler(ctrl.listTemplates));
router.post('/', asyncHandler(ctrl.createTemplateHandler));
router.get('/:id', asyncHandler(ctrl.getTemplate));
router.put('/:id', asyncHandler(ctrl.updateTemplateHandler));
router.delete('/:id', asyncHandler(ctrl.deleteTemplateHandler));
router.post('/:id/star', asyncHandler(ctrl.starTemplate));
router.delete('/:id/star', asyncHandler(ctrl.unstarTemplate));

module.exports = router;
