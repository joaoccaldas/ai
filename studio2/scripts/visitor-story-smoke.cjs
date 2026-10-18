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
   await page.locator('#search').fill('Bellagio');
   assert.equal(await page.locator('.project-card').count(),1,'Bellagio project discoverability');
   assert.match(await page.locator('.project-card').innerText(),/Bellagio/);
   await page.locator('#search').fill('Spatial Simulation Lab');
   assert.equal(await page.locator('.project-card').count(),1,'Research project discoverability');
   await page.locator('#search').fill('Canyon Museum');
   assert.match(await page.locator('.project-card .status').innerText(),/archived/);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#projectDrawer').getAttribute('aria-hidden'),'true');
   await page.close();
   // External ESM failure may be logged as a console warning, not a thrown page error.
   assert.deepEqual(errors,[]);
  }
  console.log('Studio2 visitor story checks passed at 390 and 1280 CSS px');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
