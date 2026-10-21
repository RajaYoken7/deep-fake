/**
 * Centralized API Client for DeepTrust Academy.
 * Automatically attaches Authorization header, includes credentials for cookies,
 * handles token expiration, queues requests during refresh, and retries seamlessly.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : '';

// In-memory token storage getter/setter callbacks
let getAccessTokenFn = () => null;
let setAccessTokenFn = () => {};
let onSessionExpiredFn = () => {};

export function configureApiClient({ getAccessToken, setAccessToken, onSessionExpired }) {
  if (getAccessToken) getAccessTokenFn = getAccessToken;
  if (setAccessToken) setAccessTokenFn = setAccessToken;
  if (onSessionExpired) onSessionExpiredFn = onSessionExpired;
}

// Queue for concurrent requests while a token refresh is in flight
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Custom fetch wrapper with automatic JWT injection, cookie credentials,
 * and 401 refresh-and-retry logic.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Do not override Content-Type if uploading FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach access token if available
  const token = getAccessTokenFn();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Automatically include HTTP-only refresh token cookies
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    throw new Error('Network error: Unable to reach DeepTrust Academy server. Please verify your connection.');
  }

  // Check if response is 401 Unauthorized and request is retryable
  const isAuthEndpoint =
    endpoint.includes('/api/auth/login') ||
    endpoint.includes('/api/auth/register') ||
    endpoint.includes('/api/auth/refresh');

  if (response.status === 401 && !isAuthEndpoint && !options._retry) {
    if (isRefreshing) {
      // Refresh already in progress; queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          options._retry = true;
          headers.set('Authorization', `Bearer ${newToken}`);
          return apiRequest(endpoint, options);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // Request session renewal via HTTP-only cookie
      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!refreshRes.ok) {
        throw new Error('Session renewal failed');
      }

      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData?.data?.accessToken;

      if (!newAccessToken) {
        throw new Error('No access token returned in refresh response');
      }

      // Update in-memory token
      setAccessTokenFn(newAccessToken, refreshData.data.user);
      processQueue(null, newAccessToken);

      // Retry original request with newly issued token
      options._retry = true;
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiRequest(endpoint, options);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setAccessTokenFn(null, null);
      onSessionExpiredFn();
      throw new Error('Your session has expired. Please log in again.');
    } finally {
      isRefreshing = false;
    }
  }

  // Parse JSON response body if present
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && (data?.message || data?.error)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default {
  apiRequest,
  configureApiClient,
};
