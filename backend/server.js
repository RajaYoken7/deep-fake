import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDB, sanitizeLog } from './config/db.js';
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

// Global exception and rejection safeguards for production reliability
process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.stack : String(reason);
  console.error(`[Unhandled Rejection] ${sanitizeLog(message)}`);
});

process.on('uncaughtException', (error) => {
  const message = error instanceof Error ? error.stack : String(error);
  console.error(`[Uncaught Exception] ${sanitizeLog(message)}`);
});

async function startServer() {
  console.log('='.repeat(60));
  console.log('Starting DeepTrust Academy API Server...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));

  try {
    // Connect to MongoDB Atlas
    await connectDB();
  } catch (dbError) {
    console.warn(`[Warning] Database connection failed at startup: ${dbError.message}`);
    console.warn('[Warning] Server will continue running; verification reports will execute in fallback mode.');
  }

  const app = createApp();

  const server = app.listen(port, () => {
    console.log(`[Server] DeepTrust API running on port ${port}`);
    console.log(`[Server] Health Endpoint: http://localhost:${port}/health`);
    console.log(`[Server] Allowed Client Origins: ${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://deep-fake-cfa8.vercel.app'}`);
    console.log('='.repeat(60));
  });

  // Graceful shutdown handling
  let isShuttingDown = false;
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

    // Stop accepting new HTTP requests
    server.close(async () => {
      console.log('[Server] HTTP server connections closed.');
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(false);
          console.log('[MongoDB] Database connection closed cleanly.');
        }
      } catch (err) {
        console.error(`[MongoDB] Error during connection close: ${err.message}`);
      } finally {
        console.log('[Server] Shutdown complete. Exiting.');
        process.exit(0);
      }
    });

    // Force exit after 10s if connections refuse to terminate
    setTimeout(() => {
      console.error('[Server] Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

startServer();
