const { seedBillingCollections } = require('../repositories/billingRepository');
const { migrateAllUsersBilling } = require('../repositories/billingUserRepository');
const fileStore = require('../utils/fileStore');
const { updateUserRecord } = require('../repositories/userRepository');

// New imports for seeds and wallets
const { seedBillingSettings } = require('../repositories/billingSettingsRepository');
const { seedModelPricing } = require('../repositories/pricingRepository');
const { getOrCreateWallet, readWalletList, writeWalletList } = require('../repositories/walletRepository');

function promoteAdminFromEnv() {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) return;
  const users = fileStore.read('users.json');
  const admin = users.find((u) => String(u.email || '').toLowerCase() === adminEmail);
  if (admin && admin.role !== 'admin') {
    updateUserRecord(admin.id, { role: 'admin' });
    console.log(`[billing] Promoted ${adminEmail} to admin`);
  }
}

function migrateWalletsForExistingUsers() {
  try {
    const users = fileStore.read('users.json');
    if (Array.isArray(users)) {
      for (const u of users) {
        getOrCreateWallet(u.id);
      }
    }
  } catch (err) {
    console.error('[billing] Failed wallet migration for existing users:', err.message);
  }
}

function repairWalletStoreShape() {
  try {
    const wallets = readWalletList();
    writeWalletList(wallets);
  } catch (err) {
    console.error('[billing] Failed wallet store repair:', err.message);
  }
}

function bootstrapBilling() {
  seedBillingCollections();
  seedBillingSettings();
  seedModelPricing();
  repairWalletStoreShape();
  migrateWalletsForExistingUsers();
  
  const migrated = migrateAllUsersBilling();
  if (migrated > 0) {
    console.log(`[billing] Migrated billing fields for ${migrated} existing user(s)`);
  }
  promoteAdminFromEnv();
}

module.exports = { bootstrapBilling };
