const Supabase = require('../services/supabaseService');
const { getProfile } = require('./profileRepository');
const { getAllProjects } = require('./projectRepository');
const { getSettings } = require('./settingsRepository');
const { getAiSettings } = require('./aiRepository');

const TABLE = 'users';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role || 'user',
    userVersion: row.userVersion || 1,
    starredTemplates: Array.isArray(row.starredTemplates) ? row.starredTemplates : [],
    billingType: row.billingType || 'token',
    gatewayAccess: row.gatewayAccess || {},
    credits: Number(row.credits) || 0,
    creditExpiryBuckets: Array.isArray(row.creditExpiryBuckets) ? row.creditExpiryBuckets : [],
    schemaVersion: row.schemaVersion || 1,
    metadata: row.metadata || {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toRow(user) {
  const now = new Date().toISOString();
  return {
    id: user.id,
    email: String(user.email || '').trim().toLowerCase(),
    name: user.name || '',
    role: user.role || 'user',
    userVersion: user.userVersion || 1,
    starredTemplates: Array.isArray(user.starredTemplates) ? user.starredTemplates : [],
    billingType: user.billingType || 'token',
    gatewayAccess: user.gatewayAccess || {},
    credits: Number(user.credits) || 0,
    creditExpiryBuckets: Array.isArray(user.creditExpiryBuckets) ? user.creditExpiryBuckets : [],
    schemaVersion: user.schemaVersion || 1,
    metadata: user.metadata || {},
    createdAt: user.createdAt || now,
    updatedAt: now,
  };
}

const findUserByEmail = async (email) => {
  const target = String(email || '').trim().toLowerCase();
  if (!target) return null;
  const { data, error } = await Supabase.selectOne(TABLE, { email: target });
  if (error) throw error;
  return fromRow(data);
};

const findUserById = async (id) => {
  if (!id) return null;
  const { data, error } = await Supabase.selectOne(TABLE, { id });
  if (error) throw error;
  return fromRow(data);
};

const createUser = async (userData) => {
  const row = toRow({
    ...userData,
    starredTemplates: Array.isArray(userData.starredTemplates) ? userData.starredTemplates : [],
    userVersion: 1,
  });
  const { data, error } = await Supabase.insert(TABLE, row);
  if (error) throw error;
  return fromRow(data?.[0] || row);
};

const updateUserRecord = async (id, updates) => {
  const current = await findUserById(id);
  if (!current) return null;
  const next = toRow({ ...current, ...updates, id });
  next.updatedAt = new Date().toISOString();
  if (updates.userVersion === undefined) {
    next.userVersion = (current.userVersion || 1) + 1;
  }
  const { data, error } = await Supabase.update(TABLE, { id }, next);
  if (error) throw error;
  return fromRow(data[0] || next);
};

const getUserFullData = async (userId) => ({
  profile: await getProfile(userId),
  projects: await getAllProjects(userId),
  settings: await getSettings(userId),
  aiSettings: await getAiSettings(userId),
});

const deleteUserAndCleanup = async (userId) => {
  if (!userId) throw new Error('User ID is required for deletion');
  console.log(`[userRepository] Initializing permanent account deletion for user: ${userId}`);

  const { error: userErr } = await Supabase.delete(TABLE, { id: userId });
  if (userErr) {
    console.error(`[userRepository] Failed to delete user ${userId}:`, userErr.message);
  }

  const scopedTables = [
    'profiles',
    'projects',
    'settings',
    'jobs',
    'emails',
    'templates',
    'document_templates',
    'documents',
    'recipients',
    'smtp_providers',
    'ai_settings',
    'chats',
    'uploads',
    'artifacts',
    'schedules',
    'categories',
    'attachments',
    'credits_wallets',
    'credit_transactions',
    'billing_settings',
    'audit_logs',
  ];

  for (const table of scopedTables) {
    try {
      const { error } = await Supabase.delete(table, { user_id: userId }, userId);
      if (error) {
        console.error(`[userRepository] Failed to purge ${table} for ${userId}:`, error.message);
      }
    } catch (err) {
      console.error(`[userRepository] Exception purging ${table} for ${userId}:`, err.message);
    }
  }

  try {
    await Supabase.delete('document_templates', { created_by: userId });
  } catch (err) {
    console.error(`[userRepository] Failed to purge document_templates by created_by:`, err.message);
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserRecord,
  getUserFullData,
  deleteUserAndCleanup,
};
