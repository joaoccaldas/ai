import { catalog } from './catalog.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const SHOP = 'https://ridewyld.com';
const img = (path, w) => `${SHOP}${path}?width=${w}`;
const srcset = (path, ws = [400, 700, 1000, 1400]) => ws.map(w => `${img(path, w)} ${w}w`).join(',');
const money = n => `AED ${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0 })}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const EXT = 'target="_blank" rel="noopener"';
// Map, not a plain object: hash input like "#/p/constructor" must not hit Object.prototype.
const byHandle = new Map(catalog.map(p => [p.handle, p]));
const variants = new Map(catalog.flatMap(p => p.variants.map(v => [v.id, { p, v }])));
const store = {
  get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode or quota */ } },
};

const CATS = {
  all: { title: 'All products', test: () => true },
  cycling: { title: 'Cycling', test: p => p.category === 'cycling' },
  triathlon: { title: 'Triathlon', test: p => p.category === 'triathlon' },
  run: { title: 'Run WYLD', test: p => p.category === 'run' },
  accessories: { title: 'Accessories', test: p => p.category === 'accessories' },
  sale: { title: 'Sale', test: p => p.was && p.available },
};
const RANK = ['Race Fit Jersey', 'Trisuit', 'Bib Shorts', 'Singlet', 'T-Shirt', 'Long Sleeve Shirt', 'Gilet', 'Club Fit Jersey', 'Cap', 'Ear Plugs', 'Gift Cards'];
const rank = p => (p.available ? 0 : 100) + (RANK.indexOf(p.kind) + 1 || 50);
const KIND_LABEL = { 'Race Fit Jersey': 'Race Fit', 'Club Fit Jersey': 'Club Fit', 'Bib Shorts': 'Bib shorts', Gilet: 'Gilets' };
const FIT = {
  'Race Fit Jersey': 'Race Fit is our close, aerodynamic cut — made to sit snug against the body for fast riding.',
  'Club Fit Jersey': 'Club Fit is a more relaxed cut for comfortable long days and social rides.',
  'Bib Shorts': 'Bib shorts are designed to fit snugly; the straps and leg grippers keep everything in place while you ride.',
  Trisuit: 'A close-fitting one-piece designed to be worn from swim to run.',
};
const STYLE_LABEL = { Female: 'Women', Male: 'Men', Unisex: 'Unisex' };
// The colour index: WYLD colourways as they appear in product names.
const COLOURS = [
  ['raspberry', 'Raspberry', '#a3134a'],
  ['grape', 'Grape', '#6f4cd9'],
  ['blueberry', 'Blueberry', '#2f4fd6'],
  ['olive', 'Olive', '#7f8b2f'],
  ['tiffany', 'Tiffany', '#55d8d3'],
  ['blush', 'Blush', 'linear-gradient(150deg,#ff5fa2,#c9b8ff)'],
  ['skye', 'Skye', 'linear-gradient(150deg,#1f7cff,#55e0d8)'],
  ['jungle', 'Jungle', '#1e5d78'],
  ['berry blast', 'Berry Blast', 'linear-gradient(150deg,#d42b7f,#6f4cd9)'],
  ['pink', 'Pink', '#ff2f92'],
  ['blue', 'Blue', '#3a78c9'],
  ['navy', 'Navy', '#1f2b55'],
  ['midnight', 'Midnight', '#1a1d33'],
  ['green', 'Green', '#8fa596'],
  ['black', 'Black', '#111113'],
].map(([key, name, c]) => ({ key, name, c, re: new RegExp(`\\b${key}\\b`, 'i') }));
const colourOf = key => COLOURS.find(c => c.key === key);

/* ---------- product card ---------- */
function priceHTML(p, from = p.from) {
  const pre = from ? 'From ' : '';
  return p.was
    ? `<span class="price"><span class="now">${pre}${money(p.price)}</span><s>${money(p.was)}</s></span>`
    : `<span class="price">${pre}${money(p.price)}</span>`;
}
function card(p, sizes = '(min-width:1080px) 24vw, (min-width:720px) 32vw, 48vw') {
  const [a, b] = p.images;
  const badge = !p.available ? '<span class="badge out">Sold out</span>'
    : p.was ? `<span class="badge sale">−${Math.round((1 - p.price / p.was) * 100)}%</span>` : '';
  return `<article class="card${p.available ? '' : ' soldout'}">
    <a href="#/p/${p.handle}" data-product="${p.handle}">
      <div class="card-media">
        ${badge}
        <img src="${img(a, 700)}" srcset="${srcset(a)}" sizes="${sizes}" alt="${esc(p.title)}" loading="lazy">
        ${b ? `<img class="alt" src="${img(b, 700)}" srcset="${srcset(b)}" sizes="${sizes}" alt="" loading="lazy">` : ''}
      </div>
      <div class="card-info"><h3>${esc(p.title)}</h3><span class="card-kind">${esc(p.kind)}</span>${priceHTML(p)}</div>
    </a>
    ${p.available ? `<button class="quick" data-quick="${p.handle}" aria-label="Quick add ${esc(p.title)}"><svg viewBox="0 0 24 24"><use href="#i-plus"/></svg></button>` : ''}
  </article>`;
}

/* ---------- shop grid ---------- */
const state = { cat: 'all', sub: null, gender: null, colour: null, sort: 'featured' };
function list() {
  let items = catalog.filter(CATS[state.cat].test);
  if (state.sub) items = items.filter(p => p.kind === state.sub);
  if (state.gender) items = items.filter(p => p[state.gender]);
  if (state.colour) items = items.filter(p => colourOf(state.colour).re.test(p.title));
  const s = {
    featured: (a, b) => rank(a) - rank(b),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    az: (a, b) => a.title.localeCompare(b.title),
  }[state.sort];
  return items.slice().sort(s);
}
function renderChips() {
  const base = catalog.filter(CATS[state.cat].test);
  const kinds = [...new Set(base.map(p => p.kind))].sort((a, b) => RANK.indexOf(a) - RANK.indexOf(b));
  let html = '';
  if (kinds.length > 1 && state.cat !== 'all') {
    html += `<button class="chip${state.sub ? '' : ' on'}" data-sub="">All</button>`;
    html += kinds.map(k => `<button class="chip${state.sub === k ? ' on' : ''}" data-sub="${esc(k)}">${esc(KIND_LABEL[k] || k)}</button>`).join('');
  }
  if (base.some(p => p.women) && base.some(p => p.men) && state.cat !== 'accessories') {
    html += ['women', 'men'].map(g => `<button class="chip${state.gender === g ? ' on' : ''}" data-gender="${g}">${g === 'women' ? 'Women' : 'Men'}</button>`).join('');
  }
  if (state.colour) html = `<button class="chip on" data-colour-clear aria-label="Clear colour filter">${esc(colourOf(state.colour).name)} ×</button>` + html;
  $('#chips').innerHTML = html;
}
function renderGrid() {
  const items = list();
  $('#grid').innerHTML = items.length ? items.map(p => card(p)).join('') : '<p class="empty">Nothing here right now — try another filter.</p>';
  $('#count').textContent = `${items.length} ${items.length === 1 ? 'product' : 'products'}`;
  $('#shopTitle').textContent = state.colour ? `${colourOf(state.colour).name}` : state.sub ? (KIND_LABEL[state.sub] || state.sub) : CATS[state.cat].title;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.cat === state.cat));
  renderChips();
}
function setCategory(cat, sub = null) {
  if (!CATS[cat]) return;
  Object.assign(state, { cat, sub, gender: null, colour: null });
  renderGrid();
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setCategory(b.dataset.cat); });
$('#chips').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if ('sub' in b.dataset) state.sub = b.dataset.sub || null;
  if (b.dataset.gender) state.gender = state.gender === b.dataset.gender ? null : b.dataset.gender;
  if ('colourClear' in b.dataset) { state.colour = null; renderColours(); }
  renderGrid();
});
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });

document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { closeAll(); setCategory(go.dataset.go, go.dataset.sub || null); }
});

$$('[data-count]').forEach(el => {
  const n = catalog.filter(CATS[el.dataset.count].test).length;
  el.textContent = `${n} ${n === 1 ? 'style' : 'styles'}`;
});
$('#featureRail').innerHTML = catalog.filter(p => p.kind === 'Race Fit Jersey' && p.available)
  .sort((a, b) => ['raspberry-jersey', 'grape-jersey', 'blueberry', 'olive'].indexOf(b.handle) - ['raspberry-jersey', 'grape-jersey', 'blueberry', 'olive'].indexOf(a.handle))
  .slice(0, 4).map(p => card(p, '(min-width:1080px) 20vw, (min-width:720px) 28vw, 46vw')).join('');

/* ---------- colour index ---------- */
function renderColours() {
  $('#colourRow').innerHTML = COLOURS.map(c => {
    const n = catalog.filter(p => p.available && c.re.test(p.title)).length;
    if (!n) return '';
    return `<button class="colour${state.colour === c.key ? ' on' : ''}" role="listitem" data-colour="${c.key}" aria-pressed="${state.colour === c.key}"><i style="--c:${c.c}"></i><span><b>${c.name}</b><small>${n} ${n === 1 ? 'style' : 'styles'}</small></span></button>`;
  }).join('');
}
$('#colourRow').addEventListener('click', e => {
  const b = e.target.closest('[data-colour]'); if (!b) return;
  Object.assign(state, { cat: 'all', sub: null, gender: null, colour: b.dataset.colour });
  renderColours(); renderGrid();
  $('#shop').scrollIntoView({ behavior: 'smooth' });
});

/* ---------- kit builder ---------- */
const kit = {
  tops: catalog.filter(p => p.available && /Jersey$/.test(p.kind) && !/Long Sleeve/i.test(p.title)).sort((a, b) => rank(a) - rank(b)),
  bottoms: catalog.filter(p => p.available && p.kind === 'Bib Shorts'),
  top: 0, bottom: 0, sel: [{}, {}],
};
const kitItems = () => [kit.tops[kit.top], kit.bottoms[kit.bottom]];
// Prefer a front-on product photo; otherwise the first image (often a fabric close-up).
const kitImage = p => p.images.find(i => /product|front/i.test(i)) || p.images[0];
function kitTrack(el, items) {
  el.innerHTML = items.map(p => `<figure><img src="${img(kitImage(p), 700)}" srcset="${srcset(kitImage(p), [400, 700, 1000])}" sizes="(min-width:1080px) 40vw, 90vw" alt="${esc(p.title)}" loading="lazy"></figure>`).join('');
}
function kitSummary() {
  const [t, b] = kitItems();
  $('#kitTopName').innerHTML = `${esc(t.title)} · ${money(t.price)}`;
  $('#kitBottomName').innerHTML = `${esc(b.title)} · ${money(b.price)}`;
  $('#kitTotal').textContent = money(t.price + b.price);
}
function kitIndexFromScroll(el) { return Math.round(el.scrollLeft / el.clientWidth); }
if (kit.tops.length && kit.bottoms.length) {
  kitTrack($('#kitTop'), kit.tops); kitTrack($('#kitBottom'), kit.bottoms);
  // Open on a signature pairing when both are in stock.
  kit.top = Math.max(0, kit.tops.findIndex(p => p.handle === 'raspberry-jersey'));
  kit.bottom = Math.max(0, kit.bottoms.findIndex(p => p.handle === 'pink-bib-shorts'));
  requestAnimationFrame(() => {
    $('#kitTop').scrollTo({ left: kit.top * $('#kitTop').clientWidth, behavior: 'instant' });
    $('#kitBottom').scrollTo({ left: kit.bottom * $('#kitBottom').clientWidth, behavior: 'instant' });
  });
  kitSummary();
  for (const [id, key, list] of [['#kitTop', 'top', kit.tops], ['#kitBottom', 'bottom', kit.bottoms]]) {
    let t;
    $(id).addEventListener('scroll', e => {
      clearTimeout(t);
      t = setTimeout(() => { kit[key] = Math.min(list.length - 1, kitIndexFromScroll(e.target)); kitSummary(); }, 80);
    }, { passive: true });
  }
  $('#kit').addEventListener('click', e => {
    const a = e.target.closest('[data-kit-step]'); if (!a) return;
    const key = a.dataset.kitStep, list = key === 'top' ? kit.tops : kit.bottoms, el = key === 'top' ? $('#kitTop') : $('#kitBottom');
    kit[key] = (kit[key] + Number(a.dataset.dir) + list.length) % list.length;
    el.scrollTo({ left: kit[key] * el.clientWidth, behavior: 'smooth' });
    kitSummary();
  });
} else {
  $('#kit').hidden = true;
}
function renderKitSheet() {
  const items = kitItems();
  let total = 0, ready = true;
  $('#kitBody').innerHTML = items.map((p, i) => {
    const v = variantForP(p, kit.sel[i]);
    total += v ? v.price : p.price;
    if (!v || !v.ok) ready = false;
    return `<div class="kit-item"><figure><img src="${img(kitImage(p), 300)}" alt=""></figure>
      <div><h3>${esc(p.title)}</h3>${priceHTML(v ? { price: v.price, was: v.was && v.was > v.price ? v.was : null } : p, !v && p.from)}${optionGroupsHTML(p, kit.sel[i], 'kopt', i)}</div></div>`;
  }).join('');
  $('#kitSheetTotal').textContent = money(total);
  const add = $('#kitAdd'); add.disabled = !ready; add.textContent = ready ? `Add kit to bag — ${money(total)}` : 'Choose a size for each piece';
}
$('#kitChoose').addEventListener('click', () => {
  kit.sel = kitItems().map(defaultSelection);
  renderKitSheet(); open('kitSheet');
});
$('#kitBody').addEventListener('click', e => {
  const b = e.target.closest('[data-kopt]'); if (!b) return;
  const i = Number(b.dataset.item), p = kitItems()[i];
  applyOption(p, kit.sel[i], b.dataset.kopt, b.dataset.val);
  renderKitSheet();
});
$('#kitAdd').addEventListener('click', () => {
  const vs = kitItems().map((p, i) => variantForP(p, kit.sel[i]));
  if (!vs.every(v => v?.ok)) return;
  vs.forEach(v => { const line = bag.find(l => l.id === v.id); if (line) line.qty = Math.min(line.qty + 1, 10); else bag.push({ id: v.id, qty: 1 }); });
  saveBag(); closeAll(); showToast('Kit added to your bag');
});

/* ---------- size band ---------- */
const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
$('#bandTrack').innerHTML = [...SIZES, ...SIZES].map(s => `<span>${s}</span>`).join('');

/* ---------- overlays ---------- */
const scrim = $('#scrim');
let lastFocus = null;
function lock() {
  const any = $$('.drawer.on,.search.on,.pdp.on').length;
  document.body.classList.toggle('locked', !!any);
  scrim.classList.toggle('on', !!$$('.drawer.on,.search.on').length);
}
function open(id) {
  lastFocus = document.activeElement;
  $$('.drawer.on,.search.on').forEach(el => { if (el.id !== id) { el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); } });
  const el = $('#' + id);
  el.classList.add('on'); el.setAttribute('aria-hidden', 'false');
  if (id === 'bag') renderBag();
  if (id === 'search') { renderSearch(); setTimeout(() => $('#q').focus(), 80); }
  else setTimeout(() => $('[data-close]', el)?.focus({ preventScroll: true }), 60);
  lock();
}
function closeAll() {
  $$('.drawer.on,.search.on').forEach(el => { el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); });
  lock();
  lastFocus?.focus?.({ preventScroll: true });
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) { e.preventDefault(); hideToast(); open(o.dataset.open); return; }
  const c = e.target.closest('[data-close]');
  if (c) { c.closest('#pdp') ? closePdp() : closeAll(); }
});
scrim.addEventListener('click', closeAll);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($$('.drawer.on,.search.on').length) closeAll(); else if ($('#pdp').classList.contains('on')) closePdp();
});

/* ---------- product detail ---------- */
const pdp = $('#pdp');
let current = null, sel = {};
pdp.addEventListener('scroll', () => {
  const actions = $('#pdpActions'); if (!actions) return;
  $('#pdpSticky').classList.toggle('on', actions.getBoundingClientRect().bottom < 0);
}, { passive: true });

/* Option logic shared by the product view and the kit builder. */
const matchesP = (p, v, s) => p.options.every((o, i) => !s[o.name] || v.o[i] === s[o.name]);
const variantForP = (p, s) => p.options.every(o => s[o.name]) ? p.variants.find(v => matchesP(p, v, s)) : null;
const valueOKP = (p, s, name, value) => p.variants.some(v => v.ok && matchesP(p, v, { ...s, [name]: value }));

function defaultSelection(p) {
  const s = {};
  p.options.forEach((o, i) => {
    const firstOK = o.values.find(val => p.variants.some(v => v.ok && v.o[i] === val));
    if (o.values.length === 1 || o.name !== 'Size') s[o.name] = firstOK || o.values[0];
  });
  return s;
}

// attr: data attribute prefix, so several pickers can live on one page.
function optionGroupsHTML(p, s, attr = 'opt', item = '') {
  return p.options.map(o => {
    const isSize = o.name === 'Size';
    const label = o.name === 'Style' ? 'Fit' : o.name;
    const btns = o.values.map(val => {
      const ok = valueOKP(p, s, o.name, val), on = s[o.name] === val;
      const txt = o.name === 'Style' ? (STYLE_LABEL[val] || val) : o.name === 'Amount' ? val.replace(/\s*AED/, '') : val;
      return `<button class="${on ? 'on' : ''}${ok ? '' : ' na'}" data-${attr}="${esc(o.name)}" data-val="${esc(val)}"${item !== '' ? ` data-item="${item}"` : ''} aria-pressed="${on}" aria-label="${esc(txt)}${ok ? '' : ', sold out'}">${esc(txt)}</button>`;
    }).join('');
    const shown = s[o.name] ? (o.name === 'Style' ? STYLE_LABEL[s[o.name]] || s[o.name] : s[o.name]) : (isSize ? 'Select a size' : '');
    return `<div class="opt"><div class="opt-head"><span>${label}: <b>${esc(shown)}</b></span>${isSize ? `<a class="remove guide" href="${SHOP}/products/${p.handle}" ${EXT}>Size guide</a>` : ''}</div>
      <div class="${isSize ? 'sizes' : 'styles'}">${btns}</div></div>`;
  }).join('');
}
// When a fit changes, drop a size that no longer exists in stock for it.
function applyOption(p, s, name, val) {
  s[name] = val;
  const v = variantForP(p, s);
  if (name !== 'Size' && s.Size && v && !v.ok) delete s.Size;
}

function actionState() {
  const v = variantForP(current, sel);
  if (!current.available) return { text: 'Sold out', disabled: true, v };
  if (current.options.some(o => !sel[o.name])) return { text: 'Select a size', disabled: false, needs: true, v };
  if (!v || !v.ok) return { text: 'Sold out in this size', disabled: true, v };
  return { text: `Add to bag — ${money(v.price)}`, disabled: false, v };
}

function renderPdpDynamic() {
  $('#pdpOptions').innerHTML = optionGroupsHTML(current, sel);
  const a = actionState();
  $$('[data-add]', pdp).forEach(b => { b.textContent = a.text; b.disabled = a.disabled; });
  if (a.v) $('#pdpPrice').innerHTML = priceHTML({ price: a.v.price, was: a.v.was && a.v.was > a.v.price ? a.v.was : null }, false);
}

function openPdp(handle, push = true) {
  const p = byHandle.get(handle); if (!p) return;
  current = p; sel = defaultSelection(p);
  const cat = { cycling: 'Cycling', triathlon: 'Triathlon', run: 'Run WYLD', accessories: 'Accessories' }[p.category];
  const copy = p.copy.length ? p.copy : [FIT[p.kind] || `The ${p.title} — designed by WYLD for riders, triathletes and runners who want colour, comfort and a great fit.`];
  const related = catalog.filter(x => x.handle !== p.handle && x.available && (x.kind === p.kind || x.category === p.category))
    .sort((a, b) => (b.kind === p.kind) - (a.kind === p.kind) || rank(a) - rank(b)).slice(0, 4);
  $('#pdpContent').innerHTML = `
    <div class="pdp-grid">
      <div class="gallery">
        <div class="gallery-track" id="gTrack">
          ${p.images.map((src, i) => `<figure><img src="${img(src, 1200)}" srcset="${srcset(src, [600, 900, 1200, 1800])}" sizes="(min-width:1080px) ${i ? 34 : 68}vw, 100vw" alt="${esc(p.title)} — view ${i + 1}" ${i ? 'loading="lazy"' : ''}></figure>`).join('')}
        </div>
        ${p.images.length > 1 ? `<div class="gallery-dots" id="gDots">${p.images.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      </div>
      <div class="pdp-info">
        <div class="crumbs"><span>${cat}</span><span>/</span><span>${esc(p.kind)}</span></div>
        <h1>${esc(p.title)}</h1>
        <div id="pdpPrice">${priceHTML(p)}</div>
        <div id="pdpOptions"></div>
        <div class="pdp-actions" id="pdpActions">
          <button class="btn block" data-add></button>
          <a class="btn ghost block" href="${SHOP}/products/${p.handle}" ${EXT}>View on ridewyld.com</a>
        </div>
        <ul class="perks">
          <li><svg><use href="#i-lock"/></svg>Secure checkout on ridewyld.com</li>
          <li><svg><use href="#i-truck"/></svg>Shipping calculated at checkout</li>
          ${p.category !== 'accessories' ? '<li><svg><use href="#i-ruler"/></svg>Size-inclusive range — see the size guide for your fit</li>' : ''}
        </ul>
        <details open><summary>Details</summary><div class="body">${copy.map(t => `<p>${esc(t)}</p>`).join('')}</div></details>
        ${FIT[p.kind] && p.copy.length ? `<details><summary>Fit</summary><div class="body"><p>${FIT[p.kind]}</p></div></details>` : ''}
        <details><summary>Delivery &amp; returns</summary><div class="body"><p>Orders are fulfilled by WYLD via ridewyld.com. See the <a class="u" href="${SHOP}/policies/shipping-policy" ${EXT}>shipping</a> and <a class="u" href="${SHOP}/policies/refund-policy" ${EXT}>returns</a> policies for details.</p></div></details>
      </div>
    </div>
    ${related.length ? `<div class="related"><h2 class="h2">You may also like</h2><div class="grid">${related.map(x => card(x)).join('')}</div></div>` : ''}
    <div class="pdp-sticky" id="pdpSticky"><div><strong>${esc(p.title)}</strong><span id="stickySel"></span></div><button class="btn" data-add></button></div>`;
  renderPdpDynamic();
  pdp.scrollTop = 0;
  pdp.classList.add('on'); pdp.setAttribute('aria-hidden', 'false');
  lock();
  if (push && location.hash !== `#/p/${handle}`) history.pushState({ pdp: handle }, '', `#/p/${handle}`);
  document.title = `${p.title} — WYLD`;

  const track = $('#gTrack'), dots = $$('#gDots i');
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    dots.forEach((d, j) => d.classList.toggle('on', i === j));
  }, { passive: true });
  setTimeout(() => $('.pdp-close').focus({ preventScroll: true }), 60);
}
function closePdp() {
  if (history.state?.pdp) history.back(); else hidePdp();
}
function hidePdp() {
  pdp.classList.remove('on'); pdp.setAttribute('aria-hidden', 'true');
  document.title = 'WYLD — Cycling, Triathlon & Run Apparel';
  if (location.hash.startsWith('#/p/')) history.replaceState(null, '', location.pathname + location.search);
  lock();
}
window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#\/p\/([a-z0-9-]+)$/);
  if (m) openPdp(m[1], false); else if (pdp.classList.contains('on')) hidePdp();
});

pdp.addEventListener('click', e => {
  const o = e.target.closest('[data-opt]');
  if (o) {
    applyOption(current, sel, o.dataset.opt, o.dataset.val);
    renderPdpDynamic();
    const size = sel.Size ? `Size ${sel.Size}` : ''; $('#stickySel').textContent = [STYLE_LABEL[sel.Style], size].filter(Boolean).join(' · ');
    return;
  }
  const add = e.target.closest('[data-add]');
  if (add) {
    const a = actionState();
    if (a.needs) {
      $('#pdpOptions').scrollIntoView({ behavior: 'smooth', block: 'center' });
      const sizes = $('.sizes', pdp); sizes?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      return;
    }
    if (a.v?.ok) addToBag(a.v.id, current.handle);
  }
});

document.addEventListener('click', e => {
  const q = e.target.closest('[data-quick]');
  if (q) {
    e.preventDefault(); e.stopPropagation();
    const p = byHandle.get(q.dataset.quick); if (!p) return;
    const ok = p.variants.filter(v => v.ok);
    if (ok.length === 1) addToBag(ok[0].id, p.handle); else { closeAll(); openPdp(p.handle); }
    return;
  }
  const c = e.target.closest('[data-product]');
  if (c) { e.preventDefault(); closeAll(); openPdp(c.dataset.product); }
});

/* ---------- bag ---------- */
const BAG_KEY = 'wyld-bag-v1';
// Shared with the app. Everything read back is validated against the catalog.
const readBag = () => {
  const raw = store.get(BAG_KEY, []);
  return Array.isArray(raw) ? raw.filter(l => l && Number.isSafeInteger(l.id) && variants.has(l.id) && Number.isInteger(l.qty) && l.qty > 0)
    .map(l => ({ id: l.id, qty: Math.min(l.qty, 10) })) : [];
};
let bag = readBag();
const findVariant = id => variants.get(id) || null;
window.addEventListener('storage', e => { if (e.key === BAG_KEY) { bag = readBag(); updateBadge(); if ($('#bag').classList.contains('on')) renderBag(); } });
function saveBag() { store.set(BAG_KEY, bag); updateBadge(); }
function updateBadge() {
  const n = bag.reduce((s, l) => s + l.qty, 0);
  const el = $('#bagCount'); el.textContent = n; el.classList.toggle('on', n > 0);
  $('#bagHeadCount').textContent = n ? `(${n})` : '';
}
function variantLabel(p, v) {
  return p.options.map((o, i) => o.name === 'Style' ? STYLE_LABEL[v.o[i]] || v.o[i] : o.name === 'Size' ? `Size ${v.o[i]}` : v.o[i]).join(' · ');
}
function addToBag(id, handle) {
  const line = bag.find(l => l.id === id);
  if (line) line.qty = Math.min(line.qty + 1, 10); else bag.push({ id, qty: 1 });
  saveBag();
  const { p, v } = findVariant(id);
  showToast(`${p.title}${p.options.length && v.o.length ? ' · ' + variantLabel(p, v) : ''} added`);
}
function renderBag() {
  const body = $('#bagBody'), foot = $('#bagFoot');
  if (!bag.length) {
    body.innerHTML = `<div class="bag-empty"><p>Your bag is empty.</p><a class="btn" href="#shop" data-go="all">Shop the collection</a></div>
      <div class="bag-popular"><span class="eyebrow muted">Popular</span><div class="grid">${['raspberry-jersey', 'black-bib-shorts'].map(h => byHandle.get(h)).filter(Boolean).map(p => card(p, '45vw')).join('')}</div></div>`;
    foot.style.display = 'none';
    return;
  }
  foot.style.display = '';
  let total = 0;
  body.innerHTML = bag.map(l => {
    const { p, v } = findVariant(l.id); total += v.price * l.qty;
    return `<div class="line">
      <figure><img src="${img(p.images[0], 300)}" alt=""></figure>
      <div><h3>${esc(p.title)}</h3><p>${esc(variantLabel(p, v))}</p>
        <div class="line-row"><span class="qty"><button data-dec="${l.id}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-inc="${l.id}" aria-label="Increase">+</button></span><button class="remove" data-rm="${l.id}">Remove</button></div></div>
      <div class="line-price">${money(v.price * l.qty)}</div></div>`;
  }).join('');
  $('#subtotal').textContent = money(total);
  $('#checkout').href = `${SHOP}/cart/${bag.map(l => `${l.id}:${l.qty}`).join(',')}`;
}
$('#bagBody').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = Number(b.dataset.inc || b.dataset.dec || b.dataset.rm);
  const line = bag.find(l => l.id === id); if (!line) return;
  if (b.dataset.inc) line.qty = Math.min(line.qty + 1, 10);
  if (b.dataset.dec) line.qty -= 1;
  if (b.dataset.rm || line.qty < 1) bag = bag.filter(l => l !== line);
  saveBag(); renderBag();
});

let toastTimer;
function showToast(text) {
  $('#toastText').textContent = text;
  $('#toast').classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 3800);
}
function hideToast() { $('#toast').classList.remove('on'); }

/* ---------- search ---------- */
const SUGGEST = ['Jersey', 'Bib shorts', 'Trisuit', 'Singlet', 'Gilet', 'Cap', 'Sale'];
function renderSearch() {
  const q = $('#q').value.trim().toLowerCase();
  const out = $('#searchResults');
  if (!q) {
    out.innerHTML = `<span class="eyebrow muted">Popular searches</span><div class="search-suggest">${SUGGEST.map(s => `<button class="chip" data-q="${s}">${s}</button>`).join('')}</div>`;
    return;
  }
  const terms = q.replace('bib shorts', 'bib').split(/\s+/);
  const hits = catalog.filter(p => {
    const hay = `${p.title} ${p.kind} ${p.category} ${p.was ? 'sale' : ''} ${p.women ? 'women' : ''} ${p.men ? 'men' : ''}`.toLowerCase();
    return terms.every(t => hay.includes(t));
  }).sort((a, b) => rank(a) - rank(b));
  out.innerHTML = `<span class="count">${hits.length} result${hits.length === 1 ? '' : 's'}</span>` +
    (hits.length ? `<div class="grid">${hits.slice(0, 12).map(p => card(p)).join('')}</div>` : '<p class="empty">No matches. Try “jersey” or “bib”.</p>');
}
$('#q').addEventListener('input', renderSearch);
$('#searchResults').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { $('#q').value = b.dataset.q; renderSearch(); } });

/* ---------- header & hero ---------- */
const header = $('#header'), hero = $('#hero');
function onScroll() { header.classList.toggle('over', window.scrollY < hero.offsetHeight - header.offsetHeight - 40); }
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

const slides = $$('.slide', hero), dots = $$('#heroDots button');
let slide = 0, slideTimer;
function showSlide(i) {
  slide = (i + slides.length) % slides.length;
  slides.forEach((s, j) => s.classList.toggle('on', j === slide));
  dots.forEach((d, j) => { d.classList.remove('on'); if (j === slide) { void d.offsetWidth; d.classList.add('on'); } });
  const s = slides[slide];
  $('#heroEyebrow').textContent = s.dataset.eyebrow;
  $('#heroTitle').textContent = s.dataset.title;
  $('#heroCta').dataset.go = s.dataset.go;
  clearTimeout(slideTimer); slideTimer = setTimeout(() => showSlide(slide + 1), 6000);
}
dots.forEach((d, i) => d.addEventListener('click', () => showSlide(i)));
let touchX = null;
hero.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
hero.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 50) showSlide(slide + (dx < 0 ? 1 : -1));
});
document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(slideTimer); else showSlide(slide); });
showSlide(0);

const ann = $$('#announce li'); let annI = 0;
setInterval(() => { ann[annI].classList.remove('on'); annI = (annI + 1) % ann.length; ann[annI].classList.add('on'); }, 4200);

const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- 3D studio ---------- */
// The 3D viewer script loads only when the studio is about to scroll into view,
// pinned with Subresource Integrity so a changed CDN file is refused.
const MODEL_VIEWER = {
  src: 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
  integrity: 'sha384-sr9b4Ux0WhAUGclJ0ym0FSY2zSOMmNSn0bP/SA0e6bNCrpn/5W3QL8mm+LdlQMKw',
};
const studioIO = new IntersectionObserver(entries => {
  if (!entries.some(e => e.isIntersecting)) return;
  studioIO.disconnect();
  const sc = document.createElement('script');
  sc.type = 'module'; sc.src = MODEL_VIEWER.src; sc.integrity = MODEL_VIEWER.integrity; sc.crossOrigin = 'anonymous';
  document.head.append(sc);
}, { rootMargin: '800px 0px' });
studioIO.observe($('#studio'));
const viewer = $('#viewer');
let rgb = $('#swatches .swatch.on').dataset.rgb.split(',').map(Number);
function tint() {
  if (!viewer.model) return;
  viewer.model.materials.filter(m => m.name === 'FABRIC_PRIMARY').forEach(m => m.pbrMetallicRoughness.setBaseColorFactor([...rgb, 1]));
}
viewer.addEventListener('load', tint);
$('#garments').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#garments button').forEach(x => x.classList.toggle('on', x === b));
  $('#garmentName').textContent = b.dataset.name;
  viewer.src = `./assets/blender/${b.dataset.model}.glb`;
});
$('#swatches').addEventListener('click', e => {
  const b = e.target.closest('.swatch'); if (!b) return;
  $$('#swatches .swatch').forEach(x => x.classList.toggle('on', x === b));
  $('#colourName').textContent = b.dataset.name;
  rgb = b.dataset.rgb.split(',').map(Number); tint();
});

/* ---------- misc ---------- */
const marquee = $('#marquee'); marquee.innerHTML += marquee.innerHTML;
$('#year').textContent = new Date().getFullYear();
$('#newsForm').addEventListener('submit', () => { $('#newsNote').textContent = 'Thanks — finish signing up on ridewyld.com.'; });

/* ---------- app banner (phones, once per visitor until dismissed) ---------- */
const APP_KEY = 'wyld-app-banner-dismissed-v1';
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let bannerDismissed = false;
try { bannerDismissed = localStorage.getItem(APP_KEY) === '1'; } catch { /* storage blocked */ }
if (!standalone && !bannerDismissed && matchMedia('(max-width: 719px)').matches) {
  setTimeout(() => { if (!document.body.classList.contains('locked')) $('#appBanner').hidden = false; }, 5000);
}
document.addEventListener('click', e => {
  if (!e.target.closest('[data-dismiss-app], #appBanner .btn')) return;
  $('#appBanner').hidden = true;
  try { localStorage.setItem(APP_KEY, '1'); } catch { /* storage blocked */ }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { /* site works without it */ }));
}

renderColours();
renderGrid();
updateBadge();
const deep = location.hash.match(/^#\/p\/([a-z0-9-]+)$/);
if (deep) openPdp(deep[1], false);
