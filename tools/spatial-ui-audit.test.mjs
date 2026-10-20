import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUrl,delta,VIEWPORTS} from './spatial-ui-audit.mjs';
test('only web URLs without embedded credentials',()=>{
 assert.throws(()=>validateUrl('file:///etc/passwd'));
 assert.throws(()=>validateUrl('https://name:secret@example.org/'));
 assert.equal(validateUrl('https://example.org/'),'https://example.org/');
});
test('layout deltas are measured not assumed',()=>{
 assert.deepEqual(delta({overflowPx:20,canvasCount:1,label:'a'},{overflowPx:0,canvasCount:1,label:'b'}),{overflowPx:-20,canvasCount:0});
});
test('phone landscape, portrait and desktop in contract',()=>{
 assert.deepEqual(VIEWPORTS.map(x=>x.name),['phone-portrait','phone-landscape','desktop']);
});
