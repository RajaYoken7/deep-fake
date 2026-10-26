import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { upload, validateImageContent } from '../middleware/uploadMiddleware.js';
import {
  startGameSession,
  submitPrediction,
  completeSession,
  getGameStats,
  getGameHistory,
  getLeaderboard,
  getMyRanking,
  getAchievements,
  getChallenges,
} from '../controllers/gameController.js';

const gameRouter = Router();

// Rate limiter for game submission to prevent automated XP farming
const gameSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded for game submissions. Please slow down.',
    code: 'RATE_LIMITED',
  },
});

// Middleware to extract single file from either 'image' or 'media' fields
const handleGameUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'media', maxCount: 1 },
]);

const normalizeUploadedFile = (req, _res, next) => {
  if (req.files) {
    req.file = req.files.image?.[0] || req.files.media?.[0] || undefined;
  }
  next();
};

const optionalValidateImage = (req, res, next) => {
  if (req.file) {
    return validateImageContent(req, res, next);
  }
  next();
};

// All game endpoints require valid authentication
gameRouter.use(authenticateToken);

gameRouter.post('/start', startGameSession);
gameRouter.post(
  '/submit',
  gameSubmitLimiter,
  handleGameUpload,
  normalizeUploadedFile,
  optionalValidateImage,
  submitPrediction
);
gameRouter.post('/complete', completeSession);
gameRouter.get('/stats', getGameStats);
gameRouter.get('/history', getGameHistory);
gameRouter.get('/leaderboard', getLeaderboard);
gameRouter.get('/leaderboard/me', getMyRanking);
gameRouter.get('/achievements', getAchievements);
gameRouter.get('/challenges', getChallenges);

export default gameRouter;
