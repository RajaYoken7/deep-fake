import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createApp } from '../app.js';
import { temporaryUploadDirectory } from '../middleware/uploadMiddleware.js';
import { HttpError } from '../utils/HttpError.js';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/0XcAAAAASUVORK5CYII=',
  'base64',
);

async function startApp(detectImage) {
  const server = createServer(createApp({ detectImage }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  return {
    server,
    url: `http://127.0.0.1:${address.port}/api/detection/analyze`,
  };
}

test('accepts a valid image, returns the analysis, and removes the temporary upload', async () => {
  const previousFiles = new Set(await readdir(temporaryUploadDirectory));
  let analyzedPath;
  const { server, url } = await startApp(async (file) => {
    analyzedPath = file.path;
    assert.equal(file.mimetype, 'image/png');
    assert.equal(existsSync(file.path), true);
    return {
      classification: 'NOT_AI_GENERATED',
      score: 0.04,
      threshold: 0.8,
      disclaimer: 'Does not prove authenticity.',
    };
  });

  try {
    const form = new FormData();
    form.append('media', new Blob([png], { type: 'image/png' }), 'photo.png');
    const response = await fetch(url, { method: 'POST', body: form });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      classification: 'NOT_AI_GENERATED',
      score: 0.04,
      threshold: 0.8,
      disclaimer: 'Does not prove authenticity.',
    });
    assert.equal(existsSync(analyzedPath), false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  const newFiles = (await readdir(temporaryUploadDirectory))
    .filter((name) => !previousFiles.has(name));
  assert.deepEqual(newFiles, []);
});

test('rejects invalid image bytes and does not call the analyzer', async () => {
  let analyzerCalled = false;
  const { server, url } = await startApp(async () => {
    analyzerCalled = true;
    throw new Error('Analyzer should not run for invalid image bytes.');
  });

  try {
    const form = new FormData();
    form.append('media', new Blob(['not an image'], { type: 'image/png' }), 'fake.png');
    const response = await fetch(url, { method: 'POST', body: form });
    assert.equal(response.status, 415);
    assert.equal((await response.json()).code, 'INVALID_IMAGE_CONTENT');
    assert.equal(analyzerCalled, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('rejects images larger than 10 MB', async () => {
  let analyzerCalled = false;
  const { server, url } = await startApp(async () => {
    analyzerCalled = true;
    return {};
  });

  try {
    const form = new FormData();
    const tooLarge = new Uint8Array(10 * 1024 * 1024 + 1);
    form.append('media', new Blob([tooLarge], { type: 'image/png' }), 'large.png');
    const response = await fetch(url, { method: 'POST', body: form });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).code, 'IMAGE_TOO_LARGE');
    assert.equal(analyzerCalled, false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('removes the temporary image when analysis fails', async () => {
  const previousFiles = new Set(await readdir(temporaryUploadDirectory));
  let analyzedPath;
  const { server, url } = await startApp(async (file) => {
    analyzedPath = file.path;
    throw new HttpError(504, 'Provider timed out.', 'PROVIDER_TIMEOUT');
  });

  try {
    const form = new FormData();
    form.append('media', new Blob([png], { type: 'image/png' }), 'photo.png');
    const response = await fetch(url, { method: 'POST', body: form });
    assert.equal(response.status, 504);
    assert.equal((await response.json()).code, 'PROVIDER_TIMEOUT');
    assert.equal(existsSync(analyzedPath), false);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  const newFiles = (await readdir(temporaryUploadDirectory))
    .filter((name) => !previousFiles.has(name));
  assert.deepEqual(newFiles, []);
});
