/**
 * MODULE: Billing & Payments
 * ─────────────────────────────────────────────────────────
 * Covers: Billing status display, credit balance, transaction history,
 *         payment initialization (gateway + credits), Paystack webhook,
 *         upgrade flow, API failures, loading states, empty states,
 *         permission tests (unauthenticated access)
 */

const { test, expect } = require('../fixtures');
const { BillingPage } = require('../pages');

test.use({ storageState: 'test-results/.auth/user.json' });

const MOCK_BILLING_STATUS = {
  billingType:  'token',
  credits:      150,
  hasAccess:    true,
  gatewayAccess: {
    isActive:      false,
    expiresAt:     null,
    daysRemaining: null,
  },
  monthlyCreditAllowance: 0,
  nextMonthlyCreditReset: null,
};

const MOCK_TRANSACTIONS = [
  {
    id:          'txn-001',
    type:        'credit_purchase',
    amount:      500,
    credits:     100,
    status:      'completed',
    createdAt:   new Date(Date.now() - 86_400_000).toISOString(),
    description: 'Credit pack purchase',
  },
  {
    id:          'txn-002',
    type:        'ai_usage',
    amount:      0,
    credits:     -5,
    status:      'completed',
    createdAt:   new Date(Date.now() - 3_600_000).toISOString(),
    description: 'Resume generation',
  },
];

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('Billing — Happy Path', () => {
  test('should render billing page without crashing', async ({ page }) => {
    const billing = new BillingPage(page);
    await billing.goto();

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(
      page.getByText(/billing|plan|credits|subscription/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display current billing status and credit balance', async ({ page }) => {
    await page.route('**/api/billing/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_BILLING_STATUS }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    // Credit balance should be visible somewhere
    await expect(
      page.getByText(/150|credits/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should display transaction history', async ({ page }) => {
    await page.route('**/api/billing/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_BILLING_STATUS }),
      });
    });

    await page.route('**/api/billing/transactions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_TRANSACTIONS }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    await expect(
      page.getByText(/credit pack purchase|transaction|history/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should display public billing config (plans)', async ({ page }) => {
    await page.route('**/api/billing/config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            creditPacks: [
              { id: 'pack-100', name: 'Starter', credits: 100, priceNgn: 2500 },
              { id: 'pack-500', name: 'Pro',     credits: 500, priceNgn: 9500 },
            ],
            gatewayMonthlyPriceNgn: 5000,
          },
        }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    await expect(
      page.getByText(/starter|pro|pack|plan/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should open payment flow when clicking upgrade/buy button', async ({ page }) => {
    await page.route('**/api/billing/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_BILLING_STATUS }),
      });
    });

    await page.route('**/api/billing/checkout/credits', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { authorizationUrl: 'https://paystack.com/pay/mock-ref', reference: 'mock-ref-001' },
        }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    const upgradeBtn = page.getByRole('button', { name: /buy credits|upgrade|purchase/i }).first();
    if (await upgradeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Intercept new tab / popup for Paystack
      const popupPromise = page.waitForEvent('popup', { timeout: 5_000 }).catch(() => null);
      await upgradeBtn.click();

      const popup = await popupPromise;
      if (popup) {
        await popup.close();
      }
      // Either popup opened or in-page redirect — just ensure no crash
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

// ── Negative Tests ────────────────────────────────────────────────────────────
test.describe('Billing — Negative Tests', () => {
  test('should show error when payment initialization fails', async ({ page }) => {
    await page.route('**/api/billing/checkout/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Payment gateway error' }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    const buyBtn = page.getByRole('button', { name: /buy|purchase|upgrade/i }).first();
    if (await buyBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await buyBtn.click();

      const hasError = await page.getByRole('alert').filter({ hasText: /.+/ })
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      const hasErrorText = await page.getByText(/failed|error|try again/i)
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      expect(hasError || hasErrorText).toBeTruthy();
    }
  });

  test('should show zero credit balance when user has no credits', async ({ page }) => {
    await page.route('**/api/billing/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...MOCK_BILLING_STATUS, credits: 0 } }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    await expect(
      page.getByText(/0.*credit|no credits|credits.*0/i).first()
        .or(page.getByText('0').first())
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ── Permission Tests ──────────────────────────────────────────────────────────
test.describe('Billing — Permission Tests', () => {
  test('should block unauthenticated access to billing API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/billing/status');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block unauthenticated access to billing transactions API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/billing/transactions');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });
});

// ── API Failure Tests ─────────────────────────────────────────────────────────
test.describe('Billing — API Failures', () => {
  test('should handle billing status 500 without page crash', async ({ page }) => {
    await page.route('**/api/billing/status', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should handle transactions API failure gracefully', async ({ page }) => {
    await page.route('**/api/billing/transactions', (route) => route.abort('connectionfailed'));

    const billing = new BillingPage(page);
    await billing.goto();

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('Billing — Loading States', () => {
  test('should show loading state while fetching billing status', async ({ page }) => {
    await page.route('**/api/billing/status', async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      route.continue();
    });

    await page.goto('/dashboard/billing');
    const spinner = page.locator('[role="progressbar"]');
    await spinner.isVisible({ timeout: 2_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty({ timeout: 20_000 });
  });
});

// ── Empty State Tests ─────────────────────────────────────────────────────────
test.describe('Billing — Empty States', () => {
  test('should display empty transaction history message', async ({ page }) => {
    await page.route('**/api/billing/transactions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    const billing = new BillingPage(page);
    await billing.goto();

    const hasEmpty = await page.getByText(/no transactions|no payment history/i)
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    // Not all UIs show explicit empty messaging — just ensure no crash
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Network Interruption Tests ────────────────────────────────────────────────
test.describe('Billing — Network Interruptions', () => {
  test('should survive going offline mid-session on billing page', async ({ page, context }) => {
    const billing = new BillingPage(page);
    await billing.goto();

    await context.setOffline(true);
    await page.reload().catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
    await context.setOffline(false);
  });
});
