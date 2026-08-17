const CACHE_VERSION = 'kinklist-prototype-v1';
const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './manifest.json',
    './json/kink-data.json',
    './js/main.js',
    './js/app.js',
    './js/config.js',
    './js/core-utils.js',
    './js/custom-data-manager.js',
    './js/custom-ui-manager.js',
    './js/data-loader.js',
    './js/event-manager.js',
    './js/history-manager.js',
    './js/history-ui-manager.js',
    './js/import-export-manager.js',
    './js/indexed-db-manager.js',
    './js/lazy-feature-manager.js',
    './js/lazy-image-generator.js',
    './js/preferences-manager.js',
    './js/search-manager.js',
    './js/service-worker-register.js',
    './js/stats-manager.js',
    './js/ui-generator.js',
    './favicon/android-icon-192x192.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key.startsWith('kinklist-prototype-') && key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        // Les ressources CDN restent fonctionnelles en ligne sans rendre le
        // démarrage dépendant d’un précache opaque.
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const networkResponse = fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const responseCopy = response.clone();
                        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, responseCopy));
                    }
                    return response;
                })
                .catch(() => cachedResponse);

            return cachedResponse || networkResponse;
        })
    );
});
