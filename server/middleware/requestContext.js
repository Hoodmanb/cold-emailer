const { AsyncLocalStorage } = require("async_hooks");
const debugLog = require("../utils/debugLogger");

const storage = new AsyncLocalStorage();

function runWithRequestContext(req, res, next) {
  storage.run({ userId: null, usageEntries: [] }, () => next());
}

function setCurrentUserId(userId) {
  const store = storage.getStore();
  if (store) {
    store.userId = userId || null;
  }
}

function getCurrentUserId() {
  const store = storage.getStore();
  const uid = store?.userId || null;
  debugLog("getCurrentUserId", { uid, hasStore: !!store });
  return uid;
}

function setBillingExecutionMode(mode) {
  const store = storage.getStore();
  if (store) {
    store.billingExecutionMode = mode || null;
  }
}

function getBillingExecutionMode() {
  const store = storage.getStore();
  return store?.billingExecutionMode || null;
}

function clearBillingExecutionMode() {
  const store = storage.getStore();
  if (store) {
    store.billingExecutionMode = null;
  }
}

function initUsageEntries() {
  const store = storage.getStore();
  if (store) {
    store.usageEntries = [];
  }
}

function addUsageEntry(entry) {
  const store = storage.getStore();
  if (store) {
    if (!store.usageEntries) store.usageEntries = [];
    store.usageEntries.push(entry);
  }
}

function getUsageEntries() {
  const store = storage.getStore();
  return store?.usageEntries || [];
}

function clearUsageEntries() {
  const store = storage.getStore();
  if (store) {
    store.usageEntries = [];
  }
}

module.exports = {
  runWithRequestContext,
  setCurrentUserId,
  getCurrentUserId,
  setBillingExecutionMode,
  getBillingExecutionMode,
  clearBillingExecutionMode,
  initUsageEntries,
  addUsageEntry,
  getUsageEntries,
  clearUsageEntries,
};
