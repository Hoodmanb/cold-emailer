const { v4: uuidv4 } = require('uuid');
const { safeRead, atomicWrite, withLock } = require('../db/jsonDb');

const CREDIT_PACKS_FILE = 'creditPacks.json';
const GATEWAY_SETTINGS_FILE = 'gatewaySettings.json';
const TRANSACTIONS_FILE = 'transactions.json';

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

function readGlobalArray(filename, fallback = []) {
  const data = safeRead(filename, fallback);
  return Array.isArray(data) ? data : fallback;
}

function writeGlobalArray(filename, rows) {
  atomicWrite(filename, Array.isArray(rows) ? rows : []);
}

function seedBillingCollections() {
  withLock(GATEWAY_SETTINGS_FILE, () => {
    const current = safeRead(GATEWAY_SETTINGS_FILE, null);
    if (!current || typeof current !== 'object' || !current.id) {
      atomicWrite(GATEWAY_SETTINGS_FILE, DEFAULT_GATEWAY_SETTINGS);
    }
  });

  withLock(CREDIT_PACKS_FILE, () => {
    const packs = readGlobalArray(CREDIT_PACKS_FILE, []);
    if (!packs.length) {
      atomicWrite(CREDIT_PACKS_FILE, DEFAULT_CREDIT_PACKS);
    }
  });

  withLock(TRANSACTIONS_FILE, () => {
    const tx = readGlobalArray(TRANSACTIONS_FILE, []);
    if (!Array.isArray(tx)) {
      atomicWrite(TRANSACTIONS_FILE, []);
    }
  });
}

function getGatewaySettings() {
  const settings = safeRead(GATEWAY_SETTINGS_FILE, DEFAULT_GATEWAY_SETTINGS);
  return { ...DEFAULT_GATEWAY_SETTINGS, ...(settings || {}) };
}

function updateGatewaySettings(updates = {}) {
  return withLock(GATEWAY_SETTINGS_FILE, () => {
    const current = getGatewaySettings();
    const next = {
      ...current,
      ...updates,
      id: 'gateway-config',
      updatedAt: new Date().toISOString(),
    };
    atomicWrite(GATEWAY_SETTINGS_FILE, next);
    return next;
  });
}

function listCreditPacks({ includeInactive = false } = {}) {
  const packs = readGlobalArray(CREDIT_PACKS_FILE, DEFAULT_CREDIT_PACKS);
  return includeInactive ? packs : packs.filter((p) => p.active !== false);
}

function findCreditPackById(packId) {
  return listCreditPacks({ includeInactive: true }).find((p) => String(p.id) === String(packId)) || null;
}

function createCreditPack(data) {
  const pack = {
    id: uuidv4(),
    name: String(data.name || 'Credit Pack').trim(),
    amount: Number(data.amount) || 0,
    price: Number(data.price) || 0,
    currency: String(data.currency || 'NGN').trim().toUpperCase(),
    active: data.active !== false,
    createdAt: new Date().toISOString(),
  };
  return withLock(CREDIT_PACKS_FILE, () => {
    const packs = readGlobalArray(CREDIT_PACKS_FILE, []);
    packs.push(pack);
    atomicWrite(CREDIT_PACKS_FILE, packs);
    return pack;
  });
}

function updateCreditPack(packId, updates = {}) {
  return withLock(CREDIT_PACKS_FILE, () => {
    const packs = readGlobalArray(CREDIT_PACKS_FILE, []);
    const idx = packs.findIndex((p) => String(p.id) === String(packId));
    if (idx < 0) throw new Error('Credit pack not found');
    packs[idx] = {
      ...packs[idx],
      ...updates,
      id: packs[idx].id,
      updatedAt: new Date().toISOString(),
    };
    atomicWrite(CREDIT_PACKS_FILE, packs);
    return packs[idx];
  });
}

function listTransactions(filters = {}) {
  let rows = readGlobalArray(TRANSACTIONS_FILE, []);
  if (filters.userId) {
    rows = rows.filter((t) => String(t.userId) === String(filters.userId));
  }
  if (filters.type) {
    rows = rows.filter((t) => t.type === filters.type);
  }
  if (filters.status) {
    rows = rows.filter((t) => t.status === filters.status);
  }
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function findTransactionByReference(reference) {
  return readGlobalArray(TRANSACTIONS_FILE, []).find(
    (t) => String(t.reference) === String(reference) || String(t.paystackReference) === String(reference)
  ) || null;
}

function createTransaction(record) {
  const tx = {
    id: uuidv4(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...record,
  };
  return withLock(TRANSACTIONS_FILE, () => {
    const rows = readGlobalArray(TRANSACTIONS_FILE, []);
    rows.push(tx);
    atomicWrite(TRANSACTIONS_FILE, rows);
    return tx;
  });
}

function updateTransaction(idOrReference, updates = {}) {
  return withLock(TRANSACTIONS_FILE, () => {
    const rows = readGlobalArray(TRANSACTIONS_FILE, []);
    const idx = rows.findIndex(
      (t) => String(t.id) === String(idOrReference) || String(t.reference) === String(idOrReference)
    );
    if (idx < 0) throw new Error('Transaction not found');
    rows[idx] = { ...rows[idx], ...updates, updatedAt: new Date().toISOString() };
    atomicWrite(TRANSACTIONS_FILE, rows);
    return rows[idx];
  });
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
