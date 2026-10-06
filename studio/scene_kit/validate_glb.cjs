/* Usage: NODE_PATH=/path/to/node_modules node validate_glb.cjs /asset/directory
 * Dependency: Khronos gltf-validator (install separately, no runtime dependency).
 */
const fs = require('fs'), path = require('path'), validator = require('gltf-validator');
(async () => {
  const summaries = [];
  for (const dir of process.argv.slice(2)) {
    for (const name of fs.readdirSync(dir).filter(x => x.endsWith('.glb'))) {
      const file = path.join(dir, name), bytes = fs.readFileSync(file);
      const result = await validator.validateBytes(new Uint8Array(bytes), { uri: name, maxIssues: 100 });
      fs.writeFileSync(file + '.validation.json', JSON.stringify(result, null, 2));
      const data = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
      summaries.push({ file, bytes: bytes.length, errors: result.issues.numErrors,
        warnings: result.issues.numWarnings, nodes: data.nodes.length, meshes: data.meshes.length,
        unexpectedDefaultCube: data.nodes.some(x => x.name === 'Cube') });
    }
  }
  console.log(JSON.stringify(summaries, null, 2));
  if (summaries.some(x => x.errors || x.unexpectedDefaultCube)) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
