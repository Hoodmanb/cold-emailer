const express = require('express');
const router = express.Router();
const smtpController = require('../controllers/smtpController');

router.get('/', smtpController.listSmtps);
router.post('/', smtpController.createSmtp);
router.put('/:id', smtpController.updateSmtp);
router.delete('/:id', smtpController.deleteSmtp);
router.post('/verify/:id', smtpController.verifySmtp);

module.exports = router;
