const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recipientController');

router.get('/', ctrl.listRecipients);
router.post('/', ctrl.createRecipient);
router.get('/:email', ctrl.getRecipient);
router.put('/:email', ctrl.updateRecipient);
router.delete('/:email', ctrl.deleteRecipient);

module.exports = router;
