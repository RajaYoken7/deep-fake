process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'deep_trust_academy_test_jwt_access_secret_32_chars';
process.env.JWT_REFRESH_SECRET = 'deep_trust_academy_test_jwt_refresh_secret_32_chars';
process.env.JWT_SECRET = 'deep_trust_academy_test_jwt_access_secret_32_chars';

import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { GameQuestion } from '../models/GameQuestion.js';
import { GameImage } from '../models/GameImage.js';
import { GameSession } from '../models/GameSession.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Deepfake Detection Game & Admin Sync Verification Suite', async (t) => {
  await connectDB();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();
  const adminEmail = `admin_sync_${timestamp}@deeptrust.test`;
  const normalEmail = `cadet_sync_${timestamp}@deeptrust.test`;

  const adminUser = await User.create({
    name: `Admin Sync Test ${timestamp}`,
    email: adminEmail,
    password: 'AdminPassword123!',
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
  });
  const adminToken = generateAccessToken(adminUser);

  const normalUser = await User.create({
    name: `Player Cadet ${timestamp}`,
    email: normalEmail,
    password: 'CadetPassword123!',
    role: 'USER',
    isActive: true,
    isEmailVerified: true,
    totalXP: 100,
  });
  const normalToken = generateAccessToken(normalUser);

  // Create a published active test question
  const testQuestion = await GameQuestion.create({
    questionId: `Q-TEST-${timestamp}`,
    title: 'Forensic Portrait Test',
    category: 'Facial Synthesis',
    difficulty: 'Medium',
    correctAnswer: 'REAL',
    label: 'REAL',
    groundTruthClassification: 'NOT_AI_GENERATED',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    clues: 'Check optical skin grain and pupil reflections.',
    explanation: 'Genuine optical photograph with natural light reflection.',
    status: 'PUBLISHED',
    isActive: true,
    createdBy: adminUser._id,
  });

  // Create a test image in image bank
  const testImage = await GameImage.create({
    imageId: `IMG-TEST-${timestamp}`,
    imageUrl: `https://example.com/test-image-${timestamp}.jpg`,
    imageType: 'AI_GENERATED',
    imageCategory: 'Diffusion Model',
    difficulty: 'Easy',
    status: 'PUBLISHED',
    isActive: true,
    notes: 'Test generated photograph',
    uploadedBy: adminUser._id,
  });

  t.after(async () => {
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (normalUser) await User.findByIdAndDelete(normalUser._id);
    if (testQuestion) await GameQuestion.findByIdAndDelete(testQuestion._id);
    if (testImage) await GameImage.findByIdAndDelete(testImage._id);
    await GameSession.deleteMany({ userId: normalUser?._id });
    server.close();
    await mongoose.disconnect();
  });

  // 1. Normal User Game Access & Payload Sanitization
  await t.test('Normal User: Can start a game session and receives database questions without answers revealed', async () => {
    const res = await fetch(`${baseUrl}/api/game/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.ok(body.data.sessionId);
    assert.ok(Array.isArray(body.data.challenges));
    assert.ok(body.data.challenges.length > 0);

    // Ensure correctAnswer, groundTruthClassification, and explanation are NOT leaked before submission
    for (const challenge of body.data.challenges) {
      assert.equal(challenge.correctAnswer, undefined);
      assert.equal(challenge.groundTruthClassification, undefined);
      assert.equal(challenge.label, undefined);
      assert.equal(challenge.explanation, undefined);
      assert.ok(challenge.imageUrl);
      assert.ok(challenge.title);
    }
  });

  // 2. Normal User Game Submission & XP Synchronization
  await t.test('Normal User: Submits correct prediction and XP is authoritatively updated in database', async () => {
    const startRes = await fetch(`${baseUrl}/api/game/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    const startBody = await startRes.json();
    const sessionId = startBody.data.sessionId;

    const submitRes = await fetch(`${baseUrl}/api/game/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalToken}`,
      },
      body: JSON.stringify({
        sessionId,
        challengeId: testQuestion._id.toString(),
        userPrediction: 'REAL', // testQuestion is REAL
      }),
    });
    const submitBody = await submitRes.json();

    assert.equal(submitRes.status, 200);
    assert.equal(submitBody.success, true);
    assert.equal(submitBody.data.isCorrect, true);
    assert.ok(submitBody.data.xpEarned > 0);

    // Verify user totalXP increased in database
    const updatedUser = await User.findById(normalUser._id);
    assert.ok(updatedUser.totalXP > 100);
    assert.equal(updatedUser.correctAnswers, 1);
  });

  // 3. Complete Game Session and Synchronization
  await t.test('Normal User: Completes game session and updates gamesPlayed in MongoDB', async () => {
    const startRes = await fetch(`${baseUrl}/api/game/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    const startBody = await startRes.json();
    const sessionId = startBody.data.sessionId;

    await fetch(`${baseUrl}/api/game/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalToken}`,
      },
      body: JSON.stringify({
        sessionId,
        challengeId: testQuestion._id.toString(),
        userPrediction: 'REAL',
      }),
    });

    const completeRes = await fetch(`${baseUrl}/api/game/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalToken}`,
      },
      body: JSON.stringify({ sessionId }),
    });
    const completeBody = await completeRes.json();

    assert.equal(completeRes.status, 200);
    assert.equal(completeBody.success, true);

    const dbSession = await GameSession.findOne({ sessionId });
    assert.equal(dbSession.status, 'completed');

    const updatedUser = await User.findById(normalUser._id);
    assert.ok(updatedUser.gamesPlayed >= 1);
  });

  // 4. Admin Dashboard Data Synchronization
  await t.test('Admin Dashboard: Overview reflects updated user XP and completed game sessions', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.stats.totalUsers > 0);
    assert.ok(body.data.stats.totalGameSessions > 0);
    assert.ok(body.data.stats.totalXpEarned > 0);
  });

  // 5. Admin User Dossier Endpoint
  await t.test('Admin: GET /api/admin/users/:id/details returns full unified dossier from MongoDB', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${normalUser._id}/details`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, normalUser.email);
    assert.ok(body.data.progression.totalXP > 100);
    assert.ok(Array.isArray(body.data.gameHistory));
    assert.ok(body.data.gameHistory.length > 0);
    assert.ok(Array.isArray(body.data.detectionHistory));
    assert.ok(Array.isArray(body.data.identityHistory));
  });

  // 6. Admin Image Management CRUD
  await t.test('Admin Image Management: Lists images with filtering and sorting', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/images?imageType=AI_GENERATED`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.images));
    assert.ok(body.data.images.some((img) => img.imageId === testImage.imageId));
  });

  await t.test('Admin Image Management: Prevents duplicate image registration', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        imageUrl: testImage.imageUrl, // duplicate!
        imageType: 'AI_GENERATED',
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 409);
    assert.equal(body.success, false);
    assert.ok(body.message.includes('already exists'));
  });

  await t.test('Admin Image Management: Toggles and publishes photograph in Image Bank', async () => {
    // Toggle active
    const toggleRes = await fetch(`${baseUrl}/api/admin/games/images/${testImage._id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleBody = await toggleRes.json();

    assert.equal(toggleRes.status, 200);
    assert.equal(toggleBody.data.image.isActive, false);

    // Toggle publish
    const pubRes = await fetch(`${baseUrl}/api/admin/games/images/${testImage._id}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pubBody = await pubRes.json();

    assert.equal(pubRes.status, 200);
    assert.equal(pubBody.data.image.status, 'DRAFT');
  });

  // 7. Question Lifecycle: DRAFT vs PUBLISHED
  await t.test('Admin Question Management: Toggles question status between DRAFT and PUBLISHED', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/questions/${testQuestion._id}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.data.question.status, 'DRAFT');
  });

  // 8. Advanced Filters
  await t.test('Admin: Multi-filter on user list (status, role, search, sort)', async () => {
    const res = await fetch(
      `${baseUrl}/api/admin/users?role=USER&status=active&search=${normalUser.name}&sortBy=highest_xp`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.users.length > 0);
    assert.equal(body.data.users[0].email, normalUser.email);
  });
});
