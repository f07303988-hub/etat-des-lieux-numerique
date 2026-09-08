const CACHE_NAME = 'edl-pasly-v2'; // ⚠️ Incrémenter ce numéro à chaque mise à jour importante du code
                                     // (surtout après un correctif de sécurité) pour forcer le
                                     // nettoyage de l'ancien cache sur les appareils des utilisateurs.
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : NETWORK-FIRST.
// On essaie toujours de récupérer la dernière version depuis le réseau en priorité,
// pour ne jamais faire tourner une version obsolète (et potentiellement corrigée
// pour une faille de sécurité) alors qu'une connexion est disponible.
// Le cache ne sert que de secours si le réseau échoue (hors-ligne, salle sans réseau, etc.).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
