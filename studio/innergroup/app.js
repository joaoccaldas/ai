(() => {
  'use strict';

  const PHASES = ['pre_work', 'live', 'post_work'];
  const LABELS = { pre_work: 'Pre-work', live: 'Live session', post_work: 'Post-work' };
  const PHASE_COPY = { pre_work: 'Pre-work is open', live: 'Live session is open', post_work: 'All phases are open' };
  const DEFAULT_CONFIG = {
    id: 'vattenfall_2026_09', current_phase: 'pre_work',
    workshop: { eyebrow: 'Inner Group · Vattenfall L&D', title: 'Leading from within', date: '14 September 2026', welcome: 'A private space to prepare, participate and continue the work after we meet.' },
    pre_work: { intro: 'Set aside ten quiet minutes. Watch the welcome and let the questions travel with you. There is nothing to submit.', video: { title: 'Before we begin', description: 'Linn and Maria introduce the intention for the workshop and invite you to arrive with curiosity rather than perfect answers.', embed_url: '', external_url: 'https://www.innergroup.se/' }, questions: ['When do you feel most grounded and effective at work?','What situations make it harder to act in line with what matters to you?','What does psychological safety look like in everyday behaviour?','What is one question you would like this workshop to help you explore?'] },
    live: { intro: 'Use this page as the quiet backbone of the day: your agenda, preparation prompts and live exercise in one place.', agenda: { title: 'The inner conditions for sustainable performance', description: 'A participatory journey from awareness to concrete behaviour, connecting personal self-leadership with the culture around us.', items: [] }, exercise: { title: 'What helps people thrive?', description: 'Join the live word cloud when invited by the facilitators.', external_url: 'https://www.mentimeter.com/' } },
    post_work: { intro: 'The workshop ends. The practice does not. Revisit the core ideas and choose one action that can survive a busy week.', summary: { title: 'The Seed and the Soil', text: 'We strengthen the person and the system together.', url: 'https://www.innergroup.se/' }, resources: [], feedback: { title: 'What should we keep, change or deepen?', description: 'Your feedback helps Inner Group improve the experience for future participants.', url: 'https://forms.google.com/' } }
  };

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  let config = DEFAULT_CONFIG;
  let currentPhase = 'pre_work';
  let activePanel = 'pre_work';
  let reflectionIndex = 0;

  const cleanPhase = value => PHASES.includes(value) ? value : null;
  const safeUrl = value => {
    if (!value || value === '#') return '#';
    try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'; }
    catch { return '#'; }
  };
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char]));
  const setText = (id, value) => { const el = document.getElementById(id); if (el && value != null) el.textContent = value; };
  const setLink = (id, value) => { const el = document.getElementById(id); if (el) el.href = safeUrl(value); };

  async function loadConfig() {
    try {
      const response = await fetch('./config/vattenfall.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      config = { ...DEFAULT_CONFIG, ...(await response.json()) };
    } catch (error) {
      console.warn('Using embedded workshop configuration.', error);
    }
    const override = cleanPhase(new URLSearchParams(location.search).get('adminphase'));
    currentPhase = override || cleanPhase(config.current_phase) || 'pre_work';
    activePanel = currentPhase;
    render();
  }

  function render() {
    document.title = `${config.workshop.title} · Inner Group`;
    $('#app').dataset.phase = currentPhase;
    setText('eyebrow', config.workshop.eyebrow);
    setText('workshopTitle', config.workshop.title);
    setText('workshopDate', config.workshop.date);
    setText('welcomeText', config.workshop.welcome);
    setText('preIntro', config.pre_work.intro);
    setText('videoTitle', config.pre_work.video.title);
    setText('videoDescription', config.pre_work.video.description);
    setLink('videoFallback', config.pre_work.video.external_url || config.pre_work.video.embed_url);
    setLink('videoTextLink', config.pre_work.video.external_url || config.pre_work.video.embed_url);
    setText('liveIntro', config.live.intro);
    setText('agendaTitle', config.live.agenda.title);
    setText('agendaDescription', config.live.agenda.description);
    setText('exerciseTitle', config.live.exercise.title);
    setText('exerciseDescription', config.live.exercise.description);
    setLink('exerciseFallback', config.live.exercise.external_url || config.live.exercise.embed_url);
    setText('postIntro', config.post_work.intro);
    setText('summaryTitle', config.post_work.summary.title);
    setText('summaryText', config.post_work.summary.text);
    setLink('summaryLink', config.post_work.summary.url);
    setText('feedbackTitle', config.post_work.feedback.title);
    setText('feedbackDescription', config.post_work.feedback.description);
    setLink('feedbackLink', config.post_work.feedback.url);
    renderReflections();
    renderAgenda();
    renderResources();
    updatePhaseUI();
    showPanel(activePanel, false);
  }

  function renderReflections() {
    const questions = config.pre_work.questions || [];
    $('#reflectionRail').innerHTML = questions.map((question, index) => `
      <article class="reflection-card" data-reflection="${index}">
        <span class="reflect-no">Reflection ${String(index + 1).padStart(2, '0')}</span>
        <blockquote>${escapeHtml(question)}</blockquote>
        <footer>Pause here. Carry the thought with you.</footer>
      </article>`).join('');
    setText('reflectionTotal', String(questions.length).padStart(2, '0'));
  }

  function renderAgenda() {
    const items = config.live.agenda.items || [];
    $('#agendaList').innerHTML = items.map(item => `
      <div class="agenda-item"><time>${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail || '')}</p></div></div>`).join('');
  }

  function renderResources() {
    const items = config.post_work.resources || [];
    $('#resourceGrid').innerHTML = items.map(item => `
      <a class="resource-card" href="${safeUrl(item.url)}" target="_blank" rel="noopener">
        <span class="resource-arrow">↗</span><span class="resource-icon">${escapeHtml(item.icon || '↗')}</span>
        <h5>${escapeHtml(item.title)}</h5><p>${escapeHtml(item.description || '')}</p>
      </a>`).join('');
  }

  function updatePhaseUI() {
    const unlockedIndex = PHASES.indexOf(currentPhase);
    const currentIndex = PHASES.indexOf(activePanel);
    setText('phaseChipLabel', PHASE_COPY[currentPhase]);
    setText('phaseCounter', `${String(currentIndex + 1).padStart(2, '0')} / 03`);
    setText('phaseStatus', PHASE_COPY[currentPhase]);

    $$('.phase-tab').forEach((button, index) => {
      const locked = index > unlockedIndex;
      button.disabled = locked;
      button.classList.toggle('is-active', button.dataset.phaseTarget === activePanel);
      $('.tab-state', button).textContent = locked ? 'Locked' : (button.dataset.phaseTarget === activePanel ? 'Viewing' : 'Open');
    });
    $$('.mobile-tabs button').forEach((button, index) => {
      const locked = index > unlockedIndex;
      button.disabled = locked;
      button.classList.toggle('is-active', button.dataset.mobileTarget === activePanel);
      const lock = $('i', button);
      if (lock) lock.textContent = locked ? 'Locked' : '';
    });
    $$('.phase-instrument li').forEach((item, index) => {
      item.classList.toggle('is-open', index <= unlockedIndex);
      item.classList.toggle('is-current', index === currentIndex);
    });
  }

  function showPanel(name, scroll = true) {
    const requestedIndex = PHASES.indexOf(name);
    if (requestedIndex > PHASES.indexOf(currentPhase)) {
      showToast(`${LABELS[name]} will open later.`);
      return;
    }
    activePanel = name;
    $$('.phase-panel').forEach(panel => {
      const active = panel.dataset.panel === name;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    updatePhaseUI();
    observeReveals();
    if (scroll) $('#workshop').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollReflection(direction) {
    const cards = $$('.reflection-card');
    reflectionIndex = Math.max(0, Math.min(cards.length - 1, reflectionIndex + direction));
    cards[reflectionIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setText('reflectionCurrent', String(reflectionIndex + 1).padStart(2, '0'));
  }

  function syncReflectionIndex() {
    const rail = $('#reflectionRail');
    const cards = $$('.reflection-card');
    const centre = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0, distance = Infinity;
    cards.forEach((card, index) => {
      const next = Math.abs(card.offsetLeft + card.clientWidth / 2 - centre);
      if (next < distance) { nearest = index; distance = next; }
    });
    reflectionIndex = nearest;
    setText('reflectionCurrent', String(nearest + 1).padStart(2, '0'));
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function observeReveals() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { $$('.reveal').forEach(el => el.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    $$('.reveal:not(.is-visible)').forEach(el => observer.observe(el));
  }

  function setupEvents() {
    $('#enterApp').addEventListener('click', () => $('#workshop').scrollIntoView({ behavior: 'smooth' }));
    $$('.phase-tab').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.phaseTarget)));
    $$('.mobile-tabs button').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.mobileTarget)));
    $('#phaseChip').addEventListener('click', () => showToast(PHASE_COPY[currentPhase]));
    $('#prevReflection').addEventListener('click', () => scrollReflection(-1));
    $('#nextReflection').addEventListener('click', () => scrollReflection(1));
    $('#reflectionRail').addEventListener('scroll', syncReflectionIndex, { passive: true });
    $('#reflectionRail').addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') scrollReflection(1);
      if (event.key === 'ArrowLeft') scrollReflection(-1);
    });
    $('#dismissBrowserNote').addEventListener('click', () => $('.browser-note').classList.add('is-hidden'));
    addEventListener('scroll', () => $('.topbar').classList.toggle('is-solid', scrollY > 42), { passive: true });
    document.addEventListener('pointermove', event => {
      document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
    }, { passive: true });
  }

  function initWebGL() {
    const canvas = $('#livingCanvas');
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl) return;
    const vertex = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
    const fragment = `precision highp float;uniform vec2 r,m;uniform float t,s;float h(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}float f(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}void main(){vec2 p=(gl_FragCoord.xy-.5*r)/r.y;float q=f(p*1.5+vec2(t*.025,-t*.018)+m*.15);float v=f(p*2.5+q*1.2-vec2(t*.018,t*.022));vec3 a=vec3(.008,.045,.043),b=vec3(.02,.22,.2),c=vec3(.55,.89,.77);vec3 col=mix(a,b,smoothstep(-.8,.9,p.y+q*.45));col=mix(col,c,smoothstep(.47,.92,v)*.2);for(int i=0;i<3;i++){float k=float(i);vec2 o=vec2(sin(t*.08+k*2.1)*.58,cos(t*.06+k*1.5)*.36+.1);col+=c*(.007/(length(p-o)+.035));}float ring=abs(length(p-vec2(.42,.18))-(.35+.025*sin(atan(p.y-.18,p.x-.42)*5.+t*.14)));col+=c*smoothstep(.012,0.,ring)*.055;col*=1.-.42*length(p*vec2(.72,1.));col*=mix(1.,.68,s*.65);col+=(h(gl_FragCoord.xy+t)-.5)*.018;gl_FragColor=vec4(max(col,0.),1.);}`;
    const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)); return shader; };
    try {
      const program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program); gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const attr = gl.getAttribLocation(program, 'a'); gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
      const resolution = gl.getUniformLocation(program, 'r'), time = gl.getUniformLocation(program, 't'), mouse = gl.getUniformLocation(program, 'm'), scroll = gl.getUniformLocation(program, 's');
      let targetMouse = [0,0], smoothMouse = [0,0], scrollAmount = 0;
      const resize = () => { const dpr = Math.min(devicePixelRatio, 1.7); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; gl.viewport(0,0,canvas.width,canvas.height); gl.uniform2f(resolution,canvas.width,canvas.height); };
      resize(); addEventListener('resize', resize);
      addEventListener('pointermove', event => { targetMouse = [event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight * 2 - 1)]; }, { passive: true });
      addEventListener('scroll', () => { const max = document.body.scrollHeight - innerHeight; scrollAmount = max > 0 ? scrollY / max : 0; }, { passive: true });
      const start = performance.now();
      const frame = now => { smoothMouse[0] += (targetMouse[0] - smoothMouse[0]) * .045; smoothMouse[1] += (targetMouse[1] - smoothMouse[1]) * .045; gl.uniform1f(time,(now-start)/1000); gl.uniform2f(mouse,smoothMouse[0],smoothMouse[1]); gl.uniform1f(scroll,scrollAmount); gl.drawArrays(gl.TRIANGLES,0,3); requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    } catch (error) { console.warn('WebGL background unavailable.', error); canvas.style.display = 'none'; }
  }

  function finishLoading() {
    const finish = () => $('.loader')?.classList.add('is-done');
    addEventListener('load', () => setTimeout(finish, 500), { once: true });
    setTimeout(finish, 2500);
  }

  setupEvents();
  observeReveals();
  initWebGL();
  finishLoading();
  loadConfig();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
