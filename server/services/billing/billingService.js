const {
  getUserBilling,
  expireOldCreditBuckets,
  deductCreditsFromBuckets,
  addCreditBucket,
  activateGatewayAccess,
} = require('../../repositories/billingUserRepository');
const { findCreditPackById } = require('../../repositories/billingRepository');
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
const { getOrCreateWallet, adjustWalletBalance } = require('../../repositories/walletRepository');
const { getBillingSettings } = require('../../repositories/billingSettingsRepository');
const { getModelPricing } = require('../../repositories/pricingRepository');
const { createUsageLog } = require('../../repositories/usageLogRepository');
const { calculateActualCost, calculateCreditCharge } = require('./aiBillingEngine');
const Supabase = require('../../services/supabaseService');

async function isGatewayActive(userId) {
  const user = await getUserBilling(userId);
  if (!user || user.billingType !== 'gateway') return false;
  const access = user.gatewayAccess || {};
  if (!access.isActive) return false;
  if (!access.expiresAt) return false;
  return new Date(access.expiresAt).getTime() > Date.now();
}

async function getCreditBalance(userId) {
  await expireOldCreditBuckets(userId);
  const wallet = await getOrCreateWallet(userId);
  return Number(wallet?.balance) || 0;
}

async function hasAccess(userId) {
  const user = await getUserBilling(userId);
  if (!user) return false;
  // Admin users bypass all credit and gateway checks
  if (user.role && user.role.toLowerCase() === 'admin') {
    return true;
  }
  const gatewayOk = await isGatewayActive(userId);
  const creditsOk = (await getCreditBalance(userId)) > 0;
  return gatewayOk || creditsOk;
}

async function getBillingSummary(userId) {
  const user = await expireOldCreditBuckets(userId);
  const wallet = await getOrCreateWallet(userId);

  const credits = Number(wallet?.balance) || 0;
  const gatewayAccess = user.gatewayAccess || {};
  const isGateway = await isGatewayActive(userId);
  const hasCredits = credits > 0;
  const access = isGateway || hasCredits;

  return {
    billingType: access ? user.billingType : null,
    gatewayAccess: {
      ...gatewayAccess,
      isActive: isGateway,
    },
    credits,
    creditExpiryBuckets: (user.creditExpiryBuckets || []).filter((b) => b.status === 'active'),
    hasAccess: access,
    status: access ? 'active' : 'unpaid',
  };
}

async function estimateFeatureCost(featureId, options = {}) {
  const settings = await getBillingSettings();
  return calculateFeatureCost(featureId, settings, options);
}

async function assertCanExecuteAI(userId, featureId, options = {}) {
  const user = await getUserBilling(userId);
  if (!(await hasAccess(userId))) {
    throw new BillingAccessError('No active subscription or credits', 'NO_ACTIVE_BILLING');
  }

  const settings = await getBillingSettings();
  const cost = calculateFeatureCost(featureId, settings, options);

  if (user.billingType === 'gateway') {
    if (!(await isGatewayActive(userId))) {
      throw new BillingAccessError(
        'Gateway access expired. Renew your plan to continue using AI features.',
        'GATEWAY_EXPIRED',
      );
    }
    await assertFeatureReady(featureId);
    clearBillingExecutionMode();
    return { billingType: 'gateway', cost: 0, charged: false };
  }

  // Admin users bypass credit checks
  if (user.role && user.role.toLowerCase() === 'admin') {
    clearBillingExecutionMode();
    return { billingType: 'admin', cost: 0, charged: false };
  }

  const balance = await getCreditBalance(userId);
  if (balance < cost) {
    throw new InsufficientCreditsError('Insufficient credits for this AI operation.', {
      required: cost,
      balance,
      featureId,
    });
  }

  assertSystemProviderReady();
  setBillingExecutionMode('token');
  clearUsageEntries();

  return { billingType: 'token', cost, charged: true };
}

async function completeAIExecution(userId, featureId, options = {}, prepResult = {}) {
  try {
    if (prepResult.charged && prepResult.billingType === 'token') {
      const usageEntries = getUsageEntries();
      const settings = await getBillingSettings();
      const featureCost = calculateFeatureCost(featureId, settings, options);

      if (usageEntries && usageEntries.length > 0) {
        const wallet = await getOrCreateWallet(userId);
        let totalCreditsToDeduct = 0;
        const usageLogsToInsert = [];
        const creditValue = Number(settings.credit_value_usd) || 0.01;

        let tokenCostAccumulator = 0;

        for (const entry of usageEntries) {
          const actualCostUSD = await calculateActualCost(
            entry.provider,
            entry.model,
            entry.inputTokens,
            entry.outputTokens,
          );
          const pricing = await getModelPricing(entry.provider, entry.model);
          const creditsToDeduct = await calculateCreditCharge(actualCostUSD, pricing?.markup_multiplier || 1.0);
          tokenCostAccumulator += creditsToDeduct;

          usageLogsToInsert.push({
            user_id: userId,
            provider: entry.provider,
            model: entry.model,
            input_tokens: entry.inputTokens,
            output_tokens: entry.outputTokens,
            actual_provider_cost: actualCostUSD,
            charged_credits: creditsToDeduct,
            input_price_used: pricing?.input_cost_per_million || 0,
            output_price_used: pricing?.output_cost_per_million || 0,
            markup_used: pricing?.markup_multiplier || 1.0,
            credit_value_used: creditValue,
            request_type: featureId,
            metadata: { ...options },
          });
        }

        totalCreditsToDeduct = featureCost + tokenCostAccumulator;

        if ((wallet?.balance || 0) < totalCreditsToDeduct) {
          const err = new Error('Insufficient credits for AI usage');
          err.errorCode = 'INSUFFICIENT_CREDITS';
          err.statusCode = 402;
          throw err;
        }

        await adjustWalletBalance(
          userId,
          -totalCreditsToDeduct,
          'ai_usage',
          `AI usage charge for ${featureId}: Fixed Cost (${featureCost}) + Token Cost (${tokenCostAccumulator})`,
        );

        for (let i = 0; i < usageLogsToInsert.length; i++) {
          const log = usageLogsToInsert[i];
          const logFeatureCost = i === 0 ? featureCost : 0;
          const logTokenCost = log.charged_credits;
          const logTotalCost = logFeatureCost + logTokenCost;

          log.charged_credits = logTotalCost;
          log.metadata = {
            ...log.metadata,
            feature_id: featureId,
            feature_cost: logFeatureCost,
            token_cost: logTokenCost,
            total_cost: logTotalCost,
          };
          await createUsageLog(log);
        }
      } else {
        const wallet = await getOrCreateWallet(userId);
        const totalCreditsToDeduct = featureCost;

        if ((wallet?.balance || 0) < totalCreditsToDeduct) {
          const err = new Error('Insufficient credits');
          err.errorCode = 'INSUFFICIENT_CREDITS';
          err.statusCode = 402;
          throw err;
        }

        await adjustWalletBalance(
          userId,
          -totalCreditsToDeduct,
          'ai_usage',
          `AI usage charge for ${featureId}: Fixed Cost (${featureCost})`,
        );

        const { resolveFeatureConfig } = require('../../repositories/aiRepository');
        const config = (await resolveFeatureConfig(featureId, userId)) || {};

        await createUsageLog({
          user_id: userId,
          provider: config.provider || 'unknown',
          model: config.model || 'unknown',
          input_tokens: 0,
          output_tokens: 0,
          actual_provider_cost: 0,
          charged_credits: totalCreditsToDeduct,
          input_price_used: 0,
          output_price_used: 0,
          markup_used: 0,
          credit_value_used: Number(settings.credit_value_usd) || 0.01,
          request_type: featureId,
          metadata: {
            ...options,
            fallback: 'no_tokens_extracted',
            feature_id: featureId,
            feature_cost: featureCost,
            token_cost: 0,
            total_cost: totalCreditsToDeduct,
          },
        });
      }
    }
  } finally {
    clearUsageEntries();
    clearBillingExecutionMode();
  }
}

async function deductCredits(userId, amount, featureId) {
  return adjustWalletBalance(userId, -Number(amount), 'ai_usage', `Deduction for ${featureId}`);
}

async function addCredits(userId, packId) {
  const pack = await findCreditPackById(packId);
  if (!pack || pack.active === false) {
    throw new Error('Credit pack not found or inactive');
  }

  const result = await adjustWalletBalance(
    userId,
    pack.amount,
    'purchase',
    `Purchased ${pack.name}`,
    `purch_${pack.id}_${Date.now()}`,
  );

  await addCreditBucket(userId, pack.amount, {
    packId: pack.id,
    packName: pack.name,
    source: 'purchase',
  });

  return result;
}

async function activateGatewayFromPayment(userId, durationMonths) {
  return activateGatewayAccess(userId, { paid: true, durationMonths });
}

async function expireOldCredits() {
  const { data, error } = await Supabase.selectAll('users');
  if (error) throw error;
  let updated = 0;
  for (const user of data || []) {
    const before = Number(user.credits) || 0;
    const afterUser = await expireOldCreditBuckets(user.id);
    const after = Number(afterUser?.credits) || 0;
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
