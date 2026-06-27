/**
 * Page Object Models (POM)
 * ─────────────────────────
 * Each class encapsulates selectors + actions for a specific page/module.
 * Tests import and use these instead of raw selectors.
 */

const { expect } = require('@playwright/test');

// ── Base Page ─────────────────────────────────────────────────────────────────
class BasePage {
  constructor(page) {
    this.page = page;
  }

  async waitForReady() {
    await this.page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  }

  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `test-results/artifacts/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  async getSnackbarMessage() {
    const snackbar = this.page.locator('[role="alert"]').first();
    await snackbar.waitFor({ state: 'visible', timeout: 10_000 });
    return snackbar.textContent();
  }
}

// ── Landing Page ──────────────────────────────────────────────────────────────
class LandingPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = '/';
    this.navPricingBtn  = page.getByRole('button', { name: /pricing/i });
    this.navDashBtn     = page.getByRole('button', { name: /dashboard/i });
    this.heroSection    = page.locator('#hero, [data-testid="hero-section"]').first();
    this.faqSection     = page.locator('#faq, [data-testid="faq-section"]').first();
    this.footerEl       = page.locator('footer');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  async clickPricing() {
    await this.navPricingBtn.click();
    await this.page.waitForURL('**/pricing', { timeout: 10_000 });
  }

  async clickDashboard() {
    await this.navDashBtn.click();
  }
}

// ── Auth Pages ────────────────────────────────────────────────────────────────
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.url          = '/login';
    this.emailInput   = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitBtn    = page.getByRole('button', { name: /^login$/i });
    this.errorAlert   = page.getByRole('alert').filter({ hasText: /.+/ });
    this.signupLink   = page.getByRole('link', { name: /create one/i });
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }

  async loginAndWaitForDashboard(email, password) {
    await this.login(email, password);
    await this.page.waitForURL('**/dashboard', { timeout: 30_000 });
  }

  async getErrorText() {
    await this.errorAlert.waitFor({ state: 'visible', timeout: 5_000 });
    return this.errorAlert.textContent();
  }
}

class SignupPage extends BasePage {
  constructor(page) {
    super(page);
    this.url           = '/signup';
    this.nameInput     = page.getByLabel(/name/i);
    this.emailInput    = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitBtn     = page.getByRole('button', { name: /signup/i });
    this.errorAlert    = page.getByRole('alert').filter({ hasText: /.+/ });
    this.loginLink     = page.getByRole('link', { name: /login/i });
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  async signup(name, email, password) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.url            = '/dashboard';
    this.pageTitle      = page.getByText(/command center/i);
    this.totalJobs      = page.getByText(/total jobs/i).locator('..').locator('h5');
    this.docsGenerated  = page.getByText(/docs generated/i).locator('..').locator('h5');
    this.emailsSent     = page.getByText(/emails sent/i).locator('..').locator('h5');
    this.avgAtsScore    = page.getByText(/avg ats score/i).locator('..').locator('h5');
    this.emptyState     = page.getByText(/you don't have any jobs yet/i);
    this.recentActivity = page.getByText(/recent activity/i);
    this.aiInsights     = page.getByText(/ai insights/i);
    this.loadingSpinner = page.locator('[role="progressbar"]');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  async waitForMetrics() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15_000 });
  }
}

// ── Jobs Page ─────────────────────────────────────────────────────────────────
class JobsPage extends BasePage {
  constructor(page) {
    super(page);
    this.url          = '/dashboard/jobs';
    this.pageTitle    = page.getByText(/jobs & ats/i);
    this.addJobTitle  = page.getByRole('heading', { name: /add new job/i });
    this.titleInput   = page.getByLabel(/title/i).first();
    this.companyInput = page.getByLabel(/company/i).first();
    this.urlInput     = page.getByLabel(/url/i).first();
    this.descriptionInput = page.locator('textarea').first();
    this.addJobBtn    = page.getByRole('button', { name: /add job/i });
    this.emptyState   = page.getByText(/no jobs added yet/i);
    this.loadingSpinner = page.locator('[role="progressbar"]');
    this.errorAlert   = page.getByRole('alert').filter({ hasText: /.+/ });
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  async fillJobForm(job) {
    if (job.title)       await this.titleInput.fill(job.title);
    if (job.company)     await this.companyInput.fill(job.company);
    if (job.url)         await this.urlInput.fill(job.url);
    if (job.description) await this.descriptionInput.fill(job.description);
  }

  async submitJob(job) {
    await this.fillJobForm(job);
    await this.addJobBtn.click();
  }

  async getJobCards() {
    return this.page.locator('[data-testid="job-card"]').all();
  }

  async getJobCount() {
    const countText = await this.page.getByText(/your jobs \(\d+\)/i).textContent();
    const match = countText?.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async deleteFirstJob() {
    const deleteBtn = this.page.getByRole('button', { name: /delete/i }).first();
    await deleteBtn.click();
    // Confirm dialog if present
    const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
}

// ── Documents Page ─────────────────────────────────────────────────────────────
class DocumentsPage extends BasePage {
  constructor(page) {
    super(page);
    this.url         = '/dashboard/documents';
    this.pageTitle   = page.getByText(/documents|resume/i).first();
    this.generateBtn = page.getByRole('button', { name: /generate/i }).first();
    this.loadingSpinner = page.locator('[role="progressbar"]');
    this.emptyState  = page.getByText(/no documents|get started/i).first();
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }
}

// ── Profile Page ──────────────────────────────────────────────────────────────
class ProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.url              = '/dashboard/profile';
    this.fullNameInput    = page.getByLabel(/full name|name/i).first();
    this.emailInput       = page.getByLabel(/email/i).first();
    this.phoneInput       = page.getByLabel(/phone/i).first();
    this.locationInput    = page.getByLabel(/location/i).first();
    this.headlineInput    = page.getByLabel(/headline/i).first();
    this.saveBtn          = page.getByRole('button', { name: /save/i }).first();
    this.addSkillBtn      = page.getByRole('button', { name: /add skill/i });
    this.addProjectBtn    = page.getByRole('button', { name: /add project/i });
    this.loadingSpinner   = page.locator('[role="progressbar"]');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  async updateBasicInfo(profile) {
    if (profile.fullName) await this.fullNameInput.fill(profile.fullName);
    if (profile.phone)    await this.phoneInput.fill(profile.phone);
    if (profile.location) await this.locationInput.fill(profile.location);
    if (profile.headline) await this.headlineInput.fill(profile.headline);
    await this.saveBtn.click();
  }
}

// ── Billing Page ──────────────────────────────────────────────────────────────
class BillingPage extends BasePage {
  constructor(page) {
    super(page);
    this.url              = '/dashboard/billing';
    this.statusCard       = page.getByText(/billing status|plan/i).first();
    this.upgradeBtn       = page.getByRole('button', { name: /upgrade|buy credits/i }).first();
    this.transactionsList = page.getByText(/transaction|payment history/i).first();
    this.loadingSpinner   = page.locator('[role="progressbar"]');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }
}

// ── Admin Page ─────────────────────────────────────────────────────────────────
class AdminPage extends BasePage {
  constructor(page) {
    super(page);
    this.url           = '/dashboard/admin';
    this.usersTab      = page.getByRole('tab', { name: /users/i });
    this.billingTab    = page.getByRole('tab', { name: /billing/i });
    this.feedbackTab   = page.getByRole('tab', { name: /feedback/i });
    this.usersList     = page.locator('[data-testid="admin-users-list"]');
    this.loadingSpinner = page.locator('[role="progressbar"]');
    this.errorAlert    = page.getByRole('alert').filter({ hasText: /.+/ });
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }

  async gotoUsers() {
    await this.goto();
    await this.usersTab.click();
    await this.waitForReady();
  }
}

// ── Settings Page ─────────────────────────────────────────────────────────────
class SettingsPage extends BasePage {
  constructor(page) {
    super(page);
    this.url           = '/dashboard/settings';
    this.modelSelect   = page.locator('[data-testid="model-selector"], select').first();
    this.apiKeyInput   = page.getByLabel(/api key/i).first();
    this.saveBtn       = page.getByRole('button', { name: /save/i }).first();
    this.loadingSpinner = page.locator('[role="progressbar"]');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }
}

// ── Email Page ────────────────────────────────────────────────────────────────
class EmailPage extends BasePage {
  constructor(page) {
    super(page);
    this.url        = '/dashboard/email/history';
    this.pageTitle  = page.getByText(/email/i).first();
    this.historyTab = page.getByRole('tab', { name: /history/i });
    this.loadingSpinner = page.locator('[role="progressbar"]');
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForReady();
  }
}

module.exports = {
  BasePage,
  LandingPage,
  LoginPage,
  SignupPage,
  DashboardPage,
  JobsPage,
  DocumentsPage,
  ProfilePage,
  BillingPage,
  AdminPage,
  SettingsPage,
  EmailPage,
};
