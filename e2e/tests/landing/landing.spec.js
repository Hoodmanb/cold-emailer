/**
 * MODULE: Landing Page
 * ─────────────────────────────────────────────────────────
 * Covers: All landing page sections, navigation, CTAs, FAQ,
 *         social proof, public communication config display,
 *         responsive layout, API failures for public endpoints
 */

const { test, expect } = require('../fixtures');
const { LandingPage } = require('../pages');

// Landing page tests run WITHOUT authenticated session
test.use({ storageState: { cookies: [], origins: [] } });

// ── Happy Path ────────────────────────────────────────────────────────────────
test.describe('Landing — Happy Path', () => {
  test('should render landing page with CareerBot branding', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(page.getByText(/careerbot/i).first()).toBeVisible();
  });

  test('should display navigation bar with key links', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.navPricingBtn).toBeVisible();
    await expect(landing.navDashBtn).toBeVisible();
  });

  test('should navigate to /pricing when Pricing is clicked', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.navPricingBtn.click();
    await page.waitForURL('**/pricing', { timeout: 10_000 });
    await expect(page).toHaveURL(/pricing/);
  });

  test('should have a Hero section visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // The hero should contain a headline and CTA
    const heroHeadline = page.locator('h1, h2').first();
    await expect(heroHeadline).toBeVisible({ timeout: 10_000 });
  });

  test('should display FAQ section', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await page.getByText(/faq|frequently asked/i).first().scrollIntoViewIfNeeded();
    await expect(page.getByText(/faq|frequently asked/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should display footer with copyright notice', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.footerEl.scrollIntoViewIfNeeded();
    await expect(page.getByText(/careerbot.*all rights|copyright/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('should display footer links: Privacy, Terms, Contact', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.footerEl.scrollIntoViewIfNeeded();
    await expect(page.getByText(/privacy/i).first()).toBeVisible();
    await expect(page.getByText(/terms/i).first()).toBeVisible();
    await expect(page.getByText(/contact/i).first()).toBeVisible();
  });

  test('should display Contact & Support section when communication config is available', async ({ page }) => {
    await page.route('**/api/communication/public', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            supportEmail: { email: 'support@careerbot.test' },
            whatsapp:     { url: 'https://wa.me/12345678' },
            instagram:    { url: 'https://instagram.com/careerbot' },
          },
        }),
      });
    });

    const landing = new LandingPage(page);
    await landing.goto();

    await page.getByText(/support & feedback/i).scrollIntoViewIfNeeded();
    await expect(page.getByText(/support & feedback/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/email support/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/whatsapp/i)).toBeVisible({ timeout: 5_000 });
  });

  test('should not show unsupported channels that are not configured', async ({ page }) => {
    await page.route('**/api/communication/public', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            supportEmail: { email: 'support@careerbot.test' },
            // whatsapp and instagram omitted
          },
        }),
      });
    });

    const landing = new LandingPage(page);
    await landing.goto();

    const hasWhatsapp = await page.getByText(/whatsapp chat/i)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(hasWhatsapp).toBeFalsy();
  });

  test('should have correct page title', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ── Negative Tests ────────────────────────────────────────────────────────────
test.describe('Landing — Negative Tests', () => {
  test('should handle communication API failure gracefully', async ({ page }) => {
    await page.route('**/api/communication/public', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      });
    });

    const landing = new LandingPage(page);
    await landing.goto();

    // Page should still load even if communication config fails
    await expect(page.getByText(/careerbot/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should handle communication API network failure gracefully', async ({ page }) => {
    await page.route('**/api/communication/public', (route) => route.abort('connectionfailed'));

    const landing = new LandingPage(page);
    await landing.goto();

    await expect(page.getByText(/careerbot/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('should render gracefully when no communication config exists', async ({ page }) => {
    await page.route('**/api/communication/public', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });

    const landing = new LandingPage(page);
    await landing.goto();

    // Should still render the landing page
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ── Validation Tests ──────────────────────────────────────────────────────────
test.describe('Landing — Validation Tests', () => {
  test('should have no broken internal links in navigation', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // Collect all internal href links
    const links = await page.locator('a[href^="/"]').all();
    const brokenLinks = [];

    for (const link of links.slice(0, 10)) { // Check first 10 to keep test fast
      const href = await link.getAttribute('href');
      if (!href) continue;

      const res = await page.request.get(`http://localhost:3000${href}`).catch(() => null);
      if (res && res.status() >= 400) {
        brokenLinks.push(`${href} → ${res.status()}`);
      }
    }

    expect(brokenLinks).toHaveLength(0);
  });

  test('should pass basic accessibility checks (no missing alt text on images)', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    // Check images have alt text
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images — just ensure attribute exists
      expect(alt).not.toBeNull();
    }
  });
});

// ── Network Interruption Tests ────────────────────────────────────────────────
test.describe('Landing — Network Interruptions', () => {
  test('should render static content when offline', async ({ page, context }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await context.setOffline(true);
    await page.reload().catch(() => {});

    // Some static content should still be visible (cached)
    await expect(page.locator('body')).not.toBeEmpty();
    await context.setOffline(false);
  });
});

// ── Loading State Tests ───────────────────────────────────────────────────────
test.describe('Landing — Loading States', () => {
  test('should display content without long blank screen on slow connection', async ({ page }) => {
    // Throttle communication config endpoint
    await page.route('**/api/communication/public', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      route.continue();
    });

    const landing = new LandingPage(page);
    await landing.goto();

    // Core landing content should load before communication config resolves
    await expect(page.getByText(/careerbot/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
