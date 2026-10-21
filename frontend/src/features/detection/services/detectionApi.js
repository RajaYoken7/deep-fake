import { apiRequest } from '../../../services/apiClient';

const classifications = new Set([
  'AI_GENERATED',
  'NOT_AI_GENERATED',
  'INCONCLUSIVE',
]);

export async function analyzeImage(file) {
  const form = new FormData();
  form.append('media', file);

  let body;
  try {
    body = await apiRequest('/api/detection/analyze', {
      method: 'POST',
      body: form,
    });
  } catch (err) {
    throw new Error(err.message || 'Image analysis failed. Please try again.');
  }

  if (
    !classifications.has(body.classification)
    || (body.score !== null
      && (!Number.isFinite(body.score) || body.score < 0 || body.score > 1))
  ) {
    throw new Error('The detection service returned an invalid result. Please try again.');
  }

  return body;
}

export default { analyzeImage };
