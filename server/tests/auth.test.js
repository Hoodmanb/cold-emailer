// server/tests/auth.test.js
// Tests for authentication routes (signup, login, protected me)

import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../index.js';
import { before, beforeEach, after } from './_setup.js';

// Register global hooks
test.before(before);
test.beforeEach(beforeEach);
test.after(after);

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

let authToken = '';

test('signup creates a new user and returns JWT', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send(testUser)
    .expect(201);

  assert.ok(res.body.token, 'Token should be returned');
  assert.strictEqual(res.body.user.email, testUser.email);
  authToken = res.body.token;
});

test('login with correct credentials returns JWT', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: testUser.email, password: testUser.password })
    .expect(200);

  assert.ok(res.body.token, 'Token should be returned');
  assert.strictEqual(res.body.user.email, testUser.email);
});

test('protected /api/auth/me returns user info with valid token', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);

  assert.strictEqual(res.body.user.email, testUser.email);
});

test('protected /api/auth/me rejects missing token', async () => {
  await request(app).get('/api/auth/me').expect(401);
});
