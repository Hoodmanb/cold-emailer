const billingService = require('../services/billing/billingService');
const {
  listCreditPacks,
  getGatewaySettings,
  updateGatewaySettings,
  createCreditPack,
  updateCreditPack,
  listTransactions,
} = require('../repositories/billingRepository');
const {
  grantCredits,
  revokeAllCredits,
  extendGatewayAccess,
  deactivateGatewayAccess,
  setBillingType,
} = require('../repositories/billingUserRepository');
const fileStore = require('../utils/fileStore');
const { successResponse } = require('../utils/response');

const getGatewayConfig = (_req, res) =>
  successResponse(res, { message: 'Gateway settings loaded', data: getGatewaySettings() });

const updateGatewayConfig = (req, res) => {
  const { price, currency, durationMonths, active } = req.body || {};
  const data = updateGatewaySettings({
    ...(price !== undefined ? { price: Number(price) } : {}),
    ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {}),
    ...(durationMonths !== undefined ? { durationMonths: Number(durationMonths) } : {}),
    ...(active !== undefined ? { active: active === true || active === 'true' } : {}),
  });
  return successResponse(res, { message: 'Gateway settings updated', data });
};

const getCreditPacksAdmin = (_req, res) =>
  successResponse(res, { message: 'Credit packs loaded', data: listCreditPacks({ includeInactive: true }) });

const createCreditPackAdmin = (req, res) => {
  const pack = createCreditPack(req.body || {});
  return successResponse(res, { status: 201, message: 'Credit pack created', data: pack });
};

const updateCreditPackAdmin = (req, res) => {
  const pack = updateCreditPack(req.params.packId, req.body || {});
  return successResponse(res, { message: 'Credit pack updated', data: pack });
};

const listUsersAdmin = (_req, res) => {
  const users = fileStore.read('users.json').map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'user',
    disabled: u.disabled === true,
    billingType: u.billingType || 'token',
    credits: Number(u.credits) || 0,
    gatewayAccess: u.gatewayAccess || null,
    createdAt: u.createdAt,
  }));
  return successResponse(res, { message: 'Users loaded', data: users });
};

const getUserBillingAdmin = (req, res) => {
  const summary = billingService.getBillingSummary(req.params.userId);
  if (!summary) {
    res.status(404);
    throw new Error('User not found');
  }
  return successResponse(res, { message: 'User billing loaded', data: summary });
};

const grantCreditsAdmin = (req, res) => {
  const { amount } = req.body || {};
  if (!amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error('amount must be a positive number');
  }
  const user = grantCredits(req.params.userId, Number(amount));
  return successResponse(res, {
    message: 'Credits granted',
    data: billingService.getBillingSummary(user.id),
  });
};

const revokeCreditsAdmin = (req, res) => {
  revokeAllCredits(req.params.userId);
  return successResponse(res, {
    message: 'Credits revoked',
    data: billingService.getBillingSummary(req.params.userId),
  });
};

const extendGatewayAdmin = (req, res) => {
  const months = Number(req.body?.months) || 12;
  extendGatewayAccess(req.params.userId, months);
  return successResponse(res, {
    message: 'Gateway access extended',
    data: billingService.getBillingSummary(req.params.userId),
  });
};

const revokeGatewayAdmin = (req, res) => {
  deactivateGatewayAccess(req.params.userId);
  return successResponse(res, {
    message: 'Gateway access revoked',
    data: billingService.getBillingSummary(req.params.userId),
  });
};

const setUserBillingTypeAdmin = (req, res) => {
  const { billingType } = req.body || {};
  setBillingType(req.params.userId, billingType);
  return successResponse(res, {
    message: 'Billing type updated',
    data: billingService.getBillingSummary(req.params.userId),
  });
};

const listTransactionsAdmin = (req, res) => {
  const { type, status } = req.query || {};
  const rows = listTransactions({ type, status });
  return successResponse(res, { message: 'Transactions loaded', data: rows });
};

module.exports = {
  getGatewayConfig,
  updateGatewayConfig,
  getCreditPacksAdmin,
  createCreditPackAdmin,
  updateCreditPackAdmin,
  listUsersAdmin,
  getUserBillingAdmin,
  grantCreditsAdmin,
  revokeCreditsAdmin,
  extendGatewayAdmin,
  revokeGatewayAdmin,
  setUserBillingTypeAdmin,
  listTransactionsAdmin,
};
