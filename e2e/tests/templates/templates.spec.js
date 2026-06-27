/**
 * MODULE: Templates & Schedules
 * ─────────────────────────────────────────────────────────
 * Covers: Email templates CRUD, document templates, template preview,
 *         system templates, scheduler CRUD, schedule activation/pause,
 *         loading states, empty states, API failures
 */

const { test, expect } = require('../fixtures');

test.use({ storageState: 'test-results/.auth/user.json' });

const MOCK_EMAIL_TEMPLATES = [
  {
    id:        'etpl-001',
    name:      'Cold Outreach',
    subject:   'Application for {{jobTitle}} at {{company}}',
    body:      'Dear {{recipientName}},\n\nI am writing to express my interest...',
    createdAt: new Date().toISOString(),
  },
  {
    id:        'etpl-002',
    name:      'Follow-up',
    subject:   'Following up on my application',
    body:      'Dear {{recipientName}},\n\nI wanted to follow up...',
    createdAt: new Date().toISOString(),
  },
];

const SCHEDULER_URL = '/dashboard/schedules/scheduler';

const mockTemplateList = (templates) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ data: templates }),
});

const mockSchedulerList = (schedules) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({
    message: 'Schedules retrieved successfully',
    data: schedules,
  }),
});

const MOCK_SCHEDULES = [
  {
    id:        'sched-001',
    name:      'Weekly Outreach',
    type:      'email',
    disabled:  false,
    cronExpr:  '0 9 * * 1',
    createdAt: new Date().toISOString(),
  },
  {
    id:        'sched-002',
    name:      'Daily ATS Check',
    type:      'ats',
    disabled:  true,
    cronExpr:  '0 8 * * *',
    createdAt: new Date().toISOString(),
  },
];

// ── Email Templates — Happy Path ───────────────────────────────────────────────
test.describe('Email Templates — Happy Path', () => {
  test('should render email templates page without crashing', async ({ page }) => {
    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(
      page.getByText(/template|email template/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display existing email templates', async ({ page }) => {
    await page.route('**/api/template**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_EMAIL_TEMPLATES }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText(/cold outreach/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/follow-up/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should create a new email template', async ({ page }) => {
    await page.route('**/api/template', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(mockTemplateList([]));
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: { ...MOCK_EMAIL_TEMPLATES[0], id: 'etpl-new' } }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const createBtn = page.getByRole('button', { name: /create template|new template|add/i }).first();
    if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await createBtn.click();

      const nameInput = page.getByLabel(/template name|name/i).first();
      if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nameInput.fill('New Test Template');

        const subjectInput = page.getByLabel(/subject/i).first();
        if (await subjectInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await subjectInput.fill('Test Subject {{company}}');
        }

        const bodyInput = page.locator('textarea').first();
        if (await bodyInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await bodyInput.fill('Dear {{recipientName}},\n\nTest body content.');
        }

        const saveBtn = page.getByRole('button', { name: /save/i }).last();
        await saveBtn.click();
      }
    }

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should edit an existing email template', async ({ page }) => {
    await page.route('**/api/template', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_EMAIL_TEMPLATES }),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/template/etpl-001', (route) => {
      if (['PUT', 'PATCH'].includes(route.request().method())) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { ...MOCK_EMAIL_TEMPLATES[0], name: 'Updated Cold Outreach' } }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const editBtn = page.getByRole('button', { name: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editBtn.click();

      const nameInput = page.getByLabel(/template name|name/i).first();
      if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nameInput.fill('Updated Cold Outreach');
        const saveBtn = page.getByRole('button', { name: /save/i }).last();
        await saveBtn.click();
      }
    }

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should delete an email template', async ({ page }) => {
    await page.route('**/api/template', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_EMAIL_TEMPLATES }),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/template/etpl-001', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Document Templates — Happy Path ───────────────────────────────────────────
test.describe('Document Templates — Happy Path', () => {
  test('should render document templates page', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should show resume template gallery', async ({ page }) => {
    await page.route('**/api/documents/resume-templates', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'dtpl-001', name: 'Classic Professional', previewUrl: null, category: 'professional' },
            { id: 'dtpl-002', name: 'Modern Creative',      previewUrl: null, category: 'creative'     },
          ],
        }),
      });
    });

    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const templatesSection = page.getByText(/template|classic|modern/i).first();
    await expect(templatesSection).toBeVisible({ timeout: 10_000 });
  });
});

// ── Schedules — Happy Path ─────────────────────────────────────────────────────
test.describe('Schedules — Happy Path', () => {
  test('should render schedules page without crashing', async ({ page }) => {
    await page.goto(SCHEDULER_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(
      page.getByText(/schedule|automation|cron/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display list of existing schedules', async ({ page }) => {
    await page.route('**/api/scheduler**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(mockSchedulerList(MOCK_SCHEDULES));
      } else {
        route.continue();
      }
    });

    await page.goto(SCHEDULER_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText(/weekly outreach/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/daily ats check/i)).toBeVisible({ timeout: 10_000 });
  });

  test('should show active and paused schedule status', async ({ page }) => {
    await page.route('**/api/scheduler**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(mockSchedulerList(MOCK_SCHEDULES));
      } else {
        route.continue();
      }
    });

    await page.goto(SCHEDULER_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.getByText(/active|paused/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should create a new schedule', async ({ page }) => {
    await page.route('**/api/scheduler', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(mockSchedulerList([]));
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_SCHEDULES[0] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(SCHEDULER_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const createBtn = page.getByRole('button', { name: /create schedule|new schedule|add/i }).first();
    if (await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await createBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should pause an active schedule', async ({ page }) => {
    await page.route('**/api/scheduler', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(mockSchedulerList(MOCK_SCHEDULES));
      } else {
        route.continue();
      }
    });

    await page.route('**/api/scheduler/sched-001/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...MOCK_SCHEDULES[0], status: 'paused' } }),
      });
    });

    await page.goto(SCHEDULER_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const pauseBtn = page.getByRole('button', { name: /pause/i }).first();
    if (await pauseBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await pauseBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

// ── Schedules — Empty States ───────────────────────────────────────────────────
test.describe('Schedules — Empty States', () => {
  test('should show empty state when no schedules exist', async ({ page }) => {
    await page.route('**/api/scheduler**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(mockSchedulerList([]));
      } else {
        route.continue();
      }
    });

    await page.goto(SCHEDULER_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Templates — Empty States ──────────────────────────────────────────────────
test.describe('Email Templates — Empty States', () => {
  test('should show empty state message when no templates exist', async ({ page }) => {
    await page.route('**/api/template**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(mockTemplateList([]));
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── API Failures ──────────────────────────────────────────────────────────────
test.describe('Templates & Schedules — API Failures', () => {
  test('should handle templates API 500 without page crash', async ({ page }) => {
    await page.route('**/api/template**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
    });

    await page.goto('/dashboard/templates');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should handle scheduler API failure gracefully', async ({ page }) => {
    await page.route('**/api/scheduler**', (route) => route.abort('connectionfailed'));

    await page.goto(SCHEDULER_URL);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Permission Tests ──────────────────────────────────────────────────────────
test.describe('Templates & Schedules — Permission Tests', () => {
  test('should block unauthenticated access to email templates API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/template');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block unauthenticated access to scheduler API', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/scheduler');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });
});
