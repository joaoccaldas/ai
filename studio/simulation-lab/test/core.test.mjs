import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectRegistry,compareMetric,summary} from '../core.mjs';
const fixture=JSON.parse(readFileSync(new URL('../experiments.json',import.meta.url),'utf8'));
const clone=x=>structuredClone(x);
const goodRun={commit:'a'.repeat(40),scene_sha:'b'.repeat(40),device:'test-gpu',
  protocol:'locked-camera-v1',captured_at:'2026-10-18',evidence_url:'https://example.org/receipt'};
const measured={id:'frame_time_p95',unit:'ms',direction:'lower',baseline:20,candidate:15,
  environment:{baseline:{device:'test',DPR:1},candidate:{DPR:1,device:'test'}},
  evidence_url:'https://example.org/measurement'};
test('planned real registry is valid but has no measured claims',()=>{
  const r=inspectRegistry(fixture),s=summary(r);
  assert.deepEqual(r.errors,[]);assert.equal(s.experiments,6);
  assert.equal(s.comparable_metrics,0);assert.equal(s.independently_reviewed,0);
});
test('comparison requires same environment and is order-independent',()=>{
  assert.equal(compareMetric(measured).improvement_percent,25);
  const other=clone(measured);other.environment.candidate.DPR=2;
  assert.equal(compareMetric(other).improvement_percent,null);
  assert.equal(compareMetric(other).reason,'environment-mismatch');
});
test('zero baseline cannot produce a percentage',()=>{
  assert.equal(compareMetric({...measured,baseline:0}).improvement_percent,null);
});
test('duplicate experiment ids are rejected',()=>{
  const x=clone(fixture);x.experiments[1].id=x.experiments[0].id;
  assert.match(inspectRegistry(x).errors.join(' '),/duplicate/);
});
test('planned experiment cannot smuggle numbers into dashboard',()=>{
  const x=clone(fixture);x.experiments[0].metrics[0].candidate=9999;
  assert.match(inspectRegistry(x).errors.join(' '),/must not publish/);
});
test('measured experiment requires reproducible provenance',()=>{
  const x=clone(fixture),e=x.experiments[0];
  e.status='measured';e.run={...goodRun,commit:'invalid'};
  e.metrics=[measured];assert.match(inspectRegistry(x).errors.join(' '),/pinned commit/);
  e.run=goodRun;assert.deepEqual(inspectRegistry(x).errors,[]);
});
test('independent claims need observer receipt',()=>{
  const x=clone(fixture),e=x.experiments[0];
  e.status='independently-reviewed';e.run=goodRun;e.metrics=[measured];
  assert.match(inspectRegistry(x).errors.join(' '),/independent-review/);
  e.review={raters:3,protocol:'blinded-pairwise-v1',evidence_url:'https://example.org/review'};
  const r=inspectRegistry(x);assert.deepEqual(r.errors,[]);
  assert.equal(summary(r).independently_reviewed,1);
});
test('nonfinite metric values are rejected for measured state',()=>{
  const x=clone(fixture),e=x.experiments[0];e.status='measured';e.run=goodRun;
  e.metrics=[{...measured,candidate:Infinity}];
  assert.match(inspectRegistry(x).errors.join(' '),/measured values/);
});
