#!/usr/bin/env node
// Run after serving repository root on http://127.0.0.1:4173.
// Intended for Playwright CI, not a measurement of 3D GPU/VR performance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];fs.mkdirSync('spatial-lab-evidence',{recursive:true});
 try {
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:820},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push(width+': '+e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(width+': '+m.text())});
   const response=await page.goto('http://127.0.0.1:4173/studio/simulation-lab/',{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   await page.locator('.card').first().waitFor({timeout:15000});
   assert.equal(await page.locator('.card').count(),6);
   const duplicateIds=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    return ids.filter((id,i)=>ids.indexOf(id)!==i);
   });
   assert.deepEqual(duplicateIds,[],'Duplicate DOM IDs break evidence controls');
   assert.equal(await page.locator('.story-card').count(),3,'source-to-value story');
   assert.equal(await page.locator('.market-grid > div').count(),3,'industry scenarios');

   assert.equal(await page.locator('#total').innerText(),'6');
   assert.equal(await page.locator('#measured').innerText(),'0');
   assert.equal(await page.locator('#independent').innerText(),'0');
   assert.equal(await page.locator('#comparisons').innerText(),'0');
   await page.locator('.card details').first().locator('summary').click();
   assert.match(await page.locator('.card details').first().innerText(),/Not measured/);
   const overflow=await page.evaluate(()=>({delta:document.documentElement.scrollWidth-document.documentElement.clientWidth,offenders:[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1).slice(0,10).map(e=>({tag:e.tagName,cls:e.className,right:Math.round(e.getBoundingClientRect().right),scroll:e.scrollWidth,client:e.clientWidth}))}));
   await page.screenshot({path:'spatial-lab-evidence/dashboard-'+width+'.png',fullPage:true});
   assert.ok(overflow.delta<=1,'horizontal overflow '+width+'px '+JSON.stringify(overflow));
   await page.locator('#filter').selectOption('rendering');
   assert.equal(await page.locator('.card').count(),1);
   await page.locator('#filter').selectOption('all');
   assert.equal(await page.locator('.card').count(),6);
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('Spatial Lab browser checks passed: 390/1280 px, filter, evidence state, no JS errors, no overflow');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
