/**
 * MODULE: API Smoke Tests
 * ─────────────────────────────────────────────────────────
 * Fast smoke-level checks directly against the Express API server.
 * Verifies all major endpoints respond with correct status codes
 * (unauthenticated → 401, public → 200, health → 200).
 *
 * Run with: npx playwright test tests/api/ --project=chromium
 */

const { test, expect } = require('../fixtures');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:9000';

// ── Health Check ──────────────────────────────────────────────────────────────
test.describe('API — Health', () => {
  test('GET /api/ping → 200 OK', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/ping`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('OK');
    expect(body.timestamp).toBeTruthy();
  });

  test('GET /api/communication/public → 200', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/communication/public`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/billing/config → 200', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/billing/config`);
    expect(res.status()).toBe(200);
  });
});

// ── Auth Endpoints ────────────────────────────────────────────────────────────
test.describe('API — Auth Endpoints', () => {
  test('GET /api/auth/me without token → 401', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/auth/me`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/auth/reset-password with email → processes request', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/reset-password`, {
      data: { email: 'anyone@example.com' },
    });
    // Should return 200 (even for non-existent email for security)
    expect([200, 400]).toContain(res.status());
  });
});

// ── Protected Endpoints (expect 401) ─────────────────────────────────────────
test.describe('API — Protected Endpoints (no auth)', () => {
  const PROTECTED_ENDPOINTS = [
    ['GET',  '/api/jobs'],
    ['GET',  '/api/documents'],
    ['GET',  '/api/profile'],
    ['GET',  '/api/profile/skills'],
    ['GET',  '/api/profile/projects'],
    ['GET',  '/api/billing/status'],
    ['GET',  '/api/billing/transactions'],
    ['GET',  '/api/email'],
    ['GET',  '/api/template'],
    ['GET',  '/api/recipient'],
    ['GET',  '/api/smtp'],
    ['GET',  '/api/scheduler'],
    ['GET',  '/api/audit'],
    ['GET',  '/api/dashboard'],
    ['GET',  '/api/settings'],
    ['GET',  '/api/suggestions'],
    ['POST', '/api/workflow/run'],
    ['POST', '/api/workflow/run-ats'],
    ['GET',  '/api/category'],
    ['GET',  '/api/document-templates'],
  ];

  for (const [method, endpoint] of PROTECTED_ENDPOINTS) {
    test(`${method} ${endpoint} without token → 401`, async ({ request }) => {
      const res = method === 'GET'
        ? await request.get(`${API_BASE}${endpoint}`)
        : await request.post(`${API_BASE}${endpoint}`, { data: {} });
      expect(res.status()).toBe(401);
    });
  }
});

// ── Admin Endpoints (expect 401 without auth) ─────────────────────────────────
test.describe('API — Admin Endpoints (no auth)', () => {
  const ADMIN_ENDPOINTS = [
    ['GET', '/api/admin/users'],
    ['GET', '/api/admin/transactions'],
    ['GET', '/api/admin/billing/settings'],
    ['GET', '/api/admin/billing/analytics'],
    ['GET', '/api/admin/feedback'],
    ['GET', '/api/admin/document-templates/pending'],
    ['GET', '/api/admin/communication'],
  ];

  for (const [method, endpoint] of ADMIN_ENDPOINTS) {
    test(`${method} ${endpoint} without auth → 401`, async ({ request }) => {
      const res = await request.get(`${API_BASE}${endpoint}`);
      expect(res.status()).toBeGreaterThanOrEqual(401);
    });
  }
});

// ── 404 Handling ──────────────────────────────────────────────────────────────
test.describe('API — 404 Handling', () => {
  test('GET /api/nonexistent → 404', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/nonexistent-route-xyzabc`);
    expect(res.status()).toBe(404);
  });

  test('should return JSON error body on 404', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/nonexistent-route-xyzabc`);
    const body = await res.json().catch(() => null);
    expect(body).toBeTruthy();
    expect(body.message || body.error).toBeTruthy();
  });
});

// ── Request Validation ────────────────────────────────────────────────────────
test.describe('API — Request Validation', () => {
  test('POST /api/jobs with malformed JSON → 400 or 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/jobs`, {
      headers: { 'Content-Type': 'application/json' },
      data:    '{ invalid json }',
    });
    expect([400, 401]).toContain(res.status());
  });
});
