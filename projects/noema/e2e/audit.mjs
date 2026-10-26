/**
 * Visual audit of the static NOEMA site.
 * Usage: node audit.mjs --base http://127.0.0.1:8765/site --out ../docs/audit/before --label before
 */
import { chromium } from '@playwright/test';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null).filter(Boolean));
const base = (args.base || 'http://127.0.0.1:8765/site').replace(/\/$/, '');
const outDir = path.resolve(__dirname, args.out || '../docs/audit/before');
const label = args.label || 'before';
const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];
const P0 = new Set([
  'index.html',
  'observatory.html',
  'explore.html',
  'human-meaning-atlas.html',
  'lineages.html',
  'patterns.html',
  'compare.html',
]);

function slug(file) {
  return file.replace(/\.html$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

async function listPages() {
  const site = path.resolve(__dirname, '../site');
  const names = (await readdir(site)).filter(n => n.endsWith('.html')).sort();
  return names;
}

async function auditPage(browser, file) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const responses = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 500));
  });
  page.on('pageerror', err => pageErrors.push(String(err).slice(0, 500)));
  page.on('requestfailed', req => {
    const failure = req.failure();
    failedRequests.push({ url: req.url(), error: failure?.errorText || 'failed' });
  });
  page.on('response', res => {
    if (res.status() >= 400) responses.push({ url: res.url(), status: res.status() });
  });

  const requested = `${base}/${file}`;
  let navError = null;
  try {
    await page.goto(requested, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(700);
  } catch (err) {
    navError = String(err).slice(0, 400);
  }

  const finalUrl = page.url();
  const meta = await page.evaluate(() => {
    const refresh = document.querySelector('meta[http-equiv="refresh" i]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const nav = document.querySelector('nav[aria-label], nav.home-nav, nav.nav, #appNav, header nav');
    const links = nav ? [...nav.querySelectorAll('a')].map(a => ({ text: (a.textContent || '').trim(), href: a.getAttribute('href') })) : [];
    const doc = document.documentElement;
    return {
      title: document.title,
      refresh: refresh ? refresh.getAttribute('content') : null,
      canonical: canonical ? canonical.getAttribute('href') : null,
      navLabel: nav ? nav.getAttribute('aria-label') : null,
      navLinks: links,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflowX: doc.scrollWidth - doc.clientWidth,
    };
  }).catch(err => ({ evalError: String(err) }));

  const shots = [];
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(150);
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth || 0),
        clientWidth: doc.clientWidth,
      };
    }).catch(() => ({ scrollWidth: null, clientWidth: null }));
    const overflow = metrics.scrollWidth != null ? metrics.scrollWidth - metrics.clientWidth : null;
    const name = `${slug(file)}-${vp.name}.jpg`;
    const dest = path.join(outDir, 'screenshots', name);
    await page.screenshot({ path: dest, type: 'jpeg', quality: 62, fullPage: false }).catch(err => {
      shots.push({ viewport: vp.name, error: String(err).slice(0, 200) });
    });
    shots.push({ viewport: vp.name, file: `screenshots/${name}`, overflowX: overflow, scrollWidth: metrics.scrollWidth, clientWidth: metrics.clientWidth });
    if (P0.has(file)) {
      const p0name = `${slug(file)}-${vp.name}-${label}.jpg`;
      await page.screenshot({ path: path.join(outDir, 'p0', p0name), type: 'jpeg', quality: 70, fullPage: false }).catch(() => {});
    }
  }

  // Primary nav click check at phone width, without leaving the audit context permanently.
  await page.setViewportSize({ width: 390, height: 844 });
  const navCheck = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Primary"], nav.home-nav, #appNav, header.topbar nav, nav.nav');
    if (!nav) return { present: false, links: [] };
    const links = [...nav.querySelectorAll('a')].filter(a => a.offsetParent !== null || getComputedStyle(a).display !== 'none');
    return {
      present: true,
      ariaLabel: nav.getAttribute('aria-label'),
      visibleCount: links.length,
      links: [...nav.querySelectorAll('a')].map(a => ({ text: (a.textContent || '').trim(), href: a.getAttribute('href') })),
    };
  }).catch(err => ({ error: String(err) }));

  const broken = [];
  const hrefs = new Set((navCheck.links || []).map(l => l.href).filter(Boolean));
  for (const href of hrefs) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) continue;
    const url = new URL(href, `${base}/`);
    try {
      const res = await page.request.get(url.toString(), { timeout: 15000 });
      if (res.status() >= 400) broken.push({ href, status: res.status() });
    } catch (err) {
      broken.push({ href, error: String(err).slice(0, 180) });
    }
  }

  await context.close();
  const overflows = shots.filter(s => typeof s.overflowX === 'number' && s.overflowX > 1);
  return {
    file,
    requested,
    finalUrl,
    redirected: finalUrl !== requested && !finalUrl.endsWith('/' + file),
    navError,
    title: meta.title,
    refresh: meta.refresh,
    canonical: meta.canonical,
    nav: navCheck,
    shots,
    horizontalOverflow: overflows.map(s => ({ viewport: s.viewport, overflowX: s.overflowX })),
    consoleErrors: [...new Set(consoleErrors)],
    pageErrors: [...new Set(pageErrors)],
    failedRequests: failedRequests.filter(r => !r.url.startsWith('data:')).slice(0, 30),
    httpErrors: responses.filter(r => !r.url.includes('favicon')).slice(0, 30),
    brokenNavLinks: broken,
  };
}

function mdTable(rows) {
  const header = '| Page | Redirect | Overflow | Console errors | Failed requests | Broken nav | Nav |';
  const sep = '| --- | --- | --- | --- | --- | --- | --- |';
  const lines = rows.map(r => {
    const ov = r.horizontalOverflow.length ? r.horizontalOverflow.map(o => `${o.viewport}:${o.overflowX}px`).join(', ') : 'none';
    const nav = (r.nav.links || []).map(l => l.text).filter(Boolean).join(', ') || '—';
    return `| ${r.file} | ${r.redirected ? 'yes → ' + r.finalUrl.replace(/.*\//, '') : 'no'} | ${ov} | ${r.consoleErrors.length + r.pageErrors.length} | ${r.failedRequests.length + r.httpErrors.length} | ${r.brokenNavLinks.length} | ${nav.replace(/\|/g, '/')} |`;
  });
  return [header, sep, ...lines].join('\n');
}

const pages = await listPages();
await mkdir(path.join(outDir, 'screenshots'), { recursive: true });
await mkdir(path.join(outDir, 'p0'), { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
for (const file of pages) {
  process.stderr.write(`audit ${file}\n`);
  results.push(await auditPage(browser, file));
}
await browser.close();

const report = {
  label,
  base,
  capturedAt: new Date().toISOString(),
  viewports,
  pageCount: results.length,
  pages: results,
};
await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
const summary = `# NOEMA visual audit (${label})

Captured ${report.capturedAt} from \`${base}\` at 390×844, 768×1024 and 1440×900.

Pages: ${results.length}. Pages with horizontal overflow: ${results.filter(r => r.horizontalOverflow.length).length}. Pages with console or page errors: ${results.filter(r => r.consoleErrors.length || r.pageErrors.length).length}. Pages that redirect: ${results.filter(r => r.redirected || r.refresh).length}.

${mdTable(results)}

P0 contact sheets are in \`p0/\`. Full viewport frames are in \`screenshots/\`. Machine-readable detail is \`report.json\`.
`;
await writeFile(path.join(outDir, 'SUMMARY.md'), summary);
console.log(`wrote ${results.length} pages to ${outDir}`);
