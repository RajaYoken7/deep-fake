import { runPythonCvEngine } from './pythonEngineService.js';

/**
 * Performs face comparison between two portrait images (ID photo vs Selfie).
 * Validates faces, checks quality, and returns decision, score, threshold, and metrics.
 * 
 * @param {string} idPhotoPath 
 * @param {string} selfiePath 
 * @returns {Promise<object>}
 */
export async function compareIdAndSelfieFaces(idPhotoPath, selfiePath) {
  // Check if CompreFace or external face comparison is configured
  const comprefaceUrl = process.env.COMPREFACE_URL;
  const comprefaceKey = process.env.COMPREFACE_API_KEY;

  if (comprefaceUrl && comprefaceKey && !comprefaceKey.includes('replace_with')) {
    try {
      const comprefaceResult = await verifyWithCompreFace(comprefaceUrl, comprefaceKey, idPhotoPath, selfiePath);
      if (comprefaceResult) return comprefaceResult;
    } catch (err) {
      console.warn(`[FaceComparisonService] CompreFace check failed, falling back to local engine: ${err.message}`);
    }
  }

  // Execute local Computer Vision & Deep Learning engine
  const cvResult = await runPythonCvEngine('id_photo_verification', idPhotoPath, selfiePath);

  if (!cvResult || !cvResult.success) {
    throw new Error(cvResult?.error || 'Local face comparison engine failed to process images.');
  }

  return {
    faceComparison: cvResult.faceComparison,
    imageQuality: cvResult.imageQuality,
    modelInfo: cvResult.modelInfo,
    warnings: cvResult.warnings || [],
    limitations: cvResult.limitations || []
  };
}

/**
 * Optional CompreFace integration helper
 */
async function verifyWithCompreFace(baseUrl, apiKey, sourcePath, targetPath) {
  const fs = await import('fs');
  const path = await import('path');

  const sourceBuffer = await fs.promises.readFile(sourcePath);
  const targetBuffer = await fs.promises.readFile(targetPath);

  const formData = new FormData();
  formData.append('source_image', new Blob([sourceBuffer]), path.basename(sourcePath));
  formData.append('target_image', new Blob([targetBuffer]), path.basename(targetPath));

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/recognition/faces/verify`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey
    },
    body: formData,
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) return null;
  const data = await response.json();

  const match = data.result?.[0];
  const rawSimilarity = match?.similarity || 0;
  const score = Math.round(rawSimilarity * 1000) / 10;
  const threshold = 80.0;

  let decision = 'INCONCLUSIVE';
  if (score >= threshold) decision = 'SAME PERSON';
  else if (score < 60.0) decision = 'DIFFERENT PERSON';

  return {
    faceComparison: {
      decision,
      similarityScore: score,
      threshold,
      confidence: score >= 85 ? 'High' : score < 50 ? 'High' : 'Moderate',
      explanation: `CompreFace verified facial similarity at ${score}% (threshold ${threshold}%).`
    },
    modelInfo: {
      faceComparisonEngine: 'CompreFace Verification API',
      faceModelVersion: 'InsightFace-SubCenter-ArcFace',
      engineType: 'Managed Face Verification Service',
      livenessChecked: false,
      livenessNote: 'CompreFace face comparison does not perform active 3D liveness detection.'
    },
    warnings: [],
    limitations: [
      'Still-image comparison cannot verify physical presence or liveness.',
      'Lighting and camera angles may alter face similarity measurements.'
    ]
  };
}

export default {
  compareIdAndSelfieFaces
};
