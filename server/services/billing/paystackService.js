const crypto = require('crypto');
const axios = require('axios');

const PAYSTACK_BASE = 'https://api.paystack.co';

function getSecretKey() {
  return String(process.env.PAYSTACK_SECRET_KEY || '').trim();
}

function getPublicKey() {
  return String(process.env.PAYSTACK_PUBLIC_KEY || '').trim();
}

function assertPaystackConfigured() {
  const key = getSecretKey();
  if (!key) {
    const err = new Error('Paystack is not configured');
    err.statusCode = 503;
    err.errorCode = 'PAYSTACK_NOT_CONFIGURED';
    throw err;
  }
  return key;
}

async function initializeTransaction({ email, amount, currency = 'NGN', metadata = {}, callbackUrl }) {
  const secret = assertPaystackConfigured();
  const payload = {
    email,
    amount: Math.round(Number(amount)),
    currency: String(currency || 'NGN').toUpperCase(),
    metadata,
  };
  if (callbackUrl) payload.callback_url = callbackUrl;

  const { data } = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, payload, {
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
  });

  if (!data?.status) {
    throw new Error(data?.message || 'Failed to initialize Paystack transaction');
  }
  return data.data;
}

async function verifyTransaction(reference) {
  const secret = assertPaystackConfigured();
  const { data } = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!data?.status) {
    throw new Error(data?.message || 'Failed to verify Paystack transaction');
  }
  return data.data;
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = getSecretKey();
  if (!secret || !signatureHeader) return false;
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signatureHeader;
}

module.exports = {
  getSecretKey,
  getPublicKey,
  assertPaystackConfigured,
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
};
