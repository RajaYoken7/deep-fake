import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createDetectionRouter } from './routes/detectionRoutes.js';
import identityGuardianRoutes from './routes/identityGuardianRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';
import noSqlSanitizer from './middleware/noSqlSanitizer.js';

/**
 * Parses and returns list of allowed CORS origins from environment and defaults.
 */
function getAllowedOrigins() {
  const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ]
    .filter(Boolean)
    .flatMap((url) => url.split(',').map((item) => item.trim()));

  const defaultOrigins = [
    'https://deep-fake-cfa8.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  return new Set([...defaultOrigins, ...envOrigins]);
}

/**
 * Creates and configures the Express application.
 * Mounts Security Headers, CORS, Authentication, Deepfake Detection, Identity Guardian, User, and Admin routes.
 * 
 * @param {object} [options] - Optional route configuration (e.g. { detectImage } for testing)
 * @returns {express.Application}
 */
export function createApp(options = {}) {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  // Trust first proxy hop (essential for Render / Cloudflare / reverse-proxy load balancers)
  app.set('trust proxy', 1);

  // Disable x-powered-by header
  app.disable('x-powered-by');

  // Helmet HTTP security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed by frontend hosting or API client
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS configuration supporting credentials, cookies, and production / preview domains
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow server-to-server requests or non-browser requests with no origin
      if (!origin) {
        return callback(null, true);
      }

      // Check configured allowed origins
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Check dynamic local development origins
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments for DeepTrust Academy
      if (/^https:\/\/deep-fake-[a-z0-9-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Politely disallow origin without throwing an unhandled server error
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'x-refresh-token'],
    exposedHeaders: ['set-cookie'],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Cookie parser for secure refresh token handling
  app.use(cookieParser());

  // Body parsers
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Sanitize all incoming requests against NoSQL injection
  app.use(noSqlSanitizer);

  // Apply general rate limiter to API endpoints
  app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 200 }));

  // Lightweight health check endpoint for Render service monitoring
  app.get('/health', (_req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
      status: 'ok',
      service: 'deeptrust-academy-backend',
      database: isDbConnected ? 'connected' : 'disconnected',
    });
  });

  // Detailed operational health check
  app.get('/api/health', (_req, res) => {
    const dbStateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    const isDbConnected = mongoose.connection.readyState === 1;

    res.status(200).json({
      status: isDbConnected ? 'online' : 'degraded',
      app: 'DeepTrust Academy Backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStateMap[mongoose.connection.readyState] || 'unknown',
        connected: isDbConnected,
      },
    });
  });

  // Feature routers
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/detection', createDetectionRouter(options));
  app.use('/api/identity-guardian', identityGuardianRoutes);
  app.use('/api/game', gameRoutes);

  // Global error handler
  app.use(errorHandler);

  return app;
}

// Default pre-instantiated app for backward compatibility
export const app = createApp();
export default app;
