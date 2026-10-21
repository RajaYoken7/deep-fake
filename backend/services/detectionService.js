import { DEFAULT_AI_GENERATED_THRESHOLD } from '../constants/detection.js';
import { analyzeWithSightengine } from './sightengineService.js';

function getClassificationThreshold() {
  const configured = process.env.AI_GENERATED_THRESHOLD;
  if (configured === undefined || configured === '') {
    return DEFAULT_AI_GENERATED_THRESHOLD;
  }

  const threshold = Number(configured);
  if (!Number.isFinite(threshold) || threshold <= 0.5 || threshold > 1) {
    throw new Error('AI_GENERATED_THRESHOLD must be greater than 0.5 and at most 1.');
  }
  return threshold;
}

export function classifyAiGeneratedScore(score, threshold = getClassificationThreshold()) {
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    return 'INCONCLUSIVE';
  }
  if (score >= threshold) {
    return 'AI_GENERATED';
  }
  if (score <= 1 - threshold + Number.EPSILON) {
    return 'NOT_AI_GENERATED';
  }
  return 'INCONCLUSIVE';
}

export function buildDetectionResult(providerResponse, threshold = getClassificationThreshold()) {
  const score = providerResponse?.type?.ai_generated;
  const validScore = Number.isFinite(score) && score >= 0 && score <= 1
    ? score
    : null;

  return {
    classification: validScore === null
      ? 'INCONCLUSIVE'
      : classifyAiGeneratedScore(validScore, threshold),
    score: validScore,
    threshold,
    disclaimer: 'NOT_AI_GENERATED means the API did not detect strong AI-generation indicators; it does not prove the image is authentic.',
  };
}

export async function detectAiGeneratedImage(file) {
  const providerResponse = await analyzeWithSightengine(file);
  return buildDetectionResult(providerResponse);
}
