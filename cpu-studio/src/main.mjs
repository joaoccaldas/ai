import {ERAS,ITEMS,ITEM_BY_ID,LEVELS,COLLECTIBLES,TRADES,SLOT_LABELS,DAILY_QUESTS} from './catalog.mjs';
import {initialState,stateFromStorage,transition,diagnostic,requiredSlots,countInstalled,owned,levelAt,dailyQuestFor,blueprint,encodeBlueprint,decodeBlueprint,spareCount,acceptsPart} from './engine.mjs';

const SAVE_KEY='cpu-studio-v2';
let state;
try{state=stateFromStorage(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{state=initialState();}
let tab='build';
let toastText='';
let selectedInfo=null;
let blueLink=decodeBlueprint(new URL(location.href).searchParams.get('build'));
const el={main:document.querySelector('#main'),eras:document.querySelector('#eras'),wallet:document.querySelector('#wallet-value'),timeline:document.querySelector('#timeline-note'),toast:document.querySelector('#toast'),help:document.querySelector('#help-dialog')};

const h=(s)=>String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eraOf=(l)=>ERAS[LEVELS[l].era];
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function icon(slot){
 const shapes={
   cpu:'<rect x="12" y="12" width="36" height="36" rx="3"/><rect x="22" y="22" width="16" height="16"/><path d="M6 22h6M6 32h6M6 42h6M48 22h6M48 32h6M48 42h6M22 6v6M32 6v6M42 6v6M22 48v6M32 48v6M42 48v6"/>',
   ram:'<rect x="6" y="19" width="52" height="24" rx="2"/><path d="M12 43v7M20 43v7M28 43v7M36 43v7M44 43v7M52 43v7"/><rect x="12" y="24" width="9" height="13"/><rect x="27" y="24" width="9" height="13"/><rect x="42" y="24" width="9" height="13"/>',
   io:'<rect x="6" y="16" width="52" height="30" rx="2"/><circle cx="17" cy="25" r="3"/><circle cx="29" cy="25" r="3"/><circle cx="41" cy="25" r="3"/><path d="M14 36h7m7 0h7m7 0h7"/>',
   storage:'<path d="M11 6h34l7 7v45H11z"/><rect x="19" y="8" width="25" height="24"/><rect x="18" y="40" width="28" height="11"/><path d="M26 12v16h12V12"/>',
   video:'<path d="M7 11h50v31H7zM16 46h32M32 42v7M19 53h26"/><path d="M14 18h36v18H14z"/>',
   audio:'<path d="M13 27h10l13-12v35L23 37H13z"/><path d="M43 22c10 9 10 15 0 24M48 15c15 14 15 24 0 38"/>',
   network:'<path d="M9 18h46v22H9zM20 18v14h24V18M32 40v11M17 51h30"/>',
   cooler:'<circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="5"/><path d="M32 27c-12-24 10-22 5-5M37 32c24-12 22 10 5 5M32 37c12 24-10 22-5 5M27 32c-24 12-22-10-5-5"/>',
   power:'<rect x="11" y="13" width="42" height="38" rx="3"/><circle cx="32" cy="32" r="13"/><path d="M32 20v12M27 27a8 8 0 1 0 10 0"/>',
 };
 return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="round" fill="none">${shapes[slot]||shapes.cpu}</svg>`;
}
function persist(action){
 const prev=state;
 state=transition(state,action);
 if(state!==prev){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{};toastText=state.lastAction;}
 render();
}
function renderTimeline(){
 el.timeline.textContent=`${String(state.level+1).padStart(2,'0')} / ${LEVELS.length} MISSIONS`;
 el.eras.innerHTML=ERAS.map((era,i)=>{
   const first=LEVELS.findIndex(l=>l.era===i);const opened=first<=state.unlocked;
   const active=LEVELS[state.level].era===i;
   return `<div class="era-pill ${active?'current':''} ${opened?'opened':'locked'}" title="${h(era.name)}" aria-label="${h(era.year+' '+era.name+(opened?' available':' locked'))}"><span>${opened?'◈':'◇'}</span><b>${era.year}</b><small>${h(era.name)}</small></div>`;
 }).join('');
 const current=el.eras.querySelector('.current');if(current && !el.eras.dataset.year){current.scrollIntoView({block:'nearest',inline:'center'});el.eras.dataset.year=String(LEVELS[state.level].era);}
 if(el.eras.dataset.year!==String(LEVELS[state.level].era)){
   el.eras.dataset.year=String(LEVELS[state.level].era);current?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
 }
}
function renderScene(){
 const l=levelAt(state),era=ERAS[l.era];
 const total=Object.keys(l.required).length,filled=countInstalled(state);
 const wrong=diagnostic(state);
 let lines=[];
 if(state.screen==='error') lines=[l.era===0?'DIAGNOSTIC LIGHTS':'SYSTEM ERROR',`> ${SLOT_LABELS[wrong?.slot]||'PART'} ERROR`,'POWER OFF · REPAIR'];
 else if(state.screen==='success') lines=l.era===0?['● ● ● ○ ● ● ● ○','PROGRAM RUNNING','OUTPUT: 00101101']:l.era===1?['CPU STUDIO BIOS','MEMORY TEST ... OK','A:\> HELLO WORLD']:l.era===2?['STARTING DESKTOP...','SOUND + DISPLAY OK','HELLO, 1995!']:l.era===3?['LAN LINK ... READY','GRAPHICS ... READY','GAME LOADED ✓']:['CPU · RAM · SSD ✓','THERMALS NORMAL','WORKSTATION READY'];
 else lines=l.era===0?['○ ○ ○ ○ ○ ○ ○ ○','TOGGLE SWITCHES','AWAITING PROGRAM']:l.era===1?['CPU STUDIO // 1981',`${filled}/${total} PARTS READY`,'A:\> _']:l.era===2?['WELCOME TO 1995',`${filled} OF ${total} READY`,'CLICK TO INSTALL']:l.era===3?['PC WORKSHOP // 2005',`${filled}/${total} PARTS INSTALLED`,'AWAITING BOOT']:['SYSTEM BUILDER // 2026',`${filled}/${total} MODULES READY`,'READY FOR POWER'];
 const screenLines=lines.map(x=>`<span>${h(x)}</span>`).join('');
 if(l.era===0)return `<div class="scene scene-${era.theme}">
  <div class="scene-room"><span class="scene-year">${era.year} <b>LAB.01</b></span><span class="scene-spot">● ${h(era.location)}</span></div>
  <div class="panel-shadow"></div><div class="kit-box" aria-label="1975 computer kit with physical lamps and toggle switches">
   <div class="kit-top"><span>CPU / KIT 8800</span><span>POWER ${state.powered?'●':'○'}</span></div>
   <div class="led-banks">${Array.from({length:16},(_,i)=>`<i class="kit-led ${state.screen==='success'?(i%3!==1?'on':''):(state.powered&&i%4===0?'on':'')}"></i>`).join('')}</div>
   <div class="panel-switches">${Array.from({length:12},(_,i)=>`<i class="kit-switch ${i%3===1?'up':''}"></i>`).join('')}</div>
   <div class="kit-info"><span>ADDRESS</span><span>DATA</span><span>RUN / RESET</span></div>
  </div><div class="scene-caption"><div class="mini-terminal" aria-label="Kit diagnostic readout">${screenLines}</div><span>NO MONITOR YET.<br>JUST SWITCHES & LIGHTS.</span></div>
 </div>`;
 return `<div class="scene scene-${era.theme}">
   <div class="scene-room"><span class="scene-year">${era.year} <b>${h(era.theme.toUpperCase())}</b></span><span class="scene-spot">● ${h(era.location)}</span></div>
   <div class="computer-body">
    <div class="display-outer"><div class="display-bezel"><div class="display-screen ${state.screen==='error'?'screen-error':''} ${state.screen==='success'?'screen-booted':''}">${l.era===2?'<div class="fake-titlebar"><span>◩ &nbsp; My Computer</span><span>_ ▢ ×</span></div>':''}<div class="terminal-lines">${screenLines}</div></div></div><div class="screen-logo">CST / ${era.year} <span>◯ ◯</span></div></div>
    <div class="monitor-neck"></div><div class="monitor-foot"></div>
    <div class="pc-chassis"><div class="drive-line"></div><span>${l.era===4?'POWERED BY IDEAS':'PERSONAL COMPUTER'}</span><div class="pc-led ${state.powered?'lit':''}"></div></div>
   </div><div class="scene-caption scene-bottom">${h(era.technology)} <span>${filled}/${total} CONNECTED</span></div>
 </div>`;
}
function statusMarkup(){
  const l=levelAt(state),n=countInstalled(state),target=Object.keys(l.required).length,err=diagnostic(state),done=state.completed.includes(l.id);
  const partToBuy=Object.values(l.required).find(id=>!Object.values(state.installed).includes(id)&&!owned(state,id));
  if(state.screen==='error')return `<div class="status-message error-message"><span class="status-icon">!</span><div><b>${h(err?.kind==='missing'?'PART MISSING':'WRONG COMPONENT')}</b><p>${h(err?.message||'Power off to diagnose.')}</p></div></div>`;
  if(state.screen==='success'&&done)return `<div class="success-banner"><span>★</span><div><b>BUILD COMPLETE · ${l.card.toUpperCase()}</b><p>${state.lastAction==='Machine booted again.'?'Already completed · no duplicate rewards':`+${l.reward} CREDITS · +${l.xp} XP (first completion)`}</p></div></div>`;
  if(l.id===8&&state.installed.ram==='ddr2-512')return `<div class="status-message error-message"><span class="status-icon">!</span><div><b>REPAIR JOB: WRONG MEMORY</b><p>The red RAM slot contains DDR2. You can test first, then power off and remove it to install DDR.</p></div></div>`;
  return `<div class="status-message"><span class="status-icon">${n===target?'✓':'↳'}</span><div><b>${n===target?'ALL PARTS READY':'YOUR BUILD · '+n+'/'+target+' INSTALLED'}</b><p>${partToBuy?'You need one more part. Find it in the shop.':'Tap an available item to install it, then switch on the machine.'}</p></div>${partToBuy?`<button class="mini-link" type="button" data-tab="shop">SHOP ↗</button>`:''}</div>`;
}
function renderParts(){
 const l=levelAt(state),slots=Object.keys(l.required);
 const installed=slots.map(slot=>{
   const id=state.installed[slot],item=ITEM_BY_ID[id];const wrong=id&&!acceptsPart(l,slot,id);
   return `<button type="button" class="slot ${id?'placed':''} ${wrong?'invalid':''}" data-action="remove" data-slot="${slot}" ${!id?'disabled':''} aria-label="${id?'Remove '+item.name:'Empty '+SLOT_LABELS[slot]}"><span class="slot-dot">${!id?'+':wrong?'!':'✓'}</span><span>${h(SLOT_LABELS[slot])}</span><small>${h(item?.name||'EMPTY')}</small></button>`;
 }).join('');
 const stock=ITEMS.filter(i=>owned(state,i.id)>0).sort((a,b)=>{
   const aRelevant=slots.includes(a.slot)?(acceptsPart(l,a.slot,a.id)?0:1):2;
   const bRelevant=slots.includes(b.slot)?(acceptsPart(l,b.slot,b.id)?0:1):2;
   return aRelevant-bRelevant || a.era-b.era;
 });
 return `<section class="builder-panel"><div class="section-heading"><span>01 / YOUR COMPUTER</span><small>${countInstalled(state)}/${slots.length} CONNECTED</small></div><div class="slot-grid">${installed}</div>
 <div class="section-heading inventory-label"><span>02 / PARTS ON YOUR DESK</span><button class="quiet-link" data-tab="shop">SHOP +</button></div>
 <div class="parts-grid">${stock.map(i=>{
   const filled=Boolean(state.installed[i.slot]);const wrong=slots.includes(i.slot)&&!acceptsPart(l,i.slot,i.id);
   return `<button type="button" class="part-card ${wrong?'part-warning':''}" data-action="install" data-id="${i.id}" ${filled||state.powered?'disabled':''}>
    <span class="card-graphic">${icon(i.slot)}</span><span class="part-description"><b>${h(i.name)}</b><small>${h(i.spec)}</small><span class="part-action">${filled?'SLOT OCCUPIED':wrong?'TRY IT? +':'+ INSTALL'} <em>×${owned(state,i.id)}</em></span></span></button>`;
 }).join('') || '<div class="empty-state">YOUR DESK IS EMPTY. Visit the shop for components.</div>'}</div></section>`;
}
function renderBuild(){const l=levelAt(state),era=ERAS[l.era];const completed=state.completed.includes(l.id);
 return `<section class="mission-intro"><div class="mission-label"><span class="live-led"></span> MISSION ${String(l.id).padStart(2,'0')} / ${LEVELS.length} <span>● ${h(era.name)}</span></div><div class="intro-line"><h1>${h(l.title)}<span class="title-period">.</span></h1><div class="level-badge"><small>LEVEL</small><strong>${String(l.id).padStart(2,'0')}</strong></div></div><p class="mission-detail">${h(l.goal)}</p>${l.id===1?'<div class="starter-hint">START HERE: TAP A PART BELOW, THEN PRESS POWER.</div>':''}</section>
 ${renderScene()}${statusMarkup()}${renderParts()}
 <section class="build-actions"><button type="button" data-action="power" class="power-btn ${state.powered?'powered':''}"><span class="power-mark">⏻</span><b>${state.powered?'POWER OFF':completed?'BOOT AGAIN':'TEST THE BUILD'}</b><span>→</span></button>
 ${completed&&l.id<LEVELS.length?`<button type="button" data-action="next" class="next-btn">${l.id%2===0?'UNLOCK THE '+ERAS[LEVELS[l.id].era].year+' ERA':'NEXT MISSION'} <span>→</span></button>`:''}
 ${completed&&l.id===LEVELS.length?'<div class="all-done">✦ YOU BUILT THROUGH TIME. Explore the museum and keep collecting.</div>':''}
 </section><details class="learn-note" ${state.screen==='error'||state.screen==='success'?'open':''}><summary>THE REAL SCIENCE <span>↗</span></summary><p>${h(l.lesson)}</p><small>${h(l.fact)}</small><p class="science-boundary">Educational simulation, not a cycle-accurate machine emulator. Motherboard and case infrastructure are provided by the workshop; later missions expose their power and cooling.</p></details>`;
}
function renderShop(){
 const l=levelAt(state),eraIndex=l.era;
 const wanted=new Set(Object.values(l.required));
 const products=ITEMS.filter(i=>i.era<=eraIndex).sort((a,b)=>Number(wanted.has(b.id))-Number(wanted.has(a.id)) || b.era-a.era);
 const target=products.filter(i=>wanted.has(i.id)&&!Object.values(state.installed).includes(i.id)&&!owned(state,i.id));
 return `<section class="page-heading"><div class="kicker">THE PARTS MARKET · ${ERAS[eraIndex].year}</div><h1>Parts &<br/><em>upgrades.</em></h1><p>Buy exactly what you need. No mystery boxes, no real-money purchases.</p></section>
 ${target.length?`<section class="market-feature"><span>FOR YOUR CURRENT BUILD</span><div>${target.map(i=>`<button class="featured-item" data-action="buy" data-id="${i.id}">${icon(i.slot)}<span><b>${h(i.name)}</b><small>${h(i.spec)}</small></span><strong>◈ ${i.price} →</strong></button>`).join('')}</div></section>`:''}
 <div class="section-heading"><span>IN THE CATALOG · ${products.length} PARTS</span><span>YOUR WALLET: ◈ ${state.credits}</span></div><div class="shop-grid">${products.map(i=>{
 const affordable=state.credits>=i.price;
 return `<div class="shop-card ${wanted.has(i.id)?'recommended':''}"><div class="shop-card-top"><span class="shop-icon">${icon(i.slot)}</span><span class="shop-era">${ERAS[i.era].year}</span></div><b>${h(i.name)}</b><p>${h(i.spec)}</p><button type="button" data-action="buy" data-id="${i.id}" ${!affordable?'disabled':''}>${affordable?'BUY · ◈ '+i.price:'NEED ◈ '+i.price}</button><small class="shop-owned">ON BENCH ${Number(Object.values(state.installed).includes(i.id))} · SPARE ${owned(state,i.id)} ${i.decoy?'· INCOMPATIBLE WITH SOCKET 939':''}</small></div>`;
 }).join('')}</div><p class="shop-note">Shop values are fictional game credits, not historical prices. You can sell a spare part in MUSEUM for half its listed price.</p>`;
}
function renderMuseum(){
 const collected=state.completed.length;
 const items=ITEMS.filter(i=>owned(state,i.id)>0);
 return `<section class="page-heading"><div class="kicker">THE COMPUTER MUSEUM</div><h1>Built through<br/><em>time.</em></h1><p>Every finished machine is a permanent achievement. Collect the history of computing.</p></section>
 <div class="museum-summary"><div><b>${collected}<small>/ 10</small></b><span>COMPUTERS BUILT</span></div><div><b>${state.collection.length}<small>/ ${COLLECTIBLES.length}</small></b><span>ARTIFACTS COLLECTED</span></div><div><b>${state.xp}</b><span>LEARNING XP</span></div></div>
 <div class="section-heading"><span>YOUR MACHINES</span><span>1975 → 2026</span></div><div class="museum-grid">${LEVELS.map(l=>{
 const earned=state.completed.includes(l.id);const era=ERAS[l.era];
 return `<div class="museum-card ${earned?'earned':'pending'}" data-era-label="${era.theme}"><div class="museum-image"><span class="museum-symbol">${earned?era.icon:'◇'}</span><span class="museum-year">${era.year}</span></div><small>NO. ${String(l.id).padStart(2,'0')} ${earned?'✓ COMPLETE':'LOCKED'}</small><b>${h(l.card)}</b><span>${h(l.title)}</span></div>`;
 }).join('')}</div>
 <div class="section-heading museum-second"><span>COLLECTOR'S SHELF</span><small>SWAP AT THE CLUB</small></div><div class="artifact-row">${COLLECTIBLES.map(a=>`<div class="artifact ${state.collection.includes(a.id)?'got':'unknown'}"><span>✧</span><b>${state.collection.includes(a.id)?h(a.name):'UNKNOWN ARTIFACT'}</b><small>${a.year} · ${state.collection.includes(a.id)?a.rarity:'NOT COLLECTED'}</small></div>`).join('')}</div>
 <div class="section-heading museum-second"><span>YOUR SPARE PARTS</span></div><div class="spares">${items.map(i=>`<div class="spare-row"><span>${icon(i.slot)} <b>${h(i.name)}</b><small>× ${owned(state,i.id)}</small></span><button type="button" data-action="sell" data-id="${i.id}" ${spareCount(state,i.id)<1?'disabled':''}>SELL · ◈ ${Math.floor(i.price*.5)}</button></div>`).join('')||'<p class="muted">No spares yet. Your used parts are installed in the current project.</p>'}</div>`;
}
function renderClub(){
 const day=today();const quest=dailyQuestFor(day);const done=state.dailyDay===day;
 return `<section class="page-heading"><div class="kicker">THE MAKERS CLUB · EXPERIMENTAL</div><h1>Better<br/><em>together.</em></h1><p>Show a friend what you built. Swap rare artifacts with fictional collectors. No chat, accounts or strangers required.</p></section>
 <section class="quest-card"><div class="section-heading"><span>TODAY'S ENGINEERING PUZZLE</span><span>+30 ◈ / +25 XP</span></div>${done?'<div class="quest-complete">✓ ALL DONE FOR TODAY. NEW PUZZLE TOMORROW.</div>':`<h2>${h(quest.question)}</h2><div class="answer-grid">${quest.options.map((opt,i)=>`<button type="button" data-action="answer" data-answer="${i}">${String.fromCharCode(65+i)}. ${h(opt)}</button>`).join('')}</div>`}<p class="muted">Optional, no streak penalty. Daily rewards are capped to one per local calendar day.</p></section>
 <section class="social-card"><div class="section-heading"><span>SHARE A BLUEPRINT</span><span>FRIENDS ONLY</span></div><div class="blueprint-graphic"><span>▧</span><div><small>CURRENT BUILD · ${ERAS[LEVELS[state.level].era].year}</small><b>${h(levelAt(state).title)}</b><small>${Object.keys(state.installed).length} components in the blueprint</small></div></div><button type="button" class="share-btn" data-action="share">↗ SHARE READ-ONLY BLUEPRINT</button><p>Friends can inspect your computer configuration. Links contain no username, inventory, balance or personal details.</p>
 ${blueLink?`<div class="imported-blueprint"><small>OPENED FRIEND'S BLUEPRINT</small><b>${h(LEVELS[blueLink.level-1].title)}</b><p>${blueLink.parts.map(id=>h(ITEM_BY_ID[id].name)).join(' · ')||'Empty computer'}</p><span>VIEW-ONLY · NO INVENTORY TRANSFER</span></div>`:''}</section>
 <div class="section-heading trade-heading"><span>THE TRADING CORNER</span><small>NPC BARTER DEMO</small></div><div class="trades">${TRADES.filter(t=>t.era<=LEVELS[state.level].era).map(t=>{
 const have=spareCount(state,t.give)>0,hasCollectible=state.collection.includes(t.receive);
 const reward=COLLECTIBLES.find(c=>c.id===t.receive);
 return `<article class="trade-card"><div class="trade-person">◈</div><div class="trade-content"><b>${h(t.title)}</b><p>${h(t.description)}</p><div class="trade-swap"><span>GIVE: ${h(ITEM_BY_ID[t.give].name)}</span><span>GET: ${h(reward.name)}</span></div><button type="button" data-action="trade" data-id="${t.id}" ${!have||hasCollectible?'disabled':''}>${hasCollectible?'ALREADY COLLECTED':have?'CONFIRM FAIR SWAP':'NEED SPARE ITEM'}</button></div></article>`;
 }).join('')}</div>
 <div class="social-boundary"><b>PLAYER TRADING IS NOT LIVE.</b><p>Real player-to-player swaps require accounts, age-appropriate protections, server-verified ownership, atomic item transfers, reporting and anti-fraud controls. This prototype demonstrates the economy safely without pretending local trades are multiplayer.</p></div>`;
}
function render(){
 const era=eraOf(state.level);document.body.dataset.era=era.theme;document.body.classList.toggle('on-build',tab==='build');
 el.wallet.textContent=String(state.credits);
 renderTimeline();
 el.main.innerHTML=({build:renderBuild,shop:renderShop,collection:renderMuseum,club:renderClub}[tab])();
 for(const node of document.querySelectorAll('[data-tab]')){
   const active=node.dataset.tab===tab;node.classList.toggle('active',active);
   if(node.classList.contains('tab')){if(active)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');}
 }
 el.toast.textContent=toastText;
 el.toast.classList.toggle('has-text',!!toastText);
}
function switchTab(next){if(!['build','shop','collection','club'].includes(next))return;tab=next;toastText='';render();window.scrollTo({top:0,behavior:'instant'});}
async function share(){
 const url=new URL(window.location.href);url.search='';url.searchParams.set('build',encodeBlueprint(blueprint(state)));url.hash='';
 const message=`I built ${levelAt(state).title} in CPU Studio. Here's my read-only blueprint:`;
 try{
   if(navigator.share){await navigator.share({title:'CPU Studio blueprint',text:message,url:url.toString()});return;}
   if(navigator.clipboard){await navigator.clipboard.writeText(`${message} ${url.toString()}`);toastText='BLUEPRINT LINK COPIED. Send it to a friend.';render();return;}
 }catch(e){if(e?.name==='AbortError')return;}
 // Offline/manual fallback: a visible, selectable input rather than pretending it copied.
 const node=document.querySelector('.social-card');if(node){const box=document.createElement('textarea');box.className='fallback-link';box.readOnly=true;box.value=url.toString();box.setAttribute('aria-label','Copy the blueprint link');node.appendChild(box);box.focus();box.select();}
}
function showHelp(){if(typeof el.help.showModal==='function')el.help.showModal();else el.help.setAttribute('open','');}
function hideHelp(){if(typeof el.help.close==='function')el.help.close();else el.help.removeAttribute('open');}
document.addEventListener('click',(e)=>{
 const btn=e.target.closest('[data-tab],[data-action]');if(!btn||btn.disabled)return;
 if(btn.dataset.tab){switchTab(btn.dataset.tab);return;}
 const type=btn.dataset.action;
 if(type==='share'){share();return;}
 if(type==='help'){showHelp();return;}
 if(type==='close-help'){hideHelp();return;}
 if(type==='reset'){if(window.confirm('Reset all local progress, inventory and credits? This cannot be undone.')){persist({type:'RESET'});hideHelp();switchTab('build');}return;}
 if(type==='install')persist({type:'INSTALL',id:btn.dataset.id});
 if(type==='remove')persist({type:'REMOVE',slot:btn.dataset.slot});
 if(type==='power')persist({type:'POWER'});
 if(type==='next'){persist({type:'NEXT_LEVEL'});switchTab('build');}
 if(type==='buy'){persist({type:'BUY',id:btn.dataset.id});/* remain in shop, player can see ownership */}
 if(type==='sell')persist({type:'SELL',id:btn.dataset.id});
 if(type==='trade')persist({type:'TRADE_NPC',id:btn.dataset.id});
 if(type==='answer')persist({type:'DAILY_ANSWER',day:today(),answer:Number(btn.dataset.answer)});
});
if('serviceWorker'in navigator &&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
render();
