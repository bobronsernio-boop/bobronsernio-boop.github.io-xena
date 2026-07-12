importScripts('https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.67-alpha.2/dist/scramjet.all.js');

const scramjetWorker = new ScramjetServiceWorker();

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/scram/')) {
    event.respondWith(scramjetWorker.fetch(event));
  }
});
