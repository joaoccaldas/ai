#!/usr/bin/env node
// Uniqueness + mapping gate for the Greatlinq / Spatial Studio catalog.
//   node tools/check-links.mjs [--app ./app] [--konam ~/Developer/konam] [--online]
// Fails (exit 1) on: duplicate ids, unmapped items, orphan registry rows, ambiguous destinations,
// unacknowledged duplicate titles, unknown ?room= areas, missing images, undocumented "none" links.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const APP = path.resolve(arg('--app', fileURLToPath(new URL('../app/', import.meta.url))));
const KONAM = arg('--konam', null);
const ONLINE = process.argv.includes('--online');
const read = f => JSON.parse(fs.readFileSync(path.join(APP, f), 'utf8'));
const cat = read('catalog.json'), reg = read('link-registry.json');
const OURS = ['threshold', 'lantern', 'arch', 'arch-world']; // hand-authored items defined in app.js
const errors = [], warns = [];
const E = m => errors.push(m), W = m => warns.push(m);
const norm = s => (s || '').toLowerCase().trim();

// 1. ids unique
const byId = new Map();
for (const i of cat.items) {
  if (byId.has(i.id)) E(`duplicate id "${i.id}" (${byId.get(i.id).section} / ${i.section}) — ${JSON.stringify(byId.get(i.id)) === JSON.stringify(i) ? 'identical rows' : 'rows differ'}`);
  else byId.set(i.id, i);
}
for (const id of OURS) if (byId.has(id)) E(`catalog id "${id}" collides with a hand-authored item in app.js`);
const allIds = new Set([...byId.keys(), ...OURS]);

// 2. every item mapped; no orphans
for (const id of allIds) if (!reg.items[id]) E(`unmapped: "${id}" has no entry in link-registry.json`);
for (const id of Object.keys(reg.items)) if (!allIds.has(id)) E(`orphan: registry entry "${id}" matches no catalog item`);

// 3. entry shape + "none" must say why
for (const [id, e] of Object.entries(reg.items)) {
  if (!['room', 'studio', 'page', 'local', 'project', 'none'].includes(e.type)) E(`"${id}": bad type "${e.type}"`);
  if (e.type === 'none' && !e.why) E(`"${id}": type none needs a "why"`);
  if (e.type !== 'none' && !e.to) E(`"${id}": type ${e.type} needs "to"`);
}

// 4. destinations unique where they must be (room/page/local); project landings must be declared
const dests = new Map();
for (const [id, e] of Object.entries(reg.items)) {
  if (!e.to) continue;
  if (['room', 'studio', 'page', 'local'].includes(e.type)) {
    if (e.aliasOf) { if (!reg.items[e.aliasOf] || reg.items[e.aliasOf].to !== e.to) E(`"${id}": aliasOf "${e.aliasOf}" must exist with the same destination`); continue; }
    (dests.get(e.to) || dests.set(e.to, []).get(e.to)).push(id);
  } else if (e.type === 'project' && !Object.values(reg.projects).includes(e.to) && !(reg.sharedDestinations || []).includes(e.to))
    E(`"${id}": project destination ${e.to} is not a declared project landing (reg.projects / reg.sharedDestinations)`);
}
for (const [to, ids] of dests) if (ids.length > 1) E(`ambiguous: ${ids.length} items share ${to}: ${ids.join(', ')} (give each its own destination or add aliasOf)`);

// 5. titles: duplicates must be acknowledged
const titles = new Map();
for (const i of cat.items) (titles.get(norm(i.title)) || titles.set(norm(i.title), []).get(norm(i.title))).push(i.id);
const okDup = new Set((reg.allowedTitleDuplicates || []).map(norm));
for (const [t, ids] of titles) if (new Set(ids).size > 1 && !okDup.has(t)) E(`title "${t}" used by distinct ids ${[...new Set(ids)].join(', ')} — rename or add to allowedTitleDuplicates`);

// 6. ?room= areas must be declared (and exist in the konam repo when --konam is given)
const areas = new Set(reg.areas || []);
const pieces = new Set(reg.studioPieces || []), reviews = new Set(reg.reviewRooms || []);
for (const [id, e] of Object.entries(reg.items)) {
  if (e.type === 'room') {
    const u = new URL(e.to), a = u.searchParams.get('room'), rv = u.searchParams.get('reviewRoom');
    if (a && !areas.has(a)) E(`"${id}": room "${a}" not declared in registry.areas`);
    if (rv && !reviews.has(rv)) E(`"${id}": reviewRoom "${rv}" not declared in registry.reviewRooms`);
    if (!a && !rv) E(`"${id}": room link has neither ?room= nor ?reviewRoom=`);
  }
  if (e.type === 'studio') { const p = new URL(e.to).searchParams.get('p'); if (!pieces.has(p)) E(`"${id}": Studio piece "${p}" not declared in registry.studioPieces`); }
}
if (KONAM) {
  const hay = ['app/hall.js', 'app/museum-data.js'].map(f => fs.readFileSync(path.join(KONAM, f), 'utf8')).join('\n');
  for (const a of areas) if (!hay.includes(`"${a}"`)) E(`area "${a}" not found in konam app/hall.js or museum-data.js`);
  const studioSrc = fs.readFileSync(path.join(KONAM, 'app/studio-catalog.js'), 'utf8');
  for (const p of pieces) if (!studioSrc.includes(p)) E(`Studio piece "${p}" not found in konam app/studio-catalog.js`);
} else W('konam repo not given (--konam): area ids not verified against source');

// 6b. weight must be declared for every room (the UI labels heavy 3D rooms)
for (const [id, e] of Object.entries(reg.items)) if (e.type === 'room' && !e.weight) E(`"${id}": room needs weight (heavy|light)`);

// 7. images exist
for (const i of cat.items) if (i.image && !i.image.startsWith('/') && !i.image.startsWith('http') && !fs.existsSync(path.join(APP, i.image))) E(`image missing for "${i.id}": ${i.image}`);

// 8. info: konam items still on a generic landing
for (const [id, e] of Object.entries(reg.items)) if (byId.get(id)?.project === 'konam' && e.type === 'project') W(`"${id}" (${byId.get(id).title}) opens the generic Kona landing — no deep link yet`);

// 9. optional online check of distinct base URLs
if (ONLINE) {
  const bases = [...new Set(Object.values(reg.items).map(e => e.to).filter(t => t && t.startsWith('http')))];
  const res = await Promise.all(bases.map(async u => { try { const r = await fetch(u.split('#')[0], { redirect: 'follow', signal: AbortSignal.timeout(15000) }); return [u, r.status]; } catch (e) { return [u, 'ERR ' + e.message]; } }));
  for (const [u, s] of res) if (s !== 200) E(`online: ${u} -> ${s}`);
  console.log(`online: ${res.length - res.filter(([, s]) => s !== 200).length}/${res.length} URLs return 200`);
}

const c = {}; for (const e of Object.values(reg.items)) c[e.type] = (c[e.type] || 0) + 1;
console.log(`items ${allIds.size} · registry ${Object.keys(reg.items).length} · types ${JSON.stringify(c)}`);
for (const w of warns) console.log('  warn  ' + w);
for (const e of errors) console.log('  ERROR ' + e);
console.log(errors.length ? `\nFAILED: ${errors.length} error(s)` : '\nPASS: every item is unique, mapped and indexed');
process.exit(errors.length ? 1 : 0);
