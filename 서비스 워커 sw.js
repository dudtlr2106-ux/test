// sw.js
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || '새 알림';
    const options = {
        body: data.body || '',
        icon: data.icon || '/icon.png',
        badge: data.badge || '/badge.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({type: 'window'}).then(clientList => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
