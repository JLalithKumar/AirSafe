import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AlertCircle, Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * GoogleSignInButton — Google Identity Services (GIS) button component.
 *
 * @param {object} props
 * @param {'signin'|'signup'} [props.mode='signin'] - Button text type
 * @param {function} props.onSuccess - Callback receiving verified ID token string
 * @param {function} props.onError - Callback receiving error object
 * @param {boolean} [props.isLoading=false] - Whether authentication request is in progress
 */
export default function GoogleSignInButton({
  mode = 'signin',
  onSuccess,
  onError,
  isLoading = false,
}) {
  const { isDark } = useTheme();
  const buttonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setInitError('Google Client ID is not configured (VITE_GOOGLE_CLIENT_ID is missing in .env).');
      return;
    }

    let intervalId = null;

    function initGoogleServices() {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response && response.credential) {
              onSuccess(response.credential);
            } else {
              onError?.(new Error('No credential returned by Google Identity Services.'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
        }

        setScriptLoaded(true);
        setInitError(null);
        return true;
      } catch (err) {
        console.error('Failed to initialize Google Identity Services:', err);
        setInitError('Failed to initialize Google Sign-In service.');
        return false;
      }
    }

    // Try immediately
    if (!initGoogleServices()) {
      // Poll briefly if script is still downloading async
      let attempts = 0;
      intervalId = setInterval(() => {
        attempts++;
        if (initGoogleServices() || attempts > 20) {
          clearInterval(intervalId);
          if (attempts > 20 && !window.google) {
            setInitError('Google Identity Services script could not be loaded. Please check your network or ad blocker.');
          }
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mode, isDark, onSuccess, onError]);

  if (initError) {
    return (
      <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Google Sign-In Notice</p>
          <p className="leading-relaxed">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center relative min-h-[44px]">
      {isLoading ? (
        <div className="w-full max-w-[320px] py-2.5 px-4 rounded-xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
          <span>Verifying with AirSafe...</span>
        </div>
      ) : (
        <>
          <div ref={buttonRef} className="w-full flex justify-center" />
          {!scriptLoaded && (
            <div className="w-full max-w-[320px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading Google Sign-In...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
