// Product card, shared by the live store and the pre-rendered SEO pages so both
// output identical markup. `base` prefixes links from pages in subfolders.
import { img, srcset, esc, priceHTML } from './core/format.js';

export const productPath = (p, base = '') => `${base}p/${p.handle}/`;

export function card(p, sizes = '(min-width:1080px) 24vw, (min-width:720px) 32vw, 48vw', base = '') {
  const [a, b] = p.images;
  const badge = !p.available ? '<span class="badge out">Sold out</span>'
    : p.was ? `<span class="badge sale">−${Math.round((1 - p.price / p.was) * 100)}%</span>` : '';
  return `<article class="card${p.available ? '' : ' soldout'}">
    <a href="${productPath(p, base)}" data-product="${p.handle}">
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
