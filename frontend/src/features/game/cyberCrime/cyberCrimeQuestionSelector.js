/**
 * Cyber Crime Investigation — Dynamic Question Selector
 * Selects varied question sets across attempts and users, avoids recent repetition,
 * and shuffles option order while preserving correct answer mappings.
 */

import {
  ROUND_1_QUESTION_BANK,
  ROUND_2_QUESTION_BANK,
  ROUND_3_QUESTION_BANK,
} from './cyberCrimeQuestionBank.js';

/**
 * Fisher-Yates array shuffle.
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Selects N questions from a pool, prioritizing items not recently seen.
 */
function pickUniqueQuestions(pool, count = 3, recentlySeenIds = new Set()) {
  const unseen = pool.filter((q) => !recentlySeenIds.has(q.id));
  const seen = pool.filter((q) => recentlySeenIds.has(q.id));

  // Shuffle both sets
  const shuffledUnseen = shuffleArray(unseen);
  const shuffledSeen = shuffleArray(seen);

  const selected = [];

  // Take as many unseen as possible
  while (selected.length < count && shuffledUnseen.length > 0) {
    selected.push(shuffledUnseen.pop());
  }

  // If we still need more, recycle seen questions
  while (selected.length < count && shuffledSeen.length > 0) {
    selected.push(shuffledSeen.pop());
  }

  return selected;
}

/**
 * Shuffles options for a question while maintaining correct answer mapping.
 */
function shuffleQuestionOptions(question) {
  const correctOption = question.options.find((o) => o.id === question.correctOptionId);
  const correctText = correctOption ? correctOption.text : '';

  const shuffledTexts = shuffleArray(question.options.map((o) => o.text));
  const optionLetters = ['a', 'b', 'c', 'd'];

  const newOptions = optionLetters.map((letter, idx) => ({
    id: letter,
    text: shuffledTexts[idx],
  }));

  const newCorrectOption = newOptions.find((o) => o.text === correctText);
  const newCorrectOptionId = newCorrectOption ? newCorrectOption.id : question.correctOptionId;

  return {
    ...question,
    options: newOptions,
    correctOptionId: newCorrectOptionId,
  };
}

/**
 * Generates a full 9-question campaign playthrough (3 questions per round).
 * Avoids questions that were seen recently by the player.
 */
export function generateAttemptQuestions(recentlySeenIds = []) {
  const seenSet = new Set(recentlySeenIds);

  const r1Selected = pickUniqueQuestions(ROUND_1_QUESTION_BANK, 3, seenSet);
  const r2Selected = pickUniqueQuestions(ROUND_2_QUESTION_BANK, 3, seenSet);
  const r3Selected = pickUniqueQuestions(ROUND_3_QUESTION_BANK, 3, seenSet);

  const combined = [
    ...shuffleArray(r1Selected).map(shuffleQuestionOptions),
    ...shuffleArray(r2Selected).map(shuffleQuestionOptions),
    ...shuffleArray(r3Selected).map(shuffleQuestionOptions),
  ];

  return combined.map((q, idx) => ({
    ...q,
    questionNumber: idx + 1,
  }));
}

/**
 * Filters the questions for a specific round.
 */
export function getQuestionsForRound(questions = [], roundId = 'round-1') {
  return questions.filter((q) => q.roundId === roundId);
}
