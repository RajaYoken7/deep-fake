import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, configureApiClient } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children, onSessionExpired }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store token in a ref for synchronous access in api client callbacks
  const tokenRef = useRef(null);
  tokenRef.current = accessToken;

  // Sync with centralized API Client
  useEffect(() => {
    configureApiClient({
      getAccessToken: () => tokenRef.current,
      setAccessToken: (newToken, newUser) => {
        setAccessToken(newToken);
        tokenRef.current = newToken;
        if (newUser) setUser(newUser);
        else if (newToken === null) setUser(null);
      },
      onSessionExpired: () => {
        setUser(null);
        setAccessToken(null);
        tokenRef.current = null;
        if (onSessionExpired) onSessionExpired();
      },
    });
  }, [onSessionExpired]);

  // Attempt silent session restoration on application mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const response = await apiRequest('/api/auth/refresh', {
          method: 'POST',
        });

        if (isMounted && response?.data) {
          setUser(response.data.user);
          setAccessToken(response.data.accessToken);
          tokenRef.current = response.data.accessToken;
        }
      } catch {
        // No active or valid session; user starts unauthenticated
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
          tokenRef.current = null;
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user with email and password
   */
  const login = useCallback(async (email, password) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response?.data) {
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      tokenRef.current = response.data.accessToken;
      return response.data;
    }
    throw new Error(response?.message || 'Login failed');
  }, []);

  /**
   * Register new user account
   */
  const register = useCallback(async (name, email, password) => {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (response?.data) {
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      tokenRef.current = response.data.accessToken;
      return response.data;
    }
    throw new Error(response?.message || 'Registration failed');
  }, []);

  /**
   * Terminate current user session
   */
  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Proceed with local logout regardless of network state
    } finally {
      setUser(null);
      setAccessToken(null);
      tokenRef.current = null;
    }
  }, []);

  /**
   * Invalidate all sessions across devices
   */
  const logoutAll = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout-all', {
        method: 'POST',
      });
    } catch {
      // Proceed with local cleanup
    } finally {
      setUser(null);
      setAccessToken(null);
      tokenRef.current = null;
    }
  }, []);

  /**
   * Manual session refresh
   */
  const refreshSession = useCallback(async () => {
    try {
      const response = await apiRequest('/api/auth/refresh', {
        method: 'POST',
      });
      if (response?.data) {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        tokenRef.current = response.data.accessToken;
        return response.data;
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      tokenRef.current = null;
      throw err;
    }
  }, []);

  /**
   * Updates local user state (e.g. after profile edit)
   */
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  }, []);

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshSession,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
