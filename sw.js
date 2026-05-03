// Service Worker — offline cache.
// IndexedDB'ye dokunmaz, sadece statik kod dosyalarını cache'ler.
// Cümle/kod güncellendiğinde CACHE_VERSION'u arttır.

const CACHE_VERSION = "v5";
const CACHE_NAME = `seyahat-kiti-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/app.js",
  "./js/data.js",
  "./js/places.js",
  "./js/db.js",
  "./js/phrasebook.js",
  "./js/documents.js",
  "./js/places-ui.js",
  "./js/shopping.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).catch((e) => {
        console.warn("Cache addAll hatası:", e);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Stale-while-revalidate for our own assets
        fetch(req).then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
