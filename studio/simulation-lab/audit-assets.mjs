/** Read-only evidence inventory for the existing procedural asset registry.
 * Asset provenance is a declaration, not independently cleared commercial rights.
 * Geometry generation, Blender export and visual inspection are NOT performed here.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const BUILDERS=new Set(['gen','fruit','crate','stall','basket','bread','herb','tree','person','cafe_set','bench','lamp']);
const str=x=>typeof x==='string'&&x.trim().length>0;
export function auditRegistry(doc){
 const errors=[],ids=new Set(),categories={},builders={},reuseTargets={};
 if(doc?.version!==1||!Array.isArray(doc?.assets))return {errors:['Expected version 1 and an assets array'],metrics:null};
 for(const [i,a] of doc.assets.entries()){
  const loc='assets['+i+']';
  if(!str(a?.id)||ids.has(a.id))errors.push(loc+': missing or duplicate id');
  else ids.add(a.id);
  if(!BUILDERS.has(a?.builder))errors.push(loc+': unsupported builder');
  if(!str(a?.category))errors.push(loc+': category required');
  if(!a?.params||typeof a.params!=='object'||Array.isArray(a.params))errors.push(loc+': params object required');
  if(!Array.isArray(a?.reuse)||!a.reuse.length||a.reuse.some(x=>!str(x)))errors.push(loc+': nonempty reuse targets required');
  if(a?.builder==='gen'&&(!str(a.module)||!str(a.func)||!Array.isArray(a.materials)))
   errors.push(loc+': gen requires module, func and materials');
  if(str(a?.category))categories[a.category]=(categories[a.category]||0)+1;
  if(str(a?.builder))builders[a.builder]=(builders[a.builder]||0)+1;
  if(Array.isArray(a?.reuse))for(const target of a.reuse){
    if(str(target))reuseTargets[target]=(reuseTargets[target]||0)+1;
  }
 }
 const metrics={assets:doc.assets.length,unique_ids:ids.size,
  assets_with_reuse:doc.assets.filter(x=>Array.isArray(x.reuse)&&x.reuse.length>0).length,
  categories:Object.fromEntries(Object.entries(categories).sort()),
  builders:Object.fromEntries(Object.entries(builders).sort()),
  reuse_targets:Object.fromEntries(Object.entries(reuseTargets).sort()),
  rights_status:'repository-declared-only',
  execution_status:'registry-structure-checked-no-blender-export'};
 return {errors,metrics};
}
export function main(){
 const data=JSON.parse(readFileSync(new URL('../shared/procedural-assets/registry.json',import.meta.url),'utf8'));
 const result=auditRegistry(data);
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(result.errors.length)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)main();
