const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');

router.get('/', ctrl.listDocuments);
router.get('/resume-templates', ctrl.listResumeTemplates);
router.post('/render-resume', ctrl.renderResume);
router.post('/generate-advanced', ctrl.generateAdvanced);
router.post('/', ctrl.saveDocument);
router.get('/:id', ctrl.getDocument);
router.put('/:id', ctrl.updateDocument);
router.post('/:id/approve', ctrl.approveDocument);
router.get('/:id/download', ctrl.downloadDocument);
router.delete('/:id', ctrl.deleteDocument);

module.exports = router;
