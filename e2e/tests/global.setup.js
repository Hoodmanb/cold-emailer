/**
 * Global test setup — runs once before the full suite.
 * Creates authenticated sessions (user + admin) saved to disk.
 * All other test projects depend on this.
 */
const { test: setup, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const USER_SESSION_PATH  = 'test-results/.auth/user.json';
const ADMIN_SESSION_PATH = 'test-results/.auth/admin.json';

// ── Ensure auth directory exists ──────────────────────────────────────────────
setup.beforeAll(async () => {
  const dir = path.dirname(USER_SESSION_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ── Regular User Authentication ───────────────────────────────────────────────
setup('authenticate as regular user', async ({ page }) => {
  const email    = process.env.E2E_USER_EMAIL    || 'e2e-user@careerbot.test';
  const password = process.env.E2E_USER_PASSWORD || 'E2eTestPassword123!';

  await page.goto('/login');

  // Wait for the login form to render
  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page).toHaveURL(/dashboard/);

  // Persist session state
  await page.context().storageState({ path: USER_SESSION_PATH });
  console.log('[Setup] ✅ Regular user session saved →', USER_SESSION_PATH);
});

// ── Admin User Authentication ─────────────────────────────────────────────────
setup('authenticate as admin user', async ({ page }) => {
  const email    = process.env.E2E_ADMIN_EMAIL    || 'joshuadebravo@gmail.com';
  const password = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD || 'E2eTestPassword123!';

  await page.goto('/login');

  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page).toHaveURL(/dashboard/);

  await page.context().storageState({ path: ADMIN_SESSION_PATH });
  console.log('[Setup] ✅ Admin session saved →', ADMIN_SESSION_PATH);
});
