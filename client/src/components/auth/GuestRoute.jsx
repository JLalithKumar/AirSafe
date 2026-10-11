import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wind } from 'lucide-react';

export default function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center animate-pulse">
          <Wind className="w-6 h-6 animate-spin text-teal-500" style={{ animationDuration: '3s' }} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading AirSafe...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // If user is already authenticated, redirect to destination or /dashboard
    const destination = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
}
