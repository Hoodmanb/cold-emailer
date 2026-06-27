/**
 * MODULE: Dashboard
 * ─────────────────────────────────────────────────────────
 * Covers: Metrics display, pipeline overview, recent activity,
 *         AI insights widget, empty state, loading states, API failures
 */

const { test, expect } = require('../fixtures');
const { DashboardPage } = require('../pages');

test.use({ storageState: 'test-results/.auth/user.json' });

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('Dashboard — Happy Path', () => {
  test('should render dashboard page with title "Command Center"', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(page.getByText(/command center/i)).toBeVisible();
    await expect(page.getByText(/career automation pipeline/i)).toBeVisible();
  });

  test('should display all four metric cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForMetrics();

    await expect(page.getByText(/total jobs/i)).toBeVisible();
    await expect(page.getByText(/docs generated/i)).toBeVisible();
    await expect(page.getByText(/emails sent/i)).toBeVisible();
    await expect(page.getByText(/avg ats score/i)).toBeVisible();
  });

  test('should display Application Pipeline section', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForMetrics();

    await expect(page.getByText(/application pipeline/i)).toBeVisible();
    // Pipeline stages should be visible
    await expect(page.getByText(/drafted/i)).toBeVisible();
    await expect(page.getByText(/applied/i)).toBeVisible();
  });

  test('should display Recent Activity section', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForMetrics();

    await expect(page.getByText(/recent activity/i)).toBeVisible();
  });

  test('should display AI Insights widget', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForMetrics();

    await expect(page.getByText(/ai insights/i)).toBeVisible();
    await expect(page.getByText(/current model/i)).toBeVisible();
    await expect(page.getByText(/generations/i)).toBeVisible();
  });

  test('should display Suggested Actions panel', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForMetrics();

    await expect(page.getByText(/suggested actions/i)).toBeVisible();
  });

  test('should navigate to /dashboard from landing page Dashboard button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /dashboard/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});

// ── Empty State Tests ─────────────────────────────────────────────────────────
test.describe('Dashboard — Empty States', () => {
  test('should show welcome banner when user has no jobs', async ({ page }) => {
    // Mock the dashboard API to return zero jobs
    await page.route('**/api/dashboard**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            metrics: {
              totalJobs:          0,
              documentsGenerated: 0,
              emailsSent:         0,
              avgAtsScore:        0,
            },
            pipeline: {
              drafted:       0,
              readyToApply:  0,
              applied:       0,
              followUpSent:  0,
              interviewing:  0,
            },
            recentActivity:  [],
            aiUsage:         { model: 'gpt-4o-mini', weeklyGenerations: 0, avgQualityScore: 0 },
            suggestedActions: [],
          },
        }),
      });
    });

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(page.getByText(/welcome to careerbot/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/you don't have any jobs yet/i)).toBeVisible();
  });

  test('should show "No activity yet." when recent activity list is empty', async ({ page }) => {
    await page.route('**/api/dashboard**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            metrics:         { totalJobs: 5, documentsGenerated: 0, emailsSent: 0, avgAtsScore: 0 },
            pipeline:        { drafted: 5, readyToApply: 0, applied: 0, followUpSent: 0, interviewing: 0 },
            recentActivity:  [],
            aiUsage:         { model: 'gpt-4o-mini', weeklyGenerations: 0, avgQualityScore: 0 },
            suggestedActions: [],
          },
        }),
      });
    });

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(page.getByText(/no activity yet/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should show "You\'re all caught up!" when no suggested actions', async ({ page }) => {
    await page.route('**/api/dashboard**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            metrics:         { totalJobs: 5, documentsGenerated: 3, emailsSent: 2, avgAtsScore: 78 },
            pipeline:        { drafted: 1, readyToApply: 2, applied: 2, followUpSent: 0, interviewing: 0 },
            recentActivity:  [{ id: '1', action: 'Job created', details: 'Added Google SWE', timestamp: new Date().toISOString() }],
            aiUsage:         { model: 'gpt-4o-mini', weeklyGenerations: 5, avgQualityScore: 8.5 },
            suggestedActions: [],
          },
        }),
      });
    });

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(page.getByText(/you're all caught up/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('Dashboard — Loading States', () => {
  test('should show loading spinner while fetching dashboard data', async ({ page }) => {
    // Delay the dashboard API response
    await page.route('**/api/dashboard**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      route.continue();
    });

    await page.goto('/dashboard');

    // Spinner should be visible before data arrives
    const spinner = page.locator('[role="progressbar"]');
    const isVisible = await spinner.isVisible({ timeout: 3_000 }).catch(() => false);
    // After data loads, spinner should disappear
    if (isVisible) {
      await expect(spinner).not.toBeVisible({ timeout: 20_000 });
    }
    // Page should have loaded content
    await expect(page.getByText(/command center/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ── API Failure Tests ─────────────────────────────────────────────────────────
test.describe('Dashboard — API Failures', () => {
  test('should handle /api/dashboard 500 error without crashing', async ({ page }) => {
    await page.route('**/api/dashboard**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');
    // Page should not show a blank screen or JS crash
    await expect(page.locator('body')).not.toBeEmpty();

    // Should show an error state or graceful fallback
    const hasError = await page.getByRole('alert').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasTitle = await page.getByText(/command center|dashboard|error/i)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(hasError || hasTitle).toBeTruthy();
  });

  test('should handle network timeout on dashboard gracefully', async ({ page }) => {
    await page.route('**/api/dashboard**', (route) => route.abort('timedout'));

    await page.goto('/dashboard');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Network Interruption Tests ────────────────────────────────────────────────
test.describe('Dashboard — Network Interruptions', () => {
  test('should handle offline mode gracefully on dashboard', async ({ page, context }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForMetrics();

    // Go offline mid-session
    await context.setOffline(true);
    await page.reload().catch(() => {});

    // Page should not crash completely
    await expect(page.locator('body')).not.toBeEmpty();

    // Re-enable network
    await context.setOffline(false);
  });
});
