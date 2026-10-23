import test from 'node:test';
import assert from 'node:assert/strict';
import { ERAS,LEVELS,ITEM_BY_ID,ITEMS,TRADES,DAILY_QUESTS } from '../src/catalog.mjs';
import {STATE_VERSION,initialState,transition,stateFromStorage,diagnostic,acceptsPart,requiredSlots,countInstalled,canBuy,dailyQuestFor,blueprint,encodeBlueprint,decodeBlueprint} from '../src/engine.mjs';

const doAction=(state,type,rest={})=>transition(state,{type,...rest});
function buildStage(s,withMissingPurchase=true){
  const l=LEVELS[s.level];
  if(l.buy && withMissingPurchase && !s.inventory[l.buy]) s=doAction(s,'BUY',{id:l.buy});
  for(const [slot,id] of Object.entries(l.required)){
    if(s.installed[slot])s=doAction(s,'REMOVE',{slot});
    if(!s.inventory[id] && withMissingPurchase)s=doAction(s,'BUY',{id});
    s=doAction(s,'INSTALL',{id});
    assert.equal(s.installed[slot],id,`Failed to install ${id} on level ${l.id}: ${s.lastAction}`);
  }
  return s;
}

test('five technology eras and ten strictly ascending levels',()=>{
  assert.equal(ERAS.length,5);assert.equal(LEVELS.length,10);
  assert.deepEqual(ERAS.map(x=>x.year),[1975,1981,1995,2005,2026]);
  assert.deepEqual(LEVELS.map(l=>l.id),Array.from({length:10},(_,i)=>i+1));
  assert.deepEqual(LEVELS.map(l=>l.era),[0,0,1,1,2,2,3,3,4,4]);
  for(const l of LEVELS){for(const [slot,id] of Object.entries(l.required)){assert.ok(ITEM_BY_ID[id],id);assert.equal(ITEM_BY_ID[id].slot,slot);assert.ok(ITEM_BY_ID[id].era<=l.era);}}
  assert.equal(ITEMS.length,new Set(ITEMS.map(i=>i.id)).size);
});
test('new save starts in a 1975 kit, with no registration or payment',()=>{
  const s=initialState();assert.equal(s.version,STATE_VERSION);assert.equal(s.level,0);assert.equal(s.credits,35);
  assert.deepEqual(s.installed,{});assert.equal(s.completed.length,0);
  assert.equal(s.inventory['s100-cpu'],1);assert.equal(s.inventory['s100-256'],1);assert.equal(s.inventory['switch-panel'],1);
});
test('a player can complete all ten missions with zero grinding or payments',()=>{
  let s=initialState(),levelCredits=[];
  for(let i=0;i<LEVELS.length;i++){
    assert.equal(s.level,i);
    s=buildStage(s);
    assert.equal(diagnostic(s),null);
    s=doAction(s,'POWER');
    assert.equal(s.screen,'success',`Level ${i+1}: ${s.lastAction}`);
    assert.ok(s.completed.includes(i+1));
    assert.ok(s.credits>=0);
    levelCredits.push(s.credits);
    if(i<LEVELS.length-1)s=doAction(s,'NEXT_LEVEL');
  }
  assert.equal(s.completed.length,10);assert.equal(s.unlocked,9);
  assert.ok(s.xp>900);assert.equal(s.collection.length,0);
  assert.ok(levelCredits.every(x=>x>=0));
});
test('all missions can be solved using level-provided kit and only featured shop part',()=>{
 let s=initialState();
 for(let i=0;i<LEVELS.length;i++){
   const l=LEVELS[i];
   for(const id of Object.values(l.required))if(id!==l.buy)assert.ok(s.inventory[id]>=1,`Missing provided ${id} level ${l.id}`);
   if(l.buy){assert.ok(s.credits>=ITEM_BY_ID[l.buy].price,`Player gets locked out on ${l.id}`);s=doAction(s,'BUY',{id:l.buy});}
   for(const [slot,id] of Object.entries(l.required)){
     if(s.installed[slot])s=doAction(s,'REMOVE',{slot});
     s=doAction(s,'INSTALL',{id});
   }
   s=doAction(s,'POWER');assert.equal(s.screen,'success');if(i<9)s=doAction(s,'NEXT_LEVEL');
 }
});
test('powered computers cannot install or remove any hardware',()=>{
 let s=initialState();s=doAction(s,'INSTALL',{id:'s100-cpu'});s=doAction(s,'POWER');
 const previous=s.installed.cpu;
 s=doAction(s,'REMOVE',{slot:'cpu'});assert.equal(s.installed.cpu,previous);
 s=doAction(s,'INSTALL',{id:'switch-panel'});assert.equal(s.installed.io,undefined);
});
test('missing CPU, RAM and front panel trigger meaningful specific errors',()=>{
 for(const slot of ['cpu','ram','io']){
  let s=initialState();for(const [check,id] of Object.entries(LEVELS[0].required))if(check!==slot)s=doAction(s,'INSTALL',{id});
  s=doAction(s,'POWER');assert.equal(s.screen,'error');assert.equal(s.error.slot,slot);
  assert.equal(s.error.kind,'missing');
 }
});
test('power must be turned off before repair, subsequent boot can succeed',()=>{
 let s=initialState();s=doAction(s,'POWER');s=doAction(s,'POWER');
 s=buildStage(s);s=doAction(s,'POWER');assert.equal(s.screen,'success');
});
test('DDR2 memory cannot boot in socket 939 DDR machine',()=>{
 let s=initialState();for(let i=0;i<7;i++){s=buildStage(s);s=doAction(s,'POWER');s=doAction(s,'NEXT_LEVEL');}
 assert.equal(s.level,7);assert.equal(s.installed.ram,'ddr2-512'); // preinstalled in repair mission
 assert.equal(s.inventory['ddr2-512']||0,0);
 s=doAction(s,'BUY',{id:'sata-hdd'});
 for(const [slot,id] of Object.entries(LEVELS[7].required))if(slot!=='ram')s=doAction(s,'INSTALL',{id});
 const e=diagnostic(s);assert.equal(e.kind,'incompatible');assert.equal(e.slot,'ram');assert.match(e.message,/DDR2 will not fit/);
 s=doAction(s,'POWER');assert.equal(s.screen,'error');assert.equal(s.completed.includes(8),false);
 s=doAction(s,'POWER');s=doAction(s,'REMOVE',{slot:'ram'});s=doAction(s,'INSTALL',{id:'ddr-1g'});s=doAction(s,'POWER');assert.equal(s.screen,'success');
});
test('a failed boot can never award coins or learning XP',()=>{
 let s=initialState();const cr=s.credits,xp=s.xp;
 s=doAction(s,'POWER');assert.equal(s.credits,cr);assert.equal(s.xp,xp);assert.equal(s.completed.length,0);
});
test('success reward can only be claimed once',()=>{
 let s=buildStage(initialState());s=doAction(s,'POWER');const cr=s.credits,xp=s.xp;
 s=doAction(s,'POWER');s=doAction(s,'POWER');
 assert.equal(s.credits,cr);assert.equal(s.xp,xp);
});
test('level cannot be skipped before passing the prior build',()=>{
 const s=doAction(initialState(),'NEXT_LEVEL');assert.equal(s.level,0);
});
test('purchase and sale ledger conserves game credits',()=>{
 let s=initialState();const cr=s.credits;
 s=doAction(s,'BUY',{id:'s100-1k'});assert.equal(s.credits,cr-35);
 s=doAction(s,'SELL',{id:'s100-1k'});assert.equal(s.credits,cr-35+17);
 assert.equal(s.inventory['s100-1k'],0);assert.equal(s.ledger.length,2);
});
test('shop blocks future-era items and purchases when short of cash',()=>{
 let s=initialState();assert.equal(canBuy(s,'ryzen-7600'),false);
 s=doAction(s,'BUY',{id:'ryzen-7600'});assert.equal(s.credits,35);
 s=doAction(s,'BUY',{id:'s100-1k'});assert.equal(s.credits,0);
 s=doAction(s,'BUY',{id:'s100-cpu'});assert.equal(s.credits,0);
});
test('every era visually describes correct minimum machine architecture',()=>{
 assert.equal(LEVELS[0].required.io,'switch-panel');
 assert.equal(LEVELS[2].required.storage,'floppy-525');
 assert.equal(LEVELS[4].required.storage,'ide-hdd');
 assert.equal(LEVELS[6].required.ram,'ddr-1g');
 assert.equal(LEVELS[8].required.power,'psu-650');
 assert.equal(LEVELS[8].required.video,undefined); // Integrated graphics on chosen 2026 CPU
 assert.equal(LEVELS[9].required.video,'gpu-modern');
});
test('NPC barter verifies inventory ownership and does not duplicate collectibles',()=>{
 let s=initialState();s=doAction(s,'TRADE_NPC',{id:'swap-1'});
 assert.equal(s.collection.length,0); // no spare, original kit part is on shelf though, it's a stock item!
});

test('after buying one extra kit memory board, barter transfers item once',()=>{
 let s=initialState();s=doAction(s,'BUY',{id:'s100-256'});assert.equal(s.inventory['s100-256'],2);
 s=doAction(s,'TRADE_NPC',{id:'swap-1'});
 assert.equal(s.inventory['s100-256'],1);assert.deepEqual(s.collection,['poster-kit']);
 s=doAction(s,'TRADE_NPC',{id:'swap-1'});assert.equal(s.collection.length,1);
});
test('required workbench component cannot be sold',()=>{
 let s=initialState();s=doAction(s,'SELL',{id:'s100-cpu'});assert.equal(s.inventory['s100-cpu'],1);
});
test('daily puzzle gives deterministic one-per-day reward, can retry if wrong',()=>{
 let s=initialState();const day='2026-10-23',quest=dailyQuestFor(day);
 const wrong=(quest.answer+1)%3;
 s=doAction(s,'DAILY_ANSWER',{day,answer:wrong});assert.equal(s.dailyDay,null);
 const coins=s.credits;
 s=doAction(s,'DAILY_ANSWER',{day,answer:quest.answer});assert.equal(s.dailyDay,day);assert.equal(s.credits,coins+30);
 s=doAction(s,'DAILY_ANSWER',{day,answer:quest.answer});assert.equal(s.credits,coins+30);
});
test('daily challenge can be completed on the next day, no broken streaks',()=>{
 let s=initialState();for(const day of ['2026-10-22','2026-10-24']){
   s=doAction(s,'DAILY_ANSWER',{day,answer:dailyQuestFor(day).answer});
 }
 assert.equal(s.credits,95);
});
test('save round-trips through JSON; corrupt and incompatible saves are rejected',()=>{
 let s=initialState();s=doAction(s,'INSTALL',{id:'s100-cpu'});
 assert.deepEqual(stateFromStorage(JSON.parse(JSON.stringify(s))),s);
 for(const invalid of [null,{}, {...s,version:1},{...s,level:22},{...s,credits:-9999},{...s,inventory:{evil:1}},
   {...s,installed:{cpu:'__proto__'}},{...s,completed:[2]},{...s,collection:['not-a-card']},{...s,screen:'success',powered:true}]){
   assert.deepEqual(stateFromStorage(invalid),initialState());
 }
});
test('sharing blueprints never includes coins, XP, player identity or inventory',()=>{
 let s=initialState();s=doAction(s,'INSTALL',{id:'s100-cpu'});
 const encoded=encodeBlueprint(blueprint(s));const decoded=decodeBlueprint(encoded);
 assert.deepEqual(decoded,{level:1,parts:['s100-cpu']});
 assert.doesNotMatch(atob(encoded),/credits|xp|inventory|username|password/i);
});
test('malformed, oversized, injected, or unknown blueprints are rejected',()=>{
 for(const code of ['','<script>','foo', 'X'.repeat(5000), btoa(JSON.stringify({v:1,level:1,parts:['fake-id']})),btoa(JSON.stringify({v:1,level:1,parts:['s100-cpu','8088']}))]){
   assert.equal(decodeBlueprint(code),null);
 }
});
test('unrecognized actions and prototype-pollution part IDs have no effect',()=>{
 const s=initialState();assert.equal(doAction(s,'HACK_EARN',{credits:1000}),s);
 assert.equal(doAction(s,'INSTALL',{id:'__proto__'}),s);
 assert.equal(doAction(s,'BUY',{id:'constructor'}),s);
});
test('user can see progress through completed time travel eras',()=>{
 let s=initialState();for(let i=0;i<4;i++){
   s=buildStage(s);s=doAction(s,'POWER');if(i<3)s=doAction(s,'NEXT_LEVEL');
 }
 assert.equal(s.completed.length,4);assert.equal(s.unlocked,4);assert.equal(LEVELS[s.unlocked].era,2);
});
test('reset clears rewards, credits, collections, history and state',()=>{
 let s=buildStage(initialState());s=doAction(s,'POWER');s=doAction(s,'RESET');
 assert.deepEqual(s,initialState());
});

test('larger memory on same physical interface is a valid upgrade, not a failure',()=>{
  for(const {index,older,better,slot} of [
    {index:0,older:'s100-256',better:'s100-1k',slot:'ram'},
    {index:4,older:'edo-8',better:'edo-16',slot:'ram'},
    {index:8,older:'ddr5-16',better:'ddr5-32',slot:'ram'},
  ]){
    const l=LEVELS[index];
    assert.ok(acceptsPart(l,slot,older));
    assert.ok(acceptsPart(l,slot,better));
    // Inspect a fully supplied hypothetical workbench, without bypassing engine validity.
    const s={...initialState(),level:index,installed:{...l.required,ram:better}};
    assert.equal(diagnostic(s),null,`L${l.id} should allow ${better}`);
  }
});
test('smaller memory cannot satisfy minimum capacity upgrade job',()=>{
  for(const [index,smaller] of [[1,'s100-256'],[5,'edo-8'],[9,'ddr5-16']]){
    const l=LEVELS[index];
    assert.equal(acceptsPart(l,'ram',smaller),false);
    const s={...initialState(),level:index,installed:{...l.required,ram:smaller}};
    assert.equal(diagnostic(s).slot,'ram');
  }
});
test('faulty DDR2 repair starts with a preinstalled incompatible part, and diagnoses it first',()=>{
  let s=initialState();for(let i=0;i<7;i++){s=buildStage(s);s=doAction(s,'POWER');s=doAction(s,'NEXT_LEVEL');}
  assert.equal(s.level,7);assert.equal(s.installed.ram,'ddr2-512');
  assert.equal(diagnostic(s).slot,'ram');
  assert.equal(diagnostic(s).kind,'incompatible');
  s=doAction(s,'REMOVE',{slot:'ram'});assert.equal(s.installed.ram,undefined);assert.equal(s.inventory['ddr2-512'],1);
});
test('upgrade DDR5 build does not charge for XP twice or consume extra coins',()=>{
  let s=initialState();for(let i=0;i<8;i++){s=buildStage(s);s=doAction(s,'POWER');s=doAction(s,'NEXT_LEVEL');}
  assert.equal(s.level,8);
  // Shop buys a 32 GB upgrade instead of the provided 16 GB memory.
  s=doAction(s,'BUY',{id:'ddr5-32'});
  s=doAction(s,'BUY',{id:'psu-650'});
  for(const [slot,id] of Object.entries(LEVELS[8].required))s=doAction(s,'INSTALL',{id:slot==='ram'?'ddr5-32':id});
  assert.equal(diagnostic(s),null);s=doAction(s,'POWER');assert.equal(s.screen,'success');
  const cr=s.credits,xp=s.xp;s=doAction(s,'POWER');s=doAction(s,'POWER');
  assert.equal(s.credits,cr);assert.equal(s.xp,xp);
});

test('faulty preinstalled DDR2 cannot expose the only required replacement for sale',()=>{
  let s=initialState();for(let i=0;i<7;i++){s=buildStage(s);s=doAction(s,'POWER');s=doAction(s,'NEXT_LEVEL');}
  assert.equal(s.installed.ram,'ddr2-512');
  const before=s.inventory['ddr-1g'];
  s=doAction(s,'SELL',{id:'ddr-1g'});
  assert.equal(s.inventory['ddr-1g'],before);
  assert.match(s.lastAction,/Keep the last required part/);
});
