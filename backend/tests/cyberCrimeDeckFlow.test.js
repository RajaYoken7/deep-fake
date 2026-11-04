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
import { CyberCrimeRound } from '../models/CyberCrimeRound.js';
import { CyberCrimeQuestion } from '../models/CyberCrimeQuestion.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Cyber Crime Non-Consecutive Decks, Direct DB Sync & Waiting State Suite', async (t) => {
  await connectDB();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();

  // 1. Create Admin User
  const admin = await User.create({
    name: `Admin CC ${timestamp}`,
    email: `admin_cc_${timestamp}@deeptrust.test`,
    password: 'AdminPassword123!',
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
  });
  const adminToken = generateAccessToken(admin);

  // 2. Create Normal User
  const cadet = await User.create({
    name: `Cadet Agent ${timestamp}`,
    email: `cadet_cc_${timestamp}@deeptrust.test`,
    password: 'CadetPassword123!',
    role: 'USER',
    isActive: true,
    isEmailVerified: true,
    totalXP: 50,
  });
  const cadetToken = generateAccessToken(cadet);

  let createdRoundDocId = '';
  let createdRoundId = '';
  let question1DocId = '';
  let question2DocId = '';

  t.after(async () => {
    server.close();
    await User.deleteMany({ _id: { $in: [admin._id, cadet._id] } });
    if (createdRoundDocId) await CyberCrimeRound.deleteOne({ _id: createdRoundDocId });
    if (question1DocId) await CyberCrimeQuestion.deleteOne({ _id: question1DocId });
    if (question2DocId) await CyberCrimeQuestion.deleteOne({ _id: question2DocId });
    await GameAttempt.deleteMany({ userId: cadet._id });
    await mongoose.disconnect();
  });

  let initialRoundCount = 0;

  // Step 1: Normal user fetches initial rounds
  await t.test('1. Normal user fetches rounds successfully', async () => {
    const res = await fetch(`${baseUrl}/api/game/cyber-crime/rounds`, {
      headers: { Authorization: `Bearer ${cadetToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    initialRoundCount = body.data.totalRounds;
    assert.equal(typeof initialRoundCount, 'number');
  });

  // Step 2: Admin creates a custom round
  await t.test('2. Admin creates a custom investigation round in MongoDB', async () => {
    const res = await fetch(`${baseUrl}/api/admin/cybercrime/rounds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        roundTitle: 'Executive Ransomware Threat',
        caseDossierTitle: 'Critical Server Compromise Dossier',
        evidenceCategory: 'Infrastructure Forensics',
        incidentDescription: 'High-level executive server encrypted by unauthorized ransomware binary.',
        interceptedCommunication: 'Ransom demand text file detected on domain controller.',
        forensicClues: '1. Bitcoin wallet address specified.\n2. Malicious service scheduled at 02:00 AM.',
        difficulty: 'Hard',
        publicationStatus: 'DRAFT',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    createdRoundDocId = body.data.round._id;
    createdRoundId = body.data.round.roundId;
  });

  // Step 3: Admin adds 2 questions to the round
  await t.test('3. Admin adds 2 questions to the custom round', async () => {
    // Question 1
    const res1 = await fetch(`${baseUrl}/api/admin/cybercrime/rounds/${createdRoundId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionOrder: 1,
        questionText: 'What initial network containment action should be performed immediately?',
        optionA: 'Isolate the affected domain controller from the network.',
        optionB: 'Pay the ransom immediately with company credit card.',
        optionC: 'Reboot the server 10 times in a row.',
        optionD: 'Ignore the alert and continue operations.',
        correctAnswer: 'A',
        explanation: 'Network isolation stops lateral movement across the enterprise subnet.',
        difficulty: 'Hard',
        xpReward: 10,
        publicationStatus: 'PUBLISHED',
      }),
    });
    assert.equal(res1.status, 201);
    const body1 = await res1.json();
    question1DocId = body1.data.question._id;

    // Question 2 (Admin specifically sets Option C as the correct answer)
    const res2 = await fetch(`${baseUrl}/api/admin/cybercrime/rounds/${createdRoundId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        questionOrder: 2,
        questionText: 'Which protocol is most secure for encrypted network communication?',
        optionA: 'Telnet unencrypted protocol.',
        optionB: 'HTTP plain cleartext protocol.',
        optionC: 'SSH / TLS with mutual certificate verification.',
        optionD: 'FTP without TLS.',
        correctAnswer: 'C',
        explanation: 'SSH and TLS provide end-to-end cryptographic confidentiality and authenticity.',
        difficulty: 'Medium',
        xpReward: 10,
        publicationStatus: 'PUBLISHED',
      }),
    });
    assert.equal(res2.status, 201);
    const body2 = await res2.json();
    assert.equal(body2.data.question.correctAnswer, 'C');
    question2DocId = body2.data.question._id;
  });

  // Step 4: Admin publishes the round
  await t.test('4. Admin publishes the round', async () => {
    const res = await fetch(`${baseUrl}/api/admin/cybercrime/rounds/${createdRoundDocId}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.round.publicationStatus, 'PUBLISHED');
  });

  // Step 5: Normal user now sees the deck in GET /rounds with correct answers hidden
  await t.test('5. Normal user fetches decks and receives the new published round', async () => {
    const res = await fetch(`${baseUrl}/api/game/cyber-crime/rounds`, {
      headers: { Authorization: `Bearer ${cadetToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.totalRounds, initialRoundCount + 1);
    const deck = body.data.rounds.find((r) => r.roundId === createdRoundId);
    assert.ok(deck, 'Created deck should exist');
    assert.equal(deck.roundTitle, 'Executive Ransomware Threat');
    assert.equal(deck.questions.length, 2);
    assert.equal(deck.isCompleted, false);

    // Verify correct answers are hidden
    deck.questions.forEach((q) => {
      assert.equal(q.correctAnswer, undefined);
      assert.equal(q.correctOptionId, undefined);
    });
  });

  // Step 6: Normal user evaluates answers (specifically testing admin-selected Option C)
  await t.test('6. Normal user evaluates answers against MongoDB', async () => {
    // 6a. Answering Question 1 correctly with 'a'
    const res1 = await fetch(`${baseUrl}/api/game/cyber-crime/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cadetToken}`,
      },
      body: JSON.stringify({
        questionId: question1DocId,
        selectedOptionId: 'a',
      }),
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.success, true);
    assert.equal(body1.data.isCorrect, true);
    assert.equal(body1.data.correctOptionId, 'a');
    assert.ok(body1.data.explanation.includes('Network isolation'));

    // 6b. Answering Question 2 where admin set Option C as correct -> selecting 'c' MUST be isCorrect: true
    const res2Correct = await fetch(`${baseUrl}/api/game/cyber-crime/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cadetToken}`,
      },
      body: JSON.stringify({
        questionId: question2DocId,
        selectedOptionId: 'c',
      }),
    });
    assert.equal(res2Correct.status, 200);
    const body2Correct = await res2Correct.json();
    assert.equal(body2Correct.success, true);
    assert.equal(body2Correct.data.isCorrect, true, 'Option C chosen by user must match Option C chosen by admin');
    assert.equal(body2Correct.data.correctOptionId, 'c');
    assert.equal(body2Correct.data.xpAwarded, 10);
    assert.ok(body2Correct.data.explanation.includes('SSH and TLS'));

    // 6c. Answering Question 2 with wrong option 'a' -> MUST be isCorrect: false, correctOptionId: 'c'
    const res2Wrong = await fetch(`${baseUrl}/api/game/cyber-crime/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cadetToken}`,
      },
      body: JSON.stringify({
        questionId: question2DocId,
        selectedOptionId: 'a',
      }),
    });
    assert.equal(res2Wrong.status, 200);
    const body2Wrong = await res2Wrong.json();
    assert.equal(body2Wrong.success, true);
    assert.equal(body2Wrong.data.isCorrect, false, 'Option A must be wrong because admin set Option C as correct');
    assert.equal(body2Wrong.data.correctOptionId, 'c');
    assert.equal(body2Wrong.data.xpAwarded, 0);
    assert.ok(body2Wrong.data.explanation.includes('SSH and TLS'));
  });

  // Step 7: Normal user claims deck completion reward (rewardType: 'round')
  await t.test('7. Normal user completes deck and claims authoritative EXP reward', async () => {
    const res = await fetch(`${baseUrl}/api/game/cyber-crime/reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cadetToken}`,
      },
      body: JSON.stringify({
        rewardType: 'round',
        attemptId: `deck_test_${timestamp}`,
        roundId: createdRoundId,
        correctCount: 2,
        totalQuestions: 2,
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.xpAwarded, 20); // 2 correct * 10 XP

    // Verify user in DB has 50 initial + 20 awarded = 70 XP
    const updatedCadet = await User.findById(cadet._id);
    assert.equal(updatedCadet.totalXP, 70);
  });

  // Step 8: GET /rounds now marks the created deck as isCompleted: true
  await t.test('8. GET /rounds now marks the created deck as isCompleted: true', async () => {
    const res = await fetch(`${baseUrl}/api/game/cyber-crime/rounds`, {
      headers: { Authorization: `Bearer ${cadetToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const deck = body.data.rounds.find((r) => r.roundId === createdRoundId);
    assert.ok(deck);
    assert.equal(deck.isCompleted, true);
  });

  // Step 9: Admin deletes the deck, ensuring cascade purge and user view total removal
  await t.test('9. Admin deletes deck -> totally purged from user view, replay and DB', async () => {
    const delRes = await fetch(`${baseUrl}/api/admin/cybercrime/rounds/${createdRoundDocId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
    const delBody = await delRes.json();
    assert.equal(delBody.success, true);

    // Verify user can no longer see the deck
    const userRes = await fetch(`${baseUrl}/api/game/cyber-crime/rounds`, {
      headers: { Authorization: `Bearer ${cadetToken}` },
    });
    assert.equal(userRes.status, 200);
    const userBody = await userRes.json();
    assert.equal(userBody.data.totalRounds, initialRoundCount);
    const foundDeck = userBody.data.rounds.find(
      (r) => r.id === createdRoundDocId || r.roundId === createdRoundId
    );
    assert.equal(foundDeck, undefined);

    // Verify cascade deleted questions
    const qCount = await CyberCrimeQuestion.countDocuments({
      $or: [{ roundId: createdRoundId }, { roundId: createdRoundDocId }],
    });
    assert.equal(qCount, 0);

    // Verify cascade removed from user cyberCrimeRewards
    const userAfter = await User.findById(cadet._id);
    const hasRemainingKey = userAfter.cyberCrimeRewards.some(
      (k) => k.includes(createdRoundId) || k.includes(createdRoundDocId)
    );
    assert.equal(hasRemainingKey, false);
  });
});

