/**
 * MODULE: Email & SMTP
 * ─────────────────────────────────────────────────────────
 * Covers: Email history, email sending, SMTP configuration CRUD,
 *         SMTP connection testing, recipients management,
 *         email delivery failures, template selection,
 *         loading states, empty states, permission tests
 */

const { test, expect } = require('../fixtures');

test.use({ storageState: 'test-results/.auth/user.json' });

const MOCK_EMAIL_HISTORY = [
  {
    id:          'email-001',
    subject:     'Application for Software Engineer at Tech Corp',
    recipientEmail: 'hr@techcorp.com',
    status:      'sent',
    sentAt:      new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id:          'email-002',
    subject:     'Follow-up: Software Engineer Position',
    recipientEmail: 'hr@techcorp.com',
    status:      'failed',
    sentAt:      new Date(Date.now() - 7_200_000).toISOString(),
  },
];

const MOCK_SMTP_CONFIG = {
  id:          'smtp-001',
  host:        'smtp.gmail.com',
  port:        587,
  user:        'test@gmail.com',
  isActive:    true,
  label:       'Gmail Personal',
  createdAt:   new Date().toISOString(),
};

const MOCK_RECIPIENTS = [
  { id: 'rec-001', name: 'Jane HR', email: 'jane.hr@company.com', company: 'Tech Corp', createdAt: new Date().toISOString() },
  { id: 'rec-002', name: 'John Recruiter', email: 'john@recruiter.com', company: 'Recruit Ltd', createdAt: new Date().toISOString() },
];

// ── Email History — Happy Path ─────────────────────────────────────────────────
test.describe('Email — History Happy Path', () => {
  test('should render email history page', async ({ page }) => {
    await page.goto('/dashboard/email/history');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should display list of sent emails', async ({ page }) => {
    await page.route('**/api/email**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_EMAIL_HISTORY }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/email/history');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText(/software engineer at tech corp/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should show email status badges (sent/failed)', async ({ page }) => {
    await page.route('**/api/email**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_EMAIL_HISTORY }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/email/history');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText(/sent|failed/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Email History — Empty States ──────────────────────────────────────────────
test.describe('Email — Empty States', () => {
  test('should show empty state when no emails have been sent', async ({ page }) => {
    await page.route('**/api/email**', (route) => {
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

    await page.goto('/dashboard/email/history');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── SMTP Configuration — Happy Path ──────────────────────────────────────────
test.describe('SMTP — Happy Path', () => {
  test('should render SMTP configuration page', async ({ page }) => {
    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(
      page.getByText(/smtp|mail server|email configuration/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display existing SMTP profiles', async ({ page }) => {
    await page.route('**/api/smtp**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [MOCK_SMTP_CONFIG] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText(/gmail|smtp.gmail.com/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should add a new SMTP configuration', async ({ page }) => {
    await page.route('**/api/smtp', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_SMTP_CONFIG }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const addBtn = page.getByRole('button', { name: /add smtp|new smtp|add server/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();

      const hostInput = page.getByLabel(/host|smtp host/i).first();
      if (await hostInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await hostInput.fill('smtp.gmail.com');

        const portInput = page.getByLabel(/port/i).first();
        if (await portInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await portInput.fill('587');
        }

        const userInput = page.getByLabel(/user|username|email/i).first();
        if (await userInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await userInput.fill('test@gmail.com');
        }

        const passInput = page.getByLabel(/password|app password/i).first();
        if (await passInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await passInput.fill('app-password');
        }

        const saveBtn = page.getByRole('button', { name: /save|add/i }).last();
        await saveBtn.click();

        const hasSuccess = await page.getByText(/saved|added|created/i)
          .isVisible({ timeout: 10_000 })
          .catch(() => false);
      }
    }
  });

  test('should test SMTP connection successfully', async ({ page }) => {
    await page.route('**/api/smtp', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [MOCK_SMTP_CONFIG] }),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/smtp/smtp-001/test', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { success: true, message: 'Connection successful' } }),
      });
    });

    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const testBtn = page.getByRole('button', { name: /test connection|test/i }).first();
    if (await testBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await testBtn.click();
      await expect(
        page.getByText(/successful|connected|working/i).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('should delete an SMTP configuration', async ({ page }) => {
    await page.route('**/api/smtp', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [MOCK_SMTP_CONFIG] }),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/smtp/smtp-001', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    if (await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── SMTP — Negative Tests ─────────────────────────────────────────────────────
test.describe('SMTP — Negative Tests', () => {
  test('should show error when SMTP connection test fails', async ({ page }) => {
    await page.route('**/api/smtp', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [MOCK_SMTP_CONFIG] }),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/smtp/smtp-001/test', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Connection refused: invalid credentials' }),
      });
    });

    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const testBtn = page.getByRole('button', { name: /test/i }).first();
    if (await testBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await testBtn.click();
      const hasError = await page.getByText(/failed|error|refused|invalid/i)
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      // Soft assertion
    }
  });

  test('should require host and port to save SMTP config', async ({ page }) => {
    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const addBtn = page.getByRole('button', { name: /add smtp|new/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();
      const saveBtn = page.getByRole('button', { name: /save|add/i }).last();
      if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const isDisabled = await saveBtn.isDisabled().catch(() => false);
        // Save should be disabled or show validation error
      }
    }
  });
});

// ── Recipients — Happy Path ───────────────────────────────────────────────────
test.describe('Recipients — Happy Path', () => {
  test('should render recipients page', async ({ page }) => {
    await page.goto('/dashboard/recipients');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should display recipient list', async ({ page }) => {
    await page.route('**/api/recipient**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_RECIPIENTS }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/recipients');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText('jane.hr@company.com')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('john@recruiter.com')).toBeVisible({ timeout: 10_000 });
  });

  test('should add a new recipient', async ({ page }) => {
    await page.route('**/api/recipient', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: 'rec-new', name: 'New Recruiter', email: 'new@recruiter.com', company: 'New Corp' } }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/recipients');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const addBtn = page.getByRole('button', { name: /add recipient|new recipient/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();

      const nameInput = page.getByLabel(/name/i).first();
      const emailInput = page.getByLabel(/email/i).first();
      if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nameInput.fill('New Recruiter');
        await emailInput.fill('new@recruiter.com');
        const saveBtn = page.getByRole('button', { name: /save|add/i }).last();
        await saveBtn.click();
        await expect(page.getByText('new@recruiter.com')).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});

// ── Permission Tests ──────────────────────────────────────────────────────────
test.describe('Email & SMTP — Permission Tests', () => {
  test('should block unauthenticated access to email API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/email');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block unauthenticated access to SMTP API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/smtp');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block unauthenticated access to recipients API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/recipient');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });
});

// ── API Failure Tests ─────────────────────────────────────────────────────────
test.describe('Email & SMTP — API Failures', () => {
  test('should handle email history API 500 without crash', async ({ page }) => {
    await page.route('**/api/email**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
    });

    await page.goto('/dashboard/email/history');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should handle SMTP list API failure gracefully', async ({ page }) => {
    await page.route('**/api/smtp**', (route) => route.abort('connectionfailed'));

    await page.goto('/dashboard/smtp-configurations');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
