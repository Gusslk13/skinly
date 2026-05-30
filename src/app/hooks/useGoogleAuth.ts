/**
 * useGoogleAuth
 *
 * Unified Google Sign-In hook for Skinly.
 *
 * • On Android (Capacitor native): uses @codetrix-studio/capacitor-google-auth
 *   which opens the native Google account picker — no WebView OAuth issues.
 *   Gets an id_token from Google and signs into Supabase with it.
 *
 * • On Web (browser): falls back to supabase.auth.signInWithOAuth which
 *   does the standard redirect flow.
 *
 * Usage:
 *   const { signInWithGoogle, loading, error } = useGoogleAuth();
 */

import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../../supabase';

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      if (Capacitor.isNativePlatform()) {
        // ── Native Android path ───────────────────────────────────────────────
        // Dynamically import the plugin so it doesn't break web builds
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

        // Initialize on first call (safe to call multiple times)
        await GoogleAuth.initialize({
          clientId: '707382874829-ri1sldhabes6hrh60rp3m63kd3v2pp2u.apps.googleusercontent.com',
          scopes:   ['profile', 'email'],
          grantOfflineAccess: true,
        });

        const googleUser = await GoogleAuth.signIn();

        // googleUser.authentication.idToken is the JWT we pass to Supabase
        const idToken = googleUser?.authentication?.idToken;
        if (!idToken) {
          throw new Error('No se recibió el token de Google. Intenta de nuevo.');
        }

        const { error: supaErr } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (supaErr) throw supaErr;

        // AppContext's onAuthStateChange listener handles navigation automatically.

      } else {
        // ── Web browser path ──────────────────────────────────────────────────
        const { error: supaErr } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (supaErr) throw supaErr;
        // Browser redirects to Google — no further action needed here.
        // setLoading stays true intentionally (page navigates away).
        return;
      }
    } catch (err: any) {
      const msg: string =
        err?.message ||
        (typeof err === 'string' ? err : 'Error al iniciar sesión con Google.');
      setError(msg);
      setLoading(false);
    }

    setLoading(false);
  };

  return { signInWithGoogle, loading, error };
};
