const CACHE="a1-1790366760475";
const SHELL="./index.html";
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch("./index.html?fresh=" + CACHE, { cache: "no-store" });
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
      try {
        const fresh = await fetch(event.request, { cache: "no-store" });
        const cache = await caches.open(CACHE);
        await cache.put(SHELL, fresh.clone());
        await cache.put("./", fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match(SHELL)) || (await caches.match("./")) || (await caches.match(event.request));
      }
    }
    const hit = await caches.match(event.request);
    if (hit) return hit;
    try { return await fetch(event.request); }
    catch (e) { return await caches.match(SHELL) || new Response("", { status: 503 }); }
  })());
});
