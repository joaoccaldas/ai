import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, rel), 'utf8');

for (const rel of [
  'index.html', 'app.js', 'app.css', 'hero-gl.js', 'profile.json', 'catalog.json',
  'mark.svg', 'v2/lantern/index.html', 'v2/lantern/lantern.js',
  'v2/flagship/index.html', 'v2/hybrid/index.html', 'v2/hybrid/hybrid.js',
  'vendor/three@0.170.0/build/three.module.js',
  'vendor/three@0.170.0/examples/jsm/loaders/GLTFLoader.js',
  'vendor/three@0.170.0/examples/jsm/libs/draco/gltf/draco_decoder.wasm',
  'img/about/joao.png'
]) assert.ok(existsSync(join(root, rel)), `missing ${rel}`);

for (const rel of ['app.js', 'hero-gl.js', 'v2/lantern/lantern.js', 'v2/flagship/flagship.js', 'v2/hybrid/hybrid.js']) {
  execFileSync(process.execPath, ['--check', join(root, rel)], { stdio: 'inherit' });
}

const profile = JSON.parse(read('profile.json'));
assert.equal(profile.name, 'João Caldas');
assert.ok(profile.longBio && profile.longBio.length > 80, 'longBio missing');
assert.ok(profile.shortBio && profile.shortBio.includes('FP&A'), 'shortBio missing');
assert.equal(profile.portrait, 'img/about/joao.png');
assert.ok(read('index.html').includes('id="about"'));
assert.ok(read('app.js').includes("fetch('./profile.json'"));

const sources = ['index.html', 'app.js', 'hero-gl.js', 'v2/lantern/index.html', 'v2/lantern/lantern.js', 'v2/hybrid/index.html', 'v2/flagship/index.html'];
const joined = sources.map(read).join('\n');
assert.ok(!/["'(]\/greatlinq-showcase\//.test(joined), 'root-absolute /greatlinq-showcase/ remains');
assert.ok(!/["'(]\/vendor\//.test(joined), 'root-absolute /vendor/ remains');
assert.ok(!joined.includes('cdn.jsdelivr.net'), 'lantern/hybrid still depend on the jsDelivr build');
assert.ok(read('v2/lantern/index.html').includes('../../vendor/three@0.170.0/build/three.module.js'));
assert.ok(read('v2/hybrid/index.html').includes('../../vendor/three@0.170.0/examples/jsm/'));
assert.ok(read('v2/lantern/lantern.js').includes('../../vendor/three@0.170.0/examples/jsm/libs/draco/gltf/'));

const attr = /(?:href|src|poster|data-src)="([^"]+)"/g;
const missing = [];
for (const rel of ['index.html', 'v2/lantern/index.html', 'v2/flagship/index.html', 'v2/hybrid/index.html']) {
  const base = dirname(join(root, rel));
  for (const m of read(rel).matchAll(attr)) {
    let url = m[1];
    if (/^(#|https?:|mailto:|tel:|data:)/.test(url)) continue;
    url = url.split('#')[0].split('?')[0];
    if (!url || url.endsWith('/')) {
      const dir = join(base, url);
      if (!existsSync(join(dir, 'index.html'))) missing.push(`${rel} -> ${m[1]}`);
      continue;
    }
    if (!existsSync(join(base, url))) missing.push(`${rel} -> ${m[1]}`);
  }
}
assert.deepEqual(missing, [], `unresolved links:\n${missing.join('\n')}`);

const media = [
  'v2/flagship/media/world-dawn.jpg',
  'v2/flagship/media/world-film-720.mp4',
  'v2/flagship/media/world-film-1080.mp4',
  'v2/lantern/media/ondai-lantern.glb',
  'v2/lantern/media/lantern-film.mp4',
  'v2/lantern/media/lantern-lit.jpg',
  'v2/hybrid/media/ondai-ribbed-arch.glb',
  'v2/hybrid/media/ondai-ribbed-arch-baked-night.glb',
  'v2/hybrid/media/pano-night-1k.hdr',
  'v2/hybrid/media/arch-night.jpg'
];
for (const rel of media) assert.ok(statSync(join(root, rel)).size > 1000, rel);

const catalog = JSON.parse(read('catalog.json'));
const inventoryRefs = [...new Set(catalog.items.map(i => i.image).filter(img => typeof img === 'string' && img.startsWith('img/inventory/')))];
assert.ok(inventoryRefs.length >= 50, 'catalog lost its inventory image refs');
for (const rel of inventoryRefs) assert.ok(existsSync(join(root, rel)), `missing inventory still ${rel}`);

const omitted = [];
if (!existsSync(join(root, 'v2/hybrid/media/arch-film.mp4'))) omitted.push('v2/hybrid/media/arch-film.mp4');

console.log(JSON.stringify({
  passed: true,
  about: profile.name,
  longBioChars: profile.longBio.length,
  omitted
}, null, 2));
