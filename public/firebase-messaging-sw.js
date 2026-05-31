// Service Worker de Firebase Cloud Messaging
// Maneja notificaciones push cuando la app está en background o cerrada.
// NOTA: Las credenciales de Firebase son públicas (no son secretos).

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyByj7AHXTGNYcUEaOestyR_5ICnRlo4CS4',
  authDomain:        'skinly-dd4c7.firebaseapp.com',
  projectId:         'skinly-dd4c7',
  storageBucket:     'skinly-dd4c7.firebasestorage.app',
  messagingSenderId: '813694745055',
  appId:             '1:813694745055:web:697a1d3dce9565f168ac6a',
});

const messaging = firebase.messaging();

// Notificaciones en background (app cerrada o en otra pestaña)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificación background recibida:', payload);

  const { title = 'Skinly', body = '' } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon:  '/images/logo.png',
    badge: '/images/logo.png',
    data,
    requireInteraction: false,
    tag: data.type || 'skinly-notification',
  });
});

// Clic en la notificación → abrir/enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
