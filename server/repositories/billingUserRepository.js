const { v4: uuidv4 } = require('uuid');
const { findUserById, updateUserRecord } = require('./userRepository');
const Supabase = require('../services/supabaseService');

const CREDIT_BUCKET_MONTHS = 6;

function defaultGatewayAccess(grandfathered = false) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 12);
  return {
    isActive: grandfathered,
    activatedAt: grandfathered ? now.toISOString() : null,
    expiresAt: grandfathered ? expiresAt.toISOString() : null,
    paid: grandfathered,
  };
}

function defaultBillingFields({ grandfathered = false } = {}) {
  return {
    billingType: grandfathered ? 'gateway' : 'token',
    gatewayAccess: defaultGatewayAccess(grandfathered),
    credits: 0,
    creditExpiryBuckets: [],
    schemaVersion: 1,
    metadata: {},
  };
}

function normalizeBillingFields(user) {
  const base = defaultBillingFields({ grandfathered: false });
  const gatewayAccess = {
    ...base.gatewayAccess,
    ...(user.gatewayAccess || {}),
  };
  return {
    billingType: user.billingType === 'gateway' ? 'gateway' : 'token',
    gatewayAccess,
    credits: Number(user.credits) || 0,
    creditExpiryBuckets: Array.isArray(user.creditExpiryBuckets) ? user.creditExpiryBuckets : [],
  };
}

async function ensureUserBillingFields(user, { grandfatherExisting = true } = {}) {
  if (!user) return null;
  const hasBilling = user.billingType && user.gatewayAccess;
  if (hasBilling) {
    return { ...user, ...normalizeBillingFields(user) };
  }
  const billing = defaultBillingFields({ grandfathered: grandfatherExisting });
  return updateUserRecord(user.id, billing);
}

async function migrateAllUsersBilling() {
  const { data, error } = await Supabase.selectAll('users');
  if (error) throw error;
  let changed = 0;
  for (const user of data || []) {
    if (!user.billingType) {
      await ensureUserBillingFields(user, { grandfatherExisting: true });
      changed += 1;
    }
  }
  return changed;
}

async function getUserBilling(userId) {
  const user = await findUserById(userId);
  if (!user) return null;
  return ensureUserBillingFields(user, { grandfatherExisting: true });
}

async function setBillingType(userId, billingType) {
  if (!['gateway', 'token'].includes(billingType)) {
    throw new Error('Invalid billing type');
  }
  return updateUserRecord(userId, { billingType });
}

async function activateGatewayAccess(userId, { paid = true, durationMonths = 12 } = {}) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths) || 12);
  return updateUserRecord(userId, {
    billingType: 'gateway',
    gatewayAccess: {
      isActive: true,
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paid: paid === true,
    },
  });
}

async function deactivateGatewayAccess(userId) {
  return updateUserRecord(userId, {
    gatewayAccess: {
      isActive: false,
      activatedAt: null,
      expiresAt: null,
      paid: false,
    },
  });
}

async function extendGatewayAccess(userId, extraMonths = 12) {
  const user = await getUserBilling(userId);
  const baseDate = user.gatewayAccess?.expiresAt ? new Date(user.gatewayAccess.expiresAt) : new Date();
  const start = baseDate > new Date() ? baseDate : new Date();
  const expiresAt = new Date(start);
  expiresAt.setMonth(expiresAt.getMonth() + Number(extraMonths) || 12);
  return updateUserRecord(userId, {
    gatewayAccess: {
      ...(user.gatewayAccess || {}),
      isActive: true,
      expiresAt: expiresAt.toISOString(),
      paid: true,
    },
  });
}

function recalculateCreditBalance(buckets) {
  return buckets
    .filter((b) => b.status === 'active' && Number(b.remaining) > 0)
    .reduce((sum, b) => sum + Number(b.remaining), 0);
}

async function addCreditBucket(userId, amount, meta = {}) {
  const user = await getUserBilling(userId);
  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt);
  expiresAt.setMonth(expiresAt.getMonth() + CREDIT_BUCKET_MONTHS);

  const bucket = {
    id: uuidv4(),
    amount: Number(amount),
    remaining: Number(amount),
    purchasedAt: purchasedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
    ...meta,
  };

  const buckets = [...(user.creditExpiryBuckets || []), bucket];
  const credits = recalculateCreditBalance(buckets);
  return updateUserRecord(userId, { creditExpiryBuckets: buckets, credits });
}

async function expireOldCreditBuckets(userId) {
  const user = await getUserBilling(userId);
  const now = Date.now();
  let changed = false;
  const buckets = (user.creditExpiryBuckets || []).map((bucket) => {
    if (bucket.status === 'active' && new Date(bucket.expiresAt).getTime() <= now) {
      changed = true;
      return { ...bucket, status: 'expired', remaining: 0 };
    }
    return bucket;
  });
  if (!changed) return user;
  const credits = recalculateCreditBalance(buckets);
  return updateUserRecord(userId, { creditExpiryBuckets: buckets, credits });
}

async function deductCreditsFromBuckets(userId, amount) {
  await expireOldCreditBuckets(userId);
  const user = await getUserBilling(userId);
  let remainingToDeduct = Number(amount);
  const buckets = [...(user.creditExpiryBuckets || [])]
    .filter((b) => b.status === 'active' && Number(b.remaining) > 0)
    .sort((a, b) => new Date(a.purchasedAt) - new Date(b.purchasedAt));

  const updatedBuckets = [...(user.creditExpiryBuckets || [])];
  for (const bucket of buckets) {
    if (remainingToDeduct <= 0) break;
    const idx = updatedBuckets.findIndex((b) => b.id === bucket.id);
    if (idx < 0) continue;
    const available = Number(updatedBuckets[idx].remaining) || 0;
    const used = Math.min(available, remainingToDeduct);
    updatedBuckets[idx] = {
      ...updatedBuckets[idx],
      remaining: available - used,
    };
    remainingToDeduct -= used;
  }

  if (remainingToDeduct > 0) {
    const err = new Error('Insufficient credits');
    err.errorCode = 'INSUFFICIENT_CREDITS';
    err.statusCode = 402;
    throw err;
  }

  const credits = recalculateCreditBalance(updatedBuckets);
  return updateUserRecord(userId, {
    creditExpiryBuckets: updatedBuckets,
    credits,
  });
}

async function grantCredits(userId, amount) {
  return addCreditBucket(userId, amount, { source: 'admin_grant' });
}

async function revokeAllCredits(userId) {
  const user = await getUserBilling(userId);
  const buckets = (user.creditExpiryBuckets || []).map((b) => ({
    ...b,
    status: 'expired',
    remaining: 0,
  }));
  return updateUserRecord(userId, { creditExpiryBuckets: buckets, credits: 0 });
}

module.exports = {
  CREDIT_BUCKET_MONTHS,
  defaultBillingFields,
  normalizeBillingFields,
  ensureUserBillingFields,
  migrateAllUsersBilling,
  getUserBilling,
  setBillingType,
  activateGatewayAccess,
  deactivateGatewayAccess,
  extendGatewayAccess,
  recalculateCreditBalance,
  addCreditBucket,
  expireOldCreditBuckets,
  deductCreditsFromBuckets,
  grantCredits,
  revokeAllCredits,
};
