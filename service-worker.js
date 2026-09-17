const CACHE_NAME = 'dzetse-v16';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/main.js',
  './js/assets.js',
  './js/input.js',
  './js/game.js',
  './js/dzetse.js',
  './js/platform.js',
  './js/orbs.js',
  './js/boss.js',
  './js/hud.js',
  './js/audio.js',
  './js/path.js',
  './js/chain.js',
  './js/orb_palette.js',
  './js/particles.js',
  './js/levels.js',
  './js/overlay.js',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=Ubuntu:wght@400;700;900&display=swap',
  './assets/arena_day.jpg',
  './assets/arena_night.jpg',
  './assets/cover.png',
  './assets/croc_idle.png',
  './assets/croc_night.png',
  './assets/dzetse_left.png',
  './assets/dzetse_main.png',
  './assets/dzetse_recoil.png',
  './assets/dzetse_right.png',
  './assets/dzetse_shoot.png',
  './assets/platform.png',
  './assets/platform_perspective.png',
  './assets/adinkra_audio-tribal-drums-526712.mp3',
  './assets/578491__postproddog__heavy-stone-door-opens-2.mp3',
  './assets/animals_alligator_growl.mp3',
  './assets/Frog%20Croaking.wav',
  './assets/34905__matthewgeorge__flat-kk.wav'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
      return res;
    }).catch(() => cached))
  );
});