import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wind, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, error: authError, clearError } = useAuth();
  const [localError, setLocalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || '/dashboard';

  const handleGoogleSuccess = async (idToken) => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      await loginWithGoogle(idToken);
      // Only navigate after backend confirms valid authentication
      navigate(destination, { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Failed to create your AirSafe account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = (err) => {
    setLocalError(err.message || 'Google account selection was cancelled.');
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to AirSafe Overview</span>
          </Link>
        </div>

        {/* Card */}
        <div className="surface-card p-8 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25 mb-1">
              <Wind className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              Get started with smart air quality monitoring, personalized inhaled dose estimation, and cleaner routes in seconds.
            </p>
          </div>

          {/* Quick value props */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Real-time local pollution & forecast tracking</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Cardio activity exposure calculation</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Low-exposure transit corridor comparison</span>
            </div>
          </div>

          {/* Error Notice */}
          {activeError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold">Account Creation Notice</p>
                <p className="leading-relaxed text-[11px] opacity-90">{activeError}</p>
              </div>
            </div>
          )}

          {/* Primary Action: Continue with Google */}
          <div className="pt-2 space-y-4">
            <GoogleSignInButton
              mode="signup"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              isLoading={isSubmitting}
            />

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Instant Google Setup • No Passwords to Manage</span>
            </div>
          </div>

          {/* Cross Link to Login */}
          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-6 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an AirSafe account?{' '}
              <Link
                to="/login"
                state={{ from: location.state?.from }}
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Terms disclosure */}
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
          By signing up, you agree to use AirSafe's estimated exposure models for personal outdoor decision awareness.
        </p>
      </div>
    </div>
  );
}
