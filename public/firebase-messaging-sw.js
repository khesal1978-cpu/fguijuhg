// Firebase Cloud Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDempbrEElfOwm8TRMdxuCeKTfnXAAWBB0",
  authDomain: "wajud-973e0.firebaseapp.com",
  projectId: "wajud-973e0",
  storageBucket: "wajud-973e0.firebasestorage.app",
  messagingSenderId: "683758607731",
  appId: "1:683758607731:web:79fdc2ae2470614b073906",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Ping Caset';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    requireInteraction: payload.data?.requireInteraction === 'true',
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const route = event.notification.data?.route || '/';
  const urlToOpen = new URL(route, self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if app is already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            route: route,
            data: event.notification.data,
          });
          return;
        }
      }
      
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events directly
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.notification?.body || data.body || 'New notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'push-notification',
      data: data.data || {},
      requireInteraction: true,
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.notification?.title || data.title || 'Ping Caset',
        options
      )
    );
  } catch (error) {
    console.error('[SW] Error handling push:', error);
  }
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});
