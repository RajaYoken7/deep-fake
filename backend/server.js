import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { DEFAULT_AI_GENERATED_THRESHOLD } from './constants/detection.js';

const port = Number(process.env.PORT) || 5000;

function validateThreshold() {
  const threshold = process.env.AI_GENERATED_THRESHOLD;
  if (threshold === undefined || threshold === '') return;
  const parsed = Number(threshold);
  if (!Number.isFinite(parsed) || parsed <= 0.5 || parsed > 1) {
    throw new Error('AI_GENERATED_THRESHOLD must be greater than 0.5 and at most 1.');
  }
}

validateThreshold();
if (!process.env.AI_GENERATED_THRESHOLD) {
  process.env.AI_GENERATED_THRESHOLD = String(DEFAULT_AI_GENERATED_THRESHOLD);
}

async function startServer() {
  console.log('='.repeat(60));
  console.log('Starting DeepTrust Academy API Server...');
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB Atlas (reuses existing DeepTrustCluster connection)
    await connectDB();
  } catch (dbError) {
    console.warn(`[Warning] Database connection failed at startup: ${dbError.message}`);
    console.warn('[Warning] Server will continue running; verification reports will execute in in-memory mode.');
  }

  const app = createApp();

  const server = app.listen(port, () => {
    console.log(`[Server] DeepTrust detection & verification API running on port ${port}`);
    console.log(`[Server] Health Endpoint: http://localhost:${port}/api/identity-guardian/health`);
    console.log(`[Server] Allowed Client Origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log('='.repeat(60));
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

startServer();
