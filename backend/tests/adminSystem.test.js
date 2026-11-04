process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'deep_trust_academy_test_jwt_access_secret_32_chars';
process.env.JWT_REFRESH_SECRET = 'deep_trust_academy_test_jwt_refresh_secret_32_chars';
process.env.JWT_SECRET = 'deep_trust_academy_test_jwt_access_secret_32_chars';

import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { GameQuestion } from '../models/GameQuestion.js';
import { AdminActivityLog } from '../models/AdminActivityLog.js';
import { seedAdminUser } from '../utils/seedAdmin.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Comprehensive Admin Login & Admin Dashboard Endpoints Suite', async (t) => {
  await connectDB();
  const seededAdmin = await seedAdminUser();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testSuffix = Math.random().toString(36).slice(2, 8);
  const normalUserEmail = `normal_${testSuffix}@example.com`;
  const normalUserPassword = 'NormalUserPassword123!';

  // Create normal test user
  const normalUser = new User({
    name: 'Normal Test User',
    email: normalUserEmail,
    password: normalUserPassword,
    role: 'USER',
    isActive: true,
  });
  await normalUser.save();
  const normalToken = generateAccessToken(normalUser);

  let adminAccessToken = '';
  let adminCookie = '';

  t.after(async () => {
    await User.deleteMany({ email: { $in: [normalUserEmail] } });
    await AdminActivityLog.deleteMany({ adminEmail: seededAdmin.email });
    server.close();
  });

  await t.test('POST /api/admin/auth/login - rejects empty credentials', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('POST /api/admin/auth/login - rejects non-admin users with 403', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalUserEmail, password: normalUserPassword }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Administrator privileges required/i);
  });

  await t.test('POST /api/admin/auth/login - successfully logs in administrator', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: seededAdmin.email,
        password: process.env.ADMIN_PASSWORD || 'Admin@DeepTrust2026!',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);
    assert.equal(body.data.user.role, 'ADMIN');

    adminAccessToken = body.data.accessToken;
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
  });

  await t.test('RBAC: Non-admin user is rejected from admin dashboard endpoints with 403', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    assert.equal(res.status, 403);
  });

  await t.test('RBAC: Unauthenticated request is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`);
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/admin/dashboard/stats - returns live MongoDB metrics and charts for admin', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.stats);
    assert.equal(typeof body.data.stats.totalUsers, 'number');
    assert.equal(typeof body.data.stats.activeUsers, 'number');
    assert.equal(typeof body.data.stats.totalDetections, 'number');
    assert.equal(typeof body.data.stats.totalIdentityReports, 'number');
    assert.equal(typeof body.data.stats.totalGameSessions, 'number');
    assert.equal(typeof body.data.stats.completedGameSessions, 'number');
    assert.equal(typeof body.data.stats.totalXpEarned, 'number');
    assert.ok(Array.isArray(body.data.charts.activityTrends));
    assert.ok(Array.isArray(body.data.recentUsers));
  });

  await t.test('GET /api/admin/users - returns sanitized list of users without passwords', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users?search=Normal+Test+User`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.users));
    const found = body.data.users.find((u) => u.email === normalUserEmail);
    assert.ok(found);
    assert.equal(found.password, undefined);
    assert.equal(found.role, 'USER');
  });

  await t.test('PATCH /api/admin/users/:id/status - prevents self-deactivation', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${seededAdmin._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /cannot deactivate their own account/i);
  });

  await t.test('PATCH /api/admin/users/:id/status - toggles user account status', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${normalUser._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.isActive, false);

    // Re-activate
    const res2 = await fetch(`${baseUrl}/api/admin/users/${normalUser._id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: true }),
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.user.isActive, true);
  });

  await t.test('GET /api/admin/detection-history - loads existing detection records', async () => {
    const res = await fetch(`${baseUrl}/api/admin/detection-history?limit=10`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.detections));
  });

  await t.test('GET /api/admin/identity-history - loads identity records safely', async () => {
    const res = await fetch(`${baseUrl}/api/admin/identity-history?limit=10`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.identityReports));
  });

  let createdQuestionId = '';

  await t.test('POST /api/admin/games/questions - creates new question in Question Bank', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/questions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Automated Test Forensics Challenge',
        category: 'Facial Synthesis',
        difficulty: 'Hard',
        label: 'AI_GENERATED',
        imageUrl: 'https://images.unsplash.com/photo-test-synthetic',
        clues: 'Examine asymmetrical pupil reflections.',
        explanation: 'Synthetically generated neural artifact.',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.question._id);
    assert.equal(body.data.question.groundTruthClassification, 'AI_GENERATED');
    createdQuestionId = body.data.question._id;
  });

  await t.test('PUT /api/admin/games/questions/:id - updates question', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/questions/${createdQuestionId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Automated Test Forensics Challenge (Updated)',
        difficulty: 'Medium',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.question.title, 'Automated Test Forensics Challenge (Updated)');
    assert.equal(body.data.question.difficulty, 'Medium');
  });

  await t.test('PATCH /api/admin/games/questions/:id/toggle - toggles enabled status', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/questions/${createdQuestionId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.question.isActive, false);
  });

  await t.test('DELETE /api/admin/games/questions/:id - deletes question', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/questions/${createdQuestionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  await t.test('GET /api/admin/games/history - displays game session records', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/history?limit=10`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.gameSessions));
  });

  await t.test('GET /api/admin/leaderboard - displays player rankings and scores', async () => {
    const res = await fetch(`${baseUrl}/api/admin/leaderboard`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.leaderboard));
  });

  await t.test('GET /api/admin/reports - returns JSON report', async () => {
    const res = await fetch(`${baseUrl}/api/admin/reports?type=users`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.records));
  });

  await t.test('GET /api/admin/reports - exports formatted CSV report', async () => {
    const res = await fetch(`${baseUrl}/api/admin/reports?type=detections&format=csv`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('text/csv'));
    const csvText = await res.text();
    assert.ok(csvText.includes('Report ID'));
    assert.ok(csvText.includes('Detection Result'));
  });

  await t.test('GET /api/admin/activity-logs - lists recorded administrative operations', async () => {
    const res = await fetch(`${baseUrl}/api/admin/activity-logs`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.logs));
    assert.ok(body.data.logs.some((l) => l.action === 'ADMIN_LOGIN'));
  });

  await t.test('POST /api/admin/auth/logout - terminates session and logs out', async () => {
    const res = await fetch(`${baseUrl}/api/admin/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
        Cookie: adminCookie,
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  t.after(async () => {
    server.close();
    await User.deleteOne({ _id: normalUser._id });
    await mongoose.disconnect();
  });
});

