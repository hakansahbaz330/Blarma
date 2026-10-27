// Basit çevrimdışı önbellek: uygulama kabuğu önce önbellekten, ağ yedek.
const VERSION = "kb-v4";
const ASSETS = [
  "./", "index.html", "css/style.css", "manifest.webmanifest", "data/words.js", "data/emoji.js", "data/stories.js",
  "js/app.js", "js/ctx.js", "js/store.js", "js/srs.js", "js/session.js", "js/sessionui.js",
  "js/exercises.js", "js/speech.js", "js/util.js", "js/icons.js", "js/stories.js", "js/storiesui.js", "js/slideshow.js", "js/visuals.js", "js/lemma.js", "js/ambient.js", "js/meditation.js", "js/recorder.js", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net; // önbellek önce; arka planda güncelle
    })
  );
});
