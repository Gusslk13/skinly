/**
 * useGoogleAuth
 *
 * Google Sign-In hook for Skinly using Supabase OAuth redirect flow.
 * Works on both web browsers and Android (Capacitor loads the Vercel URL
 * via server.url, so the standard web OAuth redirect works on both platforms).
 *
 * AppContext's onAuthStateChange listener handles navigation automatically
 * after the OAuth redirect completes.
 *
 * Usage:
 *   const { signInWithGoogle, loading, error } = useGoogleAuth();
 */

import { useState } from 'react';
import { supabase } from '../../supabase';

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: supaErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (supaErr) throw supaErr;

      // Browser redirects to Google — loading stays true intentionally
      // as the page navigates away.
      return;
    } catch (err: any) {
      const msg: string =
        err?.message ||
        (typeof err === 'string' ? err : 'Error al iniciar sesión con Google.');
      setError(msg);
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error };
};
