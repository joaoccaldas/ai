// Assembles www/ for the native build from the web app and its shared modules.
//
//   ../app/*          -> www/            the app itself (service workers skipped)
//   ../src/core/*     -> www/src/core/   shared catalog, storage and formatting
//   ../config/site.js -> www/config/     brand, contact and commerce settings
//   ../data/*         -> www/data/       bundled catalog (offline fallback)
//   ../fonts/*        -> www/fonts/      self-hosted fonts
//
// app.js imports '../src/...', '../config/...', which resolve to /src/ and
// /config/ at the web root, so the folder layout mirrors the website.
//
// Environment (set by CI):
//   SITE_URL            public site URL; enables live prices and update checks
//   WYLD_VERSION_CODE   Android versionCode of this build
//   WYLD_VERSION_NAME   human-readable version
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const store = join(here, '..', '..');
const www = join(here, '..', 'www');

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
cpSync(join(store, 'app'), www, { recursive: true, filter: src => !src.endsWith('sw.js') });
cpSync(join(store, 'src', 'core'), join(www, 'src', 'core'), { recursive: true });
cpSync(join(store, 'config'), join(www, 'config'), { recursive: true });
cpSync(join(store, 'data'), join(www, 'data'), { recursive: true });
cpSync(join(store, 'fonts'), join(www, 'fonts'), { recursive: true });

let siteUrl = (process.env.SITE_URL || '').trim();
if (siteUrl && !/^https:\/\/[^\s"'<>]+$/.test(siteUrl)) throw new Error(`SITE_URL must be an https URL, got: ${siteUrl}`);
if (siteUrl && !siteUrl.endsWith('/')) siteUrl += '/';
const versionCode = Number.parseInt(process.env.WYLD_VERSION_CODE || '0', 10) || 0;
const versionName = (process.env.WYLD_VERSION_NAME || '').replace(/[^\w.-]/g, '').slice(0, 20);

writeFileSync(join(www, 'src', 'core', 'runtime.js'), `// Written by native/scripts/build-www.mjs for this build.
export const runtime = ${JSON.stringify({ remoteBase: siteUrl, appVersionCode: versionCode, appVersionName: versionName }, null, 2)};
`);

// Allow the app to fetch live catalog data from the published site.
if (siteUrl) {
  const origin = new URL(siteUrl).origin;
  const index = join(www, 'index.html');
  writeFileSync(index, readFileSync(index, 'utf8').replace("connect-src 'self'", `connect-src 'self' ${origin}`));
}
console.log(`www ready${siteUrl ? ` (live data from ${new URL(siteUrl).origin})` : ' (bundled data only)'}`);
