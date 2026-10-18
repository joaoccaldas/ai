#!/usr/bin/env node
/** Synthetic-time browser QA; no accelerated clock results are claimed as production dwell. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
async function main(){
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,route=>route.abort()); // prove navigation/2D fallback survives 3D import failure
  await page.clock.install({time:new Date('2026-10-18T10:00:00Z')});
  const response=await page.goto('http://127.0.0.1:4173/studio2/',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.locator('#quietDoor').waitFor({state:'attached'});
  assert.equal(await page.locator('#quietDoor').isVisible(),false);
  await page.clock.fastForward(60250);
  assert.equal(await page.locator('#quietDoor').isVisible(),false,'never interrupt before idle gate');
  await page.locator('#quickBtn').click();
  await page.locator('.project-drawer.open').waitFor();
  await page.clock.fastForward(25000);
  assert.equal(await page.locator('#quietDoor').isVisible(),false,'drawer must suppress surprise');
  await page.keyboard.press('Escape');
  await page.clock.fastForward(10300);
  assert.match(await page.locator('#quietCounter').innerText(),/opens in [1-5]/,'idle should show countdown');
  await page.mouse.move(350,250);
  assert.equal(await page.locator('#quietDoor').isVisible(),false,'mouse movement cancels countdown');
  await page.clock.fastForward(10400);
  assert.match(await page.locator('#quietCounter').innerText(),/opens in [1-5]/);
  await page.clock.fastForward(5000);
  assert.equal(await page.locator('#quietReveal').isVisible(),true);
  assert.equal(await page.locator('.quiet-door-link').getAttribute('href'),'../studio/effects/bioluminescence/');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#quietDoor').isVisible(),false,'Escape dismisses surprise');
  await page.clock.fastForward(40000);
  assert.equal(await page.locator('#quietDoor').isVisible(),false,'surprise must be one-shot');
  assert.deepEqual(errors,[]);
  await page.close();

  const reduced=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  await reduced.goto('http://127.0.0.1:4173/studio2/',{waitUntil:'domcontentloaded'});
  assert.equal(await reduced.locator('#quietDoor').count(),0,'reduced motion must opt out of automatic egg');
  await reduced.close();

  const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await touch.goto('http://127.0.0.1:4173/studio2/',{waitUntil:'domcontentloaded'});
  assert.equal(await touch.locator('#quietDoor').count(),0,'touch-only visitors do not get pointer-idle surprise');
  await touch.close();
  console.log('Quiet Door: timing, idle countdown, cancellation, busy drawer, one-shot, motion and touch checks passed');
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
