// Device storage: bag and saved items, shared by the website and the app
// (same origin, same keys). Everything read back is validated.
import { db } from './model.js';
import { site } from '../../config/site.js';

export const store = {
  get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode or quota */ } },
};

export const BAG_KEY = 'wyld-bag-v1';
export const SAVED_KEY = 'wyld-saved-v1';
export const MAX_QTY = 10;

export function readBag() {
  const raw = store.get(BAG_KEY, []);
  return Array.isArray(raw) ? raw.filter(l => l && Number.isSafeInteger(l.id) && db.variants.has(l.id) && Number.isInteger(l.qty) && l.qty > 0)
    .map(l => ({ id: l.id, qty: Math.min(l.qty, MAX_QTY) })) : [];
}
export const writeBag = bag => store.set(BAG_KEY, bag);
export function addLine(bag, id) {
  const line = bag.find(l => l.id === id);
  if (line) line.qty = Math.min(line.qty + 1, MAX_QTY); else bag.push({ id, qty: 1 });
  return bag;
}
export const bagCount = bag => bag.reduce((n, l) => n + l.qty, 0);
export const bagTotal = bag => bag.reduce((n, l) => n + (db.variants.get(l.id)?.v.price || 0) * l.qty, 0);
// Checkout on the real store: a Shopify cart permalink with the bag pre-filled.
export const checkoutURL = bag => `${site.shopUrl}/cart/${bag.map(l => `${l.id}:${l.qty}`).join(',')}`;

// Progress towards the store's free-shipping threshold.
export function freeShipping(total) {
  const t = site.freeShippingThreshold;
  if (!t) return null;
  return { threshold: t, remaining: Math.max(0, t - total), progress: Math.min(1, total / t) };
}

export function readSaved() {
  const raw = store.get(SAVED_KEY, []);
  return Array.isArray(raw) ? raw.filter(h => typeof h === 'string' && db.byHandle.has(h)) : [];
}
export const writeSaved = saved => store.set(SAVED_KEY, saved);
