const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/artifactController');

router.get('/', ctrl.listArtifacts);
router.post('/', ctrl.upload.single('file'), ctrl.createArtifact);
router.get('/:id/download', ctrl.downloadArtifact);
router.get('/:id/preview', ctrl.previewArtifact);
router.get('/:id', ctrl.getArtifactMeta);

module.exports = router;
