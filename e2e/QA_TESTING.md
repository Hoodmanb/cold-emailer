# CareerBot — QA Testing Guide

> **Scope**: End-to-end Playwright test suite for the CareerBot application.
> Architecture: Next.js 16 (frontend on `:3000`) + Express.js (backend on `:9000`) + Supabase Auth + PostgreSQL.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Architecture](#test-architecture)
3. [Module Coverage Map](#module-coverage-map)
4. [Environment Setup](#environment-setup)
5. [Running Tests](#running-tests)
6. [Artifact Collection](#artifact-collection)
7. [Reports](#reports)
8. [Page Object Model (POM) Guide](#page-object-model-guide)
9. [Writing New Tests](#writing-new-tests)
10. [CI/CD Integration](#cicd-integration)
11. [Required Code Changes for Testability](#required-code-changes-for-testability)
12. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Navigate to the e2e directory
cd e2e

# 2. Install Playwright and browsers
npm install
npm run install

# 3. Copy and fill environment variables
cp .env.test.example .env.test.local
# Edit .env.test.local with real test credentials

# 4. Ensure both servers are running
#    Frontend:  cd fe && npm run dev        (port 3000)
#    Backend:   cd server && npm start      (port 9000)

# 5. Run the full suite
npm test

# 6. View HTML report
npm run report
```

---

## Test Architecture

```
e2e/
├── playwright.config.js          # Main config: browsers, timeouts, reporters, projects
├── package.json                  # npm scripts per module + global
├── .env.test.example             # Environment variable template
├── .gitignore
│
└── tests/
    ├── global.setup.js           # Auth bootstrap: logs in user + admin, saves sessions
    ├── fixtures.js               # Extended test object: authenticatedPage, apiContext,
    │                             # consoleLogs, networkErrors, factories, helpers
    ├── pages.js                  # Page Object Models for all pages
    │
    ├── auth/
    │   └── auth.spec.js          # Login, signup, logout, route guards, session persistence
    ├── landing/
    │   └── landing.spec.js       # Landing page sections, CTAs, communication config
    ├── dashboard/
    │   └── dashboard.spec.js     # Metrics, pipeline, activity, AI insights widgets
    ├── jobs/
    │   └── jobs.spec.js          # Job CRUD, ATS re-run, status transitions
    ├── documents/
    │   └── documents.spec.js     # Resume generation, AI gen, export/download, CRUD
    ├── profile/
    │   └── profile.spec.js       # Profile, skills, projects, certificates, preferences
    ├── billing/
    │   └── billing.spec.js       # Credit balance, transactions, Paystack flow
    ├── ai/
    │   └── ai.spec.js            # AI settings, model selection, workflow execution
    ├── admin/
    │   └── admin.spec.js         # User mgmt, credits, billing settings, moderation
    ├── email/
    │   └── email.spec.js         # Email history, SMTP CRUD, recipients, send flow
    ├── templates/
    │   └── templates.spec.js     # Email templates, document templates, schedules
    ├── audit/
    │   └── audit.spec.js         # Audit log display, filters, empty/error states
    └── api/
        └── api-smoke.spec.js     # Direct Express API: health, 401s, 404s, validation
```

### Authentication Strategy

The test suite uses **saved session state** to avoid repeated logins:

- `tests/global.setup.js` runs first and saves two sessions:
  - `test-results/.auth/user.json` — regular user (all non-admin modules)
  - `test-results/.auth/admin.json` — admin user (admin module only)
- Each project in `playwright.config.js` loads the appropriate session.
- Sessions are reused across all tests in a run — dramatically faster than per-test login.

### API Mocking Strategy

Tests use Playwright's **`page.route()`** to intercept network requests:

- **Happy path**: routes are not intercepted → real backend is used.
- **Error states**: routes are fulfilled with custom status codes (500, 402, 401).
- **Loading states**: routes add artificial delays before continuing.
- **Offline states**: `context.setOffline(true)` simulates network loss.

---

## Module Coverage Map

| Module      | Happy Path | Negative | Validation | Permission | API Failure | AI Failure | Loading | Empty State | Network |
| ----------- | :--------: | :------: | :--------: | :--------: | :---------: | :--------: | :-----: | :---------: | :-----: |
| Auth        |     ✅     |    ✅    |     ✅     |     ✅     |     ✅     |     —     |   ✅   |     —     |   —   |
| Landing     |     ✅     |    ✅    |     ✅     |     —     |     ✅     |     —     |   ✅   |     —     |   ✅   |
| Dashboard   |     ✅     |    —    |     —     |     —     |     ✅     |     —     |   ✅   |     ✅     |   ✅   |
| Jobs & ATS  |     ✅     |    ✅    |     ✅     |     ✅     |     ✅     |     ✅     |   ✅   |     ✅     |   ✅   |
| Documents   |     ✅     |    —    |     —     |     ✅     |     ✅     |     ✅     |   ✅   |     ✅     |   —   |
| Profile     |     ✅     |    —    |     ✅     |     ✅     |     ✅     |     —     |   ✅   |     ✅     |   —   |
| Billing     |     ✅     |    ✅    |     —     |     ✅     |     ✅     |     —     |   ✅   |     ✅     |   ✅   |
| AI/Settings |     ✅     |    —    |     ✅     |     ✅     |     ✅     |     ✅     |   ✅   |     —     |   —   |
| Admin       |     ✅     |    —    |     —     |     ✅     |     ✅     |     —     |   ✅   |     ✅     |   —   |
| Email/SMTP  |     ✅     |    ✅    |     ✅     |     ✅     |     ✅     |     —     |   —   |     ✅     |   —   |
| Templates   |     ✅     |    —    |     —     |     ✅     |     ✅     |     —     |   —   |     ✅     |   —   |
| Audit       |     ✅     |    —    |     —     |     ✅     |     ✅     |     —     |   ✅   |     ✅     |   —   |
| API Smoke   |     ✅     |    ✅    |     ✅     |     ✅     |     —     |     —     |   —   |     —     |   —   |

---

## Environment Setup

### Prerequisites

| Requirement | Version | Notes                                   |
| ----------- | ------- | --------------------------------------- |
| Node.js     | ≥ 18.x | Required for Playwright                 |
| Playwright  | ^1.49.0 | Installed via`npm install`            |
| Chromium    | Auto    | Installed via`npm run install`        |
| Frontend    | Running | `cd fe && npm run dev` on port 3000   |
| Backend     | Running | `cd server && npm start` on port 9000 |

### Test Users

You must create two dedicated test users in Supabase:

#### Regular User

```
Email:    e2e-user@careerbot.test
Password: E2eTestPassword123!
Role:     user
```

> Create via the Supabase dashboard → Authentication → Users → Invite User

#### Admin User

```
Email:    joshuadebravo@gmail.com  (already set as ADMIN_EMAIL in server/.env)
Password: <your admin password>
Role:     admin (automatically assigned by server on startup)
```

### Environment Variables

Copy `.env.test.example` to `.env.test.local` and fill in values:

```bash
cp .env.test.example .env.test.local
```

Key variables:

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL` | Frontend URL (default: http://localhost:3000) |
| `API_BASE_URL`         | Backend URL (default: http://localhost:9000)  |
| `E2E_USER_EMAIL`       | Regular test user email                       |
| `E2E_USER_PASSWORD`    | Regular test user password                    |
| `E2E_ADMIN_EMAIL`      | Admin test user email                         |
| `E2E_ADMIN_PASSWORD`   | Admin test user password                      |
| `E2E_USER_TOKEN`       | Bearer token for API-only tests (optional)    |

---

## Running Tests

### Full Suite

```bash
npm test                    # All tests, all modules, Chromium + Firefox + Mobile
```

### Per-Module (fastest for development)

```bash
npm run test:auth           # Authentication tests only
npm run test:dashboard      # Dashboard tests only
npm run test:jobs           # Jobs & ATS tests only
npm run test:documents      # Documents & Resume tests
npm run test:profile        # Profile management tests
npm run test:billing        # Billing & payments tests
npm run test:ai             # AI settings & workflow tests
npm run test:admin          # Admin panel tests (uses admin session)
npm run test:email          # Email & SMTP tests
npm run test:templates      # Templates & schedules tests
npm run test:landing        # Landing page tests
npm run test:audit          # Audit log tests
npm run test:api            # API smoke tests
```

### Smoke Suite (fast CI gate)

```bash
npm run test:smoke          # API health + landing + auth only (~2 min)
```

### Debug Mode

```bash
npm run test:debug          # Opens browser + Playwright Inspector
npm run test:ui             # Playwright UI mode (interactive test runner)
npm run test:headed         # Run tests with visible browser window
```

### Specific Test by Name

```bash
npx playwright test --grep "should create a new job"
npx playwright test --grep "Admin" tests/admin/
```

### Run in Specific Browser

```bash
npm run test:firefox        # Firefox only
npm run test:mobile         # Pixel 5 mobile viewport
npx playwright test --project=chromium
```

---

## Artifact Collection

All artifacts are saved under `test-results/`:

```
test-results/
├── .auth/
│   ├── user.json           # Saved regular user session (auto-generated)
│   └── admin.json          # Saved admin session (auto-generated)
├── artifacts/              # Screenshots, videos, traces on failure
│   ├── *.png               # Screenshots (only on failure)
│   ├── *.webm              # Videos (only on failure)
│   └── *.zip               # Playwright traces (only on failure)
├── html-report/            # Interactive HTML report
│   └── index.html
├── results.json            # Machine-readable JSON results
└── results.xml             # JUnit XML for CI systems
```

### Viewing Traces

On test failure, a `.zip` trace file is captured. View it with:

```bash
npx playwright show-trace test-results/artifacts/<test-name>/trace.zip
```

This shows a full timeline of all actions, network requests, console logs, and screenshots.

---

## Reports

### HTML Report (Interactive)

```bash
npm run report
# Opens http://localhost:9323 in your browser
```

Features:

- Filter by status (passed/failed/skipped)
- Click any test to see screenshots, videos, trace links
- Retry history for flaky tests

### JSON Report

Located at `test-results/results.json`. Useful for:

- Custom dashboards
- Slack/email notifications
- CI artifact parsing

### JUnit XML

Located at `test-results/results.xml`. Compatible with:

- GitHub Actions test summary
- Jenkins, CircleCI, GitLab CI

---

## Page Object Model Guide

All page objects are defined in [`tests/pages.js`](./tests/pages.js).

### Using a Page Object

```javascript
const { test } = require('../fixtures');
const { JobsPage } = require('../pages');
const { factories } = require('../fixtures');

test('should create a job', async ({ page }) => {
  const jobs = new JobsPage(page);
  await jobs.goto();

  await jobs.submitJob(factories.job());
  await expect(page.getByText('Senior Software Engineer')).toBeVisible();
});
```

### Available Page Objects

| Class             | URL                      | Key Methods                                                                             |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `LandingPage`   | `/`                    | `goto()`, `clickPricing()`, `clickDashboard()`                                    |
| `LoginPage`     | `/login`               | `goto()`, `login()`, `loginAndWaitForDashboard()`, `getErrorText()`             |
| `SignupPage`    | `/signup`              | `goto()`, `signup()`                                                                |
| `DashboardPage` | `/dashboard`           | `goto()`, `waitForMetrics()`                                                        |
| `JobsPage`      | `/dashboard/jobs`      | `goto()`, `fillJobForm()`, `submitJob()`, `deleteFirstJob()`, `getJobCount()` |
| `DocumentsPage` | `/dashboard/documents` | `goto()`                                                                              |
| `ProfilePage`   | `/dashboard/profile`   | `goto()`, `updateBasicInfo()`                                                       |
| `BillingPage`   | `/dashboard/billing`   | `goto()`                                                                              |
| `AdminPage`     | `/dashboard/admin`     | `goto()`, `gotoUsers()`                                                             |
| `SettingsPage`  | `/dashboard/settings`  | `goto()`                                                                              |
| `EmailPage`     | `/dashboard/email`     | `goto()`                                                                              |

### Data Factories

Pre-built test data objects in `fixtures.js`:

```javascript
const { factories } = require('../fixtures');

factories.job({ company: 'Custom Corp' })       // Job payload
factories.profile({ headline: 'CTO' })          // Profile payload
factories.skill({ name: 'Python' })             // Skill payload
factories.project({ name: 'My App' })           // Project payload
factories.smtpConfig({ host: 'smtp.gmail.com' })// SMTP config
```

---

## Writing New Tests

### Template for a New Module Test

```javascript
// tests/my-module/my-module.spec.js

const { test, expect } = require('../fixtures');
const { MyPage } = require('../pages');          // Add to pages.js if needed
const { factories } = require('../fixtures');

// Set session — always include this
test.use({ storageState: 'test-results/.auth/user.json' });

// ── Happy Path ──────────────────────────────────────────────────────────────
test.describe('MyModule — Happy Path', () => {
  test('should load page without errors', async ({ page, consoleLogs }) => {
    await page.goto('/dashboard/my-module');
    await page.waitForLoadState('networkidle').catch(() => {});

    await expect(page.getByText(/my module/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ── API Failure ─────────────────────────────────────────────────────────────
test.describe('MyModule — API Failures', () => {
  test('should handle 500 error gracefully', async ({ page }) => {
    await page.route('**/api/my-endpoint**', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json',
                      body: JSON.stringify({ message: 'Error' }) });
    });

    await page.goto('/dashboard/my-module');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
```

### Rules for New Tests

1. **Always use `test.use({ storageState })` at the file level** — prevents unintended public access tests.
2. **Always use `await page.waitForLoadState('networkidle').catch(() => {})`** — `.catch` prevents timeout errors on pages with polling.
3. **Use `.catch(() => false)` on `.isVisible()` calls** — prevents flakiness when elements may not exist.
4. **Use `factories.*` for test data** — keeps data consistent and easy to change.
5. **Group by describe blocks** — one describe per test category (Happy Path, Negative, Validation, etc.).
6. **Mock at the route level, not the module level** — use `page.route()` inside individual tests.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Start Backend
        working-directory: server
        run: npm install && npm start &
        env:
          NODE_ENV: test

      - name: Start Frontend
        working-directory: fe
        run: npm install && npm run build && npm start &

      - name: Wait for servers
        run: npx wait-on http://localhost:3000 http://localhost:9000/api/ping

      - name: Install Playwright
        working-directory: e2e
        run: npm install && npm run install

      - name: Run E2E Tests
        working-directory: e2e
        run: npm run test:ci
        env:
          E2E_USER_EMAIL:    ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
          E2E_ADMIN_EMAIL:   ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          CI: true

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/test-results/
          retention-days: 30

      - name: Publish Test Summary
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Playwright Tests
          path: e2e/test-results/results.xml
          reporter: java-junit
```

---

## Required Code Changes for Testability

The following improvements to the application source code will significantly improve test reliability.
These are **recommended** — tests are designed to work even without them, but adding them reduces flakiness.

### 1. Add `data-testid` Attributes to Key Elements

Playwright can target by `data-testid` instead of fragile text/role selectors.

**Priority elements** (add to these components):

| Component         | File                         | Recommended`data-testid`       |
| ----------------- | ---------------------------- | -------------------------------- |
| Job card          | `JobCard.tsx`              | `data-testid="job-card"`       |
| Delete job button | `JobCard.tsx`              | `data-testid="delete-job-btn"` |
| Add job form      | `JobInputForm.tsx`         | `data-testid="add-job-form"`   |
| Generate button   | `DocumentsPage`            | `data-testid="generate-btn"`   |
| Model selector    | `SettingsPage`             | `data-testid="model-selector"` |
| Admin user row    | `AdminUsersTable`          | `data-testid="admin-user-row"` |
| Logout button     | `Sidebar` / `Navigation` | `data-testid="logout-btn"`     |
| Credit balance    | `BillingPage`              | `data-testid="credit-balance"` |
| ATS score display | `JobCard.tsx`              | `data-testid="ats-score"`      |

**Example implementation:**

```tsx
// Before
<Button onClick={handleDelete}>Delete</Button>

// After
<Button onClick={handleDelete} data-testid="delete-job-btn">Delete</Button>
```

### 2. Add `id` Attributes to Form Inputs

MUI TextField components need explicit `id` props so Playwright's `getByLabel()` works reliably:

```tsx
// Before
<TextField label="Email" type="email" value={email} onChange={...} />

// After
<TextField id="email-input" label="Email" type="email" value={email} onChange={...} />
```

**Apply to** all inputs in: `LoginPage`, `SignupPage`, `JobInputForm`, `ProfilePage`, `SmtpForm`.

### 3. Add Role Attribute to Error Alerts

Playwright's `getByRole('alert')` relies on `role="alert"` being present:

```tsx
// Before
{error && <Alert severity="error">{error}</Alert>}

// After  (MUI Alert already renders role="alert" — verify it in DevTools)
{error && <Alert severity="error" role="alert">{error}</Alert>}
```

### 4. Expose a Test API Route (`/api/test/seed`)

> **Only in non-production environments.**

Add a seeding endpoint to create and clean up test data programmatically:

```javascript
// server/routes/test.js (only loaded when NODE_ENV === 'test')
if (process.env.NODE_ENV === 'test') {
  app.post('/api/test/seed-job', requireAuth, async (req, res) => {
    // Create a job for the authenticated test user
  });
  app.delete('/api/test/cleanup', requireAuth, async (req, res) => {
    // Delete all test data for the authenticated user
  });
}
```

This allows tests to set up precise state without relying on UI flows.

### 5. Add Loading State `aria` Attributes

Ensure loading spinners have `role="progressbar"` (MUI CircularProgress does this by default — verify):

```tsx
// MUI CircularProgress already has role="progressbar"
<CircularProgress />

// Custom spinners need it explicitly
<div role="progressbar" aria-label="Loading...">...</div>
```

### 6. Supabase Test Environment

For CI, create a **dedicated Supabase project** (free tier) with:

- Email confirmation **disabled** (so test users can sign up instantly)
- Pre-seeded test users via Supabase migration

---

## Troubleshooting

### "Session not found" / Auth redirect loops

**Cause**: `test-results/.auth/user.json` is stale or missing.

**Fix**:

```bash
# Delete saved sessions and re-run setup
rm -rf test-results/.auth
npx playwright test tests/global.setup.js
```

### "Timeout waiting for /dashboard" during login

**Cause**: Supabase auth is slow or the email is not confirmed.

**Fix**:

1. Check Supabase dashboard → Authentication → Users → verify user is confirmed.
2. Increase timeout in `global.setup.js` (currently 30s).
3. Check `server` logs for auth errors.

### Tests pass locally but fail in CI

**Cause**: Race conditions on slower CI machines.

**Fix**: Increase timeouts in `playwright.config.js`:

```javascript
timeout: 90_000,           // Increase from 60s
actionTimeout: 20_000,     // Increase from 15s
```

### Admin tests fail with "Access Denied"

**Cause**: The admin email in `E2E_ADMIN_EMAIL` doesn't match `ADMIN_EMAIL` in `server/.env`.

**Fix**: Ensure both match exactly:

```bash
# server/.env
ADMIN_EMAIL=joshuadebravo@gmail.com

# e2e/.env.test.local
E2E_ADMIN_EMAIL=joshuadebravo@gmail.com
```

### "Element not found" for MUI components

**Cause**: MUI renders complex DOM — Playwright's `getByLabel()` needs matching `id` on the input.

**Fix**: Add `id` prop to the `TextField`:

```tsx
<TextField id="login-email" label="Email" ... />
```

Then query:

```javascript
page.locator('#login-email')  // More reliable than getByLabel()
```

### Video / Screenshot not capturing

**Cause**: `outputDir` not created before test run.

**Fix**: The directory is auto-created by Playwright. If not, run:

```bash
mkdir -p test-results/artifacts
```

---

## Quick Reference

```bash
# Run all tests
npm test

# Debug a failing test
npm run test:debug -- --grep "test name"

# Run only one module
npm run test:jobs

# Run smoke suite for PR gate
npm run test:smoke

# Open interactive HTML report
npm run report

# Install browsers
npm run install
```

---

*Generated by Antigravity — CareerBot QA Automation Suite v1.0*
