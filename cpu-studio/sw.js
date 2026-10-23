/* CPU Studio: same-origin offline app-shell cache; no third-party requests. */
const CACHE='cpu-studio-shell-v3';
const FILES=['./','./index.html','./styles.css','./src/main.mjs','./src/engine.mjs','./src/catalog.mjs','./assets/icon.svg','./manifest.webmanifest'];
self.addEventListener('install', event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate', event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cpu-studio-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const req=event.request, url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith(fetch(req).then(response=>{
    if(response.ok&&!url.search){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}
    return response;
  }).catch(async()=>{
    const hit=await caches.match(req);
    if(hit)return hit;
    // Only a navigation may fall back to HTML. Returning an HTML document as JS/CSS
    // produces a misleading 'success' with a broken app when assets were not cached.
    if(req.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
    return Response.error();
  }));
});
