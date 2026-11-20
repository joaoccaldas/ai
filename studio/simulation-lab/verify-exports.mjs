#!/usr/bin/env node
/** Validate actual Blender-generated GLB outputs; never assume registry records imply working geometry. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const [dir,...ids]=process.argv.slice(2);
if(!dir||!ids.length)throw Error('usage: node verify-exports.mjs <output-dir> <expected-id>...');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'exported_manifest.json'),'utf8'));
assert.ok(Array.isArray(manifest.assets),'exported_manifest.json must contain assets');
assert.equal(manifest.assets.length,ids.length);
const rows=[];
for(const id of ids){
 const entry=manifest.assets.find(x=>x.id===id);
 assert.ok(entry,'missing export manifest entry '+id);
 const file=path.join(dir,id+'.glb'),metaFile=path.join(dir,id+'.build-meta.json');
 const bytes=fs.readFileSync(file),meta=JSON.parse(fs.readFileSync(metaFile,'utf8'));
 assert.equal(bytes.toString('ascii',0,4),'glTF','GLB magic');
 assert.ok(bytes.readUInt32LE(8)===bytes.length,'GLB declared byte length');
 const hash=createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash,entry.sha256);assert.equal(hash,meta.sha256);
 assert.equal(bytes.length,entry.bytes);assert.equal(bytes.length,meta.bytes);
 assert.equal(meta.units,'metres');assert.equal(meta.up_axis_gltf,'Y');
 assert.ok(Number.isInteger(meta.triangles)&&meta.triangles>0,'triangle count');
 assert.ok(Array.isArray(meta.bbox_m)&&meta.bbox_m.length===2);
 for(let i=0;i<3;i++){
   assert.ok(Number.isFinite(meta.bbox_m[0][i])&&Number.isFinite(meta.bbox_m[1][i]));
   assert.ok(meta.bbox_m[0][i]<=meta.bbox_m[1][i],'bbox ordered');
 }
 const dimensions=meta.bbox_m[1].map((v,i)=>v-meta.bbox_m[0][i]);
 assert.ok(dimensions.some(x=>x>0),'nondegenerate geometry');
 rows.push({id,bytes:bytes.length,triangles:meta.triangles,bounds_m:meta.bbox_m,sha256:hash,
   evidence:'actual-blender-export',review:'geometry-integrity-only'});
}
console.log(JSON.stringify({exports_checked:rows.length,rows,limitations:[
 'No visual/art-direction validation','No cross-engine material parity','No mobile/VR frame-time data',
 'Provenance is declared in source, not independently rights-cleared'
]},null,2));
