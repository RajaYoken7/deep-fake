/**
 * NoSQL Injection Protection Middleware.
 * Recursively inspects and sanitizes request bodies, query parameters, and route params
 * by removing keys containing prohibited MongoDB operator characters ('$' and '.').
 */

function sanitize(target) {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitize(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else {
      target[key] = sanitize(target[key]);
    }
  }

  return target;
}

export function noSqlSanitizer(req, _res, next) {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
}

export default noSqlSanitizer;
