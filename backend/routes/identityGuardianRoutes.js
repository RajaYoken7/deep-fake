import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
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

// GET /api/identity-guardian/health
router.get('/health', getHealth);

// POST /api/identity-guardian/id-photo/verify (Section A)
router.post(
  '/id-photo/verify',
  optionalAuthenticateToken,
  upload.fields([
    { name: 'id_photo', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  verifyIdPhoto
);

// POST /api/identity-guardian/ai-photo/verify (Section B)
router.post(
  '/ai-photo/verify',
  optionalAuthenticateToken,
  upload.fields([
    { name: 'suspected_photo', maxCount: 1 },
    { name: 'reference_photo', maxCount: 1 }
  ]),
  verifyAiPhoto
);

// GET /api/identity-guardian/history
router.get('/history', authenticateToken, getIdentityHistory);

export default router;
