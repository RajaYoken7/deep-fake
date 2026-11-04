import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  adminLogin,
  adminLogout,
  getAdminMe,
  getAdminOverview,
  getAdminUsers,
  getAdminUserDetails,
  toggleUserStatus,
  getAdminDetectionHistory,
  getAdminIdentityHistory,
  getAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  toggleAdminQuestion,
  publishAdminQuestion,
  getAdminImages,
  createAdminImage,
  updateAdminImage,
  deleteAdminImage,
  toggleAdminImage,
  publishAdminImage,
  getAdminGameHistory,
  getAdminLeaderboard,
  getAdminReports,
  getAdminAuditLogs,
  getAdminCyberCrimeRounds,
  createAdminCyberCrimeRound,
  updateAdminCyberCrimeRound,
  deleteAdminCyberCrimeRound,
  publishAdminCyberCrimeRound,
  toggleAdminCyberCrimeRound,
  getAdminCyberCrimeQuestions,
  createAdminCyberCrimeQuestion,
  updateAdminCyberCrimeQuestion,
  deleteAdminCyberCrimeQuestion,
  publishAdminCyberCrimeQuestion,
  toggleAdminCyberCrimeQuestion,
  reorderAdminCyberCrimeQuestions,
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Strict login rate limiter for administrator authentication
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMITED',
  },
});

// Multipart upload handler for game question images
const questionImageUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'genuineImage', maxCount: 1 },
  { name: 'aiImage', maxCount: 1 },
]);

// Single image upload handler for image bank
const singleImageUpload = upload.single('image');

// -------------------------------------------------------------
// Public Admin Authentication Routes (Supports both /login and /auth/login)
// -------------------------------------------------------------
router.post('/auth/login', adminAuthLimiter, adminLogin);
router.post('/login', adminAuthLimiter, adminLogin);

// -------------------------------------------------------------
// Protected Admin Routes (Require valid token + ADMIN role)
// -------------------------------------------------------------
router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

// Admin session management
router.post('/auth/logout', adminLogout);
router.get('/auth/me', getAdminMe);

// Dashboard Overview & Real MongoDB Stats
router.get('/dashboard/stats', getAdminOverview);
router.get('/overview', getAdminOverview); // Backward-compatibility alias

// User Management
router.get('/users', getAdminUsers);
router.get('/users/:id/details', getAdminUserDetails);
router.patch('/users/:id/status', toggleUserStatus);

// Forensic Inspection History
router.get('/detection-history', getAdminDetectionHistory);
router.get('/identity-history', getAdminIdentityHistory);

// Deepfake Detection Game: Card 1 - Question Management
router.get('/games/questions', getAdminQuestions);
router.post('/games/questions', questionImageUpload, createAdminQuestion);
router.put('/games/questions/:id', questionImageUpload, updateAdminQuestion);
router.delete('/games/questions/:id', deleteAdminQuestion);
router.patch('/games/questions/:id/toggle', toggleAdminQuestion);
router.patch('/games/questions/:id/publish', publishAdminQuestion);

// Deepfake Detection Game: Card 2 - Image Management
router.get('/games/images', getAdminImages);
router.post('/games/images', singleImageUpload, createAdminImage);
router.put('/games/images/:id', singleImageUpload, updateAdminImage);
router.delete('/games/images/:id', deleteAdminImage);
router.patch('/games/images/:id/toggle', toggleAdminImage);
router.patch('/games/images/:id/publish', publishAdminImage);

// Cyber Crime Investigation Game: Card 2 - Question Bank & Round Management
router.get('/cybercrime/rounds', getAdminCyberCrimeRounds);
router.post('/cybercrime/rounds', createAdminCyberCrimeRound);
router.put('/cybercrime/rounds/:id', updateAdminCyberCrimeRound);
router.delete('/cybercrime/rounds/:id', deleteAdminCyberCrimeRound);
router.patch('/cybercrime/rounds/:id/publish', publishAdminCyberCrimeRound);
router.patch('/cybercrime/rounds/:id/toggle', toggleAdminCyberCrimeRound);
router.get('/cybercrime/rounds/:roundId/questions', getAdminCyberCrimeQuestions);
router.post('/cybercrime/rounds/:roundId/questions', createAdminCyberCrimeQuestion);
router.put('/cybercrime/questions/:id', updateAdminCyberCrimeQuestion);
router.delete('/cybercrime/questions/:id', deleteAdminCyberCrimeQuestion);
router.patch('/cybercrime/questions/:id/publish', publishAdminCyberCrimeQuestion);
router.patch('/cybercrime/questions/:id/toggle', toggleAdminCyberCrimeQuestion);
router.put('/cybercrime/rounds/:roundId/reorder', reorderAdminCyberCrimeQuestions);

// Game History & Leaderboard Inspection
router.get('/games/history', getAdminGameHistory);
router.get('/leaderboard', getAdminLeaderboard);

// Platform Reports & CSV Exports
router.get('/reports', getAdminReports);
router.get('/reports/export', getAdminReports);

// Administrative Security Audit Trail
router.get('/activity-logs', getAdminAuditLogs);
router.get('/audit-logs', getAdminAuditLogs); // Backward-compatibility alias

export default router;
