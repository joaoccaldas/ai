/* ============================================================================
   static.test.js — deployment sanity, no browser required.

   The one failure this catches is the one that actually happened: shipping
   index.html without the engine it loads. It confirms the HTML entry points
   exist, that every relative import inside src/ resolves to a real file, and
   that the Pages guard (.nojekyll) is present so the /src and /assets folders
   are served verbatim.
   ========================================================================== */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };
const at = (...p) => resolve(ROOT, ...p);

/* 1 — entry points the browser asks for on first paint */
const html = readFileSync(at('index.html'), 'utf8');
for (const asset of ['assets/style.css', 'src/app.js']) {
  ok(html.includes(asset), `index.html references ${asset}`);
  ok(existsSync(at(asset)), `${asset} exists on disk`);
}
ok(existsSync(at('.nojekyll')), '.nojekyll present (Pages serves src/ and assets/ verbatim)');

/* 2 — every relative import inside src/ resolves to a real file */
const IMPORT = /(?:import|export)[^'"]*?from\s*['"](\.[^'"]+)['"]/g;
let checked = 0, missing = 0;
for (const f of readdirSync(at('src')).filter(n => n.endsWith('.js'))) {
  const body = readFileSync(at('src', f), 'utf8');
  for (const m of body.matchAll(IMPORT)) {
    checked++;
    const target = resolve(at('src'), m[1]);
    if (!existsSync(target)) { missing++; console.log(`  FAIL  src/${f} imports missing ${m[1]}`); }
  }
}
ok(missing === 0, `all ${checked} src/ imports resolve`);

/* 3 — index.html must not depend on a build step (no bare specifiers, no bundler) */
ok(!/from\s*['"][^.\/]/.test(html), 'index.html ships raw ES modules, no bundler');

console.log(fails ? `\n${fails} FAILED\n` : '\nall green\n');
process.exit(fails ? 1 : 0);
