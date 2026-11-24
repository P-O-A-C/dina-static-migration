const CACHE = "poac-github-only-v1";
const SHELL = [
  "./index.html","./login.html","./welcome.html","./menu.html","./manifest.webmanifest",
  "./assets/tenant-config.js","./assets/github-only-cleanup.js","./assets/static-runtime.js","./assets/dina-branch-maps.js",
  "./assets/dina-welcome.css","./assets/dina-welcome.js","./assets/dina-best-sellers.js",
  "./assets/style.css","./assets/dina-theme.css","./assets/menu-display.css","./assets/public-menu-premium.css",
  "./assets/menu-display.js","./assets/dc-whatsapp-order.css","./assets/dc-whatsapp-order.js",
  "./data/menu-categories.json","./data/menu-items.json","./data/locations.json","./data/home-featured-products.json",
  "./GrandDryClean/index.html","./GrandDryClean/order.html","./GrandDryClean/vodafone-cash.html",
  "./GrandDryClean/css/customer.css","./GrandDryClean/css/order.css","./GrandDryClean/js/customer.js","./GrandDryClean/js/order.js",
  "./GrandDryClean/data/branches.json","./GrandDryClean/data/home-slides.json","./GrandDryClean/data/ironing-prices.json",
  "./GrandDryClean/data/service-categories.json","./GrandDryClean/data/service-items.json","./GrandDryClean/data/settings.json",
  "./GrandDryClean/assets/grand-dry-clean-logo.png","./GrandDryClean/assets/gdc-slide-1.jpg","./GrandDryClean/assets/gdc-slide-2.jpg","./GrandDryClean/assets/gdc-slide-3.jpg"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("poac-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  const request=event.request;if(request.method!=="GET")return;
  const url=new URL(request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(url.pathname.includes("/poac-github-admin/")){event.respondWith(fetch(request,{cache:"no-store"}));return;}
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});return response;}catch(_){return await cache.match(request)|| (request.mode==="navigate"?cache.match(new URL("index.html",self.registration.scope)):Response.error());}})());
});
