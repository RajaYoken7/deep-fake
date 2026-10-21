import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../app.js';
import { cleanupFiles } from '../middleware/uploadMiddleware.js';
import { runPythonCvEngine } from '../services/pythonEngineService.js';
import { isSightengineConfigured } from '../services/sightengineService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Identity Guardian Backend Test Suite', () => {

  test('GET /api/identity-guardian/health returns healthy status and engine metadata', async () => {
    // Start temporary server listener to test endpoint
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://localhost:${port}/api/identity-guardian/health`);
      assert.equal(response.status, 200);

      const data = await response.json();
      assert.equal(data.status, 'healthy');
      assert.equal(data.feature, 'Identity Guardian Verification Suite');
      assert.equal(typeof data.engines, 'object');
      assert.equal(data.privacy.biometricsStored, false);
    } finally {
      server.close();
    }
  });

  test('POST /api/identity-guardian/id-photo/verify rejects missing file uploads with 400', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const formData = new FormData();
      // Empty form with no files attached
      const response = await fetch(`http://localhost:${port}/api/identity-guardian/id-photo/verify`, {
        method: 'POST',
        body: formData
      });

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.success, false);
      assert.equal(data.errorCode, 'MISSING_REQUIRED_UPLOADS');
    } finally {
      server.close();
    }
  });

  test('POST /api/identity-guardian/ai-photo/verify rejects missing uploads with 400', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const formData = new FormData();
      // Only 1 file attached instead of both
      const blob = new Blob(['sample data'], { type: 'image/jpeg' });
      formData.append('suspected_photo', blob, 'suspected.jpg');

      const response = await fetch(`http://localhost:${port}/api/identity-guardian/ai-photo/verify`, {
        method: 'POST',
        body: formData
      });

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.success, false);
      assert.equal(data.errorCode, 'MISSING_REQUIRED_UPLOADS');
    } finally {
      server.close();
    }
  });

  test('cleanupFiles removes temporary files completely from disk', async () => {
    const tmpFilePath = path.resolve(__dirname, '../uploads/tmp/test-cleanup-file.txt');
    await fs.promises.writeFile(tmpFilePath, 'temporary non-residual image data');

    assert.equal(fs.existsSync(tmpFilePath), true);

    await cleanupFiles([tmpFilePath]);

    assert.equal(fs.existsSync(tmpFilePath), false);
  });

  test('isSightengineConfigured safely handles missing or placeholder credentials', () => {
    const originalUser = process.env.SIGHTENGINE_API_USER;
    const originalSecret = process.env.SIGHTENGINE_API_SECRET;

    process.env.SIGHTENGINE_API_USER = 'replace_with_sightengine_api_user';
    process.env.SIGHTENGINE_API_SECRET = 'replace_with_sightengine_api_secret';

    assert.equal(isSightengineConfigured(), false);

    // Restore
    process.env.SIGHTENGINE_API_USER = originalUser;
    process.env.SIGHTENGINE_API_SECRET = originalSecret;
  });

  test('Python CV Engine detects invalid or nonexistent image paths safely', async () => {
    const nonexistentPath1 = path.resolve(__dirname, '../uploads/tmp/does_not_exist_1.jpg');
    const nonexistentPath2 = path.resolve(__dirname, '../uploads/tmp/does_not_exist_2.jpg');

    const result = await runPythonCvEngine('id_photo_verification', nonexistentPath1, nonexistentPath2);
    assert.equal(result.success, false);
    assert.match(result.error, /does not exist/);
  });

  test('IdentityReport schema strictly excludes raw biometric images and embeddings', async () => {
    const { IdentityReport } = await import('../models/IdentityReport.js');
    const schemaPaths = Object.keys(IdentityReport.schema.paths);

    assert.ok(schemaPaths.includes('reportId'));
    assert.ok(schemaPaths.includes('verificationType'));
    assert.ok(schemaPaths.includes('status'));
    assert.ok(schemaPaths.includes('faceComparison.decision'));

    // Verify biometric data is strictly prohibited
    assert.equal(schemaPaths.includes('rawImage'), false);
    assert.equal(schemaPaths.includes('selfieImage'), false);
    assert.equal(schemaPaths.includes('faceEmbedding'), false);
    assert.equal(schemaPaths.includes('biometrics'), false);
  });

  test('POST /api/identity-guardian/id-photo/verify rejects invalid file types with 400', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const formData = new FormData();
      // Send a plain text file pretending to be an image
      const textBlob = new Blob(['this is not an image'], { type: 'text/plain' });
      formData.append('id_photo', textBlob, 'notes.txt');
      formData.append('selfie', textBlob, 'notes.txt');

      const response = await fetch(`http://localhost:${port}/api/identity-guardian/id-photo/verify`, {
        method: 'POST',
        body: formData
      });

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Invalid file type|Upload error/);
    } finally {
      server.close();
    }
  });

  test('Corrupted image file is safely trapped by CV engine', async () => {
    const corruptPath1 = path.resolve(__dirname, '../uploads/tmp/corrupted_image.jpg');
    const corruptPath2 = path.resolve(__dirname, '../uploads/tmp/corrupted_image2.jpg');
    await fs.promises.writeFile(corruptPath1, 'corrupted binary header that cannot decode as JPEG');
    await fs.promises.writeFile(corruptPath2, 'corrupted binary header that cannot decode as JPEG');

    try {
      const result = await runPythonCvEngine('id_photo_verification', corruptPath1, corruptPath2);
      assert.equal(result.success, false);
      assert.match(result.error, /could not be decoded/);
    } finally {
      await cleanupFiles([corruptPath1, corruptPath2]);
    }
  });
});
