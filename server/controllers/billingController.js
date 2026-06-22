const billingService = require('../services/billing/billingService');
const paystackService = require('../services/billing/paystackService');
const {
  listCreditPacks,
  getGatewaySettings,
  createTransaction,
  findTransactionByReference,
  updateTransaction,
} = require('../repositories/billingRepository');
const { findUserById } = require('../repositories/userRepository');
const { successResponse } = require('../utils/response');
const { addCredits, activateGatewayFromPayment } = require('../services/billing/billingService');

const getPublicConfig = async (_req, res) => {
  const gateway = await getGatewaySettings();
  const packs = await listCreditPacks();
  const { getBillingSettings } = require('../repositories/billingSettingsRepository');
  const settings = await getBillingSettings();
  return successResponse(res, {
    message: 'Billing config loaded',
    data: {
      gateway: {
        price: gateway.price,
        currency: gateway.currency,
        durationMonths: gateway.durationMonths,
        active: gateway.active !== false,
      },
      creditPacks: packs.map(({ id, name, amount, price, currency }) => ({
        id,
        name,
        amount,
        price,
        currency,
      })),
      featureCosts: billingService.listFeatureCosts(settings),
      paystackPublicKey: paystackService.getPublicKey(),
    },
  });
};

const getBillingStatus = async (req, res) => {
  const summary = await billingService.getBillingSummary(req.user.id);
  return successResponse(res, {
    message: 'Billing status loaded',
    data: summary,
  });
};

const estimateCost = async (req, res) => {
  const { featureId, tailoringLevel } = req.body || {};
  const cost = await billingService.estimateFeatureCost(featureId, { tailoringLevel });
  const balance = await billingService.getCreditBalance(req.user.id);
  return successResponse(res, {
    message: 'Cost estimate calculated',
    data: {
      featureId,
      estimatedCost: cost,
      currentBalance: balance,
      remainingAfter: Math.max(0, balance - cost),
    },
  });
};

const initializeGatewayPayment = async (req, res) => {
  const user = await findUserById(req.user.id);
  const gateway = await getGatewaySettings();
  if (gateway.active === false) {
    res.status(400);
    throw new Error('Gateway plan is currently unavailable');
  }

  const reference = `gw_${req.user.id}_${Date.now()}`;
  const tx = await createTransaction({
    userId: req.user.id,
    type: 'gateway',
    amount: gateway.price,
    currency: gateway.currency,
    reference,
    status: 'pending',
  });

  const init = await paystackService.initializeTransaction({
    email: user.email,
    amount: gateway.price,
    currency: gateway.currency,
    metadata: {
      userId: req.user.id,
      transactionId: tx.id,
      type: 'gateway',
    },
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || undefined,
  });

  await updateTransaction(tx.id, { paystackReference: init.reference, authorizationUrl: init.authorization_url });

  return successResponse(res, {
    message: 'Gateway checkout initialized',
    data: {
      authorizationUrl: init.authorization_url,
      reference: init.reference,
      transactionId: tx.id,
    },
  });
};

const initializeCreditPayment = async (req, res) => {
  const { packId } = req.body || {};
  if (!packId) {
    res.status(400);
    throw new Error('packId is required');
  }

  const packs = await listCreditPacks();
  const pack = packs.find((p) => String(p.id) === String(packId));
  if (!pack) {
    res.status(404);
    throw new Error('Credit pack not found');
  }

  const user = await findUserById(req.user.id);
  const reference = `cr_${req.user.id}_${Date.now()}`;
  const tx = await createTransaction({
    userId: req.user.id,
    type: 'credits',
    packId: pack.id,
    credits: pack.amount,
    amount: pack.price,
    currency: pack.currency,
    reference,
    status: 'pending',
  });

  const init = await paystackService.initializeTransaction({
    email: user.email,
    amount: pack.price,
    currency: pack.currency,
    metadata: {
      userId: req.user.id,
      transactionId: tx.id,
      type: 'credits',
      packId: pack.id,
    },
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || undefined,
  });

  await updateTransaction(tx.id, { paystackReference: init.reference, authorizationUrl: init.authorization_url });

  return successResponse(res, {
    message: 'Credit checkout initialized',
    data: {
      authorizationUrl: init.authorization_url,
      reference: init.reference,
      transactionId: tx.id,
      pack,
    },
  });
};

const verifyPayment = async (req, res) => {
  const { reference } = req.body || {};
  if (!reference) {
    res.status(400);
    throw new Error('reference is required');
  }

  const existing = await findTransactionByReference(reference);
  if (existing && existing.status === 'completed') {
    return successResponse(res, {
      message: 'Payment already verified',
      data: { transaction: existing, billing: await billingService.getBillingSummary(existing.userId) },
    });
  }

  const verified = await paystackService.verifyTransaction(reference);
  if (verified.status !== 'success') {
    if (existing) await updateTransaction(existing.id, { status: 'failed', paystackData: verified });
    res.status(400);
    throw new Error('Payment was not successful');
  }

  const tx = existing || await findTransactionByReference(reference);
  if (!tx) {
    res.status(404);
    throw new Error('Transaction record not found');
  }

  if (tx.status === 'completed') {
    return successResponse(res, {
      message: 'Payment already verified',
      data: { transaction: tx, billing: await billingService.getBillingSummary(tx.userId) },
    });
  }

  await updateTransaction(tx.id, {
    status: 'completed',
    paystackReference: verified.reference,
    paystackData: verified,
    completedAt: new Date().toISOString(),
  });

  if (tx.type === 'gateway') {
    const gateway = await getGatewaySettings();
    await activateGatewayFromPayment(tx.userId, gateway.durationMonths || 12);
  } else if (tx.type === 'credits') {
    await addCredits(tx.userId, tx.packId);
  }

  return successResponse(res, {
    message: 'Payment verified successfully',
    data: {
      transaction: await findTransactionByReference(reference),
      billing: await billingService.getBillingSummary(tx.userId),
    },
  });
};

const paystackWebhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body || {});
  if (!paystackService.verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body?.event;
  const data = req.body?.data;
  if (event === 'charge.success' && data?.reference) {
    try {
      const existing = await findTransactionByReference(data.reference);
      if (existing && existing.status !== 'completed') {
        await updateTransaction(existing.id, {
          status: 'completed',
          paystackReference: data.reference,
          paystackData: data,
          completedAt: new Date().toISOString(),
        });
        if (existing.type === 'gateway') {
          const gateway = await getGatewaySettings();
          await activateGatewayFromPayment(existing.userId, gateway.durationMonths || 12);
        } else if (existing.type === 'credits') {
          await addCredits(existing.userId, existing.packId);
        }
      }
    } catch (err) {
      console.error('[paystack webhook]', err.message);
    }
  }

  return res.status(200).json({ received: true });
};

const listUserTransactions = async (req, res) => {
  const { listTransactions } = require('../repositories/billingRepository');
  const rows = await listTransactions({ userId: req.user.id });
  return successResponse(res, {
    message: 'Transactions loaded',
    data: rows,
  });
};

module.exports = {
  getPublicConfig,
  getBillingStatus,
  estimateCost,
  initializeGatewayPayment,
  initializeCreditPayment,
  verifyPayment,
  paystackWebhook,
  listUserTransactions,
};
