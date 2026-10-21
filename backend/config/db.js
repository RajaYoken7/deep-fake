import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Sanitizes any string to remove credentials before logging.
 * Replaces credentials in mongodb/mongodb+srv URIs with ***:***
 */
export function sanitizeLog(message) {
  if (typeof message !== 'string') return message;
  return message.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/g, 'mongodb$1://***:***@');
}

/**
 * Connect to MongoDB Atlas deployment without creating collections or inserting records.
 * Target database: deeptrust_academy
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;

  if (!uri) {
    const errorMsg = 'MONGODB_URI or MONGO_URI is not defined. Please set MONGODB_URI in backend/.env';
    console.error(`[MongoDB Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Check for unreplaced placeholder tokens
  if (
    uri.includes('<username>') ||
    uri.includes('<password>') ||
    uri.includes('<db_password>') ||
    uri.includes('<cluster-host>')
  ) {
    const errorMsg = 'MONGO_URI contains placeholder tokens (e.g. <db_password>). Please update backend/.env with your actual MongoDB Atlas database user password.';
    console.error(`[MongoDB Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(uri);

    console.log('[MongoDB] Connection successfully established.');
    console.log(`[MongoDB] Host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database Name: ${conn.connection.name}`);
    console.log(`[MongoDB] Connection State: ${conn.connection.readyState === 1 ? 'Connected (Ready)' : conn.connection.readyState}`);

    return conn;
  } catch (error) {
    const safeError = sanitizeLog(error.message || 'Unknown database connection error');
    console.error(`[MongoDB Connection Failed] ${safeError}`);
    throw new Error(safeError);
  }
}

export default connectDB;
