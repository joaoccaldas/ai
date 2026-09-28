// Catalog model: validated product data plus the shop's vocabulary (categories,
// fits, colours), variant selection and search. UI-free, so the website, the
// app and the SEO build all share it.
import bundled from '../../data/catalog.js';

const HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE = /^\/cdn\/shop\/(?:files|products)\/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp)$/;
const str = (v, max = 900) => typeof v === 'string' && v.length <= max;

function validProduct(p) {
  return p && HANDLE.test(p.handle) && str(p.title, 120) && str(p.kind, 40) && str(p.category, 20)
    && Number.isFinite(p.price) && p.price >= 0 && (p.was === null || Number.isFinite(p.was))
    && Array.isArray(p.images) && p.images.length && p.images.every(i => IMAGE.test(i))
    && Array.isArray(p.options) && p.options.every(o => str(o.name, 30) && Array.isArray(o.values) && o.values.every(v => str(v, 40)))
    && Array.isArray(p.variants) && p.variants.length && p.variants.every(v => Number.isSafeInteger(v.id) && Number.isFinite(v.price) && Array.isArray(v.o) && typeof v.ok === 'boolean')
    && Array.isArray(p.copy) && p.copy.every(t => str(t));
}

/* Live catalog state. Replace it with loadCatalog(); read it through db. */
export const db = { products: [], byHandle: new Map(), variants: new Map(), generated: '' };

export function loadCatalog(data) {
  if (!data || !Array.isArray(data.products)) return false;
  const products = data.products.filter(validProduct);
  if (!products.length) return false;
  db.products = products;
  db.byHandle = new Map(products.map(p => [p.handle, p]));
  db.variants = new Map(products.flatMap(p => p.variants.map(v => [v.id, { p, v }])));
  db.generated = typeof data.generated === 'string' ? data.generated : '';
  return true;
}
loadCatalog(bundled);

/* Vocabulary */
export const CATS = {
  all: { title: 'All products', short: 'All', test: () => true },
  cycling: { title: 'Cycling', short: 'Cycling', test: p => p.category === 'cycling' },
  triathlon: { title: 'Triathlon', short: 'Triathlon', test: p => p.category === 'triathlon' },
  run: { title: 'Run WYLD', short: 'Run', test: p => p.category === 'run' },
  accessories: { title: 'Accessories', short: 'Accessories', test: p => p.category === 'accessories' },
  sale: { title: 'Sale', short: 'Sale', test: p => p.was && p.available },
};
export const CATEGORY_LABEL = { cycling: 'Cycling', triathlon: 'Triathlon', run: 'Run WYLD', accessories: 'Accessories' };
export const RANK = ['Race Fit Jersey', 'Trisuit', 'Bib Shorts', 'Singlet', 'T-Shirt', 'Long Sleeve Shirt', 'Gilet', 'Club Fit Jersey', 'Cap', 'Ear Plugs', 'Gift Cards'];
export const rank = p => (p.available ? 0 : 100) + (RANK.indexOf(p.kind) + 1 || 50);
export const KIND_LABEL = { 'Race Fit Jersey': 'Race Fit', 'Club Fit Jersey': 'Club Fit', 'Bib Shorts': 'Bib shorts', Gilet: 'Gilets', 'Gift Cards': 'Gift cards', 'Ear Plugs': 'Ear plugs' };
export const STYLE_LABEL = { Female: 'Women', Male: 'Men', Unisex: 'Unisex' };
export const FIT = {
  'Race Fit Jersey': 'Race Fit is our close, aerodynamic cut — made to sit snug against the body for fast riding.',
  'Club Fit Jersey': 'Club Fit is a more relaxed cut for comfortable long days and social rides.',
  'Bib Shorts': 'Bib shorts are designed to fit snugly; the straps and leg grippers keep everything in place while you ride.',
  Trisuit: 'A close-fitting one-piece designed to be worn from swim to run.',
};
export const describe = p => p.copy.length ? p.copy : [FIT[p.kind] || `The ${p.title} — designed by WYLD for riders, triathletes and runners who want colour, comfort and a great fit.`];

// The colour index: WYLD colourways as they appear in product names.
export const COLOURS = [
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
].map(([key, name, c]) => ({ key, slug: key.replace(/\s+/g, '-'), name, c, re: new RegExp(`\\b${key}\\b`, 'i') }));
export const colourOf = key => COLOURS.find(c => c.key === key || c.slug === key);

/* Sizes */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', 'One Size'];
export function sizesOf(p) {
  const i = p.options.findIndex(o => o.name === 'Size');
  if (i < 0) return [];
  return [...new Set(p.variants.filter(v => v.ok).map(v => v.o[i]))].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}
export const fitsOf = p => (p.options.find(o => o.name === 'Style')?.values || []).map(v => STYLE_LABEL[v] || v);

/* Variant selection */
export const matchesP = (p, v, s) => p.options.every((o, i) => !s[o.name] || v.o[i] === s[o.name]);
export const variantForP = (p, s) => p.options.every(o => s[o.name]) ? p.variants.find(v => matchesP(p, v, s)) : null;
export const valueOKP = (p, s, name, value) => p.variants.some(v => v.ok && matchesP(p, v, { ...s, [name]: value }));
export function defaultSelection(p) {
  const s = {};
  p.options.forEach((o, i) => {
    const firstOK = o.values.find(val => p.variants.some(v => v.ok && v.o[i] === val));
    if (o.values.length === 1 || o.name !== 'Size') s[o.name] = firstOK || o.values[0];
  });
  return s;
}
// Changing fit can invalidate the chosen size.
export function applyOption(p, s, name, val) {
  s[name] = val;
  const v = variantForP(p, s);
  if (name !== 'Size' && s.Size && v && !v.ok) delete s.Size;
}
export function variantLabel(p, v) {
  return p.options.map((o, i) => o.name === 'Style' ? STYLE_LABEL[v.o[i]] || v.o[i] : o.name === 'Size' ? `Size ${v.o[i]}` : String(v.o[i]).replace(/\s*AED$/, ' AED')).join(' · ');
}

/* Discovery */
export function search(q) {
  const terms = q.toLowerCase().replace('bib shorts', 'bib').split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return db.products.filter(p => {
    const hay = `${p.title} ${p.kind} ${p.category} ${p.was ? 'sale' : ''} ${p.women ? 'women' : ''} ${p.men ? 'men' : ''}`.toLowerCase();
    return terms.every(t => hay.includes(t));
  }).sort((a, b) => rank(a) - rank(b));
}
// Related products; jerseys are paired with bib shorts to complete the kit.
export function relatedFor(p, n = 4) {
  const pool = db.products.filter(x => x.handle !== p.handle && x.available);
  const kit = /Jersey$/.test(p.kind) ? pool.filter(x => x.kind === 'Bib Shorts').slice(0, 2)
    : p.kind === 'Bib Shorts' ? pool.filter(x => x.kind === 'Race Fit Jersey').slice(0, 2) : [];
  const same = pool.filter(x => !kit.includes(x) && (x.kind === p.kind || x.category === p.category))
    .sort((a, b) => (b.kind === p.kind) - (a.kind === p.kind) || rank(a) - rank(b));
  return [...kit, ...same].slice(0, n);
}
