const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentTemplateController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAdmin } = require('../middleware/requireAdmin');

router.get('/public', asyncHandler(ctrl.getPublicTemplates));
router.get('/pending', requireAdmin, asyncHandler(ctrl.listPendingTemplates));
router.get('/starred', asyncHandler(ctrl.getStarredTemplates));
router.get('/', asyncHandler(ctrl.listTemplates));
router.post('/', asyncHandler(ctrl.createTemplateHandler));
router.get('/:id/preview', asyncHandler(ctrl.getTemplatePreview));
router.post('/:id/approve', requireAdmin, asyncHandler(ctrl.approveTemplate));
router.post('/:id/reject', requireAdmin, asyncHandler(ctrl.rejectTemplate));
router.get('/:id', asyncHandler(ctrl.getTemplate));
router.put('/:id', asyncHandler(ctrl.updateTemplateHandler));
router.delete('/:id', asyncHandler(ctrl.deleteTemplateHandler));
router.post('/:id/star', asyncHandler(ctrl.starTemplate));
router.delete('/:id/star', asyncHandler(ctrl.unstarTemplate));

module.exports = router;
