// firebase-messaging-sw.js
// 진동과 소리를 확실하게 보장하는 Service Worker

const DB_NAME = 'notification-settings-db';
const STORE_NAME = 'settings';
const SETTINGS_KEY = 'notification-settings';

async function getNotificationSettings() {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => {
        console.log('IndexedDB open error, using defaults');
        resolve({ mode: 'all' });
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        try {
          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const getRequest = store.get(SETTINGS_KEY);
          
          getRequest.onerror = () => {
            db.close();
            resolve({ mode: 'all' });
          };
          
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result || { mode: 'all' });
          };
        } catch (e) {
          db.close();
          resolve({ mode: 'all' });
        }
      };
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return { mode: 'all' };
  }
}

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('📩 Push notification received:', event);

  const handlePush = async () => {
    const settings = await getNotificationSettings();
    console.log('⚙️ Notification settings:', settings);

    let data = {
      title: '근태 수정 요청',
      body: '새로운 근태 수정 요청이 있습니다.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: '/' }
    };

    if (event.data) {
      try {
        const jsonData = event.data.json();
        data = { ...data, ...jsonData };
      } catch (e) {
        try {
          const textData = event.data.text();
          if (textData) {
            data.body = textData;
          }
        } catch (textError) {
          console.error('Error reading push data:', textError);
        }
      }
    }

    // 강력한 진동 패턴 (더 길고 강하게)
    const vibrationPattern = [
      300, 100, 300, 100, 300  // 긴 진동 3번
    ];

    // 알림 옵션 - 모든 설정 최대화
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      requireInteraction: true,      // 사용자가 닫을 때까지 유지
      data: data.data || { url: '/' },
      actions: [
        { action: 'view', title: '확인' },
        { action: 'close', title: '닫기' }
      ],
      vibrate: vibrationPattern,     // 강력한 진동
      silent: false,                 // 무음 해제 (소리 켜기)
      renotify: true,                // 매번 알림
      tag: Date.now().toString(),    // 고유 태그 (알림 쌓이도록)
      timestamp: Date.now(),         // 타임스탬프
      // Android 전용 추가 옵션
      sound: 'default'               // 기본 소리
    };

    console.log('🔔 Showing notification with options:', options);

    // 알림 표시
    await self.registration.showNotification(data.title, options);

    // 추가: 모든 클라이언트에게 메시지 전송 (포그라운드에서도 처리)
    const allClients = await clients.matchAll({ includeUncontrolled: true });
    allClients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_RECEIVED',
        data: data
      });
    });

    console.log('✅ Notification displayed successfully');
  };

  event.waitUntil(handlePush());
});

self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 에러 처리
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});

console.log('🚀 Service Worker script loaded');
