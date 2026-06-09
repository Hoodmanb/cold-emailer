const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

router.post('/', asyncHandler(feedbackController.submitFeedback));

module.exports = router;
