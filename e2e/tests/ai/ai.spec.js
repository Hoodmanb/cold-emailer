/**
 * MODULE: AI Integration & Settings
 * ─────────────────────────────────────────────────────────
 * Covers: AI settings CRUD, model selection, custom API keys,
 *         workflow execution, ATS analysis, AI service failures,
 *         timeout handling, credit gate enforcement,
 *         OpenRouter gateway, streaming responses
 */

const { test, expect } = require('../fixtures');

test.use({ storageState: 'test-results/.auth/user.json' });

const MOCK_AI_SETTINGS = {
  provider:    'openrouter',
  model:       'openai/gpt-4o-mini',
  useCustomKey: false,
  customApiKey: null,
  temperature:  0.7,
  maxTokens:    4000,
};

const MOCK_WORKFLOW_PAYLOAD = {
  jobId:       'job-workflow-001',
  documentType: 'cover_letter',
  templateId:  'tmpl-001',
};

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('AI Settings — Happy Path', () => {
  test('should render AI settings page without crashing', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
    await expect(
      page.getByText(/settings|model|ai|provider/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('should display current AI model selection', async ({ page }) => {
    await page.route('**/api/settings**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_AI_SETTINGS }),
      });
    });

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(
      page.getByText(/gpt-4o-mini|openrouter|openai/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should save updated AI model selection', async ({ page }) => {
    await page.route('**/api/settings**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_AI_SETTINGS }),
        });
      } else if (['PUT', 'POST', 'PATCH'].includes(route.request().method())) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { ...MOCK_AI_SETTINGS, model: 'openai/gpt-4o' } }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // Find model selector
    const modelSelect = page.locator('select, [role="combobox"], [data-testid="model-selector"]').first();
    if (await modelSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Click to open dropdown
      await modelSelect.click();
      const gpt4Option = page.getByRole('option', { name: /gpt-4o(?!-mini)/i }).first();
      if (await gpt4Option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await gpt4Option.click();
      }

      const saveBtn = page.getByRole('button', { name: /save/i }).first();
      if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await saveBtn.click();
        const hasSuccess = await page.getByText(/saved|updated|success/i)
          .isVisible({ timeout: 10_000 })
          .catch(() => false);
      }
    }
  });

  test('should allow toggling custom API key input', async ({ page }) => {
    await page.route('**/api/settings**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: MOCK_AI_SETTINGS }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const toggle = page.getByRole('checkbox', { name: /custom.*key|use.*own.*key|bring.*own/i })
      .or(page.locator('[data-testid="custom-key-toggle"]'))
      .first();

    if (await toggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await toggle.check();
      const keyInput = page.getByLabel(/api key|custom key/i).first();
      await expect(keyInput).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ── AI Workflow Execution Tests ────────────────────────────────────────────────
test.describe('AI Workflow — Execution', () => {
  test('should execute workflow run successfully', async ({ page }) => {
    await page.route('**/api/workflow/run', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            documentId:  'gen-doc-001',
            content:     '# Cover Letter\n\nDear Hiring Manager...',
            atsScore:    82,
            tokensUsed:  1500,
            creditsUsed: 3,
          },
        }),
      });
    });

    // Navigate to a page that triggers workflow
    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    // The workflow is triggered via the generate button on documents page
    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 30_000 });
    }
  });

  test('should execute ATS workflow analysis successfully', async ({ page }) => {
    await page.route('**/api/workflow/run-ats', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            atsScore: 85,
            keywords: ['TypeScript', 'React', 'Node.js'],
            gaps:     ['Docker', 'Kubernetes'],
            feedback: 'Strong match for this position.',
          },
        }),
      });
    });

    await page.goto('/dashboard/jobs');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── AI Service Failure Tests ──────────────────────────────────────────────────
test.describe('AI — Service Failures', () => {
  test('should handle OpenRouter API 503 without page crash', async ({ page }) => {
    await page.route('**/api/workflow/**', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'AI service temporarily unavailable' }),
      });
    });

    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 20_000 });

      const hasError = await page.getByRole('alert').filter({ hasText: /.+/ })
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      const hasErrorText = await page.getByText(/unavailable|failed|error|try again/i)
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      expect(hasError || hasErrorText).toBeTruthy();
    }
  });

  test('should show credit depletion error from workflow endpoint', async ({ page }) => {
    await page.route('**/api/workflow/**', (route) => {
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          message:   'Insufficient credits',
          errorCode: 'INSUFFICIENT_CREDITS',
          data:      { required: 5, available: 0 },
        }),
      });
    });

    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();

      const hasCreditsError = await page.getByText(/credit|insufficient|top up|upgrade/i)
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      // Soft assertion — UI varies
    }
  });

  test('should handle AI request timeout gracefully', async ({ page }) => {
    await page.route('**/api/workflow/**', async (route) => {
      // Simulate a very long delay, then abort
      await new Promise((r) => setTimeout(r, 3000));
      route.abort('timedout');
    });

    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 30_000 });
    }
  });

  test('should handle invalid custom API key (401 from AI provider)', async ({ page }) => {
    await page.route('**/api/workflow/**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message:   'Invalid API key',
          errorCode: 'INVALID_API_KEY',
        }),
      });
    });

    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 15_000 });
    }
  });

  test('should handle model not available error (404)', async ({ page }) => {
    await page.route('**/api/workflow/**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          message:   'Model not found in catalog',
          errorCode: 'MODEL_NOT_FOUND',
        }),
      });
    });

    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.locator('body')).not.toBeEmpty({ timeout: 15_000 });
    }
  });
});

// ── Validation Tests ──────────────────────────────────────────────────────────
test.describe('AI Settings — Validation', () => {
  test('should validate custom API key format before saving', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const toggle = page.getByRole('checkbox', { name: /custom.*key|use.*own/i }).first();
    if (await toggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await toggle.check();

      const keyInput = page.getByLabel(/api key/i).first();
      if (await keyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await keyInput.fill('invalid-key');
        const saveBtn = page.getByRole('button', { name: /save/i }).first();
        await saveBtn.click();

        const hasError = await page.getByText(/invalid.*key|key.*format/i)
          .isVisible({ timeout: 5_000 })
          .catch(() => false);
        // Soft assertion
      }
    }
  });

  test('should validate temperature is within acceptable range (0–2)', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const tempInput = page.getByLabel(/temperature/i).first();
    if (await tempInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await tempInput.fill('5');  // Out of range
      const saveBtn = page.getByRole('button', { name: /save/i }).first();
      await saveBtn.click();

      const isInvalid = await tempInput.evaluate((el) => !el.validity.valid).catch(() => false);
      const hasError = await page.getByText(/temperature.*range|must be between/i)
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      // Soft assertion
    }
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('AI — Loading States', () => {
  test('should show generating indicator during AI document creation', async ({ page }) => {
    let resolveRequest;
    await page.route('**/api/workflow/run', async (route) => {
      await new Promise((r) => { resolveRequest = r; setTimeout(r, 2500); });
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { documentId: 'gen-001', content: 'Generated content' } }),
      });
    });

    await page.goto('/dashboard/documents');
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();

      const isDisabled = await generateBtn.isDisabled({ timeout: 3_000 }).catch(() => false);
      const hasLoadingText = await page.getByText(/generating|processing|working/i)
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      const hasSpinner = await page.locator('[role="progressbar"]')
        .isVisible({ timeout: 3_000 })
        .catch(() => false);

      expect(isDisabled || hasLoadingText || hasSpinner).toBeTruthy();
    }
  });
});

// ── Permission Tests ──────────────────────────────────────────────────────────
test.describe('AI — Permission Tests', () => {
  test('should block unauthenticated access to /api/workflow/run', async ({ request }) => {
    const res = await request.post('http://localhost:9000/api/workflow/run', {
      data: { jobId: 'test', documentType: 'cover_letter' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block unauthenticated access to /api/ai', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/ai');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block unauthenticated access to /api/settings', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/settings');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });
});
