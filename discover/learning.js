/** Pure deterministic learning domain. No fake mastery estimates or AI grading. */
export const STORE_KEY='onda.discover.fr.v1';
export const VERSION=1;
export function freshState(){return {version:VERSION,language:'en',level:'A1',onboarded:false,activeWorld:'museum',activeChapter:'m1',completed:[],attempts:{},words:{},lastVisit:null,days:[],settings:{sound:true,quality:'auto'}};}
export function normalizeFrench(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/[’']/g,"'").replace(/[^a-z0-9' ]/g,'').replace(/\s+/g,' ').trim();}
export function checkAnswer(input,expected){return normalizeFrench(input)===normalizeFrench(expected);}
export function hydrate(raw){const d=freshState();if(!raw||typeof raw!=='object'||raw.version!==VERSION)return d;return {
  ...d,language:['en','pt'].includes(raw.language)?raw.language:'en',level:['A1','A2','B1'].includes(raw.level)?raw.level:'A1',onboarded:raw.onboarded===true,
  activeWorld:['museum','cafe','science'].includes(raw.activeWorld)?raw.activeWorld:'museum',
  activeChapter:typeof raw.activeChapter==='string'?raw.activeChapter:'m1',
  completed:Array.isArray(raw.completed)?[...new Set(raw.completed.filter(x=>typeof x==='string'))].slice(0,100):[],
  attempts:raw.attempts&&typeof raw.attempts==='object'&&!Array.isArray(raw.attempts)?raw.attempts:{},
  words:raw.words&&typeof raw.words==='object'&&!Array.isArray(raw.words)?raw.words:{},
  days:Array.isArray(raw.days)?[...new Set(raw.days.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))].slice(-365):[],
  settings:{sound:raw.settings?.sound!==false,quality:['auto','2d','3d'].includes(raw.settings?.quality)?raw.settings.quality:'auto'}
};}
export function localDate(now=new Date()){return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
export function markVisit(state,now=new Date()){const d=localDate(now);return {...state,lastVisit:d,days:state.days.includes(d)?state.days:[...state.days,d].slice(-365)};}
export function streak(days,now=new Date()){let count=0;const dates=new Set(days);const cursor=new Date(now.getFullYear(),now.getMonth(),now.getDate());if(!dates.has(localDate(cursor)))cursor.setDate(cursor.getDate()-1);while(dates.has(localDate(cursor))){count++;cursor.setDate(cursor.getDate()-1);}return count;}
export function discover(state,chapterId,item,now=new Date()){
 const k=`${chapterId}:${item.id}`;
 if(state.words[k])return state;
 return {...state,words:{...state.words,[k]:{id:k,chapterId,fr:item.fr,en:item.en,pt:item.pt,seenAt:now.toISOString(),dueAt:now.toISOString(),reps:0,interval:0,ease:2.5,lapses:0}}};
}
export function dueWords(words,now=new Date()){return Object.values(words).filter(w=>w&&typeof w==='object'&&Number.isFinite(Date.parse(w.dueAt))&&Date.parse(w.dueAt)<=now.getTime()).sort((a,b)=>Date.parse(a.dueAt)-Date.parse(b.dueAt));}
export function gradeWord(word,grade,now=new Date()){
 if(![0,3,5].includes(grade))throw new RangeError('Allowed grades: 0, 3, 5');
 const correct=grade>=3;const old=Number.isFinite(word.ease)?word.ease:2.5;
 const ease=Math.max(1.3,old+(grade===5?.1:grade===3?-.14:-.2));
 let reps=correct?word.reps+1:0;
 let interval=correct?(word.reps===0?1:word.reps===1?3:Math.max(1,Math.round(word.interval*ease))):0;
 const dueAt=new Date(now.getTime()+(correct?interval*86400000:10*60000)).toISOString();
 return {...word,reps,interval,ease,lapses:(word.lapses||0)+(correct?0:1),dueAt,lastReviewedAt:now.toISOString()};
}
export function nextUnfinished(chapters,completed){return chapters.find(c=>!completed.includes(c.id))?.id||chapters[chapters.length-1]?.id;}
