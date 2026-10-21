import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  register,
  login,
  getCurrentUser,
  refresh,
  logout,
  logoutAll,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = Router();

// Strict rate limiter for authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMITED',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', authenticateToken, logoutAll);

export default router;
