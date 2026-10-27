// Demo helper: KONA gates bikes and rooms by the visitor's level, stored in the browser's own storage
// for joaoccaldas.github.io. For the demo we raise that level to the top so everything opens and renders.
// The previous value is kept and can be restored (unlock.html?restore=1).
export const KONA_ORIGIN = 'https://joaoccaldas.github.io';
export const KONA_RE = /^https:\/\/joaoccaldas\.github\.io\/(konam|bellagio\/worlds\/vegas\/kona-rooms)\//;
export const UNLOCK_PAGE = KONA_ORIGIN + '/ai/greatlinq-showcase/unlock.html';
const KEY = 'kona.progression.v1', BACKUP = KEY + '.demobackup';
export const isKona = url => KONA_RE.test(url || '');
export function unlockKona(storage = globalThis.localStorage) {
  try {
    const cur = storage.getItem(KEY);
    let level = 0; try { level = JSON.parse(cur || 'null')?.level || 0; } catch (_) {}
    if (level >= 10) return true;                                   // already at the top
    if (cur && !storage.getItem(BACKUP)) storage.setItem(BACKUP, cur);
    storage.setItem(KEY, JSON.stringify({ schema: 'progression-v1', access_tier: 'athlete', xp: 2000, level: 10, level_name: 'Demo',
      streak: 0, discoveries: [], badges: [], unlocks: [], seen: [], ledger: [], credits: 0, history: [], acquisitions: [] }));
    return true;
  } catch (_) { return false; }
}
export function restoreKona(storage = globalThis.localStorage) {
  try { const b = storage.getItem(BACKUP); if (b) { storage.setItem(KEY, b); storage.removeItem(BACKUP); } else storage.removeItem(KEY); return true; } catch (_) { return false; }
}
