const { getBillingSettings } = require('../../repositories/billingSettingsRepository');
const { getModelPricing } = require('../../repositories/pricingRepository');

async function calculateActualCost(provider, model, inputTokens, outputTokens) {
  const pricing = await getModelPricing(provider, model);
  if (!pricing) return 0;
  const inputCost = (Number(inputTokens) / 1000000) * (pricing.input_cost_per_million || 0);
  const outputCost = (Number(outputTokens) / 1000000) * (pricing.output_cost_per_million || 0);
  return inputCost + outputCost;
}

async function calculateCreditCharge(actualCostUSD, markupMultiplier) {
  const settings = await getBillingSettings();
  const creditValue = Number(settings.credit_value_usd) || 0.01;
  const minCharge = Number(settings.minimum_credit_charge) || 1.0;

  const customerChargeUSD = actualCostUSD * (Number(markupMultiplier) || 1);
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
