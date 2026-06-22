const { seedBillingCollections } = require('../repositories/billingRepository');
const { migrateAllUsersBilling } = require('../repositories/billingUserRepository');
const { findUserByEmail, updateUserRecord } = require('../repositories/userRepository');
const { seedBillingSettings } = require('../repositories/billingSettingsRepository');
const { seedModelPricing } = require('../repositories/pricingRepository');
const { getOrCreateWallet } = require('../repositories/walletRepository');
const Supabase = require('../services/supabaseService');

async function promoteAdminFromEnv() {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) return;
  const admin = await findUserByEmail(adminEmail);
  if (admin && admin.role !== 'admin') {
    await updateUserRecord(admin.id, { role: 'admin' });
    console.log(`[billing] Promoted ${adminEmail} to admin`);
  }
}

async function migrateWalletsForExistingUsers() {
  try {
    const { data, error } = await Supabase.selectAll('users');
    if (error) throw error;
    if (Array.isArray(data)) {
      for (const u of data) {
        try {
          await getOrCreateWallet(u.id);
        } catch (err) {
          console.error(`[wallet skip user ${u.id}]`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[billing] Failed wallet migration for existing users:', err.message);
  }
}

async function bootstrapBilling() {
  try {
    console.log('[billing] bootstrap started');

    await seedBillingCollections().catch(e =>
      console.error('[seedBillingCollections failed]', e)
    );

    await seedBillingSettings().catch(e =>
      console.error('[seedBillingSettings failed]', e)
    );

    await seedModelPricing().catch(e =>
      console.error('[seedModelPricing failed]', e)
    );

    await migrateWalletsForExistingUsers();

    const migrated = await migrateAllUsersBilling();
    if (migrated > 0) {
      console.log(`[billing] Migrated billing fields for ${migrated} users`);
    }

    await promoteAdminFromEnv();

    console.log('[billing] bootstrap completed');
  } catch (err) {
    console.error('[billing FATAL ERROR]', err);
  }
}

module.exports = { bootstrapBilling };
