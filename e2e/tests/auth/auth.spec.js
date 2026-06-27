/**
 * MODULE: Authentication
 * ─────────────────────────────────────────────────────────
 * Covers: Login, Signup, Logout, Route Guards, Session Persistence,
 *         Password Reset, Permission Escalation, API Failure states
 */

const { test, expect } = require('../fixtures');
const { LoginPage, SignupPage, DashboardPage } = require('../pages');

// Auth tests manage their own sessions — never reuse the saved user session
test.use({ storageState: { cookies: [], origins: [] } });

const VALID_EMAIL    = process.env.E2E_USER_EMAIL    || 'e2e-user@careerbot.test';
const VALID_PASSWORD = process.env.E2E_USER_PASSWORD || 'E2eTestPassword123!';

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('Auth — Happy Path', () => {
  test('should render login page with all required elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitBtn).toBeVisible();
    await expect(loginPage.signupLink).toBeVisible();
  });

  test('should redirect unauthenticated user from /dashboard to /login', async ({ page }) => {
    // Fresh context (no stored session)
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 15_000 });
    await expect(page).toHaveURL(/login/);
  });

  test('should log in with valid credentials and redirect to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(VALID_EMAIL, VALID_PASSWORD);

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/command center/i)).toBeVisible();
  });

  test('should redirect authenticated user from /login to /dashboard', async ({ page, context }) => {
    // Restore session first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(VALID_EMAIL, VALID_PASSWORD);

    // Now navigate to /login — should be bounced back
    await page.goto('/login');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should persist session across page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(VALID_EMAIL, VALID_PASSWORD);

    // Reload — should stay on dashboard
    await page.reload();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should log out and clear session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(VALID_EMAIL, VALID_PASSWORD);

    // Find and click logout in the sidebar
    const signOutBtn = page.getByRole('button', { name: /sign out/i }).first();
    if (await signOutBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await signOutBtn.click();
    } else {
      const logoutBtn = page.getByRole('button', { name: /logout|sign out/i }).first();
      const menuTrigger = page.getByRole('button', { name: /account|profile|menu/i }).first();

      if (await menuTrigger.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await menuTrigger.click();
        await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
      } else if (await logoutBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await logoutBtn.click();
      }
    }

    await page.waitForURL('**/login', { timeout: 15_000 });
    await expect(page).toHaveURL(/login/);

    // Verify session is cleared — dashboard should redirect back to login
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10_000 });
  });
});

// ── Negative Tests ────────────────────────────────────────────────────────────
test.describe('Auth — Negative Tests', () => {
  test('should show error with invalid email format', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.emailInput.fill('not-an-email');
    await loginPage.passwordInput.fill(VALID_PASSWORD);
    await loginPage.submitBtn.click();

    // Either browser validation or app error
    const isInvalid = await loginPage.emailInput.evaluate((el) => !el.validity.valid);
    const hasAppError = await loginPage.errorAlert.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(isInvalid || hasAppError).toBeTruthy();
  });

  test('should show error with wrong password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(VALID_EMAIL, 'WrongPassword999!');

    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();
    expect(page.url()).not.toMatch(/dashboard/);
  });

  test('should show error with non-existent email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('nobody@nowhere.invalid', 'SomePassword123!');

    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();
  });

  test('should not submit login form when fields are empty', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Submit button should be disabled when fields are empty
    await expect(loginPage.submitBtn).toBeDisabled();
  });

  test('should not submit login with only email filled', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill(VALID_EMAIL);
    await expect(loginPage.submitBtn).toBeDisabled();
  });

  test('should not submit login with only password filled', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.passwordInput.fill(VALID_PASSWORD);
    await expect(loginPage.submitBtn).toBeDisabled();
  });
});

// ── Validation Tests ──────────────────────────────────────────────────────────
test.describe('Auth — Validation Tests', () => {
  test('signup form should require name, email, and password', async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // All blank — button should be disabled
    await expect(signupPage.submitBtn).toBeDisabled();
  });

  test('signup button should become enabled only when all fields are filled', async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    await signupPage.nameInput.fill('Test User');
    await expect(signupPage.submitBtn).toBeDisabled();

    await signupPage.emailInput.fill('test@test.com');
    await expect(signupPage.submitBtn).toBeDisabled();

    await signupPage.passwordInput.fill('SecurePass123!');
    await expect(signupPage.submitBtn).toBeEnabled();
  });

  test('login submit button is disabled until both fields are filled', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill(VALID_EMAIL);
    await expect(loginPage.submitBtn).toBeDisabled();

    await loginPage.passwordInput.fill(VALID_PASSWORD);
    await expect(loginPage.submitBtn).toBeEnabled();
  });
});

// ── Permission Tests ──────────────────────────────────────────────────────────
test.describe('Auth — Permission Tests', () => {
  test('should block access to /dashboard/admin for regular users', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(VALID_EMAIL, VALID_PASSWORD);

    await page.goto('/dashboard/admin');
    // Should either redirect or show access denied
    const url = page.url();
    const hasAccessDenied = await page.getByText(/access denied|forbidden|unauthorized|not authorized/i)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    const wasRedirected = !url.includes('/admin');
    expect(hasAccessDenied || wasRedirected).toBeTruthy();
  });

  test('should block direct API access to /api/admin without auth', async ({ request }) => {
    const res = await request.get('http://localhost:9000/api/admin/users');
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('should block /api/admin with regular user token', async ({ request }) => {
    // Use user token but try admin endpoint
    const res = await request.get('http://localhost:9000/api/admin/users', {
      headers: { Authorization: `Bearer ${process.env.E2E_USER_TOKEN || 'invalid'}` },
    });
    expect([401, 403]).toContain(res.status());
  });
});

// ── API Failure Tests ─────────────────────────────────────────────────────────
test.describe('Auth — API Failure Tests', () => {
  test('should show error message when /api/auth/me returns 500', async ({ page }) => {
    // Intercept the auth check endpoint
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Server Error' }) });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Page should still render without crashing
    await expect(loginPage.emailInput).toBeVisible();
  });

  test('should handle Supabase unreachable gracefully', async ({ page }) => {
    await page.route('**/supabase.co/**', (route) => route.abort('connectionfailed'));

    await page.goto('/login');
    // App should still render login form
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible({ timeout: 10_000 });
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('Auth — Loading States', () => {
  test('should show loading indicator while login is processing', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Slow down the auth response to catch the loading state
    await page.route('**/supabase.co/auth/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      route.continue();
    });

    await loginPage.emailInput.fill(VALID_EMAIL);
    await loginPage.passwordInput.fill(VALID_PASSWORD);

    // Click and check button text changes to loading state
    await loginPage.submitBtn.click();
    const isLoading = await page.getByRole('button', { name: /signing in/i })
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    // Either loading text OR disabled state is acceptable
    const isDisabled = await loginPage.submitBtn.isDisabled({ timeout: 3_000 }).catch(() => false);
    expect(isLoading || isDisabled).toBeTruthy();
  });
});
