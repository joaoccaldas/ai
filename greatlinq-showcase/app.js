// ond.ai Spatial Studio — flagship portfolio (chaptered, deduped).
import { isKona, unlockKona, KONA_ORIGIN, UNLOCK_PAGE } from './kona-unlock.js';
const $ = id => document.getElementById(id);
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};

const cat = await (await fetch('./catalog.json')).json();
/** id -> destination index (tools/check-links.mjs keeps it unique and complete). */
const REG = await fetch('./link-registry.json').then(r => r.ok ? r.json() : null).catch(() => null);
const build = await fetch('./build.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));

const OURS = [
  { id: 'threshold', section: 'worlds', kind: 'World', title: 'The Threshold', subtitle: 'Five porcelain arches over still water', description: 'Dawn to blue hour. Stills in Cycles, film draft in EEVEE.', status: 'Keyframes · film draft', image: 'v2/flagship/media/portfolio-world.jpg', url: 'v2/flagship/', rights: 'Original', external: true, feature: 1, useCases: ['vr', 'meeting-rooms', 'brand-rooms'] },
  { id: 'lantern', section: 'library', kind: 'Object', category: 'Lighting', title: 'Lantern', subtitle: 'Fluted porcelain, brass lip', description: 'Glow where porcelain is thin. Film and live from one model.', status: 'Live · for review', image: 'v2/flagship/media/portfolio-lantern.jpg', url: 'v2/lantern/', rights: 'Original', external: true, useCases: ['objects', 'meeting-rooms'] },
  { id: 'arch', section: 'library', kind: 'Object', category: 'Architecture', title: 'Ribbed arch', subtitle: 'Pavilion study', description: 'Rendered film that cuts into the live object.', status: 'Live · for review', image: 'v2/flagship/media/portfolio-arch.jpg', url: 'v2/hybrid/', rights: 'Original', external: true, useCases: ['objects', 'vr'] }
];

// Hand-authored pages live at /greatlinq-showcase/ in the Mac app and next to index.html on the web build.
const LOCAL_BASE = OURS[0].url.replace(/v2\/flagship\/$/, '');

const CAPTURES = new Set(['konam', 'noema-world', 'belong', 'blockscreate', 'noema-lab', 'caldaspace', 'sintra-ai', 'web-design', 'discovery-lab', 'kona-museum', 'canyon', 'st-george', 'island', 'kona-play']);

const ITEMS = [
  ...OURS,
  { ...OURS[2], section: 'worlds', kind: 'World', id: 'arch-world', title: 'Ribbed arch pavilion', subtitle: 'Pavilion over water, noon to night', feature: 2, image: 'v2/flagship/media/portfolio-arch.jpg', url: 'v2/hybrid/', useCases: ['vr', 'brand-rooms'], external: true },
  ...cat.items.map(i => ({
    ...i,
    image: i.image ? (i.image.startsWith('/') || i.image.startsWith('http') ? i.image : './' + i.image) : null,
    capture: CAPTURES.has(i.id)
  }))
];

const defaultAud = build.defaultAudience === 'external' ? 'external' : 'internal';
if (!store.get('ondai.aud.v2')) { store.set('ondai.audience', defaultAud); store.set('ondai.aud.v2', '1'); }
let audience = build.audienceLocked
  ? (build.variant === 'external' ? 'external' : defaultAud)
  : (store.get('ondai.audience') || defaultAud);

const PROJECT_URL = {
  ai: 'https://joaoccaldas.github.io/ai/',
  konam: 'https://joaoccaldas.github.io/konam/',
  'studio-kona': 'https://joaoccaldas.github.io/studio-kona/web/public/',
  noema: 'https://joaoccaldas.github.io/ai/projects/noema/site/human-meaning-atlas.html',
  'sintra-ai': 'https://joaoccaldas.github.io/sintra-ai/automate/',
  caldaspace: 'https://joaoccaldas.github.io/nasa-space-dashboard/',
  bellagio: 'https://joaoccaldas.github.io/bellagio/worlds/vegas/',
  'trek-tri-museum': 'https://joaoccaldas.github.io/canyonmuseum/',
  canyonmuseum: 'https://joaoccaldas.github.io/canyonmuseum/',
  sokai: 'https://joaoccaldas.github.io/ai/studio/sokai/',
  belong: 'https://joaoccaldas.github.io/ai/belong/',
  blockscreate: 'https://joaoccaldas.github.io/blockscreate/'
};
const ITEM_URL = {
  studio: 'https://joaoccaldas.github.io/ai/',
  'web-design': 'https://joaoccaldas.github.io/ai/',
  gaudi: 'https://joaoccaldas.github.io/ai/',
  trek: 'https://joaoccaldas.github.io/canyonmuseum/',
  'discovery-lab': 'https://joaoccaldas.github.io/nasa-space-dashboard/'
};

const UC_DEFS = (cat.useCaseDefs && cat.useCaseDefs.length
  ? cat.useCaseDefs
  : [
      { id: 'meeting-rooms', label: 'Meeting rooms', relates: 'spatial meetings · collab rooms' },
      { id: 'objects', label: 'Objects & kits', relates: 'glTF · FBX · LOD kits' },
      { id: 'brand-rooms', label: 'Brand & product rooms' },
      { id: 'vr', label: 'VR & immersive' },
      { id: 'world-sims', label: 'World simulations' },
      { id: 'gaming', label: 'Gaming' }
    ]);
const UC_SECONDARY = new Set(['gaming', 'world-sims']);
const UC_LABEL = Object.fromEntries(UC_DEFS.map(u => [u.id, u.label]));
let ucFilter = null;
let invFilter = 'All';

const visible = i => audience === 'internal' || i.external;
const sectionRank = { worlds: 0, games: 1, concepts: 2, library: 3, assets: 4, studios: 5, textures: 6 };

/** Curated showcase order — strongest visuals first (lower = earlier). Weak/empty rooms drop back. */
const SHOWCASE_ROOMS = ['nor', 'canyon', 'breitling', 'room-kona-room-hween', 'room-kona-room-room-alien', 'room-kona-room-sanctuary', 'room-kona-room-kona',
  'room-kona-room-atlas-against-the-clock-hour', 'room-kona-room-atlas-against-the-clock-mono', 'room-kona-room-atlas-against-the-clock-tri',
  'room-kona-room-room-horror', 'kona-museum', 'beast', 'norseman', 'room-kona-room-room-zombie', 'room-kona-room-pier'];
const DEMOTE_ROOMS = new Set(['web-design', 'sintra-ai', 'discovery-lab', 'trek', 'room-kona-room-nike-running', 'room-kona-room-wing-against-the-clock',
  'room-kona-room-wing-kona-light', 'room-kona-room-bay-kona', 'room-kona-room-bay-las-vegas']);
const SHOWCASE_BIKES = ['asset-atlas-merckx-hour-1972', 'asset-atlas-lotus-108-1992', 'asset-atlas-obree-riverside', 'asset-canyon-speedmax-cf-2011',
  'asset-canyon-speedmax-al-2011', 'asset-atlas-type-lowpro-650c', 'asset-atlas-type-aerobar-1989', 'asset-atlas-type-funny-1980s',
  'asset-canyon-speedmax-2007', 'asset-canyon-speedmax-three-2005'];
const showcaseBias = i => {
  const r = SHOWCASE_ROOMS.indexOf(i.id);
  if (r >= 0) return r - 1000;
  return DEMOTE_ROOMS.has(i.id) ? 60 : 0;
};
const BIKE_META = {
  'asset-atlas-merckx-hour-1972': { year: '1972', line: 'Eddy Merckx · Hour Record', tag: 'Rebuilt from photos' },
  'asset-atlas-lotus-108-1992': { year: '1992', line: 'Lotus · Type 108', tag: 'Rebuilt from photos' },
  'asset-atlas-obree-riverside': { year: '', line: 'Graeme Obree · Riverside', tag: 'Rebuilt from photos' },
  'asset-canyon-speedmax-cf-2011': { year: '2011', line: 'Canyon · Speedmax CF 9.0 Pro', tag: 'Editable' },
  'asset-canyon-speedmax-al-2011': { year: '2011', line: 'Canyon · Speedmax AL 9.0', tag: 'Editable' },
  'asset-canyon-speedmax-2007': { year: '2007', line: 'Canyon · Speedmax 3.0', tag: 'Editable' },
  'asset-canyon-speedmax-three-2005': { year: '2005', line: 'Canyon · Speedmax Three', tag: 'Editable' },
  'asset-atlas-type-lowpro-650c': { year: '', line: 'Type study · triathlon, 650c', tag: 'Type study' },
  'asset-atlas-type-aerobar-1989': { year: '1989', line: 'Type study · clip-on aero bars', tag: 'Type study' },
  'asset-atlas-type-funny-1980s': { year: '1980s', line: 'Type study · funny bike', tag: 'Type study' }
};
const CAT_MAP = { bike: 'Bikes', Bicycles: 'Bikes', 'library object': 'Objects', Objects: 'Objects', 'featured asset': 'Featured', 'nature model': 'Nature' };
const catOf = i => CAT_MAP[i.category] || i.category || 'Other';
function itemUseCases(i) {
  if (i.useCases?.length) return i.useCases;
  if (i.section === 'library' || i.section === 'assets') return ['objects', 'meeting-rooms'];
  if (i.section === 'textures') return ['objects', 'brand-rooms'];
  if (i.section === 'studios') return ['brand-rooms', 'vr'];
  if (i.section === 'games') return ['gaming'];
  if (i.section === 'concepts') return ['meeting-rooms', 'brand-rooms'];
  return ['vr', 'world-sims'];
}
function matchesUc(i) { return !ucFilter || itemUseCases(i).includes(ucFilter); }
function projectMeta(i) {
  return (cat.projects || []).find(p => p.id === i.project || p.id === i.id) || null;
}
const KONA = 'https://joaoccaldas.github.io/konam/';
/** Map areas the Kona museum accepts as ?room=<id> (docs/APP.md in the konam repo; ids from app/hall.js + museum-data.js). */
const KONA_AREAS = new Set(['hall', 'kona', 'pier', 'nave', 'sanctuary', 'hween', 'nike-running', 'bay-kona', 'bay-las-vegas',
  'room-alien', 'room-horror', 'room-zombie', 'wing-kona-light', 'wing-against-the-clock',
  'atlas-against-the-clock-hour', 'atlas-against-the-clock-mono', 'atlas-against-the-clock-tri']);
const KONA_PAGES = {
  'asset-canyon-speedmax-three-2005': 'Speedmax_Three_2005_Museum.html',
  'asset-canyon-speedmax-2007': 'Speedmax_2007_Museum.html',
  'asset-canyon-speedmax-al-2011': 'Speedmax_AL_2011_Museum.html',
  'asset-canyon-speedmax-cf-2011': 'Speedmax_CF_2011_Museum.html',
  canyon: 'Canyon_Collection.html'
};
/** Land on the exact room / bike, not the museum front door. */
function deepLink(i) {
  if (KONA_PAGES[i.id]) return KONA + KONA_PAGES[i.id];
  if (i.project !== 'konam' && i.id !== 'canyon') return null;
  const room = i.id.startsWith('room-kona-room-') ? i.id.slice('room-kona-room-'.length)
    : i.id.startsWith('asset-atlas-') ? 'atlas-' + i.id.slice('asset-atlas-'.length) : null;
  if (!room) return null;
  const known = KONA_AREAS.has(room) || room.startsWith('atlas-');
  return known ? `${KONA}?room=${room}` : null;
}
function resolveUrl(i) {
  const mapped = REG?.items?.[i.id];
  if (mapped) return mapped.to ? (mapped.type === 'local' ? LOCAL_BASE + mapped.to : mapped.to) : null;
  const deep = deepLink(i);
  if (deep) return deep;
  if (i.url) return i.url;
  if (ITEM_URL[i.id]) return ITEM_URL[i.id];
  if (i.project && PROJECT_URL[i.project]) return PROJECT_URL[i.project];
  const sib = ITEMS.find(x => x.project && i.project && x.project === i.project && x.url);
  return sib ? sib.url : null;
}
function inSite(url) {
  return typeof url === 'string' && (url.startsWith('/') || url.startsWith('v2/'));
}
/** KONA bikes/rooms are level-gated. On the web build (same origin as KONA) raise the level directly; from the Mac app route through the
    published unlock page, if it is reachable (checked once at start so opening stays instant). */
let unlockRelay = false;
if (location.origin !== KONA_ORIGIN) fetch(UNLOCK_PAGE, { method: 'HEAD', cache: 'no-store' }).then(r => { unlockRelay = r.ok; }).catch(() => {});
function konaUrl(url) {
  if (!isKona(url)) return url;
  if (location.origin === KONA_ORIGIN) { unlockKona(); return url; }
  return unlockRelay ? UNLOCK_PAGE + '?to=' + encodeURIComponent(url) : url;
}
function openExperience(url) {
  if (!url) return;
  url = konaUrl(url);
  if (inSite(url)) { location.assign(url); return; }
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}

/** One card per title: prefer worlds > games > concepts; drop studios/assets clones. */
function dedupePortfolio(list) {
  const best = new Map();
  for (const i of list) {
    const key = (i.title || '').toLowerCase().trim();
    if (!key) continue;
    const prev = best.get(key);
    if (!prev) { best.set(key, i); continue; }
    const pr = sectionRank[prev.section] ?? 9;
    const ir = sectionRank[i.section] ?? 9;
    const prevScore = (resolveUrl(prev) ? 0 : 2) + pr + (prev.image ? 0 : 1);
    const nextScore = (resolveUrl(i) ? 0 : 2) + ir + (i.image ? 0 : 1);
    if (nextScore < prevScore) best.set(key, i);
  }
  return [...best.values()];
}

function portfolioItems() {
  const raw = ITEMS.filter(i =>
    visible(i) && matchesUc(i) &&
    (i.section === 'worlds' || i.section === 'concepts' || i.section === 'games')
  );
  return dedupePortfolio(raw).sort((a, b) => {
    const score = i => (
      (i.feature || 50) +
      (resolveUrl(i) ? 0 : 20) +
      (i.image && !i.capture ? 0 : 8) +
      (sectionRank[i.section] ?? 9) * 3
    );
    return score(a) - score(b) || (a.title || '').localeCompare(b.title || '');
  });
}

const FEATURED_IDS = ['threshold', 'asset-atlas-merckx-hour-1972', 'arch-world', 'bellagio', 'konam'];
const FEATURED_BLOCK = new Set(['gaudi', 'gaudi-seating', 'gaudi-market-bay', 'gaudi-produce', 'gaudi-chair-study', 'gaudi-sofa-study', 'gaudi-table-study', 'gaudi-shelf-study', 'gaudi-holm-oak']);
function featuredItems() {
  const byId = new Map(ITEMS.map(i => [i.id, i]));
  const out = [];
  for (const id of FEATURED_IDS) {
    const i = byId.get(id);
    if (!i || !visible(i) || FEATURED_BLOCK.has(i.id)) continue;
    if (!resolveUrl(i) && !i.image) continue;
    out.push(i);
    if (out.length >= 5) break;
  }
  if (out.length < 5) {
    for (const i of portfolioItems()) {
      if (FEATURED_BLOCK.has(i.id)) continue;
      if (/gaud[ií]/i.test(i.title || '') || /gaud[ií]/i.test(i.id || '')) continue;
      if (out.some(x => x.id === i.id || x.title === i.title)) continue;
      if (!resolveUrl(i)) continue;
      out.push(i);
      if (out.length >= 5) break;
    }
  }
  return out.slice(0, 5);
}

function isGaudiBlocked(i) {
  if (!i) return true;
  if (FEATURED_BLOCK.has(i.id)) return true;
  return /gaud[ií]/i.test(i.title || '') || /gaud[ií]/i.test(i.id || '');
}

/** Worlds chapter: worlds + games (playables). Not a mega dump — lane carousel. */
function worldItems() {
  const raw = ITEMS.filter(i =>
    visible(i) &&
    (i.section === 'worlds' || i.section === 'games') &&
    !isGaudiBlocked(i)
  );
  return dedupePortfolio(raw).sort((a, b) => {
    const score = i => (
      (i.feature || 50) +
      (resolveUrl(i) ? 0 : 20) +
      (i.image && !i.capture ? 0 : 8) +
      (sectionRank[i.section] ?? 9) * 3
    );
    return score(a) - score(b) || (a.title || '').localeCompare(b.title || '');
  });
}

/** Concepts chapter: room concepts / studies. */
function conceptItems() {
  const raw = ITEMS.filter(i =>
    visible(i) &&
    i.section === 'concepts' &&
    !isGaudiBlocked(i)
  );
  return dedupePortfolio(raw).sort((a, b) => {
    const score = i => (
      (i.feature || 50) +
      (resolveUrl(i) ? 0 : 20) +
      (i.image && !i.capture ? 0 : 8) +
      showcaseBias(i)
    );
    return score(a) - score(b) || (a.title || '').localeCompare(b.title || '');
  });
}

const OBJECT_PRIORITY = [...SHOWCASE_BIKES, 'lantern', 'arch', 'sokai-katana', 'kit-wall-mirror', 'kit-floor-mirror', 'kit-basin', 'kit-basin-fluted', 'kit-globe-stand', 'kit-cloud', 'stained-glass'];
const OBJECT_CAP = 28;
function objectItems() {
  const byId = new Map(ITEMS.map(i => [i.id, i]));
  const out = [];
  const seen = new Set();
  for (const id of OBJECT_PRIORITY) {
    const i = byId.get(id);
    if (!i || !visible(i) || isGaudiBlocked(i)) continue;
    out.push(i);
    seen.add(i.id);
  }
  const raw = ITEMS.filter(i =>
    visible(i) &&
    (i.section === 'library' || (i.section === 'assets' && i.image)) &&
    !seen.has(i.id) &&
    !isGaudiBlocked(i)
  );
  for (const i of dedupePortfolio(raw)) {
    out.push(i);
    if (out.length >= OBJECT_CAP) break;
  }
  return out.slice(0, OBJECT_CAP);
}

/** Compact diligence pills — only true claims. */
function statusPills(i) {
  const pills = [];
  const url = resolveUrl(i) || '';
  const st = (i.status || '').toLowerCase();
  const liveUrl = url.startsWith('v2/') || url.startsWith('/greatlinq') || /lantern|hybrid|flagship/.test(url);
  if (/\blive\b|webgl|for review/.test(st) || liveUrl) pills.push('Live');
  if (/film|keyframe|eevee|cycles/.test(st) || i.id === 'threshold') pills.push('Film');
  if (i.kind === 'Object' || i.section === 'library' || i.section === 'assets' || /\bkit\b/.test(st)) pills.push('Kit');
  if (i.rights === 'Original') pills.push('Rights clear');
  if (REG?.items?.[i.id]?.weight === 'heavy' && REG.items[i.id].type === 'room') pills.unshift('Large 3D');
  return [...new Set(pills)].slice(0, 3);
}

function card(i, { featured = false, startHere = false } = {}) {
  const url = resolveUrl(i);
  const el = document.createElement('article');
  el.className = (featured ? 'feat-card' : 'card') + (url ? ' has-open' : '') + (startHere ? ' start-here' : '');
  el.tabIndex = 0;
  el.setAttribute('role', 'link');
  el.setAttribute('aria-label', (url ? 'Open ' : 'Details for ') + i.title);
  if (startHere) el.dataset.startHere = '1';
  const line = i.subtitle || i.kind || '';
  const chip = startHere ? '<span class="start-chip">Start here · live</span>' : '';
  const img = i.image
    ? `<img src="${i.image}" alt="" loading="lazy">${i.capture ? '<span class="cap-badge">UI</span>' : ''}${chip}`
    : `<div class="pending"><span>Pending</span></div>${chip}`;
  el.innerHTML = `<div class="img">${img}</div>
    <div class="body">
      <p class="kicker"></p>
      <h3 class="t"></h3>
      <p class="s"></p>
      <div class="meta pills"></div>
      <div class="card-actions"></div>
    </div>`;
  const bm = BIKE_META[i.id];
  if (bm) el.classList.add('bike-card');
  el.querySelector('.kicker').textContent = bm ? ['Bike', bm.year].filter(Boolean).join(' · ') : [i.kind || (i.section === 'games' ? 'Play' : i.section === 'concepts' ? 'Room' : 'World'), ...itemUseCases(i).slice(0, 1).map(u => UC_LABEL[u] || u)].filter(Boolean).join(' · ');
  el.querySelector('.t').textContent = i.title;
  const s = el.querySelector('.s');
  s.textContent = bm ? bm.line : line;
  s.hidden = bm ? false : (!line || line === i.title);
  const meta = el.querySelector('.meta');
  const pills = bm ? [bm.tag] : statusPills(i);
  if (pills.length) {
    for (const label of pills) {
      const st = document.createElement('span');
      st.className = 'tag pill' + (label === 'Live' ? ' pill-live' : label === 'Rights clear' ? ' pill-rights' : '');
      st.textContent = label;
      meta.appendChild(st);
    }
  } else {
    const st = document.createElement('span');
    st.className = 'tag status';
    st.textContent = i.status || (i.external ? 'Cleared' : 'Internal');
    meta.appendChild(st);
  }
  if (url) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-open';
    btn.textContent = inSite(url) ? 'Enter live' : 'Open';
    btn.addEventListener('click', e => { e.stopPropagation(); openExperience(url); });
    el.querySelector('.card-actions').appendChild(btn);
  }
  const go = () => openDetail(i);
  el.addEventListener('click', go);
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  });
  return el;
}

const SHORTLIST_KEY = 'ondai.pilotShortlist';
const SHORTLIST_MAX = 3;
function readShortlist() {
  try { return JSON.parse(store.get(SHORTLIST_KEY) || '[]') || []; } catch { return []; }
}
function writeShortlist(ids) {
  store.set(SHORTLIST_KEY, JSON.stringify(ids.slice(0, SHORTLIST_MAX)));
  paintShortlist();
}
function inShortlist(id) { return readShortlist().includes(id); }
function toggleShortlist(id) {
  let ids = readShortlist();
  if (ids.includes(id)) ids = ids.filter(x => x !== id);
  else {
    if (ids.length >= SHORTLIST_MAX) {
      ids = ids.slice(1).concat(id); // drop oldest
    } else ids = ids.concat(id);
  }
  writeShortlist(ids);
  return ids.includes(id);
}
function paintShortlist() {
  const bar = $('pilotShortlist');
  if (!bar) return;
  const ids = readShortlist();
  const items = ids.map(id => ITEMS.find(i => i.id === id)).filter(Boolean);
  bar.hidden = items.length === 0;
  const list = $('pilotShortlistList');
  if (!list) return;
  list.replaceChildren(...items.map(i => {
    const li = document.createElement('li');
    const a = document.createElement('button');
    a.type = 'button';
    a.className = 'short-item';
    a.textContent = i.title;
    a.onclick = () => openDetail(i);
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'short-rm';
    rm.setAttribute('aria-label', 'Remove ' + i.title);
    rm.textContent = '×';
    rm.onclick = () => { toggleShortlist(i.id); };
    li.append(a, rm);
    return li;
  }));
  const count = $('pilotShortlistCount');
  if (count) count.textContent = `${items.length} / ${SHORTLIST_MAX}`;
}

let detailItem = null;
function openDetail(i) {
  detailItem = i;
  const url = resolveUrl(i);
  const p = projectMeta(i);
  const img = $('dImg');
  img.src = i.image || '';
  img.hidden = !i.image;
  $('dKind').textContent = [i.kind || 'Experience', ...itemUseCases(i).slice(0, 2).map(u => UC_LABEL[u] || u)].join(' · ');
  $('dTitle').textContent = i.title;
  $('dText').textContent = String(i.description || i.subtitle || (p && p.promise) || '').replace(/\s+/g, ' ').trim();
  $('dStatus').textContent = i.status || '—';
  $('dRights').textContent = i.external ? 'Cleared · approval pending' : (i.rights || 'Internal');
  const aud = $('dAudience');
  if (aud) {
    aud.textContent = (p && p.audience) || '—';
    $('dAudWrap').hidden = !(p && p.audience);
  }
  const o = $('dOpen');
  o.hidden = !url;
  if (url) {
    o.href = isKona(url) && location.origin !== KONA_ORIGIN && unlockRelay ? UNLOCK_PAGE + '?to=' + encodeURIComponent(url) : url;
    o.onclick = () => { if (isKona(url) && location.origin === KONA_ORIGIN) unlockKona(); };
    o.target = inSite(url) ? '_self' : '_blank';
    o.rel = 'noopener';
    o.textContent = 'Open experience';
  }
  const sl = $('dShortlist');
  if (sl) {
    const on = inShortlist(i.id);
    sl.textContent = on ? 'In pilot shortlist' : 'Add to pilot shortlist';
    sl.setAttribute('aria-pressed', String(on));
  }
  $('detail').showModal();
}

function setUcFilter(id) {
  ucFilter = id && id === ucFilter ? null : (id || null);
  render();
  const hint = $('ucHint');
  if (hint) {
    const def = UC_DEFS.find(u => u.id === ucFilter);
    hint.textContent = def ? `Showing ${def.label}.` : 'Showing all portfolio items.';
  }
}

function paintFilters() {
  const filters = $('ucFilters');
  if (!filters) return;
  const defs = [{ id: null, label: 'All', relates: null }, ...UC_DEFS.map(u => ({ id: u.id, label: u.label, relates: u.relates || null }))];
  filters.replaceChildren(...defs.map(({ id, label, relates }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = (id && UC_SECONDARY.has(id)) ? 'uc-secondary' : '';
    if (relates) {
      btn.innerHTML = `<span class="uc-label"></span><span class="uc-relates"></span>`;
      btn.querySelector('.uc-label').textContent = label;
      btn.querySelector('.uc-relates').textContent = relates;
    } else {
      btn.textContent = label;
    }
    btn.setAttribute('aria-pressed', String((id === null && !ucFilter) || id === ucFilter));
    btn.onclick = () => setUcFilter(id);
    return btn;
  }));
  document.body.dataset.audience = audience;
}

// Lane state must init before first render()/refreshLanes() (avoid TDZ)
let worldsLane = null;
let conceptsLane = null;

function render() {
  document.body.dataset.audience = audience;
  const t = $('audToggle');
  if (t) {
    t.textContent = audience === 'internal' ? 'Internal' : 'External';
    t.setAttribute('aria-pressed', String(audience === 'external'));
    if (build.audienceLocked) t.hidden = true;
  }

  const feat = featuredItems();
  const worlds = worldItems();
  const concepts = conceptItems();
  const objs = objectItems();

  const gf = $('gridFeatured');
  if (gf) gf.replaceChildren(...feat.map((i, idx) => card(i, { featured: true, startHere: idx === 0 })));
  paintShortlist();

  const gw = $('gridWorlds');
  if (gw) gw.replaceChildren(...worlds.map(i => card(i, { featured: true })));
  const wc = $('worldsCount');
  if (wc) wc.textContent = `${worlds.length} worlds & play · swipe the lane`;

  const gc = $('gridConcepts');
  if (gc) gc.replaceChildren(...concepts.map(i => card(i, { featured: true })));
  const cc = $('conceptsCount');
  if (cc) cc.textContent = `${concepts.length} concepts · swipe the lane`;

  const cats = ['All', ...[...new Set(objs.map(catOf))].sort((a, b) => (b === 'Bikes') - (a === 'Bikes'))];
  if (!cats.includes(invFilter)) invFilter = 'All';
  const chips = $('chips');
  if (chips) {
    chips.replaceChildren(...cats.map(c => {
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = c;
      x.setAttribute('aria-pressed', String(c === invFilter));
      x.onclick = () => { invFilter = c; render(); };
      return x;
    }));
  }
  const filteredObjs = objs.filter(i => invFilter === 'All' || catOf(i) === invFilter);
  const go = $('gridObjects');
  if (go) go.replaceChildren(...filteredObjs.map(i => card(i)));
  const oc = $('objCount');
  if (oc) oc.textContent = `${filteredObjs.length} of ${objs.length} objects`;

  paintFilters();
  if (typeof updateCaps === 'function') updateCaps();
  if (typeof refreshLanes === 'function') refreshLanes();
}

// Detail + audience
$('onboard').hidden = true;
$('dClose').onclick = () => $('detail').close();
const dSl = $('dShortlist');
if (dSl) {
  dSl.onclick = () => {
    if (!detailItem) return;
    const on = toggleShortlist(detailItem.id);
    dSl.textContent = on ? 'In pilot shortlist' : 'Add to pilot shortlist';
    dSl.setAttribute('aria-pressed', String(on));
  };
}
paintShortlist();
$('audToggle').onclick = () => {
  if (build.audienceLocked) return;
  audience = audience === 'internal' ? 'external' : 'internal';
  store.set('ondai.audience', audience);
  render();
};


render();

// Caps + motion
function animateCount(el, to) {
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = String(to); return; }
  const start = performance.now();
  const from = 0;
  const dur = 700;
  const tick = now => {
    const u = Math.min(1, (now - start) / dur);
    el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - u, 3))));
    if (u < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function updateCaps() {
  const port = $('capPort');
  const feat = $('capFeat');
  if (port) animateCount(port, featuredItems().length);
  if (feat) animateCount(feat, featuredItems().length);
  const live = $('capLive'); if (live) live.textContent = '3';
}
updateCaps();

// Scroll reveals
const revealIO = new IntersectionObserver(es => {
  for (const e of es) if (e.isIntersecting) e.target.classList.add('in');
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal, .chapter-head, .card, .feat-card, .pilot-card, .caps').forEach(el => {
  el.classList.add('reveal');
  revealIO.observe(el);
});
// Enter reveals should show immediately
document.querySelectorAll('#enter .reveal').forEach(el => el.classList.add('in'));

// Story progress (wired by section deck below)
const fill = $('storyFill');

// Featured carousel
function setupCarousel() {
  const track = $('gridFeatured');
  const dots = $('featDots');
  const prev = $('featPrev');
  const next = $('featNext');
  // Hero row mode: no carousel chrome — skip autoplay machinery
  if (!track || !dots) return;
  const cards = () => [...track.querySelectorAll('.feat-card')];
  const paintDots = () => {
    const cs = cards();
    dots.replaceChildren(...cs.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.onclick = () => track.scrollTo({ left: cs[i].offsetLeft, behavior: 'smooth' });
      return b;
    }));
  };
  const sync = () => {
    const cs = cards();
    if (!cs.length) return;
    const left = track.scrollLeft;
    let best = 0, bestDist = Infinity;
    cs.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - left);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === best)));
  };
  paintDots();
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  const step = dir => {
    const cs = cards();
    if (!cs.length) return;
    const left = track.scrollLeft;
    let idx = 0, best = Infinity;
    cs.forEach((c, i) => { const d = Math.abs(c.offsetLeft - left); if (d < best) { best = d; idx = i; } });
    const nextI = Math.max(0, Math.min(cs.length - 1, idx + dir));
    track.scrollTo({ left: cs[nextI].offsetLeft, behavior: 'smooth' });
  };
  if (prev) prev.onclick = () => step(-1);
  if (next) next.onclick = () => step(1);
  let auto = null;
  const featuredSec = document.getElementById('featured');
  const canAuto = () => {
    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (!featuredSec) return true;
    const r = featuredSec.getBoundingClientRect();
    return r.bottom > 80 && r.top < innerHeight - 80;
  };
  const tickAuto = () => {
    if (!canAuto()) return;
    const cs = cards();
    if (cs.length < 2) return;
    // Skip Start here (index 0) so autoplay never steals the eye back to / off the pin mid-brief
    const left = track.scrollLeft;
    let idx = 0, best = Infinity;
    cs.forEach((c, i) => { const d = Math.abs(c.offsetLeft - left); if (d < best) { best = d; idx = i; } });
    const firstAuto = cs.length > 1 ? 1 : 0;
    let nextI = idx + 1;
    if (nextI >= cs.length || idx === 0) nextI = firstAuto;
    if (cs[nextI]) track.scrollTo({ left: cs[nextI].offsetLeft, behavior: 'smooth' });
  };
  auto = setInterval(tickAuto, 5200);
  const stopAuto = () => { if (auto) { clearInterval(auto); auto = null; } };
  track.addEventListener('pointerdown', stopAuto, { once: true });
  track.addEventListener('wheel', stopAuto, { once: true, passive: true });
  // Re-paint dots after render swaps children
  const mo = new MutationObserver(() => { paintDots(); sync(); });
  mo.observe(track, { childList: true });
  sync();
}
setupCarousel();

/** Generic horizontal catalog lane (worlds / concepts) — not a mega grid dump. */
function bindCatalogLane({ trackId, dotsId, prevId, nextId }) {
  const track = $(trackId);
  const dots = $(dotsId);
  const prev = $(prevId);
  const next = $(nextId);
  if (!track) return null;
  const cards = () => [...track.querySelectorAll('.feat-card, .card')];
  const paintDots = () => {
    if (!dots) return;
    const cs = cards();
    // Cap dots for long lanes — show one per ~3 cards or max 10
    const n = Math.min(10, Math.max(1, Math.ceil(cs.length / 2)));
    dots.replaceChildren(...Array.from({ length: n }, (_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to group ' + (i + 1));
      b.onclick = () => {
        const idx = Math.min(cs.length - 1, Math.round(i * (cs.length - 1) / Math.max(1, n - 1)));
        if (cs[idx]) track.scrollTo({ left: cs[idx].offsetLeft, behavior: 'smooth' });
      };
      return b;
    }));
  };
  const sync = () => {
    if (!dots || !dots.children.length) return;
    const cs = cards();
    if (!cs.length) return;
    const left = track.scrollLeft;
    let best = 0, bestDist = Infinity;
    cs.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - left);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    const n = dots.children.length;
    const di = Math.min(n - 1, Math.round(best * (n - 1) / Math.max(1, cs.length - 1)));
    [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === di)));
  };
  const step = dir => {
    const cs = cards();
    if (!cs.length) return;
    const left = track.scrollLeft + (dir > 0 ? track.clientWidth * 0.7 : -track.clientWidth * 0.7);
    let best = 0, bestDist = Infinity;
    cs.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - left);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    track.scrollTo({ left: cs[best].offsetLeft, behavior: 'smooth' });
  };
  if (!track.dataset.laneBound) {
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    if (prev) prev.onclick = () => step(-1);
    if (next) next.onclick = () => step(1);
    track.dataset.laneBound = '1';
  }
  paintDots();
  sync();
  return { paintDots, sync };
}

function refreshLanes() {
  worldsLane = bindCatalogLane({ trackId: 'gridWorlds', dotsId: 'worldsDots', prevId: 'worldsPrev', nextId: 'worldsNext' });
  conceptsLane = bindCatalogLane({ trackId: 'gridConcepts', dotsId: 'conceptsDots', prevId: 'conceptsPrev', nextId: 'conceptsNext' });
}
refreshLanes();


// Media
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const film = $('openFilm');
if (film) {
  film.src = 'v2/flagship/media/world-film-' + (innerWidth < 900 ? '720' : '1080') + '.mp4';
  if (!reduce) film.play().catch(() => {});
}

// Hero live WebGL: use proven lantern embed (custom GLB path was failing silently in WKWebView)
const heroFrame = $('heroGlFrame');
const heroFall = $('heroFallback');
const enterSec = $('enter');
if (heroFrame && enterSec) {
  const arm = () => {
    if (heroFrame.getAttribute('src')) return;
    heroFrame.src = heroFrame.dataset.src;
    const show = () => {
      heroFrame.classList.add('is-on');
      if (heroFall) heroFall.style.opacity = '0';
    };
    heroFrame.addEventListener('load', show, { once: true });
    setTimeout(show, 1800); // WKWebView sometimes skips iframe load events
  };
  new IntersectionObserver(([e]) => { if (e.isIntersecting) arm(); }, { threshold: 0.05 }).observe(enterSec);
  setTimeout(arm, 400);
}

const frame = $('liveGlFrame') || document.querySelector('#live iframe');
const liveFrameEl = $('liveFrame');
const livePoster = $('livePoster');
const liveBadge = $('liveBadge');
const liveLede = $('liveLede');
const links = [...document.querySelectorAll('.nav a')];

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch (_) { return false; }
}
const webglOk = hasWebGL();

function setLiveStill(reason) {
  if (liveFrameEl) {
    liveFrameEl.classList.add('is-still');
    liveFrameEl.classList.remove('is-live');
  }
  if (liveBadge) liveBadge.textContent = 'Still · open full live to drag & light';
  if (liveLede) liveLede.textContent = 'Cinematic still ready now · live WebGL opens full-screen.';
  if (frame && frame.getAttribute('src')) frame.removeAttribute('src');
}
function setLiveOn() {
  if (liveFrameEl) {
    liveFrameEl.classList.add('is-live');
    liveFrameEl.classList.remove('is-still');
  }
  if (liveBadge) liveBadge.textContent = 'Live Three.js · drag to turn';
  if (liveLede) liveLede.textContent = 'Drag to turn · scroll to glow · 463 KB · no install.';
}
let liveReadyTimer = 0;
addEventListener('message', (ev) => {
  const d = ev.data || {};
  if (d.type === 'ondai-live-ready') {
    if (liveReadyTimer) clearTimeout(liveReadyTimer);
    setLiveOn();
  }
  if (d.type === 'ondai-live-fallback') {
    if (liveReadyTimer) clearTimeout(liveReadyTimer);
    setLiveStill(d.why || 'fallback');
  }
});
function armLive(id) {
  if (!frame) return;
  if (id !== 'live') {
    if (frame.getAttribute('src')) frame.removeAttribute('src');
    if (liveFrameEl) liveFrameEl.classList.remove('is-live');
    return;
  }
  if (!webglOk) { setLiveStill('no-webgl'); return; }
  if (!frame.getAttribute('src')) {
    frame.src = frame.dataset.src;
    if (liveReadyTimer) clearTimeout(liveReadyTimer);
    liveReadyTimer = setTimeout(() => {
      if (liveFrameEl && !liveFrameEl.classList.contains('is-live')) setLiveStill('timeout');
    }, 9000);
    frame.addEventListener('load', () => {
      setTimeout(() => { if (webglOk) setLiveOn(); }, 700);
    }, { once: true });
  } else if (liveFrameEl && !liveFrameEl.classList.contains('is-still')) {
    setLiveOn();
  }
}
function armHero(id) {
  if (!heroFrame) return;
  if (id === 'enter' && webglOk && !heroFrame.getAttribute('src')) {
    heroFrame.src = heroFrame.dataset.src;
    const show = () => {
      heroFrame.classList.add('is-on');
      if (heroFall) heroFall.style.opacity = '0';
    };
    heroFrame.addEventListener('load', show, { once: true });
    setTimeout(show, 1600);
  }
  if (id !== 'enter' && heroFrame.getAttribute('src') && !webglOk) {
    heroFrame.removeAttribute('src');
    heroFrame.classList.remove('is-on');
    if (heroFall) heroFall.style.opacity = '1';
  }
  if (!webglOk && heroFall) {
    heroFall.style.opacity = '1';
    heroFrame.classList.remove('is-on');
    const cap = document.querySelector('.hero-gl-caption');
    if (cap) cap.textContent = 'Still · same model as the film';
  }
}

// ——— Section deck: one chapter lane; internal infinite scroll ———
document.documentElement.classList.add('deck');
const CHAPTER_IDS = ['enter', 'live', 'featured', 'worlds', 'concepts', 'objects', 'about', 'next'];
const CHAPTER_LABELS = { enter:'Enter', live:'Live', featured:'Featured', worlds:'Worlds', concepts:'Concepts', objects:'Objects', about:'About', next:'Next' };
const chapters = CHAPTER_IDS.map(id => document.getElementById(id)).filter(Boolean);
const deckRail = $('deckRail');
const deckHint = $('deckHint');

function paintDeckRail(activeId) {
  if (!deckRail) return;
  if (!deckRail.dataset.ready) {
    deckRail.innerHTML = CHAPTER_IDS.map(id =>
      `<button type="button" data-id="${id}" aria-label="${CHAPTER_LABELS[id] || id}" title="${CHAPTER_LABELS[id] || id}"></button>`
    ).join('');
    deckRail.dataset.ready = '1';
    deckRail.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]');
      if (b) showChapter(b.dataset.id);
    });
  }
  for (const b of deckRail.querySelectorAll('button')) {
    b.setAttribute('aria-current', String(b.dataset.id === activeId));
  }
}
function updateDeckHint(id) {
  if (!deckHint) return;
  const i = CHAPTER_IDS.indexOf(id);
  if (i < 0 || i >= CHAPTER_IDS.length - 1) { deckHint.hidden = true; return; }
  const ch = document.getElementById(id);
  const tall = ch && ch.scrollHeight > ch.clientHeight + 24;
  if (!tall) { deckHint.hidden = true; return; }
  deckHint.textContent = `Scroll · then ${CHAPTER_LABELS[CHAPTER_IDS[i+1]]}`;
  deckHint.hidden = false;
}

function activeChapter() {
  return chapters.find(c => c.classList.contains('is-active')) || chapters[0];
}
function chapterIndex(el) {
  return chapters.indexOf(el);
}
function updateDeckProgress() {
  if (!fill) return;
  const ch = activeChapter();
  if (!ch || !chapters.length) { fill.style.width = '0%'; return; }
  const i = Math.max(0, chapterIndex(ch));
  const base = i / chapters.length;
  const max = Math.max(1, ch.scrollHeight - ch.clientHeight);
  const within = (ch.scrollTop / max) * (1 / chapters.length);
  fill.style.width = ((base + within) * 100) + '%';
}
function showChapter(id, { scrollTop = 0, replace = true } = {}) {
  const target = document.getElementById(id);
  if (!target || !chapters.includes(target)) return;
  for (const c of chapters) c.classList.toggle('is-active', c === target);
  for (const a of links) a.setAttribute('aria-current', String(a.hash === '#' + id));
  target.scrollTop = scrollTop;
  try {
    if (replace) history.replaceState(null, '', '#' + id);
    else history.pushState(null, '', '#' + id);
  } catch (_) { location.hash = '#' + id; }
  updateDeckProgress();
  paintDeckRail(id);
  armLive(id);
  armHero(id);
  updateDeckHint(id);
  target.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}
function goRelative(dir) {
  const ch = activeChapter();
  const i = chapterIndex(ch);
  const next = chapters[i + dir];
  if (!next) return;
  showChapter(next.id, {
    scrollTop: dir > 0 ? 0 : Math.max(0, next.scrollHeight - next.clientHeight)
  });
}
let wheelLock = 0;
addEventListener('wheel', (e) => {
  if (!document.documentElement.classList.contains('deck')) return;
  if (document.querySelector('.onboard:not([hidden])') || document.querySelector('dialog[open]')) return;
  const ch = activeChapter();
  if (!ch) return;
  const now = Date.now();
  if (now < wheelLock) { e.preventDefault(); return; }
  const atTop = ch.scrollTop <= 1;
  const atBottom = ch.scrollTop + ch.clientHeight >= ch.scrollHeight - 2;
  if (e.deltaY > 10 && atBottom && chapterIndex(ch) < chapters.length - 1) {
    e.preventDefault();
    wheelLock = now + 480;
    goRelative(1);
  } else if (e.deltaY < -10 && atTop && chapterIndex(ch) > 0) {
    e.preventDefault();
    wheelLock = now + 480;
    goRelative(-1);
  }
}, { passive: false });
chapters.forEach(ch => ch.addEventListener('scroll', updateDeckProgress, { passive: true }));
links.forEach(a => {
  a.addEventListener('click', (e) => {
    const id = (a.getAttribute('href') || '').replace(/^#/, '');
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    showChapter(id);
  });
});
document.querySelectorAll('[data-chapter]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('data-chapter');
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    showChapter(id);
  });
});
if (!webglOk) setLiveStill('no-webgl');
addEventListener('hashchange', () => {
  const id = (location.hash || '#enter').slice(1);
  if (CHAPTER_IDS.includes(id)) showChapter(id);
});
addEventListener('keydown', (e) => {
  if (document.querySelector('.onboard:not([hidden])') || document.querySelector('dialog[open]')) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'PageDown' || (e.key === 'ArrowDown' && e.altKey)) {
    e.preventDefault(); goRelative(1);
  } else if (e.key === 'PageUp' || (e.key === 'ArrowUp' && e.altKey)) {
    e.preventDefault(); goRelative(-1);
  }
});
{
  const id = (location.hash || '#enter').slice(1);
  showChapter(CHAPTER_IDS.includes(id) ? id : 'enter');
}

// Light onboard / restart
function showOnboard() {
  $('onboard').hidden = false;
  const r = document.querySelector(`input[name=aud][value="${audience}"]`);
  if (r) r.checked = true;
}
function choose(len) {
  const checked = document.querySelector('input[name=aud]:checked');
  if (!build.audienceLocked && checked) audience = checked.value;
  store.set('ondai.audience', audience);
  store.set('ondai.seen', '1');
  render();
  $('onboard').hidden = true;
  const target = len === 'short' ? 'featured' : 'enter';
  if (typeof showChapter === 'function') showChapter(target);
  else {
    try { history.replaceState(null, '', '#' + target); } catch (_) { location.hash = '#' + target; }
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else scrollTo(0, 0);
  }
}
document.querySelectorAll('.lengths button').forEach(b => { b.onclick = () => choose(b.dataset.len); });
const again = $('again');
if (again) again.onclick = () => {
  if (typeof showChapter === 'function') showChapter('enter');
  else scrollTo(0, 0);
  showOnboard();
};

if (!location.hash) {
  try { history.replaceState(null, '', '#enter'); } catch (_) {}
}
document.title = `ond.ai · Spatial Studio · ${worldItems().length} worlds · ${conceptItems().length} concepts`;



// ——— About: Company Profile + interactive LinkedIn career timeline ———
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function setupAboutProfile() {
  const root = $('about');
  if (!root) return;
  let profile;
  try {
    const res = await fetch('./profile.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    profile = await res.json();
  } catch (err) {
    console.warn('profile.json', err);
    return;
  }

  const role = $('aboutRole');
  if (role) role.textContent = profile.currentRole || profile.headlineRole || role.textContent;
  const first = $('aboutFirst');
  if (first) first.textContent = profile.firstPerson || profile.intro || first.textContent;
  const short = $('aboutShort');
  if (short) {
    // Default view: 2–3 sentences max
    const raw = (profile.shortBio || profile.career || '').trim();
    const parts = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
    short.textContent = parts.slice(0, 3).join(' ');
  }
  const why = $('aboutWhy');
  if (why && !why.textContent.trim()) {
    why.textContent = 'Built brand rooms and live objects for teams that brief in space — from global CPG to the next spatial meeting.';
  }
  const long = $('aboutLong');
  if (long) {
    const body = (profile.longBio || profile.now || '').trim();
    long.textContent = body.length > 520 ? body.slice(0, 520).replace(/\s+\S*$/, '') + '…' : body;
  }
  const surf = $('aboutSurfText');
  if (surf && profile.surfingNote) surf.textContent = profile.surfingNote;
  const interests = $('aboutInterests');
  if (interests && profile.interests) interests.textContent = profile.interests;
  const portrait = $('aboutPortrait');
  if (portrait && profile.portrait) {
    portrait.src = profile.portrait;
    portrait.alt = profile.portraitAlt || 'João Caldas';
  }
  const surfImg = $('aboutSurfImg');
  if (surfImg && profile.surfingImage) {
    surfImg.src = profile.surfingImage;
    surfImg.alt = profile.surfingImageAlt || 'Surfing chapter';
  }

  const links = $('aboutLinks');
  if (links) {
    const rows = profile.links || [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/joaocaldas/' },
      { label: 'GitHub', url: 'https://github.com/joaoccaldas' },
      { label: 'Email', url: 'mailto:joaoccaldas@gmail.com' }
    ];
    const primary = rows.slice(0, 2);
    links.innerHTML = primary.map(l => {
      const ext = String(l.url).startsWith('http');
      const cls = l.label === 'LinkedIn' ? 'btn ghost' : 'btn ghost';
      return `<a class="${cls}" href="${esc(l.url)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`;
    }).join('');
  }

  const chapterArt = {
    code: 'img/about/chapter-code.jpg',
    sport: 'img/about/chapter-sport.jpg',
    business: 'img/about/chapter-business.jpg',
    ai: 'img/about/chapter-ai.jpg'
  };
  const chapters = $('aboutChapters');
  if (chapters && Array.isArray(profile.chapters)) {
    chapters.innerHTML = profile.chapters.map(c => `
      <article class="about-chapter" data-chapter="${esc(c.id)}">
        <figure class="about-chapter-media">
          <img src="${esc(c.image || chapterArt[c.id] || 'img/about/ocean-dawn.jpg')}" alt="" loading="lazy">
        </figure>
        <div class="about-chapter-body">
          <p class="eyebrow">${esc(c.period || '')}</p>
          <h4 role="heading" aria-level="3">${esc(c.title || '')}</h4>
          <p>${esc(c.text || '')}</p>
          ${c.carry ? `<p class="carry">${esc(c.carry)}</p>` : ''}
        </div>
      </article>`).join('');
  }

  const speaking = $('aboutSpeaking');
  if (speaking && Array.isArray(profile.speaking) && profile.speaking.length) {
    speaking.innerHTML = `<h3>Ideas worth talking about.</h3><div class="speaking-grid">${
      profile.speaking.map(s => `
        <a class="speaking-card" href="${esc(s.url || '#')}" target="_blank" rel="noopener">
          <p class="eyebrow">${esc(s.when || '')}</p>
          <strong>${esc(s.title || '')}</strong>
          <span>${esc(s.where || '')}</span>
        </a>`).join('')
    }</div>`;
  }

  const note = $('careerNote');
  if (note) note.textContent = profile.timelineNote || '';

  const rows = profile.careerTimeline || [];
  if (!rows.length) return;

  const rail = $('careerRail');
  const jump = $('careerJump');
  if (!rail || !jump) return;
  const shortName = (company) => company
    .replace(/ (Nordics|Sweden|International|Corporation|Foods|Foundation|Worldwide|AB)$/g, '')
    .replace('20th Century Fox', '20th C. Fox');

  rail.innerHTML = rows.map((c, i) => {
    const year = (c.period || '').match(/\d{4}/)?.[0] || (i === rows.length - 1 ? 'Now' : '—');
    const logo = c.thumbnail
      ? `<span class="career-marker-logo"><img src="${esc(c.thumbnail)}" alt=""></span>`
      : `<span class="career-marker-logo is-fallback">${esc(shortName(c.company).slice(0,1))}</span>`;
    return `<button type="button" class="career-marker" role="listitem" data-career="${i}" aria-pressed="false" aria-label="${esc(c.company)} · ${esc(c.period)}">
      ${logo}
      <span class="career-pin">${esc(year)}</span>
      <strong>${esc(shortName(c.company))}</strong>
      <small>${esc(c.role || '')}</small>
    </button>`;
  }).join('');
  jump.innerHTML = rows.map((c, i) => `<option value="${i}">${esc(c.company)}</option>`).join('');

  const strip = $('careerLogoStrip');
  if (strip) {
    const seen = new Set();
    strip.innerHTML = rows.map(c => {
      const key = c.brand || c.company;
      if (seen.has(key)) return '';
      seen.add(key);
      if (!c.thumbnail) return '';
      return `<img src="${esc(c.thumbnail)}" alt="${esc(c.company)}" title="${esc(c.company)}">`;
    }).join('');
  }


  let idx = rows.length - 1;
  let timer = null;

  const paint = (i) => {
    idx = (i + rows.length) % rows.length;
    const c = rows[idx];
    $('careerPeriod').textContent = c.period || '';
    $('careerCompany').textContent = c.company || '';
    $('careerRole').textContent = c.role || '';
    $('careerPlace').textContent = c.place || '';
    $('careerText').textContent = c.text || '';
    $('careerCount').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(rows.length).padStart(2, '0')}`;
    jump.value = String(idx);

    const challenge = $('careerChallenge');
    if (challenge) {
      const line = c.challenge || '';
      challenge.textContent = line;
      challenge.hidden = !line;
    }

    const logo = $('careerLogo');
    if (c.thumbnail) {
      logo.hidden = false;
      logo.classList.remove('is-fallback');
      logo.innerHTML = `<img src="${esc(c.thumbnail)}" alt="${esc(c.thumbnailAlt || c.company)}">`;
    } else {
      logo.hidden = false;
      logo.classList.add('is-fallback');
      logo.textContent = shortName(c.company || '').slice(0, 18);
    }

    const details = $('careerDetails');
    const bits = c.details || [];
    details.innerHTML = bits.length
      ? `<p class="career-details-label">What I owned</p>` + bits.map(d => `<li>${esc(d)}</li>`).join('')
      : '';
    details.hidden = !bits.length;

    const tags = $('careerTags');
    tags.innerHTML = (c.tags || []).map(t => `<span>${esc(t)}</span>`).join('');

    rail.querySelectorAll('[data-career]').forEach(btn => {
      const on = Number(btn.dataset.career) === idx;
      btn.setAttribute('aria-pressed', String(on));
      if (on) {
        // Horizontal only — never scroll the page (scrollIntoView was yanking the viewport up)
        const left = btn.offsetLeft - (rail.clientWidth - btn.clientWidth) / 2;
        rail.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    });

    const focus = root.querySelector('.career-focus');
    if (focus && focus.animate) {
      focus.animate(
        [{ opacity: 0.55, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  };

  const stopPlay = () => {
    if (timer) { clearInterval(timer); timer = null; }
    const play = $('careerPlay');
    if (play) {
      play.setAttribute('aria-pressed', 'false');
      play.textContent = '▷ Play the journey';
    }
  };

  const select = (i, manual = true) => {
    if (manual) stopPlay();
    paint(i);
  };

  rail.querySelectorAll('[data-career]').forEach(btn => {
    btn.onclick = () => select(Number(btn.dataset.career));
  });
  const careerPrev = $('careerPrev');
  const careerNext = $('careerNext');
  const careerPlay = $('careerPlay');
  if (careerPrev) careerPrev.onclick = () => select(idx - 1);
  if (careerNext) careerNext.onclick = () => select(idx + 1);
  jump.onchange = (e) => select(Number(e.target.value));
  if (careerPlay) careerPlay.onclick = () => {
    if (timer) { stopPlay(); return; }
    select(0, false);
    const play = $('careerPlay');
    play.setAttribute('aria-pressed', 'true');
    play.textContent = 'Ⅱ Pause the journey';
    timer = setInterval(() => {
      if (document.hidden) return;
      const next = idx + 1;
      if (next >= rows.length) { stopPlay(); paint(rows.length - 1); return; }
      paint(next);
    }, 2600);
  };

  paint(idx);
}

setupAboutProfile();

window.__app = {
  cat, ITEMS, render, resolveUrl, worldItems, conceptItems, objectItems, featuredItems,
  counts: () => ({ featured: featuredItems().length, worlds: worldItems().length, concepts: conceptItems().length, objects: objectItems().length, chapters: CHAPTER_IDS.slice() })
};
