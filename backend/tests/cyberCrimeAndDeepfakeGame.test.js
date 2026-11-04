import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { GameImage } from '../models/GameImage.js';
import { CyberCrimeRound } from '../models/CyberCrimeRound.js';
import { CyberCrimeQuestion } from '../models/CyberCrimeQuestion.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Deepfake Detection Image Bank & Cyber Crime Complete Integration Suite', async (t) => {
  await connectDB();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(async () => {
    server.close();
    await mongoose.disconnect();
  });

  // 1. Setup Admin Account
  let admin = await User.findOne({ email: 'admin@deeptrust.academy' });
  if (!admin) {
    admin = await User.create({
      name: 'Test Admin',
      email: 'admin@deeptrust.academy',
      password: 'Admin@DeepTrust2026!',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    });
  }
  const adminToken = generateAccessToken(admin);

  // 2. Setup Normal User Account
  const testUserEmail = `player_${Date.now()}@deeptrust.academy`;
  const normalUser = await User.create({
    name: 'Player One',
    email: testUserEmail,
    password: 'Password123!',
    role: 'USER',
    isActive: true,
    isEmailVerified: true,
    totalXP: 0,
  });
  const userToken = generateAccessToken(normalUser);

  // -------------------------------------------------------------
  // TEST 1: Admin Creates Genuine and AI-generated Photographs
  // -------------------------------------------------------------
  let testRealImageId = '';
  let testAiImageId = '';

  await t.test('Admin uploads genuine photograph with manual answer REAL', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        imageUrl: `https://example.com/test-real-${Date.now()}.jpg`,
        correctAnswer: 'REAL',
        imageCategory: 'Facial Synthesis',
        difficulty: 'Easy',
        status: 'DRAFT',
        explanation: 'Authentic camera sensor noise and natural facial asymmetries.',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.image.correctAnswer, 'REAL');
    assert.equal(body.data.image.status, 'DRAFT');
    assert.equal(body.data.image.publicationStatus, 'DRAFT');
    testRealImageId = body.data.image._id;
  });

  await t.test('Admin uploads AI-generated photograph with manual answer AI_GENERATED', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        imageUrl: `https://example.com/test-ai-${Date.now()}.jpg`,
        correctAnswer: 'AI_GENERATED',
        imageCategory: 'Facial Synthesis',
        difficulty: 'Medium',
        status: 'DRAFT',
        explanation: 'Generative diffusion artifacts detected in iris reflections.',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.image.correctAnswer, 'AI_GENERATED');
    testAiImageId = body.data.image._id;
  });

  // -------------------------------------------------------------
  // TEST 2: Publication Status Workflow (DRAFT -> PUBLISHED)
  // -------------------------------------------------------------
  await t.test('Admin publishes draft photograph - status updates to PUBLISHED', async () => {
    const res = await fetch(`${baseUrl}/api/admin/games/images/${testRealImageId}/publish`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.image.publicationStatus, 'PUBLISHED');
    assert.equal(body.data.image.status, 'PUBLISHED');

    // Also publish AI image
    await fetch(`${baseUrl}/api/admin/games/images/${testAiImageId}/publish`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
  });

  // -------------------------------------------------------------
  // TEST 3: Deepfake Detection Gameplay - Database Ground Truth
  // -------------------------------------------------------------
  let activeSessionId = '';

  await t.test('Normal user starts challenge session and retrieves published images', async () => {
    try {
      const res = await fetch(`${baseUrl}/api/game/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const body = await res.json();
      assert.ok([200, 201].includes(res.status));
      assert.equal(body.success, true);
      assert.ok(body.data.sessionId);
      assert.ok(Array.isArray(body.data.challenges));
      assert.ok(body.data.challenges.length > 0);
      activeSessionId = body.data.sessionId;

      body.data.challenges.forEach((ch) => {
        assert.equal(ch.correctAnswer, undefined);
        assert.equal(ch.imageType, undefined);
        assert.equal(ch.groundTruthClassification, undefined);
      });
    } catch (err) {
      console.error('ERROR in start challenge test:', err);
      throw err;
    }
  });

  await t.test('Normal user submits correct REAL prediction - evaluated by DB without Sightengine', async () => {
    const res = await fetch(`${baseUrl}/api/game/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        userPrediction: 'REAL',
        challengeId: testRealImageId,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isCorrect, true);
    assert.equal(body.data.correctAnswer, 'REAL');
    assert.ok(body.data.xpEarned > 0, 'XP must be awarded for correct prediction');
  });

  await t.test('Normal user submits incorrect prediction - awarded 0 XP', async () => {
    const res = await fetch(`${baseUrl}/api/game/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        userPrediction: 'REAL', // Image is actually AI_GENERATED
        challengeId: testAiImageId,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isCorrect, false);
    assert.equal(body.data.correctAnswer, 'AI_GENERATED');
    assert.equal(body.data.xpEarned, 0, 'Zero XP must be awarded for incorrect prediction');
  });

  // -------------------------------------------------------------
  // TEST 4: Cyber Crime Investigation - Admin Round & Question Bank
  // -------------------------------------------------------------
  let createdRoundId = '';
  let createdRoundDocId = '';

  await t.test('Admin creates a custom Cyber Crime investigation round', async () => {
    const res = await fetch(`${baseUrl}/api/admin/cybercrime/rounds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        roundNumber: 99,
        roundTitle: 'Executive Cloud Breach',
        caseDossierTitle: 'Cloud Infrastructure Compromise Dossier',
        evidenceCategory: 'Cloud Security & API Key Exposure',
        incidentDescription: 'An attacker gained unauthorized root access to internal buckets via a committed access key.',
        interceptedCommunication: 'Log: AWS IAM access key AKIA... accessed from 185.220.101.5 at 03:14 UTC.',
        forensicClues: '1. Anomalous Geo-IP: Access from an unapproved Tor exit node.\n2. Privilege Escalation: API key had AdministratorAccess.',
        difficulty: 'Hard',
        publicationStatus: 'DRAFT',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.round.roundTitle, 'Executive Cloud Breach');
    assert.equal(body.data.round.caseDossierTitle, 'Cloud Infrastructure Compromise Dossier');
    createdRoundId = body.data.round.roundId;
    createdRoundDocId = body.data.round._id;
  });

  await t.test('Admin cannot publish round if it has zero questions', async () => {
    const res = await fetch(`${baseUrl}/api/admin/cybercrime/rounds/${createdRoundDocId}/publish`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.message.includes('At least one question must be added'));
  });

  let createdQuestionId = '';

  await t.test('Admin adds question with A, B, C, D options and exactly one correct answer', async () => {
    const res = await fetch(`${baseUrl}/api/admin/cybercrime/rounds/${createdRoundId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionOrder: 1,
        questionText: 'What is the immediate remediation step after an API access key is compromised?',
        optionA: 'Immediately revoke the compromised API key and rotate credentials.',
        optionB: 'Send an email to the attacker requesting them to stop.',
        optionC: 'Delete the entire cloud account.',
        optionD: 'Wait 30 days to observe other actions.',
        correctAnswer: 'A',
        explanation: 'Revoking the active key instantly invalidates the attacker session and prevents further breach.',
        difficulty: 'Hard',
        xpReward: 10,
        publicationStatus: 'PUBLISHED',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.question.correctAnswer, 'A');
    createdQuestionId = body.data.question._id;
  });

  await t.test('Admin can now publish the round successfully', async () => {
    const res = await fetch(`${baseUrl}/api/admin/cybercrime/rounds/${createdRoundDocId}/publish`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.round.publicationStatus, 'PUBLISHED');
  });

  // -------------------------------------------------------------
  // TEST 5: Normal User Cyber Crime Gameplay Integration
  // -------------------------------------------------------------
  await t.test('Normal user fetches active, published investigation rounds without ground truth leaks', async () => {
    const res = await fetch(`${baseUrl}/api/game/cyber-crime/rounds`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.rounds));

    // Find the published round
    const found = body.data.rounds.find((r) => r.roundId === createdRoundId);
    assert.ok(found, 'Created round must be visible to normal user');
    assert.equal(found.roundTitle, 'Executive Cloud Breach');
    assert.equal(found.caseDossierTitle, 'Cloud Infrastructure Compromise Dossier');

    // Verify correct answers are hidden
    found.questions.forEach((q) => {
      assert.equal(q.correctAnswer, undefined);
      assert.equal(q.correctOptionId, undefined);
    });
  });

  await t.test('Normal user evaluates Cyber Crime answer against backend', async () => {
    const res = await fetch(`${baseUrl}/api/game/cyber-crime/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        questionId: createdQuestionId,
        selectedOptionId: 'a',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isCorrect, true);
    assert.equal(body.data.correctOptionId, 'a');
    assert.equal(body.data.xpAwarded, 10);
  });

  // -------------------------------------------------------------
  // TEST 6: Admin Dashboard Overview & Real MongoDB Stats Sync
  // -------------------------------------------------------------
  await t.test('Admin Overview reflects synchronized real database counts', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.stats.totalUsers > 0);
  });

  // Cleanup test artifacts
  await GameImage.deleteMany({ _id: { $in: [testRealImageId, testAiImageId] } });
  await CyberCrimeQuestion.deleteMany({ _id: createdQuestionId });
  await CyberCrimeRound.deleteMany({ _id: createdRoundDocId });
  await User.deleteOne({ _id: normalUser._id });
});
