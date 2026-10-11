import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wind, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

export default function LoginPage() {
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
      setLocalError(err.message || 'Failed to authenticate with AirSafe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = (err) => {
    setLocalError(err.message || 'Google authentication was cancelled or interrupted.');
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

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
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              Sign in to your AirSafe account to access your live air quality insights and personalized exposure records.
            </p>
          </div>

          {/* Error Notice */}
          {activeError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold">Authentication Notice</p>
                <p className="leading-relaxed text-[11px] opacity-90">{activeError}</p>
              </div>
            </div>
          )}

          {/* Primary Action: Continue with Google */}
          <div className="pt-2 space-y-4">
            <GoogleSignInButton
              mode="signin"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              isLoading={isSubmitting}
            />

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Verified Google Identity • Secure HTTP-only Session</span>
            </div>
          </div>

          {/* Cross Link to Signup */}
          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-6 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New to AirSafe?{' '}
              <Link
                to="/signup"
                state={{ from: location.state?.from }}
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security / Privacy Disclosure */}
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
          AirSafe securely verifies your identity through Google Identity Services. We never store Google passwords or share your data.
        </p>
      </div>
    </div>
  );
}
