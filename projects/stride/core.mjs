// STRIDE core v0.1: deterministic, local-only activity parsing and analysis.
const R = 6371008.8, FIT_EPOCH = Date.UTC(1989,11,31)/1000;
const finite = Number.isFinite;
export const haversine=(a,b)=>{const q=Math.PI/180, dLat=(b.lat-a.lat)*q,dLon=(b.lon-a.lon)*q;
 const h=Math.sin(dLat/2)**2+Math.cos(a.lat*q)*Math.cos(b.lat*q)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));};
const content=(s,t)=>{const m=s.match(new RegExp('<(?:[\\w-]+:)?'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+t+'>','i'));return m?.[1]?.trim()??null};
const val=(s,t)=>{const v=content(s,t);return v==null?null:Number(v)};
const time=s=>{const n=Date.parse(s||'');return finite(n)?n/1000:null};
function normalize(rows){const out=[];for(const row of rows){const {lat,lon}=row;if(!finite(lat)||!finite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)continue;let t=finite(row.t)?row.t:null;const ele=finite(row.ele)?row.ele:null,hr=finite(row.hr)?row.hr:null;
 const next={lat,lon,t,ele,hr};if(out.length){const last=out[out.length-1];const d=haversine(last,next);if(d>5000)continue;if(last.t!==null&&t!==null&&t<last.t)continue;
 // reject impossible GPS jumps instead of showing an invented performance spike
 if(last.t!==null&&t!==null&&t>last.t&&d/(t-last.t)>65)continue;
 if(d<0.1&&t===last.t)continue;}out.push(next);if(out.length>75000)throw Error('Too many route points (limit 75,000).');}
 if(out.length<2)throw Error('No usable GPS route found (at least 2 valid points required).');return out;}
export function parseGPX(xml){const points=[];const re=/<(?:[\w-]+:)?(?:trkpt|rtept)\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/(?:[\w-]+:)?(?:trkpt|rtept)\s*>)/gi;let m;while((m=re.exec(xml))!==null){const lat=Number(m[1].match(/\blat\s*=\s*["']([^"']+)["']/i)?.[1]);const lon=Number(m[1].match(/\blon\s*=\s*["']([^"']+)["']/i)?.[1]);const body=m[2]||'';const t=time(content(body,'time'));points.push({lat,lon,t,ele:val(body,'ele'),hr:val(body,'hr')});}return normalize(points)}
export function parseTCX(xml){const points=[];const re=/<(?:[\w-]+:)?Trackpoint\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?Trackpoint>/gi;let m;while((m=re.exec(xml))!==null){const body=m[1];points.push({lat:val(body,'LatitudeDegrees'),lon:val(body,'LongitudeDegrees'),t:time(content(body,'Time')),ele:val(body,'AltitudeMeters'),hr:val(content(body,'HeartRateBpm')||'','Value')})}return normalize(points)}
function fitVal(dv,off,size,type,little){const id=type&0x1f;if(off+size>dv.byteLength)throw Error('FIT record truncated');const M={0:()=>dv.getUint8(off),1:()=>dv.getInt8(off),2:()=>dv.getUint8(off),10:()=>dv.getUint8(off),13:()=>dv.getUint8(off),3:()=>dv.getInt16(off,little),4:()=>dv.getUint16(off,little),5:()=>dv.getInt32(off,little),6:()=>dv.getUint32(off,little),8:()=>dv.getFloat32(off,little),9:()=>dv.getFloat64(off,little),11:()=>dv.getUint16(off,little),12:()=>dv.getUint32(off,little)};return M[id]&&size>=([3,4,11].includes(id)?2:[5,6,8,12].includes(id)?4:id===9?8:1)?M[id]():null;}
export function parseFIT(buf){const dv=new DataView(buf), len=dv.byteLength;if(len<14)throw Error('FIT file is too small');const head=dv.getUint8(0);if(![12,14].includes(head))throw Error('Invalid FIT header length');if(String.fromCharCode(...new Uint8Array(buf,8,4))!=='.FIT')throw Error('Not a FIT activity file');const end=head+dv.getUint32(4,true);if(end>len)throw Error('Truncated FIT data');let off=head,lastTimestamp=null;const defs=new Map(),points=[];
 while(off<end){const h=dv.getUint8(off++);const compressed=(h&0x80)!==0;const isDef=!compressed&&(h&0x40)!==0;const local=compressed?(h>>5)&3:h&15;
 if(isDef){if(off+5>end)throw Error('Invalid FIT definition');off++;const little=dv.getUint8(off++)===0;const global=dv.getUint16(off,little);off+=2;const n=dv.getUint8(off++),fields=[];if(n>120)throw Error('Invalid FIT field count');for(let i=0;i<n;i++){if(off+3>end)throw Error('FIT definitions truncated');fields.push([dv.getUint8(off++),dv.getUint8(off++),dv.getUint8(off++)]);}let dev=[];if(h&0x20){const ndev=dv.getUint8(off++);for(let i=0;i<ndev;i++){if(off+3>end)throw Error('FIT developer fields truncated');dev.push([dv.getUint8(off++),dv.getUint8(off++),dv.getUint8(off++)]);}}defs.set(local,{little,global,fields,dev});continue}
 const d=defs.get(local);if(!d)throw Error('FIT data without field definition');const values=new Map();for(const [id,size,type] of d.fields){if(off+size>end)throw Error('Truncated FIT record');values.set(id,fitVal(dv,off,size,type,d.little));off+=size;}for(const [,size] of d.dev){if(off+size>end)throw Error('FIT developer field truncated');off+=size;}
 if(d.global===20){let ts=values.get(253);if(compressed){const offset=h&31;const base=lastTimestamp??0;ts=(base&~31)+offset;if(ts<base)ts+=32;}if(finite(ts))lastTimestamp=ts;const lat=values.get(0),lon=values.get(1);if(finite(lat)&&finite(lon)&&lat!==2147483647&&lon!==2147483647){let a=values.get(2),enh=values.get(78);points.push({lat:lat*180/2147483648,lon:lon*180/2147483648,t:finite(ts)?ts+FIT_EPOCH:null,ele:finite(enh)?enh:finite(a)&&a!==65535?a/5-500:null,hr:values.get(3)})}}}
 return normalize(points)}
export function loadActivity(name,bytesOrText){const ext=name.split('.').pop()?.toLowerCase();if(ext==='fit')return parseFIT(bytesOrText);const text=String(bytesOrText);if(ext==='gpx'||/<(?:[\w-]+:)?gpx\b/i.test(text))return parseGPX(text);if(ext==='tcx'||/TrainingCenterDatabase/i.test(text))return parseTCX(text);throw Error('Unsupported format: select .gpx, .tcx or .fit');}
export function analyze(points){let distance=0,ascent=0,descent=0,minEle=Infinity,maxEle=-Infinity;const rows=[];for(let i=0;i<points.length;i++){const p=points[i];if(i){const prev=points[i-1],d=haversine(prev,p);distance+=d;if(finite(prev.ele)&&finite(p.ele)){const delta=p.ele-prev.ele;if(delta>0.75)ascent+=delta;if(delta<-.75)descent-=delta;}}
 if(finite(p.ele)){minEle=Math.min(minEle,p.ele);maxEle=Math.max(maxEle,p.ele);}rows.push({...p,d:distance});}
 const first=rows.find(x=>finite(x.t))?.t,last=[...rows].reverse().find(x=>finite(x.t))?.t;const duration=finite(first)&&finite(last)&&last>=first?last-first:null;
 const bins=[];if(duration!==null){for(let i=1;i<=Math.floor(distance/1000);i++){const at=i*1000;if(i*1000>distance)break;const interpolate=distance=>{let lo=0,hi=rows.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(rows[mid].d<distance)lo=mid;else hi=mid;}const a=rows[lo],b=rows[hi],f=(distance-a.d)/Math.max(1e-9,b.d-a.d);return {t:finite(a.t)&&finite(b.t)?a.t+(b.t-a.t)*f:null,ele:finite(a.ele)&&finite(b.ele)?a.ele+(b.ele-a.ele)*f:null}};
 const a=interpolate((i-1)*1000),b=interpolate(at);if(finite(a.t)&&finite(b.t)&&b.t>a.t){let gain=0;for(let k=1;k<rows.length;k++)if(rows[k].d>=(i-1)*1000&&rows[k].d<=at){const de=(rows[k].ele??0)-(rows[k-1].ele??0);if(finite(rows[k].ele)&&finite(rows[k-1].ele)&&de>0.75)gain+=de;}bins.push({km:i,seconds:b.t-a.t,ascent:gain,at})}}
 }
 const fastest=bins.length?bins.reduce((a,b)=>a.seconds<b.seconds?a:b):null,slowest=bins.length?bins.reduce((a,b)=>a.seconds>b.seconds?a:b):null,climb=bins.length?bins.reduce((a,b)=>a.ascent>b.ascent?a:b):null;
 const hr=rows.map(x=>x.hr).filter(x=>finite(x)&&x>25&&x<245);const avgHR=hr.length?hr.reduce((a,b)=>a+b,0)/hr.length:null;
 return {rows,distance,ascent,descent,minEle:finite(minEle)?minEle:null,maxEle:finite(maxEle)?maxEle:null,duration,fastest,slowest,climb,avgHR,bins};}
// Share projection policy: remove the first and last traveled 700 m AND all
// visits within 700 m of either endpoint. Return disjoint index ranges, never
// a flattened track that could reconnect across an intentionally hidden gap.
// Privacy trimming reduces exposure; it does not make a route anonymous.
export function planPrivateShare(points, trimMeters=700){
 if(!Number.isFinite(trimMeters)||trimMeters<700)throw Error('Privacy trim must be at least 700 meters.');
 const rows=analyze(points).rows,total=rows.at(-1).d;
 const start=rows[0],end=rows.at(-1);const segments=[];let segment=[],retained=0;
 for(let i=0;i<rows.length;i++){
  const p=rows[i];
  const visible=i>0&&i<rows.length-1&&p.d>=trimMeters&&total-p.d>=trimMeters
   &&haversine(start,p)>=trimMeters&&haversine(end,p)>=trimMeters;
  if(visible){segment.push(i);retained++;}
  else if(segment.length){if(segment.length>=2)segments.push(segment);segment=[];}
 }
 if(segment.length>=2)segments.push(segment);
 return {segments,totalMeters:total,redactedPoints:rows.length-retained,retainedPoints:retained,trimMeters};
}
export function shareSafe(points,trimMeters=700){
 const plan=planPrivateShare(points,trimMeters);
 return plan.segments.map(segment=>segment.map(i=>{const {lat,lon,t,ele,hr}=points[i];return {lat,lon,t,ele,hr};}));
}
export const fmtTime=s=>s==null?'—':Math.floor(s/3600)>0?`${Math.floor(s/3600)}h ${Math.round(s%3600/60)}m`:`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;