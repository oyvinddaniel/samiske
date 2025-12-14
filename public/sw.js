// Enhanced Service Worker for samiske.no PWA
// Version 2.0 - Improved offline support and push notifications

const CACHE_NAME = 'samiske-v2'
const OFFLINE_PAGE = '/offline.html'

// Critical assets to cache immediately
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...')
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core files')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('[SW] Core files cached successfully')
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2...')
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated and old caches cleaned')
      })
  )
  self.clients.claim()
})

// Fetch event - Network first with cache fallback and offline page
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return

  // Skip Supabase and API requests (always need fresh data)
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('auth/v1')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check for valid response
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone and cache the response
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', event.request.url)
            return cachedResponse
          }

          // For navigation requests, return offline page
          if (event.request.mode === 'navigate') {
            console.log('[SW] Network failed, serving offline page')
            return caches.match(OFFLINE_PAGE)
          }

          // For other requests, return a generic offline response
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          })
        })
      })
  )
})

// Enhanced push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  if (!event.data) {
    console.log('[SW] Push event has no data')
    return
  }

  let data
  try {
    data = event.data.json()
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error)
    data = {
      title: 'samiske.no',
      body: event.data.text() || 'Ny aktivitet',
    }
  }

  const options = {
    body: data.body || 'Ny aktivitet på samiske.no',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'samiske-notification',
    data: {
      url: data.url || '/',
      dateReceived: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Åpne',
      },
      {
        action: 'close',
        title: 'Lukk',
      },
    ],
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration
      .showNotification(data.title || 'samiske.no', options)
      .then(() => {
        console.log('[SW] Notification displayed successfully')
      })
      .catch((error) => {
        console.error('[SW] Failed to show notification:', error)
      })
  )
})

// Enhanced notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  // Handle action buttons
  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window to focus
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[SW] Focusing existing window')
            return client.focus()
          }
        }
        // Open a new window if no matching window found
        if (clients.openWindow) {
          console.log('[SW] Opening new window:', urlToOpen)
          return clients.openWindow(urlToOpen)
        }
      })
      .catch((error) => {
        console.error('[SW] Error handling notification click:', error)
      })
  )
})

// Background sync (for offline post creation - future feature)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts())
  }
})

async function syncPosts() {
  console.log('[SW] Syncing offline posts...')
  // TODO: Implement background sync for posts created while offline
  // This would retrieve posts from IndexedDB and send them to the server
}

// Message event (for manual cache updates and skip waiting)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] Cache cleared')
        return self.registration.update()
      })
    )
  }
})

console.log('[SW] Service worker loaded successfully')
