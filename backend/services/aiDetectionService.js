import { runPythonCvEngine } from './pythonEngineService.js';
import { checkGenAiWithSightengine, isSightengineConfigured } from './sightengineService.js';

/**
 * Performs dual-analysis for Section B:
 * 1. Face comparison between Suspected Portrait and Reference Selfie
 * 2. Independent synthetic / AI-generated photo detection on the Suspected image
 * 
 * @param {string} suspectedImagePath 
 * @param {string} referenceImagePath 
 * @returns {Promise<object>}
 */
export async function verifyAiPhotoAndFace(suspectedImagePath, referenceImagePath) {
  // 1. Run local CV & Deep Learning dual engine
  const cvResult = await runPythonCvEngine('ai_photo_verification', suspectedImagePath, referenceImagePath);

  if (!cvResult || !cvResult.success) {
    throw new Error(cvResult?.error || 'Local AI photo analysis engine failed.');
  }

  const faceComparison = cvResult.faceComparison;
  const imageQuality = cvResult.imageQuality;
  let aiImageAnalysis = cvResult.aiImageAnalysis;
  const modelInfo = cvResult.modelInfo;
  const warnings = [...(cvResult.warnings || [])];
  const limitations = [...(cvResult.limitations || [])];

  // 2. Check if Sightengine cloud GenAI API is configured to augment the analysis
  if (isSightengineConfigured()) {
    try {
      const sightengineResult = await checkGenAiWithSightengine(suspectedImagePath);
      if (sightengineResult.isConfigured && !sightengineResult.error) {
        modelInfo.cloudDetectionProvider = 'Sightengine GenAI Detection';
        modelInfo.sightengineScore = sightengineResult.aiScore;

        // If Sightengine gives a confident score, integrate it with the local spectral score
        if (sightengineResult.aiScore !== null) {
          const combinedProb = Math.round(((aiImageAnalysis.aiProbability + sightengineResult.aiScore) / 2) * 100) / 100;
          aiImageAnalysis.aiProbability = combinedProb;
          aiImageAnalysis.cloudAiScore = sightengineResult.aiScore;

          if (combinedProb >= 0.60) {
            aiImageAnalysis.decision = 'LIKELY AI-GENERATED/MANIPULATED';
            aiImageAnalysis.confidence = 'High';
          } else if (combinedProb <= 0.35) {
            aiImageAnalysis.decision = 'LIKELY REAL-LIKE';
            aiImageAnalysis.confidence = 'High';
          } else {
            aiImageAnalysis.decision = 'INCONCLUSIVE';
            aiImageAnalysis.confidence = 'Moderate';
          }

          aiImageAnalysis.explanation += ` Cross-validated with Sightengine GenAI API (Cloud AI score: ${Math.round(sightengineResult.aiScore * 100)}%).`;
        }
      }
    } catch (err) {
      warnings.push(`Cloud GenAI provider check skipped: ${err.message}`);
    }
  } else {
    modelInfo.cloudDetectionStatus = 'Unconfigured (Local spectral engine active)';
  }

  limitations.push(
    'Never assume an AI-generated portrait portrays a different individual: face similarity and image authenticity are evaluated as independent dimensions.'
  );

  return {
    faceComparison,
    aiImageAnalysis,
    imageQuality,
    modelInfo,
    warnings,
    limitations
  };
}

export default {
  verifyAiPhotoAndFace
};
