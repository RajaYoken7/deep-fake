import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAnalyzeImageHandler } from '../controllers/detectionController.js';
import {
  receiveImage,
  validateImageContent,
} from '../middleware/uploadMiddleware.js';

export function createDetectionRouter({ detectImage } = {}) {
  const detectionRouter = Router();

  detectionRouter.post(
    '/analyze',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        error: 'Too many image analyses. Please try again later.',
        code: 'RATE_LIMITED',
      },
    }),
    receiveImage,
    validateImageContent,
    createAnalyzeImageHandler(detectImage),
  );

  return detectionRouter;
}
