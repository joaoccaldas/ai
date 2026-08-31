/* Stencil — production smoke test.
   Serves the app on a throwaway static server and drives the real compositing
   engine in headless Chromium: library wiring, canvas selection, transforms,
   uploads, and PNG export. Run: node tests/smoke.mjs  (from the stencil dir). */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactsDir = process.env.STENCIL_ARTIFACTS || path.join(ROOT, 'test-artifacts');
await fsp.mkdir(artifactsDir, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// a tiny valid PNG (8x8, opaque) used for upload fixtures
const PNG_8x8 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAF0lEQVR4nGP8z8Dwn4EIwESMolGF9FEIAG2eA/9C1i0nAAAAAElFTkSuQmCC',
  'base64');
const fixture = path.join(artifactsDir, 'fixture.png');
await fsp.writeFile(fixture, PNG_8x8);

const checks = [], failures = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function run(name, fn) {
  try { await fn(); checks.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); }
  catch (e) { failures.push({ name, error: e?.stack || String(e) }); checks.push({ name, status: 'FAIL' }); console.error(`FAIL ${name}\n${e?.stack || e}`); }
}
function trackErrors(page, allow = () => false) {
  const errs = [];
  page.on('pageerror', (e) => { if (!allow(e.message)) errs.push('pageerror: ' + e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && !allow(m.text())) errs.push('console: ' + m.text()); });
  return errs;
}

const browser = await chromium.launch({ headless: true });

await run('boots, exposes accessible structure, and wires the design libraries', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  const errs = trackErrors(page, (t) => /favicon|ERR_CONNECTION_RESET|Failed to load resource/i.test(t));
  await page.goto(BASE, { waitUntil: 'networkidle' });

  assert(await page.locator('h1').count() === 1, 'exactly one h1 expected');
  assert(await page.locator('.skip-link').count() === 1, 'skip link missing');
  assert(await page.locator('#overlay[aria-hidden="true"]').count() === 1, 'overlay must be aria-hidden');

  await page.keyboard.press('Tab');
  assert(await page.locator('.skip-link').evaluate((el) => document.activeElement === el), 'skip link must be first focus');

  const flashExpected = await page.evaluate(() => window.STENCIL_FLASH.length);
  assert(await page.locator('#flashGrid .lib-cell').count() === flashExpected, 'flash grid must render every flash design');
  assert(flashExpected >= 10, 'expected a full flash set');

  await page.locator('#tab-designs').click();
  await page.locator('.lib-tab[data-lib="pack"]').click();
  const packExpected = await page.evaluate(() => (window.STENCIL_PACK || []).length);
  assert(await page.locator('#packGrid .lib-cell').count() === packExpected, 'AI pack grid must render every pack item');
  assert(packExpected >= 8, 'expected the 8-piece AI pack to be wired');
  assert(await page.locator('#skinThumbs .thumb').count() === (await page.evaluate(() => (window.STENCIL_SKINS || []).length)), 'sample skins must render');

  const safe = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')].every((a) => a.relList.contains('noopener')));
  assert(safe, 'all target=_blank links need noopener');
  assert(errs.length === 0, 'runtime errors: ' + errs.join(' | '));
  await ctx.close();
});

await run('places a design on a canvas and actually composites pixels', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  const errs = trackErrors(page, (t) => /favicon|ERR_CONNECTION_RESET|Failed to load resource/i.test(t));
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // choose a blank canvas
  await page.locator('#tab-canvas').click();
  await page.locator('#blankSwatches .swatch').first().click();
  assert(await page.locator('#stageEmpty.hide').count() === 1, 'empty prompt must hide once a canvas is chosen');

  // baseline: sum of the central region
  const centralSum = () => page.evaluate(() => {
    const c = document.querySelector('#compose');
    const s = Math.round(Math.min(c.width, c.height) * 0.3);
    const d = c.getContext('2d').getImageData((c.width - s) / 2, (c.height - s) / 2, s, s).data;
    let t = 0; for (let i = 0; i < d.length; i += 4) t += d[i] + d[i + 1] + d[i + 2];
    return t;
  });
  const before = await centralSum();

  // add a flash design (defaults to multiply so it darkens skin)
  await page.locator('#tab-designs').click();
  await page.locator('.lib-tab[data-lib="flash"]').click();
  await page.locator('#flashGrid .lib-cell').first().click();
  await page.waitForFunction(() => window.STENCIL.state.layers.length === 1);
  await page.waitForTimeout(150);   // let the rAF paint
  assert((await page.locator('#layerCount').textContent()).trim() === '1 design', 'layer count must update');

  const after = await centralSum();
  assert(before !== after, 'compositing a design must change canvas pixels');

  // adjust panel reveals once you open the Adjust tab
  await page.locator('#tab-adjust').click();
  assert(await page.locator('#adjustBody').isVisible(), 'adjust panel must reveal for the selected layer');
  await page.locator('#rotR').fill('45');
  await page.locator('#rotR').dispatchEvent('input');
  const rot = await page.evaluate(() => window.STENCIL.state.layers[0].rot);
  assert(Math.abs(rot - Math.PI / 4) < 0.02, 'rotation control must drive the layer');

  // delete
  await page.locator('#delBtn').click();
  await page.waitForFunction(() => window.STENCIL.state.layers.length === 0);
  assert((await page.locator('#layerCount').textContent()).trim() === '0 designs', 'delete must clear the layer');
  assert(errs.length === 0, 'runtime errors: ' + errs.join(' | '));
  await ctx.close();
});

await run('accepts a photo upload and an art upload, then exports a PNG', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  const errs = trackErrors(page, (t) => /favicon|ERR_CONNECTION_RESET|Failed to load resource/i.test(t));
  await page.goto(BASE, { waitUntil: 'networkidle' });

  await page.locator('#tab-canvas').click();
  await page.locator('#photoInput').setInputFiles(fixture);
  await page.waitForFunction(() => !!window.STENCIL.state.base);

  await page.locator('#tab-designs').click();
  await page.locator('#artInput').setInputFiles(fixture);
  await page.waitForFunction(() => window.STENCIL.state.layers.length === 1);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#tab-export').click().then(() => page.locator('#downloadBtn').click()),
  ]);
  assert(download.suggestedFilename() === 'stencil-tryon.png', 'export must offer stencil-tryon.png');
  assert(errs.length === 0, 'runtime errors: ' + errs.join(' | '));
  await ctx.close();
});

await run('mobile layout has no horizontal overflow', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  assert(await page.locator('.brand').isVisible(), 'brand must be visible on mobile');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 2, `horizontal overflow: ${overflow}px`);
  await page.screenshot({ path: path.join(artifactsDir, 'mobile.png'), fullPage: true });
  await ctx.close();
});

await browser.close();
server.close();
await fsp.writeFile(path.join(artifactsDir, 'results.json'), JSON.stringify({ checks, failures }, null, 2));
if (failures.length) { console.error(`\n${failures.length} Stencil check(s) failed.`); process.exit(1); }
console.log(`\nAll ${checks.length} Stencil checks passed.`);
