// PRATA — Service Worker (cache-first untuk shell; bank soal selalu network-first)
var NAMA_CACHE = "prata-v87";
var BERKAS_KULIT = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./icon-180.png"
];

// Pasang: simpan shell aplikasi ke cache, lalu aktifkan segera.
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(NAMA_CACHE).then(function (c) { return c.addAll(BERKAS_KULIT); })
      .then(function () { return self.skipWaiting(); })
  );
});

// Aktivasi: bersihkan cache lama, lalu ambil alih halaman.
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (kunci) {
      return Promise.all(kunci.filter(function (k) { return k !== NAMA_CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Fetch: bank-harian.json SELALU dari jaringan (jangan pernah dari cache),
// file lain cache-first dengan fallback jaringan, lalu simpan ke cache.
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.pathname.indexOf("bank-harian.json") !== -1) { e.respondWith(fetch(e.request)); return; }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      if (r) return r;
      return fetch(e.request).then(function (res) {
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        var salinan = res.clone();
        caches.open(NAMA_CACHE).then(function (c) { c.put(e.request, salinan); });
        return res;
      });
    })
  );
});
