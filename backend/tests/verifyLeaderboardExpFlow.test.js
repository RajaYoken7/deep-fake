import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { getLeaderboardData } from '../services/gameService.js';
import { recordCyberCrimeReward } from '../controllers/gameController.js';

test('Global Leaderboard EXP Flow and Idempotency Verification', async (t) => {
  // Connect to MongoDB Atlas
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  assert.ok(mongoUri, 'MongoDB connection string must be defined');
  await mongoose.connect(mongoUri);

  // Use a dedicated, test-isolated user ID or test cadet
  const testEmail = `lb_test_${Date.now()}@deeptrust.edu`;
  const testUser = await User.create({
    name: 'Lead Detective Test',
    email: testEmail,
    password: 'SecureTestPassword123!',
    role: 'USER',
    totalXP: 100,
    currentLevel: 1,
    currentRank: 'Bronze Detective',
    gamesPlayed: 1,
    totalAttempts: 5,
    correctAnswers: 3,
    incorrectAnswers: 2,
    cyberCrimeRewards: [],
  });

  const userId = testUser._id;
  const initialXP = testUser.totalXP;
  assert.equal(initialXP, 100, 'Initial XP must be 100');

  await t.test('1. Confirm initial leaderboard returns correct starting XP for user', async () => {
    const allTime = await getLeaderboardData({ filter: 'all_time', limit: 100, currentUserId: userId });
    assert.ok(allTime.currentUserRanking, 'Current user ranking must be returned');
    assert.equal(allTime.currentUserRanking.xp, 100);
    assert.equal(allTime.currentUserRanking.userId, userId.toString());
  });

  const attemptId = `test_attempt_${Date.now()}`;

  await t.test('2. Award Round EXP and confirm MongoDB persistence and GameAttempt creation', async () => {
    // Simulate req, res, next
    const req = {
      user: testUser,
      body: {
        rewardType: 'round',
        attemptId,
        roundId: 'round-1',
        correctCount: 3, // 3 * 10 = 30 XP
      },
    };

    let responseStatus = null;
    let responseJson = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseJson = data;
        return this;
      },
    };
    const next = (err) => {
      if (err) throw err;
    };

    await recordCyberCrimeReward(req, res, next);

    assert.equal(responseStatus, 200, 'HTTP status must be 200');
    assert.equal(responseJson.success, true);
    assert.equal(responseJson.alreadyClaimed, false);
    assert.equal(responseJson.xpAwarded, 30);

    // Verify MongoDB persistence
    const updatedUser = await User.findById(userId);
    assert.equal(updatedUser.totalXP, 130, 'Database totalXP must increase from 100 to 130');

    // Verify GameAttempt record was created for weekly/monthly aggregation
    const attemptRecord = await GameAttempt.findOne({
      userId,
      imageReference: `cyber_round_${attemptId}_round-1`,
    });
    assert.ok(attemptRecord, 'GameAttempt record must exist for the round reward');
    assert.equal(attemptRecord.xpAwarded, 30);
  });

  await t.test('3. Confirm all-time, weekly, and monthly leaderboards return updated EXP', async () => {
    const allTime = await getLeaderboardData({ filter: 'all_time', limit: 100, currentUserId: userId });
    assert.equal(allTime.currentUserRanking.xp, 130, 'All-time leaderboard must reflect 130 XP');

    const weekly = await getLeaderboardData({ filter: 'weekly', limit: 100, currentUserId: userId });
    assert.ok(weekly.currentUserRanking, 'Weekly leaderboard must have user ranking');
    assert.equal(weekly.currentUserRanking.xp, 30, 'Weekly leaderboard must reflect newly earned 30 XP');

    const monthly = await getLeaderboardData({ filter: 'monthly', limit: 100, currentUserId: userId });
    assert.ok(monthly.currentUserRanking, 'Monthly leaderboard must have user ranking');
    assert.equal(monthly.currentUserRanking.xp, 30, 'Monthly leaderboard must reflect newly earned 30 XP');
  });

  await t.test('4. Confirm strict idempotency: repeated request does not duplicate EXP', async () => {
    const req = {
      user: await User.findById(userId),
      body: {
        rewardType: 'round',
        attemptId,
        roundId: 'round-1',
        correctCount: 3,
      },
    };

    let responseStatus = null;
    let responseJson = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseJson = data;
        return this;
      },
    };
    const next = (err) => {
      if (err) throw err;
    };

    await recordCyberCrimeReward(req, res, next);

    assert.equal(responseStatus, 200);
    assert.equal(responseJson.alreadyClaimed, true, 'Repeat claim must report alreadyClaimed: true');
    assert.equal(responseJson.xpAwarded, 0, 'No EXP should be awarded on retry');

    const recheckedUser = await User.findById(userId);
    assert.equal(recheckedUser.totalXP, 130, 'totalXP must stay 130 and NOT duplicate to 160');
  });

  await t.test('5. Award Daily Mission EXP and confirm leaderboard update', async () => {
    const req = {
      user: await User.findById(userId),
      body: {
        rewardType: 'mission',
        missionId: 'dm-identity-verifier',
        dateKey: '2026-10-27',
      },
    };

    let responseStatus = null;
    let responseJson = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseJson = data;
        return this;
      },
    };
    const next = (err) => {
      if (err) throw err;
    };

    await recordCyberCrimeReward(req, res, next);

    assert.equal(responseStatus, 200);
    assert.equal(responseJson.alreadyClaimed, false);
    assert.equal(responseJson.xpAwarded, 30); // dm-identity-verifier awards 30 XP

    const missionUser = await User.findById(userId);
    assert.equal(missionUser.totalXP, 160, 'totalXP must increase to 160 after mission');

    const allTime = await getLeaderboardData({ filter: 'all_time', limit: 100, currentUserId: userId });
    assert.equal(allTime.currentUserRanking.xp, 160, 'All-time leaderboard must reflect 160 XP');

    const weekly = await getLeaderboardData({ filter: 'weekly', limit: 100, currentUserId: userId });
    assert.equal(weekly.currentUserRanking.xp, 60, 'Weekly leaderboard must aggregate round (30) + mission (30) = 60 XP');
  });

  // Cleanup test documents to keep database completely pristine
  await User.findByIdAndDelete(userId);
  await GameAttempt.deleteMany({ userId });
  await mongoose.disconnect();
});
