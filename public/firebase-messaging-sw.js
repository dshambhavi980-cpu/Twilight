// Firebase Messaging Service Worker
// This file MUST be named firebase-messaging-sw.js and live at the root

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBVC3lzmNdnQPGIbZx9Sg2HOa6B9SXN2fs",
  authDomain: "twilight-d25bb.firebaseapp.com",
  projectId: "twilight-d25bb",
  storageBucket: "twilight-d25bb.firebasestorage.app",
  messagingSenderId: "475915477527",
  appId: "1:475915477527:web:fcb08ef15505dd24c33252",
  measurementId: "G-L9L96K1KVC"
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Twilight Garden';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New notification',
    icon: payload.notification?.icon || '/twilight.png',
    badge: '/twilight.png',
    data: {
      url: payload.data?.url || '/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click:', event.notification.data);
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to focus an existing tab
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) return client.focus();
      }
      // Open new window if no tab found
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
