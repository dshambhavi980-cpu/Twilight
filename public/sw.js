// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  console.log('[SW] Push event received');
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push data:', JSON.stringify(data));
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      data: {
        url: (data.data && data.data.url) || data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Twilight Garden', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Focus existing tab if available
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
