const {
  getUserBilling,
  expireOldCreditBuckets,
  deductCreditsFromBuckets,
  addCreditBucket,
  activateGatewayAccess,
  ensureMonthlyGatewayCredits,
  getGatewayCreditCycleInfo,
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
const { getOrCreateWallet, adjustWalletBalance, setWalletBalance } = require('../../repositories/walletRepository');
const { getBillingSettings } = require('../../repositories/billingSettingsRepository');
const { getModelPricing } = require('../../repositories/pricingRepository');
const { createUsageLog } = require('../../repositories/usageLogRepository');
const { calculateActualCost, calculateCreditCharge } = require('./aiBillingEngine');
const Supabase = require('../../services/supabaseService');
const { resolveFeatureConfig, getDecryptedKey } = require('../../repositories/aiRepository');

const AI_FEATURE_IDS = new Set([
  'resume_generation',
  'professional_cv_generation',
  'cover_letter_generation',
  'email_generation',
  'ats_analysis',
  'chatbot_assistant',
  'project_summary_generation',
  'advanced_doc_generation',
  'job_extraction_image',
]);

async function refreshUserCredits(userId, settings) {
  const billingSettings = settings || await getBillingSettings();
  await expireOldCreditBuckets(userId);
  const user = await ensureMonthlyGatewayCredits(userId, billingSettings);
  const balance = Number(user?.credits) || 0;
  await setWalletBalance(userId, balance, 'credit_sync', 'Credit balance synchronized from credit buckets');
  return { user, balance };
}

async function isGatewayActive(userId) {
  const user = await getUserBilling(userId);
  if (!user || user.billingType !== 'gateway') return false;
  const access = user.gatewayAccess || {};
  if (!access.isActive) return false;
  if (!access.expiresAt) return false;
  return new Date(access.expiresAt).getTime() > Date.now();
}

async function getCreditBalance(userId) {
  const { balance } = await refreshUserCredits(userId);
  return balance;
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
  const settings = await getBillingSettings();
  const { user, balance } = await refreshUserCredits(userId, settings);
  const wallet = await getOrCreateWallet(userId);

  const credits = Number(balance) || 0;
  const gatewayAccess = user.gatewayAccess || {};
  const isGateway = await isGatewayActive(userId);
  const hasCredits = credits > 0;
  const access = isGateway || hasCredits;
  const activeGatewayBucket = (user.creditExpiryBuckets || []).find(
    (bucket) => bucket.status === 'active' && bucket.source === 'gateway_monthly' && bucket.cycle === gatewayAccess.lastCreditCycle,
  );
  const nextMonthlyCreditReset = isGateway
    ? activeGatewayBucket?.expiresAt || getGatewayCreditCycleInfo(gatewayAccess).nextCycleStart.toISOString()
    : null;

  return {
    billingType: access ? user.billingType : null,
    gatewayAccess: {
      ...gatewayAccess,
      isActive: isGateway,
    },
    credits,
    walletCredits: Number(wallet?.balance) || 0,
    monthlyCreditAllowance: Number(gatewayAccess.monthlyCredits ?? settings.gateway_monthly_credit_allowance ?? 0) || 0,
    nextMonthlyCreditReset,
    creditExpiryBuckets: (user.creditExpiryBuckets || []).filter((b) => b.status === 'active'),
    hasAccess: access,
    status: access ? 'active' : 'unpaid',
  };
}

async function estimateFeatureCost(featureId, options = {}) {
  const settings = await getBillingSettings();
  return calculateFeatureCost(featureId, settings, options);
}

async function canUseGatewayOwnOpenRouterKey(userId, featureId, options = {}) {
  if (options.useAppKey === true || !AI_FEATURE_IDS.has(featureId)) return false;
  const user = await getUserBilling(userId);
  if (!user || user.billingType !== 'gateway' || !(await isGatewayActive(userId))) return false;
  const config = await resolveFeatureConfig(featureId, userId);
  return String(config.provider || '').toLowerCase() === 'openrouter'
    && Boolean(await getDecryptedKey('openrouter', userId));
}

async function estimateExecutableCost(userId, featureId, options = {}) {
  if (!featureId) return 0;
  if (await canUseGatewayOwnOpenRouterKey(userId, featureId, options)) return 0;
  return estimateFeatureCost(featureId, options);
}

async function assertCanExecuteAI(userId, featureId, options = {}) {
  const user = await getUserBilling(userId);
  if (!(await hasAccess(userId))) {
    throw new BillingAccessError('No active subscription or credits', 'NO_ACTIVE_BILLING');
  }

  const settings = await getBillingSettings();
  const cost = calculateFeatureCost(featureId, settings, options);
  const isGateway = user.billingType === 'gateway' && await isGatewayActive(userId);

  // Admin users bypass credit checks
  if (user.role && user.role.toLowerCase() === 'admin') {
    clearBillingExecutionMode();
    return { billingType: 'admin', cost: 0, charged: false };
  }

  if (user.billingType === 'gateway' && !isGateway) {
    throw new BillingAccessError(
      'Gateway access expired. Renew your plan or use credits to continue.',
      'GATEWAY_EXPIRED',
    );
  }

  if (isGateway) {
    if (await canUseGatewayOwnOpenRouterKey(userId, featureId, options)) {
      await assertFeatureReady(featureId);
      clearBillingExecutionMode();
      return {
        billingType: 'gateway',
        aiBillingMode: 'gateway_own_key',
        cost: 0,
        charged: false,
      };
    }
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

  return {
    billingType: isGateway ? 'gateway' : 'token',
    aiBillingMode: isGateway ? 'gateway_app_key' : 'credit_app_key',
    cost,
    charged: true,
  };
}

async function consumeCredits(userId, amount, type, description, reference) {
  const cost = Number(amount) || 0;
  if (cost <= 0) return refreshUserCredits(userId);
  const { balance: balanceBefore } = await refreshUserCredits(userId);
  if (balanceBefore < cost) {
    throw new InsufficientCreditsError('Insufficient credits', {
      required: cost,
      balance: balanceBefore,
    });
  }
  const updatedUser = await deductCreditsFromBuckets(userId, cost);
  const balanceAfter = Number(updatedUser?.credits) || 0;
  await setWalletBalance(
    userId,
    balanceAfter,
    type || 'feature_usage',
    description || `Credit deduction: ${cost}`,
    reference,
  );
  return { user: updatedUser, balance: balanceAfter };
}

async function completeAIExecution(userId, featureId, options = {}, prepResult = {}) {
  try {
    if (prepResult.charged) {
      const usageEntries = getUsageEntries();
      const settings = await getBillingSettings();
      const featureCost = calculateFeatureCost(featureId, settings, options);

      if (usageEntries && usageEntries.length > 0) {
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

        const balance = await getCreditBalance(userId);
        if (balance < totalCreditsToDeduct) {
          const err = new Error('Insufficient credits for AI usage');
          err.errorCode = 'INSUFFICIENT_CREDITS';
          err.statusCode = 402;
          throw err;
        }

        await consumeCredits(
          userId,
          totalCreditsToDeduct,
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
        const totalCreditsToDeduct = featureCost;

        const balance = await getCreditBalance(userId);
        if (balance < totalCreditsToDeduct) {
          const err = new Error('Insufficient credits');
          err.errorCode = 'INSUFFICIENT_CREDITS';
          err.statusCode = 402;
          throw err;
        }

        await consumeCredits(
          userId,
          totalCreditsToDeduct,
          'ai_usage',
          `AI usage charge for ${featureId}: Fixed Cost (${featureCost})`,
        );

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
  return consumeCredits(userId, Number(amount), 'feature_usage', `Deduction for ${featureId}`);
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
  await refreshUserCredits(userId);

  return result;
}

async function activateGatewayFromPayment(userId, durationMonths) {
  const user = await activateGatewayAccess(userId, { paid: true, durationMonths });
  await refreshUserCredits(userId);
  return user;
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
  estimateExecutableCost,
  canUseGatewayOwnOpenRouterKey,
  assertCanExecuteAI,
  completeAIExecution,
  consumeCredits,
  deductCredits,
  addCredits,
  activateGatewayFromPayment,
  expireOldCredits,
  listFeatureCosts,
};
