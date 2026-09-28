import { site } from '../config/site.js';
import { img as imgAt, money, esc, priceHTML } from '../src/core/format.js';
import {
  db, CATS, CATEGORY_LABEL, RANK, rank, KIND_LABEL, STYLE_LABEL, FIT, describe,
  variantForP, valueOKP, defaultSelection, applyOption, variantLabel, search, relatedFor,
} from '../src/core/model.js';
import {
  store, BAG_KEY, readBag, writeBag, addLine, bagCount as countBag, bagTotal, checkoutURL as checkoutFor,
  freeShipping, readSaved, writeSaved,
} from '../src/core/storage.js';
import { runtime } from '../src/core/runtime.js';
import { restoreCachedCatalog, refreshCatalog, checkAppUpdate } from '../src/core/live.js';

/* Some phone browsers (e.g. "Desktop view") report a ~980px viewport on a
   ~400px screen. Scale the app back to the real phone width so it fills the
   screen at a readable size. */
(function fitPhone() {
  const touch = matchMedia('(pointer: coarse)').matches;
  const ratio = window.innerWidth / Math.min(screen.width, screen.height);
  if (touch && Math.min(screen.width, screen.height) < 600 && ratio > 1.3) {
    document.documentElement.style.zoom = String(ratio);
    document.documentElement.classList.add('phone-fit');
  }
})();

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const SHOP = site.shopUrl;
const img = imgAt;
const srcset = (path, ws = [360, 540, 720, 1080]) => ws.map(w => `${img(path, w)} ${w}w`).join(',');
const EXT = 'target="_blank" rel="noopener noreferrer"';
const catLabel = CATEGORY_LABEL;
const haptic = () => { try { navigator.vibrate?.(10); } catch { /* unsupported */ } };

/* ---------- catalog (live in the Android app) ---------- */
restoreCachedCatalog();
// Views read the current catalog through these getters, so a refresh applies everywhere.
const products = () => db.products;
const byHandle = { get: h => db.byHandle.get(h), has: h => db.byHandle.has(h) };
const variants = { get: id => db.variants.get(id), has: id => db.variants.has(id) };

/* ---------- persistent state (bag shared with the website) ---------- */
const RECENT_KEY = 'wyld-recent-v1', INSTALL_KEY = 'wyld-install-dismissed-v1';
let bag = readBag();
let saved = readSaved();
let recent = store.get(RECENT_KEY, []);
recent = Array.isArray(recent) ? recent.filter(s => typeof s === 'string' && s.length <= 40).slice(0, 6) : [];

const saveBag = () => { writeBag(bag); updateBadge(); };
const saveSaved = () => writeSaved(saved);
const bagCount = () => countBag(bag);
function updateBadge() {
  const n = bagCount(), b = $('#bagBadge');
  b.hidden = !n; b.textContent = n > 9 ? '9+' : n;
}

/* ---------- shared components ---------- */
function saveBtn(p, cls = 'save') {
  const on = saved.includes(p.handle);
  return `<button class="${cls}${on ? ' on' : ''}" data-save="${p.handle}" aria-pressed="${on}" aria-label="${on ? 'Remove from saved' : 'Save'} ${esc(p.title)}"><svg><use href="#i-heart"/></svg></button>`;
}
function card(p, sizes = '(min-width:480px) 220px, 46vw') {
  const tag = !p.available ? '<span class="badge-tag out">Sold out</span>'
    : p.was ? `<span class="badge-tag">−${Math.round((1 - p.price / p.was) * 100)}%</span>` : '';
  return `<article class="card${p.available ? '' : ' soldout'}">
    <a href="#/p/${p.handle}">
      <div class="card-media">${tag}<img src="${img(p.images[0], 540)}" srcset="${srcset(p.images[0])}" sizes="${sizes}" alt="${esc(p.title)}" loading="lazy" decoding="async"></div>
      <div class="card-info"><h3>${esc(p.title)}</h3><small>${esc(KIND_LABEL[p.kind] || p.kind)}</small>${priceHTML(p)}</div>
    </a>${saveBtn(p)}
  </article>`;
}
const appbar = (title, extra = '') => `<header class="appbar bordered"><h1 class="h3">${esc(title)}</h1>${extra}</header>`;
function empty(icon, text, cta = '') {
  return `<div class="empty"><svg><use href="#${icon}"/></svg><p>${text}</p>${cta}</div>`;
}

let toastTimer;
function toast(text) {
  const t = $('#toast'); t.textContent = text; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- views ---------- */
const view = $('#view');
const shopState = { cat: 'all', sub: null, gender: null, sort: 'featured' };
let query = '';

const HERO = [
  { src: '/cdn/shop/files/Screenshot_2024-09-24_at_10.46.16.png', pos: 'pos-a', eyebrow: 'Cycling — Race Fit', title: 'Join the peloton in style.', to: '#/shop/cycling', alt: 'Rider in a blue WYLD race-fit jersey' },
  { src: '/cdn/shop/files/raspberry_jersey_female_cyclists.jpg', pos: 'pos-b', eyebrow: 'Kit for every rider', title: 'Made for more riders.', to: '#/shop/cycling', alt: 'Riders in Raspberry jerseys and pink bib shorts' },
  { src: '/cdn/shop/files/wyld_singlet_front.jpg', pos: 'pos-c', eyebrow: 'Run WYLD', title: 'Colour for the long run.', to: '#/shop/run', alt: 'Runner in the Team WYLD singlet' },
];
const SPORTS = [
  ['cycling', 'Cycling', '/cdn/shop/products/pinkpocket.jpg'],
  ['triathlon', 'Triathlon', '/cdn/shop/files/blush_wyld_trisuit.jpg'],
  ['run', 'Run WYLD', '/cdn/shop/files/runwyld_singlet_women_product_photo_copy_9292c507-0713-4c6f-b072-130669fefb28.jpg'],
  ['accessories', 'Accessories', '/cdn/shop/products/caps.jpg'],
];
const JOURNAL = [
  ['2025-11-10', '10 Nov 2025', 'Join the Thursday group ride — Dubai’s most fun midweek coffee spin', 'join-the-hello-bike-thursday-group-ride-dubai-s-most-fun-midweek-coffee-spin'],
  ['2025-09-15', '15 Sep 2025', 'Swissman Xtreme Triathlon 2025 recap: the bike', 'swissman-xtreme-triathlon-2025-recap-the-bike'],
  ['2025-05-26', '26 May 2025', 'Why you should wear bib shorts when cycling', 'why-you-should-wear-bib-shorts-when-cycling-yes-your-butt-will-thank-you'],
];

function rail(title, items, to) {
  if (!items.length) return '';
  return `<section class="block"><div class="block-head"><h2 class="h3">${title}</h2>${to ? `<a class="text-link" href="${to}">See all</a>` : ''}</div>
    <div class="rail">${items.map(p => card(p, '44vw')).join('')}</div></section>`;
}

function homeView() {
  const avail = products().filter(p => p.available);
  const raceFit = avail.filter(p => p.kind === 'Race Fit Jersey').sort((a, b) => rank(a) - rank(b));
  const bibs = avail.filter(p => p.kind === 'Bib Shorts');
  const sale = avail.filter(p => p.was).sort((a, b) => (b.was - b.price) / b.was - (a.was - a.price) / a.was);
  return `
  <header class="appbar center"><img class="logo" src="${img('/cdn/shop/files/WYLD-Black1080.png', 240)}" alt="WYLD" width="56" height="20"></header>
  <div class="hero" id="hero">${HERO.map((h, i) => `
    <a href="${h.to}"><img class="${h.pos}" src="${img(h.src, 1080)}" srcset="${srcset(h.src, [540, 800, 1080, 1400])}" sizes="(min-width:480px) 420px, 88vw" alt="${esc(h.alt)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
      <div class="hero-copy"><span class="eyebrow">${h.eyebrow}</span><h2>${h.title}</h2><span>Shop now</span></div></a>`).join('')}
  </div>
  <div class="dots" id="heroDots">${HERO.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>

  <section class="block"><div class="block-head"><h2 class="h3">Shop by sport</h2><a class="text-link" href="#/shop">View all</a></div>
    <div class="sports">${SPORTS.map(([k, t, src]) => {
      const n = products().filter(CATS[k].test).length;
      return `<a class="sport" href="#/shop/${k}"><figure><img src="${img(src, 540)}" alt="" loading="lazy"></figure><div><h3>${t}</h3><small>${n} ${n === 1 ? 'style' : 'styles'}</small></div></a>`;
    }).join('')}</div>
  </section>

  ${rail('Race Fit jerseys', raceFit, '#/shop/cycling/Race Fit Jersey')}
  ${rail('Bib shorts', bibs, '#/shop/cycling/Bib Shorts')}

  <a class="promo" href="${SHOP}/pages/custom-kit" ${EXT}>
    <img src="${img('/cdn/shop/files/G6BANNER.jpg', 1080)}" alt="A cycling club in custom WYLD kit" loading="lazy">
    <div><span class="eyebrow">Custom kit</span><h2 class="h3">Your team. Your colours.</h2><p>Custom clothing for cycling, triathlon and running — one piece or a full club order.</p><span class="text-link">Start your kit</span></div>
  </a>

  ${rail('On sale', sale, '#/shop/sale')}

  ${isStandalone() ? '' : `<button class="promo dark" data-install><div><span class="eyebrow">WYLD app</span><h2 class="h3">Add WYLD to your home screen.</h2><p>Full-screen shopping, saved favourites and your bag — one tap away, even offline.</p><span class="text-link">Get the app</span></div></button>`}

  <section class="block"><div class="block-head"><h2 class="h3">Journal</h2><a class="text-link" href="${SHOP}/blogs/blog" ${EXT}>All stories</a></div>
    <div class="journal">${JOURNAL.map(([iso, d, t, slug]) => `<a href="${SHOP}/blogs/blog/${slug}" ${EXT}><div><time datetime="${iso}">${d}</time><h4>${esc(t)}</h4></div><svg><use href="#i-arrow"/></svg></a>`).join('')}</div>
  </section>
  ${footer()}`;
}

function contactLinks() {
  const c = site.contact;
  return [
    c.email && `<a href="mailto:${esc(c.email)}">Email</a>`,
    c.whatsapp && `<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ''))}" ${EXT}>WhatsApp</a>`,
    c.phone && `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">Call</a>`,
    `<a href="${c.form}" ${EXT}>Contact</a>`,
  ].filter(Boolean).join('');
}
function footer() {
  return `<footer class="foot">
    <nav>${contactLinks()}<a href="${site.policies.shipping}" ${EXT}>Shipping</a><a href="${site.policies.returns}" ${EXT}>Returns</a><a href="${site.policies.privacy}" ${EXT}>Privacy</a><a href="${site.social.instagram}" ${EXT}>Instagram</a></nav>
    <span>Prices in ${site.currency} · Free shipping over ${money(site.freeShippingThreshold)} · Checkout on ridewyld.com</span>
    <img src="${img('/cdn/shop/files/WYLD-Black1080.png', 120)}" alt="WYLD" width="40" height="14">
  </footer>`;
}

function shopList() {
  let items = products().filter(CATS[shopState.cat].test);
  if (shopState.sub) items = items.filter(p => p.kind === shopState.sub);
  if (shopState.gender) items = items.filter(p => p[shopState.gender]);
  const sorts = { featured: (a, b) => rank(a) - rank(b), low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, az: (a, b) => a.title.localeCompare(b.title) };
  return items.sort(sorts[shopState.sort]);
}
function shopChips() {
  const base = products().filter(CATS[shopState.cat].test);
  const kinds = [...new Set(base.map(p => p.kind))].sort((a, b) => RANK.indexOf(a) - RANK.indexOf(b));
  let html = '';
  if (kinds.length > 1 && shopState.cat !== 'all') {
    html += `<button class="chip${shopState.sub ? '' : ' on'}" data-sub="">All</button>`;
    html += kinds.map(k => `<button class="chip${shopState.sub === k ? ' on' : ''}" data-sub="${esc(k)}">${esc(KIND_LABEL[k] || k)}</button>`).join('');
  }
  if (shopState.cat !== 'accessories' && base.some(p => p.women) && base.some(p => p.men)) {
    html += ['women', 'men'].map(g => `<button class="chip${shopState.gender === g ? ' on' : ''}" data-gender="${g}">${g === 'women' ? 'Women' : 'Men'}</button>`).join('');
  }
  return html;
}
function shopResults() {
  const items = shopList();
  return `<p class="count">${items.length} ${items.length === 1 ? 'product' : 'products'}</p>
    ${items.length ? `<div class="grid">${items.map(p => card(p)).join('')}</div>` : empty('i-grid', 'Nothing here right now — try another filter.')}`;
}
function shopView() {
  return `${appbar('Shop')}
  <div class="shopbar">
    <div class="tabs" role="tablist">${Object.entries(CATS).map(([k, c]) => `<button role="tab" aria-selected="${shopState.cat === k}" class="${shopState.cat === k ? 'on' : ''}" data-cat="${k}">${c.short}</button>`).join('')}</div>
  </div>
  <div class="filters"><div class="chips" id="chips">${shopChips()}</div>
    <label class="sort"><svg><use href="#i-sort"/></svg><span class="sr">Sort</span>
      <select id="sort" aria-label="Sort">${[['featured', 'Featured'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['az', 'A – Z']].map(([v, t]) => `<option value="${v}"${shopState.sort === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
    </label>
  </div>
  <div id="shopResults">${shopResults()}</div>`;
}
function refreshShop() {
  $('#chips').innerHTML = shopChips();
  $('#shopResults').innerHTML = shopResults();
}

const searchHits = q => search(q);
function searchResults() {
  if (!query.trim()) {
    return `<div class="suggest">
      ${recent.length ? `<div class="recent"><span class="eyebrow">Recent</span><button data-clear-recent>Clear</button></div><div class="chips">${recent.map(s => `<button class="chip" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
      <span class="eyebrow">Popular</span>
      <div class="chips">${['Jersey', 'Bib shorts', 'Trisuit', 'Singlet', 'Gilet', 'Cap', 'Sale'].map(s => `<button class="chip" data-q="${s}">${s}</button>`).join('')}</div>
    </div>`;
  }
  const hits = searchHits(query);
  return `<p class="count">${hits.length} result${hits.length === 1 ? '' : 's'}</p>` +
    (hits.length ? `<div class="grid">${hits.map(p => card(p)).join('')}</div>` : empty('i-search', `No matches for “${esc(query)}”. Try “jersey” or “bib”.`));
}
function searchView() {
  return `${appbar('Search')}
  <div class="block">
    <label class="searchbar"><svg><use href="#i-search"/></svg><input id="q" type="search" enterkeyhint="search" placeholder="Jerseys, bibs, trisuits…" autocomplete="off" autocapitalize="off" maxlength="40" value="${esc(query)}" aria-label="Search products"></label>
  </div>
  <div id="searchResults">${searchResults()}</div>`;
}
function rememberSearch() {
  const q = query.trim(); if (q.length < 2) return;
  recent = [q, ...recent.filter(s => s.toLowerCase() !== q.toLowerCase())].slice(0, 6);
  store.set(RECENT_KEY, recent);
}

function savedView() {
  const items = saved.map(h => byHandle.get(h)).filter(Boolean);
  return `${appbar('Saved')}
    ${items.length ? `<p class="count">${items.length} saved</p><div class="grid">${items.map(p => card(p)).join('')}</div>`
      : empty('i-heart', 'Tap the heart on any product to save it here.', '<a class="btn ghost" href="#/shop">Browse the collection</a>')}`;
}

const checkoutURL = () => checkoutFor(bag);
function shipBar(total) {
  const f = freeShipping(total); if (!f) return '';
  const text = f.remaining ? `Add ${money(f.remaining)} for free shipping` : 'You’ve unlocked free shipping';
  return `<div class="ship"><span>${text}</span><progress max="1" value="${f.progress.toFixed(3)}" aria-label="Progress to free shipping"></progress></div>`;
}
function bagView() {
  if (!bag.length) {
    return `${appbar('Bag')}${empty('i-bag', 'Your bag is empty.', '<a class="btn" href="#/shop">Start shopping</a>')}
      ${rail('Popular right now', ['raspberry-jersey', 'black-bib-shorts', 'grape-jersey', 'blush-trisuit'].map(h => byHandle.get(h)).filter(p => p?.available))}`;
  }
  let total = 0;
  const lines = bag.map(l => {
    const { p, v } = variants.get(l.id); total += v.price * l.qty;
    return `<div class="line">
      <a href="#/p/${p.handle}"><figure><img src="${img(p.images[0], 360)}" alt="" loading="lazy"></figure></a>
      <div><h3>${esc(p.title)}</h3><p>${esc(variantLabel(p, v))}</p><p>${money(v.price)}</p>
        <div class="line-row"><span class="qty"><button data-dec="${l.id}" aria-label="Decrease quantity">−</button><span aria-live="polite">${l.qty}</span><button data-inc="${l.id}" aria-label="Increase quantity">+</button></span><button class="remove" data-rm="${l.id}">Remove</button></div>
      </div></div>`;
  }).join('');
  return `${appbar(`Bag (${bagCount()})`)}
    <div class="lines">${lines}</div>
    <div class="summary">
      <div class="summary-row"><span>Subtotal</span><span>${money(total)}</span></div>
      ${shipBar(total)}
      <div class="summary-row"><span>Shipping</span><span class="muted">${freeShipping(total)?.remaining === 0 ? 'Free' : 'At checkout'}</span></div>
      <div class="summary-row total"><span>Estimated total</span><span>${money(total)}</span></div>
      <a class="btn" href="${checkoutURL()}" ${EXT}><svg><use href="#i-lock"/></svg>Secure checkout</a>
      <p class="fine">You’ll complete payment on ridewyld.com. This app never sees your card details.</p>
    </div>`;
}

/* ---------- product ---------- */
const product = $('#product');
let current = null, sel = {};
const variantFor = s => variantForP(current, s);
const valueOK = (name, value) => valueOKP(current, sel, name, value);

function optionsHTML() {
  return current.options.map(o => {
    const isSize = o.name === 'Size';
    const label = o.name === 'Style' ? 'Fit' : o.name;
    const shown = sel[o.name] ? (o.name === 'Style' ? STYLE_LABEL[sel[o.name]] || sel[o.name] : sel[o.name]) : (isSize ? 'Select a size' : '');
    const btns = o.values.map(val => {
      const ok = valueOK(o.name, val), on = sel[o.name] === val;
      const txt = o.name === 'Style' ? (STYLE_LABEL[val] || val) : o.name === 'Amount' ? val.replace(/\s*AED/, '') : val;
      return `<button class="${on ? 'on' : ''}${ok ? '' : ' na'}" data-opt="${esc(o.name)}" data-val="${esc(val)}" aria-pressed="${on}" aria-label="${esc(txt)}${ok ? '' : ', sold out'}">${esc(txt)}</button>`;
    }).join('');
    return `<div class="opt"><div class="opt-head"><span>${label}: <b>${esc(shown)}</b></span>${isSize ? `<a href="${SHOP}/products/${current.handle}" ${EXT}>Size guide</a>` : ''}</div>
      <div class="${isSize ? 'sizes' : 'styles'}">${btns}</div></div>`;
  }).join('');
}
function actionState() {
  const v = variantFor(sel);
  if (!current.available) return { text: 'Sold out', disabled: true };
  if (current.options.some(o => !sel[o.name])) return { text: 'Select a size', needs: true };
  if (!v || !v.ok) return { text: 'Sold out in this size', disabled: true };
  return { text: `Add to bag · ${money(v.price)}`, v };
}
function refreshProduct() {
  $('#pOptions').innerHTML = optionsHTML();
  const a = actionState(), btn = $('#addBtn');
  btn.textContent = a.text; btn.disabled = !!a.disabled;
  const v = variantFor(sel);
  if (v) $('#pPrice').innerHTML = priceHTML({ price: v.price, was: v.was && v.was > v.price ? v.was : null }, false);
}
function productHTML(p) {
  const copy = describe(p);
  const related = relatedFor(p, 6);
  return `
    <div class="pbar"><button class="icon" data-back aria-label="Back"><svg><use href="#i-back"/></svg></button>
      <div class="right"><button class="icon" data-share aria-label="Share"><svg><use href="#i-share"/></svg></button>${saveBtn(p, 'icon')}</div></div>
    <div class="pmain"><div class="gallery">
      <div class="gtrack" id="gTrack">${p.images.map((src, i) => `<figure><img src="${img(src, 1080)}" srcset="${srcset(src, [540, 800, 1080, 1440])}" sizes="(min-width:480px) 480px, 100vw" alt="${esc(p.title)}, image ${i + 1} of ${p.images.length}" ${i ? 'loading="lazy"' : ''} decoding="async"></figure>`).join('')}</div>
      ${p.images.length > 1 ? `<span class="gcount" id="gCount">1 / ${p.images.length}</span>` : ''}
    </div>
    <div class="pinfo">
      <div class="crumbs">${catLabel[p.category]} · ${esc(KIND_LABEL[p.kind] || p.kind)}</div>
      <h1>${esc(p.title)}</h1>
      <div id="pPrice">${priceHTML(p)}</div>
      <div id="pOptions"></div>
      <ul class="perks">
        <li><svg><use href="#i-lock"/></svg>Secure checkout on ridewyld.com</li>
        ${p.category !== 'accessories' ? '<li><svg><use href="#i-grid"/></svg>Size-inclusive range — see the size guide</li>' : ''}
      </ul>
      <details open><summary>Details</summary><div class="body">${copy.map(t => `<p>${esc(t)}</p>`).join('')}</div></details>
      ${FIT[p.kind] && p.copy.length ? `<details><summary>Fit</summary><div class="body"><p>${FIT[p.kind]}</p></div></details>` : ''}
      <details><summary>Delivery &amp; returns</summary><div class="body"><p>Orders are fulfilled by WYLD via ridewyld.com. See the <a href="${SHOP}/policies/shipping-policy" ${EXT}>shipping</a> and <a href="${SHOP}/policies/refund-policy" ${EXT}>returns</a> policies.</p></div></details>
    </div></div>
    ${related.length ? `<div class="related">${rail('You may also like', related)}</div>` : ''}
    <div class="buybar"><button class="btn" id="addBtn"></button></div>`;
}

let productOpenedInApp = false;
function openProduct(handle) {
  const p = byHandle.get(handle); if (!p) return false;
  current = p; sel = defaultSelection(p);
  product.innerHTML = productHTML(p);
  refreshProduct();
  product.scrollTop = 0;
  product.classList.add('on'); product.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
  document.title = `${p.title} — WYLD`;
  const track = $('#gTrack'), count = $('#gCount');
  if (count) track.addEventListener('scroll', () => { count.textContent = `${Math.round(track.scrollLeft / track.clientWidth) + 1} / ${p.images.length}`; }, { passive: true });
  setTimeout(() => $('[data-back]', product)?.focus({ preventScroll: true }), 50);
  return true;
}
function closeProduct() {
  if (!product.classList.contains('on')) return;
  product.classList.remove('on'); product.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('locked');
  document.title = 'WYLD';
}
function addToBag(id) {
  addLine(bag, id);
  saveBag(); haptic();
  const { p, v } = variants.get(id);
  toast(`Added · ${p.title}${v.o.length ? ` · ${variantLabel(p, v)}` : ''}`);
}

/* ---------- routing ---------- */
let lastTab = '#/home', renderedTab = '';
function parse(hash) {
  const [, name = 'home', ...rest] = (hash || '#/home').split('/');
  const decode = x => { try { return decodeURIComponent(x); } catch { return ''; } };
  return { name, rest: rest.map(decode) };
}
function renderTab(hash, force = false) {
  const { name, rest } = parse(hash);
  const tab = ['home', 'shop', 'search', 'saved', 'bag'].includes(name) ? name : 'home';
  if (tab === 'shop') {
    const [cat, sub] = rest;
    const nextCat = CATS[cat] ? cat : 'all';
    const nextSub = sub && products().some(p => p.kind === sub) ? sub : null;
    if (nextCat !== shopState.cat || nextSub !== shopState.sub) Object.assign(shopState, { cat: nextCat, sub: nextSub, gender: null });
  }
  lastTab = hash;
  $$('.tabbar a').forEach(a => { const on = a.dataset.tab === tab; a.classList.toggle('on', on); a.toggleAttribute('aria-current', on); });
  if (!force && renderedTab === hash) { refreshHearts(); return; }
  renderedTab = hash;
  view.innerHTML = { home: homeView, shop: shopView, search: searchView, saved: savedView, bag: bagView }[tab]();
  window.scrollTo(0, 0);
  if (tab === 'home') bindHero();
  if (tab === 'search' && !query) setTimeout(() => $('#q')?.focus(), 150);
}
function route() {
  const m = location.hash.match(/^#\/p\/([a-z0-9-]+)$/);
  if (m) {
    if (!renderedTab) renderTab(lastTab);
    if (openProduct(m[1])) return;
    location.replace('#/home'); return;
  }
  closeProduct();
  renderTab(location.hash || '#/home');
}
window.addEventListener('hashchange', e => {
  productOpenedInApp = /#\/p\//.test(new URL(e.newURL).hash) && !/#\/p\//.test(new URL(e.oldURL).hash);
  route();
});
function goBack() {
  if (productOpenedInApp) history.back(); else location.replace(lastTab.startsWith('#/p/') ? '#/home' : lastTab);
}
function refreshHearts() {
  $$('[data-save]').forEach(b => {
    const on = saved.includes(b.dataset.save);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  });
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const save = t.closest('[data-save]');
  if (save) {
    e.preventDefault();
    const h = save.dataset.save;
    saved = saved.includes(h) ? saved.filter(x => x !== h) : [h, ...saved];
    saveSaved(); refreshHearts(); haptic();
    toast(saved.includes(h) ? 'Saved' : 'Removed from saved');
    if (renderedTab.startsWith('#/saved') && !product.classList.contains('on')) renderTab(renderedTab, true);
    return;
  }
  if (t.closest('[data-back]')) { goBack(); return; }
  if (t.closest('[data-share]')) { share(); return; }
  if (t.closest('[data-install]')) { showInstall(); return; }
  if (t.closest('[data-close-sheet]')) { closeSheet(); return; }

  const opt = t.closest('[data-opt]');
  if (opt) {
    applyOption(current, sel, opt.dataset.opt, opt.dataset.val);
    refreshProduct(); return;
  }
  if (t.closest('#addBtn')) {
    const a = actionState();
    if (a.needs) { $('#pOptions').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('.sizes', product)?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 280 }); return; }
    if (a.v) addToBag(a.v.id);
    return;
  }

  const cat = t.closest('[data-cat]');
  if (cat) { location.hash = cat.dataset.cat === 'all' ? '#/shop' : `#/shop/${cat.dataset.cat}`; return; }
  const chip = t.closest('#chips [data-sub], #chips [data-gender]');
  if (chip) {
    if ('sub' in chip.dataset) {
      shopState.sub = chip.dataset.sub || null;
      const h = shopState.sub ? `#/shop/${shopState.cat}/${encodeURIComponent(shopState.sub)}` : `#/shop/${shopState.cat}`;
      history.replaceState(null, '', h); lastTab = renderedTab = h;
    }
    if (chip.dataset.gender) shopState.gender = shopState.gender === chip.dataset.gender ? null : chip.dataset.gender;
    refreshShop(); return;
  }
  const q = t.closest('[data-q]');
  if (q) { query = q.dataset.q; $('#q').value = query; rememberSearch(); $('#searchResults').innerHTML = searchResults(); return; }
  if (t.closest('[data-clear-recent]')) { recent = []; store.set(RECENT_KEY, recent); $('#searchResults').innerHTML = searchResults(); return; }

  const b = t.closest('[data-inc],[data-dec],[data-rm]');
  if (b) {
    const id = Number(b.dataset.inc || b.dataset.dec || b.dataset.rm);
    const line = bag.find(l => l.id === id); if (!line) return;
    if (b.dataset.inc) line.qty = Math.min(line.qty + 1, 10);
    if (b.dataset.dec) line.qty -= 1;
    if (b.dataset.rm || line.qty < 1) bag = bag.filter(l => l !== line);
    saveBag(); renderTab(renderedTab, true);
  }
});
document.addEventListener('change', e => { if (e.target.id === 'sort') { shopState.sort = e.target.value; refreshShop(); } });
let searchTimer;
document.addEventListener('input', e => {
  if (e.target.id !== 'q') return;
  query = e.target.value.slice(0, 40);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { $('#searchResults').innerHTML = searchResults(); }, 120);
});
document.addEventListener('keydown', e => {
  if (e.target.id === 'q' && e.key === 'Enter') { rememberSearch(); e.target.blur(); }
  if (e.key === 'Escape') { if ($('#sheet').classList.contains('on')) closeSheet(); else if (product.classList.contains('on')) goBack(); }
});
// Keep bag and saved items in sync with other tabs (including the website).
window.addEventListener('storage', e => {
  if (e.key === BAG_KEY) { bag = readBag(); updateBadge(); if (renderedTab.startsWith('#/bag')) renderTab(renderedTab, true); }
});

function bindHero() {
  const hero = $('#hero'), dots = $$('#heroDots i');
  if (!hero) return;
  hero.addEventListener('scroll', () => {
    const w = hero.firstElementChild.getBoundingClientRect().width + 10;
    const i = Math.round(hero.scrollLeft / w);
    dots.forEach((d, j) => d.classList.toggle('on', i === j));
  }, { passive: true });
}

async function share() {
  if (!current) return;
  const url = new URL(`#/p/${current.handle}`, location.href.split('#')[0]).href;
  try {
    if (navigator.share) await navigator.share({ title: `${current.title} — WYLD`, url });
    else { await navigator.clipboard.writeText(url); toast('Link copied'); }
  } catch { /* share sheet dismissed */ }
}

/* ---------- sheet + install ---------- */
const sheet = $('#sheet'), scrim = $('#scrim');
function openSheet(html) {
  sheet.innerHTML = `<div class="grabber"></div>${html}`;
  scrim.hidden = false; sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
  setTimeout(() => sheet.focus({ preventScroll: true }), 60);
}
function closeSheet() {
  sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
}
scrim.addEventListener('click', () => { closeSheet(); store.set(INSTALL_KEY, true); });

let installEvent = null;
function isStandalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || !!window.Capacitor?.isNativePlatform?.(); }
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; });
window.addEventListener('appinstalled', () => { installEvent = null; closeSheet(); toast('WYLD app installed'); if (renderedTab.startsWith('#/home')) renderTab(renderedTab, true); });

const APK_URL = '../downloads/WYLD.apk';
const isAndroid = /android/i.test(navigator.userAgent);

function showInstall() {
  const head = `<div class="app-id"><img src="./icons/icon-192.png" alt=""><div><strong>WYLD</strong><span>Cycling, triathlon &amp; run apparel</span></div></div>`;
  if (isStandalone()) { toast('You’re already using the app'); return; }
  if (isAndroid) {
    openSheet(`${head}<h2>Get the WYLD app</h2><p>Download the Android app (3.5 MB). When it finishes, open the file and tap <b>Install</b>. If asked, allow your browser to install apps.</p>
      <div class="actions"><a class="btn" href="${APK_URL}" rel="noopener noreferrer" download><svg><use href="#i-arrow"/></svg>Download for Android</a>
      ${installEvent ? '<button class="btn ghost" id="doInstall">Or add to home screen</button>' : ''}
      <button class="btn ghost" data-close-sheet>Not now</button></div>`);
  } else if (isIOS) {
    openSheet(`${head}<h2>Add WYLD to your Home Screen</h2><p>On iPhone the WYLD app installs from Safari in two taps. It opens full-screen with its own icon, like any other app.</p>
      <ol class="steps"><li><span>Tap <svg><use href="#i-ios-share"/></svg> <b>Share</b> in Safari’s toolbar</span></li><li><span>Choose <b>Add to Home Screen</b>, then <b>Add</b></span></li></ol>
      <div class="actions"><button class="btn ghost" data-close-sheet>Got it</button></div>`);
  } else {
    openSheet(`${head}<h2>Get the WYLD app</h2><p>Open this page on your phone to install WYLD. On a computer, use your browser’s <b>Install app</b> option.</p>
      <div class="actions">${installEvent ? '<button class="btn" id="doInstall">Install app</button>' : ''}<a class="btn ghost" href="${APK_URL}" rel="noopener noreferrer" download>Download Android app (.apk)</a><button class="btn ghost" data-close-sheet>Not now</button></div>`);
  }
  $('#doInstall')?.addEventListener('click', async () => {
    const ev = installEvent; installEvent = null;
    ev.prompt();
    const { outcome } = await ev.userChoice.catch(() => ({ outcome: 'dismissed' }));
    closeSheet(); if (outcome !== 'accepted') store.set(INSTALL_KEY, true);
  });
}

/* ---------- offline, service worker, boot ---------- */
function onlineState() { $('#offline').hidden = navigator.onLine; }
window.addEventListener('online', onlineState);
window.addEventListener('offline', onlineState);
onlineState();

if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.()) {
  window.addEventListener('load', async () => {
    try {
      // Retire the first release's narrower worker, if this device still has it.
      for (const r of await navigator.serviceWorker.getRegistrations()) if (r.scope.endsWith('/app/')) await r.update().catch(() => r.unregister());
      await navigator.serviceWorker.register('../sw.js', { scope: '../' });
    } catch { /* the app still works online */ }
  });
}

updateBadge();
route();

/* ---------- live data and updates (Android app) ---------- */
let lastRefresh = 0;
async function refreshLive() {
  if (Date.now() - lastRefresh < 15 * 60 * 1000) return;
  lastRefresh = Date.now();
  if (await refreshCatalog()) {
    bag = readBag(); saved = readSaved(); updateBadge();
    if (!product.classList.contains('on')) renderTab(renderedTab, true);
  }
  const update = await checkAppUpdate();
  if (update && !sheet.classList.contains('on')) showUpdate(update);
}
function showUpdate({ versionName, url }) {
  openSheet(`<div class="app-id"><img src="./icons/icon-192.png" alt=""><div><strong>WYLD ${esc(versionName)}</strong><span>A new version is ready</span></div></div>
    <h2>Update WYLD</h2><p>Download the latest version, open it and tap <b>Update</b>. Your bag and saved items stay on your phone.</p>
    <div class="actions"><a class="btn" href="${esc(url)}" ${EXT}>Download update</a><button class="btn ghost" data-close-sheet>Later</button></div>`);
}
refreshLive();
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshLive(); });

const params = new URLSearchParams(location.search);
if (!isStandalone()) {
  if (params.get('install') === '1') setTimeout(showInstall, 700);
  else if (!store.get(INSTALL_KEY, false)) setTimeout(() => { if (!product.classList.contains('on') && !sheet.classList.contains('on')) { showInstall(); store.set(INSTALL_KEY, true); } }, 4000);
}
