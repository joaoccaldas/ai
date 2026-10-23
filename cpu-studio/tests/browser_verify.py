"""Real Chromium mobile/desktop verification. Run with local web server on 4173."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:4173/'
OUT=ROOT/'evidence'; OUT.mkdir(exist_ok=True)

async def advance(page,goal):
    await page.evaluate('''async (goal)=>{
      const [{initialState,transition}, {LEVELS}] = await Promise.all([import('./src/engine.mjs'),import('./src/catalog.mjs')]);
      let s=initialState();
      for(let i=0;i<goal;i++){
        const l=LEVELS[s.level];
        if(l.buy)s=transition(s,{type:'BUY',id:l.buy});
        for(const id of Object.values(l.required))s=transition(s,{type:'INSTALL',id});
        s=transition(s,{type:'POWER'});
        s=transition(s,{type:'NEXT_LEVEL'});
      }
      localStorage.setItem('cpu-studio-v2',JSON.stringify(s));
    }''',goal)
    await page.reload(wait_until='networkidle')

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  reports=[]
  for width,height in [(320,740),(375,812),(390,844),(428,926),(768,1024)]:
   page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=width<=428,has_touch=width<=428)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto(BASE,wait_until='networkidle')
   await page.screenshot(path=str(OUT/f'1975-{width}.png'),full_page=True)
   dimensions=await page.evaluate('''()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,viewportHeight:innerHeight,firstPower:document.querySelector('.power-btn')?.getBoundingClientRect().bottom,sceneHeight:document.querySelector('.scene')?.getBoundingClientRect().height,visibleParts:document.querySelectorAll('.part-card').length,activeEra:document.body.dataset.era})''')
   reports.append({'size':f'{width}x{height}',**dimensions,'errors':errors})
   assert not errors,errors
   assert dimensions['scrollWidth']<=width+1,dimensions
   assert dimensions['visibleParts']==3,dimensions
   if width==390:assert dimensions['firstPower']<900,dimensions
   await page.close()
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE)
  for part in ['s100-cpu','s100-256','switch-panel']:
    await page.locator(f'button[data-action="install"][data-id="{part}"]').click()
  await page.locator('[data-action="power"]').click()
  assert 'BUILD COMPLETE' in await page.locator('#main').inner_text()
  await page.screenshot(path=str(OUT/'1975-booted.png'),full_page=True)
  await page.locator('[data-action="next"]').click()
  assert 'One kilobyte!' in await page.locator('h1').inner_text()
  await page.locator('[data-tab="shop"]').first.click()
  assert 'PARTS MARKET' in await page.locator('#main').inner_text()
  await page.locator('[data-action="buy"][data-id="s100-1k"]').first.click()
  assert (await page.locator('#wallet-value').inner_text()).isdigit()
  await page.screenshot(path=str(OUT/'store-1975.png'),full_page=True)
  await page.locator('[data-tab="build"]').first.click()
  await page.locator('button[data-action="install"][data-id="s100-cpu"]').click()
  await page.locator('button[data-action="install"][data-id="s100-1k"]').click()
  await page.locator('button[data-action="install"][data-id="switch-panel"]').click()
  await page.locator('[data-action="power"]').click()
  assert 'BUILD COMPLETE' in await page.locator('#main').inner_text()
  await page.locator('[data-tab="collection"]').first.click()
  assert '2' in await page.locator('.museum-summary').inner_text()
  await page.screenshot(path=str(OUT/'museum-2-levels.png'),full_page=True)
  await page.locator('[data-tab="club"]').first.click()
  assert 'SHARE READ-ONLY BLUEPRINT' in await page.locator('#main').inner_text()
  await page.screenshot(path=str(OUT/'club-1975.png'),full_page=True)
  # Navigate via hard-earned save state for visual checks; same reducer transition logic
  for goal,year in [(2,'1981'),(4,'1995'),(6,'2005'),(8,'2026')]:
   await advance(page,goal)
   assert year in await page.locator('.era-pill.current').inner_text()
   assert (await page.evaluate('document.documentElement.scrollWidth'))<=390
   await page.screenshot(path=str(OUT/f'{year}-workshop.png'),full_page=True)
  assert not errors,errors
  # Safe sharing token visual verify
  bp=await page.evaluate('''async()=>{const m=await import('./src/engine.mjs');return m.encodeBlueprint({v:1,level:9,parts:['ryzen-7600','ddr5-16']})}''')
  await page.goto(BASE+'?build='+bp)
  await page.locator('[data-tab="club"]').first.click()
  assert 'OPENED FRIEND' in await page.locator('#main').inner_text()
  report={'responsive':reports,'userJourney':'passed: first build, boot, stage2, store, purchase, museum, club, share import', 'themes':'1975/1981/1995/2005/2026', 'browserErrors':errors}
  (OUT/'browser-report.json').write_text(json.dumps(report,indent=2))
  print(json.dumps(report,indent=2))
  await browser.close()
asyncio.run(main())
