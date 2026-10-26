// Guided flagship: chapter state, dawn -> blue crossfade, and at most one live WebGL view loaded at a time (phones).
const $ = id => document.getElementById(id), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const links = [...document.querySelectorAll('.dots a')];
const chapters = [...document.querySelectorAll('.ch')];

// current chapter in the nav
const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) for (const a of links) a.setAttribute('aria-current', String(a.hash === '#' + e.target.id)); }, {threshold: .55});
chapters.forEach(c => io.observe(c));

// 01 · dawn -> blue hour: slider, plus one slow automatic pass the first time the chapter is reached
const blue = $('blue'), ev = $('evening'); let auto = 0, touched = false;
const setEvening = v => { blue.style.opacity = v; ev.value = Math.round(v * 100); ev.setAttribute('aria-valuetext', v < .5 ? 'dawn' : 'blue hour'); };
ev.addEventListener('input', () => { touched = true; cancelAnimationFrame(auto); setEvening(ev.value / 100); });
new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect(); if (reduce || touched) return;
  const t0 = performance.now(); (function step(t) { const u = Math.min(1, (t - t0) / 5000); setEvening(u * u * (3 - 2 * u)); if (u < 1 && !touched) auto = requestAnimationFrame(step); })(t0); },
  {threshold: .6}).observe($('place'));

// a missing still never shows as a broken image: without dawn, show blue hour only and hide the slider
$('dawn').addEventListener('error', () => { $('dawn').hidden = true; blue.style.opacity = 1; ev.closest('.slider').hidden = true; touched = true; });

// live views: load when the chapter is near, unload when far, so a phone never holds two WebGL contexts
const frames = [...document.querySelectorAll('iframe[data-src]')];
const lv = new IntersectionObserver(es => { for (const e of es) { const mine = e.target.querySelector('iframe');
  if (!e.isIntersecting) { if (mine.getAttribute('src') && mine.getAttribute('src') !== 'about:blank') mine.src = 'about:blank'; continue; }
  for (const f of frames) { if (f === mine) { if (f.getAttribute('src') !== f.dataset.src) f.src = f.dataset.src; } else if (f.getAttribute('src') && f.getAttribute('src') !== 'about:blank') f.src = 'about:blank'; } } },
  {threshold: .5});
frames.forEach(f => lv.observe(f.closest('.ch')));

// keyboard: arrows move between chapters when focus is not inside a control or a live view
addEventListener('keydown', e => { if (e.target.closest?.('input,iframe,button,a') && e.target !== document.body) return;
  if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(e.key)) return;
  const i = Math.max(0, chapters.findIndex(c => c.getBoundingClientRect().top > -innerHeight / 2));
  const n = chapters[Math.min(chapters.length - 1, Math.max(0, i + (/Down/.test(e.key) ? 1 : -1)))]; e.preventDefault(); n.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}); });
// films: hero loop (muted, decorative) and the place film on demand; phone gets the 720p encode
const SMALL = matchMedia('(max-width: 860px)').matches, FILMSRC = './media/world-film-' + (SMALL ? '720' : '1080') + '.mp4';
const heroFilm = $('heroFilm');
if (!reduce) { heroFilm.src = FILMSRC; heroFilm.addEventListener('canplay', () => { heroFilm.hidden = false; document.querySelector('.hero .kenburns').hidden = true; $('heroLabel').textContent = 'Film draft · Blender EEVEE'; heroFilm.play().catch(() => {}); }, {once: true});
  heroFilm.addEventListener('error', () => { heroFilm.hidden = true; }); }
const placeFilm = $('placeFilm'), playPlace = $('playPlace');
playPlace.addEventListener('click', () => { cancelAnimationFrame(auto); touched = true; placeFilm.src = FILMSRC; placeFilm.hidden = false; placeFilm.currentTime = 0; placeFilm.play().catch(() => { placeFilm.hidden = true; }); playPlace.textContent = 'Playing…'; });
placeFilm.addEventListener('ended', () => { placeFilm.hidden = true; setEvening(1); playPlace.textContent = 'Play the film again'; });
placeFilm.addEventListener('error', () => { placeFilm.hidden = true; playPlace.hidden = true; });
// internal review panel: never shown by default; held work is listed by name and reason, with no media copied here
if (new URLSearchParams(location.search).get('review') === 'internal') $('internal').hidden = false;

window.__f = {chapters: chapters.map(c => c.id), setEvening};
