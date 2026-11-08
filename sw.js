/* PRATA — service worker: simpan kulit aplikasi agar terbuka
   sekejap dan tetap bisa dibuka saat jaringan lambat.
   Data akun & progres tersimpan lokal (localStorage), bukan di sini. */
var NAMA_CACHE = "prata-v421";
var BERKAS_KULIT = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./icon-180.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(NAMA_CACHE).then(function (c) { return c.addAll(BERKAS_KULIT); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (daftar) {
      return Promise.all(daftar.map(function (k) {
        if (k !== NAMA_CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  // Hanya berkas milik PANARA sendiri; permintaan lain (termasuk AI online)
  // berjalan seperti biasa tanpa disimpan.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (tersimpan) {
      var jaringan = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var salinan = res.clone();
          caches.open(NAMA_CACHE).then(function (c) { c.put(e.request, salinan); });
        }
        return res;
      }).catch(function () { return tersimpan; });
      return tersimpan || jaringan;
    })
  );
});
