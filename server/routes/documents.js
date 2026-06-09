const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');
const { requireAuth } = require('../middleware/requireAuth');
const { checkCredits } = require('../middleware/checkCredits');

router.get('/', ctrl.listDocuments);
router.use('/uploads', requireAuth, require('../modules/documents/uploads/routes'));

router.get('/resume-templates', ctrl.listResumeTemplates);
router.post('/render-resume', ctrl.renderResume);
router.post('/generate-advanced', checkCredits, ctrl.generateAdvanced);
router.post('/generate-professional-cv', checkCredits, ctrl.generateProfessionalCv);
router.post('/', ctrl.saveDocument);
router.get('/:id', ctrl.getDocument);
router.put('/:id', ctrl.updateDocument);
router.patch('/:id/rename', ctrl.renameDocument);
router.post('/:id/duplicate', ctrl.duplicateDocument);
router.post('/:id/approve', ctrl.approveDocument);
router.post('/:id/export', ctrl.exportDocument);
router.get('/:id/download', ctrl.downloadDocument);
router.get('/:id/preview', ctrl.previewDocument);
router.delete('/:id', ctrl.deleteDocument);



module.exports = router;