const CACHE_NAME = 'brainbox-retailplus-v25-cache-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Get pending sync data from IndexedDB or localStorage
    const pendingData = JSON.parse(localStorage.getItem('brainbox_pending_sync') || '[]');
    
    for (const item of pendingData) {
      try {
        // Sync each item to server
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item)
        });
        
        // Mark as synced
        item.synced = true;
      } catch (error) {
        console.error('Sync failed for item:', item, error);
      }
    }
    
    // Update pending sync data
    const stillPending = pendingData.filter(item => !item.synced);
    localStorage.setItem('brainbox_pending_sync', JSON.stringify(stillPending));
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}