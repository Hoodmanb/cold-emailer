const express = require('express');
const ctrl = require('./controller');
const { asyncHandler } = require('../../../middleware/asyncHandler');

const router = express.Router();

router.get('/library', asyncHandler(ctrl.listDocumentLibrary));
router.get('/consistency', asyncHandler(ctrl.auditConsistency));
router.get('/', asyncHandler(ctrl.listAttachments));
router.post('/', asyncHandler(ctrl.createAttachment));
router.delete('/:id', asyncHandler(ctrl.deleteAttachment));

module.exports = router;
