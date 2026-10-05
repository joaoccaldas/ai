// Generate derivatives only. The source in Konam is never modified.
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, prune, meshopt, flatten, join, dedup } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const source = process.argv[2];
if (!source) throw new Error('Usage: npm run assets -- /absolute/path/to/konam/assets/museum/speedmax_web.glb');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const count = d => d.getRoot().listMeshes().reduce((s,m) => s + m.listPrimitives().reduce((n,p) => n + (p.getIndices()?.getCount() || p.getAttribute('POSITION').getCount()) / 3, 0), 0);
const original = await io.read(source);
const report = { source: 'konam/assets/museum/speedmax_web.glb', sourceRepository: 'https://github.com/joaoccaldas/konam', sourceCommit: 'a3df4271d6c321c83391f4ba402c18ca520a5cb0', sourceSHA256: createHash('sha256').update(await readFile(source)).digest('hex'), sourceTriangles: count(original), sourcePrimitives: original.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().length,0), sourceBounds: getBounds(original.getRoot().listScenes()[0]), edition: 'edition-film-sanctuary', material: 'paint_frame', palette: ['#b3122e','#1d4fd6','#f2c14e','#2f9e5a','#6f4cd9'], derivatives: [] };
for (const [name, ratio, error] of [['desktop', .25, .001], ['mobile', .07, .004]]) {
  const document = await io.read(source);
  await document.transform(dedup(), flatten(), join({keepNamed:false}), weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error }), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  const target = fileURLToPath(new URL(`assets/speedmax-${name}.glb`, import.meta.url));
  await io.write(target, document);
  report.derivatives.push({ name, file: `speedmax-${name}.glb`, triangles: count(document), primitives: document.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().length,0), bounds: getBounds(document.getRoot().listScenes()[0]), bytes: (await stat(target)).size, ratio, error });
}
await writeFile(new URL('assets/bike-provenance.json', import.meta.url), JSON.stringify(report, null, 2)+'\n');
console.log(JSON.stringify(report, null, 2));
