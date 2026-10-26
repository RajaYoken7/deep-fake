import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAccuracy,
  getPerformanceTier,
  INVESTIGATION_ROUNDS,
  ALL_CAMPAIGN_QUESTIONS,
  DAILY_MISSIONS_POOL,
} from '../features/game/cyberCrime/cyberCrimeData.js';
import {
  getUtcDateKey,
  getNextDailyResetInfo,
  getDailyMissionsForDate,
  calculateGameAnalytics,
} from '../features/game/cyberCrime/cyberCrimeStorage.js';
import {
  CYBER_CRIME_QUESTION_BANK,
  ROUND_1_QUESTION_BANK,
  ROUND_2_QUESTION_BANK,
  ROUND_3_QUESTION_BANK,
} from '../features/game/cyberCrime/cyberCrimeQuestionBank.js';
import {
  generateAttemptQuestions,
} from '../features/game/cyberCrime/cyberCrimeQuestionSelector.js';
import {
  CYBER_CRIME_BADGES_CATALOG,
  evaluateUnlockedBadges,
} from '../features/game/cyberCrime/cyberCrimeBadges.js';

test('Dynamic Question Bank Scale and Integrity (90+ Questions, 30+ per Round)', () => {
  // Question Bank Total
  assert.ok(
    CYBER_CRIME_QUESTION_BANK.length >= 90,
    `Question bank must have at least 90 questions, found ${CYBER_CRIME_QUESTION_BANK.length}`
  );

  // Round-specific counts
  assert.ok(
    ROUND_1_QUESTION_BANK.length >= 30,
    `Round 1 must have at least 30 questions, found ${ROUND_1_QUESTION_BANK.length}`
  );
  assert.ok(
    ROUND_2_QUESTION_BANK.length >= 30,
    `Round 2 must have at least 30 questions, found ${ROUND_2_QUESTION_BANK.length}`
  );
  assert.ok(
    ROUND_3_QUESTION_BANK.length >= 30,
    `Round 3 must have at least 30 questions, found ${ROUND_3_QUESTION_BANK.length}`
  );

  // Validate every single question in the bank
  const allIds = new Set();
  const optionLetterCounts = { a: 0, b: 0, c: 0, d: 0 };

  CYBER_CRIME_QUESTION_BANK.forEach((q) => {
    assert.ok(q.id, 'Question must have unique id');
    assert.ok(!allIds.has(q.id), `Duplicate question id found: ${q.id}`);
    allIds.add(q.id);

    assert.ok(q.roundId, `Question ${q.id} must have roundId`);
    assert.ok(
      ['round-1', 'round-2', 'round-3'].includes(q.roundId),
      `Invalid roundId ${q.roundId} in question ${q.id}`
    );

    assert.ok(q.topic && q.topic.length > 2, `Question ${q.id} must have topic`);
    assert.ok(q.scenario && q.scenario.length > 10, `Question ${q.id} must have scenario`);
    assert.ok(q.question && q.question.length > 5, `Question ${q.id} must have question text`);
    assert.equal(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);

    const validOptionIds = q.options.map((o) => o.id);
    assert.deepEqual(validOptionIds, ['a', 'b', 'c', 'd'], `Question ${q.id} options must be a, b, c, d`);
    assert.ok(
      validOptionIds.includes(q.correctOptionId),
      `Question ${q.id} correctOptionId ${q.correctOptionId} must be in options`
    );
    assert.ok(q.explanation && q.explanation.length > 10, `Question ${q.id} must have explanation`);

    optionLetterCounts[q.correctOptionId]++;
  });

  // Ensure healthy answer key distribution (no single letter dominates > 50%)
  const total = CYBER_CRIME_QUESTION_BANK.length;
  Object.entries(optionLetterCounts).forEach(([letter, count]) => {
    assert.ok(
      count > 10,
      `Option ${letter} must be the correct answer for at least 10 questions, got ${count}`
    );
    assert.ok(
      count < total * 0.5,
      `Option ${letter} should not dominate more than 50% of the questions`
    );
  });
});

test('Dynamic Question Selector Varied Generation and Option Shuffling', () => {
  // Generate first attempt
  const attempt1 = generateAttemptQuestions([]);
  assert.equal(attempt1.length, 9, 'Attempt must contain exactly 9 questions');

  // Verify 3 from Round 1, 3 from Round 2, 3 from Round 3 in order
  const r1 = attempt1.slice(0, 3);
  const r2 = attempt1.slice(3, 6);
  const r3 = attempt1.slice(6, 9);

  r1.forEach((q) => assert.equal(q.roundId, 'round-1'));
  r2.forEach((q) => assert.equal(q.roundId, 'round-2'));
  r3.forEach((q) => assert.equal(q.roundId, 'round-3'));

  // Ensure no duplicate questions in attempt
  const seenIds1 = new Set(attempt1.map((q) => q.id));
  assert.equal(seenIds1.size, 9, 'All 9 questions in an attempt must be unique');

  // Generate second attempt, passing recently seen IDs
  const attempt2 = generateAttemptQuestions(attempt1.map((q) => q.id));
  assert.equal(attempt2.length, 9);

  // Check that fresh attempt picks unseen questions when alternatives exist (bank has 30/round, we passed 3)
  const overlap = attempt2.filter((q) => seenIds1.has(q.id));
  assert.equal(
    overlap.length,
    0,
    'Subsequent attempt should avoid recently seen questions when 27 alternatives exist in each round'
  );

  // Check option shuffling and correct answer preservation
  attempt1.forEach((q) => {
    const originalQ = CYBER_CRIME_QUESTION_BANK.find((orig) => orig.id === q.id);
    const originalCorrectText = originalQ.options.find((o) => o.id === originalQ.correctOptionId).text;
    const shuffledCorrectOption = q.options.find((o) => o.id === q.correctOptionId);

    assert.ok(shuffledCorrectOption, `Shuffled question ${q.id} must have a valid correct option`);
    assert.equal(
      shuffledCorrectOption.text,
      originalCorrectText,
      `Correct answer text must match original correct text after option shuffling in question ${q.id}`
    );
  });
});

test('Scoring and Accuracy Formula Validation', () => {
  // Empty state handling: before any question is evaluated
  assert.equal(calculateAccuracy(0, 0), null, 'Empty state must return null, not 0% or 100%');
  assert.equal(calculateAccuracy(0, -1), null, 'Invalid evaluated count must return null');

  // 9 correct out of 9 = 100%
  assert.equal(calculateAccuracy(9, 9), 100);

  // 7 correct out of 9 = 77.78%
  assert.equal(calculateAccuracy(7, 9), 77.78);

  // 5 correct out of 9 = 55.56%
  assert.equal(calculateAccuracy(5, 9), 55.56);

  // 0 correct out of 9 = 0%
  assert.equal(calculateAccuracy(0, 9), 0);

  // 1 correct out of 3 = 33.33%
  assert.equal(calculateAccuracy(1, 3), 33.33);

  // 2 correct out of 3 = 66.67%
  assert.equal(calculateAccuracy(2, 3), 66.67);
});

test('Performance Tier Brackets Validation', () => {
  // 90–100%: Excellent Cyber Detective
  assert.equal(getPerformanceTier(100).tier, 'Excellent Cyber Detective');
  assert.equal(getPerformanceTier(90).tier, 'Excellent Cyber Detective');

  // 75–89.99%: Skilled Investigator
  assert.equal(getPerformanceTier(89.99).tier, 'Skilled Investigator');
  assert.equal(getPerformanceTier(75).tier, 'Skilled Investigator');

  // 50–74.99%: Junior Investigator
  assert.equal(getPerformanceTier(74.99).tier, 'Junior Investigator');
  assert.equal(getPerformanceTier(50).tier, 'Junior Investigator');

  // Below 50%: Keep Practising
  assert.equal(getPerformanceTier(49.99).tier, 'Keep Practising');
  assert.equal(getPerformanceTier(10).tier, 'Keep Practising');
  assert.equal(getPerformanceTier(0).tier, 'Keep Practising');

  // Unstarted: Not Evaluated
  assert.equal(getPerformanceTier(null).tier, 'Not Evaluated');
});

test('Badge Catalog and Unlock Conditions Evaluation', () => {
  assert.ok(CYBER_CRIME_BADGES_CATALOG.length >= 13, 'Must have at least 13 badges');

  // Test Round 1 Progression Badge unlock
  const r1Res = evaluateUnlockedBadges({
    progress: { totalRoundsCompleted: 0, unlockedBadges: [] },
    justCompletedRound: 'round-1',
  });
  const r1BadgeIds = r1Res.newlyUnlocked.map((b) => b.id);
  assert.ok(r1BadgeIds.includes('first-investigation'), 'Must unlock First Investigation on Round 1');
  assert.ok(r1BadgeIds.includes('phishing-defender'), 'Must unlock Phishing Defender on Round 1');

  // Test Accuracy Badges on 9/9 completed run (100%)
  const mockAttempt = {
    evaluatedAnswers: Array.from({ length: 9 }, (_, i) => ({ isCorrect: true })),
  };
  const fullRes = evaluateUnlockedBadges({
    progress: { completedCampaignCount: 0, totalCampaignQuestionsCorrect: 0, unlockedBadges: [] },
    currentAttempt: mockAttempt,
    isFullGameComplete: true,
  });
  const fullBadgeIds = fullRes.newlyUnlocked.map((b) => b.id);
  assert.ok(fullBadgeIds.includes('cyber-rookie'), 'Must unlock Cyber Rookie on first full game');
  assert.ok(fullBadgeIds.includes('crime-scene-expert'), 'Must unlock Crime Scene Expert on 3 rounds cleared');
  assert.ok(fullBadgeIds.includes('careful-investigator'), 'Must unlock Careful Investigator (>=70%)');
  assert.ok(fullBadgeIds.includes('cyber-sleuth'), 'Must unlock Cyber Sleuth (>=85%)');
  assert.ok(fullBadgeIds.includes('master-investigator'), 'Must unlock Master Investigator (>=95%)');
  assert.ok(fullBadgeIds.includes('sharp-observer'), 'Must unlock Sharp Observer (>=5 correct)');

  // Test Dedication Badges (5 attempts)
  const dedication5 = evaluateUnlockedBadges({
    progress: { completedCampaignCount: 4, unlockedBadges: [] },
    isFullGameComplete: true,
  });
  assert.ok(
    dedication5.newlyUnlocked.some((b) => b.id === 'persistent-detective'),
    'Must unlock Persistent Detective on 5th completed campaign'
  );

  // Test Dedication Badges (10 attempts)
  const dedication10 = evaluateUnlockedBadges({
    progress: { completedCampaignCount: 9, unlockedBadges: [] },
    isFullGameComplete: true,
  });
  assert.ok(
    dedication10.newlyUnlocked.some((b) => b.id === 'investigation-veteran'),
    'Must unlock Investigation Veteran on 10th completed campaign'
  );

  // Test Daily Defender (5 different days)
  const dailyDefender = evaluateUnlockedBadges({
    progress: {
      completedMissionsByDate: {
        '2026-10-21': {},
        '2026-10-22': {},
        '2026-10-23': {},
        '2026-10-24': {},
        '2026-10-25': {},
      },
      unlockedBadges: [],
    },
  });
  assert.ok(
    dailyDefender.newlyUnlocked.some((b) => b.id === 'daily-defender'),
    'Must unlock Daily Defender after completing missions on 5 days'
  );
});

test('Analytics and Statistical Aggregation Engine', () => {
  const mockProgress = {
    totalAttempts: 3,
    completedCampaignCount: 2,
    totalRoundsCompleted: 6,
    totalCampaignQuestionsEvaluated: 18,
    totalCampaignQuestionsCorrect: 15,
    totalCampaignQuestionsIncorrect: 3,
    totalPoints: 150,
    totalGlobalExpContributed: 150,
    completedMissionsCount: 3,
    roundWiseStats: {
      'round-1': { correct: 6, evaluated: 6 },
      'round-2': { correct: 5, evaluated: 6 },
      'round-3': { correct: 4, evaluated: 6 },
    },
    historicalAttempts: [
      {
        attemptId: 'cca_2',
        completedAt: '2026-10-26T12:00:00Z',
        evaluatedCount: 9,
        correctCount: 8,
        questionScore: 80,
        accuracy: 88.89,
      },
      {
        attemptId: 'cca_1',
        completedAt: '2026-10-26T10:00:00Z',
        evaluatedCount: 9,
        correctCount: 7,
        questionScore: 70,
        accuracy: 77.78,
      },
    ],
    unlockedBadges: [{ id: 'b1' }, { id: 'b2' }],
  };

  const analytics = calculateGameAnalytics(mockProgress);

  // Overall accuracy: 15 / 18 = 83.33%
  assert.equal(analytics.overallAccuracy, 83.33);
  assert.equal(analytics.bestAccuracy, 88.89);
  // Average: (88.89 + 77.78) / 2 = 83.34%
  assert.equal(analytics.averageAccuracy, 83.34);

  // Performance Delta: latest (88.89) - previous (77.78) = +11.11%
  assert.equal(analytics.performanceDelta, 11.11);

  // Best performing round: Round 1 (100%)
  assert.equal(analytics.bestPerformingRound.id, 'round-1');
  assert.equal(analytics.bestPerformingRound.accuracy, 100);

  // Most challenging round: Round 3 (66.67%)
  assert.equal(analytics.mostChallengingRound.id, 'round-3');
  assert.equal(analytics.mostChallengingRound.accuracy, 66.67);
});

test('Daily Missions Deterministic Refresh Logic', () => {
  assert.ok(DAILY_MISSIONS_POOL.length >= 6, 'Pool must contain at least 6 missions');

  // Same date yields identical set
  const day1SetA = getDailyMissionsForDate('2026-10-26', 3);
  const day1SetB = getDailyMissionsForDate('2026-10-26', 3);

  assert.equal(day1SetA.length, 3);
  assert.equal(day1SetB.length, 3);
  assert.deepEqual(
    day1SetA.map((m) => m.id),
    day1SetB.map((m) => m.id),
    'Same date must produce identical mission sets'
  );

  // Next date boundary yields rotating set
  const day2Set = getDailyMissionsForDate('2026-10-27', 3);
  assert.equal(day2Set.length, 3);

  // Reset timer returns valid UTC hours/minutes
  const resetInfo = getNextDailyResetInfo();
  assert.ok(resetInfo.hours >= 0 && resetInfo.hours <= 24);
  assert.ok(resetInfo.minutes >= 0 && resetInfo.minutes <= 59);
  assert.equal(resetInfo.timezone, 'UTC');
});
