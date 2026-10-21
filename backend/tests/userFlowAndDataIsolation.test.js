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
import { IdentityReport } from '../models/IdentityReport.js';

let server;
let baseUrl;

async function setupServer() {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  const app = createApp({
    detectImage: async () => ({
      classification: 'NOT_AI_GENERATED',
      score: 0.12,
      threshold: 0.8,
      disclaimer: 'Verification disclaimer',
    }),
  });
  server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
}

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/0XcAAAAASUVORK5CYII=',
  'base64',
);

test('Full User Lifecycle, Data Ownership & Cross-User Isolation Suite', async (t) => {
  await setupServer();

  const uid1 = Math.random().toString(36).substring(2, 8);
  const uid2 = Math.random().toString(36).substring(2, 8);
  const user1Email = `user1_${uid1}@example.com`;
  const user2Email = `user2_${uid2}@example.com`;
  const initialPassword = 'InitialSecurePassword123!';
  const updatedPassword = 'NewSecretPassword456!';

  let user1Token = '';
  let user1Cookie = '';
  let user1Id = '';

  let user2Token = '';
  let user2Cookie = '';
  let user2Id = '';

  t.after(async () => {
    try {
      if (user1Id) {
        await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
        await RefreshToken.deleteMany({ userId: { $in: [user1Id, user2Id] } });
        await DetectionHistory.deleteMany({ userId: { $in: [user1Id, user2Id] } });
        await IdentityReport.deleteMany({ userId: { $in: [user1Id, user2Id] } });
      }
      server.close();
      await mongoose.connection.close();
    } catch {
      // Ignore cleanup error
    }
  });

  await t.test('1. Register User 1 and User 2', async () => {
    // Register User 1
    const res1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Agent',
        email: user1Email,
        password: initialPassword,
      }),
    });
    assert.equal(res1.status, 201);
    const body1 = await res1.json();
    user1Token = body1.data.accessToken;
    user1Id = body1.data.user.id;
    user1Cookie = res1.headers.get('set-cookie').split(';')[0];

    // Register User 2
    const res2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Guardian',
        email: user2Email,
        password: initialPassword,
      }),
    });
    assert.equal(res2.status, 201);
    const body2 = await res2.json();
    user2Token = body2.data.accessToken;
    user2Id = body2.data.user.id;
    user2Cookie = res2.headers.get('set-cookie').split(';')[0];
  });

  await t.test('2. User 1 performs deepfake analysis and it is recorded under User 1', async () => {
    const form = new FormData();
    form.append('media', new Blob([png], { type: 'image/png' }), 'alice_sample.png');

    const res = await fetch(`${baseUrl}/api/detection/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
      body: form,
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.classification, 'NOT_AI_GENERATED');

    // Verify record in DetectionHistory collection
    const historyDoc = await DetectionHistory.findOne({ userId: user1Id });
    assert.ok(historyDoc, 'Expected detection record in DB for User 1');
    assert.equal(historyDoc.classification, 'NOT_AI_GENERATED');
    assert.equal(historyDoc.score, 0.12);
  });

  await t.test('3. Data Isolation: User 2 CANNOT see User 1 detection history', async () => {
    // User 1 gets their history
    const res1 = await fetch(`${baseUrl}/api/users/history`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.detections.length, 1);
    assert.equal(body1.data.detections[0].fileName, 'alice_sample.png');

    // User 2 gets their history -> must be empty (ZERO leaks)
    const res2 = await fetch(`${baseUrl}/api/users/history`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.detections.length, 0, 'User 2 must have 0 detections');
  });

  await t.test('4. User 1 changes password, invalidating their active sessions', async () => {
    const changeRes = await fetch(`${baseUrl}/api/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
      }),
    });

    assert.equal(changeRes.status, 200);

    // Old refresh cookie must now fail
    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: user1Cookie },
    });
    assert.ok([401, 403].includes(refreshRes.status));

    // Old password login must fail
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user1Email, password: initialPassword }),
    });
    assert.equal(oldLoginRes.status, 401);

    // New password login must succeed
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user1Email, password: updatedPassword }),
    });
    assert.equal(newLoginRes.status, 200);
    const newLoginBody = await newLoginRes.json();
    assert.ok(newLoginBody.data.accessToken);
  });
});
