(() => {
'use strict';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const passedKey = 'wyld.bikeporn.initiated.v4';

const root = document.createElement('div');
root.className = 'wyld-init';
root.setAttribute('role', 'dialog');
root.setAttribute('aria-modal', 'true');
root.setAttribute('aria-label', 'Bike Porn access trials');
root.innerHTML = `
  <div class="wyld-init__stage" id="wiStage">
    <div class="wyld-init__curtain wyld-init__curtain--l"></div>
    <div class="wyld-init__curtain wyld-init__curtain--r"></div>
    <div class="wyld-init__arch"></div>
    <div class="wyld-init__light"></div>
    <div class="wyld-init__fog"></div>
    <div class="wyld-init__title"><b>BIKE PORN</b><small>archive access division</small></div>
    <div class="wyld-init__door" id="wiDoor"></div>
    <div class="wyld-init__vanilla">VANILLA PROTOCOL · LEVEL 5 · DO NOT FLAVOUR</div>

    <div class="wyld-init__caption" aria-live="polite">
      <div class="wyld-init__speaker" id="wiSpeaker"></div>
      <div class="wyld-init__line" id="wiLine"></div>
    </div>
  </div>

  <div class="wyld-init__start" id="wiStart">
    <div class="wyld-init__startbox">
      <small>Hyper-secret archive</small>
      <h2>Bike Porn</h2>
      <p>First-generation 5D quantum encryption. Patent pending. Good judgement not required.</p>
      <button type="button" id="wiBegin">Begin trials</button>
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

let trialsStarted = false;
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

function beginTrials() {
  if (trialsStarted) return;
  trialsStarted = true;
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
    state.rhythm = [];
    state.rhythmMisses = 0;

    trialBox.innerHTML = shell(
      3,
      'The Vanilla Protocol',
      'Vanilla is the highest known state of 5D encryption. Two tastes. Let it breathe. One final taste.',
      '<div class="wyld-init__choices">' +
        '<button data-flavour>Vanilla</button>' +
        '<button data-flavour>Chain lube</button>' +
        '<button data-flavour>Fear</button>' +
        '<button data-flavour>Tuesday</button>' +
      '</div>',
      'wyld-init__vanilla-card'
    );

    trialBox.querySelectorAll('[data-flavour]').forEach(button => {
      button.onclick = () => {
        const now = performance.now();
        state.rhythm.push(now);
        if (state.rhythm.length > 3) state.rhythm.shift();

        if (state.rhythm.length === 1) {
          feedback('Taste registered. Again.');
          return;
        }
        if (state.rhythm.length === 2) {
          feedback('Now let the vanilla breathe.');
          return;
        }

        const quickPair = state.rhythm[1] - state.rhythm[0] < 900;
        const deliberatePause = state.rhythm[2] - state.rhythm[1] > 950;
        if (quickPair && deliberatePause) {
          feedback('VANILLA STATE ACHIEVED. Nobody knows what this means.');
          beep(740, .2, 'triangle', .03);
          setTimeout(nextTrial, reduced ? 100 : 800);
          return;
        }

        state.rhythmMisses += 1;
        feedback(state.rhythmMisses < 2
          ? 'Too eager. Vanilla requires emotional spacing.'
          : 'Hint from Valentino: two close together, then a dignified pause.');
        state.rhythm = [];
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
  root.classList.add('wyld-init__unlock', 'is-lit', 'is-open');
  door.classList.add('is-armed');

  say('ARCHIVE', 'Against every mathematical prediction… <em>you passed.</em>');
  await wait(900);
  door.classList.add('is-open');
  beep(330, .15, 'triangle', .03);
  await wait(450);
  beep(440, .15, 'triangle', .03);
  await wait(450);
  beep(660, .22, 'triangle', .035);
  say('ARCHIVE', 'Access granted by questionable decision-making.');
  await wait(1400);

  root.style.transition = 'opacity .8s';
  root.style.opacity = '0';
  await wait(800);
  root.remove();
}

$('#wiBegin').addEventListener('click', () => {
  $('#wiStart').classList.add('is-gone');
  beginTrials();
});

if (params.has('trials')) {
  $('#wiStart').classList.add('is-gone');
  beginTrials();
}
})();