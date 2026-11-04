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
import { GameImage } from '../models/GameImage.js';
import { GameSession } from '../models/GameSession.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Deepfake Gameplay Verdict, Score Summary & Admin Waiting State Verification', async (t) => {
  await connectDB();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();
  const testUser = await User.create({
    name: `Detective Cadet ${timestamp}`,
    email: `detective_${timestamp}@deeptrust.test`,
    password: 'CadetPassword123!',
    role: 'USER',
    isActive: true,
    isEmailVerified: true,
    totalXP: 50,
  });
  const userToken = generateAccessToken(testUser);

  // Create two distinct published images for this test
  const realImg = await GameImage.create({
    imageId: `IMG-REAL-${timestamp}`,
    imageUrl: `https://example.com/real_${timestamp}.jpg`,
    imageType: 'REAL',
    correctAnswer: 'REAL',
    imageCategory: 'Optical Portrait',
    difficulty: 'Easy',
    status: 'PUBLISHED',
    publicationStatus: 'PUBLISHED',
    isActive: true,
    explanation: 'Genuine forensic optical photograph with natural light reflection.',
  });

  const aiImg = await GameImage.create({
    imageId: `IMG-AI-${timestamp}`,
    imageUrl: `https://example.com/ai_${timestamp}.jpg`,
    imageType: 'AI_GENERATED',
    correctAnswer: 'AI_GENERATED',
    imageCategory: 'StyleGAN Synthesis',
    difficulty: 'Medium',
    status: 'PUBLISHED',
    publicationStatus: 'PUBLISHED',
    isActive: true,
    explanation: 'AI-generated artifact: subtle asymmetrical iris reflection and blended hair.',
  });

  t.after(async () => {
    server.close();
    await User.findByIdAndDelete(testUser._id);
    await GameImage.deleteMany({ _id: { $in: [realImg._id, aiImg._id] } });
    await GameSession.deleteMany({ userId: testUser._id });
    await GameAttempt.deleteMany({ userId: testUser._id });
    await mongoose.disconnect();
  });

  let activeSessionId = '';

  // 1. Start Session
  await t.test('1. Start game session returns challenges without leaking ground truth', async () => {
    const res = await fetch(`${baseUrl}/api/game/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    console.log('TEST 5 BODY DATA:', JSON.stringify(body.data, null, 2));
    assert.equal(body.success, true);
    assert.ok(body.data.sessionId);
    activeSessionId = body.data.sessionId;

    // Verify challenges do NOT expose correctAnswer or isCorrect
    body.data.challenges.forEach((ch) => {
      assert.equal(ch.correctAnswer, undefined, 'Ground truth answer must not leak to client');
      assert.equal(ch.groundTruthClassification, undefined);
    });
  });

  // 2. Submit Answer - Test Correct Answer Verdict
  await t.test('2. Submitting correct REAL answer returns isCorrect: true, ground truth and explanation', async () => {
    const res = await fetch(`${baseUrl}/api/game/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        challengeId: realImg._id.toString(),
        userPrediction: 'REAL',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isCorrect, true);
    assert.equal(body.data.correctAnswer, 'REAL');
    assert.ok(body.data.xpEarned > 0, 'XP must be awarded for correct guess');
    assert.ok(body.data.explanation.includes('Genuine forensic optical photograph'));
  });

  // 3. Submit Answer - Test Incorrect Answer Verdict
  await t.test('3. Submitting incorrect answer returns isCorrect: false and 0 XP', async () => {
    const res = await fetch(`${baseUrl}/api/game/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        challengeId: aiImg._id.toString(),
        userPrediction: 'REAL', // incorrect guess, actual is AI_GENERATED
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isCorrect, false);
    assert.equal(body.data.correctAnswer, 'AI_GENERATED');
    assert.equal(body.data.xpEarned, 0, 'No XP awarded for incorrect guess');
    assert.ok(body.data.explanation.includes('AI-generated artifact'));
  });

  // 4. Complete Session and Summary Metrics
  await t.test('4. Complete session returns full summary metrics and updates player XP', async () => {
    const res = await fetch(`${baseUrl}/api/game/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.session);
    assert.equal(body.data.session.questionsAttempted, 2);
    assert.equal(body.data.session.correctAnswers, 1);
    assert.equal(body.data.session.incorrectAnswers, 1);
    assert.ok(body.data.completionBonus >= 0);
  });

  // 5. Test "All Available Images Detected" Waiting State
  await t.test('5. When all published images have been detected, start returns allCompleted: true', async () => {
    // Record attempts for any remaining published images so all published images are attempted
    const allPublished = await GameImage.find({ status: 'PUBLISHED', isActive: true });
    for (const img of allPublished) {
      const existing = await GameAttempt.findOne({ userId: testUser._id, imageReference: img.imageId });
      if (!existing) {
        await GameAttempt.create({
          userId: testUser._id,
          sessionId: activeSessionId,
          imageReference: img.imageId,
          userPrediction: 'REAL',
          aiClassification: 'NOT_AI_GENERATED',
          isCorrect: true,
          confidenceScore: 0.9,
          xpEarned: 10,
        });
      }
    }

    const res = await fetch(`${baseUrl}/api/game/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    console.log('TEST 5 BODY DATA:', JSON.stringify(body.data, null, 2));
    assert.equal(body.success, true);
    assert.equal(body.data.allCompleted, true, 'allCompleted must be true when all photos detected');
    assert.ok(body.data.totalPublished > 0);
    assert.equal(body.data.challenges.length, 0, 'No challenges should be delivered when all completed');
  });
});
