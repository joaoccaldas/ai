import { test, expect } from '@playwright/test';

const P0 = [
  'index.html',
  'observatory.html',
  'explore.html',
  'human-meaning-atlas.html',
  'lineages.html',
  'patterns.html',
  'compare.html',
];

const PRIMARY = [
  ['Home', 'index.html'],
  ['Explore', 'explore.html'],
  ['Atlas', 'human-meaning-atlas.html'],
  ['Connections', 'lineages.html'],
  ['Research', 'research.html'],
];

test('home does not meta-refresh into the observatory', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  expect(page.url()).toMatch(/\/index\.html$/);
  expect(await page.locator('meta[http-equiv="refresh"]').count()).toBe(0);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', 'index.html');
  await expect(page.locator('a.home-logo')).toHaveAttribute('href', 'index.html');
  const current = page.locator('nav[aria-label="Primary"] a[aria-current="page"]');
  await expect(current).toHaveText('Home');
  await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main');
  await expect(page.locator('h1')).toContainText('Understand what humans believe');
});

test('observatory Home returns to index and stays there', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('observatory.html', { waitUntil: 'domcontentloaded' });
  await page.locator('header.topbar nav[aria-label="Primary"] a', { hasText: 'Home' }).click();
  await page.waitForURL(/\/index\.html$/);
  await page.waitForTimeout(500);
  expect(page.url()).toMatch(/\/index\.html$/);
  await expect(page.locator('h1')).toContainText('Understand what humans believe');
});

test('primary nav targets resolve', async ({ request }) => {
  for (const [, href] of PRIMARY) {
    const res = await request.get(href);
    expect(res.status(), href).toBeLessThan(400);
  }
});

test('phone menu opens and links meet the 44px target', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('index.html');
  const nav = page.locator('#primary-nav');
  await expect(nav).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(nav).toBeVisible();
  for (const [label] of PRIMARY) {
    const link = nav.getByRole('link', { name: label, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box?.height ?? 0, label).toBeGreaterThanOrEqual(44);
  }
});

for (const file of P0) {
  test(`${file} has no horizontal overflow at 390px and no console errors`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(String(err)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(file, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth;
    });
    expect(overflow, `${file} overflow ${overflow}; ${errors.join(' | ')}`).toBeLessThanOrEqual(1);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

const LEGACY = [
  'altered-states.html',
  'belief-systems.html',
  'rituals.html',
  'cognition.html',
  'sources-v1.html',
  'automation-pulse.html',
  'religion-decomposition.html',
  'dashboard-v1.html',
  'observatory-v6.html',
  'journey.html?id=odin-seidr',
];

for (const file of LEGACY) {
  test(`${file} has no horizontal overflow at 390px and no console errors`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(String(err)));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(file, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(file.startsWith('journey') ? 1500 : 900);
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
    expect(overflow, `${file} overflow ${overflow}; ${errors.join(' | ')}`).toBeLessThanOrEqual(1);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('Odin journey shows a source locator and the seiðr gap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('journey.html?id=odin-seidr', { waitUntil: 'domcontentloaded' });
  const source = page.locator('#sources a[href="https://www.britannica.com/topic/Odin-Norse-deity"]');
  await expect(source).toBeVisible();
  await expect(page.locator('#sources')).toContainText('REFERENCE_ONLY');
  await expect(page.locator('#indexFindings')).toContainText('seiðr');
  await expect(page.locator('#timeline')).toContainText('Event date');
  await expect(page.locator('#timeline')).toContainText('broad_reference_range');
});

test('home search groups Odin into topics, traditions, and sources', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#homeQ').fill('Odin');
  const results = page.locator('#homeResults');
  await expect(results).toBeVisible();
  await expect(results).toContainText('Topics');
  await expect(results).toContainText('Traditions');
  await expect(results).toContainText('Sources');
  await expect(results.locator('a[href="journey.html?id=odin-seidr"]').first()).toBeVisible();
  await expect(results.locator('a[href*="britannica.com/topic/Odin"]')).toBeVisible();
  const box = await results.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(390);
});

test('Odin journey shows a rights-labelled reference image below the denominator', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('journey.html?id=odin-seidr', { waitUntil: 'domcontentloaded' });
  const fig = page.locator('#journeyFigure');
  await expect(fig).toBeVisible();
  await expect(fig.locator('img')).toHaveAttribute('src', /odin-gehrts-1888\.jpg/);
  await expect(fig).toContainText('Public domain');
  await expect(fig).toContainText('not evidence');
  await expect(fig).toContainText('REFERENCE_ONLY_NOT_EVIDENCE');
  const figBox = await fig.boundingBox();
  const denomBox = await page.locator('#denominator').boundingBox();
  expect(figBox.y).toBeGreaterThan(denomBox.y + denomBox.height - 1);
  await expect(page.locator('#journeyLead')).toBeVisible();
});

test('denominator leads on Explore, the Odin journey, Compare, and Connections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('explore.html', { waitUntil: 'domcontentloaded' });
  const explore = page.locator('#exploreDenom');
  await expect(explore).toBeVisible();
  await expect(explore).toContainText('not evidence');
  const exploreBox = await explore.boundingBox();
  const exploreH1 = await page.locator('h1').boundingBox();
  expect(exploreBox.y).toBeGreaterThan(exploreH1.y);
  expect(exploreBox.y).toBeLessThan(844);

  await page.goto('journey.html?id=odin-seidr', { waitUntil: 'domcontentloaded' });
  const denom = page.locator('#denominator');
  await expect(denom).toBeVisible();
  await expect(denom).toContainText('source locator');
  await expect(denom).toContainText('26');
  await expect(denom).toContainText('UNKNOWN is not false');
  await expect(page.locator('#comparison')).toBeVisible();
  const denomBox = await denom.boundingBox();
  const cmpBox = await page.locator('#comparison').boundingBox();
  expect(denomBox.y).toBeLessThan(cmpBox.y);

  await page.goto('compare.html?a=GOD-ODIN&b=GOD-THOR', { waitUntil: 'domcontentloaded' });
  const compare = page.locator('#compareDenom');
  await expect(compare).toBeVisible();
  await expect(compare).toContainText('coded dimensions');
  await expect(compare).toContainText('Unknown / uncoded is not absence');

  await page.goto('lineages.html', { waitUntil: 'domcontentloaded' });
  const conn = page.locator('#connectionDenom');
  await expect(conn).toContainText('excluded');
  await expect(conn).toContainText('sources');
  const connBox = await conn.boundingBox();
  expect(connBox.y).toBeLessThan(844);
});
