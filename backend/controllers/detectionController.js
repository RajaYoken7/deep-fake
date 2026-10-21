import { unlink } from 'node:fs/promises';
import { detectAiGeneratedImage } from '../services/detectionService.js';

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
    res.json(result);
  };
}
