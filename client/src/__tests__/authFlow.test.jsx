import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import GuestRoute from '../components/auth/GuestRoute';
import authService from '../services/authService';

// Mock authService so tests run without real network calls
vi.mock('../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  },
  default: {
    getCurrentUser: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockUser = {
  id: 'usr_123',
  googleId: 'sub_987654321',
  name: 'Alex Explorer',
  email: 'alex@example.com',
  picture: 'https://example.com/avatar.jpg',
  emailVerified: true,
};

function TestConsumer() {
  const { user, isAuthenticated, isLoading, loginWithGoogle, logout, error } = useAuth();
  return (
    <div>
      {isLoading && <div data-testid="auth-loading">Loading Session...</div>}
      <div data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</div>
      {user && <div data-testid="user-name">{user.name}</div>}
      {error && <div data-testid="auth-error">{error}</div>}
      <button onClick={() => loginWithGoogle('test-token').catch(() => {})}>Sign In Button</button>
      <button onClick={logout}>Sign Out Button</button>
    </div>
  );
}

describe('Frontend Authentication & Route Protection Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthContext & Session Restoration', () => {
    it('restores authenticated user profile from session cookie on mount', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
      });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Alex Explorer');
    });

    it('sets unauthenticated state when session is invalid or absent (401)', async () => {
      authService.getCurrentUser.mockRejectedValue({ status: 401, message: 'Unauthorized' });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
      });

      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });

    it('successfully updates user upon Google sign-in', async () => {
      authService.getCurrentUser.mockRejectedValue({ status: 401 });
      authService.loginWithGoogle.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
      });

      fireEvent.click(screen.getByText('Sign In Button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
      });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Alex Explorer');
    });

    it('displays error and remains logged out when backend rejects ID token', async () => {
      authService.getCurrentUser.mockRejectedValue({ status: 401 });
      authService.loginWithGoogle.mockRejectedValue(new Error('Invalid token audience'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
      });

      fireEvent.click(screen.getByText('Sign In Button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Invalid token audience');
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
    });

    it('clears client authentication state on logout', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);
      authService.logout.mockResolvedValue();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
      });

      fireEvent.click(screen.getByText('Sign Out Button'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
      });

      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });
  });

  describe('ProtectedRoute Guard', () => {
    it('redirects unauthenticated users to /login when attempting to access protected route', async () => {
      authService.getCurrentUser.mockRejectedValue({ status: 401 });

      render(
        <AuthProvider>
          <MemoryRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            initialEntries={['/dashboard']}
          >
            <Routes>
              <Route path="/login" element={<div>LOGIN_PAGE_RENDERED</div>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>PROTECTED_DASHBOARD_CONTENT</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('LOGIN_PAGE_RENDERED')).toBeInTheDocument();
      });

      expect(screen.queryByText('PROTECTED_DASHBOARD_CONTENT')).not.toBeInTheDocument();
    });

    it('renders protected route content when user is authenticated', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <MemoryRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            initialEntries={['/dashboard']}
          >
            <Routes>
              <Route path="/login" element={<div>LOGIN_PAGE_RENDERED</div>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>PROTECTED_DASHBOARD_CONTENT</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('PROTECTED_DASHBOARD_CONTENT')).toBeInTheDocument();
      });

      expect(screen.queryByText('LOGIN_PAGE_RENDERED')).not.toBeInTheDocument();
    });
  });

  describe('GuestRoute Guard', () => {
    it('allows guest visitors to access /login and /signup', async () => {
      authService.getCurrentUser.mockRejectedValue({ status: 401 });

      render(
        <AuthProvider>
          <MemoryRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            initialEntries={['/login']}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <div>GUEST_LOGIN_PAGE</div>
                  </GuestRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('GUEST_LOGIN_PAGE')).toBeInTheDocument();
      });
    });

    it('redirects already-authenticated users away from /login to /dashboard', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <MemoryRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            initialEntries={['/login']}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <div>GUEST_LOGIN_PAGE</div>
                  </GuestRoute>
                }
              />
              <Route path="/dashboard" element={<div>DASHBOARD_PAGE_RENDERED</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('DASHBOARD_PAGE_RENDERED')).toBeInTheDocument();
      });

      expect(screen.queryByText('GUEST_LOGIN_PAGE')).not.toBeInTheDocument();
    });
  });
});
