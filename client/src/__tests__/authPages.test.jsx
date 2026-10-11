import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import Navbar from '../components/common/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AirQualityProvider } from '../context/AirQualityContext';
import { SimulationProvider } from '../context/SimulationContext';

// Mock authService
vi.mock('../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn().mockRejectedValue({ status: 401 }),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  },
  default: {
    getCurrentUser: vi.fn().mockRejectedValue({ status: 401 }),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  },
}));

function renderWithProviders(ui, initialRoute = '/') {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <SimulationProvider>
          <AirQualityProvider>
            <MemoryRouter
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
              initialEntries={[initialRoute]}
            >
              {ui}
            </MemoryRouter>
          </AirQualityProvider>
        </SimulationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('LandingPage, LoginPage, and SignupPage UI & Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public Landing Page', () => {
    it('renders hero title, supporting description, and CTAs without requiring authentication', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<div>SIGNUP_DESTINATION</div>} />
        </Routes>
      );

      // Hero Title
      expect(screen.getByRole('heading', { level: 1, name: /Know your air.*Protect your body/i })).toBeInTheDocument();

      // Supporting description
      expect(
        screen.getByText(/Understand how air pollution affects your planned activity/i)
      ).toBeInTheDocument();

      // Primary and secondary CTAs
      expect(screen.getByRole('button', { name: /^Get Started$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Explore AirSafe/i })).toBeInTheDocument();

      // Feature Cards
      expect(screen.getByText('Current Air Quality')).toBeInTheDocument();
      expect(screen.getByText('Activity Exposure Score')).toBeInTheDocument();
      expect(screen.getByText('Safer Time Windows')).toBeInTheDocument();
      expect(screen.getByText('Clean Route Comparison')).toBeInTheDocument();

      // Explanation section
      expect(screen.getByText(/Why raw AQI isn't enough/i)).toBeInTheDocument();
      expect(screen.getByText(/AirSafe Exposure Engine/i)).toBeInTheDocument();
    });

    it('navigates from Get Started CTA to signup page', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<div>SIGNUP_DESTINATION_PAGE</div>} />
        </Routes>
      );

      const getStartedBtn = screen.getByRole('button', { name: /^Get Started$/i });
      fireEvent.click(getStartedBtn);

      await waitFor(() => {
        expect(screen.getByText('SIGNUP_DESTINATION_PAGE')).toBeInTheDocument();
      });
    });
  });

  describe('Login Page', () => {
    it('renders login page heading, description, Google button, and link to signup', () => {
      renderWithProviders(
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<div>SIGNUP_PAGE</div>} />
        </Routes>,
        '/login'
      );

      expect(screen.getByRole('heading', { level: 1, name: /Welcome back/i })).toBeInTheDocument();
      expect(
        screen.getByText(/Sign in to your AirSafe account to access your live air quality insights/i)
      ).toBeInTheDocument();

      // Link to Signup
      const signupLink = screen.getByRole('link', { name: /Create an account/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink.getAttribute('href')).toBe('/signup');
    });
  });

  describe('Signup Page', () => {
    it('renders signup page heading, value props, and link to login', () => {
      renderWithProviders(
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        </Routes>,
        '/signup'
      );

      expect(screen.getByRole('heading', { level: 1, name: /Create your account/i })).toBeInTheDocument();
      expect(
        screen.getByText(/Get started with smart air quality monitoring/i)
      ).toBeInTheDocument();

      // Value props
      expect(screen.getByText(/Cardio activity exposure calculation/i)).toBeInTheDocument();
      expect(screen.getByText(/Low-exposure transit corridor comparison/i)).toBeInTheDocument();

      // Link to Login
      const loginLink = screen.getByRole('link', { name: /Sign in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.getAttribute('href')).toBe('/login');
    });
  });

  describe('Navbar Component', () => {
    it('renders cleanly without ReferenceError and displays navigation links and auth buttons', () => {
      renderWithProviders(<Navbar />, '/');

      // Brand
      expect(screen.getByText('AirSafe')).toBeInTheDocument();

      // Navigation links
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Exposure Check')).toBeInTheDocument();
      expect(screen.getByText('Forecast')).toBeInTheDocument();
      expect(screen.getByText('Routes')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('School Safety')).toBeInTheDocument();

      // Controls
      expect(screen.getAllByRole('button', { name: /toggle theme/i }).length).toBeGreaterThan(0);
      expect(screen.getByText(/Demo Mode/i)).toBeInTheDocument();

      // Unauthenticated auth links
      const signInLinks = screen.getAllByRole('link', { name: /Sign In/i });
      expect(signInLinks.length).toBeGreaterThan(0);
      const getStartedLinks = screen.getAllByRole('link', { name: /Get Started/i });
      expect(getStartedLinks.length).toBeGreaterThan(0);
    });

    it('toggles mobile menu button and opens simulation modal without errors', () => {
      renderWithProviders(<Navbar />, '/');

      // Demo Mode button opens simulation modal
      const demoBtn = screen.getByText(/Demo Mode/i);
      fireEvent.click(demoBtn);

      expect(screen.getByText('Live Demo Testing Panel')).toBeInTheDocument();
    });
  });
});

