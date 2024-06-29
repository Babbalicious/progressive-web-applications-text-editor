const { offlineFallback, warmStrategyCache } = require("workbox-recipes");
const { CacheFirst, StaleWhileRevalidate } = require("workbox-strategies");
const { registerRoute } = require("workbox-routing");
const { CacheableResponsePlugin } = require("workbox-cacheable-response");
const { ExpirationPlugin } = require("workbox-expiration");
const { precacheAndRoute } = require("workbox-precaching/precacheAndRoute");

precacheAndRoute(self.__WB_MANIFEST);

const pageCache = new CacheFirst({
  cacheName: "page-cache",
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

warmStrategyCache({
  urls: ["/index.html", "/"],
  strategy: pageCache,
});

registerRoute(({ request }) => request.mode === "navigate", pageCache);

// TODO: Implement asset caching
registerRoute(
  ({ request }) => {
    return ["style", "script", "worker"].includes(request.destination);
  },
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

offlineFallback({
  pageFallback: "/offline.html",
});

// Enhanced error handling and logging
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("static-resources").then((cache) => {
      return cache
        .addAll([
          "/index.html",
          "/styles.css",
          "/script.js",
          // Add other URLs here
        ])
        .catch((error) => {
          console.error("Failed to cache:", error);
          throw error;
        });
    })
  );
});
