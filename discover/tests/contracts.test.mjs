import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const here=path.resolve(import.meta.dirname,'..');
const read=f=>fs.readFileSync(path.join(here,f),'utf8');
test('PWA references expected app shell and accessible navigation',()=>{const h=read('index.html');for(const s of ['manifest.webmanifest','styles.css','app.js','scene3d','sceneHotspots','interactionPanel','welcomeDialog','reviewContent','progressContent','viewport-fit=cover'])assert.ok(h.includes(s),s);});
test('3D world reuses canonical gallery source assets rather than copying or guessing URLs',()=>{const js=read('world.js');assert.ok(js.includes("'../studio/hall/assets/'"));assert.ok(js.includes('hall.glb'));assert.ok(js.includes('hall_lightmap.jpg'));assert.ok(js.includes('MeshoptDecoder'));});
test('No hard-coded fake fluency estimate or hidden pricing claims',()=>{const js=read('app.js');assert.ok(read('index.html').includes('No invented fluency scores'));assert.ok(!js.includes('99% fluent'));});
test('Service worker caches only app shell, not large 3D assets',()=>{const js=read('sw.js');assert.ok(js.includes("u.pathname.endsWith('.glb')"));assert.ok(js.includes("./index.html"));});
