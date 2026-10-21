import 'dotenv/config';
import { createApp } from './app.js';
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

const app = createApp();
app.listen(port, () => {
  console.log(`DeepTrust detection API listening on port ${port}`);
});
