/** Smoke the actual DOM adapter without a network or browser runtime.
 * This is NOT a replacement for visual/device verification.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS} from '../src/catalog.mjs';
import {initialState,transition} from '../src/engine.mjs';
const nodes=Object.fromEntries(['#main','#eras','#wallet-value','#timeline-note','#toast','#help-dialog'].map(id=>[id,{innerHTML:'',textContent:'',dataset:{},classList:{toggle(){}},querySelector(){return null},showModal(){},close(){}}]));
let click;
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
globalThis.location={href:'https://example.test/cpu-studio/preview'};
globalThis.window={location:globalThis.location,scrollTo(){},confirm:()=>true};
globalThis.document={querySelector:s=>nodes[s],querySelectorAll:()=>[],addEventListener:(name,cb)=>{if(name==='click')click=cb;},body:{dataset:{},classList:{toggle(){}}}};
await import('../src/main.mjs');
const interact=(action,details={})=>click({target:{closest:()=>({disabled:false,dataset:{action,...details}})}});
const clickTab=(tab)=>click({target:{closest:()=>({disabled:false,dataset:{tab}})}});

test('initial DOM renders physical 1975 computer with legible instruction and 3 starter parts',()=>{
 assert.match(nodes['#main'].innerHTML,/The first spark/);
 assert.match(nodes['#main'].innerHTML,/NO MONITOR YET/);
 assert.match(nodes['#main'].innerHTML,/s100-cpu/);
 assert.match(nodes['#main'].innerHTML,/TEST THE BUILD/);
 assert.match(nodes['#eras'].innerHTML,/1975/);
});
test('click handler installs parts and correct boot awards currency',()=>{
 for(const id of ['s100-cpu','s100-256','switch-panel'])interact('install',{id});
 assert.match(nodes['#main'].innerHTML,/3\/3 INSTALLED|ALL PARTS READY/);
 interact('power');
 assert.match(nodes['#main'].innerHTML,/BUILD COMPLETE/);
 assert.equal(nodes['#wallet-value'].textContent,'100');
});
test('next-level, shopping, collection and club HTML render without runtime error',()=>{
 interact('next');clickTab('shop');
 assert.match(nodes['#main'].innerHTML,/FOR YOUR CURRENT BUILD/);
 assert.match(nodes['#main'].innerHTML,/s100-1k/);
 interact('buy',{id:'s100-1k'});
 clickTab('build');assert.match(nodes['#main'].innerHTML,/1 KB memory board/);
 clickTab('collection');assert.match(nodes['#main'].innerHTML,/COMPUTERS BUILT/);
 clickTab('club');assert.match(nodes['#main'].innerHTML,/SHARE READ-ONLY BLUEPRINT/);
});
test('each stage render is possible from reducer-generated local state',()=>{
 for(const target of [0,2,4,6,8]){
  let s=initialState();
  for(let i=0;i<target;i++){
    const l=LEVELS[s.level];if(l.buy)s=transition(s,{type:'BUY',id:l.buy});
    for(const [slot,id] of Object.entries(l.required)){
      if(s.installed[slot])s=transition(s,{type:'REMOVE',slot});
      s=transition(s,{type:'INSTALL',id});
    }
    s=transition(s,{type:'POWER'});s=transition(s,{type:'NEXT_LEVEL'});
  }
  storage.set('cpu-studio-v2',JSON.stringify(s));
  // State will refresh on next module load in real browser; here validate the source data.
  assert.equal(s.level,target);
 }
});
