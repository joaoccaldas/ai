// Legacy standalone museum build. The primary portfolio build also bundles this source.
import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
await build({ entryPoints: [path.join(here, 'src/main.js')], bundle: true, format: 'iife', minify: true, target: 'es2020',
  outfile: path.join(here, 'museum.js'), legalComments: 'none', nodePaths: [process.env.NODE_PATH || path.join(here, 'node_modules')],
  banner: { js: '/* Caldas Studio — The Museum. Three.js r186 (MIT). Source: studio/museum/src */' } });
console.log('Built museum.js');
