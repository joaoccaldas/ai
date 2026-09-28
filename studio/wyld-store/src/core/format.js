// Formatting and escaping shared by the website, the app and the SEO build.
import { site } from '../../config/site.js';

export const SHOP = site.shopUrl;
export const img = (path, w) => `${SHOP}${path}?width=${w}`;
export const srcset = (path, ws = [400, 700, 1000, 1400]) => ws.map(w => `${img(path, w)} ${w}w`).join(',');
export const money = n => `${site.currency} ${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0 })}`;
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const EXT = 'target="_blank" rel="noopener"';

export function priceHTML(p, from = p.from) {
  const pre = from ? 'From ' : '';
  return p.was
    ? `<span class="price"><span class="now">${pre}${money(p.price)}</span><s>${money(p.was)}</s></span>`
    : `<span class="price">${pre}${money(p.price)}</span>`;
}
