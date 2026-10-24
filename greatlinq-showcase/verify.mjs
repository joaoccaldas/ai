import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const files=['index.html','app.js','model.js','styles.css','README.md','pump.svg','mark.svg'];
for(const f of files)assert.ok(existsSync(f),`Required file missing: ${f}`);
for(const f of ['app.js','model.js'])execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
const html=readFileSync('index.html','utf8'),app=readFileSync('app.js','utf8'),readme=readFileSync('README.md','utf8');
for(const id of ['welcome','guidedChoice','freeChoice','tourOptions','tourBar','tourProgress','modelMount','topnav']){
  // Elements on lazy pages (modelMount) are created in app.js.
  assert.ok((html+app).includes(id),`Missing visitor control: ${id}`);
}
for(const label of ['short','medium','long'])assert.match(app,new RegExp(`\\b${label}:\\{label:`),`Missing ${label} tour`);
for(const p of ['overview','worlds','objects','materials','concepts','connect'])assert.ok(app.includes(`'${p}'`),`Missing page ${p}`);
for(const claim of ['PROPOSED COLLABORATION','NOT INTEGRATED','Not a Greatlinq','T.2'])assert.ok((html+app+readme).includes(claim),`Missing disclaimer ${claim}`);
for(const forb of [/\.env/i,/localhost:\d+\/api/i,/127\.0\.0\.1/i,/library[\/]research\//i,/research\/spatial-2026/i,/git(hub)?\.com\/joaoccaldas\/nonamecompany/i,/supabase\.co/i,/neon\.tech/i])assert.ok(!forb.test(html+app),'Private source or endpoint leaked in visitor runtime');
const sourcePaths=[...app.matchAll(/RAW\('([^']+)','([^']+)'\)/g)].map(x=>[x[1],x[2]]);assert.ok(sourcePaths.length>=10);for(const [repo,path] of sourcePaths)assert.ok(['bellagio','konam','studio-kona','ai'].includes(repo)&&!path.includes('..'),'Unapproved asset source');
const tourTimes={};for(const name of ['short','medium','long']){const block=app.match(new RegExp(`  ${name}:\\{label:.*?stops:\\[(.*?)\\n  \\]\\}`, 's'));assert.ok(block,`Missing ${name} stops`);tourTimes[name]=[...block[1].matchAll(/,\s*(\d+)\s*,\s*'/g)].reduce((s,m)=>s+Number(m[1]),0)};
assert.deepEqual(tourTimes,{short:90,medium:180,long:420});
console.log(JSON.stringify({passed:true,files:files.length,sourceImagesAndModels:sourcePaths.length,tourDurationsSeconds:tourTimes,privacy:'no forbidden internal source references',quality:'static checks only; browser and rights approval separately required'},null,2));