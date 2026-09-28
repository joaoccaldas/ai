(()=> {
  if (new URLSearchParams(location.search).get('gate') === 'off') return;
  if (sessionStorage.getItem('wyld.bikeporn.unlocked') === '1') return;

  document.body.classList.add('gate-active');

  const gate = document.createElement('section');
  gate.id = 'bpGate';
  gate.setAttribute('aria-label','Bike Porn initiation');
  gate.innerHTML =
    '<div class="bp-stage" id="bpStage">' +
      '<div class="bp-curtain left"></div><div class="bp-curtain right"></div>' +
      '<div class="bp-proscenium"></div><div class="bp-floor"></div><div class="bp-glow"></div>' +
      '<div class="bp-door-frame"><div class="bp-door-label">5D QUANTUM VAULT · PATENT EXTREMELY PENDING</div><div class="bp-door"><div class="bp-leaf left"></div><div class="bp-leaf right"></div></div><div class="bp-knocker"></div></div>' +
      '<div class="bp-header"><span class="bp-mark">WYLD · Restricted archive</span><div class="bp-tools"><button class="bp-mini" id="bpSkip" type="button">Skip ceremony</button></div></div>' +
      '<div class="bp-landing" id="bpLanding"><div class="bp-kicker">Hyper-secret content beyond this point</div><h1>BIKE PORN</h1><p>Protected by the world’s first 5D quantum-computer initiation protocol. Five impossible trials. Zero meaningful answers.</p><button class="bp-start" id="bpStart" type="button">Begin questionable security procedure</button></div>' +
      '<div class="bp-actor bp-koala" id="bpKlaus" aria-hidden="true"><i class="ear l"></i><i class="ear r"></i><i class="head"></i><i class="eye l"></i><i class="eye r"></i><i class="nose"></i><i class="body"></i><i class="bow"></i></div>' +
      '<div class="bp-actor bp-alien" id="bpAlien" aria-hidden="true"><i class="head"></i><i class="eye l"></i><i class="eye r"></i><i class="torso"></i><i class="leg l"></i><i class="leg r"></i><i class="ring"></i></div>' +
      '<div class="bp-actor bp-ghost" id="bpGhost" aria-hidden="true"><i class="head"></i><i class="eye l"></i><i class="eye r"></i><i class="sheet"></i><i class="clipboard"></i></div>' +
      '<div class="bp-sigils" id="bpSigils"><i class="bp-sig"></i><i class="bp-sig"></i><i class="bp-sig"></i><i class="bp-sig"></i><i class="bp-sig"></i></div>' +
      '<div class="bp-dialogue" id="bpDialogue" hidden><span class="who"></span><span class="line"></span></div>' +
      '<div class="bp-trials" id="bpTrials"><div class="bp-card" id="bpCard"></div></div>' +
      '<div class="bp-unlock"><div><b>ACCESS GRANTED</b><span>Questionable decision-making verified</span></div></div>' +
      '<div class="bp-flash" id="bpFlash"></div>' +
    '</div>';

  document.body.appendChild(gate);

  const stage = gate.querySelector('#bpStage');
  const landing = gate.querySelector('#bpLanding');
  const klaus = gate.querySelector('#bpKlaus');
  const alien = gate.querySelector('#bpAlien');
  const ghost = gate.querySelector('#bpGhost');
  const dialogue = gate.querySelector('#bpDialogue');
  const trials = gate.querySelector('#bpTrials');
  const card = gate.querySelector('#bpCard');
  const sigils = [...gate.querySelectorAll('.bp-sig')];
  const flash = gate.querySelector('#bpFlash');

  let introToken = 0;
  let step = 0;

  const wait = ms => new Promise(r => setTimeout(r, ms));

  function doFlash(){
    flash.classList.remove('go');
    void flash.offsetWidth;
    flash.classList.add('go');
  }

  async function line(who, text, ms){
    dialogue.hidden = false;
    dialogue.querySelector('.who').textContent = who;
    dialogue.querySelector('.line').textContent = text;
    await wait(ms || 2500);
  }

  async function runIntro(){
    const token = ++introToken;
    landing.classList.add('hidden');
    stage.classList.add('bp-intro');

    await wait(900);
    if(token!==introToken) return;
    klaus.classList.add('in');
    await line('Klaus · Master of Ceremonies','WELCOME. Please remain calm. The champagne is part of the encryption.',2900);

    if(token!==introToken) return;
    alien.classList.add('in');
    await line('Klaus','Valentino will now present the Sacred Ring. It is absolutely not just a chainring tonight.',3000);

    if(token!==introToken) return;
    doFlash();
    ghost.classList.add('in');
    await line('Boo · Compliance','AAAAAH. Sorry. Administrative jump-scare. You must complete five impossible trials.',3000);

    if(token!==introToken) return;
    gate.querySelector('#bpSigils').classList.add('on');
    sigils.forEach((s,i)=>setTimeout(()=>s.classList.add('pulse'),i*240));
    await line('Klaus','Important: the answers do not matter. Your behaviour does. This is somehow considered safer.',3200);

    if(token!==introToken) return;
    await line('Klaus','Good luck. Confidence has never helped, but it photographs beautifully.',2800);

    if(token!==introToken) return;
    stage.classList.add('bp-chaos');
    doFlash();
    await wait(1200);
    showTrial();
  }

  function progress(){
    return '<div class="bp-pattern">' + [0,1,2,3,4].map((_,i)=>'<i class="bp-dot '+(i<step?'on':'')+'"></i>').join('') + '</div>';
  }

  function shell(title, help, body){
    card.innerHTML = '<div class="bp-step">Quantum trial '+(step+1)+' / 5</div><h2>'+title+'</h2><p class="bp-help">'+help+'</p>'+body+progress();
  }

  function advance(){
    step++;
    if(step>=5){ unlock(); return; }
    sigils[step-1]?.classList.add('pulse');
    showTrial();
  }

  function showTrial(){
    introToken++;
    dialogue.hidden = true;
    landing.classList.add('hidden');
    trials.classList.add('on');
    if(step===0) trialName();
    if(step===1) trialConsistency();
    if(step===2) trialMemory();
    if(step===3) trialRestraint();
    if(step===4) trialDisobedience();
  }

  function trialName(){
    let attempts = 0;
    shell('What’s your name?','A basic identity check. Finally, something sensible.',
      '<form class="bp-form" id="nameForm"><input id="nameInput" autocomplete="name" aria-label="Your name" placeholder="Your name"><button class="bp-primary" type="submit">Verify identity</button></form><div class="bp-feedback" id="feedback"></div>');
    const form=card.querySelector('#nameForm');
    const input=card.querySelector('#nameInput');
    const feedback=card.querySelector('#feedback');
    input.focus();
    form.addEventListener('submit',e=>{
      e.preventDefault();
      attempts++;
      if(attempts===1){feedback.textContent='Incorrect. That is apparently not your name.';input.select();return;}
      if(attempts===2){feedback.textContent='Still incorrect. Excellent persistence.';input.select();return;}
      if(attempts===3){feedback.textContent='Wrong again. The quantum computer is becoming emotionally invested.';input.select();return;}
      feedback.textContent='Correct. Obviously. Identity verified by persistence.';
      setTimeout(advance,900);
    });
  }

  function trialConsistency(){
    let last = null;
    let streak = 0;
    shell('Which one is fastest?','There is no useful information. Security recommends confidence.',
      '<div class="bp-grid4">'+
      ['Emotionally aerodynamic','Probably illegal in Belgium','Has excellent cheekbones','Thursday'].map((x,i)=>'<button class="bp-choice" type="button" data-i="'+i+'">'+x+'<small>quantum-certified answer</small></button>').join('')+
      '</div><div class="bp-feedback" id="feedback"></div>');
    const feedback=card.querySelector('#feedback');
    card.querySelectorAll('.bp-choice').forEach(btn=>btn.addEventListener('click',()=>{
      const v=btn.dataset.i;
      if(v===last) streak++; else { last=v; streak=1; }
      if(streak===1) feedback.textContent='Interesting. The computer disagrees.';
      if(streak===2) feedback.textContent='Again? That level of confidence is concerning.';
      if(streak>=3){feedback.textContent='Consistency detected. Security compromised.';setTimeout(advance,900);}
    }));
  }

  function trialMemory(){
    let made = [];
    let repeat = [];
    let phase = 'make';
    shell('Invent the password.','Press any three symbols. Then repeat your own sequence exactly.',
      '<div class="bp-memory">'+['◌','△','✦','∞'].map((s,i)=>'<button class="bp-choice" type="button" data-i="'+i+'">'+s+'</button>').join('')+'</div><div class="bp-feedback" id="feedback">Create a three-symbol sequence.</div>');
    const feedback=card.querySelector('#feedback');
    card.querySelectorAll('.bp-choice').forEach(btn=>btn.addEventListener('click',()=>{
      const v=btn.dataset.i;
      if(phase==='make'){
        made.push(v);
        feedback.textContent='Your sequence: '+made.map(i=>['◌','△','✦','∞'][i]).join(' · ');
        if(made.length===3){ phase='repeat'; feedback.textContent='Good. Now repeat exactly what you just invented.'; }
        return;
      }
      repeat.push(v);
      const idx=repeat.length-1;
      if(repeat[idx]!==made[idx]){
        repeat=[];
        feedback.textContent='No. That was your own password. Start the repeat again.';
        return;
      }
      feedback.textContent='Repeat: '+repeat.map(i=>['◌','△','✦','∞'][i]).join(' · ');
      if(repeat.length===3){feedback.textContent='Memory detected. Mildly suspicious.';setTimeout(advance,900);}
    }));
  }

  function trialRestraint(){
    let timer = null;
    let left = 5;
    shell('ACT IMMEDIATELY.','Press the button before the security window closes.',
      '<div class="bp-grid2"><button class="bp-primary" id="actNow" type="button">DO SOMETHING</button><button class="bp-choice" disabled>Security window: <strong id="count">5</strong></button></div><div class="bp-feedback" id="feedback">Quickly. Probably.</div>');
    const btn=card.querySelector('#actNow');
    const count=card.querySelector('#count');
    const feedback=card.querySelector('#feedback');
    function start(){
      clearInterval(timer);
      left=5;count.textContent=left;
      timer=setInterval(()=>{
        left--;count.textContent=left;
        if(left<=0){
          clearInterval(timer);
          feedback.textContent='Restraint verified. Doing nothing was correct.';
          setTimeout(advance,900);
        }
      },1000);
    }
    btn.addEventListener('click',()=>{
      clearInterval(timer);
      btn.disabled=true;
      feedback.textContent='Too eager. Resetting your opportunity to do absolutely nothing.';
      setTimeout(()=>{btn.disabled=false;start();},1100);
    });
    start();
  }

  function trialDisobedience(){
    shell('Final instruction.','DO NOT press the red button. The entire encryption depends on this.',
      '<div class="bp-red-wrap"><button class="bp-red" id="redButton" type="button">DO NOT<br>PRESS</button></div><div class="bp-feedback" id="feedback">This is not reverse psychology.</div>');
    const btn=card.querySelector('#redButton');
    const feedback=card.querySelector('#feedback');
    btn.addEventListener('click',()=>{
      btn.disabled=true;
      feedback.textContent='Disobedience verified. Perfect candidate.';
      setTimeout(advance,700);
    });
  }

  async function unlock(){
    trials.classList.remove('on');
    stage.classList.add('bp-unlocked');
    doFlash();
    sessionStorage.setItem('wyld.bikeporn.unlocked','1');
    await wait(900);
    await line('Klaus','Against every mathematical prediction... you passed.',1500);
    dialogue.hidden=true;
    await wait(300);
    gate.remove();
    document.body.classList.remove('gate-active');
  }

  gate.querySelector('#bpStart').addEventListener('click',runIntro);
  gate.querySelector('#bpSkip').addEventListener('click',()=>{introToken++;showTrial();});
})();