// Copies the web app into www/ for the native build.
// ../app/*  -> www/          (the app itself; service workers are skipped)
// ../src/catalog.js -> www/src/catalog.js  (app.js imports '../src/catalog.js',
//                                           which resolves to /src/ at the root)
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const store = join(here, '..', '..');
const www = join(here, '..', 'www');

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'src'), { recursive: true });
cpSync(join(store, 'app'), www, { recursive: true, filter: src => !src.endsWith('sw.js') });
cpSync(join(store, 'src', 'catalog.js'), join(www, 'src', 'catalog.js'));
console.log('www ready');
