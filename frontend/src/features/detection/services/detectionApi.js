const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const classifications = new Set([
  'AI_GENERATED',
  'NOT_AI_GENERATED',
  'INCONCLUSIVE',
]);

export async function analyzeImage(file) {
  const form = new FormData();
  form.append('media', file);

  let response;
  try {
    response = await fetch(`${API_URL}/api/detection/analyze`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new Error('Could not reach the detection service. Check your connection and try again.');
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('The detection service returned an invalid response. Please try again.');
  }

  if (!response.ok) {
    throw new Error(body.error || 'Image analysis failed. Please try again.');
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
