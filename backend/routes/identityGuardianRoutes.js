import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  upload,
  validateMultiImageContent,
} from '../middleware/uploadMiddleware.js';
import {
  getHealth,
  verifyIdPhoto,
  verifyAiPhoto,
  getIdentityHistory,
} from '../controllers/identityGuardianController.js';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '../middleware/authenticateToken.js';

const router = Router();

// Strict rate limiter for CPU/Memory intensive CV verification
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 verification analyses per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification requests. Please wait a few minutes before trying again.',
    code: 'RATE_LIMITED',
  },
});

// GET /api/identity-guardian/health
router.get('/health', getHealth);

// POST /api/identity-guardian/id-photo/verify (Section A)
router.post(
  '/id-photo/verify',
  verificationLimiter,
  optionalAuthenticateToken,
  upload.fields([
    { name: 'id_photo', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  validateMultiImageContent,
  verifyIdPhoto,
);

// POST /api/identity-guardian/ai-photo/verify (Section B)
router.post(
  '/ai-photo/verify',
  verificationLimiter,
  optionalAuthenticateToken,
  upload.fields([
    { name: 'suspected_photo', maxCount: 1 },
    { name: 'reference_photo', maxCount: 1 },
  ]),
  validateMultiImageContent,
  verifyAiPhoto,
);

// GET /api/identity-guardian/history
router.get('/history', authenticateToken, getIdentityHistory);

export default router;
