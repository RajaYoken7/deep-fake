import cors from 'cors';
import express from 'express';
import { createDetectionRouter } from './routes/detectionRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(options) {
  const app = express();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  app.disable('x-powered-by');
  app.use(cors({
    origin: clientUrl,
    credentials: false,
    methods: ['POST'],
  }));
  app.use('/api/detection', createDetectionRouter(options));
  app.use(errorHandler);
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
