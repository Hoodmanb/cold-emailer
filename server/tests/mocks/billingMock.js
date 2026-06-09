// server/tests/mocks/billingMock.js
// Simple mock for billing services used in tests

let creditChanges = [];

function reset() {
  creditChanges = [];
}

function getCreditChanges() {
  return creditChanges.slice();
}

// Mock billing service functions
function getBillingSummary(userId) {
  // Return a deterministic billing summary for tests
  return {
    billingType: 'test',
    credits: 1000,
    gatewayAccess: true,
    hasAccess: true,
  };
}

function deductCredits(userId, amount) {
  creditChanges.push({ userId, amount });
  return true;
}

module.exports = {
  getBillingSummary,
  deductCredits,
  reset,
  getCreditChanges,
};
