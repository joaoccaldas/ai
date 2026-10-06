import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'), bellagio=read('bellagio.html'), login=read('login.html'), loginJs=read('login.js'), mw=read('middleware.js'), session=read('api/session.js'), asset=read('api/asset.js'), sourceHealth=read('api/source-health.js'), vercel=JSON.parse(read('vercel.json')), scene=JSON.parse(read('worlds/bellagio-lobby.scene.json')), registry=JSON.parse(read('worlds/registry.json'));

for(const [name,html] of [['world-zero',index],['bellagio',bellagio],['login',login]]){
  assert.match(html,/width=device-width,initial-scale=1,viewport-fit=cover/,name+' viewport contract');
  assert.doesNotMatch(html,/width:\s*100vw/,name+' must not force 100vw');
}
for(const [name,html] of [['world-zero',index],['bellagio',bellagio]]){
  assert.match(html,/@media\(max-width:760px\)/,name+' phone reflow');
  assert.match(html,/@media\(max-height:500px\) and \(orientation:landscape\)/,name+' short-landscape reflow');
  assert.match(html,/VRButton\.createButton/,name+' WebXR entry');
  for(const id of ['fps','draws','tris','dpr','p95'])assert.match(html,new RegExp('id="'+id+'"'),name+' telemetry '+id);
  assert.match(html,/SAFE FALLBACK/,name+' safe fallback');
}
assert.match(index,/href="\/bellagio\.html"/,'World Zero routes to Bellagio benchmark');
assert.match(index,/href="\/diagnostics\.html"/,'World Zero routes to device diagnostics');
const diagnostics=read('diagnostics.html');
assert.match(diagnostics,/navigator\.gpu/,'diagnostics checks WebGPU');
assert.match(diagnostics,/isSessionSupported\('immersive-vr'\)/,'diagnostics checks immersive WebXR');
assert.match(diagnostics,/MAX_TEXTURE_SIZE/,'diagnostics inspects GPU limits');
assert.doesNotMatch(diagnostics,/fetch\(|XMLHttpRequest/,'diagnostics stays local-only');
assert.match(index,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'World Zero mobile telemetry is width-safe');
assert.match(index,/\[hidden\]\{display:none!important\}/,'World Zero hidden attribute cannot be overridden');
assert.match(bellagio,/\[hidden\]\{display:none!important\}/,'Bellagio hidden attribute cannot be overridden');
assert.match(index,/@media\(max-height:500px\) and \(orientation:landscape\).*?\.controls>\*\{width:auto/s,'World Zero short landscape cancels phone full-width controls');
assert.match(bellagio,/@media\(max-height:500px\) and \(orientation:landscape\).*?\.actions>\*\{width:auto/s,'Bellagio short landscape cancels phone full-width controls');
assert.doesNotMatch(index,/function available\(/,'World Zero must not create a throwaway WebGL probe context');
assert.doesNotMatch(bellagio,/function available\(/,'Bellagio must not create a throwaway WebGL probe context');
assert.match(index,/new THREE\.WebGLRenderer[\s\S]*?catch\(error\)/,'World Zero renderer init is the capability gate');
assert.match(bellagio,/new THREE\.WebGLRenderer[\s\S]*?catch\(error\)/,'Bellagio renderer init is the capability gate');
assert.match(bellagio,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'Bellagio mobile telemetry is width-safe');
assert.match(bellagio,/function cropGeometry\(/,'Bellagio benchmark crops the shared baked mesh by room bounds');
assert.match(bellagio,/LOBBY_BOUNDS/,'Bellagio benchmark uses semantic lobby bounds');
assert.match(bellagio,/function chihuly\(/,'Bellagio reuses its canonical Fiori di Como generator');
assert.match(bellagio,/LOCAL_TARGET/,'Bellagio OrbitControls use local coordinates under the XR origin rig');
assert.equal(scene.semantic_authority,'mesh');
assert.ok(scene.assets.some(a=>a.role==='semantic-mesh'&&a.bytes===3950912));
assert.ok(scene.excluded_from_r0.some(a=>a.path==='assets/city.glb'&&a.bytes===11940384));
assert.equal(scene.source.revision,'b13ece357ddf46086acfec0966a4f63a947f29f3');
assert.equal(registry.schema,'caldas.world-registry/v0');
assert.equal(new Set(registry.worlds.map(w=>w.id)).size,registry.worlds.length,'world ids unique');
assert.equal(new Set(registry.worlds.map(w=>w.route)).size,registry.worlds.length,'world routes unique');
assert.ok(registry.worlds.some(w=>w.id==='room:spatial-lab:bellagio-lobby-r0'&&w.scene_manifest==='worlds/bellagio-lobby.scene.json'));
assert.doesNotMatch(loginJs,/localStorage|sessionStorage/,'auth token must not use browser storage');
assert.match(login,/id="recover"/,'password recovery is visible');
assert.match(loginJs,/https:\/\/joaoccaldas\.github\.io\/konam\/index\.html/,'recovery reuses canonical KONA callback');
for(const token of ['HttpOnly','Secure','SameSite=Lax'])assert.match(session,new RegExp(token),'session cookie '+token);
assert.match(session,/a0468c5f-ea3c-4e59-9c7f-201c0131bea9/,'owner UUID allowlist');
assert.match(mw,/PUBLIC=new Set\(\['\/login\.html'/,'explicit public allowlist');
assert.doesNotMatch(mw,/PUBLIC[^\n]*'\/'/,'world root must not be public');
const csp=vercel.headers[0].headers.find(h=>h.key==='Content-Security-Policy')?.value||'';
assert.ok(csp&&!csp.includes('*'),'CSP must exist without wildcard');
assert.match(csp,/frame-ancestors 'none'/);
assert.doesNotMatch(csp,/raw\.githubusercontent\.com/,'browser CSP must not contact raw GitHub directly');
assert.match(index,/BIKE='\/api\/asset\?id=speedmax'/,'Speedmax uses same-origin gateway');
assert.match(bellagio,/ASSET=id=>'\/api\/asset\?id='/,'Bellagio uses same-origin gateway');
assert.match(asset,/Object\.freeze\(\{/,'asset gateway is a closed allowlist');
assert.match(asset,/expectedBytes:2081248/,'Speedmax byte identity pinned');
assert.match(asset,/expectedBytes:3950912/,'Bellagio GLB byte identity pinned');
assert.doesNotMatch(asset,/req\.query/,'asset route does not rely on framework query helpers');
assert.match(sourceHealth,/speedmax/,'source health covers Speedmax');
assert.match(sourceHealth,/bellagio/,'source health covers Bellagio');
assert.match(mw,/\/api\/source-health/,'source health is explicitly public');
assert.doesNotMatch(mw,/PUBLIC[^\n]*\/api\/asset/,'asset bytes stay behind auth');

function inlineModule(html){
  const matches=[...html.matchAll(/<script type="module">(.*?)<\/script>/gs)];
  assert.equal(matches.length,1,'expected exactly one inline module');
  return matches[0][1].replace(/^import .*?;\s*$/gm,'');
}
for(const [name,html] of [['world-zero',index],['bellagio',bellagio]]){
  try{new Function(inlineModule(html));}catch(e){throw new Error(name+' inline JS parse failed: '+e.message);}
}
const health=read('api/health.js');
assert.match(health,/VERCEL_GIT_COMMIT_SHA/,'health exposes deployed SHA');
assert.match(health,/bellagio-lobby-r0/,'health lists Bellagio benchmark');
for(const file of ['login.js','middleware.js','api/session.js','api/logout.js','api/health.js','api/asset.js','api/source-health.js']){
  const r=spawnSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(r.status,0,file+' node syntax: '+r.stderr);
}
console.log('Spatial Lab contract PASS: auth, source pinning, scene authority, responsive rules, XR/fallback telemetry and JS syntax.');
