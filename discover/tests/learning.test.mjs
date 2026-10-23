import test from 'node:test';import assert from 'node:assert/strict';
import {freshState,hydrate,normalizeFrench,checkAnswer,discover,dueWords,gradeWord,streak,nextUnfinished} from '../learning.js';
import {CHAPTERS,CHAPTERS_BY_WORLD,WORLDS} from '../curriculum.js';
const at=new Date('2026-10-23T12:00:00Z');
test('all worlds contain chapters with three clues and unambiguous correct choices',()=>{
 for(const world of WORLDS){assert.ok(CHAPTERS_BY_WORLD[world.id].length>=2);}
 const ids=new Set();for(const c of CHAPTERS){assert.ok(!ids.has(c.id));ids.add(c.id);assert.equal(c.objects.length,3);assert.equal(c.choices.filter(x=>x.ok).length,1);assert.ok(c.answer);assert.ok(c.listen.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(c.answer.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')));}
});
test('French answers accept diacritics and whitespace without accepting different words',()=>{
 assert.equal(normalizeFrench('  PRÊTÉ  '),'prete');assert.equal(checkAnswer('  PRÊTÉ ', 'prêté'),true);assert.equal(checkAnswer('donnees','données'),true);assert.equal(checkAnswer('café','cafe'),true);assert.equal(checkAnswer('painting','tableau'),false);
});
test('discover new vocabulary once and schedule it as due',()=>{const c=CHAPTERS[0],item=c.objects[0];let s=freshState();s=discover(s,c.id,item,at);assert.equal(Object.keys(s.words).length,1);assert.equal(dueWords(s.words,at).length,1);assert.equal(Object.keys(discover(s,c.id,item,new Date(at.getTime()+1000)).words).length,1);});
test('spaced review: failure requeues in 10 mins, recall next day, later repetitions extend intervals',()=>{let w=discover(freshState(),'m1',CHAPTERS[0].objects[0],at).words['m1:invitation'];
 w=gradeWord(w,0,at);assert.equal(w.lapses,1);assert.equal(dueWords({w},new Date(at.getTime()+9*60000)).length,0);assert.equal(dueWords({w},new Date(at.getTime()+10*60000)).length,1);
 w=gradeWord(w,3,at);assert.equal(w.reps,1);assert.equal(w.interval,1);w=gradeWord(w,5,new Date(at.getTime()+86400000));assert.equal(w.reps,2);assert.equal(w.interval,3);
});
test('hydration ignores invalid profile fields; progress is deduplicated',()=>{const x=hydrate({...freshState(),activeWorld:'invalid',language:'zz',completed:['m1','m1'],words:{}});assert.equal(x.activeWorld,'museum');assert.equal(x.language,'en');assert.deepEqual(x.completed,['m1']);assert.equal(hydrate({version:999}).onboarded,false);});
test('streak is based on consecutive calendar days, accepting yesterday',()=>{assert.equal(streak(['2026-10-20','2026-10-21','2026-10-22'],new Date(2026,9,23)),3);assert.equal(streak(['2026-10-20'],new Date(2026,9,23)),0);});
test('next chapter follows actual completion, not view count',()=>{const cs=CHAPTERS_BY_WORLD.museum;assert.equal(nextUnfinished(cs,['m1']),cs[1].id);assert.equal(nextUnfinished(cs,cs.map(x=>x.id)),cs[2].id);});
