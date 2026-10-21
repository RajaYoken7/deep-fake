import { Router } from 'express';
import {
  updateProfile,
  changePassword,
  getUserHistory,
  getUserStats,
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = Router();

// All user routes require a valid access token
router.use(authenticateToken);

router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/history', getUserHistory);
router.get('/stats', getUserStats);

export default router;
