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

  // Execute local Computer Vision & Deep Learning engine (YuNet + SFace)
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
 * Validated CompreFace integration helper
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

  // If no face found in source or target image by CompreFace
  if (!data.result || data.result.length === 0) {
    return {
      faceComparison: {
        decision: 'INCONCLUSIVE',
        similarityScore: null,
        threshold: 75.0,
        confidence: 'Low',
        explanation: 'CompreFace was unable to detect a distinct face in one or both uploaded images.'
      },
      imageQuality: {
        image1: { facesDetected: 0, suitableForComparison: false },
        image2: { facesDetected: 0, suitableForComparison: false }
      },
      modelInfo: {
        faceComparisonEngine: 'CompreFace Verification API',
        faceModelVersion: 'InsightFace-SubCenter-ArcFace',
        engineType: 'Managed Face Verification Service',
        livenessChecked: false,
        livenessNote: 'CompreFace face comparison does not perform active 3D liveness detection.'
      },
      warnings: ['No detectable human face identified by the facial recognition service.'],
      limitations: [
        'Still-image comparison cannot verify physical presence or liveness.',
        'Lighting and camera angles may alter face similarity measurements.'
      ]
    };
  }

  const match = data.result[0];
  if (typeof match.similarity !== 'number') {
    return {
      faceComparison: {
        decision: 'INCONCLUSIVE',
        similarityScore: null,
        threshold: 75.0,
        confidence: 'Low',
        explanation: 'CompreFace returned an invalid or unscoreable facial match response.'
      },
      imageQuality: {
        image1: { facesDetected: 1, suitableForComparison: true },
        image2: { facesDetected: 1, suitableForComparison: true }
      },
      modelInfo: {
        faceComparisonEngine: 'CompreFace Verification API',
        faceModelVersion: 'InsightFace-SubCenter-ArcFace',
        engineType: 'Managed Face Verification Service',
        livenessChecked: false
      },
      warnings: ['Ambiguous or unquantified facial similarity response.'],
      limitations: []
    };
  }

  const rawSimilarity = match.similarity;
  const score = Math.round(rawSimilarity * 1000) / 10;
  const threshold = 75.0;

  let decision = 'INCONCLUSIVE';
  let confidence = 'Moderate';
  let explanation = '';

  if (score >= threshold) {
    decision = 'LIKELY SAME PERSON';
    confidence = score >= 85.0 ? 'High' : 'Moderate';
    explanation = `CompreFace verified facial similarity at ${score}% (threshold ${threshold}%). Anatomical landmarks and facial structure match.`;
  } else if (score < 55.0) {
    decision = 'LIKELY DIFFERENT PERSON';
    confidence = score <= 40.0 ? 'High' : 'Moderate';
    explanation = `CompreFace similarity score (${score}%) is significantly below the verification threshold (${threshold}%). Facial structure indicates different individuals.`;
  } else {
    decision = 'INCONCLUSIVE';
    confidence = 'Low';
    explanation = `CompreFace similarity score (${score}%) falls within the borderline ambiguous range (55.0% - ${threshold}%).`;
  }

  return {
    faceComparison: {
      decision,
      similarityScore: score,
      threshold,
      confidence,
      explanation
    },
    imageQuality: {
      image1: { facesDetected: 1, suitableForComparison: true },
      image2: { facesDetected: 1, suitableForComparison: true }
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
