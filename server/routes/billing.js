const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const billingController = require('../controllers/billingController');

const router = express.Router();

router.get('/status', asyncHandler(billingController.getBillingStatus));
router.get('/transactions', asyncHandler(billingController.listUserTransactions));
router.post('/estimate', asyncHandler(billingController.estimateCost));
router.post('/checkout/gateway', asyncHandler(billingController.initializeGatewayPayment));
router.post('/checkout/credits', asyncHandler(billingController.initializeCreditPayment));
router.post('/verify', asyncHandler(billingController.verifyPayment));

module.exports = router;
