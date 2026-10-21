import { unlink } from 'node:fs/promises';
import { detectAiGeneratedImage } from '../services/detectionService.js';
import { DetectionHistory } from '../models/DetectionHistory.js';

async function removeTemporaryUpload(filePath) {
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export function createAnalyzeImageHandler(detectImage = detectAiGeneratedImage) {
  return async function analyzeImage(req, res, next) {
    const filePath = req.file?.path;
    let result;
    let analysisError;

    try {
      result = await detectImage(req.file);
    } catch (error) {
      analysisError = error;
    }

    try {
      await removeTemporaryUpload(filePath);
    } catch (cleanupError) {
      next(cleanupError);
      return;
    }

    if (analysisError) return next(analysisError);

    // Save detection result under the authenticated user's account if authenticated
    if (req.user && result) {
      try {
        await DetectionHistory.create({
          userId: req.user._id,
          fileName: req.file?.originalname || 'Uploaded Image',
          fileSize: req.file?.size || 0,
          mimeType: req.file?.mimetype || '',
          classification: result.classification,
          score: result.score,
          threshold: result.threshold,
          disclaimer: result.disclaimer,
        });
      } catch (historyErr) {
        console.warn(`[DetectionHistory Warning] Could not save history: ${historyErr.message}`);
      }
    }

    res.json(result);
  };
}

/**
 * GET /api/detection/history
 * Returns the authenticated user's own detection history
 */
export async function getDetectionHistory(req, res, next) {
  try {
    const history = await DetectionHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        detections: history,
      },
    });
  } catch (error) {
    return next(error);
  }
}
