import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
assert.match(html, /<!doctype html>/i);
assert.match(html, /<canvas\b[^>]*id="view"/i);
for (const id of ['seek', 'play', 'clock', 'status']) {
  assert.ok(html.includes('id="' + id + '"'), 'missing ' + id);
}
assert.match(html, /max="14"/, '14-second timing');
assert.ok(!/https?:\/\//.test(html), 'no external URLs in standalone page');
assert.ok(!/<script[^>]+src=/.test(html), 'no remote scripts');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script && script.length > 1000, 'missing embedded renderer');
const syntax = spawnSync(process.execPath, ['--check'], {input: script, encoding: 'utf8'});
assert.equal(syntax.status, 0, syntax.stderr);
const match = html.match(/Uint8Array\.from\(atob\('([A-Za-z0-9+/=]+)'\)/);
assert.ok(match, 'missing embedded point-cloud payload');
const packed = Buffer.from(match[1], 'base64');
assert.equal(packed.length % 9, 0, '9-byte record alignment');
assert.equal(packed.length / 9, 32231, 'unexpected geometry count');
for (let i = 0; i < packed.length; i += 9) {
  assert.ok(packed[i + 8] <= 7, 'material outside palette');
}
console.log('PASS | standalone viewer, JS syntax, 32,231 points, 14-second controls, no external dependencies');
