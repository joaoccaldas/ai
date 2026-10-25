/* App shell/offline content. 3D assets are optional and intentionally never precached. */
const CACHE='onda-discover-fr-v1';
const SHELL=['./','./index.html','./app.js','./learning.js','./curriculum.js','./world.js','./styles.css','./manifest.webmanifest','./assets/icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('onda-discover-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 if(u.pathname.endsWith('.glb')||u.pathname.endsWith('.hdr')||u.pathname.endsWith('.jpg'))return;
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{if(res.ok&&res.type==='basic'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return res;})));
});
