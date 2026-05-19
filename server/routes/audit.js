const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditController');

router.get('/', ctrl.getLogs);

module.exports = router;
