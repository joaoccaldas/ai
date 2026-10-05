import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { findRoute } from '../museum/src/navigation.mjs';
const studio=fileURLToPath(new URL('../',import.meta.url));
const {projects}=JSON.parse(await readFile(path.join(studio,'projects.json')));
assert.equal(new Set(projects.map(p=>p.id)).size,projects.length,'Duplicate project IDs');
for(const p of projects){
  assert.match(p.id,/^[a-z0-9-]+$/);
  for(const key of ['title','category','status','summary','image','imageAlt','focus','question','approach','result','next'])assert.ok(p[key]?.trim(),`${p.id}: missing ${key}`);
  assert.ok(p.details.length&&p.stack.length&&p.links.length&&p.evidence.length,`${p.id}: incomplete case study`);
}
const generated=['index.html','mobile/index.html','gallery.html',...projects.map(p=>`projects/${p.id}/index.html`)];
for(const file of generated){
  const full=path.join(studio,file), html=await readFile(full,'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file}: needs one primary heading`);
  for(const [,ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https:|#)/.test(ref))continue;
    assert.ok(!/^(javascript:|data:|\/)/.test(ref),`Unsafe or deployment-dependent URL: ${ref}`);
    const target=path.resolve(path.dirname(full),ref.split(/[?#]/)[0]);
    const info=await stat(target).catch(()=>null);assert.ok(info,`${file}: broken local reference ${ref}`);
    if(info.isDirectory())await stat(path.join(target,'index.html'));
  }
}
const provenance=JSON.parse(await readFile(path.join(studio,'portfolio/assets/bike-provenance.json')));
for(const lod of provenance.derivatives){const bytes=await readFile(path.join(studio,'portfolio/assets',lod.file));assert.equal(bytes.length,lod.bytes);const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length));assert.ok(gltf.materials.some(m=>m.name==='paint_frame'));const tris=gltf.meshes.reduce((sum,m)=>sum+m.primitives.reduce((s,p)=>s+gltf.accessors[p.indices].count/3,0),0);assert.equal(tris,lod.triangles);assert.equal(gltf.meshes.reduce((n,m)=>n+m.primitives.length,0),lod.primitives);assert.equal(lod.primitives,20);for(const bound of ['min','max'])for(let i=0;i<3;i++)assert.ok(Math.abs(lod.bounds[bound][i]-provenance.sourceBounds[bound][i])<.006,'Bike bounds changed beyond the derivative error budget');assert.ok(tris<200000);}
const layout=JSON.parse(await readFile(path.join(studio,'museum/assets/museum_layout.json')));
function region(x,y){if(Math.hypot(x,y)<layout.atrium.r-.7)return true;if(Math.abs(x)<2.2&&y< -layout.atrium.r+1&&y> -layout.atrium.r-6.3)return true;return layout.wings.some(w=>{const a=w.angle*Math.PI/180,u=x*Math.cos(a)+y*Math.sin(a),v=-x*Math.sin(a)+y*Math.cos(a);return(u>layout.atrium.r-1&&u<layout.rooms.u0+.3&&Math.abs(v)<layout.rooms.door/2-.45)||(u>layout.rooms.u0+.25&&u<layout.rooms.u1-.45&&Math.abs(v)<layout.rooms.half-.45);});}
const walkable=(x,y)=>region(x,y)&&Math.hypot(x,y)>=2.6&&!layout.exhibits.some(e=>Math.abs(x-e.pos[0])<1.05&&Math.abs(y-e.pos[1])<1.05);
const entrance={x:0,y:-13.5};
const stops=[{x:0,y:-4.2},...layout.exhibits.map(e=>{const a=e.angle*Math.PI/180;let x=e.pos[0]-Math.cos(a)*2.6,y=e.pos[1]-Math.sin(a)*2.6;if(!walkable(x,y)){x=e.pos[0]-e.panelNormal[0]*2.2;y=e.pos[1]-e.panelNormal[1]*2.2;}return {x,y};})];
let routes=0;
for(const start of [entrance,...stops])for(const end of stops){const route=findRoute(start,end,walkable,layout.rooms.u1+3);assert.ok(route.length,'No route to an exhibit');let prev=start;for(const p of route){const n=Math.ceil(Math.hypot(p.x-prev.x,p.y-prev.y)/.04);for(let i=0;i<=n;i++){const t=n?i/n:0;assert.ok(walkable(prev.x+(p.x-prev.x)*t,prev.y+(p.y-prev.y)*t),'Route crosses obstacle');}prev=p;}assert.deepEqual(route.at(-1),end);routes++;}
console.log(`Validated ${projects.length} case studies, local links, bike derivatives and ${routes} obstacle-safe museum routes.`);
