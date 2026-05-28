const { seedBillingCollections } = require('../repositories/billingRepository');
const { migrateAllUsersBilling } = require('../repositories/billingUserRepository');
const fileStore = require('../utils/fileStore');
const { updateUserRecord } = require('../repositories/userRepository');

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

function bootstrapBilling() {
  seedBillingCollections();
  const migrated = migrateAllUsersBilling();
  if (migrated > 0) {
    console.log(`[billing] Migrated billing fields for ${migrated} existing user(s)`);
  }
  promoteAdminFromEnv();
}

module.exports = { bootstrapBilling };
