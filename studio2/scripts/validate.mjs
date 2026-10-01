import fs from 'node:fs';import path from 'node:path';import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));const root=path.resolve(here,'..');
const required=['index.html','styles.css','app.js','world.js','projects.js','README.md','docs/ARCHITECTURE.md','docs/ART_DIRECTION.md','blender/build_world.py'];
for(const f of required)if(!fs.existsSync(path.join(root,f)))throw new Error('missing '+f);

const registry=fs.readFileSync(path.join(root,'projects.js'),'utf8');
const ids=[...registry.matchAll(/id:'([^']+)'/g)].map(x=>x[1]);
if(ids.length<35)throw new Error(`expected broad registry, found ${ids.length}`);
if(new Set(ids).size!==ids.length)throw new Error('duplicate project ids');
const acts=[...registry.matchAll(/\{id:'(cave|workshop|cemetery|arcade|observatory|machine|horizon)',n:/g)].map(x=>x[1]);
if(new Set(acts).size!==7)throw new Error('seven acts required');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['world','opening','actRail','projectDrawer','projectModal','allProjectsBtn','prevBtn','nextBtn','worldStatus'])if(!html.includes(`id="${id}"`))throw new Error('missing #'+id);

const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
if(!app.includes("await import('./world.js')"))throw new Error('3D must lazy-load so UI survives renderer/CDN failure');
if(app.indexOf('initUI();')>app.indexOf('bootWorld();'))throw new Error('UI must bind before 3D boot');
if(!app.includes("openDrawer('all')"))throw new Error('mobile all-project index contract missing');

const world=fs.readFileSync(path.join(root,'world.js'),'utf8');
if(!world.includes("https://esm.sh/three@0.180.0"))throw new Error('Three runtime must use browser-resolvable ESM URLs');
if(world.includes("from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples"))throw new Error('OrbitControls CDN form regresses to unresolved bare three specifier');
if(!world.includes("isMobile?'low-power':'high-performance'"))throw new Error('mobile GPU power preference missing');

const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
for(const token of ['@media(min-width:761px)','transform:translateY(105%)','min-height:50px','touch-action:manipulation'])if(!css.includes(token))throw new Error('mobile-first CSS contract missing '+token);

console.log(`Studio2 contract OK: ${ids.length} registry ids, 7 acts, UI-before-3D boot, browser-safe ESM, mobile-first sheets and tap targets.`);
