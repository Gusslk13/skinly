/**
 * useGoogleAuth
 *
 * Google Sign-In hook for Skinly using Supabase OAuth redirect flow.
 *
 * - Web browser: redirige normalmente via window.location.
 * - Capacitor nativo (Android): abre el OAuth en un in-app browser con
 *   @capacitor/browser. Cuando el browser se cierra (browserFinished),
 *   llama a getSession() y navega al home si la sesión existe.
 *   AppContext también escucha el deep link skinly://auth/callback via
 *   @capacitor/app para procesar el token y cerrar el browser.
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

        // Escuchar cuando el browser se cierra (deep link o botón atrás)
        // AppContext procesará el token via appUrlOpen; aquí solo como fallback
        const listener = await Browser.addListener('browserFinished', async () => {
          listener.remove();

          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
              // El usuario canceló — no hay sesión
              setLoading(false);
            }
            // Si hay sesión, onAuthStateChange en AppContext navegará automáticamente.
            // No hacemos nada más aquí para evitar doble navegación.
          } catch {
            setLoading(false);
          }
        });

        // Abrir la URL de Google OAuth dentro de la app
        await Browser.open({
          url: data.url,
          windowName: '_self',
          presentationStyle: 'popover',
          toolbarColor: '#1B5E20',
        });

        // Loading se queda true — AppContext o browserFinished lo resolverán

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
