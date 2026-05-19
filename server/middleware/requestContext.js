const { AsyncLocalStorage } = require("async_hooks");
const debugLog = require("../utils/debugLogger");

const storage = new AsyncLocalStorage();

function runWithRequestContext(req, res, next) {
  storage.run({ userId: null }, () => next());
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

module.exports = {
  runWithRequestContext,
  setCurrentUserId,
  getCurrentUserId,
};
