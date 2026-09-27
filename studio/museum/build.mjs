// Bundles the hall (three.js r186 + app) into studio/hall/hall.js.  Usage: node studio/hall/build.mjs
import { build } from 'esbuild';
import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
await build({ entryPoints: [path.join(here, 'src/main.js')], bundle: true, format: 'iife', minify: true, target: 'es2020',
  outfile: path.join(here, 'museum.js'), legalComments: 'none', nodePaths: [process.env.NODE_PATH || path.join(here, 'node_modules')],
  banner: { js: '/* Caldas Studio — The Museum. Three.js r186 (MIT). Source: studio/museum/src */' } });
console.log('built hall.js');
