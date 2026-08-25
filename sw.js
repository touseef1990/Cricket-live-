// cricScore service worker — caches the static app shell only.
// Live API responses are NEVER cached as permanent data (see spec section 20).
const SHELL_CACHE = "cricscore-shell-v1";
const SHELL_FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache API calls — always go to network for live data.
  if (url.hostname.includes("cricapi.com")) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({status:"failure",reason:"offline"}), {headers:{"Content-Type":"application/json"}})));
    return;
  }
  // App shell: cache-first, falling back to network.
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});
