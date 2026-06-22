
const Supabase = require('../services/supabaseService');
const { getBillingSettings } = require('./billingSettingsRepository');


const FILE_NAME = 'ai_usage_logs.json';

async function listUsageLogs() {
  const { data, error } = await Supabase.select('ai_usage_logs');
  if (error) throw error;
  return data || [];
}

async function createUsageLog(logData, useTx = false) {
  const op = async () => {
    const logs = await listUsageLogs();
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
    // Insert the new log entry
    const { error } = await Supabase.insert('ai_usage_logs', entry);
    if (error) throw error;
    return entry;
  };
  // Transaction handling not required; simply execute
  return op();
}

async function getPlatformStats() {
  const logs = await listUsageLogs();
  const settings = await getBillingSettings();
  const creditValue = Number(settings?.credit_value_usd) || 0.01;

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
