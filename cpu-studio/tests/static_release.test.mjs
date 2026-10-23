import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const html=read('index.html');

test('GitHub Pages subfolder is relocatable: all runtime links are local and relative',()=>{
 const refs=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(refs.length>=4);
 for(const ref of refs){
  assert.ok(ref.startsWith('./'),`non-local link ${ref}`);
  assert.ok(!ref.includes('..'),`link escapes application folder: ${ref}`);
  assert.ok(fs.existsSync(path.join(root,ref)),`missing artifact for ${ref}`);
 }
});
test('first-run content is rendered locally and no third-party runtime requests are needed',()=>{
 assert.match(html,/viewport-fit=cover/);
 assert.match(html,/name="description"/);
 assert.match(html,/data-tab="build"/);
 assert.match(html,/data-tab="shop"/);
 assert.match(html,/data-tab="collection"/);
 assert.match(html,/data-tab="club"/);
 assert.doesNotMatch(html,/(https:\/\/|http:\/\/)/);
 assert.match(read('src/main.mjs'),/render\(\);\s*$/);
});
test('offline manifest references existing local icon and uses standalone display',()=>{
 const manifest=JSON.parse(read('manifest.webmanifest'));
 assert.equal(manifest.display,'standalone');
 assert.ok(manifest.icons.every(i=>i.src.startsWith('./')&&fs.existsSync(path.join(root,i.src))));
 assert.equal(manifest.start_url,'./');
});
test('service worker never substitutes HTML for missing script or stylesheet',()=>{
 const sw=read('sw.js');
 assert.match(sw,/req.mode==='navigate'/);
 assert.match(sw,/return Response.error\(\)/);
 assert.match(sw,/cpu-studio-shell-v3/);
 assert.doesNotMatch(sw,/caches\.match\('\.\/index\.html'\)\)\)\);/);
});
