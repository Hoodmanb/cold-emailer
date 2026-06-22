const express = require('express');
const { signup, login, me, resetPassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// router.post('/signup', asyncHandler(signup));
// router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.post('/reset-password', asyncHandler(resetPassword));

module.exports = router;
