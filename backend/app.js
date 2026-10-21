import express from 'express';
import cors from 'cors';
import { createDetectionRouter } from './routes/detectionRoutes.js';
import identityGuardianRoutes from './routes/identityGuardianRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';

/**
 * Creates and configures the Express application.
 * Mounts both Deepfake Detection and Identity Guardian verification routes.
 * 
 * @param {object} [options] - Optional route configuration (e.g. { detectImage } for testing)
 * @returns {express.Application}
 */
export function createApp(options = {}) {
  const app = express();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  app.disable('x-powered-by');

  // CORS configuration supporting detection and identity guardian frontend requests
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || origin === clientUrl || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by DeepTrust Academy CORS Policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));

  // Body parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Apply rate limiter to API endpoints
  app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 }));

  // Health check endpoints
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      app: 'DeepTrust Academy Backend',
      timestamp: new Date().toISOString(),
    });
  });

  // Feature routers
  app.use('/api/detection', createDetectionRouter(options));
  app.use('/api/identity-guardian', identityGuardianRoutes);

  // Global error handler
  app.use(errorHandler);

  return app;
}

// Default pre-instantiated app for direct imports
export const app = createApp();
export default app;
