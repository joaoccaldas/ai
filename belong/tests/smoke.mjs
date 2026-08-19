import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.BELONG_BASE_URL || 'http://127.0.0.1:4173/belong/';
const artifactsDir = process.env.BELONG_ARTIFACTS || 'belong/test-artifacts';
await fs.mkdir(artifactsDir, { recursive: true });

const failures = [];
const checks = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run(name, fn) {
  try {
    await fn();
    checks.push({ name, status: 'PASS' });
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error: error?.stack || String(error) });
    checks.push({ name, status: 'FAIL' });
    console.error(`FAIL ${name}\n${error?.stack || error}`);
  }
}

async function waitForLoader(page, timeout = 7000) {
  await page.waitForFunction(() => document.getElementById('loader')?.classList.contains('done'), null, { timeout });
}

async function captureRuntimeErrors(page, allow = () => false) {
  const errors = [];
  page.on('pageerror', error => {
    if (!allow(error.message)) errors.push(`pageerror: ${error.message}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' && !allow(msg.text())) errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

const browser = await chromium.launch({ headless: true });

await run('desktop experience boots, navigates, and exposes accessible controls', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const runtimeErrors = await captureRuntimeErrors(page, text => /favicon|WebGL/i.test(text));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitForLoader(page);

  assert(await page.locator('h1').count() === 1, 'Expected exactly one h1');
  assert(await page.locator('h1').isVisible(), 'Hero h1 must be visible');
  assert(await page.locator('.skip-link').count() === 1, 'Skip link missing');
  assert(await page.locator('#scene[aria-hidden="true"]').count() === 1, 'Decorative canvas must be aria-hidden');

  const panelCount = await page.locator('.panel').count();
  await page.waitForFunction(() => document.querySelectorAll('#rail button.dot').length === document.querySelectorAll('.panel').length);
  assert(await page.locator('#rail button.dot').count() === panelCount, 'Rail must contain one button per panel');
  assert(await page.locator('#rail div.dot').count() === 0, 'Rail controls must not be clickable divs');

  await page.keyboard.press('Tab');
  assert(await page.locator('.skip-link').evaluate(el => document.activeElement === el), 'Skip link should be first keyboard focus target');

  const mode = page.locator('#mode');
  const beforePalette = (await page.locator('#modelabel').textContent())?.trim();
  await mode.click();
  const afterPalette = (await page.locator('#modelabel').textContent())?.trim();
  assert(beforePalette && afterPalette && beforePalette !== afterPalette, 'Palette button must change palette');
  const modeLabel = await mode.getAttribute('aria-label');
  assert(modeLabel?.includes(afterPalette), 'Palette accessible name must announce current palette');

  const sound = page.locator('#sound');
  assert(await sound.getAttribute('aria-pressed') === 'false', 'Sound must start unpressed');
  await sound.click();
  assert(await sound.getAttribute('aria-pressed') === 'true', 'Sound aria-pressed must reflect enabled state');
  await sound.click();
  assert(await sound.getAttribute('aria-pressed') === 'false', 'Sound aria-pressed must reflect disabled state');

  const externalLinksSafe = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')]
    .every(a => a.relList.contains('noopener')));
  assert(externalLinksSafe, 'All target=_blank links must include noopener');

  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  const jsonLd = JSON.parse(schema);
  assert(jsonLd['@type'] === 'CreativeWork', 'Structured data must describe the concept as CreativeWork');
  assert(!schema.includes('MusicEvent') && !schema.includes('Offer'), 'Concept page must not publish transaction/event offer schema');
  assert(!await page.locator('a[href*="api.whatsapp.com"]').count(), 'Concept page must not funnel users through a direct WhatsApp sales link');
  assert(await page.locator('a[href^="https://thebelongfestival.com"]').count() >= 1, 'Official Belong site link missing');

  // Representative reveal probes across the beginning, middle and end. Scrolling every
  // nested reveal in headless software WebGL is slow and does not model normal reading.
  for (const selector of ['#imagine .rise.d2', '#tiers .rise.d3', '#join .rise.d3']) {
    const reveal = page.locator(selector);
    await reveal.scrollIntoViewIfNeeded();
    await page.waitForTimeout(220);
    assert(await reveal.evaluate(el => el.classList.contains('in')), `${selector} did not reveal after entering the viewport`);
    assert(await reveal.isVisible(), `${selector} should be visible after reveal`);
  }

  await page.screenshot({ path: `${artifactsDir}/desktop.png`, fullPage: true });
  assert(runtimeErrors.length === 0, `Unexpected runtime errors: ${runtimeErrors.join(' | ')}`);
  await context.close();
});

await run('mobile layout stays readable without horizontal overflow', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const runtimeErrors = await captureRuntimeErrors(page, text => /favicon|WebGL/i.test(text));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitForLoader(page);
  assert(await page.locator('h1').isVisible(), 'Mobile hero must be visible');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 2, `Horizontal overflow detected: ${overflow}px`);
  assert(await page.locator('#cur-dot').isHidden(), 'Custom cursor must stay hidden on touch devices');
  await page.screenshot({ path: `${artifactsDir}/mobile.png`, fullPage: true });
  assert(runtimeErrors.length === 0, `Unexpected mobile runtime errors: ${runtimeErrors.join(' | ')}`);
  await context.close();
});

await run('module dependency failure degrades to readable HTML with native cursor', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/vendor/**', route => route.abort('failed'));
  const page = await context.newPage();
  await captureRuntimeErrors(page, text => /Failed to fetch dynamically imported module|ERR_FAILED|module/i.test(text));
  await page.goto(BASE, { waitUntil: 'load' });
  await waitForLoader(page);

  assert(await page.locator('h1').isVisible(), 'Hero must remain visible when Three.js fails to load');
  await page.locator('#imagine').scrollIntoViewIfNeeded();
  assert(await page.locator('#imagine .rise').first().isVisible(), 'Non-hero content must remain visible when module import fails');
  assert(!await page.locator('html.motion-ready').count(), 'Motion enhancement must not activate if module import fails');
  assert(!await page.locator('html.cursor-ready').count(), 'Custom cursor must not activate if module import fails');
  const nativeCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
  assert(nativeCursor !== 'none', 'Native cursor must remain available when enhancement fails');
  await context.close();
});

await run('WebGL initialization failure keeps content and controls usable', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.call(this, type, ...args);
    };
  });
  const page = await context.newPage();
  await captureRuntimeErrors(page, text => /WebGL/i.test(text));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await waitForLoader(page);
  assert(await page.locator('h1').isVisible(), 'Hero must survive WebGL failure');
  await page.locator('#details').scrollIntoViewIfNeeded();
  assert(await page.locator('#details h2').isVisible(), 'Content must survive WebGL failure');
  assert(await page.locator('#scene').evaluate(el => getComputedStyle(el).display === 'none'), 'Failed WebGL canvas should be removed from rendering');
  assert(await page.locator('#mode').isVisible(), 'Palette control should remain usable without WebGL');
  await context.close();
});

await run('reduced-motion mode is static, readable, and does not run a perpetual RAF loop', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    let count = 0;
    window.__belongRafCount = () => count;
    window.requestAnimationFrame = callback => original(ts => { count += 1; callback(ts); });
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Headless CI uses software WebGL; first shader compilation can block the main
  // thread far longer than a real GPU. The product loader still has its own bounded
  // escape path, so allow the renderer to finish compiling before asserting state.
  await waitForLoader(page, 20000);
  assert(await page.locator('body.reduce').count() === 1, 'Reduced-motion class missing');
  assert(!await page.locator('html.motion-ready').count(), 'Reveal motion should not activate under reduced motion');
  assert(!await page.locator('html.cursor-ready').count(), 'Animated custom cursor should not activate under reduced motion');
  await page.locator('#love').scrollIntoViewIfNeeded();
  assert(await page.locator('#love h2').isVisible(), 'Reduced-motion content must remain visible');
  const first = await page.evaluate(() => window.__belongRafCount());
  await page.waitForTimeout(600);
  const second = await page.evaluate(() => window.__belongRafCount());
  assert(second - first <= 2, `Reduced-motion mode appears to have a perpetual RAF loop (${second - first} frames in 600ms)`);
  await context.close();
});

await browser.close();
await fs.writeFile(`${artifactsDir}/results.json`, JSON.stringify({ checks, failures }, null, 2));

if (failures.length) {
  console.error(`\n${failures.length} Belong production check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} Belong production checks passed.`);
