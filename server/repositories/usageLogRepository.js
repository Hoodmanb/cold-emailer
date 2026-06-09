const { safeRead, atomicWrite, withLock } = require('../db/jsonDb');
const { getBillingSettings } = require('./billingSettingsRepository');

const FILE_NAME = 'ai_usage_logs.json';

function listUsageLogs() {
  const logs = safeRead(FILE_NAME, []);
  return Array.isArray(logs) ? logs : [];
}

function createUsageLog(logData, useTx = false) {
  const op = () => {
    const logs = listUsageLogs();
    const entry = {
      id: logData.id || require('uuid').v4(),
      user_id: logData.user_id,
      provider: logData.provider,
      model: logData.model,
      input_tokens: Number(logData.input_tokens) || 0,
      output_tokens: Number(logData.output_tokens) || 0,
      total_tokens: Number(logData.input_tokens || 0) + Number(logData.output_tokens || 0),
      actual_provider_cost: Number(logData.actual_provider_cost) || 0,
      charged_credits: Number(logData.charged_credits) || 0,
      input_price_used: Number(logData.input_price_used) || 0,
      output_price_used: Number(logData.output_price_used) || 0,
      markup_used: Number(logData.markup_used) || 0,
      credit_value_used: Number(logData.credit_value_used) || 0,
      request_type: logData.request_type,
      metadata: logData.metadata || {},
      created_at: logData.created_at || new Date().toISOString(),
    };
    logs.push(entry);
    atomicWrite(FILE_NAME, logs);
    return entry;
  };

  if (useTx) {
    return op();
  }
  return withLock(FILE_NAME, op);
}

function getPlatformStats() {
  const logs = listUsageLogs();
  const settings = getBillingSettings();
  const creditValue = Number(settings.credit_value_usd) || 0.01;

  let totalProviderCost = 0;
  let totalCreditsConsumed = 0;

  for (const log of logs) {
    totalProviderCost += Number(log.actual_provider_cost) || 0;
    totalCreditsConsumed += Number(log.charged_credits) || 0;
  }

  const revenueGenerated = totalCreditsConsumed * creditValue;
  const estimatedProfit = revenueGenerated - totalProviderCost;

  return {
    totalProviderCost,
    totalCreditsConsumed,
    revenueGenerated,
    estimatedProfit,
  };
}

module.exports = {
  listUsageLogs,
  createUsageLog,
  getPlatformStats,
};
