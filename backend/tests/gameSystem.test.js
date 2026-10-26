import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import {
  calculateLevel,
  calculateRank,
  checkAndAwardAchievements,
  processGameSubmission,
  completeGameSession,
  getLeaderboardData,
  getUserGameStats,
} from '../services/gameService.js';
import { User } from '../models/User.js';
import { GameSession } from '../models/GameSession.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { createApp } from '../app.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

test('Level and Rank progression calculation', () => {
  // Level 1: 0 XP -> Beginner
  const l1 = calculateLevel(0);
  assert.equal(l1.level, 1);
  assert.equal(l1.title, 'Beginner');
  assert.equal(calculateRank(0), 'Bronze Detective');

  // Level 2: 250 XP -> Image Explorer
  const l2 = calculateLevel(250);
  assert.equal(l2.level, 2);
  assert.equal(l2.title, 'Image Explorer');
  assert.equal(calculateRank(250), 'Bronze Detective');

  // Level 3: 600 XP -> Fake Spotter, Silver
  const l3 = calculateLevel(600);
  assert.equal(l3.level, 3);
  assert.equal(l3.title, 'Fake Spotter');
  assert.equal(calculateRank(600), 'Silver Detective');

  // Level 4: 1200 XP -> Digital Detective, Gold
  const l4 = calculateLevel(1200);
  assert.equal(l4.level, 4);
  assert.equal(l4.title, 'Digital Detective');
  assert.equal(calculateRank(1200), 'Gold Detective');

  // Level 5: 2000 XP -> Deepfake Analyst, Platinum
  const l5 = calculateLevel(2000);
  assert.equal(l5.level, 5);
  assert.equal(calculateRank(2000), 'Platinum Detective');

  // Level 6: 3500 XP -> Truth Guardian, Diamond
  const l6 = calculateLevel(3500);
  assert.equal(l6.level, 6);
  assert.equal(calculateRank(3500), 'Diamond Detective');

  // Level 7: 5500 XP -> Cyber Investigator, Elite Truth Guardian
  const l7 = calculateLevel(5500);
  assert.equal(l7.level, 7);
  assert.equal(calculateRank(5500), 'Elite Truth Guardian');

  // Level 10: 18000+ XP -> DeepTrust Legend, Legendary DeepTrust Guardian
  const l10 = calculateLevel(20000);
  assert.equal(l10.level, 10);
  assert.equal(l10.title, 'DeepTrust Legend');
  assert.equal(calculateRank(20000), 'Legendary DeepTrust Guardian');
  assert.equal(l10.progressPercent, 100);
});

test('Achievement unlocking conditions and duplicate prevention', () => {
  const mockUser = {
    totalAttempts: 1,
    correctAnswers: 5,
    currentStreak: 5,
    highestStreak: 5,
    currentLevel: 1,
    achievements: [],
  };

  const unlockedFirst = checkAndAwardAchievements(mockUser);
  const unlockedIds = unlockedFirst.map((a) => a.id);

  assert.ok(unlockedIds.includes('first_detection'));
  assert.ok(unlockedIds.includes('sharp_eyes'));
  assert.ok(unlockedIds.includes('perfect_five'));

  // Running check again must not re-award already unlocked achievements
  const unlockedSecond = checkAndAwardAchievements(mockUser);
  assert.equal(unlockedSecond.length, 0);
});

test('Game API Endpoints, Session, and Submission Flow', async (t) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch {
      t.skip('MongoDB connection not available');
      return;
    }
  }

  // Create temporary test users
  const testEmail1 = `gametest1_${Date.now()}@example.com`;
  const testEmail2 = `gametest2_${Date.now()}@example.com`;

  const user1 = await User.create({
    name: 'Detective Sherlock',
    email: testEmail1,
    password: 'Password123!',
    role: 'USER',
  });

  const user2 = await User.create({
    name: 'Cadet Watson',
    email: testEmail2,
    password: 'Password123!',
    role: 'USER',
  });

  const app = createApp();
  const server = createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const token1 = generateAccessToken(user1);
  const token2 = generateAccessToken(user2);

  let sessionId = '';

  await t.test('1. Unauthorized access without JWT is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/game/stats`);
    assert.equal(res.status, 401);
  });

  await t.test('2. Start new game session via API', async () => {
    const res = await fetch(`${baseUrl}/api/game/start`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token1}`,
        'content-type': 'application/json',
      },
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.sessionId);
    assert.ok(body.data.challenges.length > 0);
    sessionId = body.data.sessionId;
  });

  await t.test('3. Correct REAL prediction awards 100 XP', async () => {
    // chal_01 is NOT_AI_GENERATED (Real)
    const result = await processGameSubmission({
      userId: user1._id,
      sessionId,
      userPrediction: 'REAL',
      challengeId: 'chal_01',
    });

    assert.equal(result.isCorrect, true);
    assert.equal(result.xpEarned, 100);
    assert.equal(result.currentStreak, 1);
    assert.equal(result.playerStats.correctAnswers, 1);
  });

  await t.test('4. Correct FAKE prediction maintains streak and awards XP', async () => {
    // chal_02 is AI_GENERATED (Fake)
    const result = await processGameSubmission({
      userId: user1._id,
      sessionId,
      userPrediction: 'FAKE',
      challengeId: 'chal_02',
    });

    assert.equal(result.isCorrect, true);
    assert.equal(result.xpEarned, 100);
    assert.equal(result.currentStreak, 2);
  });

  await t.test('5. Milestone 3-streak bonus awarded on 3rd consecutive win', async () => {
    // chal_03 is NOT_AI_GENERATED (Real)
    const result = await processGameSubmission({
      userId: user1._id,
      sessionId,
      userPrediction: 'REAL',
      challengeId: 'chal_03',
    });

    assert.equal(result.isCorrect, true);
    assert.equal(result.currentStreak, 3);
    // 100 base + 25 streak bonus = 125 XP
    assert.equal(result.xpEarned, 125);
  });

  await t.test('6. Incorrect prediction resets current streak to 0 with +0 XP', async () => {
    // chal_04 is AI_GENERATED, predict REAL -> incorrect
    const result = await processGameSubmission({
      userId: user1._id,
      sessionId,
      userPrediction: 'REAL',
      challengeId: 'chal_04',
    });

    assert.equal(result.isCorrect, false);
    assert.equal(result.xpEarned, 0);
    assert.equal(result.currentStreak, 0);
    assert.equal(result.highestStreak, 3); // Highest streak preserved!
  });

  await t.test('7. Completing 5 questions session bonus (+50 XP)', async () => {
    // chal_05 is NOT_AI_GENERATED
    const result = await processGameSubmission({
      userId: user1._id,
      sessionId,
      userPrediction: 'REAL',
      challengeId: 'chal_05',
    });

    assert.equal(result.isCorrect, true);
    assert.equal(result.sessionStats.questionsAttempted, 5);
    // 100 base + 50 question-5 milestone bonus = 150 XP
    assert.equal(result.xpEarned, 150);
  });

  await t.test('8. Completing session awards session completion bonus (+50 XP)', async () => {
    const completeRes = await completeGameSession({
      userId: user1._id,
      sessionId,
    });

    assert.equal(completeRes.completionBonus, 50);
    assert.equal(completeRes.session.questionsAttempted, 5);

    // Repeated complete call must not award bonus again
    const repeated = await completeGameSession({
      userId: user1._id,
      sessionId,
    });
    assert.equal(repeated.completionBonus, 0);
  });

  await t.test('9. Leaderboard reflects XP and ranks correctly', async () => {
    // user2 plays 1 game
    const session2 = await GameSession.create({
      userId: user2._id,
      sessionId: `test_session2_${Date.now()}`,
      status: 'active',
    });

    await processGameSubmission({
      userId: user2._id,
      sessionId: session2.sessionId,
      userPrediction: 'REAL',
      challengeId: 'chal_01',
    });

    const leaderboard = await getLeaderboardData({ filter: 'all_time', currentUserId: user1._id });
    assert.ok(leaderboard.leaderboard.length >= 2);
    // user1 has more XP than user2
    const u1Row = leaderboard.leaderboard.find((p) => p.userId === user1._id.toString());
    const u2Row = leaderboard.leaderboard.find((p) => p.userId === user2._id.toString());
    assert.ok(u1Row);
    assert.ok(u2Row);
    assert.ok(u1Row.xp > u2Row.xp);
    assert.ok(u1Row.rank < u2Row.rank);
  });

  await t.test('10. User game stats returns accurate metrics', async () => {
    const stats = await getUserGameStats(user1._id);
    assert.ok(stats.totalXP > 0);
    assert.equal(stats.totalAttempts, 5);
    assert.equal(stats.correctAnswers, 4);
    assert.equal(stats.incorrectAnswers, 1);
    // Accuracy = (4 / (4 + 1)) * 100 = 80.0%
    assert.equal(stats.accuracy, 80);
    assert.ok(stats.achievements.length > 0);
  });

  // Cleanup test database entries
  await Promise.all([
    User.deleteMany({ _id: { $in: [user1._id, user2._id] } }),
    GameSession.deleteMany({ userId: { $in: [user1._id, user2._id] } }),
    GameAttempt.deleteMany({ userId: { $in: [user1._id, user2._id] } }),
  ]);

  server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
  }
});
