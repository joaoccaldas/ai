import {WORLDS,CHAPTERS,CHAPTERS_BY_WORLD,CHAPTER_BY_ID} from './curriculum.js';
import {STORE_KEY,freshState,hydrate,markVisit,streak,discover,dueWords,gradeWord,checkAnswer,nextUnfinished} from './learning.js';
const $=id=>document.getElementById(id);
const ui={home:$('homeView'),story:$('storyView'),review:$('reviewView'),progress:$('progressView')};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=freshState();try{state=hydrate(JSON.parse(localStorage.getItem(STORE_KEY)));}catch{}
state=markVisit(state);
let tab='home',chapter=null,step='explore',inspected=null,answerIndex=null,wrongAnswer=false,listenFeedback='',reviewQueue=[],reviewCard=null,reviewFlipped=false;
let sceneWorld=null,sceneLoading=false,toastTimer=null,renderedChapterId=null,sceneEpoch=0;
function stop3D(){sceneEpoch++;if(sceneWorld){sceneWorld.dispose();sceneWorld=null;}renderedChapterId=null;}
const meaning=item=>state.language==='pt'?item.pt:item.en;
const label=(en,pt)=>state.language==='pt'?pt:en;
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch{notify('Saving blocked by browser settings. Progress lasts for this session.');}}
function notify(message){const el=$('toast');el.textContent=message;el.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('on'),4200);}
function sceneFor(w){return WORLDS.find(x=>x.id===w)||WORLDS[0];}
function chapterSet(){return CHAPTERS_BY_WORLD[state.activeWorld]||CHAPTERS_BY_WORLD.museum;}
function speak(text){if(!state.settings.sound){notify('Sound is turned off. Enable it from the top bar.');return;}if(!('speechSynthesis' in window)){notify('French audio is unavailable in this browser.');return;}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fr-FR';u.rate=.86;u.pitch=1;
 const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang.toLowerCase().startsWith('fr'))||null;speechSynthesis.speak(u);
}
function tabTo(t){if(!ui[t])t='home';if(t!=='story'&&sceneWorld)stop3D();if(t!=='story'&&sceneLoading)sceneEpoch++;tab=t;for(const [k,el] of Object.entries(ui))el.hidden=k!==t;
 for(const b of document.querySelectorAll('[data-tab]')){const sel=b.dataset.tab===t;b.classList.toggle('selected',sel);if(sel)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 if(t==='home')renderHome();if(t==='story')renderScene();if(t==='review')renderReview();if(t==='progress')renderProgress();refreshHeader();location.hash=t==='home'?'home':t;
}
function refreshHeader(){const due=dueWords(state.words).length;$('duePill').textContent=due;$('duePill').hidden=due===0;$('audioBtn').setAttribute('aria-pressed',String(state.settings.sound));$('audioBtn').textContent=state.settings.sound?'♪':'♪̸';$('qualityBtn').textContent=state.settings.quality==='2d'?'2D':'3D';$('langBtn').textContent=state.language.toUpperCase();}
function renderHome(){const cards=WORLDS.map((w,i)=>{const cs=CHAPTERS_BY_WORLD[w.id],done=cs.filter(c=>state.completed.includes(c.id)).length;
 return `<button class="world-card" data-world="${w.id}" aria-label="Explore ${escape(w.title)}, ${done} of ${cs.length} chapters completed"><span class="cover" style="background-image:url('${w.art}')"></span><span class="veil"></span><span class="world-num">${w.eyebrow}</span><span class="time-pill">${w.minutes} MIN</span><span class="info"><span class="eyebrow">${w.tag}</span><h3>${w.title}</h3><p>${w.sub}</p><span class="arrow">${done===cs.length?'REVISIT':'ENTER THIS WORLD'} <span aria-hidden="true">↗</span></span>${done?`<span class="world-complete"> · ${done}/${cs.length} chapters</span>`:''}</span></button>`}).join('');$('worldGrid').innerHTML=cards;}
function selectWorld(id){const world=sceneFor(id);state.activeWorld=world.id;const cs=CHAPTERS_BY_WORLD[world.id];state.activeChapter=nextUnfinished(cs,state.completed);save();beginChapter(state.activeChapter);tabTo('story');}
function beginChapter(id){chapter=CHAPTER_BY_ID[id]||CHAPTERS[0];state.activeWorld=chapter.world;state.activeChapter=chapter.id;step='explore';inspected=null;answerIndex=null;wrongAnswer=false;listenFeedback='';save();}
async function ensure3D(){if(!chapter||tab!=='story'||state.settings.quality==='2d'){if(sceneWorld)stop3D();$('scene3d').style.display='none';$('sceneQuality').textContent='Illustrated mode · 2D';return;}
 $('scene3d').style.display='block';if(sceneWorld){if(renderedChapterId!==chapter.id){renderedChapterId=chapter.id;await sceneWorld.setChapter(chapter);}return;}
 if(sceneLoading)return;sceneLoading=true;const epoch=sceneEpoch;$('sceneQuality').textContent='Preparing 3D world…';try{const mod=await import('./world.js');if(epoch!==sceneEpoch||tab!=='story')return;
 const created=await mod.createWorld($('scene3d'),{onPick:id=>inspect(id),onStatus:s=>{$('sceneQuality').textContent=s;}});
 if(epoch!==sceneEpoch||tab!=='story'||state.settings.quality==='2d'){created?.dispose();return;}sceneWorld=created;
 if(sceneWorld){renderedChapterId=chapter.id;await sceneWorld.setChapter(chapter);}else{$('scene3d').style.display='none';}}
 catch(e){$('sceneQuality').textContent='Illustrated mode · 3D unavailable';$('scene3d').style.display='none';}finally{sceneLoading=false;}
}
function progressIndex(){return chapterSet().findIndex(c=>c.id===chapter.id);}
function renderScene(){if(!chapter)beginChapter(state.activeChapter);const w=sceneFor(chapter.world),cs=chapterSet(),idx=progressIndex();
 $('stagePhoto').style.backgroundImage=`url('${w.art}')`;
 $('sceneClock').textContent=chapter.time;$('sceneLocation').textContent=chapter.world==='museum'?'PARIS · LE MUSÉE':chapter.world==='cafe'?'PARIS · LE CAFÉ':'OBSERVATOIRE · FRANCE';
 $('chapterKicker').textContent=`ACT ${String(idx+1).padStart(2,'0')} · ${w.tag}`;$('chapterTitle').textContent=chapter.french;$('chapterNarration').textContent=chapter.intro;
 $('chapterCounter').textContent=`${String(idx+1).padStart(2,'0')} / ${String(cs.length).padStart(2,'0')}`;
 $('progressLine').style.width=`${Math.round(((idx+(step==='done'?1:0))/cs.length)*100)}%`;
 $('sceneHotspots').innerHTML=chapter.objects.map(item=>`<button id="hotspot-${chapter.id}-${item.id}" class="hotspot ${state.words[`${chapter.id}:${item.id}`]?'seen':''}" data-inspect="${item.id}" aria-label="Inspect ${escape(item.fr)}" aria-pressed="${Boolean(state.words[`${chapter.id}:${item.id}`])}"><span class="spot"></span>${escape(item.fr)}</button>`).join('');
 $('sceneInstruction').textContent=step==='explore'?'TAP A CLUE · DISCOVER ITS MEANING':step==='dialogue'?'MAKE YOUR CHOICE · SPEAK FRENCH':'LISTEN · REMEMBER · RESPOND';
 $('previousBtn').disabled=idx===0;$('nextBtn').disabled=step!=='done';$('nextBtn').textContent=idx===cs.length-1?'World complete →':'Next chapter →';
 renderInteraction();ensure3D();refreshHeader();
}
function inspect(id){if(!chapter)return;const item=chapter.objects.find(o=>o.id===id);if(!item)return;inspected=item;state=discover(state,chapter.id,item);save();if(tab!=='story')tabTo('story');else renderScene();speak(item.fr);}
function renderInteraction(){const target=$('interactionPanel');if(!chapter)return;
 if(step==='explore'){
   const seen=chapter.objects.filter(o=>state.words[`${chapter.id}:${o.id}`]).length;
   target.innerHTML=`<div class="panel-section"><span class="section-counter">01 / LOOK CLOSER</span><h3>Every detail tells a story.</h3><p class="explain">${escape(chapter.objective)} Select an object to discover its French name and a piece of the story.</p>
   <div class="object-list">${chapter.objects.map(x=>`<button class="object-cta ${state.words[`${chapter.id}:${x.id}`]?'seen':''}" data-inspect="${x.id}">${state.words[`${chapter.id}:${x.id}`]?'✓ ':'◌ '}${escape(x.fr)}</button>`).join('')}</div>
   ${inspected?`<div class="vocab-card"><div class="term">${escape(inspected.fr)}</div><div class="meaning">${escape(meaning(inspected))}</div><p class="detail">${escape(inspected.detail)}</p><button class="audio-control" data-speak="${escape(inspected.fr)}">◖♪ Listen again</button></div>`:''}
   <div class="dialogue-card"><span class="speaker">${escape(chapter.character)}</span><blockquote lang="fr">“${escape(chapter.line)}”</blockquote><div class="translation">${escape(label(chapter.translation,chapter.translation))}</div><button class="audio-control" data-speak="${escape(chapter.line)}">◖♪ Hear the conversation</button></div>
   <button class="primary" id="talkBtn" ${seen===0?'disabled':''}>Start the conversation <span aria-hidden="true">↗</span></button><p class="microcopy">${seen} of ${chapter.objects.length} discoveries. Examine at least one before continuing. Full exploration improves your word collection.</p></div>`;
 }else if(step==='dialogue'){
   target.innerHTML=`<div class="panel-section"><span class="section-counter">02 / CHOOSE YOUR WORDS</span><h3>Your turn to speak.</h3><p class="explain">${escape(chapter.prompt)}</p>
    <div class="dialogue-card"><span class="speaker">${escape(chapter.character)}</span><blockquote lang="fr">“${escape(chapter.line)}”</blockquote><button class="audio-control" data-speak="${escape(chapter.line)}">◖♪ Replay</button></div>
    <div class="choice-list">${chapter.choices.map((c,i)=>`<button class="choice ${i===answerIndex?(c.ok?'chosen-good':'chosen-bad'):''}" data-choice="${i}"><span lang="fr">${escape(c.fr)}</span><span class="symbol">↗</span></button>`).join('')}</div>
    ${answerIndex!==null?`<p class="feedback ${wrongAnswer?'bad':''}">${escape(chapter.choices[answerIndex].reply)}<br><span class="microcopy">${escape(chapter.choices[answerIndex].en)}</span></p>`:''}
    ${answerIndex!==null&&!wrongAnswer?'<button id="toListen" class="primary">I understand · Keep going →</button>':''}
    <p class="microcopy">Wrong answers are safe here. Read the feedback and try again.</p></div>`;
 }else if(step==='listen'){
   target.innerHTML=`<div class="panel-section"><span class="section-counter">03 / RETRIEVE & REMEMBER</span><h3>Now use what you heard.</h3><p class="explain">Listen to the sentence, then complete it in French. This is active recall, not a multiple-choice guess.</p>
    <div class="dialogue-card"><span class="speaker">LISTENING EXERCISE · FR</span><blockquote lang="fr">${escape(chapter.cloze)}</blockquote><button class="audio-control" data-speak="${escape(chapter.listen)}">◖♪ Play French audio</button></div>
    <form id="listenForm"><label class="section-counter" for="listenInput">MISSING WORD</label><div class="answer-row"><input id="listenInput" autocomplete="off" spellcheck="false" aria-label="Missing French word" placeholder="Type in French" required><button class="primary" type="submit">Check ↗</button></div></form>
    <div class="object-list" style="margin-top:14px"><button class="object-cta" id="voiceBtn">◖ Mic · dictate</button><button class="object-cta" id="hintBtn">Need a hint?</button></div>
    ${listenFeedback?`<p class="feedback ${listenFeedback.startsWith('Not quite')?'bad':''}">${escape(listenFeedback)}</p>`:''}
    <p class="microcopy">Dictation uses your browser’s speech recognition if available. It checks the words recognized, not your accent.</p></div>`;
 }else{
   target.innerHTML=`<div class="panel-section"><span class="section-counter">SCENE COMPLETE · WELL DONE</span><h3>You moved the story forward.</h3><p class="explain">${escape(chapter.context)}</p><div class="dialogue-card"><span class="speaker">ONE PHRASE TO KEEP</span><blockquote lang="fr">“${escape(chapter.listen)}”</blockquote><button class="audio-control" data-speak="${escape(chapter.listen)}">◖♪ Hear it again</button></div><p class="microcopy">Your discoveries have entered your review collection. Return later to strengthen recall.</p><button class="secondary" id="seeWords">Review the words you found ↗</button></div>`;
 }
}
function choose(i){const c=chapter?.choices[i];if(!c||step!=='dialogue')return;answerIndex=i;wrongAnswer=!c.ok;state.attempts[chapter.id]=(state.attempts[chapter.id]||0)+1;save();renderInteraction();speak(c.reply);}
function completeChapter(){if(!state.completed.includes(chapter.id))state.completed.push(chapter.id);step='done';save();renderScene();notify('Scene completed. Your discoveries are saved.');}
function nextChapter(){const cs=chapterSet();let idx=progressIndex();if(idx+1>=cs.length){tabTo('home');notify('World complete. Explore another story or revisit your words.');return;}beginChapter(cs[idx+1].id);renderScene();}
function previousChapter(){const cs=chapterSet(),idx=progressIndex();if(idx<=0)return;beginChapter(cs[idx-1].id);renderScene();}
function startReview(all=false){reviewQueue=(all?Object.values(state.words):dueWords(state.words)).map(x=>x.id);reviewCard=null;reviewFlipped=false;advanceReview();}
function advanceReview(){const id=reviewQueue.shift();reviewCard=id?state.words[id]||null:null;reviewFlipped=false;renderReview();}
function renderReview(){const all=Object.values(state.words),due=dueWords(state.words);const area=$('reviewContent');
 if(reviewCard){area.innerHTML=`<div class="review-shell"><span class="section-counter">SPACED REVIEW · ${reviewQueue.length+1} REMAINING</span><div class="review-card"><span class="eyebrow">CAN YOU RECALL THE MEANING?</span><h2 lang="fr">${escape(reviewCard.fr)}</h2><button class="audio-control" data-speak="${escape(reviewCard.fr)}">◖♪ Listen</button>${reviewFlipped?`<p class="meaning">${escape(meaning(reviewCard))}</p>`:'<p class="meaning">Say it aloud before revealing the meaning.</p>'}</div><div class="review-options">${reviewFlipped?'<button data-grade="0">Again · 10 min</button><button data-grade="3">Remembered · 1+ day</button><button data-grade="5">Easy · longer</button>':'<button id="flipCard" class="primary">Reveal meaning ↗</button>'}</div><p class="review-note">Rate your recall, not how familiar the word looks. This schedules the next review.</p></div>`;return;}
 const empty=all.length===0;
 area.innerHTML=`<div class="metric-row"><div class="metric"><div class="mval">${all.length}</div><div class="mlabel">Words discovered</div></div><div class="metric"><div class="mval">${due.length}</div><div class="mlabel">Due for review</div></div><div class="metric"><div class="mval">${all.filter(x=>x.reps>0).length}</div><div class="mlabel">Reviewed at least once</div></div></div>
 <div style="margin-top:28px">${empty?'<div class="empty-state"><strong>No words yet.</strong>Enter a story, investigate your surroundings and the words will appear here.</div>':`<div class="review-shell"><span class="eyebrow">YOUR NEXT SESSION</span><h2 style="font:normal 44px var(--serif);margin:18px 0">${due.length?`${due.length} words are waiting.`:'You’re caught up.'}</h2><p class="explain">${due.length?'Review what you discovered while the memory is still forming.':'Nothing is scheduled right now. You can still practice any word you have encountered.'}</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="reviewDue" class="primary" ${due.length===0?'disabled':''}>Review due words ↗</button><button id="reviewAll" class="secondary">Practice all words</button></div></div><div class="word-gallery">${all.map(x=>`<div class="word-chip"><span lang="fr">${escape(x.fr)}</span><small>${escape(meaning(x))}</small></div>`).join('')}</div>`}</div>`;
}
function reviewGrade(grade){if(!reviewCard)return;const id=reviewCard.id;state.words[id]=gradeWord(reviewCard,grade);save();advanceReview();refreshHeader();}
function renderProgress(){const area=$('progressContent'),n=CHAPTERS.length,done=state.completed.filter(id=>CHAPTER_BY_ID[id]).length,words=Object.values(state.words);
 area.innerHTML=`<div class="metric-row"><div class="metric"><div class="mval">${done}<small style="font-size:19px;color:var(--muted)"> / ${n}</small></div><div class="mlabel">Story scenes completed</div></div><div class="metric"><div class="mval">${words.length}</div><div class="mlabel">Expressions discovered</div></div><div class="metric"><div class="mval">${streak(state.days)}</div><div class="mlabel">Day${streak(state.days)===1?'':'s'} in current visit streak</div></div></div>
 <div class="world-progress">${WORLDS.map(w=>{const cs=CHAPTERS_BY_WORLD[w.id],done=cs.filter(c=>state.completed.includes(c.id)).length;return `<div><span>${escape(w.title)}</span><span>${done} / ${cs.length} SCENES</span></div>`}).join('')}</div>
 <p class="microcopy" style="margin:25px 0">Progress is stored locally, on this device and browser. Completing a story is not a certified CEFR proficiency score. For study across devices, authenticated sync would be required.</p>
 <button id="progressReview" class="primary">Practice French now ↗</button>`;
}
function voiceDictation(){const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){notify('Speech recognition is unavailable here. Type the answer instead.');return;}const rec=new R();rec.lang='fr-FR';rec.interimResults=false;rec.maxAlternatives=1;rec.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';$('listenInput').value=text;notify('Transcription received. Check it before submitting.');};rec.onerror=e=>notify('Microphone could not start: '+e.error);try{rec.start();notify('Listening for a French word…');}catch{notify('Could not access the microphone.');}}
function onClick(event){const b=event.target.closest('button');if(!b)return;
 if(b.dataset.tab){tabTo(b.dataset.tab);return;}if(b.dataset.world){selectWorld(b.dataset.world);return;}if(b.dataset.inspect){inspect(b.dataset.inspect);return;}if(b.dataset.speak){speak(b.dataset.speak);return;}
 if(b.dataset.choice!==undefined){choose(Number(b.dataset.choice));return;}if(b.dataset.grade!==undefined){reviewGrade(Number(b.dataset.grade));return;}
 switch(b.id){case 'startBtn':selectWorld(state.activeWorld);break;case 'talkBtn':if(chapter.objects.some(o=>state.words[`${chapter.id}:${o.id}`])){step='dialogue';renderScene();}break;
 case 'toListen':step='listen';renderScene();break;case 'hintBtn':notify(`Hint: the missing word starts with “${chapter.answer[0]}”`);break;case 'voiceBtn':voiceDictation();break;
 case 'backToWorlds':tabTo('home');break;case 'previousBtn':previousChapter();break;case 'nextBtn':nextChapter();break;case 'seeWords':tabTo('review');break;
 case 'reviewDue':startReview(false);break;case 'reviewAll':startReview(true);break;case 'flipCard':reviewFlipped=true;renderReview();break;case 'progressReview':tabTo('review');break;
 case 'audioBtn':state.settings.sound=!state.settings.sound;save();refreshHeader();break;
 case 'langBtn':state.language=state.language==='en'?'pt':'en';save();refreshHeader();if(tab==='story')renderScene();else if(tab==='review')renderReview();break;
 case 'qualityBtn':state.settings.quality=state.settings.quality==='2d'?'3d':'2d';save();refreshHeader();if(tab==='story')ensure3D();break;}
}
$('main').addEventListener('click',onClick);
$('audioBtn').addEventListener('click',onClick);$('langBtn').addEventListener('click',onClick);$('qualityBtn').addEventListener('click',onClick);document.querySelector('.topnav').addEventListener('click',onClick);
$('main').addEventListener('submit',event=>{if(event.target.id!=='listenForm')return;event.preventDefault();const val=$('listenInput').value.trim();if(checkAnswer(val,chapter.answer)){listenFeedback='Correct. You remembered it in French.';completeChapter();speak(chapter.listen);}else{listenFeedback='Not quite. Listen again and try one more time.';renderInteraction();notify('Try again. You can replay the sentence.');}});
$('welcomeForm').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.target);state.language=data.get('language')==='pt'?'pt':'en';state.level=['A1','A2','B1'].includes(data.get('level'))?data.get('level'):'A1';state.onboarded=true;save();$('welcomeDialog').close();refreshHeader();tabTo('home');});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&tab==='story'&&!document.querySelector('dialog[open]'))tabTo('home');});
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
save();refreshHeader();renderHome();const entry=location.hash.replace('#','');tabTo(['home','story','review','progress'].includes(entry)?entry:'home');if(!state.onboarded&&typeof $('welcomeDialog').showModal==='function')$('welcomeDialog').showModal();
