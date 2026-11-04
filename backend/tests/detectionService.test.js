import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDetectionResult,
  classifyAiGeneratedScore,
} from '../services/detectionService.js';

test('classifies scores at and outside configured decision boundaries', () => {
  assert.equal(classifyAiGeneratedScore(0.8, 0.8), 'AI_GENERATED');
  assert.equal(classifyAiGeneratedScore(0.2, 0.8), 'NOT_AI_GENERATED');
  assert.equal(classifyAiGeneratedScore(0.5, 0.8), 'INCONCLUSIVE');
});

test('returns inconclusive for absent, non-finite, or out-of-range model scores', () => {
  for (const response of [
    {},
    { type: {} },
    { type: { ai_generated: Number.NaN } },
    { type: { ai_generated: 1.1 } },
  ]) {
    const result = buildDetectionResult(response, 0.8);
    assert.equal(result.classification, 'INCONCLUSIVE');
    assert.equal(result.score, null);
  }
});

test('preserves the provider score separately from the classification', () => {
  const result = buildDetectionResult({ type: { ai_generated: 0.91 } }, 0.8);
  assert.equal(result.classification, 'AI_GENERATED');
  assert.equal(result.score, 0.91);
  assert.equal(result.threshold, 0.8);
});
