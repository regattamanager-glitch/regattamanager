/* Regatta Manager – minimaler Service Worker (PWA-Installierbarkeit + Offline-Fallback) */
const CACHE = "rm-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API niemals cachen (force-dynamic / no-store)
  if (url.pathname.startsWith("/api/")) return;

  // Navigationen: Netzwerk zuerst, bei Offline letzte gecachte Seite
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match("/");
      })
    );
    return;
  }

  // Statische Assets: Cache zuerst, sonst Netzwerk (und cachen)
  if (/\.(?:css|js|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
  }
});
