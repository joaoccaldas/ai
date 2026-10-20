#!/usr/bin/env node
// Capture actual baseline and candidate web applications. Requires installed Playwright + Chromium.
// No performance or quality improvement is inferred from a screenshot.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const VIEWPORTS = Object.freeze([
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'desktop', width: 1440, height: 900 }
]);

export function validateUrl(value) {
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
    throw new Error('Only credential-free HTTP(S) URLs are allowed');
  return u.toString();
}

export function delta(before, after) {
  return Object.fromEntries(Object.keys(before).filter(key => typeof before[key] === 'number'
    && typeof after[key] === 'number').map(key => [key, after[key] - before[key]]));
}

async function observe(browser, uri, label, dir) {
  const shots = [];
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({viewport: {width:vp.width, height:vp.height},
      deviceScaleFactor: 1, reducedMotion: 'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const response = await page.goto(uri, {waitUntil:'domcontentloaded',timeout:45000});
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(1000);
    const stats = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowPx: Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth),
      interactiveControls: document.querySelectorAll('button,a[href],input,select,textarea').length,
      canvasCount: document.querySelectorAll('canvas').length,
      headingCount: document.querySelectorAll('h1,h2').length,
      documentHeight:document.documentElement.scrollHeight
    }));
    const file = path.join(dir, `${label}-${vp.name}.png`);
    await page.screenshot({path:file,fullPage:true,animations:'disabled'});
    const sha256 = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
    shots.push({viewport:vp.name,url:uri,status:response?.status()??null,
      metrics:stats, screenshot:file,sha256,errors});
    await context.close();
  }
  return shots;
}

export async function run({baseline,candidate,out}) {
  const { chromium } = await import('playwright');
  await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({headless:true});
  try {
    const before=await observe(browser,validateUrl(baseline),'before',out);
    const after=await observe(browser,validateUrl(candidate),'after',out);
    const report={schema:'caldas.spatial.ui-evidence/v1',capturedAt:new Date().toISOString(),
      statement:'Screenshots and layout measurements only; no perceptual, accessibility or GPU claim',
      pairs:before.map((b,i)=>({viewport:b.viewport,baseline:b,candidate:after[i],
        layoutDeltas:delta(b.metrics,after[i].metrics),
        passStructural: b.status < 400 && after[i].status < 400 &&
          b.errors.length===0 && after[i].errors.length===0 &&
          after[i].metrics.overflowPx===0}))};
    await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
    return report;
  } finally {await browser.close();}
}
if (process.argv[1] && import.meta.url === new URL('file://'+path.resolve(process.argv[1])).href) {
  const args=process.argv.slice(2);
  if (args.length!==3) {console.error('Usage: node tools/spatial-ui-audit.mjs BASELINE_URL CANDIDATE_URL OUT_DIR');process.exitCode=2;}
  else run({baseline:args[0],candidate:args[1],out:args[2]})
    .then(r=>{console.log(JSON.stringify({pairs:r.pairs.length,pass:r.pairs.every(p=>p.passStructural)}));if(!r.pairs.every(p=>p.passStructural))process.exitCode=1;})
    .catch(e=>{console.error(e);process.exitCode=2;});
}
