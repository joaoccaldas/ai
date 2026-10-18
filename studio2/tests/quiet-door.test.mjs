import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quietDoorPhase,QUIET_TIMING} from '../quiet-door.js';
test('does not trigger before the one-minute arm gate',()=>{
 assert.equal(QUIET_TIMING.armMs,60000);
 assert.equal(quietDoorPhase({armed:false,idleVisibleMs:90000}).phase,'waiting');
});
test('requires ten seconds idle before a nonmodal countdown',()=>{
 assert.equal(quietDoorPhase({armed:true,idleVisibleMs:9999}).phase,'waiting');
 assert.deepEqual(quietDoorPhase({armed:true,idleVisibleMs:10000}),{phase:'countdown',seconds:5});
 assert.deepEqual(quietDoorPhase({armed:true,idleVisibleMs:12000}),{phase:'countdown',seconds:3});
 assert.equal(quietDoorPhase({armed:true,idleVisibleMs:14999}).seconds,1);
 assert.equal(quietDoorPhase({armed:true,idleVisibleMs:15000}).phase,'reveal');
});
test('busy app interactions and feature-disabled states prevent surprises',()=>{
 for(const flags of [{enabled:false},{busy:true}])
  assert.equal(quietDoorPhase({armed:true,idleVisibleMs:18000,...flags}).phase,'waiting');
});
test('resetting idle input cancels countdown',()=>{
 assert.equal(quietDoorPhase({armed:true,idleVisibleMs:0}).phase,'waiting');
});
