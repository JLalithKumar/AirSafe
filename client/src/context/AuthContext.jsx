import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Restores user session on initial application load.
   */
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch {
      // 401 Unauthorized or network error on cold start means user is not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Authenticate with Google ID token from Google Identity Services.
   */
  const loginWithGoogle = async (idToken) => {
    setIsLoading(true);
    setError(null);
    try {
      const authenticatedUser = await authService.loginWithGoogle(idToken);
      setUser(authenticatedUser);
      setIsLoading(false);
      return authenticatedUser;
    } catch (err) {
      const message =
        err?.message ||
        err?.data?.message ||
        'Unable to complete Google sign-in. Please try again.';
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }
  };

  /**
   * Log out of AirSafe, invalidate backend session and clear cookie.
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Even if network call fails, clear client authentication state
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    error,
    loginWithGoogle,
    logout,
    checkSession,
    clearError,
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
