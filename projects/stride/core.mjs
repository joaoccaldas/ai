// STRIDE core v0.2: deterministic, local-only activity parsing, FIT CRC-16, versioned contracts, and route comparison.
const R = 6371008.8, FIT_EPOCH = Date.UTC(1989,11,31)/1000;
const finite = Number.isFinite;
export const ALGORITHM_VERSION = 'stride-core-0.4.0';

export const haversine=(a,b)=>{const q=Math.PI/180, dLat=(b.lat-a.lat)*q,dLon=(b.lon-a.lon)*q;
 const h=Math.sin(dLat/2)**2+Math.cos(a.lat*q)*Math.cos(b.lat*q)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));};

const content=(s,t)=>{const m=s.match(new RegExp('<(?:[\\w-]+:)?'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+t+'>','i'));return m?.[1]?.trim()??null};
const val=(s,t)=>{const v=content(s,t);if(v==null||v==='')return null;const n=Number(v);return finite(n)?n:null};
const time=s=>{const n=Date.parse(s||'');return finite(n)?n/1000:null};

const FIT_CRC_TABLE = [
  0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
  0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
];
export function fitCRC16(bytes, start = 0, end = bytes.length) {
  let crc = 0;
  for (let i = start; i < end; i++) {
    const b = bytes[i];
    let tmp = FIT_CRC_TABLE[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ tmp ^ FIT_CRC_TABLE[b & 0xf];
    tmp = FIT_CRC_TABLE[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ tmp ^ FIT_CRC_TABLE[(b >> 4) & 0xf];
  }
  return crc & 0xffff;
}

function normalize(rows){
  const out=[];
  for(const row of rows){
    const {lat,lon}=row;
    if(!finite(lat)||!finite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)continue;
    let t=finite(row.t)?row.t:null;
    const ele=finite(row.ele)&&row.ele>-500&&row.ele<9500?row.ele:null;
    const hr=finite(row.hr)&&row.hr>=25&&row.hr<=245?row.hr:null;
    const cad=finite(row.cad)&&row.cad>=0&&row.cad<=300?row.cad:null;
    const pwr=finite(row.pwr)&&row.pwr>=0&&row.pwr<=3000?row.pwr:null;
    const next={lat,lon,t,ele,hr,cad,pwr};
    if(finite(row.lap)&&row.lap>=1)next.lap=Math.floor(row.lap);
    if(typeof row.sport==='string'&&row.sport)next.sport=row.sport.toLowerCase();
    if(out.length){
      const last=out[out.length-1];
      const d=haversine(last,next);
      if(d>5000)continue;
      if(last.t!==null&&t!==null&&t<last.t)continue;
      // reject impossible GPS jumps instead of showing an invented performance spike
      if(last.t!==null&&t!==null&&t>last.t&&d/(t-last.t)>65)continue;
      if(d<0.1&&t===last.t)continue;
    }
    out.push(next);
    if(out.length>75000)throw Error('Too many route points (limit 75,000).');
  }
  if(out.length<2)throw Error('No usable GPS route found (at least 2 valid points required).');
  return out;
}

export function parseGPX(xml){
  const points=[];
  const re=/<(?:[\w-]+:)?(?:trkpt|rtept)\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/(?:[\w-]+:)?(?:trkpt|rtept)\s*>)/gi;
  let m;
  while((m=re.exec(xml))!==null){
    const latStr=m[1].match(/\blat\s*=\s*["']([^"']+)["']/i)?.[1];
    const lonStr=m[1].match(/\blon\s*=\s*["']([^"']+)["']/i)?.[1];
    const lat=latStr!=null?Number(latStr):NaN;
    const lon=lonStr!=null?Number(lonStr):NaN;
    const body=m[2]||'';
    const t=time(content(body,'time'));
    const hr=val(body,'hr')??val(body,'heartrate')??val(body,'HeartRateBpm');
    const cad=val(body,'cad')??val(body,'cadence');
    const pwr=val(body,'power')??val(body,'watts');
    points.push({lat,lon,t,ele:val(body,'ele'),hr,cad,pwr});
  }
  return normalize(points);
}

export function parseTCX(xml){
  const points=[];
  const lapRe=/<(?:[\w-]+:)?Lap\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?Lap>/gi;
  const actSport=xml.match(/<(?:[\w-]+:)?Activity\b[^>]*\bSport\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase()||null;
  let lapMatch,lapIdx=0;
  while((lapMatch=lapRe.exec(xml))!==null){
    lapIdx++;
    const lapBody=lapMatch[2];
    const re=/<(?:[\w-]+:)?Trackpoint\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?Trackpoint>/gi;
    let m;
    while((m=re.exec(lapBody))!==null){
      const body=m[1];
      const hrBlock=content(body,'HeartRateBpm');
      const hr=hrBlock!=null?(val(hrBlock,'Value')??Number(hrBlock)):val(body,'HeartRateBpm');
      const cad=val(body,'Cadence')??val(body,'RunCadence');
      const pwr=val(body,'Watts');
      points.push({
        lat:val(body,'LatitudeDegrees'),
        lon:val(body,'LongitudeDegrees'),
        t:time(content(body,'Time')),
        ele:val(body,'AltitudeMeters'),
        hr:finite(hr)?hr:null,
        cad,
        pwr,
        lap:lapIdx,
        sport:actSport
      });
    }
  }
  if(!points.length){
    const re=/<(?:[\w-]+:)?Trackpoint\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?Trackpoint>/gi;
    let m;
    while((m=re.exec(xml))!==null){
      const body=m[1];
      const hrBlock=content(body,'HeartRateBpm');
      const hr=hrBlock!=null?(val(hrBlock,'Value')??Number(hrBlock)):val(body,'HeartRateBpm');
      const cad=val(body,'Cadence')??val(body,'RunCadence');
      const pwr=val(body,'Watts');
      points.push({
        lat:val(body,'LatitudeDegrees'),
        lon:val(body,'LongitudeDegrees'),
        t:time(content(body,'Time')),
        ele:val(body,'AltitudeMeters'),
        hr:finite(hr)?hr:null,
        cad,
        pwr,
        lap:1,
        sport:actSport
      });
    }
  }
  return normalize(points);
}

// FIT base type invalid sentinels per Garmin FIT protocol
const FIT_INVALID = {
  0: 0xff,
  1: 0x7f,
  2: 0xff,
  3: 0x7fff,
  4: 0xffff,
  5: 0x7fffffff,
  6: 0xffffffff,
  10: 0x00,
  11: 0x0000,
  12: 0x00000000,
  13: 0xff,
};

function fitVal(dv,off,size,type,little){
  const id=type&0x1f;
  if(off+size>dv.byteLength)throw Error('FIT record truncated');
  const M={
    0:()=>dv.getUint8(off),
    1:()=>dv.getInt8(off),
    2:()=>dv.getUint8(off),
    10:()=>dv.getUint8(off),
    13:()=>dv.getUint8(off),
    3:()=>dv.getInt16(off,little),
    4:()=>dv.getUint16(off,little),
    5:()=>dv.getInt32(off,little),
    6:()=>dv.getUint32(off,little),
    8:()=>dv.getFloat32(off,little),
    9:()=>dv.getFloat64(off,little),
    11:()=>dv.getUint16(off,little),
    12:()=>dv.getUint32(off,little)
  };
  const minSize=[3,4,11].includes(id)?2:[5,6,8,12].includes(id)?4:id===9?8:1;
  if(!M[id]||size<minSize)return null;
  const raw=M[id]();
  if(!finite(raw))return null;
  if(id in FIT_INVALID && raw===FIT_INVALID[id])return null;
  return raw;
}

export function parseFIT(buf){
  const u8=buf instanceof Uint8Array?buf:new Uint8Array(buf);
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  const len=dv.byteLength;
  if(len<14)throw Error('FIT file is too small');
  const head=dv.getUint8(0);
  if(![12,14].includes(head))throw Error('Invalid FIT header length');
  if(String.fromCharCode(...u8.subarray(8,12))!=='.FIT')throw Error('Not a FIT activity file');
  const dataSize=dv.getUint32(4,true);
  const end=head+dataSize;
  if(end>len)throw Error('Truncated FIT data');
  if(head===14){
    const headerCrc=dv.getUint16(12,true);
    if(headerCrc!==0 && fitCRC16(u8,0,12)!==headerCrc)throw Error('FIT header CRC mismatch');
  }
  if(end+2<=len){
    const fileCrc=dv.getUint16(end,true);
    if(fileCrc!==0 && fitCRC16(u8,0,end)!==fileCrc)throw Error('FIT file CRC mismatch');
  }
  let off=head,lastTimestamp=null,currentLap=1,currentSport=null;
  const FIT_SPORTS={0:'generic',1:'running',2:'cycling',5:'swimming',15:'transition'};
  const defs=new Map(),points=[];
  while(off<end){
    const h=dv.getUint8(off++);
    const compressed=(h&0x80)!==0;
    const isDef=!compressed&&(h&0x40)!==0;
    const local=compressed?(h>>5)&3:h&15;
    if(isDef){
      if(off+5>end)throw Error('Invalid FIT definition');
      off++;
      const little=dv.getUint8(off++)===0;
      const global=dv.getUint16(off,little);
      off+=2;
      const n=dv.getUint8(off++),fields=[];
      if(n>120)throw Error('Invalid FIT field count');
      for(let i=0;i<n;i++){
        if(off+3>end)throw Error('FIT definitions truncated');
        fields.push([dv.getUint8(off++),dv.getUint8(off++),dv.getUint8(off++)]);
      }
      let dev=[];
      if(h&0x20){
        if(off>=end)throw Error('FIT developer fields truncated');
        const ndev=dv.getUint8(off++);
        for(let i=0;i<ndev;i++){
          if(off+3>end)throw Error('FIT developer fields truncated');
          dev.push([dv.getUint8(off++),dv.getUint8(off++),dv.getUint8(off++)]);
        }
      }
      defs.set(local,{little,global,fields,dev});
      continue;
    }
    const d=defs.get(local);
    if(!d)throw Error('FIT data without field definition');
    const values=new Map();
    for(const [id,size,type] of d.fields){
      if(off+size>end)throw Error('Truncated FIT record');
      values.set(id,fitVal(dv,off,size,type,d.little));
      off+=size;
    }
    for(const [,size] of d.dev){
      if(off+size>end)throw Error('FIT developer field truncated');
      off+=size;
    }
    if(d.global===19 || d.global===18){
      const sp=values.get(25);
      if(finite(sp)&&FIT_SPORTS[sp])currentSport=FIT_SPORTS[sp];
      if(d.global===19 && points.length)currentLap++;
    }
    if(d.global===20){
      let ts=values.get(253);
      if(compressed){
        const offset=h&31;
        const base=lastTimestamp??0;
        ts=(base&~31)+offset;
        if(ts<base)ts+=32;
      }
      if(finite(ts))lastTimestamp=ts;
      const lat=values.get(0),lon=values.get(1);
      if(finite(lat)&&finite(lon)){
        const a=values.get(2),enh=values.get(78);
        const ele=finite(enh)?enh/5-500:finite(a)?a/5-500:null;
        points.push({
          lat:lat*180/2147483648,
          lon:lon*180/2147483648,
          t:finite(ts)?ts+FIT_EPOCH:null,
          ele,
          hr:values.get(3)??null,
          cad:values.get(4)??null,
          pwr:values.get(7)??null,
          lap:currentLap,
          sport:currentSport
        });
      }
    }
  }
  return normalize(points);
}

export function parseStoryBundle(text){
  const obj=typeof text==='string'?JSON.parse(text):text;
  if(!obj||obj.schema!=='stride.story-bundle.v1'||!Array.isArray(obj.safeSegments))throw Error('Invalid .stride.json story bundle schema');
  const flat=obj.safeSegments.flat();
  const points=normalize(flat);
  return {
    points,
    title:obj.activity?.title||'Redacted Story Bundle',
    worldPreset:obj.worldPreset||'volcanic',
    equipmentRef:obj.equipmentRef||obj.activity?.equipmentRef||null,
    privacy:obj.privacy||null
  };
}

export function loadActivity(name,bytesOrText){
  const lower=String(name||'').toLowerCase();
  const ext=lower.split('.').pop();
  if(ext==='fit')return parseFIT(bytesOrText);
  const text=String(bytesOrText);
  if(lower.endsWith('.stride.json')||ext==='json'||text.trim().startsWith('{'))return parseStoryBundle(text).points;
  if(ext==='gpx'||/<(?:[\w-]+:)?gpx\b/i.test(text))return parseGPX(text);
  if(ext==='tcx'||/TrainingCenterDatabase/i.test(text))return parseTCX(text);
  throw Error('Unsupported format: select .gpx, .tcx, .fit, or .stride.json');
}

export function analyze(points){
  let distance=0,ascent=0,descent=0,minEle=Infinity,maxEle=-Infinity,pausedSeconds=0,movingSeconds=0;
  const rows=[],stops=[];
  for(let i=0;i<points.length;i++){
    const p=points[i];
    if(i){
      const prev=points[i-1],d=haversine(prev,p);
      distance+=d;
      if(finite(prev.ele)&&finite(p.ele)){
        const delta=p.ele-prev.ele;
        if(delta>0.75)ascent+=delta;
        if(delta<-0.75)descent-=delta;
      }
      if(finite(prev.t)&&finite(p.t)&&p.t>prev.t){
        const dt=p.t-prev.t;
        if(dt>30 && d/dt<0.35){
          pausedSeconds+=dt;
          if(dt>=120){
            stops.push({index:i,lat:p.lat,lon:p.lon,at:distance,durationSeconds:dt,radiusMeters:500});
          }
        }
        else movingSeconds+=dt;
      }
    }
    if(finite(p.ele)){minEle=Math.min(minEle,p.ele);maxEle=Math.max(maxEle,p.ele);}
    rows.push({...p,d:distance});
  }
  const first=rows.find(x=>finite(x.t))?.t,last=[...rows].reverse().find(x=>finite(x.t))?.t;
  const duration=finite(first)&&finite(last)&&last>=first?last-first:null;
  const bins=[];
  if(duration!==null){
    const interpolate=targetDist=>{
      let lo=0,hi=rows.length-1;
      while(lo+1<hi){const mid=(lo+hi)>>1;if(rows[mid].d<targetDist)lo=mid;else hi=mid;}
      const a=rows[lo],b=rows[hi],f=(targetDist-a.d)/Math.max(1e-9,b.d-a.d);
      return {
        t:finite(a.t)&&finite(b.t)?a.t+(b.t-a.t)*f:null,
        ele:finite(a.ele)&&finite(b.ele)?a.ele+(b.ele-a.ele)*f:null
      };
    };
    for(let i=1;i<=Math.floor(distance/1000);i++){
      const startDist=(i-1)*1000,endDist=i*1000;
      if(endDist>distance)break;
      const a=interpolate(startDist),b=interpolate(endDist);
      if(finite(a.t)&&finite(b.t)&&b.t>a.t){
        let gain=0,loss=0;
        const hrSamples=[];
        for(let k=1;k<rows.length;k++){
          if(rows[k].d>=startDist&&rows[k].d<=endDist){
            if(finite(rows[k].ele)&&finite(rows[k-1].ele)){
              const de=rows[k].ele-rows[k-1].ele;
              if(de>0.75)gain+=de;
              if(de<-0.75)loss-=de;
            }
            if(finite(rows[k].hr)&&rows[k].hr>25&&rows[k].hr<245)hrSamples.push(rows[k].hr);
          }
        }
        const splitHR=hrSamples.length?hrSamples.reduce((s,v)=>s+v,0)/hrSamples.length:null;
        bins.push({km:i,startDistance:startDist,at:endDist,seconds:b.t-a.t,ascent:gain,descent:loss,avgHR:splitHR});
      }
    }
  }
  const fastest=bins.length?bins.reduce((a,b)=>a.seconds<b.seconds?a:b):null;
  const slowest=bins.length?bins.reduce((a,b)=>a.seconds>b.seconds?a:b):null;
  const climb=bins.length?bins.reduce((a,b)=>a.ascent>b.ascent?a:b):null;
  const hr=rows.map(x=>x.hr).filter(x=>finite(x)&&x>25&&x<245);
  const avgHR=hr.length?hr.reduce((a,b)=>a+b,0)/hr.length:null;
  const maxHR=hr.length?Math.max(...hr):null;
  const pwr=rows.map(x=>x.pwr).filter(x=>finite(x)&&x>=0&&x<=3000);
  const avgPower=pwr.length?pwr.reduce((a,b)=>a+b,0)/pwr.length:null;
  const lapTransitions=[];
  let prevLap=rows[0]?.lap??1,prevSport=rows[0]?.sport??null,lapStartDist=0,lapStartTime=rows[0]?.t??null;
  for(let i=1;i<rows.length;i++){
    const r=rows[i];
    const curLap=r.lap??prevLap,curSport=r.sport??prevSport;
    if(curLap!==prevLap || (curSport&&prevSport&&curSport!==prevSport)){
      lapTransitions.push({
        lapIndex:curLap,
        fromLap:prevLap,
        fromSport:prevSport,
        toSport:curSport,
        startDistance:lapStartDist,
        at:r.d,
        distanceMeters:r.d-lapStartDist,
        seconds:finite(r.t)&&finite(lapStartTime)&&r.t>=lapStartTime?r.t-lapStartTime:null
      });
      prevLap=curLap;
      prevSport=curSport;
      lapStartDist=r.d;
      lapStartTime=r.t;
    }
  }
  return {
    rows,
    distance,
    ascent,
    descent,
    minEle:finite(minEle)?minEle:null,
    maxEle:finite(maxEle)?maxEle:null,
    duration,
    movingDuration:duration!==null?movingSeconds:null,
    pausedDuration:duration!==null?pausedSeconds:null,
    fastest,
    slowest,
    climb,
    avgHR,
    maxHR,
    avgPower,
    bins,
    lapTransitions,
    stops,
    algorithmVersion:ALGORITHM_VERSION
  };
}

// Versioned ActivitySpec & MomentSpec DTOs (P1 cross-project reuse contract)
export function toActivitySpec(points, meta = {}) {
  const model = analyze(points);
  const sourceFormat = String(meta.fileName || 'sample.gpx').split('.').pop()?.toLowerCase() || 'unknown';
  const sourceClass = meta.isDemo ? 'synthetic_sample' : (meta.sourceClass || 'direct_file');
  return {
    schema: 'stride.activity.v1',
    algorithmVersion: ALGORITHM_VERSION,
    id: meta.id || `local-${model.rows.length}-${Math.round(model.distance)}`,
    title: meta.title || meta.fileName || 'Untitled activity',
    sourceClass,
    sourceFormat,
    equipmentRef: meta.equipmentRef || null,
    rightsNotice: sourceClass === 'synthetic_sample'
      ? 'Fictional procedural sample route; no personal data.'
      : 'Local user-supplied file; processed in memory; Strava API not used.',
    summary: {
      pointCount: model.rows.length,
      distanceMeters: Math.round(model.distance * 100) / 100,
      durationSeconds: model.duration,
      movingDurationSeconds: model.movingDuration,
      pausedDurationSeconds: model.pausedDuration,
      ascentMeters: model.minEle === null ? null : Math.round(model.ascent * 10) / 10,
      descentMeters: model.minEle === null ? null : Math.round(model.descent * 10) / 10,
      minElevationMeters: model.minEle,
      maxElevationMeters: model.maxEle,
      avgHeartRateBpm: model.avgHR === null ? null : Math.round(model.avgHR * 10) / 10,
      maxHeartRateBpm: model.maxHR,
      avgPowerWatts: model.avgPower === null ? null : Math.round(model.avgPower * 10) / 10,
      lapTransitionCount: model.lapTransitions.length,
    },
    missingness: {
      timestamps: model.duration === null,
      elevation: model.minEle === null,
      heartRate: model.avgHR === null,
      power: model.avgPower === null,
    },
  };
}

export function toMomentSpecs(points, meta = {}) {
  const model = analyze(points);
  const activityId = meta.id || `local-${model.rows.length}-${Math.round(model.distance)}`;
  const moments = [];
  if (model.fastest) {
    moments.push({
      schema: 'stride.moment.v1',
      id: `${activityId}:fastest-km-${model.fastest.km}`,
      activityRef: activityId,
      kind: 'fastest_kilometer',
      label: 'FASTEST KILOMETER',
      km: model.fastest.km,
      startDistanceMeters: model.fastest.startDistance,
      endDistanceMeters: model.fastest.at,
      metric: 'split_duration_s',
      value: Math.round(model.fastest.seconds * 100) / 100,
      formattedValue: fmtTime(model.fastest.seconds),
      units: 's',
      ascentMeters: Math.round(model.fastest.ascent * 10) / 10,
      avgHeartRateBpm: model.fastest.avgHR === null ? null : Math.round(model.fastest.avgHR),
      algorithmVersion: ALGORITHM_VERSION,
      provenance: 'measured_gps_and_timestamp_interpolation',
      complete: true,
    });
  }
  if (model.climb && model.climb.ascent > 0) {
    moments.push({
      schema: 'stride.moment.v1',
      id: `${activityId}:steepest-km-${model.climb.km}`,
      activityRef: activityId,
      kind: 'steepest_kilometer_gain',
      label: 'STEEPEST 1 KM GAIN',
      km: model.climb.km,
      startDistanceMeters: model.climb.startDistance,
      endDistanceMeters: model.climb.at,
      metric: 'elevation_gain_m',
      value: Math.round(model.climb.ascent * 10) / 10,
      formattedValue: `+${Math.round(model.climb.ascent)} m`,
      units: 'm',
      splitDurationSeconds: Math.round(model.climb.seconds * 100) / 100,
      algorithmVersion: ALGORITHM_VERSION,
      provenance: 'estimated_from_recorded_elevation_with_0.75m_hysteresis',
      complete: model.minEle !== null,
    });
  }
  if (model.slowest && model.slowest.km !== model.fastest?.km) {
    moments.push({
      schema: 'stride.moment.v1',
      id: `${activityId}:slowest-km-${model.slowest.km}`,
      activityRef: activityId,
      kind: 'slowest_kilometer',
      label: 'SLOWEST KILOMETER',
      km: model.slowest.km,
      startDistanceMeters: model.slowest.startDistance,
      endDistanceMeters: model.slowest.at,
      metric: 'split_duration_s',
      value: Math.round(model.slowest.seconds * 100) / 100,
      formattedValue: fmtTime(model.slowest.seconds),
      units: 's',
      ascentMeters: Math.round(model.slowest.ascent * 10) / 10,
      algorithmVersion: ALGORITHM_VERSION,
      provenance: 'measured_gps_and_timestamp_interpolation',
      complete: true,
    });
  }
  for (const tr of model.lapTransitions) {
    const sportChange = tr.fromSport && tr.toSport && tr.fromSport !== tr.toSport
      ? `${tr.fromSport.toUpperCase()} → ${tr.toSport.toUpperCase()}`
      : `LAP ${tr.fromLap} → ${tr.lapIndex}`;
    moments.push({
      schema: 'stride.moment.v1',
      id: `${activityId}:lap-transition-${tr.lapIndex}`,
      activityRef: activityId,
      kind: 'lap_transition',
      label: `TRANSITION · ${sportChange}`,
      km: Math.max(1, Math.round((tr.at / 1000) * 10) / 10),
      startDistanceMeters: Math.round(tr.startDistance * 10) / 10,
      endDistanceMeters: Math.round(tr.at * 10) / 10,
      metric: tr.seconds !== null ? 'lap_duration_s' : 'lap_distance_m',
      value: tr.seconds !== null ? Math.round(tr.seconds * 100) / 100 : Math.round(tr.distanceMeters * 10) / 10,
      formattedValue: tr.seconds !== null ? fmtTime(tr.seconds) : `${(tr.distanceMeters / 1000).toFixed(2)} km`,
      units: tr.seconds !== null ? 's' : 'm',
      fromSport: tr.fromSport,
      toSport: tr.toSport,
      algorithmVersion: ALGORITHM_VERSION,
      provenance: 'device_lap_or_multisport_boundary',
      complete: true,
    });
  }
  return moments;
}

// Causal Moment Diagnosis Engine: answers "Where were the decisive moments of my effort and WHY did I gain or lose time there?"
export function diagnoseMoments(points, ghostPoints = null) {
  const model = analyze(points);
  const totalDist = Math.max(1, model.distance);
  const avgSpeedKmh = model.duration && model.duration > 0 ? (model.distance / model.duration) * 3.6 : null;
  const avgHR = model.avgHR;
  const comp = Array.isArray(ghostPoints) && ghostPoints.length >= 2 ? compareActivities(points, ghostPoints) : null;

  const describeSplitWhy = (bin, role) => {
    if (!bin) return null;
    const speedKmh = bin.seconds > 0 ? (1000 / bin.seconds) * 3.6 : null;
    const speedDeltaPct = speedKmh !== null && avgSpeedKmh ? Math.round(((speedKmh - avgSpeedKmh) / avgSpeedKmh) * 100) : null;
    const netGradePct = Math.round(((bin.ascent - (bin.descent || 0)) / 1000) * 1000) / 10;
    const climbGradePct = Math.round((bin.ascent / 1000) * 1000) / 10;
    const hrDelta = bin.avgHR !== null && avgHR !== null ? Math.round(bin.avgHR - avgHR) : null;
    const parts = [];
    if (speedKmh !== null) {
      parts.push(`${speedKmh.toFixed(1)} km/h${speedDeltaPct !== null ? ` (${speedDeltaPct >= 0 ? '+' : ''}${speedDeltaPct}% vs avg)` : ''}`);
    }
    if (role === 'climb' || bin.ascent >= 15) {
      parts.push(`+${Math.round(bin.ascent)} m gain (+${climbGradePct}% climb grade)`);
    } else if (bin.descent >= 12) {
      parts.push(`−${Math.round(bin.descent)} m descent (${netGradePct}% net grade)`);
    } else {
      parts.push(`flat/rolling corridor (${netGradePct >= 0 ? '+' : ''}${netGradePct}% net)`);
    }
    if (bin.avgHR !== null) {
      parts.push(`${Math.round(bin.avgHR)} bpm${hrDelta !== null ? ` (${hrDelta >= 0 ? '+' : ''}${hrDelta} bpm vs avg)` : ''}`);
    }
    const splitComp = comp?.splitComparisons?.find(s => s.km === bin.km);
    if (splitComp) {
      const gSign = splitComp.deltaSeconds > 0 ? `gained ${Math.round(splitComp.deltaSeconds)}s on Ghost` : `lost ${Math.abs(Math.round(splitComp.deltaSeconds))}s to Ghost`;
      parts.push(gSign);
    }
    return {
      km: bin.km,
      startDistance: bin.startDistance,
      endDistance: bin.at,
      startProgress: bin.startDistance / totalDist,
      endProgress: bin.at / totalDist,
      focusProgress: ((bin.startDistance + bin.at) * 0.5) / totalDist,
      speedKmh: speedKmh !== null ? Math.round(speedKmh * 10) / 10 : null,
      speedDeltaPct,
      climbGradePct,
      avgHR: bin.avgHR !== null ? Math.round(bin.avgHR) : null,
      why: `Km ${bin.km} · ` + parts.join(' · '),
    };
  };

  const fastestDiag = describeSplitWhy(model.fastest, 'fastest');
  const climbDiag = model.climb && model.climb.ascent > 0 ? describeSplitWhy(model.climb, 'climb') : null;
  const slowestDiag = model.slowest && model.slowest.km !== model.fastest?.km ? describeSplitWhy(model.slowest, 'slowest') : null;

  let ghostSwingDiag = null;
  if (comp && comp.splitComparisons.length) {
    const swing = comp.splitComparisons.reduce((best, cur) =>
      Math.abs(cur.deltaSeconds) > Math.abs(best.deltaSeconds) ? cur : best
    );
    const bin = model.bins.find(b => b.km === swing.km);
    const base = bin ? describeSplitWhy(bin, 'ghost') : null;
    const youFaster = swing.deltaSeconds > 0;
    ghostSwingDiag = {
      km: swing.km,
      deltaSeconds: swing.deltaSeconds,
      startProgress: ((swing.km - 1) * 1000) / totalDist,
      endProgress: (swing.km * 1000) / totalDist,
      focusProgress: ((swing.km - 0.5) * 1000) / totalDist,
      why: `Km ${swing.km} · Decisive Ghost swing (${youFaster ? 'you gained' : 'you lost'} ${Math.abs(Math.round(swing.deltaSeconds))}s)${base ? ' — ' + base.why.replace(/^Km \d+ · /, '') : ''}`,
    };
  }

  // Overall Ride Thesis (1-sentence answer to "What happened on this effort?")
  let thesis = `Covered ${(model.distance / 1000).toFixed(1)} km`;
  if (avgSpeedKmh !== null) thesis += ` at ${avgSpeedKmh.toFixed(1)} km/h avg`;
  if (fastestDiag) thesis += `; peaked in Km ${fastestDiag.km} (${fastestDiag.speedKmh} km/h)`;
  if (climbDiag) thesis += ` and crested the steepest ramp in Km ${climbDiag.km} (+${Math.round(model.climb.ascent)} m, +${climbDiag.climbGradePct}% grade)`;
  if (comp && comp.totalDurationDeltaSeconds !== null) {
    const d = Math.round(comp.totalDurationDeltaSeconds);
    thesis += d > 0 ? ` — finishing ${fmtTime(d)} ahead of Ghost.` : ` — finishing ${fmtTime(Math.abs(d))} behind Ghost.`;
  } else {
    thesis += '.';
  }

  return {
    schema: 'stride.diagnosis.v1',
    thesis,
    avgSpeedKmh: avgSpeedKmh !== null ? Math.round(avgSpeedKmh * 10) / 10 : null,
    fastest: fastestDiag,
    climb: climbDiag,
    slowest: slowestDiag,
    ghostSwing: ghostSwingDiag,
  };
}

// Match self-owned local photos to route coordinates in memory (zero network upload)
export function matchLocalPhotosToRoute(points, photoDescriptors = [], fallbackProgress = 0.5) {
  const model = analyze(points);
  const rows = model.rows;
  const total = Math.max(1, model.distance);
  const tStart = rows.find(r => finite(r.t))?.t ?? null;
  const tEnd = [...rows].reverse().find(r => finite(r.t))?.t ?? null;

  const interpolateAtDist = targetD => {
    let lo = 0, hi = rows.length - 1;
    while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (rows[mid].d < targetD) lo = mid; else hi = mid; }
    const a = rows[lo], b = rows[hi];
    const f = Math.max(0, Math.min(1, (targetD - a.d) / Math.max(1e-9, b.d - a.d)));
    return {
      lat: a.lat + (b.lat - a.lat) * f,
      lon: a.lon + (b.lon - a.lon) * f,
      ele: finite(a.ele) && finite(b.ele) ? a.ele + (b.ele - a.ele) * f : (a.ele ?? b.ele ?? null),
      t: finite(a.t) && finite(b.t) ? a.t + (b.t - a.t) * f : null,
      d: targetD,
      progress: targetD / total,
    };
  };

  return photoDescriptors.map((photo, idx) => {
    const tsSec = finite(photo.timestampMs) ? photo.timestampMs / 1000 : (finite(photo.timestampSeconds) ? photo.timestampSeconds : null);
    let matchedBy = 'playhead_position';
    let targetDist = Math.max(0, Math.min(1, finite(photo.progress) ? photo.progress : fallbackProgress)) * total;

    if (finite(tsSec) && finite(tStart) && finite(tEnd) && tsSec >= tStart - 60 && tsSec <= tEnd + 60) {
      matchedBy = 'timestamp_interpolation';
      let lo = 0, hi = rows.length - 1;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if ((rows[mid].t ?? tStart) < tsSec) lo = mid; else hi = mid;
      }
      const a = rows[lo], b = rows[hi];
      const dt = Math.max(1e-9, (b.t ?? tsSec) - (a.t ?? tsSec));
      const f = Math.max(0, Math.min(1, (tsSec - (a.t ?? tsSec)) / dt));
      targetDist = a.d + (b.d - a.d) * f;
    }

    const pos = interpolateAtDist(targetDist);
    return {
      schema: 'stride.photo-pin.v1',
      id: `photo-${idx + 1}`,
      name: String(photo.name || `Photo ${idx + 1}`),
      matchedBy,
      distanceMeters: Math.round(pos.d * 10) / 10,
      progress: Math.round(pos.progress * 10000) / 10000,
      elevationMeters: pos.ele === null ? null : Math.round(pos.ele * 10) / 10,
      localOnly: true,
    };
  });
}

// Build a portable, privacy-redacted Story Card & Scene Spec bundle (.stride.json)
export function toPortableStoryBundle(points, meta = {}) {
  const trimMeters = finite(meta.trimMeters) && meta.trimMeters >= 700 ? meta.trimMeters : 700;
  const extraZones = Array.isArray(meta.extraZones) ? meta.extraZones : [];
  const plan = planPrivateShare(points, trimMeters, extraZones);
  const safeSegments = shareSafe(points, trimMeters, extraZones);
  const spec = toActivitySpec(points, meta);
  const moments = toMomentSpecs(points, { id: spec.id });
  return {
    schema: 'stride.story-bundle.v1',
    exportedAtUtc: new Date().toISOString(),
    algorithmVersion: ALGORITHM_VERSION,
    worldPreset: meta.theme || 'volcanic',
    equipmentRef: meta.equipmentRef || null,
    privacy: {
      trimMeters,
      customRedactionZones: extraZones.length,
      retainedPoints: plan.retainedPoints,
      redactedPoints: plan.redactedPoints,
      segmentCount: safeSegments.length,
      notice: 'First/last 700m, endpoint return visits, and pinned redaction zones omitted. Route coordinates inside safe segments remain visible.',
    },
    activity: spec,
    moments,
    safeSegments,
  };
}

// Deterministic course comparison (Ghost / Compare mode over same or overlapping route)
export function compareActivities(primaryPoints, challengerPoints) {
  const a = analyze(primaryPoints);
  const b = analyze(challengerPoints);
  const startOffsetMeters = haversine(a.rows[0], b.rows[0]);
  const endOffsetMeters = haversine(a.rows.at(-1), b.rows.at(-1));
  const sharedDistanceMeters = Math.min(a.distance, b.distance);
  // Check spatial corridor overlap at 10 sample fractions along shared distance
  const sampleFractions = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const samplePointAt = (rows, targetD) => {
    let lo = 0, hi = rows.length - 1;
    while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (rows[mid].d < targetD) lo = mid; else hi = mid; }
    const p0 = rows[lo], p1 = rows[hi];
    const f = (targetD - p0.d) / Math.max(1e-9, p1.d - p0.d);
    return {
      lat: p0.lat + (p1.lat - p0.lat) * f,
      lon: p0.lon + (p1.lon - p0.lon) * f,
      t: finite(p0.t) && finite(p1.t) ? p0.t + (p1.t - p0.t) * f : null,
      ele: finite(p0.ele) && finite(p1.ele) ? p0.ele + (p1.ele - p0.ele) * f : null,
    };
  };
  let maxDeviationMeters = 0;
  for (const frac of sampleFractions) {
    const d = frac * sharedDistanceMeters;
    const pa = samplePointAt(a.rows, d);
    const pb = samplePointAt(b.rows, d);
    const dev = haversine(pa, pb);
    if (dev > maxDeviationMeters) maxDeviationMeters = dev;
  }
  const comparableCourse = startOffsetMeters <= 400 && maxDeviationMeters <= 500 && sharedDistanceMeters >= 500;
  const splitComparisons = [];
  const commonKm = Math.min(a.bins.length, b.bins.length);
  let cumulativeDeltaSeconds = 0;
  for (let i = 0; i < commonKm; i++) {
    const ba = a.bins[i], bb = b.bins[i];
    const deltaSeconds = bb.seconds - ba.seconds; // negative means challenger is faster
    cumulativeDeltaSeconds += deltaSeconds;
    splitComparisons.push({
      km: i + 1,
      primarySeconds: ba.seconds,
      challengerSeconds: bb.seconds,
      deltaSeconds,
      cumulativeDeltaSeconds,
    });
  }
  return {
    schema: 'stride.comparison.v1',
    algorithmVersion: ALGORITHM_VERSION,
    comparableCourse,
    reason: comparableCourse
      ? 'Routes share start corridor and spatial alignment within 500 m.'
      : `Routes diverge (start offset ${Math.round(startOffsetMeters)} m, max corridor deviation ${Math.round(maxDeviationMeters)} m). Distance-indexed comparison is approximate.`,
    sharedDistanceMeters,
    startOffsetMeters,
    endOffsetMeters,
    maxDeviationMeters,
    totalDurationDeltaSeconds: a.duration !== null && b.duration !== null ? b.duration - a.duration : null,
    splitComparisons,
    samplePointAt: (rows, d) => samplePointAt(rows, d),
  };
}

// Deterministic 2D elevation, heart-rate, and split profile series for interactive timeline scrubbing
export function buildElevationProfile(points, sampleCount = 120) {
  const model = analyze(points);
  const n = Math.max(16, Math.min(500, Math.floor(sampleCount)));
  const total = model.distance;
  const rows = model.rows;
  const minEle = model.minEle ?? 0;
  const maxEle = model.maxEle ?? minEle;
  const spanEle = Math.max(1, maxEle - minEle);

  const sampleAt = targetD => {
    let lo = 0, hi = rows.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (rows[mid].d < targetD) lo = mid; else hi = mid;
    }
    const a = rows[lo], b = rows[hi];
    const dt = b.t != null && a.t != null ? b.t - a.t : 0;
    const dd = Math.max(1e-9, b.d - a.d);
    const f = Math.max(0, Math.min(1, (targetD - a.d) / dd));
    const ele = finite(a.ele) && finite(b.ele) ? a.ele + (b.ele - a.ele) * f : (finite(a.ele) ? a.ele : b.ele);
    const hr = finite(a.hr) && finite(b.hr) ? a.hr + (b.hr - a.hr) * f : (finite(a.hr) ? a.hr : b.hr);
    const gradePct = finite(a.ele) && finite(b.ele) && dd > 1 ? ((b.ele - a.ele) / dd) * 100 : null;
    const speedKmh = dt > 0 ? (dd / dt) * 3.6 : null;
    return {
      progress: total > 0 ? targetD / total : 0,
      distanceMeters: targetD,
      elevationMeters: finite(ele) ? Math.round(ele * 10) / 10 : null,
      normalizedElevation: finite(ele) ? (ele - minEle) / spanEle : null,
      heartRateBpm: finite(hr) ? Math.round(hr) : null,
      gradePct: finite(gradePct) ? Math.round(gradePct * 10) / 10 : null,
      speedKmh: finite(speedKmh) ? Math.round(speedKmh * 10) / 10 : null,
    };
  };

  const samples = [];
  for (let i = 0; i < n; i++) {
    const frac = i / (n - 1);
    samples.push(sampleAt(frac * total));
  }

  const splitMarkers = model.bins.map(b => ({
    km: b.km,
    distanceMeters: b.at,
    progress: total > 0 ? b.at / total : 0,
    seconds: b.seconds,
    ascent: b.ascent,
    isFastest: model.fastest?.km === b.km,
    isClimb: model.climb?.km === b.km && b.ascent > 0,
  }));

  return {
    schema: 'stride.profile.v1',
    algorithmVersion: ALGORITHM_VERSION,
    hasElevation: model.minEle !== null,
    hasHeartRate: model.avgHR !== null,
    minElevationMeters: model.minEle,
    maxElevationMeters: model.maxEle,
    totalDistanceMeters: total,
    samples,
    splitMarkers,
  };
}

// Deterministic, rights-cleared procedural scenery placement around the projected 3D route corridor
// Maps directly to studio/shared/procedural-assets/registry.json builders without external licenses
export function generateProceduralScenery(geoPoints, theme = 'volcanic', count = 24) {
  if (!Array.isArray(geoPoints) || geoPoints.length < 2) return [];
  const CATALOG_MAP = {
    volcanic: [
      { assetId: 'kona_palm_cluster', builder: 'vegetation', label: 'Volcanic Coast Palm' },
      { assetId: 'basalt_outcrop', builder: 'nature', label: 'Basalt Lava Outcrop' },
      { assetId: 'lighting_pole', builder: 'lamp', label: 'Course Beacon' },
    ],
    canyon: [
      { assetId: 'sandstone_spire', builder: 'nature', label: 'Red Canyon Spire' },
      { assetId: 'desert_scrub', builder: 'vegetation', label: 'Arid Scrub Cluster' },
      { assetId: 'civic_bench', builder: 'bench', label: 'Aid Station Marker' },
    ],
    alpine: [
      { assetId: 'alpine_pine_tall', builder: 'vegetation', label: 'Alpine Conifer' },
      { assetId: 'granite_ridge_block', builder: 'nature', label: 'Granite Ridge Boulder' },
      { assetId: 'lighting_pole', builder: 'lamp', label: 'Col Summit Marker' },
    ],
  };
  const palette = CATALOG_MAP[theme] || CATALOG_MAP.volcanic;
  const props = [];
  const cap = Math.max(4, Math.min(48, Math.floor(count)));

  for (let i = 0; i < cap; i++) {
    const t = (i + 0.5) / cap;
    const idx = Math.min(geoPoints.length - 1, Math.floor(t * (geoPoints.length - 1)));
    const nextIdx = Math.min(geoPoints.length - 1, idx + 1);
    const pt = geoPoints[idx];
    const nxt = geoPoints[nextIdx];
    const dx = (nxt.x - pt.x) || 0.1;
    const dz = (nxt.z - pt.z) || 0.1;
    const len = Math.hypot(dx, dz) || 1;
    // Perpendicular normal pushed outside the route corridor so props never obscure the GPS line
    const nx = -dz / len;
    const nz = dx / len;
    const side = i % 2 === 0 ? 1 : -1;
    const offset = 2.1 + ((i * 7) % 5) * 0.65;
    const px = Math.max(-15.5, Math.min(15.5, pt.x + nx * side * offset));
    const pz = Math.max(-15.5, Math.min(15.5, pt.z + nz * side * offset));
    const spec = palette[i % palette.length];
    const scale = 0.55 + ((i * 13) % 7) * 0.09;
    props.push({
      id: `${theme}-prop-${i}`,
      assetId: spec.assetId,
      builder: spec.builder,
      provenance: 'ai/studio/shared/procedural-assets/registry.json',
      x: px,
      z: pz,
      scale,
      side,
    });
  }
  return props;
}

// Share projection policy: remove the first and last traveled 700 m AND all
// visits within 700 m of either endpoint, plus any user-specified redaction zones
// [{lat, lon, radiusMeters}]. Return disjoint index ranges, never a flattened
// track that could reconnect across an intentionally hidden gap.
// Privacy trimming reduces exposure; it does not make a route anonymous.
export function planPrivateShare(points, trimMeters=700, extraZones=[]){
 if(!Number.isFinite(trimMeters)||trimMeters<700)throw Error('Privacy trim must be at least 700 meters.');
 const rows=analyze(points).rows,total=rows.at(-1).d;
 const start=rows[0],end=rows.at(-1);const segments=[];let segment=[],retained=0;
 const zones=Array.isArray(extraZones)?extraZones.filter(z=>finite(z?.lat)&&finite(z?.lon)):[];
 for(let i=0;i<rows.length;i++){
  const p=rows[i];
  const inExtraZone=zones.some(z=>haversine(z,p)<Math.max(200,finite(z.radiusMeters)?z.radiusMeters:500));
  const visible=i>0&&i<rows.length-1&&p.d>=trimMeters&&total-p.d>=trimMeters
   &&haversine(start,p)>=trimMeters&&haversine(end,p)>=trimMeters&&!inExtraZone;
  if(visible){segment.push(i);retained++;}
  else if(segment.length){if(segment.length>=2)segments.push(segment);segment=[];}
 }
 if(segment.length>=2)segments.push(segment);
 return {segments,totalMeters:total,redactedPoints:rows.length-retained,retainedPoints:retained,trimMeters,customZoneCount:zones.length};
}

export function shareSafe(points,trimMeters=700,extraZones=[]){
 const plan=planPrivateShare(points,trimMeters,extraZones);
 return plan.segments.map(segment=>segment.map(i=>{const {lat,lon,t,ele,hr}=points[i];return {lat,lon,t,ele,hr};}));
}

export const fmtTime=s=>s==null?'—':Math.floor(s/3600)>0?`${Math.floor(s/3600)}h ${Math.round(s%3600/60)}m`:`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
export const fmtDelta=s=>{if(s==null||!finite(s))return '—';const sign=s>0?'+':s<0?'−':'';const a=Math.abs(Math.round(s));return `${sign}${Math.floor(a/60)}:${String(a%60).padStart(2,'0')}`;};
