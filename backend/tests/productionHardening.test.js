import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { noSqlSanitizer } from '../middleware/noSqlSanitizer.js';
import {
  getRefreshTokenCookieOptions,
  getAccessSecret,
  getRefreshSecret,
} from '../utils/tokenUtils.js';

describe('Production Hardening & DevSecOps Suite', () => {
  test('noSqlSanitizer strips keys starting with $ or containing . from body, query, and params', () => {
    const req = {
      body: {
        normalKey: 'safeValue',
        $where: 'malicious script',
        nested: {
          'bad.key': 'evil',
          safeNested: 123,
          $gt: 0,
        },
        items: [{ safe: true }, { $regex: '.*' }],
      },
      query: {
        search: 'ai detection',
        $ne: null,
      },
      params: {
        id: 'user123',
        $gt: '1',
      },
    };

    let nextCalled = false;
    noSqlSanitizer(req, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.body.normalKey, 'safeValue');
    assert.equal('$where' in req.body, false);
    assert.equal('bad.key' in req.body.nested, false);
    assert.equal('$gt' in req.body.nested, false);
    assert.equal(req.body.nested.safeNested, 123);
    assert.equal('$regex' in req.body.items[1], false);
    assert.equal(req.query.search, 'ai detection');
    assert.equal('$ne' in req.query, false);
    assert.equal(req.params.id, 'user123');
    assert.equal('$gt' in req.params, false);
  });

  test('getRefreshTokenCookieOptions forces secure=true when sameSite is none', () => {
    const originalEnv = process.env.COOKIE_SAME_SITE;
    const originalSecure = process.env.COOKIE_SECURE;

    try {
      process.env.COOKIE_SAME_SITE = 'none';
      delete process.env.COOKIE_SECURE;

      const opts = getRefreshTokenCookieOptions();
      assert.equal(opts.httpOnly, true);
      assert.equal(opts.sameSite, 'none');
      assert.equal(opts.secure, true, 'Cross-site cookies must be secure');
      assert.equal(opts.path, '/');
      assert.equal(opts.maxAge, 7 * 24 * 60 * 60 * 1000);
    } finally {
      process.env.COOKIE_SAME_SITE = originalEnv;
      process.env.COOKIE_SECURE = originalSecure;
    }
  });

  test('CORS allows requests from https://deep-fake-cfa8.vercel.app with credentials', async () => {
    const app = createApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
      // 1. Preflight OPTIONS request
      const optionsRes = await fetch(`http://localhost:${port}/api/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://deep-fake-cfa8.vercel.app',
          'Access-Control-Request-Method': 'GET',
        },
      });

      assert.equal(optionsRes.status, 204);
      assert.equal(
        optionsRes.headers.get('access-control-allow-origin'),
        'https://deep-fake-cfa8.vercel.app',
      );
      assert.equal(optionsRes.headers.get('access-control-allow-credentials'), 'true');

      // 2. Disallowed origin should NOT crash server with 500
      const disallowedRes = await fetch(`http://localhost:${port}/api/health`, {
        headers: {
          Origin: 'https://unauthorized-malicious-site.com',
        },
      });

      assert.notEqual(disallowedRes.status, 500);
      assert.notEqual(
        disallowedRes.headers.get('access-control-allow-origin'),
        'https://unauthorized-malicious-site.com',
      );
    } finally {
      server.close();
    }
  });

  test('Health check endpoints return operational status and database connection state', async () => {
    const app = createApp();
    const server = app.listen(0);
    const port = server.address().port;

    try {
      // Light health check
      const lightRes = await fetch(`http://localhost:${port}/health`);
      assert.equal(lightRes.status, 200);
      const lightData = await lightRes.json();
      assert.equal(lightData.status, 'ok');
      assert.ok('database' in lightData);

      // Detailed health check
      const detailedRes = await fetch(`http://localhost:${port}/api/health`);
      assert.equal(detailedRes.status, 200);
      const detailedData = await detailedRes.json();
      assert.ok(['online', 'degraded'].includes(detailedData.status));
      assert.ok('uptimeSeconds' in detailedData);
      assert.ok('database' in detailedData);
    } finally {
      server.close();
    }
  });

  test('Fatal error thrown in production when JWT secrets are missing or placeholder', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAccess = process.env.JWT_ACCESS_SECRET;
    const originalSecret = process.env.JWT_SECRET;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_SECRET;

      assert.throws(() => getAccessSecret(), /FATAL: JWT_ACCESS_SECRET/);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.JWT_ACCESS_SECRET = originalAccess;
      process.env.JWT_SECRET = originalSecret;
    }
  });
});
