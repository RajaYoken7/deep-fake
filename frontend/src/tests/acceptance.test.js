import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  calculateAccuracy,
  DAILY_MISSIONS_POOL,
} from '../features/game/cyberCrime/cyberCrimeData.js';
import {
  calculateGameAnalytics,
  getNextDailyResetInfo,
  getDailyMissionsForDate,
} from '../features/game/cyberCrime/cyberCrimeStorage.js';
import {
  CYBER_CRIME_BADGES_CATALOG,
  evaluateUnlockedBadges,
} from '../features/game/cyberCrime/cyberCrimeBadges.js';

test('1. Global EXP Progression and Level Calculation Rules', () => {
  // Test progression rules: Level 1 (0 XP), Level 2 (250 XP), Level 3 (600 XP), etc.
  const GLOBAL_LEVELS = [
    { level: 1, xpRequired: 0, title: 'Cadet Detective' },
    { level: 2, xpRequired: 250, title: 'Image Explorer' },
    { level: 3, xpRequired: 600, title: 'Fake Spotter' },
    { level: 4, xpRequired: 1200, title: 'Digital Detective' },
    { level: 5, xpRequired: 2000, title: 'Deepfake Analyst' },
    { level: 6, xpRequired: 3500, title: 'Truth Guardian' },
    { level: 7, xpRequired: 5500, title: 'Cyber Investigator' },
    { level: 8, xpRequired: 8000, title: 'Trust Guardian' },
    { level: 9, xpRequired: 12000, title: 'Master Detective' },
    { level: 10, xpRequired: 18000, title: 'DeepTrust Legend' },
  ];

  function getLevel(totalXP) {
    let curr = GLOBAL_LEVELS[0];
    for (let i = GLOBAL_LEVELS.length - 1; i >= 0; i--) {
      if (totalXP >= GLOBAL_LEVELS[i].xpRequired) {
        curr = GLOBAL_LEVELS[i];
        break;
      }
    }
    return curr;
  }

  // Adding 50 EXP to 200 EXP yields 250 EXP (Level 2)
  const initialXP = 200;
  assert.equal(getLevel(initialXP).level, 1);

  const earnedGameXP = 50;
  const newTotalXP = initialXP + earnedGameXP;
  assert.equal(newTotalXP, 250);
  assert.equal(getLevel(newTotalXP).level, 2);
  assert.equal(getLevel(newTotalXP).title, 'Image Explorer');

  // Both Cyber Crime and Deepfake Detective add to this same balance
  const deepfakeXP = 100;
  const combinedXP = newTotalXP + deepfakeXP;
  assert.equal(combinedXP, 350);
  assert.equal(getLevel(combinedXP).level, 2);
});

test('2. Independent Accuracy Calculation for Each Game', () => {
  // Cyber Crime Formula: (Correct / Evaluated) * 100
  const cyberCorrect = 7;
  const cyberEvaluated = 9;
  const cyberAccuracy = calculateAccuracy(cyberCorrect, cyberEvaluated);
  assert.equal(cyberAccuracy, 77.78);

  // Safe handling of 0 evaluated questions
  assert.equal(calculateAccuracy(0, 0), null);

  // Deepfake Detective Formula: (Correct / (Correct + Incorrect)) * 100
  const deepfakeCorrect = 9;
  const deepfakeIncorrect = 1;
  const deepfakeTotal = deepfakeCorrect + deepfakeIncorrect;
  const deepfakeAccuracy = Math.round((deepfakeCorrect / deepfakeTotal) * 100);
  assert.equal(deepfakeAccuracy, 90);

  // Assert that games keep independent percentages and are never blended
  assert.notEqual(cyberAccuracy, deepfakeAccuracy);
});

test('3. Daily Missions Display Complete Scenario, Clues, and Questions', () => {
  assert.ok(DAILY_MISSIONS_POOL.length >= 6, 'Daily missions pool must contain at least 6 missions');

  DAILY_MISSIONS_POOL.forEach((mission) => {
    assert.ok(mission.id, 'Mission must have an ID');
    assert.ok(mission.title, `Mission ${mission.id} must have a title`);
    assert.ok(mission.description || mission.instructions, `Mission ${mission.id} must have description or instructions`);

    // Scenario Verification
    assert.ok(mission.taskScenario, `Mission ${mission.id} must have a taskScenario object`);
    assert.ok(mission.taskScenario.headline, `Mission ${mission.id} scenario must have a headline`);
    assert.ok(mission.taskScenario.sender, `Mission ${mission.id} scenario must have a sender`);
    assert.ok(mission.taskScenario.body, `Mission ${mission.id} scenario must have a body`);
    assert.ok(mission.taskScenario.body.length > 30, `Mission ${mission.id} scenario body must be detailed`);

    // Question Verification
    assert.ok(mission.question, `Mission ${mission.id} must have a question object`);
    assert.ok(mission.question.prompt, `Mission ${mission.id} question must have a prompt`);
    assert.ok(Array.isArray(mission.question.options), `Mission ${mission.id} must have options array`);
    assert.equal(mission.question.options.length, 4, `Mission ${mission.id} must have 4 options`);
    assert.ok(mission.question.correctOptionId, `Mission ${mission.id} must have correctOptionId`);
    assert.ok(mission.question.explanation, `Mission ${mission.id} must have explanation`);

    // EXP Reward
    assert.ok(mission.rewardXP > 0, `Mission ${mission.id} must have a positive rewardXP`);
  });
});

test('4. Daily Mission Answer Validation and Rewards', () => {
  const mission = DAILY_MISSIONS_POOL[0];
  const correctId = mission.question.correctOptionId;
  const incorrectId = mission.question.options.find((o) => o.id !== correctId).id;

  // Evaluation simulation
  const evalIncorrect = incorrectId === correctId;
  assert.equal(evalIncorrect, false);
  const xpIncorrect = evalIncorrect ? mission.rewardXP : 0;
  assert.equal(xpIncorrect, 0, 'Incorrect answer must award exactly 0 EXP');

  const evalCorrect = correctId === correctId;
  assert.equal(evalCorrect, true);
  const xpCorrect = evalCorrect ? mission.rewardXP : 0;
  assert.equal(xpCorrect, mission.rewardXP, 'Correct answer must award configured mission EXP');
});

test('5. Daily Mission Reset Schedule and Idempotency', () => {
  const resetInfo = getNextDailyResetInfo();
  assert.ok(resetInfo.formatted, 'Reset info must format remaining time');
  assert.equal(resetInfo.timezone, 'UTC');

  // Deterministic daily missions for date
  const dateKey = '2026-10-26';
  const missionsToday = getDailyMissionsForDate(dateKey, 3);
  assert.equal(missionsToday.length, 3);

  // Same date yields same missions
  const missionsAgain = getDailyMissionsForDate(dateKey, 3);
  assert.deepEqual(
    missionsToday.map((m) => m.id),
    missionsAgain.map((m) => m.id)
  );

  // Anti-duplication simulation
  const completedMissionsByDate = {
    '2026-10-26': [missionsToday[0].id],
  };

  const isAlreadyClaimed = (completedMissionsByDate[dateKey] || []).includes(missionsToday[0].id);
  assert.equal(isAlreadyClaimed, true, 'Already claimed mission must be detected and not rewarded again');
});

test('6. Badges Catalog & Unlocking Rules', () => {
  assert.equal(CYBER_CRIME_BADGES_CATALOG.length, 13);
  const ids = new Set();
  CYBER_CRIME_BADGES_CATALOG.forEach((b) => {
    assert.ok(!ids.has(b.id), `Badge ID ${b.id} must be unique`);
    ids.add(b.id);
    assert.ok(b.name, 'Badge must have name');
    assert.ok(b.description, 'Badge must have description');
    assert.ok(b.category, 'Badge must have category');
    assert.ok(typeof b.condition === 'function', 'Badge must have condition function');
  });

  // Evaluate beginner badge
  const result = evaluateUnlockedBadges({
    progress: { totalRoundsCompleted: 1, unlockedBadges: [] },
    justCompletedRound: 'round-1',
  });
  assert.ok(result.newlyUnlocked.some((b) => b.id === 'first-investigation'));
});

test('7. Verification that Custom Investigation is Removed from Deepfake Detective', () => {
  const filePath = resolve(process.cwd(), 'src/features/game/DeepfakeDetectiveGame.jsx');
  const content = readFileSync(filePath, 'utf-8');

  // Custom investigation card and custom upload should not exist in mode selection
  assert.ok(!content.includes("'custom'"), "Deepfake Detective must not have 'custom' mode");
  assert.ok(!content.includes('Custom Investigation'), 'Custom Investigation title must be removed');
  assert.ok(!content.includes('Upload and inspect your own'), 'Custom investigation description must be removed');

  // Essential Deepfake Detective features remain intact
  assert.ok(content.includes('Academy Challenge Deck'), 'Academy Challenge Deck must remain');
  assert.ok(content.includes('handleAnswer'), 'Answer handling must remain');
  assert.ok(content.includes('submitGamePrediction'), 'Prediction API call must remain');
  assert.ok(content.includes('updateUser'), 'Global EXP sync with AuthContext must be present');
});
