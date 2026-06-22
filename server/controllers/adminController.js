// const billingService = require('../services/billing/billingService');
// const {
//   listCreditPacks,
//   getGatewaySettings,
//   updateGatewaySettings,
//   createCreditPack,
//   updateCreditPack,
//   listTransactions,
// } = require('../repositories/billingRepository');
// const {
//   grantCredits,
//   revokeAllCredits,
//   extendGatewayAccess,
//   deactivateGatewayAccess,
//   setBillingType,
// } = require('../repositories/billingUserRepository');
// const fileStore = require('../utils/fileStore');
// const { successResponse } = require('../utils/response');

// // New repository imports
// const { getBillingSettings, updateBillingSettings } = require('../repositories/billingSettingsRepository');
// const {
//   listModelPricing,
//   createModelPricing,
//   updateModelPricing,
// } = require('../repositories/pricingRepository');
// const { listUsageLogs, getPlatformStats } = require('../repositories/usageLogRepository');
// const { getOrCreateWallet, readWalletList, adjustWalletBalance } = require('../repositories/walletRepository');
// const { safeRead } = require('../db/jsonDb');
// const {
//   getProviders,
//   getAllModelsGrouped,
//   isValidModelForProvider,
//   addCustomModel,
//   removeCustomModel,
// } = require('../services/ai/modelCatalog');
// const { verifyModelExists } = require('../services/ai/modelExistenceVerifier');

// // ─── Gateway ───────────────────────────────────────────────────────────────
// const { auditAttachmentReferences } = require('../services/dataConsistencyService');

// // ─── Consistency Check ───────────────────────────────────────────────────────
// const runConsistencyCheck = async (req, res) => {
//   // Get current admin user id (if needed) – using request context helper
//   const { getCurrentUserId } = require('../middleware/requestContext');
//   const userId = getCurrentUserId(req);
//   const result = await auditAttachmentReferences(userId);
//   return successResponse(res, { message: 'Consistency check completed', data: result });
// };

// const updateGatewayConfig = (req, res) => {
//   const { price, currency, durationMonths, active } = req.body || {};
//   const data = updateGatewaySettings({
//     ...(price !== undefined ? { price: Number(price) } : {}),
//     ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {}),
//     ...(durationMonths !== undefined ? { durationMonths: Number(durationMonths) } : {}),
//     ...(active !== undefined ? { active: active === true || active === 'true' } : {}),
//   });
//   return successResponse(res, { message: 'Gateway settings updated', data });
// };

// // ─── Credit Packs ──────────────────────────────────────────────────────────
// const getCreditPacksAdmin = (_req, res) =>
//   successResponse(res, { message: 'Credit packs loaded', data: listCreditPacks({ includeInactive: true }) });

// const createCreditPackAdmin = (req, res) => {
//   const pack = createCreditPack(req.body || {});
//   return successResponse(res, { status: 201, message: 'Credit pack created', data: pack });
// };

// const updateCreditPackAdmin = (req, res) => {
//   const pack = updateCreditPack(req.params.packId, req.body || {});
//   return successResponse(res, { message: 'Credit pack updated', data: pack });
// };

// // ─── Users ─────────────────────────────────────────────────────────────────
// const listUsersAdmin = (_req, res) => {
//   const allUsers = safeRead('users.json', []);
//   if (!Array.isArray(allUsers)) {
//     return successResponse(res, { message: 'Users loaded', data: [] });
//   }

//   const wallets = readWalletList();
//   const walletMap = {};
//   for (const w of wallets) {
//     if (w?.user_id) walletMap[w.user_id] = w;
//   }

//   const users = allUsers.map((u) => {
//     const wallet = walletMap[u.id] || {};
//     return {
//       id: u.id,
//       name: u.name,
//       email: u.email,
//       role: u.role || 'user',
//       disabled: u.disabled === true,
//       billingType: u.billingType || 'token',
//       credits: Number(wallet.balance ?? u.credits) || 0,
//       totalPurchased: Number(wallet.total_purchased) || 0,
//       totalConsumed: Number(wallet.total_consumed) || 0,
//       gatewayAccess: u.gatewayAccess || null,
//       createdAt: u.createdAt,
//     };
//   });
//   return successResponse(res, { message: 'Users loaded', data: users });
// };

// const getUserBillingAdmin = (req, res) => {
//   const summary = billingService.getBillingSummary(req.params.userId);
//   if (!summary) {
//     res.status(404);
//     throw new Error('User not found');
//   }
//   return successResponse(res, { message: 'User billing loaded', data: summary });
// };

// const grantCreditsAdmin = (req, res) => {
//   const { amount, description } = req.body || {};
//   if (!amount || Number(amount) <= 0) {
//     res.status(400);
//     throw new Error('amount must be a positive number');
//   }
//   // Adjust wallet with bonus type
//   adjustWalletBalance(
//     req.params.userId,
//     Number(amount),
//     'bonus',
//     description || `Admin credit grant of ${amount}`,
//     `admin_grant_${Date.now()}`
//   );
//   // Also keep legacy credit buckets in sync
//   grantCredits(req.params.userId, Number(amount));

//   return successResponse(res, {
//     message: 'Credits granted',
//     data: billingService.getBillingSummary(req.params.userId),
//   });
// };

// const revokeCreditsAdmin = (req, res) => {
//   revokeAllCredits(req.params.userId);
//   return successResponse(res, {
//     message: 'Credits revoked',
//     data: billingService.getBillingSummary(req.params.userId),
//   });
// };

// const extendGatewayAdmin = (req, res) => {
//   const months = Number(req.body?.months) || 12;
//   extendGatewayAccess(req.params.userId, months);
//   return successResponse(res, {
//     message: 'Gateway access extended',
//     data: billingService.getBillingSummary(req.params.userId),
//   });
// };

// const revokeGatewayAdmin = (req, res) => {
//   deactivateGatewayAccess(req.params.userId);
//   return successResponse(res, {
//     message: 'Gateway access revoked',
//     data: billingService.getBillingSummary(req.params.userId),
//   });
// };

// const setUserBillingTypeAdmin = (req, res) => {
//   const { billingType } = req.body || {};
//   setBillingType(req.params.userId, billingType);
//   return successResponse(res, {
//     message: 'Billing type updated',
//     data: billingService.getBillingSummary(req.params.userId),
//   });
// };

// // ─── Transactions ──────────────────────────────────────────────────────────
// const listTransactionsAdmin = (req, res) => {
//   const { type, status } = req.query || {};
//   const rows = listTransactions({ type, status });
//   return successResponse(res, { message: 'Transactions loaded', data: rows });
// };

// // ─── NEW: Billing Settings ─────────────────────────────────────────────────
// const getBillingSettingsAdmin = (_req, res) => {
//   const settings = getBillingSettings();
//   return successResponse(res, { message: 'Billing settings loaded', data: settings });
// };

// const updateBillingSettingsAdmin = async (req, res) => {
//   // Accept any fields present in the request body; validation is done in the service layer.
//   const updates = { ...req.body };
//   // Ensure numeric fields are numbers (basic sanitisation).
//   const numericFields = [
//     'credit_value_usd',
//     'minimum_credit_charge',
//     'global_ai_markup_multiplier',
//     'minimum_ai_charge_credits',
//     'minimum_feature_charge_credits',
//     'percentage_bonus_on_purchase',
//   ];
//   for (const f of numericFields) {
//     if (updates[f] !== undefined) {
//       const n = Number(updates[f]);
//       if (isNaN(n) || n < 0) {
//         const err = new Error(`${f} must be a non‑negative number`);
//         err.statusCode = 400;
//         throw err;
//       }
//       updates[f] = n;
//     }
//   }
//   // Provider/Model markup overrides may be nested objects – ensure structure exists.
//   if (updates.providerModelMarkup && typeof updates.providerModelMarkup !== 'object') {
//     const err = new Error('providerModelMarkup must be an object');
//     err.statusCode = 400;
//     throw err;
//   }
//   if (updates.featureCosts && typeof updates.featureCosts !== 'object') {
//     const err = new Error('featureCosts must be an object');
//     err.statusCode = 400;
//     throw err;
//   }
//   if (updates.providerModelMarkup) {
//     for (const [provider, models] of Object.entries(updates.providerModelMarkup)) {
//       if (!models || typeof models !== 'object') continue;
//       for (const model of Object.keys(models)) {
//         if (!isValidModelForProvider(provider, model)) {
//           const err = new Error(`Unknown provider/model pair: ${provider}/${model}`);
//           err.statusCode = 400;
//           throw err;
//         }
//       }
//     }
//   }

//   const next = updateBillingSettings(updates);
//   return successResponse(res, { message: 'Billing settings updated', data: next });
// };

// // ─── NEW: Model Pricing ────────────────────────────────────────────────────
// const listModelPricingAdmin = (_req, res) => {
//   return successResponse(res, { message: 'Model pricing loaded', data: listModelPricing() });
// };

// const createModelPricingAdmin = (req, res) => {
//   const record = createModelPricing(req.body || {});
//   return successResponse(res, { status: 201, message: 'Model pricing created', data: record });
// };

// const updateModelPricingAdmin = (req, res) => {
//   const record = updateModelPricing(req.params.pricingId, req.body || {});
//   return successResponse(res, { message: 'Model pricing updated', data: record });
// };

// // ─── NEW: Usage Logs & Analytics ──────────────────────────────────────────
// const getUsageLogsAdmin = (req, res) => {
//   const { userId, limit } = req.query || {};
//   let logs = listUsageLogs();
//   if (userId) logs = logs.filter((l) => l.user_id === userId);
//   logs = logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//   if (limit) logs = logs.slice(0, Number(limit) || 50);
//   return successResponse(res, { message: 'Usage logs loaded', data: logs });
// };

// const getBillingAnalyticsAdmin = (_req, res) => {
//   const stats = getPlatformStats();
//   const allLogs = listUsageLogs();

//   // Daily stats
//   const today = new Date().toISOString().slice(0, 10);
//   const todayLogs = allLogs.filter((l) => l.created_at && l.created_at.slice(0, 10) === today);
//   const todayProviderCost = todayLogs.reduce((s, l) => s + (Number(l.actual_provider_cost) || 0), 0);
//   const todayCredits = todayLogs.reduce((s, l) => s + (Number(l.charged_credits) || 0), 0);

//   // Monthly stats
//   const thisMonth = new Date().toISOString().slice(0, 7);
//   const monthLogs = allLogs.filter((l) => l.created_at && l.created_at.slice(0, 7) === thisMonth);
//   const monthProviderCost = monthLogs.reduce((s, l) => s + (Number(l.actual_provider_cost) || 0), 0);
//   const monthCredits = monthLogs.reduce((s, l) => s + (Number(l.charged_credits) || 0), 0);

//   // Most used models
//   const modelCounts = {};
//   for (const l of allLogs) {
//     const key = `${l.provider}/${l.model}`;
//     modelCounts[key] = (modelCounts[key] || 0) + 1;
//   }
//   const mostUsedModels = Object.entries(modelCounts)
//     .sort(([, a], [, b]) => b - a)
//     .slice(0, 5)
//     .map(([model, count]) => ({ model, count }));

//   // Average cost per request
//   const avgCostPerRequest = allLogs.length
//     ? stats.totalProviderCost / allLogs.length
//     : 0;

//   return successResponse(res, {
//     message: 'Analytics loaded',
//     data: {
//       lifetime: stats,
//       today: { providerCost: todayProviderCost, creditsConsumed: todayCredits },
//       thisMonth: { providerCost: monthProviderCost, creditsConsumed: monthCredits },
//       mostUsedModels,
//       totalRequests: allLogs.length,
//       avgCostPerRequest,
//     },
//   });
// };

// const getBillingModelCatalogAdmin = (_req, res) => {
//   return successResponse(res, {
//     message: 'Model catalog loaded',
//     data: {
//       providers: getProviders(),
//       groups: getAllModelsGrouped(),
//     },
//   });
// };

// const verifyModelCatalogAdmin = async (req, res) => {
//   const provider = String(req.body?.provider || '').trim().toLowerCase();
//   const model = String(req.body?.model || '').trim();
//   if (!provider || !model) {
//     return res.status(400).json({
//       success: false,
//       message: 'provider and model are required',
//     });
//   }

//   const result = await verifyModelExists(provider, model);
//   if (!result.valid) {
//     return res.status(422).json({
//       success: false,
//       message: result.message,
//       data: result,
//     });
//   }

//   return successResponse(res, {
//     message: result.message,
//     data: result,
//   });
// };

// const addModelCatalogAdmin = async (req, res) => {
//   const provider = String(req.body?.provider || '').trim().toLowerCase();
//   const model = String(req.body?.model || '').trim();
//   const name = String(req.body?.name || '').trim();

//   if (!provider || !model) {
//     return res.status(400).json({
//       success: false,
//       message: 'provider and model are required',
//     });
//   }

//   if (isValidModelForProvider(provider, model)) {
//     return res.status(409).json({
//       success: false,
//       message: `Model "${model}" is already in the catalog`,
//     });
//   }

//   const verification = await verifyModelExists(provider, model);
//   if (!verification.valid) {
//     return res.status(422).json({
//       success: false,
//       message: verification.message,
//       data: verification,
//     });
//   }

//   const entry = addCustomModel(provider, {
//     id: model,
//     name: name || verification.upstreamName || model,
//   });

//   return successResponse(res, {
//     status: 201,
//     message: 'Model added to catalog',
//     data: {
//       entry,
//       catalog: {
//         providers: getProviders(),
//         groups: getAllModelsGrouped(),
//       },
//     },
//   });
// };

// const removeModelCatalogAdmin = (req, res) => {
//   const provider = String(req.query?.provider || req.body?.provider || '').trim().toLowerCase();
//   const model = String(req.query?.model || req.body?.model || '').trim();

//   if (!provider || !model) {
//     return res.status(400).json({
//       success: false,
//       message: 'provider and model are required',
//     });
//   }

//   removeCustomModel(provider, model);
//   return successResponse(res, {
//     message: 'Model removed from catalog',
//     data: {
//       provider,
//       model,
//       catalog: {
//         providers: getProviders(),
//         groups: getAllModelsGrouped(),
//       },
//     },
//   });
// };

// // ─── NEW: Manual Wallet Adjustment ────────────────────────────────────────
// const adjustWalletAdmin = (req, res) => {
//   const { amount, description, type } = req.body || {};
//   const numAmount = Number(amount);
//   if (!amount || isNaN(numAmount)) {
//     res.status(400);
//     throw new Error('amount must be a valid number (positive to add, negative to deduct)');
//   }
//   const txType = type || (numAmount > 0 ? 'admin_adjustment' : 'admin_adjustment');
//   const result = adjustWalletBalance(
//     req.params.userId,
//     numAmount,
//     txType,
//     description || `Admin wallet adjustment of ${numAmount}`,
//     `admin_adj_${Date.now()}`
//   );
//   return successResponse(res, {
//     message: 'Wallet adjusted',
//     data: {
//       wallet: result.wallet,
//       transaction: result.transaction,
//       billing: billingService.getBillingSummary(req.params.userId),
//     },
//   });
// };

// module.exports = {
//   // Gateway
//   getGatewayConfig,
//   updateGatewayConfig,
//   // Credit packs
//   getCreditPacksAdmin,
//   createCreditPackAdmin,
//   updateCreditPackAdmin,
//   // Users
//   listUsersAdmin,
//   getUserBillingAdmin,
//   grantCreditsAdmin,
//   revokeCreditsAdmin,
//   extendGatewayAdmin,
//   revokeGatewayAdmin,
//   setUserBillingTypeAdmin,
//   // Transactions
//   listTransactionsAdmin,
//   // Billing Settings
//   getBillingSettingsAdmin,
//   updateBillingSettingsAdmin,
//   getBillingModelCatalogAdmin,
//   verifyModelCatalogAdmin,
//   addModelCatalogAdmin,
//   removeModelCatalogAdmin,
//   // Model Pricing
//   listModelPricingAdmin,
//   createModelPricingAdmin,
//   updateModelPricingAdmin,
//   // Usage Logs & Analytics
//   getUsageLogsAdmin,
//   getBillingAnalyticsAdmin,
//   // Wallet Adjustment
//   runConsistencyCheck,
//   adjustWalletAdmin,
// };


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
const Supabase = require('../services/supabaseService');
const { successResponse } = require('../utils/response');

// New repository imports
const { getBillingSettings, updateBillingSettings } = require('../repositories/billingSettingsRepository');
const {
  listModelPricing,
  createModelPricing,
  updateModelPricing,
} = require('../repositories/pricingRepository');
const { listUsageLogs, getPlatformStats } = require('../repositories/usageLogRepository');
const { getOrCreateWallet, readWalletList, adjustWalletBalance } = require('../repositories/walletRepository');
const {
  getProviders,
  getAllModelsGrouped,
  isValidModelForProvider,
  addCustomModel,
  removeCustomModel,
} = require('../services/ai/modelCatalog');
const { verifyModelExists } = require('../services/ai/modelExistenceVerifier');
const { auditAttachmentReferences } = require('../services/dataConsistencyService');

// ─── Helper: Require Admin ─────────────────────────────────────────────────

/**
 * Throws 403 if user is not admin. Call at top of every admin handler.
 */
function assertAdmin(req) {
  const userRole = String(req.user?.role || '').toLowerCase();
  if (userRole !== 'admin') {
    const err = new Error('Admin access required');
    err.statusCode = 403;
    throw err;
  }
}

// ─── Consistency Check ─────────────────────────────────────────────────────

const runConsistencyCheck = async (req, res) => {
  assertAdmin(req);
  const { getCurrentUserId } = require('../middleware/requestContext');
  const userId = getCurrentUserId(req);
  const result = await auditAttachmentReferences(userId);
  return successResponse(res, { message: 'Consistency check completed', data: result });
};

// ─── Gateway ─────────────────────────────────────────────────────────────────

const getGatewayConfig = async (_req, res) => {
  const settings = await getGatewaySettings();
  return successResponse(res, { message: 'Gateway settings loaded', data: settings });
};

const updateGatewayConfig = async (req, res) => {
  assertAdmin(req);
  const { price, currency, durationMonths, active } = req.body || {};
  const data = await updateGatewaySettings({
    ...(price !== undefined ? { price: Number(price) } : {}),
    ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {}),
    ...(durationMonths !== undefined ? { durationMonths: Number(durationMonths) } : {}),
    ...(active !== undefined ? { active: active === true || active === 'true' } : {}),
  });
  return successResponse(res, { message: 'Gateway settings updated', data });
};

// ─── Credit Packs ──────────────────────────────────────────────────────────

const getCreditPacksAdmin = async (_req, res) =>
  successResponse(res, { message: 'Credit packs loaded', data: await listCreditPacks({ includeInactive: true }) });

const createCreditPackAdmin = async (req, res) => {
  assertAdmin(req);
  const pack = await createCreditPack(req.body || {});
  return successResponse(res, { status: 201, message: 'Credit pack created', data: pack });
};

const updateCreditPackAdmin = async (req, res) => {
  assertAdmin(req);
  const pack = await updateCreditPack(req.params.packId, req.body || {});
  return successResponse(res, { message: 'Credit pack updated', data: pack });
};

// ─── Users ─────────────────────────────────────────────────────────────────

const listUsersAdmin = async (_req, res) => {
  const { data: allUsers, error } = await Supabase.selectAll('users');
  if (error) throw error;
  if (!Array.isArray(allUsers)) {
    return successResponse(res, { message: 'Users loaded', data: [] });
  }

  const wallets = await readWalletList();
  const walletMap = {};
  for (const w of wallets) {
    if (w?.user_id) walletMap[w.user_id] = w;
  }

  const users = allUsers.map((u) => {
    const wallet = walletMap[u.id] || {};
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      disabled: u.disabled === true,
      billingType: u.billingType || 'token',
      credits: Number(wallet.balance ?? u.credits) || 0,
      totalPurchased: Number(wallet.total_purchased) || 0,
      totalConsumed: Number(wallet.total_consumed) || 0,
      gatewayAccess: u.gatewayAccess || null,
      createdAt: u.createdAt,
    };
  });
  return successResponse(res, { message: 'Users loaded', data: users });
};

const getUserBillingAdmin = async (req, res) => {
  assertAdmin(req);
  const summary = await billingService.getBillingSummary(req.params.userId);
  if (!summary) {
    res.status(404);
    throw new Error('User not found');
  }
  return successResponse(res, { message: 'User billing loaded', data: summary });
};

const grantCreditsAdmin = async (req, res) => {
  assertAdmin(req);
  const { amount, description } = req.body || {};
  if (!amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error('amount must be a positive number');
  }
  await adjustWalletBalance(
    req.params.userId,
    Number(amount),
    'bonus',
    description || `Admin credit grant of ${amount}`,
    `admin_grant_${Date.now()}`
  );
  await grantCredits(req.params.userId, Number(amount));

  return successResponse(res, {
    message: 'Credits granted',
    data: await billingService.getBillingSummary(req.params.userId),
  });
};

const revokeCreditsAdmin = async (req, res) => {
  assertAdmin(req);
  await revokeAllCredits(req.params.userId);
  return successResponse(res, {
    message: 'Credits revoked',
    data: await billingService.getBillingSummary(req.params.userId),
  });
};

const extendGatewayAdmin = async (req, res) => {
  assertAdmin(req);
  const months = Number(req.body?.months) || 12;
  await extendGatewayAccess(req.params.userId, months);
  return successResponse(res, {
    message: 'Gateway access extended',
    data: await billingService.getBillingSummary(req.params.userId),
  });
};

const revokeGatewayAdmin = async (req, res) => {
  assertAdmin(req);
  await deactivateGatewayAccess(req.params.userId);
  return successResponse(res, {
    message: 'Gateway access revoked',
    data: await billingService.getBillingSummary(req.params.userId),
  });
};

const setUserBillingTypeAdmin = async (req, res) => {
  assertAdmin(req);
  const { billingType } = req.body || {};
  await setBillingType(req.params.userId, billingType);
  return successResponse(res, {
    message: 'Billing type updated',
    data: await billingService.getBillingSummary(req.params.userId),
  });
};

// ─── Transactions ──────────────────────────────────────────────────────────

const listTransactionsAdmin = async (req, res) => {
  assertAdmin(req);
  const { type, status } = req.query || {};
  const rows = (await listTransactions({ type, status })) || [];
  return successResponse(res, { message: 'Transactions loaded', data: rows });
};

// ─── Billing Settings ──────────────────────────────────────────────────────

const getBillingSettingsAdmin = async (_req, res) => {
  const settings = await getBillingSettings();
  return successResponse(res, { message: 'Billing settings loaded', data: settings });
};

const updateBillingSettingsAdmin = async (req, res) => {
  assertAdmin(req);
  const updates = { ...req.body };
  const numericFields = [
    'credit_value_usd',
    'minimum_credit_charge',
    'global_ai_markup_multiplier',
    'minimum_ai_charge_credits',
    'minimum_feature_charge_credits',
    'percentage_bonus_on_purchase',
  ];
  for (const f of numericFields) {
    if (updates[f] !== undefined) {
      const n = Number(updates[f]);
      if (isNaN(n) || n < 0) {
        const err = new Error(`${f} must be a non‑negative number`);
        err.statusCode = 400;
        throw err;
      }
      updates[f] = n;
    }
  }
  if (updates.providerModelMarkup && typeof updates.providerModelMarkup !== 'object') {
    const err = new Error('providerModelMarkup must be an object');
    err.statusCode = 400;
    throw err;
  }
  if (updates.featureCosts && typeof updates.featureCosts !== 'object') {
    const err = new Error('featureCosts must be an object');
    err.statusCode = 400;
    throw err;
  }
  if (updates.providerModelMarkup) {
    for (const [provider, models] of Object.entries(updates.providerModelMarkup)) {
      if (!models || typeof models !== 'object') continue;
      for (const model of Object.keys(models)) {
        if (!await isValidModelForProvider(provider, model)) {
          const err = new Error(`Unknown provider/model pair: ${provider}/${model}`);
          err.statusCode = 400;
          throw err;
        }
      }
    }
  }

  const next = await updateBillingSettings(updates);
  return successResponse(res, { message: 'Billing settings updated', data: next });
};

// ─── Model Pricing ─────────────────────────────────────────────────────────

const listModelPricingAdmin = async (_req, res) => {
  return successResponse(res, { message: 'Model pricing loaded', data: await listModelPricing() });
};

const createModelPricingAdmin = async (req, res) => {
  assertAdmin(req);
  const record = await createModelPricing(req.body || {});
  return successResponse(res, { status: 201, message: 'Model pricing created', data: record });
};

const updateModelPricingAdmin = async (req, res) => {
  assertAdmin(req);
  const record = await updateModelPricing(req.params.pricingId, req.body || {});
  return successResponse(res, { message: 'Model pricing updated', data: record });
};

// ─── Usage Logs & Analytics ────────────────────────────────────────────────

const getUsageLogsAdmin = async (req, res) => {
  assertAdmin(req);
  const { userId, limit } = req.query || {};
  let logs = await listUsageLogs();
  const logsArr = Array.isArray(logs) ? logs : [];
  if (userId) logs = logsArr.filter((l) => l.user_id === userId);
  else logs = logsArr;
  logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (limit) logs = logs.slice(0, Number(limit) || 50);
  return successResponse(res, { message: 'Usage logs loaded', data: logs });
};

const getBillingAnalyticsAdmin = async (_req, res) => {
  const stats = (await getPlatformStats()) || { totalProviderCost: 0, totalCreditsConsumed: 0, revenueGenerated: 0, estimatedProfit: 0 };
  const allLogs = (await listUsageLogs()) || [];
  const logsArr = Array.isArray(allLogs) ? allLogs : [];

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logsArr.filter((l) => l.created_at && l.created_at.slice(0, 10) === today);
  const todayProviderCost = todayLogs.reduce((s, l) => s + (Number(l.actual_provider_cost) || 0), 0);
  const todayCredits = todayLogs.reduce((s, l) => s + (Number(l.charged_credits) || 0), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthLogs = logsArr.filter((l) => l.created_at && l.created_at.slice(0, 7) === thisMonth);
  const monthProviderCost = monthLogs.reduce((s, l) => s + (Number(l.actual_provider_cost) || 0), 0);
  const monthCredits = monthLogs.reduce((s, l) => s + (Number(l.charged_credits) || 0), 0);

  const modelCounts = {};
  for (const l of logsArr) {
    const key = `${l.provider}/${l.model}`;
    modelCounts[key] = (modelCounts[key] || 0) + 1;
  }
  const mostUsedModels = Object.entries(modelCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([model, count]) => ({ model, count }));

  const avgCostPerRequest = logsArr.length
    ? (stats?.totalProviderCost || 0) / logsArr.length
    : 0;

  return successResponse(res, {
    message: 'Analytics loaded',
    data: {
      lifetime: stats,
      today: { providerCost: todayProviderCost, creditsConsumed: todayCredits },
      thisMonth: { providerCost: monthProviderCost, creditsConsumed: monthCredits },
      mostUsedModels,
      totalRequests: logsArr.length,
      avgCostPerRequest,
    },
  });
};

// ─── Model Catalog ─────────────────────────────────────────────────────────

const getBillingModelCatalogAdmin = async (_req, res) => {
  return successResponse(res, {
    message: 'Model catalog loaded',
    data: {
      providers: getProviders(),
      groups: (await getAllModelsGrouped()) || [],
    },
  });
};

const verifyModelCatalogAdmin = async (req, res) => {
  assertAdmin(req);
  const provider = String(req.body?.provider || '').trim().toLowerCase();
  const model = String(req.body?.model || '').trim();
  if (!provider || !model) {
    return res.status(400).json({
      success: false,
      message: 'provider and model are required',
    });
  }

  const result = await verifyModelExists(provider, model);
  if (!result.valid) {
    return res.status(422).json({
      success: false,
      message: result.message,
      data: result,
    });
  }

  return successResponse(res, {
    message: result.message,
    data: result,
  });
};

const addModelCatalogAdmin = async (req, res) => {
  assertAdmin(req);
  const provider = String(req.body?.provider || '').trim().toLowerCase();
  const model = String(req.body?.model || '').trim();
  const name = String(req.body?.name || '').trim();

  if (!provider || !model) {
    return res.status(400).json({
      success: false,
      message: 'provider and model are required',
    });
  }

  if (await isValidModelForProvider(provider, model)) {
    return res.status(409).json({
      success: false,
      message: `Model "${model}" is already in the catalog`,
    });
  }

  const verification = await verifyModelExists(provider, model);
  if (!verification.valid) {
    return res.status(422).json({
      success: false,
      message: verification.message,
      data: verification,
    });
  }

  const entry = await addCustomModel(provider, {
    id: model,
    name: name || verification.upstreamName || model,
  });

  return successResponse(res, {
    status: 201,
    message: 'Model added to catalog',
    data: {
      entry,
      catalog: {
        providers: getProviders(),
        groups: (await getAllModelsGrouped()) || [],
      },
    },
  });
};

const removeModelCatalogAdmin = async (req, res) => {
  assertAdmin(req);
  const provider = String(req.query?.provider || req.body?.provider || '').trim().toLowerCase();
  const model = String(req.query?.model || req.body?.model || '').trim();

  if (!provider || !model) {
    return res.status(400).json({
      success: false,
      message: 'provider and model are required',
    });
  }

  await removeCustomModel(provider, model);
  return successResponse(res, {
    message: 'Model removed from catalog',
    data: {
      provider,
      model,
      catalog: {
        providers: getProviders(),
        groups: (await getAllModelsGrouped()) || [],
      },
    },
  });
};

// ─── Wallet Adjustment ─────────────────────────────────────────────────────

const adjustWalletAdmin = async (req, res) => {
  assertAdmin(req);
  const { amount, description, type } = req.body || {};
  const numAmount = Number(amount);
  if (!amount || isNaN(numAmount)) {
    res.status(400);
    throw new Error('amount must be a valid number (positive to add, negative to deduct)');
  }
  const txType = type || 'admin_adjustment';
  const result = await adjustWalletBalance(
    req.params.userId,
    numAmount,
    txType,
    description || `Admin wallet adjustment of ${numAmount}`,
    `admin_adj_${Date.now()}`
  );
  return successResponse(res, {
    message: 'Wallet adjusted',
    data: {
      wallet: result.wallet,
      transaction: result.transaction,
      billing: await billingService.getBillingSummary(req.params.userId),
    },
  });
};

const previewDataRepo = require('../repositories/previewDataRepository');

const getPreviewDataAdmin = async (req, res) => {
  assertAdmin(req);
  const data = await previewDataRepo.getPreviewData();
  return successResponse(res, { message: 'Default preview data loaded', data });
};

const updatePreviewDataAdmin = async (req, res) => {
  assertAdmin(req);
  const nextData = req.body;
  if (!nextData || typeof nextData !== 'object') {
    res.status(400);
    throw new Error('Preview data must be a valid JSON object');
  }
  const data = await previewDataRepo.savePreviewData(nextData);
  return successResponse(res, { message: 'Default preview data updated', data });
};

module.exports = {
  // Consistency
  runConsistencyCheck,
  // Gateway
  getGatewayConfig,
  // Preview Data
  getPreviewDataAdmin,
  updatePreviewDataAdmin,
  updateGatewayConfig,
  // Credit packs
  getCreditPacksAdmin,
  createCreditPackAdmin,
  updateCreditPackAdmin,
  // Users
  listUsersAdmin,
  getUserBillingAdmin,
  grantCreditsAdmin,
  revokeCreditsAdmin,
  extendGatewayAdmin,
  revokeGatewayAdmin,
  setUserBillingTypeAdmin,
  // Transactions
  listTransactionsAdmin,
  // Billing Settings
  getBillingSettingsAdmin,
  updateBillingSettingsAdmin,
  getBillingModelCatalogAdmin,
  verifyModelCatalogAdmin,
  addModelCatalogAdmin,
  removeModelCatalogAdmin,
  // Model Pricing
  listModelPricingAdmin,
  createModelPricingAdmin,
  updateModelPricingAdmin,
  // Usage Logs & Analytics
  getUsageLogsAdmin,
  getBillingAnalyticsAdmin,
  // Wallet Adjustment
  adjustWalletAdmin,
};