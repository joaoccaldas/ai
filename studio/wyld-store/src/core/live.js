// Keeps an installed app current: refreshes prices and stock from the
// published catalog, and checks whether a newer Android build is available.
import { runtime } from './runtime.js';
import { db, loadCatalog } from './model.js';
import { store } from './storage.js';

const CACHE_KEY = 'wyld-catalog-cache-v1';
const TIMEOUT_MS = 8000;

async function getJSON(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: 'no-cache', signal: ctl.signal, credentials: 'omit' });
    return res.ok ? await res.json() : null;
  } catch { return null; } finally { clearTimeout(t); }
}

// Use a newer catalog cached on the device (works offline), if there is one.
export function restoreCachedCatalog() {
  const cached = store.get(CACHE_KEY, null);
  if (cached?.generated && cached.generated > db.generated) loadCatalog(cached);
}

// Returns true when fresher prices or stock were loaded.
export async function refreshCatalog() {
  if (!runtime.remoteBase) return false;
  const data = await getJSON(`${runtime.remoteBase}data/catalog.json`);
  if (!data?.generated || data.generated <= db.generated || !loadCatalog(data)) return false;
  store.set(CACHE_KEY, data);
  return true;
}

// Returns { versionName, url } when a newer Android build has been published.
export async function checkAppUpdate() {
  if (!runtime.remoteBase || !runtime.appVersionCode) return null;
  const v = await getJSON(`${runtime.remoteBase}data/app-version.json`);
  if (!v || !Number.isSafeInteger(v.versionCode) || v.versionCode <= runtime.appVersionCode) return null;
  const apk = typeof v.apk === 'string' && /^[a-z0-9/_.-]+\.apk$/i.test(v.apk) ? v.apk : 'downloads/WYLD.apk';
  return { versionName: String(v.versionName || '').slice(0, 20), url: `${runtime.remoteBase}${apk}` };
}
