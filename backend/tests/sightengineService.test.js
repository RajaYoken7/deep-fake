import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { analyzeWithSightengine } from '../services/sightengineService.js';

test('sends one multipart POST to Sightengine with genai and the uploaded media', async () => {
  const originalUser = process.env.SIGHTENGINE_API_USER;
  const originalSecret = process.env.SIGHTENGINE_API_SECRET;
  const directory = await mkdtemp(path.join(os.tmpdir(), 'deeptrust-sightengine-'));
  const imagePath = path.join(directory, 'test.png');
  await writeFile(imagePath, Buffer.from('image bytes'));
  process.env.SIGHTENGINE_API_USER = 'test-api-user';
  process.env.SIGHTENGINE_API_SECRET = 'test-api-secret';

  let requestCount = 0;
  try {
    const result = await analyzeWithSightengine({
      path: imagePath,
      mimetype: 'image/png',
      originalname: 'test.png',
    }, {
      fetchImpl: async (url, options) => {
        requestCount += 1;
        assert.equal(url, 'https://api.sightengine.com/1.0/check.json');
        assert.equal(options.method, 'POST');
        assert.match(options.body.get('media').type, /^image\/png$/);
        assert.equal(options.body.get('media').name, 'test.png');
        assert.equal(options.body.get('models'), 'genai');
        assert.equal(options.body.get('api_user'), 'test-api-user');
        assert.equal(options.body.get('api_secret'), 'test-api-secret');
        return new Response(JSON.stringify({
          status: 'success',
          type: { ai_generated: 0.92 },
        }), { status: 200 });
      },
    });

    assert.equal(requestCount, 1);
    assert.equal(result.type.ai_generated, 0.92);
  } finally {
    if (originalUser === undefined) delete process.env.SIGHTENGINE_API_USER;
    else process.env.SIGHTENGINE_API_USER = originalUser;
    if (originalSecret === undefined) delete process.env.SIGHTENGINE_API_SECRET;
    else process.env.SIGHTENGINE_API_SECRET = originalSecret;
    await rm(directory, { recursive: true, force: true });
  }
});

test('maps the documented usage_limit error without returning provider details', async () => {
  const originalUser = process.env.SIGHTENGINE_API_USER;
  const originalSecret = process.env.SIGHTENGINE_API_SECRET;
  const directory = await mkdtemp(path.join(os.tmpdir(), 'deeptrust-sightengine-'));
  const imagePath = path.join(directory, 'test.png');
  await writeFile(imagePath, Buffer.from('image bytes'));
  process.env.SIGHTENGINE_API_USER = 'test-api-user';
  process.env.SIGHTENGINE_API_SECRET = 'test-api-secret';

  try {
    await assert.rejects(
      analyzeWithSightengine({
        path: imagePath,
        mimetype: 'image/png',
        originalname: 'test.png',
      }, {
        fetchImpl: async () => new Response(JSON.stringify({
          status: 'failure',
          error: {
            type: 'usage_limit',
            code: 123,
            message: 'private provider detail',
          },
        }), { status: 200 }),
      }),
      (error) => error.statusCode === 503
        && error.code === 'PROVIDER_LIMIT_REACHED'
        && !error.message.includes('private provider detail'),
    );
  } finally {
    if (originalUser === undefined) delete process.env.SIGHTENGINE_API_USER;
    else process.env.SIGHTENGINE_API_USER = originalUser;
    if (originalSecret === undefined) delete process.env.SIGHTENGINE_API_SECRET;
    else process.env.SIGHTENGINE_API_SECRET = originalSecret;
    await rm(directory, { recursive: true, force: true });
  }
});
