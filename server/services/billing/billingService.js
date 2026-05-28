const crypto = require('crypto');
const {
  getUserBilling,
  expireOldCreditBuckets,
  deductCreditsFromBuckets,
  addCreditBucket,
  activateGatewayAccess,
} = require('../../repositories/billingUserRepository');
const { findCreditPackById, getGatewaySettings } = require('../../repositories/billingRepository');
const { calculateFeatureCost, listFeatureCosts } = require('./featureCosts');
const { assertSystemProviderReady } = require('./systemProviderKeys');
const { assertFeatureReady } = require('../ai/providerValidation');
const { setBillingExecutionMode, clearBillingExecutionMode } = require('../../middleware/requestContext');
const { InsufficientCreditsError, BillingAccessError } = require('../../shared/errors/customErrors');

function isGatewayActive(userId) {
  const user = getUserBilling(userId);
  if (!user || user.billingType !== 'gateway') return false;
  const access = user.gatewayAccess || {};
  if (!access.isActive) return false;
  if (!access.expiresAt) return false;
  return new Date(access.expiresAt).getTime() > Date.now();
}

function getCreditBalance(userId) {
  const user = expireOldCreditBuckets(userId);
  return Number(user.credits) || 0;
}

function hasAccess(userId) {
  const user = getUserBilling(userId);
  if (!user) return false;

  const gatewayOk = isGatewayActive(userId);
  const creditsOk = getCreditBalance(userId) > 0;

  return gatewayOk || creditsOk;
}

// function getBillingSummary(userId) {
//   const user = expireOldCreditBuckets(userId);
//   const gatewayActive = isGatewayActive(userId);
//   const credits = Number(user.credits) || 0;
//   const activeBuckets = (user.creditExpiryBuckets || []).filter((b) => b.status === 'active');
//   const gatewayAccess = user.gatewayAccess || {};

//   let gatewayDaysRemaining = null;
//   if (gatewayAccess.expiresAt) {
//     const ms = new Date(gatewayAccess.expiresAt).getTime() - Date.now();
//     gatewayDaysRemaining = ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
//   }

//   return {
//     billingType: user.billingType,
//     gatewayAccess: {
//       ...gatewayAccess,
//       isActive: gatewayActive,
//       daysRemaining: gatewayDaysRemaining,
//     },
//     credits,
//     creditExpiryBuckets: activeBuckets,
//     hasAccess: user.billingType === 'gateway' ? gatewayActive : credits > 0,
//   };
// }

function getBillingSummary(userId) {
  const user = expireOldCreditBuckets(userId);

  const credits = Number(user.credits) || 0;

  const gatewayAccess = user.gatewayAccess || {};
  const isGateway = isGatewayActive(userId);

  const hasCredits = credits > 0;

  const hasAccess = isGateway || hasCredits;

  return {
    billingType: hasAccess ? user.billingType : null,
    gatewayAccess: {
      ...gatewayAccess,
      isActive: isGateway,
    },
    credits,
    creditExpiryBuckets: (user.creditExpiryBuckets || []).filter(b => b.status === 'active'),

    // 🔥 THIS is what frontend should trust
    hasAccess,

    // 🔥 ADD THIS (VERY IMPORTANT)
    status: hasAccess ? 'active' : 'unpaid',
  };
}

function estimateFeatureCost(featureId, options = {}) {
  return calculateFeatureCost(featureId, options);
}

function assertCanExecuteAI(userId, featureId, options = {}) {
  const user = getUserBilling(userId);
  if (!hasAccess(userId)) {
    throw new BillingAccessError('No active subscription or credits', 'NO_ACTIVE_BILLING');
  }

  const cost = calculateFeatureCost(featureId, options);

  if (user.billingType === 'gateway') {
    if (!isGatewayActive(userId)) {
      throw new BillingAccessError(
        'Gateway access expired. Renew your plan to continue using AI features.',
        'GATEWAY_EXPIRED'
      );
    }
    assertFeatureReady(featureId);
    clearBillingExecutionMode();
    return { billingType: 'gateway', cost: 0, charged: false };
  }

  expireOldCreditBuckets(userId);
  const balance = getCreditBalance(userId);
  if (balance < cost) {
    throw new InsufficientCreditsError('Insufficient credits for this AI operation.', {
      required: cost,
      balance,
      featureId,
    });
  }

  assertSystemProviderReady();
  setBillingExecutionMode('token');
  return { billingType: 'token', cost, charged: true };
}

function completeAIExecution(userId, featureId, options = {}, prepResult = {}) {
  try {
    if (prepResult.charged && prepResult.cost > 0) {
      deductCreditsFromBuckets(userId, prepResult.cost);
    }
  } finally {
    clearBillingExecutionMode();
  }
}

function deductCredits(userId, amount, featureId) {
  return deductCreditsFromBuckets(userId, amount);
}

function addCredits(userId, packId) {
  const pack = findCreditPackById(packId);
  if (!pack || pack.active === false) {
    throw new Error('Credit pack not found or inactive');
  }
  return addCreditBucket(userId, pack.amount, {
    packId: pack.id,
    packName: pack.name,
    source: 'purchase',
  });
}

function activateGatewayFromPayment(userId, durationMonths) {
  return activateGatewayAccess(userId, { paid: true, durationMonths });
}

function expireOldCredits() {
  const fileStore = require('../../utils/fileStore');
  const users = fileStore.read('users.json');
  let updated = 0;
  for (const user of users) {
    const before = Number(user.credits) || 0;
    const afterUser = expireOldCreditBuckets(user.id);
    const after = Number(afterUser.credits) || 0;
    if (before !== after) updated += 1;
  }
  return updated;
}

module.exports = {
  hasAccess,
  isGatewayActive,
  getCreditBalance,
  getBillingSummary,
  estimateFeatureCost,
  assertCanExecuteAI,
  completeAIExecution,
  deductCredits,
  addCredits,
  activateGatewayFromPayment,
  expireOldCredits,
  listFeatureCosts,
};
