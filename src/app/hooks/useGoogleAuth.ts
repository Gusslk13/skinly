/**
 * useGoogleAuth
 *
 * Google Sign-In hook for Skinly using Supabase OAuth redirect flow.
 *
 * - Web browser: redirige normalmente via window.location.
 * - Capacitor nativo (Android): abre el OAuth en un in-app browser con
 *   @capacitor/browser para que no salte al navegador externo. El deeplink
 *   skinly://auth/callback cierra el browser y Supabase onAuthStateChange
 *   se encarga de completar la sesión.
 *
 * Usage:
 *   const { signInWithGoogle, loading, error } = useGoogleAuth();
 */

import { useState } from 'react';
import { supabase } from '../../supabase';

// Detección segura de Capacitor nativo
const isCapacitorNative = (): boolean => {
  try {
    return (window as any).Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
};

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      if (isCapacitorNative()) {
        // ── Capacitor Android: in-app browser + deeplink callback ────────────
        const { Browser } = await import('@capacitor/browser');

        // La URL de callback usa el custom scheme de la app
        const redirectTo = 'skinly://auth/callback';

        const { data, error: supaErr } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true, // evita que Supabase haga el redirect él mismo
          },
        });

        if (supaErr) throw supaErr;
        if (!data?.url) throw new Error('No se obtuvo la URL de autenticación de Google.');

        // Abrir la URL de Google OAuth dentro de la app
        await Browser.open({
          url: data.url,
          windowName: '_self',
          presentationStyle: 'popover',
          toolbarColor: '#1B5E20',
        });

        // El deep link skinly://auth/callback cerrará el browser y
        // Supabase onAuthStateChange procesará la sesión automáticamente.
        // Loading se queda true hasta que AppContext detecte el login.

      } else {
        // ── Web browser: redirect estándar ────────────────────────────────────
        const { error: supaErr } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (supaErr) throw supaErr;
        // La página navega a Google — loading se queda true intencionalmente.
      }
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
