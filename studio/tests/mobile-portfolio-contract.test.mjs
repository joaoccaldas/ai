import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(import.meta.dirname,'..');
const mobile=fs.readFileSync(path.join(dir,'mobile/index.html'),'utf8');
const desktop=fs.readFileSync(path.join(dir,'index.html'),'utf8');
test('filtered mobile cards are genuinely removed from layout',()=>{
 assert.match(mobile,/\.work\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*\}/);
 assert.match(mobile,/cardsEls\.forEach\(c=>c\.hidden=/);
});
test('primary mobile portfolio action points to visible mobile route',()=>{
 assert.match(desktop,/class="mobile-only" href="mobile\/"/);
 assert.doesNotMatch(desktop,/class="mobile-only" href="#mobilePortfolio"/);
});
