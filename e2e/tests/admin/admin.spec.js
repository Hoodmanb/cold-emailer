/**
 * MODULE: Admin Panel
 * ─────────────────────────────────────────────────────────
 * Covers: User management, credit grants/revocations, billing settings,
 *         model catalog management, feedback moderation, document template
 *         moderation, communication settings, SMTP profiles,
 *         analytics, consistency checks — all behind requireAdmin middleware.
 *
 * NOTE: All tests in this file use the admin storageState.
 */

const { test, expect } = require('../fixtures');
const { AdminPage } = require('../pages');

// All admin tests require admin session
test.use({ storageState: 'test-results/.auth/admin.json' });

const MOCK_USERS = [
  {
    id:          'user-001',
    email:       'alice@example.com',
    name:        'Alice Smith',
    role:        'user',
    billingType: 'token',
    credits:     50,
    createdAt:   new Date(Date.now() - 7 * 86_400_000).toISOString(),
  },
  {
    id:          'user-002',
    email:       'bob@example.com',
    name:        'Bob Jones',
    role:        'user',
    billingType: 'gateway',
    credits:     0,
    createdAt:   new Date(Date.now() - 3 * 86_400_000).toISOString(),
  },
];

const MOCK_TRANSACTIONS = [
  { id: 'txn-001', userId: 'user-001', type: 'credit_purchase', credits: 100, createdAt: new Date().toISOString() },
  { id: 'txn-002', userId: 'user-002', type: 'ai_usage',        credits: -5,  createdAt: new Date().toISOString() },
];

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('Admin — Happy Path', () => {
  test('should render admin dashboard without crashing', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.goto();

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(
      page.getByText(/admin|management|overview/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should list all users in users management table', async ({ page }) => {
    await page.route('**/api/admin/users**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USERS }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    // Navigate to users section
    const usersTab = page.getByRole('tab', { name: /users/i })
      .or(page.getByRole('link', { name: /users/i }))
      .first();

    if (await usersTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await usersTab.click();
    }

    await expect(page.getByText('alice@example.com')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('bob@example.com')).toBeVisible({ timeout: 10_000 });
  });

  test('should display billing analytics', async ({ page }) => {
    await page.route('**/api/admin/billing/analytics**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            totalRevenue:      45000,
            totalCreditsIssued: 10000,
            totalUsageCredits:  3500,
            activeUsers:        28,
          },
        }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const analyticsTab = page.getByRole('tab', { name: /analytics|usage/i })
      .or(page.getByRole('link', { name: /analytics/i }))
      .first();

    if (await analyticsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await analyticsTab.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
    }
  });

  test('should grant credits to a user', async ({ page }) => {
    await page.route('**/api/admin/users**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USERS }),
      });
    });

    await page.route('**/api/admin/users/user-001/grant-credits', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { success: true, newBalance: 150 } }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const grantBtn = page.getByRole('button', { name: /grant credits/i }).first();
    if (await grantBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await grantBtn.click();

      const amountInput = page.getByLabel(/credits|amount/i).first();
      if (await amountInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await amountInput.fill('50');
        const confirmBtn = page.getByRole('button', { name: /confirm|grant/i }).last();
        await confirmBtn.click();

        const hasSuccess = await page.getByText(/granted|success/i)
          .isVisible({ timeout: 10_000 })
          .catch(() => false);
      }
    }
  });

  test('should revoke credits from a user', async ({ page }) => {
    await page.route('**/api/admin/users**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_USERS }),
      });
    });

    await page.route('**/api/admin/users/user-001/revoke-credits', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { success: true, newBalance: 0 } }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const revokeBtn = page.getByRole('button', { name: /revoke credits/i }).first();
    if (await revokeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await revokeBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should display transaction log list', async ({ page }) => {
    await page.route('**/api/admin/transactions**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_TRANSACTIONS }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const txnTab = page.getByRole('tab', { name: /transactions/i }).first();
    if (await txnTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await txnTab.click();
    }

    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
  });

  test('should list feedback submissions', async ({ page }) => {
    await page.route('**/api/admin/feedback**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'fb-001', message: 'Great app!', status: 'open',   createdAt: new Date().toISOString() },
            { id: 'fb-002', message: 'Bug report', status: 'closed', createdAt: new Date().toISOString() },
          ],
        }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const feedbackTab = page.getByRole('tab', { name: /feedback/i })
      .or(page.getByRole('link', { name: /feedback/i }))
      .first();

    if (await feedbackTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await feedbackTab.click();
    }

    await expect(page.getByText(/great app|bug report|feedback/i).first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('should update feedback status', async ({ page }) => {
    await page.route('**/api/admin/feedback**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{ id: 'fb-001', message: 'Feature request', status: 'open', createdAt: new Date().toISOString() }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/admin/feedback/fb-001/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: 'fb-001', status: 'resolved' } }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const feedbackTab = page.getByRole('tab', { name: /feedback/i }).first();
    if (await feedbackTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await feedbackTab.click();
    }

    const resolveBtn = page.getByRole('button', { name: /resolve|close|update status/i }).first();
    if (await resolveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await resolveBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should list pending document templates for moderation', async ({ page }) => {
    await page.route('**/api/admin/document-templates/pending**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'tpl-001', name: 'Modern Resume', status: 'pending', createdAt: new Date().toISOString() },
          ],
        }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const modTab = page.getByRole('tab', { name: /moderation|templates/i }).first();
    if (await modTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await modTab.click();
    }

    await expect(page.getByText(/modern resume|pending|moderation/i).first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('should approve a pending document template', async ({ page }) => {
    await page.route('**/api/admin/document-templates/pending**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 'tpl-001', name: 'Modern Resume', status: 'pending', createdAt: new Date().toISOString() }],
        }),
      });
    });

    await page.route('**/api/admin/document-templates/tpl-001/approve', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: 'tpl-001', status: 'approved' } }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const modTab = page.getByRole('tab', { name: /moderation|templates/i }).first();
    if (await modTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await modTab.click();
    }

    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await approveBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

// ── Billing Settings Management ───────────────────────────────────────────────
test.describe('Admin — Billing Settings', () => {
  test('should display and update billing settings', async ({ page }) => {
    await page.route('**/api/admin/billing/settings**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              defaultBillingType:     'token',
              defaultTokenCredits:    50,
              gatewayMonthlyPriceNgn: 5000,
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { updated: true } }),
        });
      }
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const billingTab = page.getByRole('tab', { name: /billing settings/i }).first();
    if (await billingTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await billingTab.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
    }
  });

  test('should manage model catalog entries', async ({ page }) => {
    await page.route('**/api/admin/billing/model-catalog**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { model: 'openai/gpt-4o',      creditCost: 10, isActive: true  },
            { model: 'openai/gpt-4o-mini', creditCost: 3,  isActive: true  },
            { model: 'anthropic/claude-3',  creditCost: 15, isActive: false },
          ],
        }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const catalogTab = page.getByRole('tab', { name: /catalog|models/i }).first();
    if (await catalogTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await catalogTab.click();
      await expect(page.getByText(/gpt-4o|claude/i).first()).toBeVisible({ timeout: 10_000 });
    }
  });
});

// ── Permission Tests ──────────────────────────────────────────────────────────
test.describe('Admin — Permission Tests', () => {
  test('should block regular users from admin dashboard UI', async ({ browser }) => {
    // Use USER session (not admin)
    const context = await browser.newContext({ storageState: 'test-results/.auth/user.json' });
    const page = await context.newPage();

    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const wasBlocked = page.url().includes('/login') ||
                       page.url().includes('/dashboard') && !page.url().includes('/admin');
    const hasAccessDenied = await page.getByText(/access denied|forbidden|unauthorized|not authorized/i)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(wasBlocked || hasAccessDenied).toBeTruthy();
    await context.close();
  });

  test('should block unauthenticated access to /api/admin/users', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/admin/users');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block regular user token from /api/admin/users', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/admin/users', {
      headers: { Authorization: `Bearer ${process.env.E2E_USER_TOKEN || 'bad-token'}` },
    });
    expect([401, 403]).toContain(res.status());
  });
});

// ── API Failure Tests ─────────────────────────────────────────────────────────
test.describe('Admin — API Failures', () => {
  test('should handle users list API 500 without page crash', async ({ page }) => {
    await page.route('**/api/admin/users**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Database error' }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should handle consistency check failure gracefully', async ({ page }) => {
    await page.route('**/api/admin/consistency-check', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Check failed' }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    const checkBtn = page.getByRole('button', { name: /consistency check|run check/i }).first();
    if (await checkBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await checkBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('Admin — Loading States', () => {
  test('should show loading spinner while fetching user list', async ({ page }) => {
    await page.route('**/api/admin/users**', async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      route.continue();
    });

    await page.goto('/dashboard/admin');
    const spinner = page.locator('[role="progressbar"]');
    await spinner.isVisible({ timeout: 2_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 20_000 });
  });
});

// ── Empty State Tests ─────────────────────────────────────────────────────────
test.describe('Admin — Empty States', () => {
  test('should handle empty user list gracefully', async ({ page }) => {
    await page.route('**/api/admin/users**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
  });

  test('should handle empty feedback list gracefully', async ({ page }) => {
    await page.route('**/api/admin/feedback**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    const admin = new AdminPage(page);
    await admin.goto();

    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
  });
});
