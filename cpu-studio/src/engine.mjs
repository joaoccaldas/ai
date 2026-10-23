/** CPU Studio v2: deterministic, pure offline game transitions. No external dependencies. */
import {ITEMS, ITEM_BY_ID, LEVELS, DAILY_QUESTS, TRADES, COLLECTIBLES, SLOT_LABELS} from './catalog.mjs';

export const STATE_VERSION = 2; // Save-compatible beta maintenance release; no schema change.
// Level-specific minimum-memory requirements; larger SAME-INTERFACE modules must not fail.
// Deliberately curated: this is not a general purpose hardware configurator.
const COMPATIBLE_ALTERNATIVES = Object.freeze({
  1:{ram:['s100-1k']},
  5:{ram:['edo-16']},
  9:{ram:['ddr5-32']},
});
export function acceptsPart(l,slot,id){
  return Boolean(id && (l.required[slot]===id || COMPATIBLE_ALTERNATIVES[l.id]?.[slot]?.includes(id)));
}
const itemIds = new Set(ITEMS.map(p=>p.id));
const collectibleIds = new Set(COLLECTIBLES.map(p=>p.id));
const allSlots = new Set(Object.values(ITEMS.map(i=>i.slot)));
const validDay = /^20\d{2}-\d{2}-\d{2}$/;
const LOG_LIMIT = 18;

export const levelAt = (s) => LEVELS[s.level];
export const requiredSlots = (s) => Object.keys(levelAt(s).required);
export const owned = (s,id) => s.inventory[id] || 0;
/** The last required component on the player's current workbench cannot be sold or bartered. */
export function spareCount(s,id){const l=levelAt(s);const needed=Object.entries(l.required).some(([slot,required])=>required===id&&!acceptsPart(l,slot,s.installed[slot]));return Math.max(0,owned(s,id)-(needed?1:0));}
export const countInstalled = s => requiredSlots(s).filter(slot=>Boolean(s.installed[slot])).length;
const todayIndex = (day) => Math.floor(Date.parse(day+'T00:00:00Z') / 86400000) % DAILY_QUESTS.length;
export function dailyQuestFor(day) {return validDay.test(day) && Number.isFinite(Date.parse(day)) ? DAILY_QUESTS[todayIndex(day)] : DAILY_QUESTS[0];}

function addInv(inv,id,n=1){return {...inv,[id]:(inv[id]||0)+n};}
function change(s,msg,changes={}){return {...s,...changes,lastAction:msg};}
function ledger(s,type,delta,text){return [...s.ledger.slice(-(LOG_LIMIT-1)),{type,delta,text}];}
function enterLevel(s,index){
  const l=LEVELS[index];
  let inventory={...s.inventory};
  for(const id of Object.values(l.required)) if(id!==l.buy) inventory=addInv(inventory,id);
  // The repair mission starts with a real fault: a DDR2 module inserted into a DDR bench.
  // The player must notice, power-test, remove it and replace it with the correct DDR.
  const installed=index===7?{ram:'ddr2-512'}:{};
  return {...s,level:index,inventory,installed,powered:false,screen:'idle',error:null,
    lastAction:index===0?'Your 1975 kit is ready. Tap a part to install it.':index===7?'Repair job: the memory slot already contains an incompatible DDR2 module. Diagnose it and replace it safely.':`New workbench: ${l.title}. Your starter parts are on the shelf.`};
}
export function initialState(){
  const base={version:STATE_VERSION,level:0,unlocked:0,completed:[],credits:35,xp:0,inventory:{},installed:{},powered:false,
    screen:'idle',error:null,ledger:[],collection:[],dailyDay:null,boots:0,attempts:0,firstSeen:'',lastAction:''};
  return enterLevel(base,0);
}
export function diagnostic(s){
  const l=levelAt(s);
  // A visible incompatible module is diagnosed before missing parts. Otherwise the
  // historical DDR2 repair challenge would incorrectly report missing CPU first.
  for(const [slot,expectedId] of Object.entries(l.required)){
    const got=s.installed[slot];
    if(!got || acceptsPart(l,slot,got))continue;
    const actual=ITEM_BY_ID[got],expect=ITEM_BY_ID[expectedId];
    let reason=`${actual.name} is incompatible with this machine. It needs ${expect.name} or a verified compatible upgrade.`;
    if(slot==='ram') reason= actual.id==='ddr2-512'?'DDR2 will not fit this Socket 939 DDR motherboard. Power off, remove the wrong RAM, then install DDR.':'This motherboard requires '+expect.spec+' or compatible higher-capacity memory.';
    else if(slot==='cpu') reason='The processor must match the motherboard socket and bus. This machine needs '+expect.spec+'.';
    else if(slot==='storage') reason='This machine needs its matching storage interface and boot media: '+expect.spec+'.';
    return {kind:'incompatible',slot,expectedId,got,message:reason};
  }
  for(const [slot,expectedId] of Object.entries(l.required)){
    if(!s.installed[slot])return {kind:'missing',slot,expectedId,message:`${SLOT_LABELS[slot]} MISSING. Install ${ITEM_BY_ID[expectedId].name}.`};
  }
  return null;
}
export function canBuy(s,id){const item=ITEM_BY_ID[id];return !!item&&item.era<=LEVELS[s.level].era&&s.credits>=item.price;}
export function transition(s,a){
  if(!s||!a||typeof a.type!=='string')return s;
  switch(a.type){
    case 'INSTALL':{
      const item=ITEM_BY_ID[a.id];if(!item)return s;
      if(s.powered)return change(s,'Power OFF before changing any hardware.');
      if(!owned(s,item.id))return change(s,'That part is not in your inventory. Find it in the shop.');
      if(s.installed[item.slot])return change(s,`Remove the installed ${SLOT_LABELS[item.slot].toLowerCase()} first.`);
      return change(s,`${item.name} installed. ${item.teaches}`,{
        installed:{...s.installed,[item.slot]:item.id},inventory:{...s.inventory,[item.id]:owned(s,item.id)-1},screen:'idle',error:null
      });
    }
    case 'REMOVE':{
      if(!allSlots.has(a.slot) || !s.installed[a.slot])return s;
      if(s.powered)return change(s,'Always switch power OFF before removing components.');
      const id=s.installed[a.slot];const installed={...s.installed};delete installed[a.slot];
      return change(s,`${ITEM_BY_ID[id].name} returned to your inventory.`,{installed,inventory:addInv(s.inventory,id),screen:'idle',error:null});
    }
    case 'POWER':{
      if(s.powered)return change(s,'Power OFF. You can safely change components now.',{powered:false,screen:'idle',error:null});
      const error=diagnostic(s);
      if(error) return change(s,error.message,{powered:true,screen:'error',error,attempts:s.attempts+1});
      const l=levelAt(s);
      const already=s.completed.includes(l.id);
      const completed=already?s.completed:[...s.completed,l.id];
      const reward=already?0:l.reward;
      const bonusXp=already?0:l.xp;
      const book={...s, powered:true,screen:'success',error:null,boots:s.boots+1,
        completed,unlocked:Math.max(s.unlocked,Math.min(s.level+1,LEVELS.length-1)),
        credits:s.credits+reward,xp:s.xp+bonusXp,
        ledger:already?s.ledger:ledger(s,'EARN',reward,`LEVEL ${l.id} · ${l.title}`),
      };
      return change(book,already?'Machine booted again.':`BUILD VERIFIED! +${reward} credits · +${bonusXp} XP. ${l.lesson}`);
    }
    case 'NEXT_LEVEL':{
      if(!s.completed.includes(levelAt(s).id) || s.level>=LEVELS.length-1)return s;
      return enterLevel(s,s.level+1);
    }
    case 'BUY':{
      const item=ITEM_BY_ID[a.id];if(!item)return s;
      if(item.era>LEVELS[s.level].era)return change(s,'Reach that era to unlock this item.');
      if(s.credits<item.price)return change(s,`Not enough credits. ${item.price-s.credits} more needed.`);
      if(owned(s,item.id)>=99)return change(s,'Inventory limit reached for this item.');
      return change(s,`Purchased ${item.name} for ${item.price} credits.`,{
        credits:s.credits-item.price,inventory:addInv(s.inventory,item.id),ledger:ledger(s,'BUY',-item.price,item.name)
      });
    }
    case 'SELL':{
      const item=ITEM_BY_ID[a.id];if(!item||spareCount(s,item.id)<1)return change(s,'Keep the last required part for your active build. Only sell spares.');
      const returned=Math.floor(item.price*.5);
      return change(s,`Sold one spare ${item.name} for ${returned} credits.`,{
        credits:s.credits+returned,inventory:{...s.inventory,[item.id]:owned(s,item.id)-1},ledger:ledger(s,'SELL',returned,item.name)
      });
    }
    case 'TRADE_NPC':{
      const offer=TRADES.find(t=>t.id===a.id);if(!offer||LEVELS[s.level].era<offer.era)return s;
      if(spareCount(s,offer.give)<1)return change(s,'You need an extra spare part beyond what your active build requires.');
      if(s.collection.includes(offer.receive))return change(s,'Already in your collection. Keep this spare for another build.');
      return change(s,`Traded a spare ${ITEM_BY_ID[offer.give].name} for ${COLLECTIBLES.find(c=>c.id===offer.receive).name}.`,{
        inventory:{...s.inventory,[offer.give]:owned(s,offer.give)-1},collection:[...s.collection,offer.receive],
        ledger:ledger(s,'TRADE',0,offer.title+' · verified NPC barter')
      });
    }
    case 'DAILY_ANSWER':{
      const day=String(a.day||'');if(!validDay.test(day)||!Number.isFinite(Date.parse(day)))return s;
      if(s.dailyDay===day)return change(s,'Daily mission already completed. Come back for a new challenge another day.');
      const quest=dailyQuestFor(day);
      if(!Number.isInteger(a.answer)||a.answer!==quest.answer)return change(s,'Not quite. '+quest.explain+' Try again.');
      return change(s,`+30 credits · +25 XP. ${quest.explain}`,{
        dailyDay:day,credits:s.credits+30,xp:s.xp+25,
        ledger:ledger(s,'QUEST',30,'Today’s engineering puzzle')
      });
    }
    case 'RESET':return initialState();
    default:return s;
  }
}

/** Schema validation is for corrupt saves, not an anti-cheat mechanism. Real P2P economies require a server. */
export function stateFromStorage(value){
  if(!value||typeof value!=='object'||value.version!==STATE_VERSION)return initialState();
  const validInt=(n,max=1e8)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
  if(!validInt(value.level,LEVELS.length-1)||!validInt(value.unlocked,LEVELS.length-1)||value.level>value.unlocked)return initialState();
  if(!validInt(value.credits)||!validInt(value.xp)||!validInt(value.boots)||!validInt(value.attempts))return initialState();
  if(!Array.isArray(value.completed)||!value.completed.every(x=>validInt(x,LEVELS.length)&&x>0)||new Set(value.completed).size!==value.completed.length)return initialState();
  if(!value.completed.every((x,i)=>x===i+1))return initialState();
  if(!value.inventory||typeof value.inventory!=='object'||!value.installed||typeof value.installed!=='object')return initialState();
  if(Object.entries(value.inventory).some(([id,n])=>!itemIds.has(id)||!validInt(n,99)))return initialState();
  if(Object.entries(value.installed).some(([slot,id])=>!allSlots.has(slot)||!itemIds.has(id)||ITEM_BY_ID[id].slot!==slot))return initialState();
  if(typeof value.powered!=='boolean'||!['idle','error','success'].includes(value.screen))return initialState();
  if(value.screen==='success'&&diagnostic(value))return initialState();
  if(value.screen!=='idle'&&!value.powered)return initialState();
  if(!Array.isArray(value.collection)||value.collection.some(id=>!collectibleIds.has(id))||new Set(value.collection).size!==value.collection.length)return initialState();
  if(value.dailyDay!==null && (typeof value.dailyDay!=='string'||!validDay.test(value.dailyDay)))return initialState();
  if(!Array.isArray(value.ledger))return initialState();
  const log=value.ledger.slice(-LOG_LIMIT).filter(x=>x&&typeof x.type==='string'&&typeof x.text==='string'&&Number.isSafeInteger(x.delta)).map(x=>({type:x.type.slice(0,12),delta:x.delta,text:x.text.slice(0,100)}));
  let error=value.screen==='error'?diagnostic(value):null;
  if(value.screen==='error'&&!error)return initialState();
  const restored={...initialState(),level:value.level,unlocked:value.unlocked,completed:[...value.completed],credits:value.credits,xp:value.xp,
    inventory:Object.fromEntries(Object.entries(value.inventory)),installed:Object.fromEntries(Object.entries(value.installed)),
    powered:value.powered,screen:value.screen,error,collection:[...value.collection],dailyDay:value.dailyDay,
    ledger:log,boots:value.boots,attempts:value.attempts,lastAction:typeof value.lastAction==='string'?value.lastAction.slice(0,300):''};
  return restored;
}

/** URL-shared read-only blueprints. No credits, accounts, IDs, or inventory are ever imported. */
export function blueprint(s){return {v:1,level:levelAt(s).id,parts:Object.keys(s.installed).sort().map(slot=>s.installed[slot])};}
export function encodeBlueprint(bp){return btoa(JSON.stringify(bp)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function decodeBlueprint(token){
  try{
    if(typeof token!=='string'||token.length>1024||!/^[\w-]+$/.test(token))return null;
    const obj=JSON.parse(atob(token.replace(/-/g,'+').replace(/_/g,'/')));
    if(obj.v!==1||!Number.isInteger(obj.level)||obj.level<1||obj.level>LEVELS.length||!Array.isArray(obj.parts)||obj.parts.length>9||obj.parts.some(id=>!itemIds.has(id)))return null;
    if(new Set(obj.parts.map(id=>ITEM_BY_ID[id].slot)).size!==obj.parts.length)return null;
    return {level:obj.level,parts:[...obj.parts]};
  } catch {return null;}
}
