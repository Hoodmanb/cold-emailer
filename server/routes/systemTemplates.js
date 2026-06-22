const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/systemTemplateController');
const { asyncHandler } = require('../middleware/asyncHandler');

// GET /api/system-templates - List all system/AI templates
router.get('/', asyncHandler(ctrl.getSystemTemplates));

// GET /api/system-templates/:id - Get a single system template
router.get('/:id', asyncHandler(ctrl.getSystemTemplate));

// GET /api/system-templates/:id/preview - Preview a system template (returns HTML)
router.get('/:id/preview', asyncHandler(ctrl.previewSystemTemplate));

module.exports = router;
