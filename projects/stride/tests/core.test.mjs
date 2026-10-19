import test from 'node:test';import assert from 'node:assert/strict';import {parseGPX,parseTCX,parseFIT,analyze,haversine,shareSafe,planPrivateShare,loadActivity} from '../core.mjs';
const gpx=`<gpx><trk><trkseg><trkpt lat="59.35" lon="17.85"><ele>12</ele><time>2026-10-19T08:00:00Z</time></trkpt><trkpt lat="59.355" lon="17.85"><ele>20</ele><time>2026-10-19T08:03:00Z</time></trkpt><trkpt lat="59.36" lon="17.85"><ele>18</ele><time>2026-10-19T08:06:00Z</time></trkpt></trkseg></trk></gpx>`;
test('GPX route and metrics',()=>{const a=analyze(parseGPX(gpx));assert.equal(a.rows.length,3);assert.ok(a.distance>1000&&a.distance<1200);assert.equal(a.ascent,8);assert.equal(a.descent,2);assert.equal(a.duration,360);assert.equal(a.bins.length,1);assert.equal(a.fastest.km,1)});
test('TCX parsing and HR',()=>{const tcx=`<TrainingCenterDatabase><Activities><Activity><Lap><Track><Trackpoint><Time>2026-10-19T08:00:00Z</Time><Position><LatitudeDegrees>59.35</LatitudeDegrees><LongitudeDegrees>17.85</LongitudeDegrees></Position><HeartRateBpm><Value>150</Value></HeartRateBpm></Trackpoint><Trackpoint><Time>2026-10-19T08:02:00Z</Time><Position><LatitudeDegrees>59.355</LatitudeDegrees><LongitudeDegrees>17.85</LongitudeDegrees></Position><HeartRateBpm><Value>155</Value></HeartRateBpm></Trackpoint></Track></Lap></Activity></Activities></TrainingCenterDatabase>`;assert.equal(analyze(parseTCX(tcx)).avgHR,152.5)});
test('malformed input fails closed',()=>{assert.throws(()=>parseGPX('<gpx/>'),/No usable/);assert.throws(()=>loadActivity('evil.js',''),/Unsupported/);assert.throws(()=>parseFIT(new ArrayBuffer(10)),/too small/)});
test('share policy removes traveled endpoints and endpoint proximity zones',()=>{const arr=Array.from({length:30},(_,i)=>({lat:59+i*.001,lon:17,t:i*60,ele:12}));const plan=planPrivateShare(arr,700),safe=shareSafe(arr,700);assert.ok(plan.redactedPoints>0);assert.equal(safe.length,1);assert.ok(safe[0][0].lat>arr[0].lat);assert.ok(safe[0].at(-1).lat<arr.at(-1).lat);assert.equal(safe[0].length,plan.retainedPoints);});
test('return visits near the home coordinate are hidden, not reconnected',()=>{
 const meters=[0,250,500,750,1000,1250,1500,1700,1300,900,500,200,100,600,950,1250,1550,1850,2100,2300,1900,1300,700,0];
 const arr=meters.map((m,i)=>({lat:59+m/111200,lon:17,t:i*70,ele:10}));
 const plan=planPrivateShare(arr,700);
 assert.ok(plan.segments.length>=2,'a mid-route home return splits the export into separate drawn paths');
 const indices=plan.segments.flat();assert.ok(!indices.includes(10)&&!indices.includes(11)&&!indices.includes(12));
 for(const i of indices){assert.ok(haversine(arr[0],arr[i])>=700,'no visible point within start privacy zone');assert.ok(haversine(arr.at(-1),arr[i])>=700,'no visible point within finish privacy zone');}
 for(const segment of plan.segments){assert.ok(segment.length>=2);for(let i=1;i<segment.length;i++)assert.equal(segment[i],segment[i-1]+1,'no line may cross hidden points');}
 const safe=shareSafe(arr,700);assert.equal(safe.length,plan.segments.length);
});
test('closed local circuits fail closed and privacy trim cannot silently shrink',()=>{
 const points=Array.from({length:30},(_,i)=>({lat:59+0.003*Math.sin(i*Math.PI*2/29),lon:17+0.003*Math.cos(i*Math.PI*2/29),t:i*30,ele:12}));
 assert.equal(planPrivateShare(points,700).segments.length,0);
 assert.throws(()=>planPrivateShare(points,250),/at least 700/);
});
test('distance symmetry',()=>{const a={lat:0,lon:0},b={lat:0,lon:1};assert.equal(haversine(a,b),haversine(b,a));});
test('FIT record parsing',()=>{const out=new Uint8Array(14+6+12+6+12+2),dv=new DataView(out.buffer);out[0]=14;dv.setUint32(4,out.length-16,true);out.set([46,70,73,84],8);let i=14;const def=()=>{out.set([0x40,0,0,20,0,3,0,4,0x85,1,4,0x85,253,4,0x86],i);i+=15};const record=(lat,lon,t)=>{out[i++]=0;dv.setInt32(i,Math.round(lat*2147483648/180),true);i+=4;dv.setInt32(i,Math.round(lon*2147483648/180),true);i+=4;dv.setUint32(i,t,true);i+=4}; // fix fixture allocation based on exact structure
 const bytes=new Uint8Array(14+15+13*2+2);const d=new DataView(bytes.buffer);bytes[0]=14;d.setUint32(4,15+26,true);bytes.set([46,70,73,84],8);let j=14;bytes.set([0x40,0,0,20,0,3,0,4,0x85,1,4,0x85,253,4,0x86],j);j+=15;for(const [lat,lon,t] of [[59.35,17.85,1200000000],[59.36,17.85,1200000360]]){bytes[j++]=0;d.setInt32(j,Math.round(lat*2147483648/180),true);j+=4;d.setInt32(j,Math.round(lon*2147483648/180),true);j+=4;d.setUint32(j,t,true);j+=4;}const rows=parseFIT(bytes.buffer);assert.equal(rows.length,2);assert.ok(Math.abs(rows[0].lat-59.35)<.00001)});