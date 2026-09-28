(function(){
'use strict';
var ACCESS_KEY='wyld.archive.access.v1';
var params=new URLSearchParams(location.search);
var force=params.get('gate')==='1';
try{if(sessionStorage.getItem(ACCESS_KEY)==='granted'&&!force)return;}catch(_){}
var gate=document.createElement('section');
gate.id='bpGate';
gate.setAttribute('aria-label','Restricted cycling archive initiation');
gate.innerHTML=[
'<div class="bp-stage" id="bpStage">',
'<div class="bp-floor"></div><div class="bp-proscenium"></div><div class="bp-glow"></div>',
'<div class="bp-door-frame" aria-hidden="true"><div class="bp-door"><div class="bp-leaf left"></div><div class="bp-leaf right"></div><div class="bp-knocker"></div><div class="bp-door-label">5D QUANTUM LOCK · PATENT PENDING</div></div></div>',
'<div class="bp-curtain left"></div><div class="bp-curtain right"></div>',
'<div class="bp-actor bp-koala" id="bpKoala" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head"></i><i class="eye l"></i><i class="eye r"></i><i class="nose"></i><i class="body"></i><i class="bow"></i></div>',
'<div class="bp-actor bp-alien" id="bpAlien" aria-hidden="true"><i class="head"></i><i class="eye l"></i><i class="eye r"></i><i class="torso"></i><i class="leg l"></i><i class="leg r"></i><i class="ring"></i></div>',
'<div class="bp-actor bp-ghost" id="bpGhost" aria-hidden="true"><i class="head"></i><i class="eye l"></i><i class="eye r"></i><i class="sheet"></i><i class="clipboard"></i></div>',
'<div class="bp-sigils" id="bpSigils" aria-hidden="true"><i class="bp-sig"></i><i class="bp-sig"></i><i class="bp-sig"></i><i class="bp-sig"></i><i class="bp-sig"></i></div>',
'<div class="bp-flash" id="bpFlash"></div></div>',
'<header class="bp-header"><span class="bp-mark">WYLD / restricted archive</span><div class="bp-tools"><button class="bp-mini" type="button" id="bpSound">Sound on</button><button class="bp-mini" type="button" id="bpSkip" hidden>Skip ceremony</button></div></header>',
'<div class="bp-landing" id="bpLanding"><span class="bp-kicker">First 5D quantum computer encryption system · patent pending</span><h1>BIKE ARCHIVE</h1><p>What exists behind this door is far too random, beautiful and completely unnecessary for ordinary encryption.</p><button type="button" class="bp-start" id="bpStart">Attempt access</button></div>',
'<div class="bp-dialogue" id="bpDialogue" aria-live="polite" hidden><span class="who" id="bpWho"></span><span class="line" id="bpLine"></span></div>',
'<div class="bp-trials" id="bpTrials" aria-live="polite"><div class="bp-card" id="bpCard"></div></div>',
'<div class="bp-unlock"><div><b>ACCESS GRANTED</b><span>Answers: irrelevant · Pattern recognition: suspiciously adequate</span></div></div>'
].join('');
document.body.appendChild(gate);
function q(s){return gate.querySelector(s)}
function qa(s){return Array.prototype.slice.call(gate.querySelectorAll(s))}
var stage=q('#bpStage'),landing=q('#bpLanding'),dialogue=q('#bpDialogue'),who=q('#bpWho'),line=q('#bpLine'),trials=q('#bpTrials'),card=q('#bpCard');
var start=q('#bpStart'),skip=q('#bpSkip'),soundBtn=q('#bpSound'),sigils=qa('.bp-sig');
var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var timers=[],intro=false,soundOn=true,ctx=null,step=0,restraintTimer=null,memorySequence=[],memoryLocked=false;
function later(ms,fn){var id=setTimeout(fn,ms);timers.push(id);return id}
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function say(name,text){dialogue.hidden=false;who.textContent=name;line.textContent=text}
function flash(){var f=q('#bpFlash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go')}
function audioInit(){if(ctx||!soundOn)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(_){ctx=null}}
function tone(freq,dur,type,gain,delay){if(!ctx||!soundOn)return;var o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+(delay||0);o.type=type||'sine';o.frequency.value=freq||220;g.gain.value=0;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain||.025,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+(dur||.12));o.start(t);o.stop(t+(dur||.12)+.04)}
function freehub(){[0,.08,.16,.24,.32].forEach(function(d,i){tone(1200+i*90,.035,'square',.016,d)})}
function sting(){tone(95,.5,'sawtooth',.04,0);tone(740,.1,'square',.025,.04);tone(510,.28,'sine',.02,.1)}
function clunk(){tone(105,.15,'square',.03,0);tone(72,.22,'sine',.026,.08)}
function startIntro(){
if(intro)return;intro=true;audioInit();if(ctx&&ctx.state==='suspended')ctx.resume().catch(function(){});
landing.classList.add('hidden');gate.classList.add('bp-intro');skip.hidden=false;freehub();
say('SYSTEM','Candidate detected. Ceremony loading with unreasonable confidence.');
if(reduced){later(200,beginTrials);return}
later(3800,function(){q('#bpKoala').classList.add('in');tone(220,.08,'triangle',.03,0);tone(330,.1,'triangle',.02,.1);say('KLAUS · MASTER OF CEREMONIES','Welcome. I am professionally qualified because nobody stopped me.')});
later(9800,function(){q('#bpAlien').classList.add('in');tone(470,.35,'sine',.018,0);tone(720,.4,'sine',.016,.12);say('KLAUS','Valentino will now present the Sacred Ring. Please pretend this is normal.')});
later(14800,function(){flash();q('#bpGhost').classList.add('in');sting();say('BOO · COMPLIANCE','AAAAAH. Sorry. Compliance. Five trials. Correct answers are prohibited.')});
later(19800,function(){q('#bpSigils').classList.add('on');sigils.forEach(function(s,i){later(i*420,function(){s.classList.add('pulse');tone(320+i*70,.14,'sine',.016,0)})});say('KLAUS','Answers are insecure. Patterns are safer. The machine only cares how you behave.')});
later(25800,function(){gate.classList.add('bp-chaos');clunk();clunk();say('VALENTINO','...')});
later(27600,function(){say('KLAUS','Excellent. Nobody was injured enough to cancel. Begin.');freehub()});
later(30000,beginTrials)
}
function beginTrials(){clearTimers();intro=false;skip.hidden=true;dialogue.hidden=true;trials.classList.add('on');step=0;renderTrial()}
function shell(title,help,inner){return '<div class="bp-step">Quantum authentication · trial '+(step+1)+' / 5</div><h2>'+title+'</h2><p class="bp-help">'+help+'</p>'+inner+'<p class="bp-feedback" role="status"></p>'}
function feedback(text){var f=card.querySelector('.bp-feedback');if(f)f.textContent=text}
function pass(text){feedback(text);tone(520,.14,'sine',.023,0);tone(760,.2,'sine',.018,.11);later(850,function(){step++;renderTrial()})}
function renderTrial(){if(restraintTimer){clearTimeout(restraintTimer);restraintTimer=null}if(step===0)trialName();else if(step===1)trialConsistency();else if(step===2)trialRhythm();else if(step===3)trialRestraint();else if(step===4)trialMemory();else unlock()}
function dots(n,on){var s='<div class="bp-pattern" aria-hidden="true">';for(var i=0;i<n;i++)s+='<i class="bp-dot'+(i<on?' on':'')+'"></i>';return s+'</div>'}
function trialName(){
var attempts=0;
card.innerHTML=shell("What's your name?",'Identity is important. Apparently. Type whatever you believe the truth to be.','<form class="bp-form" id="bpNameForm"><input id="bpNameInput" autocomplete="name" placeholder="Your alleged name" aria-label="Your name"><button class="bp-primary" type="submit">Verify identity</button></form>'+dots(4,0));
var input=q('#bpNameInput'),form=q('#bpNameForm');input.focus();
form.addEventListener('submit',function(e){e.preventDefault();attempts++;qa('.bp-dot').forEach(function(d,i){d.classList.toggle('on',i<attempts)});if(attempts===1)feedback('Incorrect. Statistically unlikely, but incorrect.');else if(attempts===2)feedback('Still not your name. The computer is becoming concerned.');else if(attempts===3)feedback('Almost. Please try being yourself one more time.');else pass('IDENTITY CONFIRMED. Persistence is apparently biometric.');tone(150+attempts*30,.08,'square',.016,0);input.select()})
}
var nonsense=['A wet helmet','Tuesday','The left pedal','An emotionally available disc wheel','A banana at 42 km/h','The concept of tapering','One suspicious sock','Carbon, but spiritually'];
function randomLabels(){return nonsense.slice().sort(function(){return Math.random()-.5}).slice(0,4)}
function trialConsistency(){
var last=-1,streak=0,labels=randomLabels();
function draw(){var inner='<div class="bp-grid4">';labels.forEach(function(x,i){inner+='<button type="button" class="bp-choice" data-pos="'+i+'">'+x+'<small>quantum-safe option '+(i+1)+'</small></button>'});inner+='</div>'+dots(3,streak);card.innerHTML=shell('Choose the safest answer.','The words are carefully generated nonsense. The machine is studying something else.',inner);qa('[data-pos]').forEach(function(b){b.onclick=function(){choose(+b.dataset.pos)}})}
function choose(pos){if(pos===last)streak++;else{last=pos;streak=1}if(streak>=3){pass('CONSISTENCY ACCEPTED. Meaning was unnecessary. Commitment was not.');return}labels=randomLabels();draw();feedback(streak===2?'Unreasonable confidence detected. Interesting.':'Choice recorded. Content discarded.');tone(250+streak*80,.08,'triangle',.016,0)}
draw()
}
var oddQuestions=['Is carbon a vegetable?','Can a bicycle sense betrayal?','Are white socks objectively faster?','Does the aero helmet know what you did?','Is Tuesday UCI legal?','Could a koala finish Nice?'];
function trialRhythm(){
var previous=null,streak=0,qi=0;
function ask(){var question=oddQuestions[qi++%oddQuestions.length];card.innerHTML=shell(question,'The system has strong opinions about rhythm and no opinions about your opinion.','<div class="bp-grid2"><button type="button" class="bp-choice" data-side="0">Absolutely<small>probably</small></button><button type="button" class="bp-choice" data-side="1">Absolutely not<small>also probably</small></button></div>'+dots(5,streak));qa('[data-side]').forEach(function(b){b.onclick=function(){tap(+b.dataset.side)}})}
function tap(side){if(previous===null||side!==previous)streak++;else streak=1;previous=side;if(streak>=5){pass('RHYTHM VERIFIED. Your beliefs were deleted for efficiency.');return}ask();feedback(streak===1?'Opinion stored nowhere.':'Pattern coherence increasing.');tone(side?390:290,.07,'square',.014,0)}
ask()
}
function trialRestraint(){
var presses=0;
card.innerHTML=shell('Press the button to continue.','This instruction has been independently reviewed by absolutely nobody.','<div class="bp-red-wrap"><button type="button" class="bp-red" id="bpRed">Press to<br>continue</button></div>');
var red=q('#bpRed');
function arm(){if(restraintTimer)clearTimeout(restraintTimer);restraintTimer=setTimeout(function(){pass('RESTRAINT VERIFIED. Doing nothing was the correct amount of effort.')},5200)}
red.onclick=function(){presses++;arm();sting();feedback(presses===1?'Excellent. You have successfully demonstrated impatience.':presses===2?'Again. Admirably committed to the wrong activity.':'The button remains delighted. The test does not.')};
arm();later(3000,function(){if(step===3&&presses===0)feedback('Klaus is becoming suspiciously impressed.')})
}
function makeSequence(){var a=[];while(a.length<5){var n=Math.floor(Math.random()*4);if(!a.length||n!==a[a.length-1])a.push(n)}return a}
function trialMemory(){
memorySequence=makeSequence();memoryLocked=true;
card.innerHTML=shell('Repeat the sacred combination.','Watch the guardians. Then reproduce the pattern. Their identities remain administratively irrelevant.','<div class="bp-memory"><button type="button" class="bp-choice" data-m="0">KLAUS<small>questionable authority</small></button><button type="button" class="bp-choice" data-m="1">VALENTINO<small>ceremonial cheekbones</small></button><button type="button" class="bp-choice" data-m="2">BOO<small>compliance department</small></button><button type="button" class="bp-choice" data-m="3">THE DOOR<small>management</small></button></div><button type="button" class="bp-mini" id="bpReplay" style="margin-top:14px">Replay combination</button>');
var buttons=qa('[data-m]'),entered=[];
function play(){memoryLocked=true;entered=[];clearTimers();buttons.forEach(function(b){b.classList.remove('lit')});feedback('Observe.');memorySequence.forEach(function(idx,k){later(350+k*620,function(){buttons[idx].classList.add('lit');tone(300+idx*110,.16,'sine',.016,0);later(300,function(){if(buttons[idx])buttons[idx].classList.remove('lit')})})});later(350+memorySequence.length*620,function(){memoryLocked=false;feedback('Your turn.')})}
buttons.forEach(function(b){b.onclick=function(){if(memoryLocked)return;var idx=+b.dataset.m;b.classList.add('lit');later(160,function(){b.classList.remove('lit')});if(idx===memorySequence[entered.length]){entered.push(idx);tone(420+idx*80,.08,'triangle',.016,0);if(entered.length===memorySequence.length){memoryLocked=true;pass('COMBINATION ACCEPTED. The door regrets this decision.')}else feedback('Pattern holding.')}else{entered=[];sting();feedback('Pattern collapsed. Answers remain blameless. Replaying.');later(700,play)}}});
q('#bpReplay').onclick=play;play()
}
function unlock(){
clearTimers();trials.classList.remove('on');gate.classList.add('bp-unlocked');stage.classList.add('bp-unlocked');flash();freehub();clunk();tone(420,.6,'sine',.02,.18);tone(820,.8,'sine',.018,.45);
try{sessionStorage.setItem(ACCESS_KEY,'granted')}catch(_){}
later(2400,function(){gate.style.transition='opacity .8s ease';gate.style.opacity='0';later(850,function(){gate.remove()})})
}
start.onclick=startIntro;
skip.onclick=beginTrials;
soundBtn.onclick=function(){soundOn=!soundOn;soundBtn.textContent=soundOn?'Sound on':'Sound off';if(soundOn){audioInit();if(ctx)ctx.resume().catch(function(){});tone(520,.08,'sine',.02,0)}};
addEventListener('keydown',function(e){if(e.key==='Escape'&&intro)beginTrials()})
})();