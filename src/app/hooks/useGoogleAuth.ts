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

        // Cuando el browser se cierra, hacer polling de getSession() hasta 5s.
        // appUrlOpen puede tardar en procesar el token — el polling detecta la
        // sesión tan pronto esté lista (~500ms) en lugar de esperar 10 segundos.
        const listener = await Browser.addListener('browserFinished', async () => {
          listener.remove();

          const MAX_ATTEMPTS = 10;
          const INTERVAL_MS  = 500;

          for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await new Promise(r => setTimeout(r, INTERVAL_MS));
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                // Sesión encontrada — onAuthStateChange en AppContext navegará.
                // No llamamos setView aquí para evitar doble navegación.
                return;
              }
            } catch {
              // Ignorar errores transitorios y seguir intentando
            }
          }

          // Después de 5s sin sesión → el usuario canceló
          setLoading(false);
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
