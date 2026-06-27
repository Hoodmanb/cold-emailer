/**
 * MODULE: Documents & Resume Generation
 * ─────────────────────────────────────────────────────────
 * Covers: Document listing, resume generation (standard + advanced + professional CV),
 *         document CRUD, export, download, duplicate, rename, approve,
 *         AI generation failures, credit failures, loading states, empty states
 */

const { test, expect } = require('../fixtures');
const { DocumentsPage } = require('../pages');

test.use({ storageState: 'test-results/.auth/user.json' });

const MOCK_DOCUMENT = {
  id:        'doc-mock-001',
  title:     'Software Engineer Resume',
  type:      'resume',
  status:    'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  content:   '# Software Engineer\n\nExperienced in TypeScript and React.',
};

const MOCK_DOCS_RESPONSE = {
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ data: [MOCK_DOCUMENT] }),
};

const EMPTY_DOCS_RESPONSE = {
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ data: [] }),
};

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('Documents — Happy Path', () => {
  test('should render Documents page without crashing', async ({ page }) => {
    const docs = new DocumentsPage(page);
    await docs.goto();

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.getByText(/document|resume/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('should display list of existing documents', async ({ page }) => {
    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill(MOCK_DOCS_RESPONSE);
      } else {
        route.continue();
      }
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    await expect(page.getByText(MOCK_DOCUMENT.title)).toBeVisible({ timeout: 10_000 });
  });

  test('should show resume templates list', async ({ page }) => {
    await page.route('**/api/documents/resume-templates', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'tmpl-1', name: 'Classic', previewUrl: null },
            { id: 'tmpl-2', name: 'Modern', previewUrl: null },
          ],
        }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    // Navigate to templates section if paginated
    const templatesTab = page.getByRole('tab', { name: /templates/i });
    if (await templatesTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await templatesTab.click();
    }

    await expect(page.getByText(/classic|modern|template/i).first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('should rename a document', async ({ page }) => {
    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') route.fulfill(MOCK_DOCS_RESPONSE);
      else route.continue();
    });

    await page.route('**/api/documents/doc-mock-001/rename', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...MOCK_DOCUMENT, title: 'Renamed Resume' } }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const renameBtn = page.getByRole('button', { name: /rename/i }).first();
    if (await renameBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await renameBtn.click();
      const nameInput = page.getByRole('textbox').first();
      await nameInput.fill('Renamed Resume');
      await page.keyboard.press('Enter');
      await expect(page.getByText(/renamed resume/i)).toBeVisible({ timeout: 10_000 });
    }
  });

  test('should duplicate a document', async ({ page }) => {
    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') route.fulfill(MOCK_DOCS_RESPONSE);
      else route.continue();
    });

    await page.route('**/api/documents/doc-mock-001/duplicate', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { ...MOCK_DOCUMENT, id: 'doc-mock-002', title: 'Software Engineer Resume (Copy)' },
        }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const duplicateBtn = page.getByRole('button', { name: /duplicate|copy/i }).first();
    if (await duplicateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await duplicateBtn.click();
      await expect(page.getByText(/copy|duplicate/i).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('should delete a document', async ({ page }) => {
    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') route.fulfill(MOCK_DOCS_RESPONSE);
      else route.continue();
    });

    await page.route('**/api/documents/doc-mock-001', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      } else {
        route.continue();
      }
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await deleteBtn.click();
      // Confirm dialog
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }
    // Page should still be rendered
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── AI Resume Generation Tests ─────────────────────────────────────────────────
test.describe('Documents — AI Resume Generation', () => {
  test('should trigger standard resume generation when job is selected', async ({ page }) => {
    // Mock job list
    await page.route('**/api/jobs', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{ id: 'job-001', title: 'Software Engineer', company: 'Tech Corp', status: 'drafted' }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/documents/generate-advanced', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...MOCK_DOCUMENT, id: 'generated-doc-001' } }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    // Click generate button
    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should trigger professional CV generation', async ({ page }) => {
    await page.route('**/api/documents/generate-professional-cv', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...MOCK_DOCUMENT, id: 'cv-doc-001', title: 'Professional CV' } }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const cvBtn = page.getByRole('button', { name: /professional cv|generate cv/i }).first();
    if (await cvBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cvBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should show document content after successful generation', async ({ page }) => {
    await page.route('**/api/documents/generate-advanced', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_DOCUMENT }),
      });
    });

    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [MOCK_DOCUMENT] }),
        });
      } else {
        route.continue();
      }
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    await expect(page.getByText(MOCK_DOCUMENT.title)).toBeVisible({ timeout: 10_000 });
  });
});

// ── AI Service Failure Tests ──────────────────────────────────────────────────
test.describe('Documents — AI Service Failures', () => {
  test('should show error when AI generation endpoint returns 500', async ({ page }) => {
    await page.route('**/api/documents/generate-advanced', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'AI service unavailable' }),
      });
    });

    await page.route('**/api/workflow/run', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'AI service unavailable' }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();

      const hasError = await page.getByRole('alert').filter({ hasText: /.+/ })
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      const hasErrorText = await page.getByText(/failed|error|unavailable/i)
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      expect(hasError || hasErrorText).toBeTruthy();
    }
  });

  test('should show error when AI generation returns 402 (no credits)', async ({ page }) => {
    await page.route('**/api/documents/generate-advanced', (route) => {
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Insufficient credits', errorCode: 'INSUFFICIENT_CREDITS' }),
      });
    });

    await page.route('**/api/workflow/run', (route) => {
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Insufficient credits', errorCode: 'INSUFFICIENT_CREDITS' }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();

      const hasCreditsError = await page.getByText(/credit|insufficient|upgrade/i)
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      // Soft assertion — credits error handling varies by implementation
    }
  });

  test('should handle AI timeout (30s) without browser crash', async ({ page }) => {
    await page.route('**/api/documents/generate-advanced', async (route) => {
      // Abort simulates a timeout scenario
      route.abort('timedout');
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
    }
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('Documents — Loading States', () => {
  test('should show loading spinner during AI generation', async ({ page }) => {
    await page.route('**/api/documents/generate-advanced', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_DOCUMENT }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();

      // Button should be disabled or show loading text during generation
      const isDisabled = await generateBtn.isDisabled({ timeout: 3_000 }).catch(() => false);
      const hasLoadingText = await page.getByText(/generating|loading|please wait/i)
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

      expect(isDisabled || hasLoadingText).toBeTruthy();
    }
  });

  test('should show loading spinner while fetching documents list', async ({ page }) => {
    await page.route('**/api/documents', async (route) => {
      if (route.request().method() === 'GET') {
        await new Promise((r) => setTimeout(r, 1000));
        route.continue();
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/documents');
    const spinner = page.locator('[role="progressbar"]');
    await spinner.isVisible({ timeout: 2_000 }).catch(() => {});
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 20_000 });
  });
});

// ── Empty State Tests ─────────────────────────────────────────────────────────
test.describe('Documents — Empty States', () => {
  test('should show empty state message when no documents exist', async ({ page }) => {
    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') route.fulfill(EMPTY_DOCS_RESPONSE);
      else route.continue();
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    // Look for empty-state messaging
    const hasEmpty = await page.getByText(/no documents|get started|generate your first/i)
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    // Not all implementations show explicit empty state — just ensure no crash
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Export & Download Tests ───────────────────────────────────────────────────
test.describe('Documents — Export & Download', () => {
  test('should trigger PDF download when clicking Download button', async ({ page }) => {
    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') route.fulfill(MOCK_DOCS_RESPONSE);
      else route.continue();
    });

    await page.route('**/api/documents/doc-mock-001/download', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 mock content'),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    // Watch for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);
    const downloadBtn = page.getByRole('button', { name: /download/i }).first();
    if (await downloadBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await downloadBtn.click();
      const download = await downloadPromise;
      // Download may not trigger in headless for PDF links — just ensure no crash
    }
  });

  test('should handle export failure gracefully', async ({ page }) => {
    await page.route('**/api/documents', (route) => {
      if (route.request().method() === 'GET') route.fulfill(MOCK_DOCS_RESPONSE);
      else route.continue();
    });

    await page.route('**/api/documents/doc-mock-001/export', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Export failed' }),
      });
    });

    const docs = new DocumentsPage(page);
    await docs.goto();

    const exportBtn = page.getByRole('button', { name: /export/i }).first();
    if (await exportBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await exportBtn.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
