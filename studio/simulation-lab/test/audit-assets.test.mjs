import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditRegistry} from '../audit-assets.mjs';
const registry=JSON.parse(readFileSync(new URL('../../shared/procedural-assets/registry.json',import.meta.url),'utf8'));
test('real procedural registry has unique, structured entries',()=>{
 const r=auditRegistry(registry);
 assert.deepEqual(r.errors,[]);
 assert.equal(r.metrics.assets,66);
 assert.equal(r.metrics.unique_ids,66);
 assert.equal(r.metrics.assets_with_reuse,66);
 assert.equal(r.metrics.rights_status,'repository-declared-only');
});
test('duplicate assets are rejected',()=>{
 const d=structuredClone(registry);
 d.assets.push({...structuredClone(d.assets[0])});
 assert.match(auditRegistry(d).errors.join(' '),/duplicate/);
});
test('broken generator contract is rejected',()=>{
 const d=structuredClone(registry);d.assets[0].builder='not-real';
 assert.match(auditRegistry(d).errors.join(' '),/unsupported builder/);
});
test('invalid reuse target cannot be marketed as reusable',()=>{
 const d=structuredClone(registry);d.assets[0].reuse=[];
 assert.match(auditRegistry(d).errors.join(' '),/reuse targets/);
});
