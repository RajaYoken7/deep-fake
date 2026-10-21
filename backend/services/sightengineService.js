import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { HttpError } from '../utils/HttpError.js';

const SIGHTENGINE_ENDPOINT = 'https://api.sightengine.com/1.0/check.json';
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Checks whether Sightengine credentials are configured in environment variables.
 * @returns {boolean}
 */
export function isSightengineConfigured() {
  const user = process.env.SIGHTENGINE_API_USER;
  const secret = process.env.SIGHTENGINE_API_SECRET;

  if (!user || !secret) return false;
  if (user.includes('replace_with') || secret.includes('replace_with')) return false;
  return true;
}

/**
 * Core Sightengine API call for Deepfake Detection feature.
 * Conforms to detectionService requirements and error mapping.
 */
export async function analyzeWithSightengine(file, { fetchImpl = fetch } = {}) {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret || !isSightengineConfigured()) {
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

/**
 * Checks an image against Sightengine API for Identity Guardian Section B analysis.
 * Returns structured object without throwing HttpError to allow graceful fallback to local spectral engine.
 * @param {string} imagePath - Path to local image file
 * @returns {Promise<object>}
 */
export async function checkGenAiWithSightengine(imagePath) {
  if (!isSightengineConfigured()) {
    return {
      isConfigured: false,
      message: 'Sightengine credentials (SIGHTENGINE_API_USER / SIGHTENGINE_API_SECRET) are not configured in backend/.env.'
    };
  }

  try {
    const user = process.env.SIGHTENGINE_API_USER;
    const secret = process.env.SIGHTENGINE_API_SECRET;

    const fileBuffer = await fs.promises.readFile(imagePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('media', blob, path.basename(imagePath));
    formData.append('models', 'genai');
    formData.append('api_user', user);
    formData.append('api_secret', secret);

    const response = await fetch(SIGHTENGINE_ENDPOINT, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Sightengine API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'failure') {
      throw new Error(`Sightengine error: ${data.error?.message || 'Unknown provider failure'}`);
    }

    const aiScore = data.type?.ai_generated; // Number 0.00 to 1.00
    const isAi = typeof aiScore === 'number' && aiScore >= 0.60;

    return {
      isConfigured: true,
      provider: 'Sightengine GenAI Detection API',
      aiScore: typeof aiScore === 'number' ? Math.round(aiScore * 1000) / 1000 : null,
      rawStatus: data.status,
      decision: isAi ? 'LIKELY AI-GENERATED/MANIPULATED' : 'LIKELY REAL-LIKE',
      details: data
    };
  } catch (error) {
    return {
      isConfigured: true,
      provider: 'Sightengine GenAI Detection API',
      error: error.message || 'Failed to reach Sightengine API'
    };
  }
}

export default {
  isSightengineConfigured,
  analyzeWithSightengine,
  checkGenAiWithSightengine,
};
