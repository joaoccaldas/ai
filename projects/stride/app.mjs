import {loadActivity, parseStoryBundle, analyze, diagnoseMoments, planPrivateShare, toActivitySpec, toMomentSpecs, compareActivities, buildElevationProfile, generateProceduralScenery, matchLocalPhotosToRoute, toPortableStoryBundle, fmtTime, fmtDelta, haversine} from './core.mjs';

const $ = id => document.getElementById(id);
const canvas=$('scene'),ctx=canvas.getContext('2d',{alpha:false}),container=$('sceneContainer');
const profileCanvas=$('profileCanvas'),pctx=profileCanvas?profileCanvas.getContext('2d'):null;
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

let state={
  rows:[],
  model:null,
  diagnosis:null,
  profile:null,
  scenery:[],
  showProps:true,
  redactZones:[],
  photoPins:[],
  equipmentRef:'canyon-cfr-2027',
  title:'Fictional training route',
  isDemo:true,
  ghostRows:null,
  ghostModel:null,
  ghostTitle:null,
  comparison:null,
  mode:'replay',
  cinema:false,
  theme:'volcanic',
  playing:!reducedMotion,
  follow:false,
  speed:1,
  progress:0,
  yaw:.73,
  pitch:.85,
  zoom:1.0,
  camFocus:{x:0,y:0,z:0},
  flyTarget:null,
  highlightRange:null,
  activeMoment:null,
  summitIndex:0,
  drag:null,
  profileDrag:false,
  last:0,
  share:false,
  sharePlan:null,
  reuseCatalog:null,
  tutorialStep:0
};

const palettes={
  volcanic:{sky:'#182b32',back:'#426168',ground:'#293d40',rim:'#bd8a67',route:'#dafa94',point:'#f4c59b',ghost:'#7ce7ff',prop:'#507870',propTop:'#8bb89e'},
  canyon:{sky:'#252d35',back:'#715c5b',ground:'#6c4744',rim:'#dfb58a',route:'#deffac',point:'#f6ce9f',ghost:'#7ce7ff',prop:'#8e5546',propTop:'#cfa07a'},
  alpine:{sky:'#1c3842',back:'#56787a',ground:'#365554',rim:'#96b7a4',route:'#dafa94',point:'#fff5cb',ghost:'#7ce7ff',prop:'#4c746c',propTop:'#9ec5b5'}
};

function demo(paceOffset = 0){
  const pts=[];
  const base=Date.UTC(2026,9,1,7)/1000;
  for(let i=0;i<250;i++){
    const t=i/249,
      lat=36.4+.064*t+.009*Math.sin(3.4*t),
      lon=-112.1+.065*t+.016*Math.sin(6.6*t),
      ele=20+80*Math.sin(Math.PI*t)**2+14*Math.sin(6*Math.PI*t);
    const stepSec = 17 + paceOffset * (0.6 + 0.8 * Math.sin(Math.PI * t) ** 2);
    pts.push({lat,lon,t:base+i*stepSec,ele,hr:128+22*Math.sin(Math.PI*t)**2});
  }
  return pts;
}

function ensureScene(){if(state.rows.length)return;setup(demo(),'Fictional training route',true)}

function projectPoints(points, refGeo, minEle, maxEle){
  const {lat0,lon0,range}=refGeo;
  const cos=Math.cos(lat0*Math.PI/180);
  return points.map(p=>{
    const lx=(p.lon-lon0)*111320*cos, lz=(p.lat-lat0)*111320;
    return {
      x:lx/range*13,
      z:lz/range*13,
      y:finite(p.ele)?(p.ele-minEle)/Math.max(20,maxEle-minEle)*3+.75:1
    };
  });
}

function setup(points,title,isDemo=false){
  const a=analyze(points);
  state.rows=a.rows;
  state.model=a;
  state.diagnosis=diagnoseMoments(points,state.ghostRows);
  state.profile=buildElevationProfile(points,120);
  state.redactZones=[];
  state.highlightRange=null;
  state.activeMoment=null;
  state.flyTarget=null;
  state.camFocus={x:0,y:0,z:0};
  if($('redactCountBadge'))$('redactCountBadge').textContent='0 pins';
  state.title=title;
  state.isDemo=isDemo;
  state.progress=0;
  state.playing=!reducedMotion;
  state.last=0;
  if ($('play')) $('play').textContent = state.playing ? 'Ⅱ' : '▶';
  const lat0=points.reduce((sum,p)=>sum+p.lat,0)/points.length,lon0=points.reduce((sum,p)=>sum+p.lon,0)/points.length;
  const cos=Math.cos(lat0*Math.PI/180);
  const local=points.map(p=>({x:(p.lon-lon0)*111320*cos,z:(p.lat-lat0)*111320}));
  const range=Math.max(500,...local.map(p=>Math.max(Math.abs(p.x),Math.abs(p.z))));
  const min=a.minEle??0,max=a.maxEle??min;
  let maxEleIdx = 0;
  for(let i=1;i<points.length;i++){
    if((points[i].ele??-Infinity)>(points[maxEleIdx].ele??-Infinity))maxEleIdx=i;
  }
  state.summitIndex=maxEleIdx;
  state.geo={
    lat0,lon0,range,min,max,
    points:local.map((p,i)=>({...p,x:p.x/range*13,z:p.z/range*13,y:finite(points[i].ele)?(points[i].ele-min)/Math.max(20,max-min)*3+.75:1}))
  };
  state.scenery=generateProceduralScenery(state.geo.points,state.theme,24);
  if($('propsCountBadge'))$('propsCountBadge').textContent=`${state.scenery.length} props · ${state.showProps?'ON':'OFF'}`;
  if(state.ghostRows){
    state.comparison=compareActivities(state.rows,state.ghostRows);
    state.ghostGeo=projectPoints(state.ghostRows,state.geo,min,max);
    state.diagnosis=diagnoseMoments(state.rows,state.ghostRows);
  }
  $('routeTitle').textContent=title+(isDemo?' (SAMPLE)':'');
  if($('rideThesisText') && state.diagnosis?.thesis){
    $('rideThesisText').textContent=state.diagnosis.thesis;
  }
  $('sourceState').textContent=isDemo?'Fictional sample data. No personal information loaded.':`Opened ${points.length} valid GPS points in this device. No upload.`;
  $('sourceState').classList.remove('error');
  $('distanceStat').textContent=(a.distance/1000).toFixed(1)+' km';
  $('activityDistance').textContent=(a.distance/1000).toFixed(1)+' KM';
  $('timeStat').textContent=fmtTime(a.duration);
  $('ascentStat').textContent= a.minEle==null?'—':Math.round(a.ascent)+' m';
  $('heartStat').textContent=a.avgHR==null?'—':Math.round(a.avgHR)+' bpm';
  if($('profileRangeLabel')){
    $('profileRangeLabel').textContent=a.minEle==null?'NO ELEVATION STREAM':`${Math.round(a.minEle)}m – ${Math.round(a.maxEle)}m`;
  }
  $('dataTruth').textContent='Original GPS positions and timestamps power the metrics. World terrain and lighting are illustrative.';
  renderMoments();
  updateLive();
}

function setupGhost(points, title){
  if(!state.rows.length)ensureScene();
  const g=analyze(points);
  state.ghostRows=g.rows;
  state.ghostModel=g;
  state.ghostTitle=title;
  state.comparison=compareActivities(state.rows,state.ghostRows);
  state.ghostGeo=projectPoints(state.ghostRows,state.geo,state.geo.min,state.geo.max);
  state.diagnosis=diagnoseMoments(state.rows,state.ghostRows);
  if($('rideThesisText') && state.diagnosis?.thesis){
    $('rideThesisText').textContent=state.diagnosis.thesis;
  }
  setMode('compare');
  $('sourceState').textContent=`Compare active: ${state.title} vs ${title} (${state.comparison.comparableCourse?'aligned course':'approximate distance index'}).`;
  $('sourceState').classList.remove('error');
  renderMoments();
  updateLive();
}

function flyToMoment(m){
  const totalDist = Math.max(1, state.model?.distance || 1);
  const startP = m.startDistance != null ? m.startDistance / totalDist : Math.max(0, (m.at - 800) / totalDist);
  const endP = m.at / totalDist;
  const focusP = (startP + endP) * 0.5;
  state.progress = endP;
  state.playing = false;
  if($('play'))$('play').textContent='▶';
  if($('scrub'))$('scrub').value=Math.round(state.progress*1000);
  state.highlightRange = [Math.max(0, startP), Math.min(1, endP)];
  state.activeMoment = m;
  const focusPt = atPosition(focusP);
  state.flyTarget = {
    focus: { x: focusPt.x, y: focusPt.y, z: focusPt.z },
    yaw: 0.95 + focusP * 0.65,
    pitch: 0.68,
    zoom: 1.32
  };
  if(reducedMotion){
    state.camFocus = state.flyTarget.focus;
    state.yaw = state.flyTarget.yaw;
    state.pitch = state.flyTarget.pitch;
    state.zoom = state.flyTarget.zoom;
    state.flyTarget = null;
  }
  if($('causalHudTitle'))$('causalHudTitle').textContent = `${m.label} · ${m.stat}`;
  if($('causalHudWhy'))$('causalHudWhy').textContent = m.why || m.info;
  updateLive();
  draw();
}

function renderMoments(){
  const a=state.model;
  if(!a)return;
  const diag=state.diagnosis;
  const moments=[];
  if(a.fastest){
    moments.push({
      label:'FASTEST KILOMETER',
      stat:fmtTime(a.fastest.seconds),
      info:diag?.fastest?.why || `Kilometer ${a.fastest.km} · recorded time`,
      why:diag?.fastest?.why,
      startDistance:a.fastest.startDistance,
      at:a.fastest.at
    });
  }
  if(a.climb&&a.climb.ascent>0){
    moments.push({
      label:'STEEPEST 1 KM GAIN',
      stat:`+${Math.round(a.climb.ascent)} m`,
      info:diag?.climb?.why || `Kilometer ${a.climb.km} · raw elevation gain`,
      why:diag?.climb?.why,
      startDistance:a.climb.startDistance,
      at:a.climb.at
    });
  }
  if(a.slowest&&a.slowest.km!==a.fastest?.km){
    moments.push({
      label:'SLOWEST KILOMETER',
      stat:fmtTime(a.slowest.seconds),
      info:diag?.slowest?.why || `Kilometer ${a.slowest.km} · recorded time`,
      why:diag?.slowest?.why,
      startDistance:a.slowest.startDistance,
      at:a.slowest.at
    });
  }
  if(Array.isArray(a.lapTransitions)){
    for(const tr of a.lapTransitions.slice(0,3)){
      const label = tr.fromSport && tr.toSport && tr.fromSport !== tr.toSport
        ? `TRANSITION · ${tr.fromSport.toUpperCase()} → ${tr.toSport.toUpperCase()}`
        : `LAP ${tr.fromLap} → ${tr.lapIndex}`;
      const whyText = `At ${(tr.at/1000).toFixed(2)} km · Completed Lap ${tr.fromLap} (${(tr.distanceMeters/1000).toFixed(1)} km${tr.seconds!=null?' in '+fmtTime(tr.seconds):''}) and entered ${tr.toSport||'Lap '+tr.lapIndex}.`;
      moments.push({
        label,
        stat:tr.seconds!=null?fmtTime(tr.seconds):`${(tr.distanceMeters/1000).toFixed(2)} km`,
        info:whyText,
        why:whyText,
        startDistance:tr.startDistance,
        at:tr.at
      });
    }
  }
  for(const pin of state.photoPins.slice(0,3)){
    const whyPhoto = `Pinned at ${(pin.distanceMeters/1000).toFixed(2)} km (${pin.elevationMeters!=null?pin.elevationMeters+' m ele · ':''}matched via ${pin.matchedBy.replace('_',' ')}) · 100% local in memory.`;
    moments.push({
      label:`PHOTO MEMORY · ${pin.name.toUpperCase().slice(0,18)}`,
      stat:`${(pin.distanceMeters/1000).toFixed(2)} km`,
      info:whyPhoto,
      why:whyPhoto,
      startDistance:Math.max(0,pin.distanceMeters-400),
      at:pin.distanceMeters
    });
  }
  if(state.comparison && state.comparison.splitComparisons.length){
    const biggestSwing = state.comparison.splitComparisons.reduce((best, cur) =>
      Math.abs(cur.deltaSeconds) > Math.abs(best.deltaSeconds) ? cur : best
    );
    const whyGhost = diag?.ghostSwing?.why || `Kilometer ${biggestSwing.km} · vs ${state.ghostTitle || 'Ghost'}`;
    moments.push({
      label:'LARGEST GHOST GAP SPLIT',
      stat:`${fmtDelta(biggestSwing.deltaSeconds)}s`,
      info:whyGhost,
      why:whyGhost,
      startDistance:(biggestSwing.km-1)*1000,
      at:biggestSwing.km*1000
    });
  }
  const mount=$('moments');
  mount.replaceChildren();
  if(!moments.length){
    const p=document.createElement('div');
    p.className='emptyMoments';
    p.textContent='This file has insufficient timestamps for kilometer splits. Replay still works.';
    mount.append(p);
  }
  for(const m of moments){
    const b=document.createElement('button');
    b.className='moment'+(state.activeMoment?.label===m.label?' active':'');
    b.type='button';
    const l=document.createElement('span');
    l.className='m-top';
    l.textContent=m.label;
    const strong=document.createElement('strong');
    strong.textContent=m.stat;
    const s=document.createElement('small');
    s.textContent=m.info;
    b.append(l,strong,s);
    b.addEventListener('click',()=>{
      for(const el of mount.querySelectorAll('.moment'))el.classList.remove('active');
      b.classList.add('active');
      flyToMoment(m);
    });
    mount.append(b);
  }
}

const finite=Number.isFinite;
function atPosition(p, rows = state.model?.rows, geoPoints = state.geo?.points){
  if(!rows||!geoPoints||!rows.length)return {x:0,y:0,z:0,index:0,target:0};
  const totalDist=rows.at(-1).d;
  const target=Math.max(0,Math.min(1,p))*totalDist;
  let lo=0,hi=rows.length-1;
  while(lo+1<hi){const k=(lo+hi)>>1;if(rows[k].d<target)lo=k;else hi=k;}
  const d=Math.max(1e-6,rows[hi].d-rows[lo].d),t=Math.max(0,Math.min(1,(target-rows[lo].d)/d));
  const g=geoPoints;
  return {
    x:g[lo].x+(g[hi].x-g[lo].x)*t,
    y:g[lo].y+(g[hi].y-g[lo].y)*t,
    z:g[lo].z+(g[hi].z-g[lo].z)*t,
    index:lo,
    target,
    fraction:t
  };
}

function drawProfile(){
  if(!profileCanvas||!pctx||!state.profile)return;
  const dpr=Math.min(2,window.devicePixelRatio||1),w=profileCanvas.clientWidth,h=profileCanvas.clientHeight;
  if(!w||!h)return;
  if(profileCanvas.width!==Math.round(w*dpr)||profileCanvas.height!==Math.round(h*dpr)){
    profileCanvas.width=Math.round(w*dpr);
    profileCanvas.height=Math.round(h*dpr);
  }
  pctx.setTransform(dpr,0,0,dpr,0,0);
  pctx.clearRect(0,0,w,h);
  const prof=state.profile;
  const samples=prof.samples;
  if(!samples.length)return;

  // Highlight active moment band on 2D profile
  if(state.highlightRange){
    const x0=state.highlightRange[0]*w, x1=state.highlightRange[1]*w;
    pctx.fillStyle='#dbfa9422';
    pctx.fillRect(x0,0,Math.max(3,x1-x0),h);
  }

  // Draw kilometer split markers
  for(const sp of prof.splitMarkers){
    const sx=sp.progress*w;
    pctx.beginPath();
    pctx.moveTo(sx,0);
    pctx.lineTo(sx,h);
    pctx.strokeStyle=sp.isFastest?'#dbfa9466':sp.isClimb?'#f4c59b66':'#ffffff16';
    pctx.lineWidth=sp.isFastest||sp.isClimb?1.5:1;
    pctx.stroke();
  }

  // Draw elevation area & contour
  pctx.beginPath();
  samples.forEach((s,idx)=>{
    const x=s.progress*w;
    const norm=s.normalizedElevation??0.3;
    const y=h-10-norm*(h-22);
    if(idx===0)pctx.moveTo(x,y);else pctx.lineTo(x,y);
  });
  pctx.strokeStyle='#dbfa94';
  pctx.lineWidth=1.8;
  pctx.stroke();
  pctx.lineTo(w,h);
  pctx.lineTo(0,h);
  pctx.closePath();
  const grad=pctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#dbfa9444');
  grad.addColorStop(1,'#dbfa9405');
  pctx.fillStyle=grad;
  pctx.fill();

  // Draw playhead cursor
  const cx=Math.max(0,Math.min(1,state.progress))*w;
  pctx.beginPath();
  pctx.moveTo(cx,0);
  pctx.lineTo(cx,h);
  pctx.strokeStyle='#f4c59b';
  pctx.lineWidth=2;
  pctx.stroke();
}

function updateLive(){
  if(!state.model)return;
  const a=state.model,p=atPosition(state.progress),i=p.index,point=a.rows[i],next=a.rows[Math.min(i+1,a.rows.length-1)];
  $('posDistance').textContent=(p.target/1000).toFixed(2)+' km';
  const elapsed=point.t!=null&&a.rows[0].t!=null?point.t-a.rows[0].t:null;
  $('posTime').textContent=a.duration==null?'No recorded time':fmtTime(elapsed??0);
  $('liveElevation').textContent=point.ele==null?'Not recorded':Math.round(point.ele)+' m';
  const delta=point.t!=null&&next.t!=null?next.t-point.t:0;
  const dSeg=haversine(point,next);
  const speed=delta>0?dSeg/delta*3.6:null;
  const grade=point.ele!=null&&next.ele!=null&&dSeg>1?((next.ele-point.ele)/dSeg)*100:null;
  $('liveSpeed').textContent=speed==null?'Not recorded':speed.toFixed(1)+' km/h';
  $('liveHR').textContent=point.hr==null?'Not recorded':Math.round(point.hr)+' bpm';

  const compareBanner=$('compareBanner'), liveGhostRow=$('liveGhostRow');
  let gap = null;
  if(state.ghostModel && state.comparison){
    const gp=atPosition(state.progress, state.ghostModel.rows, state.ghostGeo);
    const gPoint=state.ghostModel.rows[gp.index];
    const gElapsed=gPoint?.t!=null&&state.ghostModel.rows[0]?.t!=null?gPoint.t-state.ghostModel.rows[0].t:null;
    gap=elapsed!=null&&gElapsed!=null?gElapsed-elapsed:null;
    if(compareBanner){
      compareBanner.hidden=false;
      $('compareDeltaText').textContent=gap==null?'Ghost active':`Ghost ${fmtDelta(gap)}`;
    }
    if(liveGhostRow){
      liveGhostRow.hidden=false;
      $('liveGhostGap').textContent=gap==null?'No timestamps':`${fmtDelta(gap)} (${gap>0?'you lead':'ghost leads'})`;
    }
  } else {
    if(compareBanner)compareBanner.hidden=true;
    if(liveGhostRow)liveGhostRow.hidden=true;
  }

  // Keep Causal HUD live if no specific moment card is pinned
  if(!state.activeMoment && $('causalHudTitle') && $('causalHudWhy')){
    const curKm = Math.max(1, Math.ceil((p.target || 1) / 1000));
    const bin = a.bins?.find(b => b.km === curKm);
    const isClimbKm = a.climb?.km === curKm && a.climb?.ascent > 0;
    const isFastKm = a.fastest?.km === curKm;
    const roleTag = isFastKm ? ' · FASTEST 1 KM CORRIDOR' : isClimbKm ? ' · STEEPEST 1 KM CLIMB' : '';
    $('causalHudTitle').textContent = `Km ${curKm}${roleTag} · ${(p.target/1000).toFixed(2)} km`;
    const parts = [];
    if(speed!=null)parts.push(`${speed.toFixed(1)} km/h`);
    if(grade!=null)parts.push(`${grade>=0?'+':''}${grade.toFixed(1)}% grade`);
    if(point.ele!=null)parts.push(`${Math.round(point.ele)} m ele`);
    if(point.hr!=null)parts.push(`${Math.round(point.hr)} bpm`);
    if(gap!=null)parts.push(`Ghost ${fmtDelta(gap)}`);
    if(bin)parts.push(`Split ${fmtTime(bin.seconds)}`);
    $('causalHudWhy').textContent = parts.length ? parts.join(' · ') : (state.diagnosis?.thesis || 'Scrub route or select a Moment card to fly into that sector.');
  }
  drawProfile();
}

function terrain(x,z){
  let y=.09*Math.sin(x*.77+1)*Math.cos(z*.54-2)+.18*Math.sin(x*.25)*Math.cos(z*.38);
  if(state.theme==='canyon')y+=1.6*Math.exp(-((x+13)**2+(z-10)**2)/90)+1.4*Math.exp(-((x-13)**2+(z+10)**2)/130);
  if(state.theme==='alpine')y+=1.6*Math.exp(-((x+17)**2+(z-17)**2)/170)+1.9*Math.exp(-((x-17)**2+(z+17)**2)/100);
  return y-.25;
}

function perspective(p,w,h){
  // Strictly preserve default projection geometry during privacy PNG export
  if(state.share){
    const cy=Math.cos(.73),sy=Math.sin(.73),cp=Math.cos(.85),sp=Math.sin(.85),
      rx=p.x*cy-p.z*sy,rz=p.x*sy+p.z*cy,ry=p.y*cp-rz*sp,depth=p.y*sp+rz*cp;
    const scale=Math.min(w,h)*.037*(48/(48+depth));
    return {x:w*.5+rx*scale,y:h*.58-ry*scale,depth};
  }
  const focus = state.follow && state.geo
    ? atPosition(state.progress)
    : state.camFocus || {x:0,y:0,z:0};
  const focusWeight = state.follow ? 0.55 : 0.42;
  const px = p.x - focus.x * focusWeight;
  const pz = p.z - focus.z * focusWeight;
  const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch),
    rx=px*cy-pz*sy,rz=px*sy+pz*cy,ry=p.y*cp-rz*sp,depth=p.y*sp+rz*cp;
  const scale=Math.min(w,h)*.037*state.zoom*(48/(48+depth));
  return {x:w*.5+rx*scale,y:h*.58-ry*scale,depth,scale};
}

function drawProceduralProp(prop, pPalette, w, h){
  const baseY = terrain(prop.x, prop.z);
  const topY = baseY + (prop.builder === 'vegetation' ? 1.45 : prop.builder === 'nature' ? 1.25 : 1.05) * prop.scale;
  const b = perspective({x:prop.x, y:baseY, z:prop.z}, w, h);
  const t = perspective({x:prop.x, y:topY, z:prop.z}, w, h);
  const rad = Math.max(3.2, 6.2 * prop.scale * state.zoom);

  // Subtle ground shadow ellipse
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + 1.5, rad * 1.15, rad * 0.42, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#050c1055';
  ctx.fill();

  if (prop.builder === 'nature') {
    // Multi-faceted 3D basalt / sandstone rock spire (lit + shaded faces)
    ctx.beginPath();
    ctx.moveTo(b.x - rad * 1.25, b.y);
    ctx.lineTo(t.x, t.y);
    ctx.lineTo(b.x + rad * 0.15, b.y + rad * 0.25);
    ctx.closePath();
    ctx.fillStyle = pPalette.propTop;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(b.x + rad * 0.15, b.y + rad * 0.25);
    ctx.lineTo(t.x, t.y);
    ctx.lineTo(b.x + rad * 1.25, b.y);
    ctx.closePath();
    ctx.fillStyle = pPalette.prop;
    ctx.fill();
  } else if (prop.builder === 'vegetation') {
    if (state.theme === 'alpine') {
      // 3-tier Alpine Conifer silhouette
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = '#2d1f18';
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let tier = 0; tier < 3; tier++) {
        const frac = 0.28 + tier * 0.28;
        const ty = b.y + (t.y - b.y) * frac;
        const tw = rad * (1.25 - tier * 0.26);
        ctx.beginPath();
        ctx.moveTo(t.x - tw, ty + rad * 0.45);
        ctx.lineTo(t.x, ty - rad * 0.55);
        ctx.lineTo(t.x + tw, ty + rad * 0.45);
        ctx.closePath();
        ctx.fillStyle = tier % 2 === 0 ? pPalette.prop : pPalette.propTop;
        ctx.fill();
      }
    } else {
      // Curved Palm trunk + 5 radiating 3D fronds
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo((b.x + t.x) * 0.5 + prop.side * 3, (b.y + t.y) * 0.5, t.x, t.y);
      ctx.strokeStyle = '#5c4938';
      ctx.lineWidth = 2.1;
      ctx.stroke();
      const angles = [-2.4, -1.6, -0.8, -0.1, 0.6];
      for (const ang of angles) {
        const fx = t.x + Math.cos(ang) * rad * 1.45;
        const fy = t.y + Math.sin(ang) * rad * 0.95 + 2.5;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.quadraticCurveTo((t.x + fx) * 0.5, t.y - rad * 0.45, fx, fy);
        ctx.strokeStyle = pPalette.propTop;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }
  } else {
    // Course beacon post with glowing lantern cap
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(t.x, t.y);
    ctx.strokeStyle = pPalette.rim;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(t.x, t.y, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = '#f4c59b';
    ctx.fill();
  }
}

function drawCourseArch(pt, nextPt, label, color, w, h){
  if(!pt)return;
  const dx = (nextPt ? nextPt.x - pt.x : 0.2) || 0.2;
  const dz = (nextPt ? nextPt.z - pt.z : 0.2) || 0.2;
  const len = Math.hypot(dx, dz) || 1;
  const nx = (-dz / len) * 0.72;
  const nz = (dx / len) * 0.72;
  const baseL = perspective({x: pt.x - nx, y: pt.y - 0.15, z: pt.z - nz}, w, h);
  const baseR = perspective({x: pt.x + nx, y: pt.y - 0.15, z: pt.z + nz}, w, h);
  const topL  = perspective({x: pt.x - nx, y: pt.y + 1.05, z: pt.z - nz}, w, h);
  const topR  = perspective({x: pt.x + nx, y: pt.y + 1.05, z: pt.z + nz}, w, h);

  ctx.beginPath();
  ctx.moveTo(baseL.x, baseL.y);
  ctx.lineTo(topL.x, topL.y);
  ctx.lineTo(topR.x, topR.y);
  ctx.lineTo(baseR.x, baseR.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  const cx = (topL.x + topR.x) * 0.5;
  const cy = (topL.y + topR.y) * 0.5 - 6;
  ctx.font = '700 8.5px ui-sans-serif,system-ui';
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = '#08151ce0';
  ctx.fillRect(cx - tw * 0.5, cy - 8, tw, 13);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - tw * 0.5, cy - 8, tw, 13);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + 1.5);
}

function drawAthleteAvatar(pos, nextPos, row, pPalette, w, h){
  const o = perspective(pos, w, h);
  const n = perspective(nextPos || {x:pos.x+0.3, y:pos.y, z:pos.z+0.3}, w, h);
  let tx = n.x - o.x, ty = n.y - o.y;
  const tlen = Math.hypot(tx, ty) || 1;
  tx /= tlen; ty /= tlen;
  const scale = Math.max(0.85, Math.min(1.85, state.zoom * 1.1));
  const isRunning = row?.sport === 'running' || state.equipmentRef === '';

  // Ground aura halo
  ctx.beginPath();
  ctx.ellipse(o.x, o.y + 2, 14 * scale, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#dbfa9433';
  ctx.fill();

  if (!isRunning) {
    // Articulated 3D Aero Bicycle + Tucked Cyclist Avatar (KONA.m Speedmax study)
    const wheelSep = 9.5 * scale;
    const rearW = { x: o.x - tx * wheelSep, y: o.y - ty * wheelSep };
    const frontW = { x: o.x + tx * wheelSep, y: o.y + ty * wheelSep };
    const bb = { x: o.x - tx * 1.5 * scale, y: o.y - 2 * scale };
    const seat = { x: rearW.x + tx * 3.5 * scale, y: rearW.y - 10.5 * scale };
    const head = { x: frontW.x - tx * 3.0 * scale, y: frontW.y - 9.5 * scale };

    // Rear disc/deep wheel & front aero wheel
    for (const [idx, wh] of [rearW, frontW].entries()) {
      ctx.beginPath();
      ctx.arc(wh.x, wh.y, 5.2 * scale, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 && state.equipmentRef?.includes('cfr') ? '#152930' : '#0b181eeb';
      ctx.fill();
      ctx.lineWidth = 2.1 * scale;
      ctx.strokeStyle = '#e8f4ec';
      ctx.stroke();
    }

    // Aero diamond frame
    ctx.beginPath();
    ctx.moveTo(rearW.x, rearW.y);
    ctx.lineTo(seat.x, seat.y);
    ctx.lineTo(head.x, head.y);
    ctx.lineTo(bb.x, bb.y);
    ctx.closePath();
    ctx.moveTo(seat.x, seat.y);
    ctx.lineTo(bb.x, bb.y);
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(frontW.x, frontW.y);
    ctx.strokeStyle = state.equipmentRef ? '#dbfa94' : pPalette.point;
    ctx.lineWidth = 2.2 * scale;
    ctx.stroke();

    // Tucked rider torso + aero helmet
    const shoulder = { x: head.x - tx * 1.5 * scale, y: head.y - 5.5 * scale };
    ctx.beginPath();
    ctx.moveTo(seat.x, seat.y);
    ctx.lineTo(shoulder.x, shoulder.y);
    ctx.lineTo(head.x + tx * 3.5 * scale, head.y - 1.5 * scale);
    ctx.strokeStyle = '#f4c59b';
    ctx.lineWidth = 2.8 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(shoulder.x + tx * 2.5 * scale, shoulder.y - 2.2 * scale, 3.2 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#dbfa94';
    ctx.fill();
  } else {
    // 3D Runner Avatar
    const hip = { x: o.x, y: o.y - 7 * scale };
    const chest = { x: o.x + tx * 2 * scale, y: o.y - 14 * scale };
    ctx.beginPath();
    ctx.moveTo(o.x - tx * 5 * scale, o.y);
    ctx.lineTo(hip.x, hip.y);
    ctx.lineTo(o.x + tx * 5 * scale, o.y - 2 * scale);
    ctx.moveTo(hip.x, hip.y);
    ctx.lineTo(chest.x, chest.y);
    ctx.strokeStyle = '#f4c59b';
    ctx.lineWidth = 2.6 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(chest.x + tx * 1.2 * scale, chest.y - 3.5 * scale, 3.2 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#dbfa94';
    ctx.fill();
  }

  // Floating 3D Telemetry Callout Pill above Athlete
  const tagY = o.y - 26 * scale;
  const bikeShort = state.equipmentRef ? state.equipmentRef.replace('canyon-','').toUpperCase() : (isRunning ? 'RUNNER' : 'ATHLETE');
  const eleTxt = row?.ele != null ? `${Math.round(row.ele)}m` : '';
  const hrTxt = row?.hr != null ? `${Math.round(row.hr)}bpm` : '';
  const pillText = [bikeShort, eleTxt, hrTxt].filter(Boolean).join(' · ');
  ctx.font = '700 9px ui-sans-serif,system-ui';
  const pw = ctx.measureText(pillText).width + 12;
  ctx.fillStyle = '#07141be6';
  ctx.fillRect(o.x - pw * 0.5, tagY - 9, pw, 14);
  ctx.strokeStyle = '#dbfa94aa';
  ctx.lineWidth = 1;
  ctx.strokeRect(o.x - pw * 0.5, tagY - 9, pw, 14);
  ctx.fillStyle = '#f2ffe3';
  ctx.textAlign = 'center';
  ctx.fillText(pillText, o.x, tagY + 1);
}

function draw(){
  const dpr=Math.min(2,window.devicePixelRatio||1),w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h)return;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
    canvas.width=Math.round(w*dpr);
    canvas.height=Math.round(h*dpr);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const p=palettes[state.theme];
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,p.sky);
  g.addColorStop(1,p.back);
  ctx.fillStyle=g;
  ctx.fillRect(0,0,w,h);

  if(!state.share){
    // Atmospheric Horizon Sun Glow (strictly warm amber/gold so it never matches route lime #dafa94)
    const sunGrad = ctx.createRadialGradient(w * 0.76, h * 0.18, 8, w * 0.76, h * 0.18, Math.max(w, h) * 0.42);
    sunGrad.addColorStop(0, '#f4c59b38');
    sunGrad.addColorStop(0.45, '#bd8a6714');
    sunGrad.addColorStop(1, '#00000000');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);
  }

  const rects=[],n=state.share?20:24,world=34,step=world/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const x=-world/2+i*step,z=-world/2+j*step;
    const v=[{x,z},{x:x+step,z},{x:x+step,z:z+step},{x,z:z+step}].map(q=>({x:q.x,y:terrain(q.x,q.z),z:q.z}));
    const zAvg=v.reduce((sum,a)=>sum+perspective(a,w,h).depth,0)/4;
    const yAvg=(v[0].y+v[1].y+v[2].y+v[3].y)*0.25;
    rects.push({v,zAvg,yAvg,i,j});
  }
  rects.sort((a,b)=>b.zAvg-a.zAvg);
  for(const r of rects){
    const v=r.v.map(a=>perspective(a,w,h));
    ctx.beginPath();
    ctx.moveTo(v[0].x,v[0].y);
    v.slice(1).forEach(a=>ctx.lineTo(a.x,a.y));
    ctx.closePath();
    const elevBoost = !state.share ? Math.round(Math.max(-8, Math.min(22, r.yAvg * 14))) : 0;
    const light=Math.sin((r.i+r.j)*.66)*5 + elevBoost;
    ctx.fillStyle=shade(p.ground,light);
    ctx.fill();
    ctx.strokeStyle=!state.share && r.yAvg > 0.35 ? '#eac19e18' : '#c7d3ad0a';
    ctx.stroke();
  }

  // Draw rights-cleared procedural studio props (omitted during privacy raster export)
  if(!state.share && state.showProps && state.scenery.length){
    for(const prop of state.scenery){
      drawProceduralProp(prop, p, w, h);
    }
  }

  if(!state.geo)return;
  const coords=state.geo.points;
  ctx.lineJoin='round';
  ctx.lineCap='round';

  // Draw 3D Vertical Elevation Curtain & Kilometer Pillars beneath the route (when interactive)
  if(!state.share && coords.length >= 2){
    const baseDatumY = 0.15;
    const totalPts = coords.length;
    for(let i=0;i<totalPts-1;i++){
      const c0 = coords[i], c1 = coords[i+1];
      const top0 = perspective(c0, w, h), top1 = perspective(c1, w, h);
      const bot0 = perspective({x:c0.x, y:baseDatumY, z:c0.z}, w, h);
      const bot1 = perspective({x:c1.x, y:baseDatumY, z:c1.z}, w, h);
      const frac = i / Math.max(1, totalPts - 1);
      const inHighlight = state.highlightRange && frac >= state.highlightRange[0] && frac <= state.highlightRange[1];
      const dy = c1.y - c0.y;
      ctx.beginPath();
      ctx.moveTo(top0.x, top0.y);
      ctx.lineTo(top1.x, top1.y);
      ctx.lineTo(bot1.x, bot1.y);
      ctx.lineTo(bot0.x, bot0.y);
      ctx.closePath();
      ctx.fillStyle = inHighlight
        ? '#f4c59b48'
        : dy > 0.035
        ? '#eac19e28'
        : '#598d8424';
      ctx.fill();
      if(i % 10 === 0){
        ctx.beginPath();
        ctx.moveTo(top0.x, top0.y);
        ctx.lineTo(bot0.x, bot0.y);
        ctx.strokeStyle = inHighlight ? '#f4c59b66' : '#8ab4a228';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Draw ghost comparison route when active and not exporting privacy PNG
  if(!state.share && state.ghostGeo && state.ghostGeo.length>=2){
    ctx.beginPath();
    state.ghostGeo.forEach((pt,idx)=>{
      const q=perspective(pt,w,h);
      if(idx===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
    });
    ctx.strokeStyle='#7ce7ff88';
    ctx.lineWidth=2.5;
    ctx.setLineDash([6,4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const segments=state.share?(state.sharePlan?.segments||[]):[coords.map((_,i)=>i)];
  for(const indices of segments){
    if(indices.length<2)continue;
    ctx.beginPath();
    let first=true;
    for(const i of indices){
      const q=perspective(coords[i],w,h);
      if(first){ctx.moveTo(q.x,q.y);first=false;}else ctx.lineTo(q.x,q.y);
    }
    ctx.strokeStyle='#060f16bd';
    ctx.lineWidth=6;
    ctx.stroke();
    ctx.strokeStyle=p.route;
    ctx.lineWidth=3.2;
    ctx.shadowColor=p.route;
    ctx.shadowBlur=14;
    ctx.stroke();
    ctx.shadowBlur=0;
  }

  // Highlighted 1 km Active Moment Corridor Ribbon on the 3D Route
  if(!state.share && state.highlightRange && coords.length >= 2){
    const iStart = Math.max(0, Math.floor(state.highlightRange[0] * (coords.length - 1)));
    const iEnd = Math.min(coords.length - 1, Math.ceil(state.highlightRange[1] * (coords.length - 1)));
    if(iEnd > iStart){
      ctx.beginPath();
      for(let i=iStart;i<=iEnd;i++){
        const q=perspective(coords[i],w,h);
        if(i===iStart)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
      }
      ctx.strokeStyle='#f4c59b';
      ctx.lineWidth=5.2;
      ctx.shadowColor='#f4c59b';
      ctx.shadowBlur=16;
      ctx.stroke();
      ctx.shadowBlur=0;
    }
  }

  if(!state.share){
    // 3D Start, Summit, and Finish Course Portals
    if(coords.length >= 4){
      drawCourseArch(coords[0], coords[1], 'START', '#dbfa94', w, h);
      drawCourseArch(coords.at(-1), coords.at(-2), 'FINISH', '#f4c59b', w, h);
      if(state.summitIndex > 2 && state.summitIndex < coords.length - 3){
        const sIdx = state.summitIndex;
        const sEle = state.rows[sIdx]?.ele;
        const sLabel = sEle != null ? `▲ SUMMIT ${Math.round(sEle)}M` : '▲ SUMMIT';
        drawCourseArch(coords[sIdx], coords[sIdx + 1], sLabel, '#eac19e', w, h);
      }
    }

    if(state.photoPins && state.photoPins.length){
      for(const pin of state.photoPins){
        const pPos=perspective(atPosition(pin.progress),w,h);
        ctx.beginPath();
        ctx.moveTo(pPos.x, pPos.y);
        ctx.lineTo(pPos.x, pPos.y - 18);
        ctx.strokeStyle='#f4c59b';
        ctx.lineWidth=1.5;
        ctx.stroke();
        ctx.fillStyle='#10242be8';
        ctx.fillRect(pPos.x-18,pPos.y-30,36,13);
        ctx.strokeStyle='#f4c59b';
        ctx.strokeRect(pPos.x-18,pPos.y-30,36,13);
        ctx.fillStyle='#f4c59b';
        ctx.font='700 8px ui-sans-serif,system-ui';
        ctx.textAlign='center';
        ctx.fillText('📸 PIN',pPos.x,pPos.y-21);
      }
    }
    if(state.ghostGeo && state.ghostModel){
      const go=perspective(atPosition(state.progress, state.ghostModel.rows, state.ghostGeo),w,h);
      ctx.beginPath();
      ctx.arc(go.x,go.y,5.8,0,Math.PI*2);
      ctx.fillStyle=p.ghost;
      ctx.fill();
      ctx.lineWidth=2;
      ctx.strokeStyle='#081e26';
      ctx.stroke();
      ctx.font='700 8.5px ui-sans-serif,system-ui';
      ctx.fillStyle=p.ghost;
      ctx.textAlign='center';
      ctx.fillText('GHOST',go.x,go.y-10);
    }

    const curPos = atPosition(state.progress);
    const nextPos = atPosition(Math.min(1, state.progress + 0.015));
    const curRow = state.rows[curPos.index];
    drawAthleteAvatar(curPos, nextPos, curRow, p, w, h);
  }
}

function shade(hex,n){
  const v=hex.slice(1).match(/../g).map(s=>Math.max(0,Math.min(255,parseInt(s,16)+n)));
  return `rgb(${v.join(',')})`;
}

function frame(ts){
  // Smooth camera Fly-To interpolation when a Moment or Tutorial is selected
  if(state.flyTarget && !state.drag){
    const lerp = 0.14;
    state.yaw += (state.flyTarget.yaw - state.yaw) * lerp;
    state.pitch += (state.flyTarget.pitch - state.pitch) * lerp;
    state.zoom += (state.flyTarget.zoom - state.zoom) * lerp;
    state.camFocus.x += (state.flyTarget.focus.x - state.camFocus.x) * lerp;
    state.camFocus.y += (state.flyTarget.focus.y - state.camFocus.y) * lerp;
    state.camFocus.z += (state.flyTarget.focus.z - state.camFocus.z) * lerp;
    if(Math.abs(state.flyTarget.zoom - state.zoom) < 0.005 && Math.abs(state.flyTarget.yaw - state.yaw) < 0.005){
      state.flyTarget = null;
    }
  }
  if(state.model&&state.playing){
    if(state.last){
      const dt=(ts-state.last)/1000;
      const duration=Math.max(30,state.model.duration??Math.max(30,state.model.distance/2.6));
      state.progress=Math.min(1,state.progress+dt/duration*state.speed*18);
      if(state.cinema && !state.drag && !reducedMotion){
        state.yaw += dt * 0.22;
        state.pitch = 0.72 + 0.16 * Math.sin(state.progress * Math.PI * 2);
      }
      if(state.progress>=1){
        state.playing=false;
        $('play').textContent='▶';
      }
      $('scrub').value=Math.round(state.progress*1000);
      updateLive();
    }
    state.last=ts;
  } else state.last=ts;
  draw();
  requestAnimationFrame(frame);
}

function demoMultiLap(){
  const pts=[];
  const base=Date.UTC(2026,9,15,6,30)/1000;
  for(let i=0;i<240;i++){
    const lap = i < 120 ? 1 : 2;
    const sport = i < 120 ? 'cycling' : 'running';
    const t=(i%120)/119;
    const lat=19.64+.045*t+.008*Math.sin(4*t);
    const lon=-155.99+.042*t+.012*Math.cos(4*t);
    const ele=12+95*Math.sin(Math.PI*t)**2;
    pts.push({lat,lon,t:base+i*16,ele,hr:138+24*Math.sin(Math.PI*t),lap,sport});
  }
  return pts;
}

const TUTORIAL_MODULES = [
  {
    step: '01 / 08',
    title: 'Bring Your Own Route (GPX · TCX · FIT · .stride.json)',
    summary: 'Import activity files directly into browser/app memory. FIT files undergo 14-byte header + file CRC-16 verification, compressed timestamp reconstruction, and GPS spike filtering.',
    rule: 'Data Truth: Zero cloud upload · Strava API is not used.',
    actionLabel: 'Load Verified Coastal Sample →',
    run: () => {
      state.ghostRows = null; state.ghostModel = null; state.comparison = null;
      setup(demo(), 'Coastal training loop', true);
      state.progress = 0.12;
      $('scrub').value = '120';
      updateLive();
    }
  },
  {
    step: '02 / 08',
    title: '3D Camera Orbit, Follow & Autonomous Cinema Drone',
    summary: 'Drag or press Arrow keys to orbit pitch/yaw, +/- to zoom, ◎ Follow to track the rider, or ◈ Cinema to engage autonomous orbital drone reconstruction.',
    rule: 'UX Rule: Respects prefers-reduced-motion and full keyboard navigation.',
    actionLabel: 'Launch Cinema Drone Orbit →',
    run: () => {
      state.cinema = true;
      state.follow = true;
      state.playing = true;
      state.speed = 2;
      if ($('speed')) $('speed').textContent = '2×';
      if ($('play')) $('play').textContent = 'Ⅱ';
      if ($('cinemaBtn')) $('cinemaBtn').setAttribute('aria-pressed', 'true');
      if ($('followBtn')) $('followBtn').setAttribute('aria-pressed', 'true');
      $('sourceState').textContent = 'Tutorial 02 active: Autonomous Cinema Drone camera orbiting at 2× speed.';
    }
  },
  {
    step: '03 / 08',
    title: 'Moment Atlas & Multi-Lap / Triathlon Transitions',
    summary: 'STRIDE automatically extracts Fastest 1 km, Steepest 1 km Climb, Slowest 1 km, and Device Lap / Multisport Transitions (e.g. Cycling → Running). Click any card to jump there.',
    rule: 'Data Truth: Every moment requires measured GPS & timestamp provenance.',
    actionLabel: 'Load Multi-Lap Brick & Jump to Transition →',
    run: () => {
      setup(demoMultiLap(), 'Kona Brick (Bike → Run Transition)', true);
      state.playing = false;
      if ($('play')) $('play').textContent = '▶';
      state.progress = 0.50;
      $('scrub').value = '500';
      updateLive();
      $('sourceState').textContent = 'Tutorial 03 active: Loaded 2-lap Cycling → Running brick and jumped to T2 transition.';
    }
  },
  {
    step: '04 / 08',
    title: 'Interactive 2D Elevation & Split Contour Scrubbing',
    summary: 'The 2D Elevation Contour beneath the transport bar plots recorded elevation, kilometer split lines, fastest split (lime), and steepest climb (amber). Click or drag horizontally to scrub.',
    rule: 'Data Truth: 0.75 m elevation hysteresis prevents GPS vertical noise inflation.',
    actionLabel: 'Scrub to Summit Grade on Contour →',
    run: () => {
      state.playing = false;
      if ($('play')) $('play').textContent = '▶';
      const climbM = state.model?.climb;
      if (climbM) {
        flyToMoment({
          label: 'STEEPEST 1 KM GAIN',
          stat: `+${Math.round(climbM.ascent)} m`,
          why: state.diagnosis?.climb?.why || `Km ${climbM.km} · steepest recorded climb`,
          startDistance: climbM.startDistance,
          at: climbM.at
        });
      } else {
        state.progress = 0.52;
        $('scrub').value = '520';
        updateLive();
      }
      $('sourceState').textContent = 'Tutorial 04 active: Flew camera into Steepest 1 km Climb on 2D & 3D Elevation Curtain.';
    }
  },
  {
    step: '05 / 08',
    title: 'Synchronized Ghost Compare (stride.comparison.v1)',
    summary: 'Load a second activity over the same course to race a cyan Ghost marker synchronized by distance, inspect live ahead/behind time delta, and jump to the Largest Ghost Gap Split.',
    rule: 'Algorithm: Checks start corridor (<400 m) and 10-point spatial alignment (<500 m).',
    actionLabel: 'Activate Ghost Compare (+18s Pace) →',
    run: () => {
      setup(demo(), 'Primary effort', true);
      setupGhost(demo(0.11), 'Previous attempt (+18s sample)');
      state.playing = false;
      if ($('play')) $('play').textContent = '▶';
      const swing = state.diagnosis?.ghostSwing;
      if (swing) {
        flyToMoment({
          label: 'LARGEST GHOST GAP SPLIT',
          stat: `${fmtDelta(swing.deltaSeconds)}s`,
          why: swing.why,
          startDistance: (swing.km - 1) * 1000,
          at: swing.km * 1000
        });
      } else {
        state.progress = 0.64;
        $('scrub').value = '640';
        updateLive();
      }
    }
  },
  {
    step: '06 / 08',
    title: 'World Presets, 3D Studio Scenery & KONA.m Bicycles',
    summary: 'Switch between Lava Coast (Kona), Red Canyon (St. George), and Alpine Morning (Nice), toggle 24 procedural props from ai/studio, and bind a KONA.m canonical bicycle study.',
    rule: 'Reuse Policy: Read-only catalog binding; zero duplicated asset stores.',
    actionLabel: 'Apply Red Canyon + Speedmax CFR 2027 →',
    run: () => {
      const canyonBtn = document.querySelector('[data-theme="canyon"]');
      if (canyonBtn) canyonBtn.click();
      state.showProps = true;
      if ($('propsToggleBtn')) $('propsToggleBtn').setAttribute('aria-pressed', 'true');
      if ($('propsCountBadge')) $('propsCountBadge').textContent = `${state.scenery.length} props · ON`;
      state.equipmentRef = 'canyon-cfr-2027';
      if ($('equipmentSelect')) $('equipmentSelect').value = 'canyon-cfr-2027';
      $('sourceState').textContent = 'Tutorial 06 active: Red Canyon (St. George) preset + 24 Studio props + Canyon Speedmax CFR (2027).';
      draw();
    }
  },
  {
    step: '07 / 08',
    title: 'Self-Owned Local Photo Memories in 3D',
    summary: 'Pin local JPEG/PNG/WebP photos onto your 3D route in memory. STRIDE matches photo timestamps (or current playhead position) to exact route coordinates and adds Moment Atlas cards.',
    rule: 'Privacy Rule: Photos stay 100% in local memory and are never uploaded.',
    actionLabel: 'Pin 2 Demo Photo Memories on Route →',
    run: () => {
      if (!state.rows.length) ensureScene();
      state.photoPins = matchLocalPhotosToRoute(state.rows, [
        { name: 'QueenK_Lava_Lookout.jpg', progress: 0.34 },
        { name: 'EnergyLab_Turnaround.jpg', progress: 0.71 }
      ], 0.5);
      if ($('photoCountBadge')) $('photoCountBadge').textContent = `${state.photoPins.length} photos`;
      state.progress = 0.34;
      $('scrub').value = '340';
      renderMoments();
      updateLive();
      draw();
      $('sourceState').textContent = 'Tutorial 07 active: Pinned 2 local photo beacons (QueenK_Lava_Lookout.jpg & EnergyLab_Turnaround.jpg) in memory.';
    }
  },
  {
    step: '08 / 08',
    title: 'Privacy Redaction Pins, PNG & .stride.json Story Bundles',
    summary: 'Every export trims the first/last 700 m AND all return visits near start/finish, plus any 500 m custom redaction pins. Closed short loops fail closed rather than leaking home coordinates.',
    rule: 'Verified Gate: 0 leaked pixels across 1600×1024, 390×844, and 844×390.',
    actionLabel: 'Drop 500 m Redaction Pin & Inspect Spec →',
    run: () => {
      if (!state.rows.length) ensureScene();
      state.progress = 0.45;
      $('scrub').value = '450';
      const pos = atPosition(state.progress);
      const pt = state.rows[pos.index];
      if (pt) {
        state.redactZones = [{ lat: pt.lat, lon: pt.lon, radiusMeters: 500 }];
        if ($('redactCountBadge')) $('redactCountBadge').textContent = '1 pin';
      }
      const wp = $('worldsPanel');
      if (wp) {
        wp.hidden = false;
        renderWorldsAndContracts();
      }
      updateLive();
      draw();
      $('sourceState').textContent = 'Tutorial 08 active: Pinned 500 m mid-route redaction zone and opened ActivitySpec v1 + StoryBundle inspector.';
    }
  }
];

function runTutorialStep(index){
  const idx = ((index % TUTORIAL_MODULES.length) + TUTORIAL_MODULES.length) % TUTORIAL_MODULES.length;
  state.tutorialStep = idx;
  const mod = TUTORIAL_MODULES[idx];
  mod.run();
  const banner = $('tourBanner');
  if(banner){
    banner.hidden = false;
    $('tourStepBadge').textContent = `TUTORIAL ${mod.step}`;
    $('tourTitle').textContent = mod.title;
    $('tourBody').textContent = mod.summary;
    $('tourRule').textContent = mod.rule;
  }
  renderTutorials();
}

if(typeof window !== 'undefined'){
  window.strideRunTutorial = runTutorialStep;
}

function renderTutorials(){
  const mount = $('tutorialsContent');
  if(!mount)return;
  mount.replaceChildren();
  TUTORIAL_MODULES.forEach((mod, idx) => {
    const card = document.createElement('div');
    card.className = 'tutorial-card' + (state.tutorialStep === idx ? ' active' : '');
    const title = document.createElement('strong');
    title.textContent = `${mod.step} · ${mod.title}`;
    const desc = document.createElement('span');
    desc.textContent = mod.summary;
    const rule = document.createElement('small');
    rule.textContent = mod.rule;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tutorial-run-btn';
    btn.innerHTML = `<span>${mod.actionLabel}</span><span>▶</span>`;
    btn.addEventListener('click', () => runTutorialStep(idx));
    card.append(title, desc, rule, btn);
    mount.append(card);
  });
}

function setMode(mode){
  state.mode=mode;
  state.cinema = mode === 'cinema';
  if($('cinemaBtn'))$('cinemaBtn').setAttribute('aria-pressed',String(state.cinema));
  if($('modeBadge')){
    $('modeBadge').textContent = {
      replay:'PROCEDURAL SCENE · NOT SURVEYED',
      cinema:'AUTONOMOUS DRONE ORBIT · ILLUSTRATIVE',
      compare:'GHOST SYNCHRONIZED BY DISTANCE · LOCAL-ONLY',
      worlds:'CROSS-REPO 3D REUSE & CONTRACT INSPECTOR',
      tutorials:'INTERACTIVE TUTORIALS & FEATURE ACADEMY'
    }[mode] || 'PROCEDURAL SCENE · NOT SURVEYED';
  }
  for(const btn of document.querySelectorAll('.modebtn')){
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  const wp = $('worldsPanel');
  if(wp){
    if(mode === 'worlds'){
      wp.hidden = false;
      renderWorldsAndContracts();
    } else {
      wp.hidden = true;
    }
  }
  const tp = $('tutorialsPanel');
  if(tp){
    if(mode === 'tutorials'){
      tp.hidden = false;
      renderTutorials();
      if($('tourBanner')?.hidden) runTutorialStep(state.tutorialStep || 0);
    } else {
      tp.hidden = true;
    }
  }
}

async function renderWorldsAndContracts(){
  const mount = $('worldsContent');
  if(!mount)return;
  mount.replaceChildren();
  const spec = toActivitySpec(state.rows, { title: state.title, isDemo: state.isDemo, equipmentRef: state.equipmentRef });
  const moments = toMomentSpecs(state.rows, { id: spec.id });

  const worldCards = [
    {
      id: 'volcanic',
      title: 'WORLD 01 · VOLCANIC COAST (KONA)',
      desc: 'Basalt lava fields, Queen K coastal palms, and warm tradewind horizon glow. Reuses Studio Kona terrain & atmosphere concepts.',
      meta: '24 active procedural props · ai/studio/shared/procedural-assets'
    },
    {
      id: 'canyon',
      title: 'WORLD 02 · RED CANYON (ST. GEORGE)',
      desc: 'Terraced sandstone buttes, Snow Canyon steep wall relief, and arid desert scrub clusters.',
      meta: '24 active procedural props · ai/studio/shared/procedural-assets'
    },
    {
      id: 'alpine',
      title: 'WORLD 03 · ALPINE MORNING (NICE)',
      desc: 'High-altitude granite ridges, 3-tier alpine conifers, and crisp Mediterranean col atmosphere.',
      meta: '24 active procedural props · ai/studio/shared/procedural-assets'
    }
  ];

  for (const w of worldCards) {
    const card = document.createElement('div');
    card.className = 'tutorial-card' + (state.theme === w.id ? ' active' : '');
    card.innerHTML = `<strong>${w.title}</strong><span>${w.desc}</span><small>${w.meta}</small>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tutorial-run-btn';
    btn.innerHTML = `<span>${state.theme === w.id ? 'Active in 3D Viewport' : 'Enter World in 3D →'}</span><span>◈</span>`;
    btn.addEventListener('click', () => {
      const tb = document.querySelector(`[data-theme="${w.id}"]`);
      if (tb) tb.click();
      renderWorldsAndContracts();
    });
    card.append(btn);
    mount.append(card);
  }

  const bikes = [
    { id: 'canyon-cfr-2027', name: 'KONA.m · Speedmax CFR AXS (2027)', desc: 'Flagship aero triathlon superbike with rear disc wheel & integrated hydration.', meta: 'konam/museum/catalog/products.json · 1 of 21 studies' },
    { id: 'canyon-slx-2027', name: 'KONA.m · Speedmax CF SLX 8 (2027)', desc: 'Deep-section aero carbon triathlon platform from the KONA.m bicycle atlas.', meta: 'konam/museum/catalog/products.json · 1 of 21 studies' },
    { id: 'canyon-speedmax-cf-2011', name: 'KONA.m · Speedmax CF (2011)', desc: 'Historic Kona World Championship era carbon time-trial geometry.', meta: 'konam/museum/catalog/products.json · 1 of 21 studies' }
  ];

  for (const b of bikes) {
    const card = document.createElement('div');
    card.className = 'tutorial-card' + (state.equipmentRef === b.id ? ' active' : '');
    card.innerHTML = `<strong>${b.name}</strong><span>${b.desc}</span><small>${b.meta}</small>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tutorial-run-btn';
    btn.innerHTML = `<span>${state.equipmentRef === b.id ? 'Equipped on 3D Avatar' : 'Equip Bike in 3D →'}</span><span>🚲</span>`;
    btn.addEventListener('click', () => {
      state.equipmentRef = b.id;
      if ($('equipmentSelect')) $('equipmentSelect').value = b.id;
      $('sourceState').textContent = `Equipped ${b.name} on 3D course avatar.`;
      draw();
      renderWorldsAndContracts();
    });
    card.append(btn);
    mount.append(card);
  }

  const contractCard = document.createElement('div');
  contractCard.className = 'world-card';
  contractCard.style.gridColumn = '1 / -1';
  contractCard.innerHTML = `<strong>Cross-App Telemetry Contracts (ActivitySpec v1 · MomentSpec v1 · ReuseInventory v1)</strong><span>Verified read-only bridge to 66 procedural Blender assets (ai/studio), 17 hand-built KONA.m rooms (36 indexed), and 21 bicycle studies.</span>`;
  const details = document.createElement('details');
  details.style.marginTop = '6px';
  const summary = document.createElement('summary');
  summary.style.cursor = 'pointer';
  summary.style.color = 'var(--accent)';
  summary.style.fontSize = '11px';
  summary.textContent = 'Inspect Raw ActivitySpec v1 & MomentSpec v1 JSON Payloads';
  const code = document.createElement('code');
  code.textContent = JSON.stringify({
    activitySpec: { schema: spec.schema, algorithmVersion: spec.algorithmVersion, equipmentRef: spec.equipmentRef, summary: spec.summary },
    momentSpecs: moments.map(m => ({ kind: m.kind, km: m.km, val: m.formattedValue, provenance: m.provenance })),
    reuseInventory: state.reuseCatalog?.counts || { proceduralAssets: 66, konamHandBuiltAreas: 17, konamIndexedRooms: 36, bicycleStudies: 21 }
  }, null, 2);
  details.append(summary, code);
  contractCard.append(details);
  mount.append(contractCard);
}

const file=$('activityFile');
file.addEventListener('change',async()=>{
  const f=file.files?.[0];
  if(!f)return;
  try{
    if(f.size>16*1024*1024)throw Error('Maximum file size is 16 MB.');
    const lower=f.name.toLowerCase();
    if(lower.endsWith('.stride.json')||lower.endsWith('.json')){
      const bundle=parseStoryBundle(await f.text());
      if(bundle.worldPreset){
        const tb=document.querySelector(`[data-theme="${bundle.worldPreset}"]`);
        if(tb)tb.click();
      }
      if(bundle.equipmentRef && $('equipmentSelect')){
        state.equipmentRef=bundle.equipmentRef;
        $('equipmentSelect').value=bundle.equipmentRef;
      }
      setup(bundle.points,bundle.title||f.name,false);
      $('sourceState').textContent=`Restored redacted Story Bundle (${bundle.points.length} safe GPS points, preset: ${bundle.worldPreset}).`;
    }else{
      const content=lower.endsWith('.fit')?await f.arrayBuffer():await f.text();
      setup(loadActivity(f.name,content),f.name,false);
    }
  }catch(e){
    $('sourceState').textContent='Could not load activity: '+e.message;
    $('sourceState').classList.add('error');
  }
  file.value='';
});

const compareInput=$('compareFile');
if(compareInput){
  compareInput.addEventListener('change',async()=>{
    const f=compareInput.files?.[0];
    if(!f)return;
    try{
      if(f.size>16*1024*1024)throw Error('Maximum file size is 16 MB.');
      const content=f.name.toLowerCase().endsWith('.fit')?await f.arrayBuffer():await f.text();
      setupGhost(loadActivity(f.name,content),f.name);
    }catch(e){
      $('sourceState').textContent='Could not load comparison file: '+e.message;
      $('sourceState').classList.add('error');
    }
    compareInput.value='';
  });
}

$('demoBtn').addEventListener('click',()=>{
  state.ghostRows=null;state.ghostModel=null;state.comparison=null;
  setup(demo(),'Fictional training route',true);
});

if($('ghostSampleBtn')){
  $('ghostSampleBtn').addEventListener('click',()=>{
    setupGhost(demo(0.11),'Previous attempt (+18s sample)');
  });
}

if($('propsToggleBtn')){
  $('propsToggleBtn').addEventListener('click',()=>{
    state.showProps=!state.showProps;
    $('propsToggleBtn').setAttribute('aria-pressed',String(state.showProps));
    if($('propsCountBadge'))$('propsCountBadge').textContent=`${state.scenery.length} props · ${state.showProps?'ON':'OFF'}`;
    draw();
  });
}

if($('redactPinBtn')){
  $('redactPinBtn').addEventListener('click',()=>{
    if(!state.rows.length)return;
    const pos=atPosition(state.progress);
    const pt=state.rows[pos.index];
    if(pt){
      state.redactZones.push({lat:pt.lat,lon:pt.lon,radiusMeters:500});
      if($('redactCountBadge'))$('redactCountBadge').textContent=`${state.redactZones.length} pin${state.redactZones.length===1?'':'s'}`;
      $('sourceState').textContent=`Added 500 m privacy redaction pin at ${(pos.target/1000).toFixed(2)} km (${state.redactZones.length} active).`;
    }
  });
}

if($('specBtn')){
  $('specBtn').addEventListener('click',()=>{
    const wp=$('worldsPanel');
    if(wp){
      const nextHidden = !wp.hidden;
      wp.hidden = nextHidden;
      if(!nextHidden)renderWorldsAndContracts();
    }
  });
}

if($('tutorialLaunchBtn')){
  $('tutorialLaunchBtn').addEventListener('click',()=>{
    setMode('tutorials');
    runTutorialStep(0);
  });
}

if($('tourPrevBtn')){
  $('tourPrevBtn').addEventListener('click',()=>runTutorialStep((state.tutorialStep||0)-1));
}
if($('tourNextBtn')){
  $('tourNextBtn').addEventListener('click',()=>runTutorialStep((state.tutorialStep||0)+1));
}
if($('tourCloseBtn')){
  $('tourCloseBtn').addEventListener('click',()=>{
    if($('tourBanner'))$('tourBanner').hidden=true;
    if(state.mode==='tutorials')setMode('replay');
  });
}

if($('equipmentSelect')){
  $('equipmentSelect').addEventListener('change',e=>{
    state.equipmentRef=e.target.value||null;
    $('sourceState').textContent=state.equipmentRef
      ? `Linked KONA.m bicycle study: ${state.equipmentRef} (read-only catalog reference).`
      : 'Cleared KONA.m bicycle study reference.';
    if(!$('worldsPanel')?.hidden)renderWorldsAndContracts();
  });
}

if($('photoInput')){
  $('photoInput').addEventListener('change',e=>{
    const files=Array.from(e.target.files||[]);
    if(!files.length||!state.rows.length)return;
    const descriptors=files.map((f,idx)=>({
      name:f.name,
      timestampMs:f.lastModified,
      progress:Math.min(0.95,Math.max(0.05,state.progress+idx*0.08))
    }));
    const pins=matchLocalPhotosToRoute(state.rows,descriptors,state.progress);
    state.photoPins.push(...pins);
    if($('photoCountBadge'))$('photoCountBadge').textContent=`${state.photoPins.length} photo${state.photoPins.length===1?'':'s'}`;
    $('sourceState').textContent=`Pinned ${pins.length} local photo${pins.length===1?'':'s'} in memory (0 bytes uploaded).`;
    renderMoments();
    draw();
    e.target.value='';
  });
}

if($('bundleBtn')){
  $('bundleBtn').addEventListener('click',()=>{
    try{
      const bundle=toPortableStoryBundle(state.rows,{
        title:state.title,
        isDemo:state.isDemo,
        theme:state.theme,
        equipmentRef:state.equipmentRef,
        extraZones:state.redactZones,
        trimMeters:700
      });
      if(!bundle.safeSegments.length){
        $('sourceState').textContent='Story bundle blocked: no safe route segment remains after 700 m privacy redaction.';
        $('sourceState').classList.add('error');
        return;
      }
      const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.download='stride-story-bundle.stride.json';
      a.href=url;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      $('sourceState').textContent=`Exported redacted Story Bundle (${bundle.privacy.retainedPoints} safe pts, ${bundle.privacy.redactedPoints} redacted).`;
    }catch(err){
      $('sourceState').textContent='Could not export story bundle: '+err.message;
      $('sourceState').classList.add('error');
    }
  });
}

$('play').addEventListener('click',()=>{
  state.playing=!state.playing;
  if(state.progress>=1&&state.playing)state.progress=0;
  $('play').textContent=state.playing?'Ⅱ':'▶';
});
$('scrub').addEventListener('input',e=>{
  state.progress=Number(e.target.value)/1000;
  state.playing=false;
  $('play').textContent='▶';
  updateLive();
});

if(profileCanvas){
  const scrubFromProfile = clientX => {
    const rect=profileCanvas.getBoundingClientRect();
    if(!rect.width)return;
    state.progress=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
    state.playing=false;
    $('play').textContent='▶';
    $('scrub').value=Math.round(state.progress*1000);
    updateLive();
  };
  profileCanvas.addEventListener('pointerdown',e=>{
    profileCanvas.setPointerCapture(e.pointerId);
    state.profileDrag=true;
    scrubFromProfile(e.clientX);
  });
  profileCanvas.addEventListener('pointermove',e=>{
    if(!state.profileDrag)return;
    scrubFromProfile(e.clientX);
  });
  profileCanvas.addEventListener('pointerup',()=>state.profileDrag=false);
  profileCanvas.addEventListener('pointercancel',()=>state.profileDrag=false);
}

$('speed').addEventListener('click',()=>{
  state.speed=state.speed===1?2:state.speed===2?4:1;
  $('speed').textContent=state.speed+'×';
});
$('viewReset').addEventListener('click',()=>{
  state.yaw=.73;state.pitch=.85;state.zoom=1;state.follow=false;state.cinema=false;
  state.flyTarget=null;state.camFocus={x:0,y:0,z:0};state.highlightRange=null;state.activeMoment=null;
  $('followBtn').setAttribute('aria-pressed','false');
  if($('cinemaBtn'))$('cinemaBtn').setAttribute('aria-pressed','false');
  updateLive();
  draw();
});
$('followBtn').addEventListener('click',()=>{
  state.follow=!state.follow;
  $('followBtn').setAttribute('aria-pressed',String(state.follow));
});
if($('cinemaBtn')){
  $('cinemaBtn').addEventListener('click',()=>{
    state.cinema=!state.cinema;
    $('cinemaBtn').setAttribute('aria-pressed',String(state.cinema));
    if(state.cinema){state.playing=true;$('play').textContent='Ⅱ';}
  });
}

for(const b of document.querySelectorAll('.modebtn')){
  b.addEventListener('click',()=>setMode(b.dataset.mode));
}

for(const b of document.querySelectorAll('[data-theme]'))b.addEventListener('click',()=>{
  state.theme=b.dataset.theme;
  for(const s of document.querySelectorAll('[data-theme]'))s.classList.toggle('active',s===b);
  $('worldLabel').textContent={volcanic:'VOLCANIC COAST',canyon:'RED CANYON',alpine:'ALPINE MORNING'}[state.theme];
  if(state.geo)state.scenery=generateProceduralScenery(state.geo.points,state.theme,24);
});

canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);state.drag={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointermove',e=>{
  if(!state.drag)return;
  state.yaw+=(e.clientX-state.drag.x)*.008;
  state.pitch=Math.max(.2,Math.min(1.35,state.pitch+(e.clientY-state.drag.y)*.006));
  state.drag={x:e.clientX,y:e.clientY};
});
canvas.addEventListener('pointerup',()=>state.drag=null);
canvas.addEventListener('pointercancel',()=>state.drag=null);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  state.zoom=Math.max(.5,Math.min(2.7,state.zoom*Math.exp(-e.deltaY*.001)));
},{passive:false});

// P1 Accessible Keyboard Navigation on 3D Canvas
canvas.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){e.preventDefault();state.yaw-=.08;draw();}
  else if(e.key==='ArrowRight'){e.preventDefault();state.yaw+=.08;draw();}
  else if(e.key==='ArrowUp'){e.preventDefault();state.pitch=Math.min(1.35,state.pitch+.06);draw();}
  else if(e.key==='ArrowDown'){e.preventDefault();state.pitch=Math.max(.2,state.pitch-.06);draw();}
  else if(e.key==='+'||e.key==='='){e.preventDefault();state.zoom=Math.min(2.7,state.zoom*1.1);draw();}
  else if(e.key==='-'||e.key==='_'){e.preventDefault();state.zoom=Math.max(.5,state.zoom/1.1);draw();}
  else if(e.key===' '){e.preventDefault();$('play').click();}
  else if(e.key==='r'||e.key==='R'){e.preventDefault();$('viewReset').click();}
});

$('shareBtn').addEventListener('click',()=>{
  try{
    const plan=planPrivateShare(state.rows,700,state.redactZones);
    if(!plan.segments.length){
      $('sourceState').textContent='Share export blocked: no safe continuous route remains after the 700 m endpoint and return-visit privacy zones.';
      $('sourceState').classList.add('error');
      return;
    }
    state.sharePlan=plan;
    state.share=true;
    draw();
    try{
      const a=document.createElement('a');
      a.download='stride-privacy-trimmed.png';
      a.href=canvas.toDataURL('image/png');
      a.click();
    }finally{
      state.share=false;
      state.sharePlan=null;
      draw();
    }
  }catch(e){
    $('sourceState').textContent='Could not export safely: '+e.message;
    $('sourceState').classList.add('error');
  }
});

// Optional local loopback catalog probe (only when running inside native STRIDE.app on 127.0.0.1)
if (typeof location !== 'undefined' && (location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
  fetch('/api/catalog', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(data => { if (data) state.reuseCatalog = data; })
    .catch(() => {});
}

ensureScene();
requestAnimationFrame(frame);
