#!/usr/bin/env node
/** Visitor test, not a 3D GPU benchmark. Block external 3D imports to verify the 2D project experience. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  fs.mkdirSync('studio2-visitor-evidence',{recursive:true});
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https:\/\//,route=>route.abort());
   const res=await page.goto('http://127.0.0.1:4173/studio2/',{waitUntil:'domcontentloaded'});
   assert.equal(res.status(),200);
   await page.locator('#quickBtn').waitFor();
   const headline=await page.locator('.opening h1').innerText();
   assert.match(headline,/Everything/);
   assert.match(await page.locator('.lede').innerText(),/spatial experiences/);
   const research=page.locator('.research-entry');
   assert.equal(await research.getAttribute('href'),'../studio/simulation-lab/');
   assert.equal(await research.isVisible(),true);
   const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(noOverflow<=1,'Studio2 horizontal overflow at '+width+': '+noOverflow);
   await page.screenshot({path:'studio2-visitor-evidence/entry-'+width+'.png'});
   await page.locator('#quickBtn').click();
   await page.locator('.project-drawer.open').waitFor();
   assert.equal(await page.locator('#sectorFilter option').count(),11);
   assert.match(await page.locator('#sectorNote').innerText(),/not evidence of a client engagement/i);
   await page.locator('#sectorFilter').selectOption('architecture');
   assert.ok(await page.locator('.project-card').count()>=5,'Architecture includes related spatial studies and the asset factory');
   assert.match(await page.locator('.project-card').first().innerText(),/Architecture/i);
   await page.screenshot({path:'studio2-visitor-evidence/classified-architecture-'+width+'.png',fullPage:false});
   const bodySize=await page.locator('.project-card p').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
   assert.ok(bodySize>=14,'Project context needs readable 14px+ body type');
   await page.locator('#sectorFilter').selectOption('science');
   assert.ok(await page.locator('.project-card').count()>=3,'Science must be discoverable');
   await page.locator('#sectorFilter').selectOption('gaming');
   assert.ok(await page.locator('.project-card').count()>=10,'Gaming portfolio must be discoverable');
   await page.locator('#sectorFilter').selectOption('simulation');
   assert.ok(await page.locator('.project-card').count()>=3,'Simulation work must be discoverable');
   await page.locator('#sectorFilter').selectOption('all');
   await page.locator('#search').fill('Bellagio');
   assert.equal(await page.locator('.project-card').count(),1,'Bellagio project discoverability');
   assert.match(await page.locator('.project-card').innerText(),/Bellagio/);
   await page.locator('#search').fill('Spatial Simulation Lab');
   assert.equal(await page.locator('.project-card').count(),1,'Research project discoverability');
   await page.locator('#search').fill('Canyon Museum');
   assert.match(await page.locator('.project-card .status').innerText(),/archived/i);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#projectDrawer').getAttribute('aria-hidden'),'true');
   await page.close();
   // External ESM failure may be logged as a console warning, not a thrown page error.
   assert.deepEqual(errors,[]);
  }
  console.log('Studio2 visitor story checks passed at 390 and 1280 CSS px');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
