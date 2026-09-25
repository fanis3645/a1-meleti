const CACHE="a1-1790362594299";
const SHELL="./index.html";
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch(SHELL, { cache: "reload" });
    if (!page.ok) throw new Error("shell");
    await cache.put(SHELL, page.clone());
    await cache.put("./", page.clone());
    const manifest = await fetch("./manifest.webmanifest", { cache: "reload" });
    if (manifest.ok) await cache.put("./manifest.webmanifest", manifest);
  })());
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    if (event.request.mode === "navigate") {
      const shell = await caches.match(SHELL) || await caches.match("./");
      if (shell) return shell;
    }
    const hit = await caches.match(event.request);
    if (hit) return hit;
    try { return await fetch(event.request); }
    catch (e) { return await caches.match(SHELL) || new Response("", { status: 503 }); }
  })());
});
