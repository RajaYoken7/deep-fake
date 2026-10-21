import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  createAnalyzeImageHandler,
  getDetectionHistory,
  deleteDetectionHistory,
} from '../controllers/detectionController.js';
import {
  receiveImage,
  validateImageContent,
} from '../middleware/uploadMiddleware.js';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '../middleware/authenticateToken.js';

export function createDetectionRouter({ detectImage } = {}) {
  const detectionRouter = Router();

  detectionRouter.post(
    '/analyze',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 15,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        error: 'Too many image analyses. Please try again later.',
        code: 'RATE_LIMITED',
      },
    }),
    optionalAuthenticateToken,
    receiveImage,
    validateImageContent,
    createAnalyzeImageHandler(detectImage),
  );

  detectionRouter.get('/history', authenticateToken, getDetectionHistory);
  detectionRouter.delete('/history/:id', authenticateToken, deleteDetectionHistory);

  return detectionRouter;
}

export default createDetectionRouter;
