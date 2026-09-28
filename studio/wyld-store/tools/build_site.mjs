#!/usr/bin/env node
// Pre-renders the crawlable, AI-readable version of the store from the catalog
// and site config. Run after tools/sync_catalog.py (CI does both daily):
//
//   SITE_URL=https://example.com/store/ node tools/build_site.mjs
//
// Writes:
//   p/<handle>/index.html      one static page per product (Product + Breadcrumb JSON-LD)
//   c/<category>/index.html    category landing pages (ItemList JSON-LD)
//   colour/<slug>/index.html   colour landing pages
//   index.html                 fills the <!-- seo:* --> blocks (meta, JSON-LD, grid, FAQ, contact)
//   sitemap.xml, robots.txt, llms.txt, llms-full.txt
//
// Without SITE_URL, links stay relative and sitemap/canonical tags are skipped.
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../config/site.js';
import { img, srcset, money, esc, priceHTML } from '../src/core/format.js';
import {
  db, CATS, CATEGORY_LABEL, KIND_LABEL, rank, describe, COLOURS, sizesOf, fitsOf, relatedFor,
} from '../src/core/model.js';
import { card, productPath } from '../src/card.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let BASE = (process.env.SITE_URL || site.siteUrl || '').trim();
if (BASE && !/^https:\/\/[^\s"'<>]+$/.test(BASE)) throw new Error(`SITE_URL must be an https URL, got: ${BASE}`);
if (BASE && !BASE.endsWith('/')) BASE += '/';
const abs = path => (BASE ? BASE + path : null);
const today = (db.generated || new Date().toISOString()).slice(0, 10);

const products = [...db.products].sort((a, b) => rank(a) - rank(b));
const inStock = products.filter(p => p.available);
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
const sizeRange = list => {
  const all = [...new Set(list.flatMap(sizesOf))].filter(s => SIZE_ORDER.includes(s)).sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
  return all.length ? (all.length > 1 ? `${all[0]}–${all.at(-1)}` : all[0]) : '';
};
const clip = (s, n = 158) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const json = obj => JSON.stringify(obj).replace(/</g, '\\u003c');
const ld = obj => `<script type="application/ld+json">${json(obj)}</script>`;
const colourFor = p => COLOURS.find(c => c.re.test(p.title));
const PLAIN_KIND = {
  'Race Fit Jersey': 'race-fit cycling jersey', 'Club Fit Jersey': 'club-fit cycling jersey', 'Bib Shorts': 'cycling bib shorts',
  Trisuit: 'triathlon trisuit', Gilet: 'cycling gilet', Singlet: 'running singlet', 'T-Shirt': 'running T-shirt',
  'Long Sleeve Shirt': 'long-sleeve running top', Cap: 'trucker cap', 'Ear Plugs': 'swim ear plugs', 'Gift Cards': 'gift card',
};
const plainKind = p => (/long sleeve/i.test(p.title) && /Jersey$/.test(p.kind) ? 'long-sleeve cycling jersey' : PLAIN_KIND[p.kind] || p.kind.toLowerCase());
const titleKind = p => plainKind(p).replace(/^./, c => c.toUpperCase());

/* ---------- shared structured data ---------- */
const ORG_ID = abs('#organization') || '#organization';
const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.name,
  url: BASE || site.shopUrl,
  logo: img('/cdn/shop/files/WYLD-Black1080.png', 600),
  description: site.description,
  sameAs: [site.shopUrl, site.social.instagram, site.social.tiktok].filter(Boolean),
  contactPoint: [{
    '@type': 'ContactPoint',
    contactType: 'customer service',
    url: site.contact.form,
    ...(site.contact.email && { email: site.contact.email }),
    ...(site.contact.phone && { telephone: site.contact.phone }),
    availableLanguage: ['English'],
  }],
};
const brand = { '@type': 'Brand', name: site.name };

function productLD(p, url) {
  const prices = p.variants.map(v => v.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const availability = p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const colour = colourFor(p);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    productID: p.handle,
    description: describe(p).join(' '),
    image: p.images.slice(0, 4).map(i => img(i, 1200)),
    brand,
    category: `${CATEGORY_LABEL[p.category]} > ${p.kind}`,
    ...(colour && { color: colour.name }),
    ...(sizesOf(p).length && { size: sizesOf(p).join(', ') }),
    offers: lo === hi ? {
      '@type': 'Offer', url: url || `${site.shopUrl}/products/${p.handle}`, priceCurrency: site.currency, price: lo.toFixed(2),
      availability, itemCondition: 'https://schema.org/NewCondition', seller: { '@id': ORG_ID },
    } : {
      '@type': 'AggregateOffer', url: url || `${site.shopUrl}/products/${p.handle}`, priceCurrency: site.currency,
      lowPrice: lo.toFixed(2), highPrice: hi.toFixed(2), offerCount: p.variants.length, availability,
    },
  };
}
const breadcrumbLD = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(abs(path) && { item: abs(path) }) })),
});
const itemListLD = (name, list) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name,
  itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(productPath(p)) || productPath(p), name: p.title })),
});

/* ---------- FAQ (facts from the store's own policies and catalog) ---------- */
const FAQ = [
  ['What sizes does WYLD make?', `WYLD makes size-inclusive kit. Across the current collection, sizes run from ${sizeRange(inStock)}, with women's and men's fits on most jerseys and bib shorts. Each product page lists the sizes in stock and links to the size guide.`],
  ['What is the difference between Race Fit and Club Fit jerseys?', 'Race Fit is a close, aerodynamic cut that sits snug against the body for fast riding. Club Fit is a more relaxed cut for comfortable long days and social rides.'],
  ['Is shipping free?', `Shipping is free on orders over ${money(site.freeShippingThreshold)}. Below that, shipping is calculated at checkout. Taxes and duties set by the destination country are paid by the buyer.`],
  ['How do I pay?', 'Checkout happens securely on ridewyld.com, the official WYLD store. Your bag is carried over with your chosen sizes.'],
  ['Does WYLD make custom team kit?', 'Yes. WYLD designs custom jerseys, bib shorts, trisuits, T-shirts and run tops for individual athletes, clubs and teams — from a single piece to a full team order. Custom kit is not eligible for returns or exchanges.'],
  ['Which prices are shown?', `Prices are in ${site.currency} and are synced from the official store every day, including current sale prices and stock.`],
];
const faqLD = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};
const faqHTML = `<div class="faq-list">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="body"><p>${esc(a)}</p></div></details>`).join('')}</div>`;

/* ---------- contact (only channels that are configured) ---------- */
function contactItems() {
  const c = site.contact;
  return [
    c.email && `<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`,
    c.phone && `<li><a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a></li>`,
    c.whatsapp && `<li><a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a></li>`,
    `<li><a href="${c.form}" target="_blank" rel="noopener">Contact form</a></li>`,
    `<li><a href="${c.customKit}" target="_blank" rel="noopener">Custom kit enquiries</a></li>`,
    `<li><a href="${site.social.instagram}" target="_blank" rel="noopener">Instagram</a></li>`,
    `<li><a href="${site.social.tiktok}" target="_blank" rel="noopener">TikTok</a></li>`,
  ].filter(Boolean).join('\n        ');
}

/* ---------- static page shell ---------- */
function page({ path, title, description, image, body, jsonld = [], depth = 2 }) {
  const up = '../'.repeat(depth);
  const canonical = abs(path);
  return `<!doctype html>
<html lang="${site.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://ridewyld.com https://cdn.shopify.com; base-uri 'self'; object-src 'none'; form-action 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#f6f4ef">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
${canonical ? `<link rel="canonical" href="${canonical}">\n` : ''}<meta property="og:type" content="${jsonld.some(j => j['@type'] === 'Product') ? 'product' : 'website'}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${canonical}">\n` : ''}<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${up}fonts/inknut-antiqua-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}fonts/fonts.css">
<link rel="stylesheet" href="${up}src/store.css">
<link rel="icon" href="${up}app/icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="${up}app/icons/apple-touch-icon.png">
<link rel="manifest" href="${up}app/manifest.webmanifest">
${jsonld.map(ld).join('\n')}
</head>
<body class="static">
<svg width="0" height="0" class="svg-defs" aria-hidden="true">
  <symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></symbol>
</svg>
<div class="announce"><ul><li class="on">Free shipping over ${money(site.freeShippingThreshold)}</li></ul></div>
<header class="header">
  <div class="wrap header-inner">
    <nav class="nav static-nav" aria-label="Primary">
      <a href="${up}c/cycling/">Cycling</a><a href="${up}c/triathlon/">Triathlon</a><a href="${up}c/run/">Run</a><a href="${up}c/accessories/">Accessories</a><a href="${up}upcoming/">Upcoming</a><a href="${up}bike-porn/">Bike Porn</a>
    </nav>
    <a class="logo" href="${up}" aria-label="WYLD home"><img src="${img('/cdn/shop/files/WYLD-Black1080.png', 240)}" alt="WYLD" width="84" height="30"></a>
    <div class="tools"><a class="icon-btn" href="${up}#bag" aria-label="Bag"><svg><use href="#i-bag"/></svg></a></div>
  </div>
</header>
<main class="static-main">
${body}
</main>
${footerHTML(up)}
</body>
</html>
`;
}

function footerHTML(up) {
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div><h4>Shop</h4><ul>
        ${Object.entries(CATS).filter(([k]) => k !== 'all').map(([k, c]) => `<li><a href="${up}c/${k}/">${c.title}</a></li>`).join('\n        ')}
      </ul></div>
      <div><h4>Colours</h4><ul>
        ${COLOURS.filter(c => colourProducts(c).length).slice(0, 6).map(c => `<li><a href="${up}colour/${c.slug}/">${c.name}</a></li>`).join('\n        ')}
      </ul></div>
      <div><h4>Help</h4><ul>
        <li><a href="${site.policies.shipping}" target="_blank" rel="noopener">Shipping</a></li>
        <li><a href="${site.policies.returns}" target="_blank" rel="noopener">Returns</a></li>
        <li><a href="${site.policies.privacy}" target="_blank" rel="noopener">Privacy</a></li>
        <li><a href="${up}upcoming/">Upcoming releases</a></li>
        <li><a href="${up}bike-porn/">Bike Porn</a></li>
        <li><a href="${up}app/?install=1">Get the app</a></li>
      </ul></div>
      <div><h4>Contact</h4><ul>
        ${contactItems()}
      </ul></div>
    </div>
    <div class="footer-base"><span>© ${new Date().getFullYear()} ${site.name} · Prices in ${site.currency}, synced ${today}</span><a href="${up}llms.txt">llms.txt</a></div>
  </div>
</footer>`;
}

const colourProducts = c => products.filter(p => c.re.test(p.title));

/* ---------- product pages ---------- */
function productPage(p) {
  const path = productPath(p);
  const url = abs(path);
  const kind = KIND_LABEL[p.kind] || p.kind;
  const sizes = sizesOf(p), fits = fitsOf(p);
  const colour = colourFor(p);
  const stock = p.available ? 'In stock' : 'Sold out';
  const description = clip(`${p.title}, a ${plainKind(p)} by WYLD. ${p.from ? 'From ' : ''}${money(p.price)}${p.was ? ` (was ${money(p.was)})` : ''}.${fits.length ? ` ${fits.join(' & ')} fit.` : ''}${sizes.length ? ` Sizes ${sizes[0]}${sizes.length > 1 ? `–${sizes.at(-1)}` : ''}.` : ''} ${stock}. Free shipping over ${money(site.freeShippingThreshold)}.`);
  const related = relatedFor(p, 4);
  const body = `
<nav class="wrap crumbs static-crumbs" aria-label="Breadcrumb"><a href="../../">Home</a><span>/</span><a href="../../c/${p.category}/">${CATEGORY_LABEL[p.category]}</a><span>/</span><span>${esc(p.title)}</span></nav>
<article class="wrap static-product">
  <div class="static-gallery">
    ${p.images.map((src, i) => `<figure><img src="${img(src, 1200)}" srcset="${srcset(src, [600, 900, 1200, 1800])}" sizes="(min-width:1080px) 30vw, 100vw" alt="${esc(p.title)} — image ${i + 1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></figure>`).join('\n    ')}
  </div>
  <div class="static-info">
    <span class="eyebrow muted">${CATEGORY_LABEL[p.category]} · ${esc(kind)}</span>
    <h1>${esc(p.title)}</h1>
    ${priceHTML(p)}
    <dl class="facts">
      ${fits.length ? `<div><dt>Fit</dt><dd>${esc(fits.join(', '))}</dd></div>` : ''}
      ${sizes.length ? `<div><dt>Sizes in stock</dt><dd>${esc(sizes.join(' · '))}</dd></div>` : ''}
      ${colour ? `<div><dt>Colour</dt><dd><a href="../../colour/${colour.slug}/">${colour.name}</a></dd></div>` : ''}
      <div><dt>Availability</dt><dd>${stock}</dd></div>
      <div><dt>Shipping</dt><dd>Free over ${money(site.freeShippingThreshold)}</dd></div>
    </dl>
    <div class="static-cta">
      ${p.available ? `<a class="btn block" href="../../#/p/${p.handle}">Choose size &amp; add to bag</a>` : ''}
      <a class="btn ghost block" href="${site.shopUrl}/products/${p.handle}" target="_blank" rel="noopener">View on ridewyld.com</a>
    </div>
    <h2 class="h3-sm">Details</h2>
    ${describe(p).map(t => `<p>${esc(t)}</p>`).join('\n    ')}
  </div>
</article>
${related.length ? `<section class="wrap related static-related"><h2 class="h2">${/Jersey$/.test(p.kind) ? 'Complete the kit' : 'You may also like'}</h2><div class="grid">${related.map(x => card(x, '(min-width:1080px) 24vw, 48vw', '../../')).join('')}</div></section>` : ''}`;
  return page({
    path, title: `${p.title} — ${titleKind(p)} | ${site.name}`, description, image: img(p.images[0], 1200), body,
    jsonld: [productLD(p, url), breadcrumbLD([['Home', ''], [CATEGORY_LABEL[p.category], `c/${p.category}/`], [p.title, path]])],
  });
}

/* ---------- category and colour pages ---------- */
const CAT_INTRO = {
  cycling: 'Race-fit and club-fit cycling jerseys, bib shorts and gilets in bold WYLD colourways.',
  triathlon: 'Trisuits made to be worn from swim to run.',
  run: 'Run WYLD tops: T-shirts, singlets and long sleeves in signature gradients.',
  accessories: 'Caps, swim ear plugs and gift cards for race week and beyond.',
  sale: 'Current WYLD offers, synced daily from the official store.',
};
function listingPage({ path, h1, eyebrow, intro, list, crumbs }) {
  const range = sizeRange(list.filter(p => p.available));
  const lede = `${intro} ${list.length} ${list.length === 1 ? 'style' : 'styles'}${range ? `, sizes ${range}` : ''}. Prices in ${site.currency}.`;
  const body = `
<nav class="wrap crumbs static-crumbs" aria-label="Breadcrumb"><a href="../../">Home</a><span>/</span><span>${esc(h1)}</span></nav>
<section class="wrap static-listing">
  <span class="eyebrow muted">${esc(eyebrow)}</span>
  <h1 class="h2">${esc(h1)}</h1>
  <p class="lede">${esc(lede)}</p>
  <div class="grid">${list.map(p => card(p, '(min-width:1080px) 24vw, 48vw', '../../')).join('')}</div>
</section>`;
  return page({
    path, title: eyebrow === 'Colour' ? `${h1} cycling & run kit | ${site.name}` : `${h1} apparel — ${site.name}`, description: clip(lede), image: img(list[0]?.images[0] || '/cdn/shop/files/WYLD-Black1080.png', 1200), body,
    jsonld: [itemListLD(h1, list), breadcrumbLD(crumbs)],
  });
}

/* ---------- write everything ---------- */
const written = [];
function write(rel, content) {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  written.push(rel);
}
// Remove pages for products or colours that no longer exist.
for (const dir of ['p', 'c', 'colour']) rmSync(join(ROOT, dir), { recursive: true, force: true });

for (const p of products) write(`${productPath(p)}index.html`, productPage(p));
for (const [key, c] of Object.entries(CATS)) {
  if (key === 'all') continue;
  const list = products.filter(c.test);
  if (list.length) write(`c/${key}/index.html`, listingPage({ path: `c/${key}/`, h1: c.title, eyebrow: 'Collection', intro: CAT_INTRO[key] || '', list, crumbs: [['Home', ''], [c.title, `c/${key}/`]] }));
}
const colourPages = [];
for (const c of COLOURS) {
  const list = colourProducts(c);
  if (!list.length) continue;
  colourPages.push(c);
  write(`colour/${c.slug}/index.html`, listingPage({ path: `colour/${c.slug}/`, h1: `${c.name}`, eyebrow: 'Colour', intro: `WYLD kit in ${c.name}.`, list, crumbs: [['Home', ''], [c.name, `colour/${c.slug}/`]] }));
}

/* ---------- homepage blocks ---------- */
const indexFile = join(ROOT, 'index.html');
let index = readFileSync(indexFile, 'utf8');
const fill = (name, html) => {
  const re = new RegExp(`(<!-- seo:${name} -->)[\\s\\S]*?(<!-- /seo:${name} -->)`);
  if (!re.test(index)) throw new Error(`index.html is missing the seo:${name} block`);
  index = index.replace(re, `$1\n${html}\n$2`);
};
const homeDescription = `${site.description} Prices in ${site.currency}; free shipping over ${money(site.freeShippingThreshold)}.`;
fill('head', [
  `<meta name="description" content="${esc(clip(homeDescription, 200))}">`,
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  abs('') && `<link rel="canonical" href="${abs('')}">`,
  '<meta property="og:type" content="website">',
  `<meta property="og:site_name" content="${site.name}">`,
  `<meta property="og:title" content="${site.name} — ${esc(site.tagline)}">`,
  `<meta property="og:description" content="${esc(clip(homeDescription, 200))}">`,
  abs('') && `<meta property="og:url" content="${abs('')}">`,
  `<meta property="og:image" content="${img('/cdn/shop/files/raspberry_jersey_female_cyclists.jpg', 1200)}">`,
  '<meta name="twitter:card" content="summary_large_image">',
  '<link rel="alternate" type="text/plain" title="llms.txt" href="llms.txt">',
  ld({ '@context': 'https://schema.org', '@graph': [
    organization,
    { '@type': 'WebSite', '@id': abs('#website') || '#website', name: site.name, url: BASE || undefined, publisher: { '@id': ORG_ID }, inLanguage: site.language },
  ] }),
  ld(itemListLD(`${site.name} collection`, products)),
  ld(faqLD),
].filter(Boolean).join('\n'));
fill('grid', products.map(p => card(p)).join(''));
fill('faq', faqHTML);
fill('contact', contactItems());
fill('seolinks', [
  ...Object.entries(CATS).filter(([k]) => k !== 'all' && products.some(CATS[k].test)).map(([k, c]) => `<a href="c/${k}/">${c.title}</a>`),
  ...colourPages.map(c => `<a href="colour/${c.slug}/">${c.name}</a>`),
].join(' '));
writeFileSync(indexFile, index);

/* ---------- sitemap, robots, llms ---------- */
if (BASE) {
  const urls = [
    ['', '1.0'],
    ...Object.keys(CATS).filter(k => k !== 'all' && existsSync(join(ROOT, `c/${k}/index.html`))).map(k => [`c/${k}/`, '0.8']),
    ...colourPages.map(c => [`colour/${c.slug}/`, '0.6']),
    ...products.map(p => [productPath(p), p.available ? '0.9' : '0.4']),
    ['upcoming/', '0.5'],
    ['bike-porn/', '0.5'],
    ['app/', '0.3'],
  ];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr]) => `  <url><loc>${BASE}${u}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`);
}
write('robots.txt', `# Crawlers and AI assistants are welcome.
User-agent: *
Allow: /
Disallow: /native/
Disallow: /tools/
${BASE ? `\nSitemap: ${BASE}sitemap.xml\n` : ''}`);

const line = p => `- [${p.title}](${abs(productPath(p)) || productPath(p)}): ${p.kind}, ${p.from ? 'from ' : ''}${money(p.price)}${p.was ? ` (was ${money(p.was)})` : ''}; ${p.available ? `in stock${sizesOf(p).length ? `, sizes ${sizesOf(p).join('/')}` : ''}` : 'sold out'}`;
const llms = `# ${site.name}

> ${site.description} Official store and checkout: ${site.shopUrl}. Prices in ${site.currency}, synced daily (last sync ${today}). Free shipping over ${money(site.freeShippingThreshold)}.

WYLD is a cycling, triathlon and running apparel brand focused on size inclusivity, colour and comfort, with a custom team kit service for clubs and teams.

## Collections
${Object.entries(CATS).filter(([k]) => k !== 'all' && products.some(CATS[k].test)).map(([k, c]) => `- [${c.title}](${abs(`c/${k}/`) || `c/${k}/`}): ${CAT_INTRO[k] || ''}`).join('\n')}

## Products
${products.map(line).join('\n')}

## Colours
${colourPages.map(c => `- [${c.name}](${abs(`colour/${c.slug}/`) || `colour/${c.slug}/`})`).join('\n')}

## Help
- [Shipping policy](${site.policies.shipping})
- [Returns policy](${site.policies.returns})
- [Upcoming releases](${abs('upcoming/') || 'upcoming/'}): sign up to hear about new drops first
- [Bike Porn](${abs('bike-porn/') || 'bike-porn/'}): eight WYLD bike movies in 3D: custom Speedmax CFR AXS liveries with persona riders (the Alien, the Supermodel, the Witch, the Babysitter and more), movie sets and cinematic trailers
- [Custom team kit](${site.contact.customKit})
- [Contact](${site.contact.form})

## Optional
- [Full product details](${abs('llms-full.txt') || 'llms-full.txt'})
- [WYLD app](${abs('app/') || 'app/'})
`;
write('llms.txt', llms);
write('llms-full.txt', `# ${site.name} — full catalog

> Every product with price, fits, sizes in stock and description. Prices in ${site.currency}, synced ${today} from ${site.shopUrl}.

${FAQ.map(([q, a]) => `**${q}** ${a}`).join('\n\n')}

${products.map(p => `## ${p.title}

- Type: ${p.kind} (${CATEGORY_LABEL[p.category]})
- Price: ${p.from ? 'from ' : ''}${money(p.price)}${p.was ? ` (was ${money(p.was)})` : ''}
- Availability: ${p.available ? 'in stock' : 'sold out'}
${fitsOf(p).length ? `- Fit: ${fitsOf(p).join(', ')}\n` : ''}${sizesOf(p).length ? `- Sizes in stock: ${sizesOf(p).join(', ')}\n` : ''}- Page: ${abs(productPath(p)) || productPath(p)}
- Buy: ${site.shopUrl}/products/${p.handle}

${describe(p).join('\n\n')}
`).join('\n')}`);

console.log(`${written.length} files written${BASE ? ` for ${BASE}` : ' (relative links; set SITE_URL for canonical URLs and sitemap)'}`);
