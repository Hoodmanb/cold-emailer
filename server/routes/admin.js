const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/gateway', asyncHandler(adminController.getGatewayConfig));
router.put('/gateway', asyncHandler(adminController.updateGatewayConfig));

router.get('/credit-packs', asyncHandler(adminController.getCreditPacksAdmin));
router.post('/credit-packs', asyncHandler(adminController.createCreditPackAdmin));
router.put('/credit-packs/:packId', asyncHandler(adminController.updateCreditPackAdmin));

router.get('/users', asyncHandler(adminController.listUsersAdmin));
router.get('/users/:userId/billing', asyncHandler(adminController.getUserBillingAdmin));
router.post('/users/:userId/grant-credits', asyncHandler(adminController.grantCreditsAdmin));
router.post('/users/:userId/revoke-credits', asyncHandler(adminController.revokeCreditsAdmin));
router.post('/users/:userId/extend-gateway', asyncHandler(adminController.extendGatewayAdmin));
router.post('/users/:userId/revoke-gateway', asyncHandler(adminController.revokeGatewayAdmin));
router.put('/users/:userId/billing-type', asyncHandler(adminController.setUserBillingTypeAdmin));

router.get('/transactions', asyncHandler(adminController.listTransactionsAdmin));

module.exports = router;
