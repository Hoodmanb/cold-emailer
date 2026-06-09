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
const {
  setBillingExecutionMode,
  clearBillingExecutionMode,
  getUsageEntries,
  clearUsageEntries,
} = require('../../middleware/requestContext');
const { InsufficientCreditsError, BillingAccessError } = require('../../shared/errors/customErrors');

// Import new repositories and engine
const { getOrCreateWallet, adjustWalletBalance } = require('../../repositories/walletRepository');
const { getBillingSettings } = require('../../repositories/billingSettingsRepository');
const { getModelPricing } = require('../../repositories/pricingRepository');
const { createUsageLog } = require('../../repositories/usageLogRepository');
const { calculateActualCost, calculateCreditCharge } = require('./aiBillingEngine');
const { transaction, safeRead } = require('../../db/jsonDb');
const { v4: uuidv4 } = require('uuid');

function isGatewayActive(userId) {
  const user = getUserBilling(userId);
  if (!user || user.billingType !== 'gateway') return false;
  const access = user.gatewayAccess || {};
  if (!access.isActive) return false;
  if (!access.expiresAt) return false;
  return new Date(access.expiresAt).getTime() > Date.now();
}

function getCreditBalance(userId) {
  // Sync old buckets for user record
  expireOldCreditBuckets(userId);
  const wallet = getOrCreateWallet(userId);
  return Number(wallet.balance) || 0;
}

function hasAccess(userId) {
  const user = getUserBilling(userId);
  if (!user) return false;

  const gatewayOk = isGatewayActive(userId);
  const creditsOk = getCreditBalance(userId) > 0;

  return gatewayOk || creditsOk;
}

function getBillingSummary(userId) {
  const user = expireOldCreditBuckets(userId);
  const wallet = getOrCreateWallet(userId);

  const credits = Number(wallet.balance) || 0;
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
    hasAccess,
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

  // Cost estimate is the minimum required credits for this feature
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
  
  // Clear any existing usage entries in request context before AI starts
  clearUsageEntries();

  return { billingType: 'token', cost, charged: true };
}

function completeAIExecution(userId, featureId, options = {}, prepResult = {}) {
  try {
    if (prepResult.charged && prepResult.billingType === 'token') {
      const usageEntries = getUsageEntries();
      
      if (usageEntries && usageEntries.length > 0) {
        // Run transactional deduction for actual token usage entries
        transaction([
          'credits_wallets.json',
          'credit_transactions.json',
          'ai_usage_logs.json',
          'users.json'
        ], () => {
          const wallet = getOrCreateWallet(userId, true);
          let totalCreditsToDeduct = 0;
          const usageLogsToInsert = [];
          
          const settings = getBillingSettings();
          const creditValue = Number(settings.credit_value_usd) || 0.01;

          for (const entry of usageEntries) {
            const actualCostUSD = calculateActualCost(entry.provider, entry.model, entry.inputTokens, entry.outputTokens);
            const pricing = getModelPricing(entry.provider, entry.model);
            const creditsToDeduct = calculateCreditCharge(actualCostUSD, pricing.markup_multiplier);

            totalCreditsToDeduct += creditsToDeduct;

            usageLogsToInsert.push({
              user_id: userId,
              provider: entry.provider,
              model: entry.model,
              input_tokens: entry.inputTokens,
              output_tokens: entry.outputTokens,
              actual_provider_cost: actualCostUSD,
              charged_credits: creditsToDeduct,
              input_price_used: pricing.input_cost_per_million,
              output_price_used: pricing.output_cost_per_million,
              markup_used: pricing.markup_multiplier,
              credit_value_used: creditValue,
              request_type: featureId,
              metadata: options,
            });
          }

          if (wallet.balance < totalCreditsToDeduct) {
            const err = new Error('Insufficient credits for AI usage');
            err.errorCode = 'INSUFFICIENT_CREDITS';
            err.statusCode = 402;
            throw err;
          }

          // Deduct atomic wallet adjustment
          adjustWalletBalance(
            userId, 
            -totalCreditsToDeduct, 
            'ai_usage', 
            `AI usage charge for ${featureId} (${usageEntries.length} requests)`, 
            null, 
            true
          );

          // Write usage logs
          for (const log of usageLogsToInsert) {
            createUsageLog(log, true);
          }
        });
      } else {
        // Fallback: Deduct estimated flat credits if no usage entries were populated
        const estimatedCost = Number(prepResult.cost) || 1;
        transaction([
          'credits_wallets.json',
          'credit_transactions.json',
          'ai_usage_logs.json',
          'users.json'
        ], () => {
          const wallet = getOrCreateWallet(userId, true);
          if (wallet.balance < estimatedCost) {
            const err = new Error('Insufficient credits');
            err.errorCode = 'INSUFFICIENT_CREDITS';
            err.statusCode = 402;
            throw err;
          }

          adjustWalletBalance(
            userId, 
            -estimatedCost, 
            'ai_usage', 
            `AI usage charge for ${featureId} (Fallback)`, 
            null, 
            true
          );

          // Log fallback usage
          const settings = getBillingSettings();
          const { resolveFeatureConfig } = require('../../repositories/aiRepository');
          const config = resolveFeatureConfig(featureId) || {};
          
          createUsageLog({
            user_id: userId,
            provider: config.provider || 'unknown',
            model: config.model || 'unknown',
            input_tokens: 0,
            output_tokens: 0,
            actual_provider_cost: 0,
            charged_credits: estimatedCost,
            input_price_used: 0,
            output_price_used: 0,
            markup_used: 0,
            credit_value_used: Number(settings.credit_value_usd) || 0.01,
            request_type: featureId,
            metadata: { ...options, fallback: 'no_tokens_extracted' },
          }, true);
        });
      }
    }
  } finally {
    clearUsageEntries();
    clearBillingExecutionMode();
  }
}

function deductCredits(userId, amount, featureId) {
  // Sync user record and adjust wallet
  return adjustWalletBalance(userId, -Number(amount), 'ai_usage', `Deduction for ${featureId}`);
}

function addCredits(userId, packId) {
  const pack = findCreditPackById(packId);
  if (!pack || pack.active === false) {
    throw new Error('Credit pack not found or inactive');
  }

  // Adjust wallet (purchase transaction type)
  const result = adjustWalletBalance(
    userId, 
    pack.amount, 
    'purchase', 
    `Purchased ${pack.name}`, 
    `purch_${pack.id}_${Date.now()}`
  );

  // Still add to credit buckets for legacy display support
  addCreditBucket(userId, pack.amount, {
    packId: pack.id,
    packName: pack.name,
    source: 'purchase',
  });

  return result;
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
