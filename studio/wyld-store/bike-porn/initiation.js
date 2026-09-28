(() => {
'use strict';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const passedKey = 'wyld.bikeporn.initiated.v4';

const root = document.createElement('div');
root.className = 'wyld-init';
root.setAttribute('role', 'dialog');
root.setAttribute('aria-modal', 'true');
root.setAttribute('aria-label', 'Bike Porn initiation ceremony');
root.innerHTML = `
  <div class="wyld-init__stage" id="wiStage">
    <div class="wyld-init__curtain wyld-init__curtain--l"></div>
    <div class="wyld-init__curtain wyld-init__curtain--r"></div>
    <div class="wyld-init__arch"></div>
    <div class="wyld-init__light"></div>
    <div class="wyld-init__fog"></div>
    <div class="wyld-init__title"><b>BIKE PORN</b><small>ceremonial access division</small></div>
    <div class="wyld-init__door" id="wiDoor"></div>
    <div class="wyld-init__vanilla">VANILLA PROTOCOL · LEVEL 5 · DO NOT FLAVOUR</div>

    <svg class="wyld-init__character wyld-init__koala" viewBox="0 0 220 260" aria-label="Klaus, the koala master of ceremonies">
      <ellipse class="ear" cx="55" cy="65" rx="39" ry="42"/><ellipse class="ear" cx="165" cy="65" rx="39" ry="42"/>
      <ellipse class="inner" cx="55" cy="66" rx="21" ry="24"/><ellipse class="inner" cx="165" cy="66" rx="21" ry="24"/>
      <ellipse class="head" cx="110" cy="90" rx="69" ry="64"/><ellipse class="body" cx="110" cy="187" rx="62" ry="68"/>
      <circle class="eye" cx="86" cy="82" r="7"/><circle class="eye" cx="136" cy="82" r="7"/><ellipse class="nose" cx="110" cy="103" rx="17" ry="13"/>
      <path class="shirt" d="M87 144h46l-6 63H92z"/><path class="tux" d="M47 144h43l10 76H59zM130 144h43l-12 76h-41z"/>
      <path class="bow" d="M93 149l17 10-17 10-15-10zM127 149l-17 10 17 10 15-10z"/>
      <path class="glass" d="M174 157h28l-5 28c-2 9-16 9-18 0zM188 186v29M177 215h23"/>
    </svg>

    <svg class="wyld-init__character wyld-init__alien" viewBox="0 0 170 310" aria-label="Valentino, the ceremonial alien supermodel">
      <ellipse class="skin" cx="85" cy="52" rx="34" ry="46"/><ellipse class="eye" cx="72" cy="50" rx="9" ry="4"/><ellipse class="eye" cx="99" cy="50" rx="9" ry="4"/>
      <path class="coat" d="M61 91h48l23 128-33 6-14-72-14 72-33-6z"/><path class="skin" d="M60 100l-25 112 12 4 34-102zM110 100l25 112-12 4-34-102z"/>
      <path class="coat" d="M72 217h20l5 90H77zM98 217h20l-3 90H95z"/><circle class="ring" cx="85" cy="155" r="27"/>
    </svg>

    <svg class="wyld-init__character wyld-init__ghost" viewBox="0 0 170 220" aria-label="Boo, the compliance ghost">
      <path class="sheet" d="M84 12c-39 0-63 28-63 64v114l18-17 18 19 18-18 18 20 18-20 18 18 20-19V76c0-36-25-64-65-64z"/>
      <ellipse class="eye" cx="63" cy="75" rx="10" ry="15"/><ellipse class="eye" cx="106" cy="75" rx="10" ry="15"/><rect class="clip" x="112" y="119" width="38" height="54" rx="4"/>
    </svg>

    <div class="wyld-init__caption" aria-live="polite">
      <div class="wyld-init__speaker" id="wiSpeaker"></div>
      <div class="wyld-init__line" id="wiLine"></div>
    </div>
    <div class="wyld-init__controls"><button type="button" id="wiSkip">Skip ceremony</button></div>
  </div>

  <div class="wyld-init__start" id="wiStart">
    <div class="wyld-init__startbox">
      <small>Hyper-secret archive</small>
      <h2>Bike Porn</h2>
      <p>First-generation 5D quantum encryption. Patent pending. Good judgement not required.</p>
      <button type="button" id="wiBegin">Begin initiation</button>
    </div>
  </div>

  <div class="wyld-init__trials" id="wiTrials">
    <div class="wyld-init__trial" id="wiTrial"></div>
  </div>
`;
document.body.appendChild(root);

const $ = s => root.querySelector(s);
const stage = $('#wiStage');
const door = $('#wiDoor');
const speaker = $('#wiSpeaker');
const line = $('#wiLine');
const trials = $('#wiTrials');
const trialBox = $('#wiTrial');
const wait = ms => new Promise(resolve => setTimeout(resolve, reduced ? Math.min(ms, 120) : ms));

let skipped = false;
let ceremonyFinished = false;
let audioCtx = null;
let step = 0;
const state = {
  nameAttempts: 0,
  sameChoice: null,
  sameCount: 0,
  rhythm: [],
  rhythmMisses: 0,
  restraintInterval: null,
  restraintCleanup: null
};

function beep(freq = 220, duration = .08, type = 'sine', gain = .025) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const vol = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.value = gain;
    osc.connect(vol).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

function say(who, html) {
  speaker.textContent = who;
  line.innerHTML = html;
}

async function ceremony() {
  $('#wiStart').classList.add('is-gone');
  root.classList.add('is-open');
  await wait(900);

  beep(160, .12, 'triangle', .035);
  root.classList.add('is-lit');
  say('THE BUILDING', 'You were <em>not supposed to find this.</em>');
  await wait(2200);
  if (skipped) return beginTrials();

  root.classList.add('show-koala');
  beep(90, .18, 'sawtooth', .03);
  say('KLAUS · MASTER OF CEREMONIES', 'WELCOME. I am Klaus. This is a very serious initiation.');
  await wait(3500);
  if (skipped) return beginTrials();

  say('KLAUS', 'Please ignore the champagne. It is <em>ceremonial hydration.</em>');
  await wait(2500);
  if (skipped) return beginTrials();

  root.classList.add('show-alien');
  say('KLAUS', 'Valentino will now present the Sacred Ring.');
  await wait(2300);
  if (skipped) return beginTrials();

  say('VALENTINO', '…');
  await wait(1100);
  say('KLAUS', 'Exactly.');
  await wait(900);
  if (skipped) return beginTrials();

  stage.classList.add('wyld-init__jolt');
  beep(52, .34, 'square', .05);
  root.classList.add('show-ghost');
  say('BOO', 'AAAAAAAH.');
  await wait(750);
  root.classList.add('settle-ghost');
  say('BOO · COMPLIANCE', 'Sorry. Mandatory jump-scare acknowledgement.');
  await wait(2300);
  if (skipped) return beginTrials();

  say('KLAUS', 'Five impossible tasks stand between you and the archive.');
  await wait(2200);
  say('BOO', 'For legal purposes, the system absolutely cares about your answers.');
  await wait(2000);
  say('KLAUS', 'It does not.');
  await wait(800);
  if (skipped) return beginTrials();

  door.classList.add('is-armed');
  beep(420, .12, 'sine', .035);
  await wait(240);
  beep(520, .12, 'sine', .035);
  await wait(240);
  beep(640, .2, 'sine', .04);

  say('KLAUS', 'First question. <em>What’s your name?</em>');
  await wait(1900);
  beginTrials();
}

function beginTrials() {
  if (ceremonyFinished) return;
  ceremonyFinished = true;
  trials.classList.add('is-on');
  renderTrial();
}

function progressDots() {
  return '<div class="wyld-init__dots">' +
    [0,1,2,3,4].map((_, i) => '<i class="' + (i < step ? 'on' : '') + '"></i>').join('') +
    '</div>';
}

function shell(number, title, body, inner, extraClass = '') {
  return '<div class="' + extraClass + '">' +
    '<div class="wyld-init__trial-count">Quantum trial ' + number + ' of 5</div>' +
    progressDots() +
    '<h2>' + title + '</h2>' +
    '<p>' + body + '</p>' +
    inner +
    '<div class="wyld-init__feedback" id="wiFeedback" aria-live="polite"></div>' +
    '</div>';
}

function feedback(text) {
  const node = $('#wiFeedback');
  if (node) node.textContent = text;
}

function nextTrial() {
  step += 1;
  renderTrial();
}

function renderTrial() {
  if (state.restraintCleanup) {
    state.restraintCleanup();
    state.restraintCleanup = null;
  }

  if (step === 0) {
    trialBox.innerHTML = shell(
      1,
      'What’s your name?',
      'The simplest identity check ever designed. Therefore, our most advanced.',
      '<input id="wiName" autocomplete="off" maxlength="80" placeholder="Your definitely real name">' +
      '<br><button class="primary" id="wiNameGo">Submit identity</button>'
    );

    const input = $('#wiName');
    input.focus();

    const submit = () => {
      state.nameAttempts += 1;
      if (state.nameAttempts === 1) feedback('Incorrect. That is not your name.');
      else if (state.nameAttempts === 2) feedback('Still wrong. Bold strategy.');
      else if (state.nameAttempts === 3) feedback('No. The computer seems oddly certain about this.');
      else {
        feedback('Correct. Apparently you remembered.');
        beep(660, .16, 'sine', .03);
        setTimeout(nextTrial, reduced ? 100 : 750);
      }
      if (state.nameAttempts < 4) {
        beep(120, .1, 'square', .022);
        input.select();
      }
    };

    $('#wiNameGo').onclick = submit;
    input.onkeydown = event => { if (event.key === 'Enter') submit(); };
    return;
  }

  if (step === 1) {
    trialBox.innerHTML = shell(
      2,
      'Choose the correct answer.',
      'We cannot tell you the question. That would compromise security.',
      '<div class="wyld-init__choices">' +
        '<button data-choice="disc">Disc wheel</button>' +
        '<button data-choice="koala">Klaus</button>' +
        '<button data-choice="moon">The moon</button>' +
        '<button data-choice="sandwich">A sandwich</button>' +
      '</div>'
    );

    trialBox.querySelectorAll('[data-choice]').forEach(button => {
      button.onclick = () => {
        const choice = button.dataset.choice;
        if (state.sameChoice === choice) state.sameCount += 1;
        else {
          state.sameChoice = choice;
          state.sameCount = 1;
        }

        if (state.sameCount === 1) feedback('Interesting. Choose again.');
        else if (state.sameCount === 2) feedback('Again. Do not develop character now.');
        else {
          feedback('Consistency detected. Deeply suspicious. Accepted.');
          beep(520, .14, 'triangle', .028);
          setTimeout(nextTrial, reduced ? 100 : 700);
        }
      };
    });
    return;
  }

  if (step === 2) {
    let sequence = [];
    let repeat = [];
    let phase = 'create';
    const glyphs = ['◌','△','✦','∞'];

    trialBox.innerHTML = shell(
      3,
      'Invent the password.',
      'Choose any three symbols. The symbols do not matter. Remember the pattern you create.',
      '<div class="wyld-init__choices">' +
        glyphs.map((g, i) => '<button data-symbol="' + i + '">' + g + '</button>').join('') +
      '</div>'
    );

    trialBox.querySelectorAll('[data-symbol]').forEach(button => {
      button.onclick = () => {
        const symbol = button.dataset.symbol;

        if (phase === 'create') {
          sequence.push(symbol);
          feedback('Your sequence: ' + sequence.map(i => glyphs[i]).join(' · '));

          if (sequence.length === 3) {
            phase = 'repeat';
            feedback('Good. Now repeat exactly what you just invented.');
          }
          return;
        }

        repeat.push(symbol);
        const index = repeat.length - 1;

        if (repeat[index] !== sequence[index]) {
          repeat = [];
          feedback('Wrong. It was your own password. Start the repeat again.');
          beep(115, .08, 'square', .018);
          return;
        }

        feedback('Repeat: ' + repeat.map(i => glyphs[i]).join(' · '));

        if (repeat.length === 3) {
          feedback('Pattern memory verified. Mildly suspicious.');
          beep(740, .2, 'triangle', .03);
          setTimeout(nextTrial, reduced ? 100 : 800);
        }
      };
    });
    return;
  }

  if (step === 3) {
    trialBox.innerHTML = shell(
      4,
      'Do absolutely nothing.',
      'Five seconds. No clicking. No typing. No heroic intervention.',
      '<div class="wyld-init__dont" id="wiCountdown">5</div>'
    );

    let left = 5;
    const countdown = $('#wiCountdown');
    let armed = false;

    const reset = () => {
      if (!armed) return;
      left = 5;
      countdown.textContent = left;
      feedback('You did something. Admirable. Incorrect.');
      beep(105, .08, 'square', .018);
    };

    const timer = setInterval(() => {
      left -= 1;
      countdown.textContent = left;

      if (left <= 0) {
        clearInterval(timer);
        window.removeEventListener('pointerdown', reset, true);
        window.removeEventListener('keydown', reset, true);
        feedback('Restraint detected. Disturbing. Accepted.');
        setTimeout(nextTrial, reduced ? 100 : 700);
      }
    }, reduced ? 90 : 1000);

    setTimeout(() => { armed = true; }, reduced ? 10 : 250);
    window.addEventListener('pointerdown', reset, true);
    window.addEventListener('keydown', reset, true);

    state.restraintCleanup = () => {
      clearInterval(timer);
      window.removeEventListener('pointerdown', reset, true);
      window.removeEventListener('keydown', reset, true);
    };
    return;
  }

  if (step === 4) {
    trialBox.innerHTML = shell(
      5,
      'FINAL QUANTUM TEST',
      'Do not press the red button.',
      '<button class="wyld-init__red" id="wiRed" aria-label="Forbidden red button"></button>' +
      '<p style="margin-top:20px;font-size:12px">Seriously. We have paperwork.</p>'
    );

    $('#wiRed').onclick = () => {
      feedback('Disobedience confirmed. Personality verification complete.');
      beep(92, .3, 'sawtooth', .045);
      setTimeout(unlock, reduced ? 120 : 900);
    };
  }
}

async function unlock() {
  if (state.restraintCleanup) state.restraintCleanup();
  trials.classList.remove('is-on');
  root.classList.add('wyld-init__unlock', 'show-koala', 'show-alien', 'show-ghost', 'settle-ghost', 'is-lit', 'is-open');
  door.classList.add('is-armed');

  say('KLAUS', 'Against every mathematical prediction… <em>you passed.</em>');
  await wait(900);
  door.classList.add('is-open');
  beep(330, .15, 'triangle', .03);
  await wait(450);
  beep(440, .15, 'triangle', .03);
  await wait(450);
  beep(660, .22, 'triangle', .035);
  say('BOO · COMPLIANCE', 'Access granted by questionable decision-making.');
  await wait(1400);

  root.style.transition = 'opacity .8s';
  root.style.opacity = '0';
  await wait(800);
  root.remove();
}

$('#wiBegin').addEventListener('click', ceremony);
$('#wiSkip').addEventListener('click', () => {
  skipped = true;
  beginTrials();
});

if (params.has('trials')) {
  $('#wiStart').classList.add('is-gone');
  beginTrials();
}
})();