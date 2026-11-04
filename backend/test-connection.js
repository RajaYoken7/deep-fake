import mongoose from 'mongoose';
import { connectDB, sanitizeLog } from './config/db.js';

async function runConnectionTest() {
  console.log('='.repeat(60));
  console.log('DeepTrust Academy — MongoDB Atlas Connection Verification');
  console.log('='.repeat(60));

  try {
    const conn = await connectDB();

    // Perform a non-destructive ping against the admin database to verify cluster connectivity
    console.log('[Verification] Sending non-destructive ping to MongoDB Atlas...');
    const pingResult = await conn.connection.db.admin().ping();

    console.log('[Verification] Atlas Ping Response:', pingResult);

    if (pingResult && pingResult.ok === 1) {
      console.log('[Verification Status] SUCCESS: Connected and verified communication with Atlas cluster.');
      console.log(`[Target Database] ${conn.connection.name}`);
      console.log('[Note] Zero collections or documents were created during this test.');
    } else {
      console.warn('[Verification Status] WARNING: Connected, but unexpected ping response received.');
    }

    await mongoose.disconnect();
    console.log('[MongoDB] Connection closed cleanly.');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('='.repeat(60));
    console.error('[Verification Status] FAILED: Could not connect to MongoDB Atlas.');
    console.error(`[Reason] ${sanitizeLog(error.message)}`);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

runConnectionTest();
