const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/profileController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { normalizeProjectPayload, validateProjectInput } = require('../middleware/projectValidation');

router.get('/projects', asyncHandler(ctrl.getProjectsHandler));
router.post('/projects', normalizeProjectPayload, validateProjectInput, asyncHandler(ctrl.createProjectHandler));
router.put('/projects/:projectId', normalizeProjectPayload, validateProjectInput, asyncHandler(ctrl.updateProjectHandler));
router.delete('/projects/:projectId', asyncHandler(ctrl.deleteProjectHandler));
router.post('/projects/media/screenshot', ctrl.screenshotUpload.single('screenshot'), asyncHandler(ctrl.uploadScreenshotHandler));

router.get('/skills', asyncHandler(ctrl.getSkillsHandler));
router.post('/skills', asyncHandler(ctrl.createSkillHandler));
router.put('/skills/:skillId', asyncHandler(ctrl.updateSkillHandler));
router.delete('/skills/:skillId', asyncHandler(ctrl.deleteSkillHandler));

router.get('/certificates', asyncHandler(ctrl.getCertificatesHandler));
router.post('/certificates', asyncHandler(ctrl.createCertificateHandler));
router.put('/certificates/:certId', asyncHandler(ctrl.updateCertificateHandler));
router.delete('/certificates/:certId', asyncHandler(ctrl.deleteCertificateHandler));

router.get('/', asyncHandler(ctrl.getProfileHandler));
router.put('/', asyncHandler(ctrl.updateProfile));
router.delete('/', asyncHandler(ctrl.deleteAccountHandler));
router.get('/email-config', asyncHandler(ctrl.getEmailConfigHandler));
router.put('/email-config', asyncHandler(ctrl.updateEmailConfig));
router.get('/preferences', asyncHandler(ctrl.getPreferencesHandler));
router.put('/preferences', asyncHandler(ctrl.updatePreferences));

module.exports = router;
