import assert from 'node:assert/strict';
import {estimateTempo,keyDistance,compatibility,buildPlans,encodeWav} from '../dsp.js';
const sr=8000,dur=20,s=new Float32Array(sr*dur);for(let t=0;t<dur;t+=.5){const start=Math.floor(t*sr);for(let i=0;i<80;i++)s[start+i]=1-i/80;}const tempo=estimateTempo(s,sr,70,170);assert.ok(tempo.bpm>=115&&tempo.bpm<=125,`tempo ${tempo.bpm}`);
assert.equal(keyDistance({root:0,mode:'major'},{root:9,mode:'minor'}),96);
const a={bpm:120,key:{root:0,mode:'major'},energy:.5,hook:20,duration:100},b={bpm:122,key:{root:7,mode:'major'},energy:.55,hook:25,duration:105};const c=compatibility(a,b);assert.ok(c.total>70);const p=buildPlans(a,b,121);assert.equal(p.length,3);assert.ok(p.every(x=>x.duration>0));const wav=encodeWav([new Float32Array(100),new Float32Array(100)],44100);assert.ok(wav.size>44);console.log('MashLab DSP tests PASS',tempo,c.total);
