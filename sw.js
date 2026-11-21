const CACHE = "poac-unified-v35-dina-compact-add-button";
const SHELL = [
  "./index.html",
  "./login.html",
  "./welcome.html",
  "./menu.html",
  "./manifest.webmanifest",
  "./assets/poac-portal.css",
  "./assets/app.js",
  "./assets/config.js",
  "./assets/style.css",
  "./assets/gm-login.css",
  "./assets/dina-branch-maps.js",
  "./assets/tenant-config.js",
  "./assets/tenant-branding.js",
  "./assets/dina-brand-identity.css",
  "./assets/dina-theme.css",
  "./assets/dina-welcome.css",
  "./assets/dina-welcome.js",
  "./assets/menu-display.js",
  "./assets/menu-display.css",
  "./assets/public-menu-client.js",
  "./assets/public-menu-premium.css",
  "./assets/dc-whatsapp-order.css",
  "./assets/dc-whatsapp-order.js",
  "./assets/dina-best-sellers.js",
  "./assets/public-menu-review-link.js",
  "./Dina'sCorner/index.html",
  "./Dina'sCorner/login.html",
  "./Dina'sCorner/welcome.html",
  "./Dina'sCorner/dashboard.html",
  "./Dina'sCorner/categories.html",
  "./Dina'sCorner/home.html",
  "./Dina'sCorner/locations.html",
  "./Dina'sCorner/menu.html",
  "./GrandDryClean/index.html",
  "./GrandDryClean/vodafone-cash.html",
  "./GrandDryClean/order.html",
  "./GrandDryClean/login.html",
  "./GrandDryClean/gm.html",
  "./GrandDryClean/dashboard.html",
  "./GrandDryClean/css/management-home.css",
  "./GrandDryClean/assets/grand-dry-clean-logo.png",
  "./GrandDryClean/assets/products/furnishings/01_blanket_single.png",
  "./GrandDryClean/assets/products/furnishings/02_blanket_double.png",
  "./GrandDryClean/assets/products/furnishings/03_fiber_duvet_large.png",
  "./GrandDryClean/assets/products/furnishings/04_fiber_duvet_small.png",
  "./GrandDryClean/assets/products/furnishings/05_quilt_coverlet.png",
  "./GrandDryClean/assets/products/furnishings/06_bedspread.png",
  "./GrandDryClean/assets/products/furnishings/07_pillow_large.png",
  "./GrandDryClean/assets/products/furnishings/08_pillow_small.png",
  "./GrandDryClean/assets/products/apron.jpg",
  "./GrandDryClean/assets/products/blouse.jpg",
  "./GrandDryClean/assets/products/carpet.jpg",
  "./GrandDryClean/assets/products/casual-dress.jpg",
  "./GrandDryClean/assets/products/coat-long.jpg",
  "./GrandDryClean/assets/products/coat-wool.jpg",
  "./GrandDryClean/assets/products/evening-dress.jpg",
  "./GrandDryClean/assets/products/galabeya.jpg",
  "./GrandDryClean/assets/products/hoodie.jpg",
  "./GrandDryClean/assets/products/jacket.jpg",
  "./GrandDryClean/assets/products/leather-jacket.jpg",
  "./GrandDryClean/assets/products/pajama-2-piece.jpg",
  "./GrandDryClean/assets/products/polo-shirt.jpg",
  "./GrandDryClean/assets/products/pullover.jpg",
  "./GrandDryClean/assets/products/shawl.jpg",
  "./GrandDryClean/assets/products/shirt.jpg",
  "./GrandDryClean/assets/products/shorts-gabardine.jpg",
  "./GrandDryClean/assets/products/skirt.jpg",
  "./GrandDryClean/assets/products/socks.jpg",
  "./GrandDryClean/assets/products/suit-2-piece.jpg",
  "./GrandDryClean/assets/products/suit-3-piece.jpg",
  "./GrandDryClean/assets/products/suit-jacket.jpg",
  "./GrandDryClean/assets/products/tie.jpg",
  "./GrandDryClean/assets/products/towel.jpg",
  "./GrandDryClean/assets/products/tracksuit-2-piece.jpg",
  "./GrandDryClean/assets/products/trousers-gabardine.jpg",
  "./GrandDryClean/assets/products/trousers-jeans.jpg",
  "./GrandDryClean/assets/products/tshirt.jpg",
  "./GrandDryClean/assets/products/tunic.jpg",
  "./GrandDryClean/assets/products/wedding-dress.jpg",
  "./GrandDryClean/assets/products/womens-abaya.jpg",
  "./GrandDryClean/js/session-guard.js",
  "./GrandDryClean/js/management-home.js",
  "./GrandDryClean/css/customer.css",
  "./GrandDryClean/css/order.css",
  "./GrandDryClean/css/login.css",
  "./GrandDryClean/css/poac.css",
  "./GrandDryClean/css/gm.css",
  "./GrandDryClean/js/customer.js",
  "./GrandDryClean/js/order.js",
  "./GrandDryClean/js/dashboard.js",
  "./GrandDryClean/js/gm.js",
  "./POAC-Admin/index.html",
  "./POAC-Admin/login.html",
  "./POAC-Admin/poac-admin.css",
  "./POAC-Admin/poac-admin.js",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key =>
          (key.startsWith("dinas-corner-gm-") || key.startsWith("poac-")) && key !== CACHE
        ).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  // Always fetch the protected dashboard and its auth guard from GitHub Pages.
  // Never let a stale service-worker cache keep the authorization overlay alive.
  const protectedAuthAsset =
    url.pathname.endsWith("/GrandDryClean/dashboard.html") ||
    url.pathname.endsWith("/GrandDryClean/js/session-guard.js");
  if (protectedAuthAsset) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        return cache.match(new URL("index.html", self.registration.scope));
      }
      return Response.error();
    }
  })());
});
