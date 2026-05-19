const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/jobController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', ctrl.listJobs);
router.post('/', ctrl.createJob);
router.post('/parse-image', upload.single('image'), ctrl.parseImage);
router.get('/:id', ctrl.getJob);
router.post('/:id/ats-rerun', ctrl.rerunATS);
router.put('/:id', ctrl.updateJob);
router.delete('/:id', ctrl.deleteJob);

module.exports = router;
