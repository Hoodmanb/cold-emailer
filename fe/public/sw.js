// No-op service worker placeholder.
// This prevents stale browser registrations from repeatedly requesting /sw.js and logging 404s.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
