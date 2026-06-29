// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Load .env.test.local (or .env.test) before config is evaluated
const dotenv = require('dotenv');
for (const envFile of ['.env.test.local', '.env.test']) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

/**
 * CareerBot E2E Test Configuration
 * Organized by MODULE — not by page.
 * Targets: http://localhost:3000 (Next.js frontend) + http://localhost:9000 (Express API)
 */
module.exports = defineConfig({
  // ── Test Discovery ───────────────────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.js',

  // ── Parallelism ──────────────────────────────────────────────────────────────
  fullyParallel: false,          // Keep false: auth sessions share Supabase state
  workers: 5,                    // Single worker prevents session conflicts
  retries: process.env.CI ? 2 : 0,

  // ── Timeouts ─────────────────────────────────────────────────────────────────
  timeout: 60_000,               // 60s per test (AI operations are slow)
  expect: { timeout: 15_000 },   // 15s for assertions

  // ── Reporting ────────────────────────────────────────────────────────────────
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],                    // Console output
  ],

  // ── Artifact Output ───────────────────────────────────────────────────────────
  outputDir: 'test-results/artifacts',

  // ── Global Test Configuration ─────────────────────────────────────────────────
  use: {
    // Application URLs
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

    // Artifacts — captured on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Browser behaviour
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    // Viewport
    viewport: { width: 1280, height: 800 },

    // Extra HTTP headers forwarded to every request
    extraHTTPHeaders: {
      'x-e2e-test': 'true',
    },

    // Permissions
    permissions: ['clipboard-read', 'clipboard-write'],
  },

  // ── Projects (browsers) ───────────────────────────────────────────────────────
  projects: [
    // ── Shared Setup ────────────────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Auth Chromium (no saved session) ─────────────────────────────────────────
    {
      name: 'auth-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: '**/auth/**/*.spec.js',
    },

    // ── Chromium (main) ─────────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Reuse authenticated user session
        storageState: 'test-results/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/admin/, /auth\//], // Admin + auth use dedicated projects
    },

    // ── Admin Chromium ───────────────────────────────────────────────────────────
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /.*admin.*\.spec\.js/,
    },

    // ── Firefox ─────────────────────────────────────────────────────────────────
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'test-results/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/admin/, /ai/, /billing/], // Reduce CI time
    },

    // ── Mobile Chrome ────────────────────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'test-results/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: ['**/landing/**/*.spec.js', '**/auth/**/*.spec.js'],
    },
  ],
});
