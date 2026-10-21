import { readFile } from 'node:fs/promises';
import { HttpError } from '../utils/HttpError.js';

const SIGHTENGINE_ENDPOINT = 'https://api.sightengine.com/1.0/check.json';
const REQUEST_TIMEOUT_MS = 20_000;

export async function analyzeWithSightengine(file, { fetchImpl = fetch } = {}) {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    throw new HttpError(
      503,
      'Image detection is not configured. Contact the administrator.',
      'DETECTION_NOT_CONFIGURED',
    );
  }

  const image = await readFile(file.path);
  const form = new FormData();
  form.append('media', new Blob([image], { type: file.mimetype }), file.originalname);
  form.append('models', 'genai');
  form.append('api_user', apiUser);
  form.append('api_secret', apiSecret);

  let response;
  try {
    response = await fetchImpl(SIGHTENGINE_ENDPOINT, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new HttpError(
        504,
        'Image detection timed out. Please try again.',
        'PROVIDER_TIMEOUT',
      );
    }
    throw new HttpError(
      502,
      'The image detection provider could not be reached. Please try again.',
      'PROVIDER_UNAVAILABLE',
    );
  }

  if (response.status === 402 || response.status === 429) {
    throw new HttpError(
      503,
      'Image detection is temporarily rate limited or unavailable. Please try again later.',
      'PROVIDER_LIMIT_REACHED',
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new HttpError(
      502,
      'The image detection provider returned an invalid response.',
      'INVALID_PROVIDER_RESPONSE',
    );
  }

  if (body?.error?.type === 'usage_limit') {
    throw new HttpError(
      503,
      'Image detection quota has been reached. Please try again later.',
      'PROVIDER_LIMIT_REACHED',
    );
  }

  if (!response.ok) {
    throw new HttpError(
      502,
      'The image detection provider could not process this request.',
      'PROVIDER_REQUEST_FAILED',
    );
  }

  if (body?.status !== 'success') {
    throw new HttpError(
      502,
      'The image detection provider could not analyze this image.',
      'PROVIDER_ANALYSIS_FAILED',
    );
  }

  return body;
}
