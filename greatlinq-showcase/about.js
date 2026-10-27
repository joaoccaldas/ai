// About page — renders profile.json into a full-width, scrolling page (no deck, no collapsed panels).
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const asset = p => (p || '').replace(/^\/profile-media\//, 'img/about/');

const p = await fetch('./profile.json').then(r => r.json());

// hero
$('abRole').textContent = p.currentRole || p.headlineRole || '';
$('abIntro').textContent = p.firstPerson || p.intro || '';
if (p.portrait) { $('abPortrait').src = p.portrait; $('abPortrait').alt = p.portraitAlt || p.name; }
const links = $('abLinks');
for (const l of p.links || []) {
  const a = el('a', 'btn ghost-light', l.label); a.href = l.url;
  if (!l.url.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', l.label + ' (opens in a new tab)'); }
  links.appendChild(a);
}
// at-a-glance, only numbers the data itself supports
const years = (p.career || '').match(/(\d+)\+?\s*years/);
const stats = [[years ? years[1] + '+' : null, 'years in finance & leadership'], [String((p.careerTimeline || []).length), 'roles across companies'],
  [String((p.intro || '').match(/Brazil, Sweden, Switzerland/) ? 3 : ''), 'countries lived in'], [String((p.speaking || []).length), 'public talks']].filter(([n]) => n);
const dl = $('abStats');
for (const [n, label] of stats) { const d = el('div'); d.append(el('dt', null, label), el('dd', null, n)); dl.appendChild(d); }

// story
const prose = $('abProse');
prose.append(el('p', 'ab-pull', p.intro), el('p', null, p.career), el('p', null, p.now));
const chips = $('abChips');
const chipRow = (label, items) => { if (!items.length) return; const g = el('div', 'ab-chipgroup'); g.append(el('span', 'ab-chiplabel', label)); items.forEach(t => g.append(el('span', 'ab-chip', t))); chips.appendChild(g); };
chipRow('Expertise', (p.expertise || '').split(';').map(s => s.trim().replace(/\.$/, '')).filter(Boolean));
chipRow('Interests', (p.interests || '').split('·').map(s => s.trim()).filter(Boolean));

// life chapters
const life = $('abLife');
(p.chapters || []).forEach((c, i) => {
  const a = el('article', 'ab-chap' + (i % 2 ? ' flip' : ''));
  const fig = el('figure'); const img = el('img'); img.src = c.image; img.alt = ''; img.loading = 'lazy'; fig.appendChild(img);
  const body = el('div', 'ab-chap-body');
  body.append(el('p', 'eyebrow', c.period), el('h3', null, c.title), el('p', null, c.text));
  if (c.carry) body.append(el('p', 'ab-carry', c.carry));
  a.append(fig, body); life.appendChild(a);
});

// career journey (every role open — nothing hidden behind a click)
$('abJourneySub').textContent = 'Roles and dates from the CV and speaker biography. Newest first below; scroll the whole story.';
const tl = $('abTimeline');
for (const r of [...(p.careerTimeline || [])].reverse()) {
  const li = el('li', 'ab-role-item');
  const when = el('p', 'ab-when', r.period);
  const card = el('article', 'ab-card');
  const head = el('header', 'ab-card-head');
  if (r.thumbnail) { const logo = el('span', 'ab-logo'); const im = el('img'); im.src = r.thumbnail; im.alt = r.thumbnailAlt || r.company + ' logo'; im.loading = 'lazy'; logo.appendChild(im); head.appendChild(logo); }
  const t = el('div'); t.append(el('h3', null, r.company), el('p', 'ab-roleline', [r.role, r.place].filter(Boolean).join(' · '))); head.appendChild(t);
  card.appendChild(head);
  if (r.challenge) card.appendChild(el('p', 'ab-challenge', r.challenge));
  if (r.text) card.appendChild(el('p', null, r.text));
  if ((r.details || []).length) { const ul = el('ul', 'ab-details'); r.details.forEach(d => ul.appendChild(el('li', null, d))); card.appendChild(ul); }
  if ((r.tags || []).length) { const tg = el('div', 'ab-tags'); r.tags.forEach(x => tg.appendChild(el('span', 'ab-chip', x))); card.appendChild(tg); }
  li.append(when, card); tl.appendChild(li);
}
$('abNote').textContent = p.timelineNote || '';

// outside work
if (p.surfingImage) { $('abSurf').src = p.surfingImage; $('abSurf').alt = p.surfingImageAlt || ''; }
$('abSurfNote').textContent = p.surfingNote || '';
$('abInterests').textContent = p.interests || '';

// talks
const talks = $('abTalks');
for (const s of p.speaking || []) {
  const a = el('article', 'ab-talk');
  const top = el('p', 'eyebrow', [s.kind, s.date].filter(Boolean).join(' · '));
  const h = el('h3', null, s.title); const o = s.officialTitle ? el('p', 'ab-official', s.officialTitle) : null;
  const body = el('p', null, s.text);
  const act = el('a', 'btn ghost', (s.action || 'Open') + ' ↗'); act.href = s.url; act.target = '_blank'; act.rel = 'noopener'; act.setAttribute('aria-label', (s.action || 'Open') + ': ' + s.title + ' (opens in a new tab)');
  a.append(top, h); if (o) a.append(o); a.append(body); if (s.note) a.append(el('p', 'ab-small', s.note)); a.append(act);
  if (s.thumbnail) { const im = el('img', 'ab-talk-logo'); im.src = asset(s.thumbnail); im.alt = s.thumbnailAlt || ''; im.loading = 'lazy'; a.prepend(im); }
  talks.appendChild(a);
}
$('abBasis').textContent = p.basis || '';

// pilot room link: the Mac app serves it at /greatlinq-showcase/…, the web build next to this page
try { const r = await fetch('/greatlinq-showcase/v2/flagship/', { method: 'HEAD' }); if (r.ok) $('abPilot').href = '/greatlinq-showcase/v2/flagship/'; } catch (_) {}

// scroll-in + active section in the sticky nav
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
document.querySelectorAll('.ab-chap, .ab-card, .ab-talk, .ab-prose > *').forEach(n => { if (calm || !io) n.classList.add('in'); else { n.classList.add('rv'); io.observe(n); } });
const navLinks = [...document.querySelectorAll('.ab-nav a')];
const secs = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navLinks.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id))); }), { rootMargin: '-45% 0px -50% 0px' });
secs.forEach(s => spy.observe(s));
document.title = `${p.name} · About · ond.ai Spatial Studio`;
