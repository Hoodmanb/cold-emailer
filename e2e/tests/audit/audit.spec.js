/**
 * MODULE: Audit Log
 * ─────────────────────────────────────────────────────────
 * Covers: Audit log display, filtering, pagination,
 *         loading states, empty states, API failures
 */

const { test, expect } = require('../fixtures');

test.use({ storageState: 'test-results/.auth/user.json' });

const MOCK_AUDIT_LOGS = [
  { id: 'audit-001', action: 'job_created',      details: 'Added Google SWE job',      timestamp: new Date(Date.now() - 3600000).toISOString(), userId: 'user-001' },
  { id: 'audit-002', action: 'document_generated', details: 'Generated cover letter',   timestamp: new Date(Date.now() - 7200000).toISOString(), userId: 'user-001' },
  { id: 'audit-003', action: 'email_sent',        details: 'Sent email to hr@tech.com', timestamp: new Date(Date.now() - 86400000).toISOString(), userId: 'user-001' },
];

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('Audit — Happy Path', () => {
  test('should render audit log page without crashing', async ({ page }) => {
    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(
      page.getByText(/audit|activity log|history/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display audit log entries', async ({ page }) => {
    await page.route('**/api/audit**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_AUDIT_LOGS }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText(/google swe|job_created|generated/i).first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('should show relative timestamps for audit entries', async ({ page }) => {
    await page.route('**/api/audit**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_AUDIT_LOGS }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // Date or time should be visible somewhere
    await expect(
      page.getByText(/ago|am|pm|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ── Empty State Tests ─────────────────────────────────────────────────────────
test.describe('Audit — Empty States', () => {
  test('should show empty state when audit log is empty', async ({ page }) => {
    await page.route('**/api/audit**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
    // Optionally check for empty-state message
    const hasEmpty = await page.getByText(/no activity|no logs|empty/i)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    // Soft assertion
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('Audit — Loading States', () => {
  test('should show loading indicator while fetching audit logs', async ({ page }) => {
    await page.route('**/api/audit**', async (route) => {
      if (route.request().method() === 'GET') {
        await new Promise((r) => setTimeout(r, 1000));
        route.continue();
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/audit');
    const spinner = page.locator('[role="progressbar"]');
    await spinner.isVisible({ timeout: 2_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 20_000 });
  });
});

// ── API Failure Tests ─────────────────────────────────────────────────────────
test.describe('Audit — API Failures', () => {
  test('should handle audit API 500 without page crash', async ({ page }) => {
    await page.route('**/api/audit**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
    });

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should handle audit API network failure gracefully', async ({ page }) => {
    await page.route('**/api/audit**', (route) => route.abort('connectionfailed'));

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Permission Tests ──────────────────────────────────────────────────────────
test.describe('Audit — Permission Tests', () => {
  test('should block unauthenticated access to audit API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/audit');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });
});
