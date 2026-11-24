const CACHE = "pj-fitnes-v2";
const CORE = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];

// Serviços do Firebase (login e banco de dados) nunca passam pelo cache
const BYPASS = ["firestore.googleapis.com", "identitytoolkit.googleapis.com", "securetoken.googleapis.com", "firebaseinstallations.googleapis.com", "apis.google.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache dinâmico: o app e as bibliotecas externas (Tailwind, fontes, Firebase SDK) ficam salvos
// após o primeiro acesso com internet, e passam a abrir offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const host = new URL(e.request.url).hostname;
  if (BYPASS.includes(host) || host.endsWith(".firebaseio.com")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});

