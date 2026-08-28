import {monoFromBuffer,rms,estimateTempo,estimateKey,energyProfile,findHook,compatibility,targetTempo,buildPlans,formatTime,encodeWav} from './dsp.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={ctx:null,tracks:{A:null,B:null},nodes:{},plans:[],activePlan:null,timers:[],startedAt:0,anim:null,installPrompt:null,streamDest:null,recorder:null,chunks:[]};
const media={A:$('#mediaA'),B:$('#mediaB')};

function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3300);}
function ensureCtx(){if(!state.ctx){state.ctx=new (window.AudioContext||window.webkitAudioContext)();state.streamDest=state.ctx.createMediaStreamDestination();}if(state.ctx.state==='suspended')state.ctx.resume();return state.ctx;}
function cleanupTrack(id){const t=state.tracks[id];if(t?.url)URL.revokeObjectURL(t.url);media[id].pause();media[id].removeAttribute('src');media[id].load();state.tracks[id]=null;delete state.nodes[id];$(`#file${id}`).value='';$(`#loaded${id}`).hidden=true;$(`#drop${id}`).hidden=false;document.querySelector(`[data-remove="${id}"]`).hidden=true;resetPair();}
function resetPair(){stopPlayback();$('#analysisPanel').hidden=true;$('#ideasPanel').hidden=true;$('#transportPanel').hidden=true;state.plans=[];state.activePlan=null;if(state.tracks.A&&state.tracks.B)showPair();}

function panText(v){v=+v;if(Math.abs(v)<.06)return 'Center';return v<0?`L ${Math.round(-v*100)}`:`R ${Math.round(v*100)}`;}
for(const id of ['A','B']){
  $(`#vol${id}`).addEventListener('input',e=>{$(`#volOut${id}`).value=`${Math.round(e.target.value*100)}%`;if(state.nodes[id])state.nodes[id].gain.gain.value=+e.target.value;});
  $(`#pan${id}`).addEventListener('input',e=>{$(`#panOut${id}`).value=panText(e.target.value);if(state.nodes[id])state.nodes[id].pan.pan.value=+e.target.value;});
  $(`#file${id}`).addEventListener('change',e=>e.target.files[0]&&loadFile(id,e.target.files[0]));
  const zone=$(`#drop${id}`);['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag')}));['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('drag')}));zone.addEventListener('drop',e=>e.dataTransfer.files[0]&&loadFile(id,e.dataTransfer.files[0]));
}
$$('.remove-track').forEach(b=>b.addEventListener('click',()=>cleanupTrack(b.dataset.remove)));

async function loadFile(id,file){
  try{
    ensureCtx();toast(`Analyzing ${file.name}…`);$(`#drop${id}`).hidden=true;$(`#loaded${id}`).hidden=false;$(`#name${id}`).textContent=file.name;$(`#metrics${id}`).innerHTML='<div class="metric"><small>Status</small><strong>Analyzing…</strong></div>';
    const isVideo=file.type.startsWith('video/')||/\.(mp4|mov|mkv|webm)$/i.test(file.name);$(`#kind${id}`).textContent=isVideo?'VIDEO → AUDIO':'AUDIO';
    const url=URL.createObjectURL(file);media[id].src=url;media[id].preservesPitch=true;media[id].mozPreservesPitch=true;media[id].webkitPreservesPitch=true;
    const ab=await file.arrayBuffer();let buffer;
    try{buffer=await state.ctx.decodeAudioData(ab.slice(0));}catch(err){throw new Error(isVideo?'This video codec cannot be decoded by this browser. Try MP4/AAC, MOV/AAC, WebM/Opus, or extract the audio first.':'This audio codec cannot be decoded by this browser.');}
    const mono=monoFromBuffer(buffer,180),tempo=estimateTempo(mono,buffer.sampleRate),key=estimateKey(mono,buffer.sampleRate),profile=energyProfile(mono,buffer.sampleRate),energy=rms(mono),hook=findHook(profile,buffer.duration);
    const track={id,file,url,buffer,isVideo,bpm:tempo.bpm||120,beatOffset:tempo.beatOffset,key,profile,energy:Math.min(1,energy/.28),hook,duration:buffer.duration,tempoConfidence:tempo.confidence};
    state.tracks[id]=track;drawWave(id,buffer,profile);renderMetrics(id,track);document.querySelector(`[data-remove="${id}"]`).hidden=false;
    $(`#note${id}`).textContent=`${isVideo?'Audio extracted locally. ':''}Hook candidate ${formatTime(hook)} · tempo confidence ${Math.round(tempo.confidence*100)}% · key confidence ${Math.round(key.confidence*100)}%`;
    toast(`${id} ready · ${track.bpm.toFixed(1)} BPM · ${track.key.label}`);resetPair();
  }catch(err){console.error(err);toast(err.message||'Could not decode that file.');cleanupTrack(id);}
}

function renderMetrics(id,t){
  $(`#metrics${id}`).innerHTML=[['Tempo',`${t.bpm.toFixed(1)} BPM`],['Key',t.key.label],['Length',formatTime(t.duration)],['Hook',formatTime(t.hook)]].map(([k,v])=>`<div class="metric"><small>${k}</small><strong>${v}</strong></div>`).join('');
}
function drawWave(id,buffer,profile){
  const canvas=$(`#wave${id}`),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,data=buffer.getChannelData(0),step=Math.max(1,Math.floor(data.length/w));ctx.clearRect(0,0,w,h);ctx.fillStyle='#0b0e13';ctx.fillRect(0,0,w,h);ctx.strokeStyle=id==='A'?'#b9ff66':'#65d9ff';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<w;x++){let min=1,max=-1;for(let i=0;i<step;i++){const v=data[x*step+i]||0;if(v<min)min=v;if(v>max)max=v;}const y1=(1+min)*h/2,y2=(1+max)*h/2;ctx.moveTo(x,y1);ctx.lineTo(x,y2);}ctx.stroke();const hook=state.tracks[id]?.hook||0;if(hook){ctx.fillStyle='rgba(255,255,255,.65)';const x=hook/buffer.duration*w;ctx.fillRect(x,0,2,h);}
}

function showPair(){
  const a=state.tracks.A,b=state.tracks.B,c=compatibility(a,b),target=targetTempo(a,b);$('#analysisPanel').hidden=false;$('#pairScore').textContent=c.total;$('#scoreRing').style.borderColor=c.total>80?'var(--lime)':c.total>65?'var(--cyan)':'var(--purple)';
  $('#compatGrid').innerHTML=[['Tempo',c.tempo],['Harmony',c.harmony],['Energy',c.energy],['Structure',c.structure]].map(([k,v])=>`<div class="compat-item"><span>${k}<b>${v}%</b></span><div class="bar"><i style="width:${v}%"></i></div></div>`).join('');
  $('#targetBpm').value=target;$('#targetBpmOut').value=`${target.toFixed(1)} BPM`;
}
$('#targetBpm').addEventListener('input',e=>$('#targetBpmOut').value=`${(+e.target.value).toFixed(1)} BPM`);
$('#autoTarget').addEventListener('click',()=>{const t=targetTempo(state.tracks.A,state.tracks.B);$('#targetBpm').value=t;$('#targetBpmOut').value=`${t.toFixed(1)} BPM`;});
$('#generateBtn').addEventListener('click',generateIdeas);

function generateIdeas(){
  const a=state.tracks.A,b=state.tracks.B,target=+$('#targetBpm').value;state.plans=buildPlans(a,b,target);const c=compatibility(a,b);$('#ideasPanel').hidden=false;$('#ideas').innerHTML=state.plans.map((p,i)=>`<article class="idea" data-plan="${p.id}"><div class="idea-top"><span class="idea-tag">${p.tag}</span><span class="idea-score">${Math.max(50,Math.min(99,c.total+(i===1?3:i===2?-3:1)))}% fit</span></div><h3>${p.name}</h3><p>${p.description}</p><div class="idea-details"><span>${p.target.toFixed(1)} BPM</span><span>A ${formatTime(p.startA)}</span><span>B ${formatTime(p.startB)}</span><span>${Math.round(p.fade/(60/p.target*4))} bar blend</span></div><button class="ghost choose-plan" data-plan="${p.id}">Preview this</button></article>`).join('');
  $$('.choose-plan').forEach(b=>b.addEventListener('click',()=>activatePlan(b.dataset.plan,true)));$('#ideasPanel').scrollIntoView({behavior:'smooth',block:'start'});
}

function setupNodes(){
  const ctx=ensureCtx();for(const id of ['A','B'])if(!state.nodes[id]){const source=ctx.createMediaElementSource(media[id]),gain=ctx.createGain(),pan=ctx.createStereoPanner();source.connect(gain).connect(pan).connect(ctx.destination);pan.connect(state.streamDest);gain.gain.value=+$(`#vol${id}`).value;pan.pan.value=+$(`#pan${id}`).value;state.nodes[id]={source,gain,pan};}
}
function activatePlan(id,autoplay=false){state.activePlan=state.plans.find(p=>p.id===id);if(!state.activePlan)return;$$('.idea').forEach(x=>x.classList.toggle('selected',x.dataset.plan===id));$('#transportPanel').hidden=false;$('#activePlanName').textContent=state.activePlan.name;$('#activePlanDesc').textContent=state.activePlan.description;renderTimeline(state.activePlan);if(autoplay){$('#transportPanel').scrollIntoView({behavior:'smooth',block:'start'});playPlan();}}
function renderTimeline(p){const aStart=0,bStart=p.delayB,total=p.duration;$('#laneA').style.marginLeft=`${aStart/total*100}%`;$('#laneA').style.width=`${Math.max(12,(total-aStart)/total*100)}%`;$('#laneB').style.marginLeft=`${Math.min(88,bStart/total*100)}%`;$('#laneB').style.width=`${Math.max(12,(total-bStart)/total*100)}%`;$('#transportMeta').innerHTML=[`Target ${p.target.toFixed(1)} BPM`,`A rate ${(p.target/state.tracks.A.bpm).toFixed(3)}×`,`B rate ${(p.target/state.tracks.B.bpm).toFixed(3)}×`,`Blend ${p.fade.toFixed(1)}s`].map(x=>`<span>${x}</span>`).join('');}

function clearTimers(){state.timers.forEach(clearTimeout);state.timers=[];cancelAnimationFrame(state.anim);}
function stopPlayback(){clearTimers();for(const id of ['A','B']){media[id].pause();try{media[id].currentTime=0}catch{}}$('#playhead').style.left='39px';}
function setGain(id,value,time=0){const n=state.nodes[id];if(!n)return;n.gain.gain.cancelScheduledValues(state.ctx.currentTime);if(time<=0)n.gain.gain.setValueAtTime(value,state.ctx.currentTime);else{n.gain.gain.setValueAtTime(n.gain.gain.value,state.ctx.currentTime);n.gain.gain.linearRampToValueAtTime(value,state.ctx.currentTime+time);}}
async function playPlan(){
  if(!state.activePlan)return;setupNodes();stopPlayback();const p=state.activePlan,a=state.tracks.A,b=state.tracks.B,elA=media.A,elB=media.B;elA.playbackRate=Math.max(.75,Math.min(1.35,p.target/a.bpm));elB.playbackRate=Math.max(.75,Math.min(1.35,p.target/b.bpm));elA.currentTime=Math.min(p.startA,Math.max(0,a.duration-1));elB.currentTime=Math.min(p.startB,Math.max(0,b.duration-1));
  setGain('A',p.gainA);setGain('B',0);await elA.play();state.startedAt=performance.now();
  const enter=()=>{elB.play().catch(console.warn);setGain('B',p.gainB,p.fade);if(p.id!=='double')setGain('A',p.gainA*.28,p.fade);};
  if(p.delayB<=.05)enter();else state.timers.push(setTimeout(enter,p.delayB*1000));state.timers.push(setTimeout(()=>stopPlayback(),p.duration*1000));animatePlayhead(p.duration);
}
function animatePlayhead(duration){const tick=()=>{const elapsed=(performance.now()-state.startedAt)/1000,p=Math.max(0,Math.min(1,elapsed/duration));const timeline=$('#timeline'),left=39+p*(timeline.clientWidth-55);$('#playhead').style.left=`${left}px`;if(p<1)state.anim=requestAnimationFrame(tick);};state.anim=requestAnimationFrame(tick);}
$('#playBtn').addEventListener('click',playPlan);$('#pauseBtn').addEventListener('click',()=>{clearTimers();media.A.pause();media.B.pause();});$('#stopBtn').addEventListener('click',stopPlayback);

$('#recordBtn').addEventListener('click',async()=>{
  if(!state.activePlan)return;setupNodes();if(!window.MediaRecorder){toast('MediaRecorder is unavailable in this browser.');return;}if(state.recorder?.state==='recording'){state.recorder.stop();return;}
  const type=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm';state.chunks=[];state.recorder=new MediaRecorder(state.streamDest.stream,{mimeType:type});state.recorder.ondataavailable=e=>e.data.size&&state.chunks.push(e.data);state.recorder.onstop=()=>{const blob=new Blob(state.chunks,{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`mashlab-${state.activePlan.id}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);$('#recordBtn').textContent='Record pitch-safe preview';toast('Pitch-safe recording saved.');};state.recorder.start(1000);$('#recordBtn').textContent='Stop & save recording';await playPlan();state.timers.push(setTimeout(()=>{if(state.recorder?.state==='recording')state.recorder.stop();},state.activePlan.duration*1000+300));
});

$('#exportWavBtn').addEventListener('click',async()=>{
  if(!state.activePlan)return;try{toast('Rendering WAV…');const p=state.activePlan,a=state.tracks.A,b=state.tracks.B,sr=44100,len=Math.ceil(p.duration*sr),offline=new OfflineAudioContext(2,len,sr);const master=offline.createGain();master.gain.value=.78;master.connect(offline.destination);
    const add=(track,start,delay,gainVal,fade,isB)=>{const src=offline.createBufferSource();src.buffer=track.buffer;src.playbackRate.value=Math.max(.75,Math.min(1.35,p.target/track.bpm));const g=offline.createGain(),pan=offline.createStereoPanner();pan.pan.value=+$(isB?'#panB':'#panA').value;src.connect(g).connect(pan).connect(master);const t0=delay;if(isB){g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(gainVal,t0+fade);}else{g.gain.setValueAtTime(gainVal,0);if(p.id!=='double'){g.gain.setValueAtTime(gainVal,t0);g.gain.linearRampToValueAtTime(gainVal*.28,t0+fade);}}src.start(delay,start);};
    add(a,p.startA,0,p.gainA,p.fade,false);add(b,p.startB,p.delayB,p.gainB,p.fade,true);const rendered=await offline.startRendering(),blob=encodeWav([rendered.getChannelData(0),rendered.getChannelData(1)],sr),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`mashlab-${p.id}.wav`;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('WAV saved.');
  }catch(err){console.error(err);toast('WAV render failed on this device. Try pitch-safe recording instead.');}
});

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;$('#installBtn').hidden=false;});$('#installBtn').addEventListener('click',async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;$('#installBtn').hidden=true;});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
