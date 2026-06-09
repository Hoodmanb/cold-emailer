const { getBillingSettings } = require('../../repositories/billingSettingsRepository');
const { getModelPricing } = require('../../repositories/pricingRepository');

function calculateActualCost(provider, model, inputTokens, outputTokens) {
  const pricing = getModelPricing(provider, model);
  const inputCost = (Number(inputTokens) / 1000000) * pricing.input_cost_per_million;
  const outputCost = (Number(outputTokens) / 1000000) * pricing.output_cost_per_million;
  return inputCost + outputCost;
}

function calculateCreditCharge(actualCostUSD, markupMultiplier) {
  const settings = getBillingSettings();
  const creditValue = Number(settings.credit_value_usd) || 0.01;
  const minCharge = Number(settings.minimum_credit_charge) || 1.0;

  const customerChargeUSD = actualCostUSD * markupMultiplier;
  let credits = Math.ceil(customerChargeUSD / creditValue);
  if (credits < minCharge) {
    credits = minCharge;
  }
  return credits;
}

module.exports = {
  calculateActualCost,
  calculateCreditCharge,
};
