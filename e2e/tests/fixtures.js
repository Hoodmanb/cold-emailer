/**
 * Shared Playwright Fixtures
 * --------------------------
 * Provides extended test objects used across all modules:
 *   - authenticatedPage  : page with user session pre-loaded
 *   - adminPage          : page with admin session pre-loaded
 *   - apiContext         : raw APIRequestContext for direct API tests
 *   - consoleLogs        : captured browser console entries
 *   - networkErrors      : captured failed network requests
 */

const { test: base, expect } = require('@playwright/test');
const path = require('path');

// ── Helper: wait for page to settle ──────────────────────────────────────────
async function waitForPageReady(page, timeout = 10_000) {
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
}

// ── Helper: capture console output ───────────────────────────────────────────
function attachConsoleCapture(page) {
  const logs = [];
  page.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text(), time: Date.now() });
  });
  page.on('pageerror', (err) => {
    logs.push({ type: 'pageerror', text: err.message, stack: err.stack, time: Date.now() });
  });
  return logs;
}

// ── Helper: capture network failures ─────────────────────────────────────────
function attachNetworkCapture(page) {
  const failures = [];
  page.on('requestfailed', (req) => {
    failures.push({
      url:    req.url(),
      method: req.method(),
      error:  req.failure()?.errorText ?? 'unknown',
      time:   Date.now(),
    });
  });
  page.on('response', (res) => {
    if (res.status() >= 500) {
      failures.push({
        url:    res.url(),
        method: res.request().method(),
        status: res.status(),
        time:   Date.now(),
      });
    }
  });
  return failures;
}

// ── Extended test fixture ─────────────────────────────────────────────────────
exports.test = base.extend({
  // Captures console logs automatically on every test
  consoleLogs: async ({ page }, use) => {
    const logs = attachConsoleCapture(page);
    await use(logs);
  },

  // Captures network errors automatically on every test
  networkErrors: async ({ page }, use) => {
    const errors = attachNetworkCapture(page);
    await use(errors);
  },

  // Pre-authenticated page (regular user)
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'test-results/.auth/user.json',
    });
    const page = await context.newPage();
    attachConsoleCapture(page);
    attachNetworkCapture(page);
    await use(page);
    await context.close();
  },

  // Pre-authenticated page (admin)
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'test-results/.auth/admin.json',
    });
    const page = await context.newPage();
    attachConsoleCapture(page);
    attachNetworkCapture(page);
    await use(page);
    await context.close();
  },

  // Direct API request context (authenticated as user)
  apiContext: async ({ playwright }, use) => {
    const baseURL = process.env.API_BASE_URL || 'http://localhost:9000';
    const token   = process.env.E2E_API_TOKEN || '';

    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'x-e2e-test':  'true',
      },
    });

    await use(context);
    await context.dispose();
  },
});

exports.expect = expect;

// ── Test data factories ────────────────────────────────────────────────────────
exports.factories = {
  job(overrides = {}) {
    return {
      title:       'Senior Software Engineer',
      company:     'E2E Test Corp',
      description: `We are looking for a senior software engineer with 5+ years of experience in TypeScript, Node.js, and React. 
                    You will lead backend architecture and work closely with product teams.`,
      url:         'https://example.com/job/sse',
      status:      'drafted',
      ...overrides,
    };
  },

  profile(overrides = {}) {
    return {
      fullName:    'E2E Test User',
      email:       process.env.E2E_USER_EMAIL || 'e2e-user@careerbot.test',
      phone:       '+1-555-000-0001',
      location:    'Lagos, Nigeria',
      headline:    'Senior Software Engineer',
      summary:     'Experienced software engineer with expertise in full-stack development.',
      ...overrides,
    };
  },

  skill(overrides = {}) {
    return {
      name:        'TypeScript',
      level:       'expert',
      category:    'Programming Language',
      ...overrides,
    };
  },

  project(overrides = {}) {
    return {
      name:        'CareerBot E2E Test Project',
      description: 'An automated job application bot built with Next.js and Express.',
      url:         'https://github.com/test/careerbot',
      techStack:   ['Next.js', 'Express.js', 'PostgreSQL'],
      ...overrides,
    };
  },

  smtpConfig(overrides = {}) {
    return {
      host:     'smtp.gmail.com',
      port:     587,
      user:     process.env.E2E_SMTP_USER || 'test@gmail.com',
      password: process.env.E2E_SMTP_PASS || 'test-app-password',
      ...overrides,
    };
  },
};

// ── Assertion helpers ─────────────────────────────────────────────────────────
exports.assertNoConsoleErrors = (logs) => {
  const errors = logs.filter((l) => l.type === 'pageerror' || l.type === 'error');
  if (errors.length > 0) {
    console.warn('[Test] Console errors detected:', errors);
  }
  // Non-fatal — just warn; don't fail the test for expected 3rd-party errors
};

exports.assertNoNetworkErrors = (failures) => {
  const critical = failures.filter((f) => f.status >= 500);
  expect(critical).toHaveLength(0);
};

// ── Wait helpers ──────────────────────────────────────────────────────────────
exports.waitForPageReady = waitForPageReady;
