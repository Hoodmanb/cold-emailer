const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailController');

// History
router.get('/history', ctrl.listEmails);
router.get('/history/:id', ctrl.getEmail);

// Draft management
router.put('/:id', ctrl.updateEmail);
router.post('/:id/approve', ctrl.approveEmail);
router.delete('/:id', ctrl.deleteEmail);

// Sending
router.post('/', ctrl.sendSingle);
router.post('/bulk', ctrl.sendBulk);

module.exports = router;
