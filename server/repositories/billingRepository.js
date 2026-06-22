const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

// Constants for default data
const DEFAULT_GATEWAY_SETTINGS = {
  id: 'gateway-config',
  price: 9900,
  currency: 'NGN',
  durationMonths: 12,
  active: true,
  updatedAt: new Date().toISOString(),
};

const DEFAULT_CREDIT_PACKS = [
  {
    id: uuidv4(),
    name: 'Starter Pack',
    amount: 100,
    price: 1500,
    currency: 'NGN',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Pro Pack',
    amount: 500,
    price: 6500,
    currency: 'NGN',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Power Pack',
    amount: 1000,
    price: 12000,
    currency: 'NGN',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Ensure essential billing collections exist in Supabase.
 * This creates default gateway settings and credit packs if they are missing.
 */
async function seedBillingCollections() {
  // Gateway settings
  const { data: existingSettings, error: errSettings } = await Supabase.select('gateway_settings');
  if (errSettings) throw errSettings;
  if (!existingSettings || existingSettings.length === 0) {
    await Supabase.insert('gateway_settings', DEFAULT_GATEWAY_SETTINGS);
  }

  // Credit packs
  const { data: existingPacks, error: errPacks } = await Supabase.select('credit_packs');
  if (errPacks) throw errPacks;
  if (!existingPacks || existingPacks.length === 0) {
    for (const pack of DEFAULT_CREDIT_PACKS) {
      await Supabase.insert('credit_packs', pack);
    }
  }
  // Transactions table is assumed to exist via migration; no seeding required.
}

/** Retrieve gateway configuration */
async function getGatewaySettings() {
  const { data, error } = await Supabase.select('gateway_settings');
  if (error) throw error;
  const settings = data && data[0] ? data[0] : DEFAULT_GATEWAY_SETTINGS;
  return { ...DEFAULT_GATEWAY_SETTINGS, ...(settings || {}) };
}

/** Update gateway configuration (upsert) */
async function updateGatewaySettings(updates = {}) {
  const current = await getGatewaySettings();
  const next = { ...current, ...updates, id: 'gateway-config', updatedAt: new Date().toISOString() };
  // Replace the existing row
  await Supabase.delete('gateway_settings', {});
  await Supabase.insert('gateway_settings', next);
  return next;
}

/** List credit packs, optionally including inactive ones */
async function listCreditPacks({ includeInactive = false } = {}) {
  const { data, error } = await Supabase.select('credit_packs');
  if (error) throw error;
  const packs = data || [];
  return includeInactive ? packs : packs.filter(p => p.active !== false);
}

/** Find a credit pack by its ID */
async function findCreditPackById(packId) {
  const packs = await listCreditPacks({ includeInactive: true });
  return packs.find(p => String(p.id) === String(packId)) || null;
}

/** Create a new credit pack */
async function createCreditPack(data) {
  const pack = {
    id: uuidv4(),
    name: String(data.name || 'Credit Pack').trim(),
    amount: Number(data.amount) || 0,
    price: Number(data.price) || 0,
    currency: String(data.currency || 'NGN').trim().toUpperCase(),
    active: data.active !== false,
    createdAt: new Date().toISOString(),
  };
  await Supabase.insert('credit_packs', pack);
  return pack;
}

/** Update an existing credit pack */
async function updateCreditPack(packId, updates = {}) {
  const existing = await findCreditPackById(packId);
  if (!existing) throw new Error('Credit pack not found');
  const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date().toISOString() };
  await Supabase.update('credit_packs', { id: packId }, updated);
  return updated;
}

const TX_META_PREFIX = '__TX_META__:';

function decodeTransactionMeta(description) {
  const raw = String(description || '');
  if (!raw.startsWith(TX_META_PREFIX)) return { description: raw || null };
  try {
    const meta = JSON.parse(raw.slice(TX_META_PREFIX.length));
    return { ...meta, description: null };
  } catch (_err) {
    return { description: raw };
  }
}

function fromTransactionRow(row) {
  if (!row) return null;
  const hasColumnMeta = row.packId != null
    || row.currency != null
    || row.credits != null
    || row.paystackData != null
    || row.completedAt != null;
  const legacyMeta = hasColumnMeta ? {} : decodeTransactionMeta(row.description);
  return {
    ...row,
    ...legacyMeta,
    packId: row.packId ?? legacyMeta.packId ?? null,
    currency: row.currency ?? legacyMeta.currency ?? null,
    credits: row.credits ?? legacyMeta.credits ?? null,
    paystackData: row.paystackData ?? legacyMeta.paystackData ?? null,
    completedAt: row.completedAt ?? legacyMeta.completedAt ?? null,
    description: hasColumnMeta ? row.description : legacyMeta.description,
    userId: row.user_id,
  };
}

function buildTransactionPayload(fields) {
  const {
    userId,
    user_id,
    packId,
    currency,
    credits,
    paystackData,
    completedAt,
    description,
    ...rest
  } = fields;
  return {
    ...rest,
    user_id: user_id || userId || null,
    packId: packId ?? null,
    currency: currency ?? null,
    credits: credits ?? null,
    paystackData: paystackData ?? null,
    completedAt: completedAt ?? null,
    description: description ?? null,
  };
}

/** List transactions with optional filters */
async function listTransactions(filters = {}) {
  const { data, error } = await Supabase.select('transactions');
  if (error) throw error;
  let rows = (data || []).map(fromTransactionRow);
  if (filters.userId) {
    rows = rows.filter((t) => String(t.user_id || t.userId) === String(filters.userId));
  }
  if (filters.type) {
    rows = rows.filter(t => t.type === filters.type);
  }
  if (filters.status) {
    rows = rows.filter(t => t.status === filters.status);
  }
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Find a transaction by its reference or paystackReference */
async function findTransactionByReference(reference) {
  // Supabase does not support complex OR filters directly in our wrapper, so fetch all and filter.
  const { data, error } = await Supabase.select('transactions');
  if (error) throw error;
  const found = (data || []).map(fromTransactionRow).find(
    (t) => String(t.reference) === String(reference) || String(t.paystackReference) === String(reference),
  );
  return found || null;
}

/** Create a new transaction record */
async function createTransaction(record) {
  const tx = buildTransactionPayload({
    id: uuidv4(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record,
  });
  await Supabase.insert('transactions', tx);
  return fromTransactionRow(tx);
}

/** Update an existing transaction by ID or reference */
async function updateTransaction(idOrReference, updates = {}) {
  const { data, error } = await Supabase.select('transactions');
  if (error) throw error;
  const idx = (data || []).findIndex(
    t => String(t.id) === String(idOrReference) || String(t.reference) === String(idOrReference)
  );
  if (idx < 0) throw new Error('Transaction not found');
  const existing = fromTransactionRow(data[idx]);
  const updated = buildTransactionPayload({
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  await Supabase.update('transactions', { id: existing.id }, {
    user_id: updated.user_id,
    type: updated.type,
    amount: updated.amount,
    status: updated.status,
    reference: updated.reference,
    paystackReference: updated.paystackReference,
    authorizationUrl: updated.authorizationUrl,
    description: updated.description,
    packId: updated.packId,
    currency: updated.currency,
    credits: updated.credits,
    paystackData: updated.paystackData,
    completedAt: updated.completedAt,
    updatedAt: updated.updatedAt,
  });
  return fromTransactionRow(updated);
}

module.exports = {
  seedBillingCollections,
  getGatewaySettings,
  updateGatewaySettings,
  listCreditPacks,
  findCreditPackById,
  createCreditPack,
  updateCreditPack,
  listTransactions,
  findTransactionByReference,
  createTransaction,
  updateTransaction,
};
