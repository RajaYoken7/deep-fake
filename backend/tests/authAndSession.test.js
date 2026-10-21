import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { DetectionHistory } from '../models/DetectionHistory.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/tokenUtils.js';

let server;
let baseUrl;

async function setupServer() {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  const app = createApp();
  server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
}

test('Authentication, Session Management & RBAC Suite', async (t) => {
  await setupServer();

  const testSuffix = Math.random().toString(36).substring(2, 8);
  const testEmail = `testuser_${testSuffix}@example.com`;
  const testPassword = 'Password123!';
  let userAccessToken = '';
  let userRefreshTokenCookie = '';
  let createdUserId = '';

  t.after(async () => {
    // Cleanup created test documents
    try {
      if (createdUserId) {
        await User.deleteMany({ email: { $regex: testSuffix } });
        await RefreshToken.deleteMany({ userId: createdUserId });
        await DetectionHistory.deleteMany({ userId: createdUserId });
      }
      server.close();
      await mongoose.connection.close();
    } catch {
      // Ignore cleanup error
    }
  });

  await t.test('POST /api/auth/register creates user, returns token and httpOnly cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Cadet',
        email: testEmail,
        password: testPassword,
        role: 'ADMIN', // Should be ignored; role must default to USER
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, testEmail);
    assert.equal(body.data.user.role, 'USER'); // Privilege escalation strictly prevented
    assert.ok(body.data.accessToken);

    userAccessToken = body.data.accessToken;
    createdUserId = body.data.user.id;

    // Verify cookie was set
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected set-cookie header');
    assert.ok(setCookie.includes('refreshToken='), 'Expected refreshToken in cookie');
    assert.ok(setCookie.toLowerCase().includes('httponly'), 'Expected httpOnly cookie');

    userRefreshTokenCookie = setCookie.split(';')[0];
  });

  await t.test('POST /api/auth/register rejects duplicate email with 409', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Cadet',
        email: testEmail,
        password: testPassword,
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('POST /api/auth/register rejects short passwords with 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass',
        email: `short_${testSuffix}@example.com`,
        password: 'short',
      }),
    });

    assert.equal(res.status, 400);
  });

  await t.test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, testEmail);
    assert.ok(body.data.accessToken);

    userAccessToken = body.data.accessToken;
    const setCookie = res.headers.get('set-cookie');
    userRefreshTokenCookie = setCookie.split(';')[0];
  });

  await t.test('POST /api/auth/login rejects incorrect password with 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999',
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('GET /api/auth/me returns current authenticated user profile', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, testEmail);
  });

  await t.test('GET /api/auth/me rejects request without token with 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });

  await t.test('POST /api/auth/refresh rotates refresh token and issues new access token', async () => {
    const oldCookie = userRefreshTokenCookie;

    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: oldCookie },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);

    userAccessToken = body.data.accessToken;
    const newSetCookie = res.headers.get('set-cookie');
    assert.ok(newSetCookie);
    userRefreshTokenCookie = newSetCookie.split(';')[0];

    // Verify token was rotated: re-using the old cookie must trigger reuse detection or failure
    const reuseRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: oldCookie },
    });
    // Reuse should fail with 403 or 401
    assert.ok(reuseRes.status === 403 || reuseRes.status === 401);
  });

  await t.test('PUT /api/users/profile updates name and bio', async () => {
    // Re-login to get fresh valid session after reuse test
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginBody = await loginRes.json();
    userAccessToken = loginBody.data.accessToken;

    const res = await fetch(`${baseUrl}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAccessToken}`,
      },
      body: JSON.stringify({
        name: 'Updated Cadet Name',
        bio: 'Cybersecurity and deepfake analyst.',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.name, 'Updated Cadet Name');
    assert.equal(body.data.user.bio, 'Cybersecurity and deepfake analyst.');
  });

  await t.test('RBAC: Non-admin user is rejected from /api/admin/overview with 403', async () => {
    const res = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('RBAC: Admin user can access /api/admin/overview with 200', async () => {
    // Create an admin user directly in DB
    const adminEmail = `admin_${testSuffix}@example.com`;
    const adminUser = new User({
      name: 'System Admin',
      email: adminEmail,
      password: 'AdminPassword123!',
      role: 'ADMIN',
    });
    await adminUser.save();

    const adminToken = generateAccessToken(adminUser);

    const res = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.stats);

    await User.deleteOne({ _id: adminUser._id });
  });

  await t.test('POST /api/auth/logout clears refresh cookie and revokes session', async () => {
    // Login to get fresh cookie
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const setCookie = loginRes.headers.get('set-cookie');
    const cookie = setCookie.split(';')[0];

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    assert.equal(logoutRes.status, 200);

    // Refresh attempt with logged out cookie must fail
    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    assert.ok([401, 403].includes(refreshRes.status));
  });

  await t.test('GET /api/auth/sessions returns active sessions with current indicator', async () => {
    // Login to get a new session
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data.accessToken;
    const cookie = loginRes.headers.get('set-cookie').split(';')[0];

    const sessRes = await fetch(`${baseUrl}/api/auth/sessions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: cookie,
      },
    });
    assert.equal(sessRes.status, 200);
    const sessBody = await sessRes.json();
    assert.ok(sessBody.data.sessions.length >= 1);
    const current = sessBody.data.sessions.find((s) => s.isCurrent);
    assert.ok(current, 'Current session must be flagged isCurrent: true');
  });

  await t.test('GET /api/admin/audit-logs returns audit log entries for administrators', async () => {
    const adminUser = new User({
      name: 'Admin Auditor',
      email: `auditor_${testSuffix}@example.com`,
      password: 'AdminPassword123!',
      role: 'ADMIN',
    });
    await adminUser.save();
    const adminToken = generateAccessToken(adminUser);

    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data.logs));

    await User.deleteOne({ _id: adminUser._id });
  });
});
