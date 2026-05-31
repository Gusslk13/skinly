/**
 * useFCM — Hook que:
 * 1. Solicita permiso de notificaciones (solo en entorno web/PWA).
 * 2. Obtiene el FCM token via Web Push (VAPID).
 * 3. Guarda el token en la columna users.fcm_token de Supabase.
 * 4. Maneja mensajes en foreground (browser).
 *
 * Las notificaciones en background (app cerrada) las maneja firebase-messaging-sw.js.
 * En Android nativo se usa el service worker a través del WebView de Capacitor.
 *
 * Se activa automáticamente cuando currentUser cambia (login/logout).
 */

import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../../supabase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '';

// Persiste el token FCM en la tabla users
const saveToken = async (userId: string, token: string): Promise<void> => {
  try {
    await supabase.from('users').update({ fcm_token: token }).eq('id', userId);
    console.log('[FCM] Token guardado para usuario:', userId.slice(0, 8));
  } catch (e) {
    console.warn('[FCM] No se pudo guardar el token:', e);
  }
};

// ── Web FCM (funciona tanto en browser como en WebView de Capacitor) ──────────
async function setupWebFCM(userId: string): Promise<void> {
  try {
    if (!('Notification' in window))     return console.warn('[FCM] Notifications API no disponible.');
    if (!('serviceWorker' in navigator)) return console.warn('[FCM] ServiceWorker no disponible.');
    if (!VAPID_KEY)                      return console.warn('[FCM] VITE_FIREBASE_VAPID_KEY no configurado.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Permiso de notificaciones denegado.');
      return;
    }

    // Registrar el service worker de Firebase
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
        new Notification(title, { body, icon: '/images/logo.png' });
      }
    });
  } catch (e) {
    console.warn('[FCM Web] Error durante setup:', e);
  }
}

// ── Hook principal ────────────────────────────────────────────────────────────
export const useFCM = (): void => {
  const { currentUser } = useApp();

  useEffect(() => {
    if (!currentUser?.id) return;
    setupWebFCM(currentUser.id);
  }, [currentUser?.id]);
};
