import { Router } from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  getHealth,
  verifyIdPhoto,
  verifyAiPhoto
} from '../controllers/identityGuardianController.js';

const router = Router();

// GET /api/identity-guardian/health
router.get('/health', getHealth);

// POST /api/identity-guardian/id-photo/verify (Section A)
router.post(
  '/id-photo/verify',
  upload.fields([
    { name: 'id_photo', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  verifyIdPhoto
);

// POST /api/identity-guardian/ai-photo/verify (Section B)
router.post(
  '/ai-photo/verify',
  upload.fields([
    { name: 'suspected_photo', maxCount: 1 },
    { name: 'reference_photo', maxCount: 1 }
  ]),
  verifyAiPhoto
);

export default router;
