import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'), bellagio=read('bellagio.html'), login=read('login.html'), loginJs=read('login.js'), mw=read('middleware.js'), session=read('api/session.js'), vercel=JSON.parse(read('vercel.json')), scene=JSON.parse(read('worlds/bellagio-lobby.scene.json'));

for(const [name,html] of [['world-zero',index],['bellagio',bellagio],['login',login]]){
  assert.match(html,/width=device-width,initial-scale=1,viewport-fit=cover/,name+' viewport contract');
  assert.doesNotMatch(html,/width:\s*100vw/,name+' must not force 100vw');
}
for(const [name,html] of [['world-zero',index],['bellagio',bellagio]]){
  assert.match(html,/@media\(max-width:760px\)/,name+' phone reflow');
  assert.match(html,/@media\(max-height:500px\) and \(orientation:landscape\)/,name+' short-landscape reflow');
  assert.match(html,/VRButton\.createButton/,name+' WebXR entry');
  for(const id of ['fps','draws','tris','dpr'])assert.match(html,new RegExp('id="'+id+'"'),name+' telemetry '+id);
  assert.match(html,/SAFE FALLBACK/,name+' safe fallback');
}
assert.match(index,/href="\/bellagio\.html"/,'World Zero routes to Bellagio benchmark');
assert.equal(scene.semantic_authority,'mesh');
assert.ok(scene.assets.some(a=>a.role==='semantic-mesh'&&a.bytes===3950912));
assert.ok(scene.excluded_from_r0.some(a=>a.path==='assets/city.glb'&&a.bytes===11940384));
assert.equal(scene.source.revision,'b13ece357ddf46086acfec0966a4f63a947f29f3');
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
assert.match(csp,/raw\.githubusercontent\.com/);

function inlineModule(html){
  const matches=[...html.matchAll(/<script type="module">(.*?)<\/script>/gs)];
  assert.equal(matches.length,1,'expected exactly one inline module');
  return matches[0][1].replace(/^import .*?;\s*$/gm,'');
}
for(const [name,html] of [['world-zero',index],['bellagio',bellagio]]){
  try{new Function(inlineModule(html));}catch(e){throw new Error(name+' inline JS parse failed: '+e.message);}
}
for(const file of ['login.js','middleware.js','api/session.js','api/logout.js','api/health.js']){
  const r=spawnSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(r.status,0,file+' node syntax: '+r.stderr);
}
console.log('Spatial Lab contract PASS: auth, source pinning, scene authority, responsive rules, XR/fallback telemetry and JS syntax.');
