const demos=[
['cursor-light','01','Cursor Light','Light becomes the interface. Move through a black stone museum and reveal a second exposure underneath.','Move the pointer'],
['cutaway-reveal','02','Cliff Cutaway','A sealed coastal fortress opens room by room into an inhabited refuge.','Click to open'],
['day-night-morph','03','Orbital Dawn','One landscape crosses from moonlit blue into a burning alien sunrise without losing spatial orientation.','Click to change state'],
['ambient-spill','04','Atmospheric Spill','The environment escapes its frame and illuminates the surrounding interface.','Move the pointer'],
['world-transition','05','World Run','The runner remains the anchor while the climate, colour and velocity of the world collapse into a new state.','Click to cross worlds'],
['camera-depth','06','Spatial Camera','A single architectural plate becomes a layered camera volume with independent depth velocities.','Move the pointer'],
['architectural-type','07','Type in Space','Typography sits behind architecture, reflects into the floor and behaves like another material in the room.','Move the pointer'],
['theatre-light','08','Theatre Awakening','An abandoned opera house wakes in a timed sequence of portals, practicals, ceiling light and atmospheric bloom.','Click to illuminate'],
['bioluminescence','09','Living Dark','Sparse emissive life creates a navigable path through darkness without flattening the scene.','Move the pointer'],
['interactive-hud','10','Expedition HUD','Glass instrumentation, spatial targeting and magnetic controls turn a cinematic world into an explorable interface.','Explore the scene']
];
const byId=Object.fromEntries(demos.map(d=>[d[0],d]));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const qs=(s,p=document)=>p.querySelector(s);

async function loadFrames(){
  const base=document.body.dataset.demo==='index'?'./assets/v2/chunks/':'../assets/v2/chunks/';
  const files=['sprite-00.b64','sprite-01.b64','sprite-02.b64','sprite-03.b64','sprite-04.b64','sprite-05.b64','sprite-06.b64'];
  const parts=await Promise.all(files.map(f=>fetch(new URL(base+f,location.href),{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(`asset ${f} ${r.status}`);return r.text()})));
  const img=new Image();
  img.decoding='async';
  img.src='data:image/webp;base64,'+parts.join('').trim();
  await img.decode();
  const cols=5,rows=2,cw=Math.floor(img.naturalWidth/cols),ch=Math.floor(img.naturalHeight/rows);
  const out=[];
  for(let i=0;i<10;i++){
    const c=document.createElement('canvas'); c.width=cw;c.height=ch;
    c.getContext('2d',{alpha:false}).drawImage(img,(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch,0,0,cw,ch);
    const blob=await new Promise(res=>c.toBlob(res,'image/webp',.92));
    out.push(URL.createObjectURL(blob));
  }
  return out;
}
function scene(url,cls=''){const el=document.createElement('div');el.className='scene '+cls;el.style.backgroundImage=`url("${url}")`;return el}
function base(id){
  const d=byId[id]; document.body.innerHTML=`<main class="experience" data-demo="${id}" id="exp"><div class="ambient"></div><div class="stage" id="stage"></div><div class="post"><i></i></div><div class="grain"></div><nav><a href="../">CALDAS / LAB</a><span>${d[1]} / 10</span></nav><section class="copy"><small>Commercial motion study</small><h1>${d[2]}</h1><p>${d[3]}</p></section><div class="instruction">${d[4]}</div><div class="pointer"><b></b></div></main>`;
  return {d,exp:qs('#exp'),stage:qs('#stage')};
}
function pointerPhysics(exp,onFrame){let tx=.5,ty=.5,x=.5,y=.5,px=.5,py=.5,v=0;const loop=()=>{x+=(tx-x)*.075;y+=(ty-y)*.075;v+=(Math.hypot(x-px,y-py)-v)*.18;px=x;py=y;exp.style.setProperty('--mx',`${x*100}%`);exp.style.setProperty('--my',`${y*100}%`);exp.style.setProperty('--x',(x-.5).toFixed(4));exp.style.setProperty('--y',(y-.5).toFixed(4));exp.style.setProperty('--velocity',clamp(v*80,0,1).toFixed(3));onFrame?.(x,y,v);requestAnimationFrame(loop)};addEventListener('pointermove',e=>{tx=e.clientX/innerWidth;ty=e.clientY/innerHeight},{passive:true});loop()}
function toggle(exp,cb){addEventListener('click',e=>{if(e.target.closest('a,.magnetic'))return;exp.classList.toggle('active');cb?.(exp.classList.contains('active'))})}
function mountScenes(stage,urls,a,b){const s0=scene(urls[a],'primary'),s1=scene(urls[b],'secondary');stage.append(s0,s1);return[s0,s1]}
function initCursor(ctx,F){const [dark,lit]=mountScenes(ctx.stage,F,0,1);lit.classList.add('spotlight-reveal');ctx.exp.dataset.theme='gold';const halo=document.createElement('div');halo.className='cursor-light-halo';ctx.stage.append(halo);pointerPhysics(ctx.exp,(x,y,v)=>ctx.exp.style.setProperty('--spot',`${220+v*150}px`))}
function initCutaway(ctx,F){mountScenes(ctx.stage,F,2,3);ctx.exp.dataset.theme='amber';const facade=document.createElement('div');facade.className='cutaway-facade';for(let i=0;i<8;i++){const p=document.createElement('i');p.style.setProperty('--i',i);facade.append(p)}ctx.stage.append(facade);toggle(ctx.exp);pointerPhysics(ctx.exp)}
function initDayNight(ctx,F){mountScenes(ctx.stage,F,4,5);ctx.exp.dataset.theme='blue';const flare=document.createElement('div');flare.className='sun-flare';ctx.stage.append(flare);toggle(ctx.exp,on=>ctx.exp.dataset.theme=on?'sun':'blue');pointerPhysics(ctx.exp)}
function initAmbient(ctx,F){const s=scene(F[3],'ambient-hero');ctx.stage.append(s);ctx.exp.dataset.theme='amber';const frame=document.createElement('div');frame.className='editorial-frame';ctx.stage.append(frame);pointerPhysics(ctx.exp,(x,y)=>{ctx.exp.style.setProperty('--hue',Math.round(20+x*55));s.style.transform=`translate3d(${(x-.5)*-20}px,${(y-.5)*-12}px,0) scale(1.055)`})}
function initWorld(ctx,F){mountScenes(ctx.stage,F,8,9);ctx.exp.dataset.theme='gold';const streak=document.createElement('div');streak.className='speed-streaks';ctx.stage.append(streak);let lock=false;addEventListener('click',async e=>{if(e.target.closest('a'))return;if(lock)return;lock=true;ctx.exp.classList.add('switching');await sleep(420);ctx.exp.classList.toggle('active');ctx.exp.dataset.theme=ctx.exp.classList.contains('active')?'ice':'gold';await sleep(650);ctx.exp.classList.remove('switching');lock=false});pointerPhysics(ctx.exp)}
function initDepth(ctx,F){ctx.exp.dataset.theme='amber';const back=scene(F[3],'depth back'),mid=scene(F[3],'depth mid'),front=scene(F[3],'depth front');ctx.stage.append(back,mid,front);pointerPhysics(ctx.exp)}
function initType(ctx,F){ctx.exp.dataset.theme='gold';const bg=scene(F[1],'type-bg');const type=document.createElement('div');type.className='architectural-word';type.innerHTML='<span>ECLIPSE</span><i>ECLIPSE</i>';const occlude=scene(F[1],'type-occluder');ctx.stage.append(bg,type,occlude);pointerPhysics(ctx.exp)}
function initTheatre(ctx,F){mountScenes(ctx.stage,F,6,7);ctx.exp.dataset.theme='blue';const lights=document.createElement('div');lights.className='theatre-practicals';for(let i=0;i<10;i++){const l=document.createElement('i');l.style.setProperty('--i',i);lights.append(l)}ctx.stage.append(lights);toggle(ctx.exp,on=>ctx.exp.dataset.theme=on?'sun':'blue');pointerPhysics(ctx.exp)}
function initBio(ctx,F){const dark=scene(F[2],'bio-scene');ctx.stage.append(dark);ctx.exp.dataset.theme='bio';const field=document.createElement('div');field.className='bio-field';for(let i=0;i<58;i++){const p=document.createElement('i');p.className=i%7===0?'cap':'spore';p.style.left=`${5+Math.random()*90}%`;p.style.top=`${22+Math.random()*70}%`;p.style.setProperty('--delay',`${Math.random()*-6}s`);p.style.setProperty('--scale',(.55+Math.random()*1.3).toFixed(2));field.append(p)}ctx.stage.append(field);pointerPhysics(ctx.exp,(x,y)=>field.style.transform=`translate3d(${(x-.5)*-13}px,${(y-.5)*-8}px,0)`)}
function initHud(ctx,F){const bg=scene(F[4],'hud-scene');ctx.stage.append(bg);ctx.exp.dataset.theme='blue';const hud=document.createElement('div');hud.className='hud-panel';hud.innerHTML='<small>SECTOR 04 · TELEMETRY LIVE</small><strong>North Crater Observatory</strong><p>Atmosphere 0.7 kPa<br>Surface −118°C<br>Signal stable</p><a href="#" class="magnetic">Enter archive <b>↗</b></a>';const target=document.createElement('button');target.className='spatial-target';target.setAttribute('aria-label','Target observatory');ctx.stage.append(hud,target);const btn=qs('.magnetic',hud);addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.hypot(dx,dy);btn.style.setProperty('--bx',d<130?`${clamp(dx*.12,-14,14)}px`:'0px');btn.style.setProperty('--by',d<130?`${clamp(dy*.12,-10,10)}px`:'0px')},{passive:true});pointerPhysics(ctx.exp)}

function initIndex(F){document.body.className='index-page';document.body.innerHTML=`<main class="index"><header><small>CALDAS STUDIO / MOTION SYSTEMS</small><h1>Light. Space.<br><em>Behaviour.</em></h1><p>Ten commercial interaction studies built around generated cinematic environments. Each scene is art-directed for the effect rather than used as a decorative background.</p></header><section class="cards">${demos.map((d,i)=>`<a href="./${d[0]}/" class="card" data-i="${i}"><div class="thumb"></div><span>${d[1]}</span><h2>${d[2]}</h2><p>${d[3]}</p></a>`).join('')}</section></main>`;document.querySelectorAll('.card').forEach((c,i)=>{qs('.thumb',c).style.backgroundImage=`url("${F[[0,2,4,3,8,3,1,6,2,4][i]]}")`})}

(async()=>{const loader=document.createElement('div');loader.className='preloader';loader.innerHTML='<i></i><span>Composing environment</span>';document.body.append(loader);try{const F=await loadFrames();window.__COMMERCIAL_FRAMES=F;loader.classList.add('done');setTimeout(()=>loader.remove(),700);const id=document.body.dataset.demo||'index';if(id==='index')initIndex(F);else{const ctx=base(id);({
'cursor-light':initCursor,'cutaway-reveal':initCutaway,'day-night-morph':initDayNight,'ambient-spill':initAmbient,'world-transition':initWorld,'camera-depth':initDepth,'architectural-type':initType,'theatre-light':initTheatre,'bioluminescence':initBio,'interactive-hud':initHud
}[id])(ctx)}}catch(err){console.error(err);loader.innerHTML='<span>Environment failed to load</span>';document.body.dataset.assetError='1'}})();
