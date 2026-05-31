/**
 * useFCM — Hook que:
 * 1. Detecta si corre en Capacitor nativo (Android) o en navegador web.
 * 2. Solicita permiso de notificaciones.
 * 3. Obtiene el FCM token.
 * 4. Guarda el token en la columna users.fcm_token de Supabase.
 * 5. Maneja mensajes en foreground (browser).
 *
 * Se activa automáticamente cuando currentUser cambia (login/logout).
 */

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../../supabase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '';

// Detección segura de Capacitor sin importar el paquete (evita error en web)
const isCapacitorNative = (): boolean => {
  try {
    return (window as any).Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
};

// Persiste el token FCM en la tabla users
const saveToken = async (userId: string, token: string): Promise<void> => {
  try {
    await supabase.from('users').update({ fcm_token: token }).eq('id', userId);
    console.log('[FCM] Token guardado para usuario:', userId.slice(0, 8));
  } catch (e) {
    console.warn('[FCM] No se pudo guardar el token:', e);
  }
};

// ── Web FCM (Chrome/Firefox desktop y Android web) ───────────────────────────
async function setupWebFCM(userId: string): Promise<void> {
  try {
    if (!('Notification' in window))       return console.warn('[FCM] Notifications API no disponible.');
    if (!('serviceWorker' in navigator))   return console.warn('[FCM] ServiceWorker no disponible.');
    if (!VAPID_KEY)                        return console.warn('[FCM] VITE_FIREBASE_VAPID_KEY no configurado. Revisa .env');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Permiso de notificaciones denegado.');
      return;
    }

    // Registrar el service worker de Firebase (si no está ya registrado)
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Import dinámico para no cargar Firebase en entornos no compatibles
    const { messaging } = await import('../../firebase');
    if (!messaging) return;

    const { getToken, onMessage } = await import('firebase/messaging');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await saveToken(userId, token);
    } else {
      console.warn('[FCM] No se pudo obtener token. Verifica la VAPID key y el service worker.');
    }

    // Notificaciones en foreground (app abierta)
    onMessage(messaging, (payload) => {
      const { title = 'Skinly', body = '' } = payload.notification || {};
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/images/logo.png',
        });
      }
    });
  } catch (e) {
    console.warn('[FCM Web] Error durante setup:', e);
  }
}

// ── Capacitor nativo (Android APK) ───────────────────────────────────────────
async function setupCapacitorPush(userId: string): Promise<void> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.log('[FCM Capacitor] Permiso denegado.');
      return;
    }

    await PushNotifications.register();

    // Token FCM nativo
    await PushNotifications.addListener('registration', async ({ value }) => {
      console.log('[FCM Capacitor] Token obtenido:', value.slice(0, 20) + '…');
      await saveToken(userId, value);
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[FCM Capacitor] Error de registro:', JSON.stringify(err));
    });

    // Notificación recibida con la app en primer plano
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[FCM Capacitor] Notificación foreground:', notification.title);
    });

    // El usuario tocó la notificación
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[FCM Capacitor] Notificación tocada:', action.notification.title);
    });
  } catch (e) {
    console.warn('[FCM Capacitor] Error durante setup:', e);
  }
}

// ── Hook principal ────────────────────────────────────────────────────────────
export const useFCM = (): void => {
  const { currentUser } = useApp();

  useEffect(() => {
    if (!currentUser?.id) return;

    if (isCapacitorNative()) {
      setupCapacitorPush(currentUser.id);
    } else {
      setupWebFCM(currentUser.id);
    }
  }, [currentUser?.id]);
};
