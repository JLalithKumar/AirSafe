import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AirQualityProvider } from './context/AirQualityContext';
import { SimulationProvider } from './context/SimulationContext';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Authenticated Application Pages
import DashboardPage from './pages/DashboardPage';
import ExposureCalculatorPage from './pages/ExposureCalculatorPage';
import ForecastPage from './pages/ForecastPage';
import RouteComparisonPage from './pages/RouteComparisonPage';
import HistoryPage from './pages/HistoryPage';
import SchoolSafePage from './pages/SchoolSafePage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SimulationProvider>
          <AirQualityProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white transition-colors duration-200 relative">
                <Navbar />

                <main className="flex-1">
                  <Routes>
                    {/* Public Landing Page */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Guest Authentication Routes */}
                    <Route
                      path="/signup"
                      element={
                        <GuestRoute>
                          <SignupPage />
                        </GuestRoute>
                      }
                    />

                    <Route
                      path="/login"
                      element={
                        <GuestRoute>
                          <LoginPage />
                        </GuestRoute>
                      }
                    />

                    {/* Authenticated Application Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/exposure"
                      element={
                        <ProtectedRoute>
                          <ExposureCalculatorPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/forecast"
                      element={
                        <ProtectedRoute>
                          <ForecastPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/routes"
                      element={
                        <ProtectedRoute>
                          <RouteComparisonPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute>
                          <HistoryPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/school"
                      element={
                        <ProtectedRoute>
                          <SchoolSafePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                <Footer />
              </div>
            </Router>
          </AirQualityProvider>
        </SimulationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}