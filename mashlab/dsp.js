export const NOTE_NAMES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];

export function formatTime(seconds){
  if(!Number.isFinite(seconds)) return '--:--';
  const m=Math.floor(seconds/60), s=Math.floor(seconds%60);
  return `${m}:${String(s).padStart(2,'0')}`;
}

export function monoFromBuffer(buffer, maxSeconds=180){
  const sr=buffer.sampleRate;
  const n=Math.min(buffer.length,Math.floor(sr*maxSeconds));
  const out=new Float32Array(n);
  for(let c=0;c<buffer.numberOfChannels;c++){
    const data=buffer.getChannelData(c);
    for(let i=0;i<n;i++) out[i]+=data[i]/buffer.numberOfChannels;
  }
  return out;
}

export function rms(samples){
  let s=0; const step=Math.max(1,Math.floor(samples.length/500000)); let n=0;
  for(let i=0;i<samples.length;i+=step){const v=samples[i];s+=v*v;n++;}
  return Math.sqrt(s/Math.max(1,n));
}

function resampleEnvelope(samples,sr,windowSec=.02){
  const w=Math.max(64,Math.floor(sr*windowSec));
  const len=Math.floor(samples.length/w);
  const env=new Float32Array(len);
  let prev=0;
  for(let j=0;j<len;j++){
    let e=0; const start=j*w;
    for(let i=0;i<w;i++){const v=samples[start+i]||0;e+=v*v;}
    e=Math.sqrt(e/w);
    env[j]=Math.max(0,e-prev*.78);
    prev=e;
  }
  return {env,rate:1/windowSec};
}

export function estimateTempo(samples,sr,minBpm=72,maxBpm=178){
  const {env,rate}=resampleEnvelope(samples,sr,.02);
  if(env.length<100) return {bpm:null,confidence:0,beatOffset:0};
  let mean=0; for(const v of env) mean+=v; mean/=env.length;
  const centered=new Float32Array(env.length);
  for(let i=0;i<env.length;i++) centered[i]=Math.max(0,env[i]-mean*.7);
  const minLag=Math.floor(rate*60/maxBpm),maxLag=Math.ceil(rate*60/minBpm);
  let bestLag=minLag,best=-Infinity,second=-Infinity;
  for(let lag=minLag;lag<=maxLag;lag++){
    let score=0,n=0;
    for(let i=lag;i<centered.length;i+=2){score+=centered[i]*centered[i-lag];n++;}
    score/=Math.max(1,n);
    if(score>best){second=best;best=score;bestLag=lag}else if(score>second) second=score;
  }
  let bpm=60*rate/bestLag;
  while(bpm<80)bpm*=2; while(bpm>170)bpm/=2;
  let maxOnset=-1,idx=0; const scan=Math.min(centered.length,Math.floor(rate*10));
  for(let i=0;i<scan;i++){if(centered[i]>maxOnset){maxOnset=centered[i];idx=i;}}
  const confidence=Math.max(0,Math.min(1,(best-second)/(Math.abs(best)+1e-9)*3));
  return {bpm:Math.round(bpm*10)/10,confidence,beatOffset:idx/rate};
}

function goertzel(frame,sr,freq){
  const w=2*Math.PI*freq/sr, coeff=2*Math.cos(w); let s0=0,s1=0,s2=0;
  for(let i=0;i<frame.length;i++){const win=.5-.5*Math.cos(2*Math.PI*i/(frame.length-1));s0=frame[i]*win+coeff*s1-s2;s2=s1;s1=s0;}
  const p=s1*s1+s2*s2-coeff*s1*s2; return Math.max(0,p);
}

export function estimateKey(samples,sr){
  if(samples.length<4096) return {label:'Unknown',confidence:0,root:0,mode:'major'};
  const chroma=new Float64Array(12), frameSize=2048,segments=18;
  for(let seg=0;seg<segments;seg++){
    const center=Math.floor((seg+.5)/segments*samples.length),start=Math.max(0,Math.min(samples.length-frameSize,center-frameSize/2));
    const frame=samples.subarray(start,start+frameSize);
    for(let pc=0;pc<12;pc++){
      let energy=0;
      for(let octave=2;octave<=5;octave++){
        const midi=12*(octave+1)+pc, freq=440*Math.pow(2,(midi-69)/12);
        if(freq<sr*.45) energy+=goertzel(frame,sr,freq);
      }
      chroma[pc]+=Math.log1p(energy);
    }
  }
  const major=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
  const minor=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
  const corr=(profile,root)=>{let a=0,b=0,c=0,d=0,e=0;for(let i=0;i<12;i++){const x=chroma[i],y=profile[(i-root+12)%12];a+=x*y;b+=x;c+=y;d+=x*x;e+=y*y;}return (12*a-b*c)/Math.sqrt(Math.max(1e-9,(12*d-b*b)*(12*e-c*c)));};
  let best={score:-2,root:0,mode:'major'},second=-2;
  for(let r=0;r<12;r++) for(const mode of ['major','minor']){const score=corr(mode==='major'?major:minor,r);if(score>best.score){second=best.score;best={score,root:r,mode};}else if(score>second) second=score;}
  return {label:`${NOTE_NAMES[best.root]} ${best.mode}`,root:best.root,mode:best.mode,confidence:Math.max(0,Math.min(1,(best.score-second)*4))};
}

export function energyProfile(samples,sr,windowSec=2){
  const w=Math.max(256,Math.floor(sr*windowSec)),count=Math.ceil(samples.length/w),values=[];
  let max=1e-9;
  for(let j=0;j<count;j++){let s=0,n=0;for(let i=j*w;i<Math.min(samples.length,(j+1)*w);i+=4){const v=samples[i];s+=v*v;n++;}const e=Math.sqrt(s/Math.max(1,n));values.push(e);max=Math.max(max,e);}
  return values.map((v,i)=>({time:i*windowSec,value:v/max}));
}

export function findHook(profile,duration,windowSec=16){
  if(!profile.length) return 0;
  const step=profile.length>1?profile[1].time-profile[0].time:2,span=Math.max(1,Math.floor(windowSec/step));
  let best=-1,bestI=0;
  for(let i=0;i<=profile.length-span;i++){let s=0;for(let j=0;j<span;j++) s+=profile[i+j].value;const pos=(profile[i].time/Math.max(1,duration));const edgePenalty=pos<.08||pos>.9?.7:1;const score=(s/span)*edgePenalty;if(score>best){best=score;bestI=i;}}
  return profile[bestI].time;
}

export function keyDistance(a,b){
  if(!a||!b) return 6;
  const d=Math.min((a.root-b.root+12)%12,(b.root-a.root+12)%12);
  let score=100-d*11;
  if(a.root===b.root&&a.mode===b.mode) score=100;
  if(a.root===b.root&&a.mode!==b.mode) score=91;
  const relative=((a.mode==='major'&&((a.root+9)%12)===b.root&&b.mode==='minor')||(a.mode==='minor'&&((a.root+3)%12)===b.root&&b.mode==='major'));
  if(relative) score=96;
  if(d===5||d===7) score=Math.max(score,84);
  return Math.max(25,Math.min(100,score));
}

export function compatibility(a,b){
  const tempoDiff=Math.abs(a.bpm-b.bpm)/Math.max(a.bpm,b.bpm);
  const tempo=Math.max(20,100-tempoDiff*260);
  const harmony=keyDistance(a.key,b.key);
  const energy=Math.max(25,100-Math.abs(a.energy-b.energy)*150);
  const structure=Math.max(55,100-Math.abs((a.hook/a.duration)-(b.hook/b.duration))*70);
  const total=Math.round(tempo*.32+harmony*.30+energy*.18+structure*.20);
  return {total,tempo:Math.round(tempo),harmony:Math.round(harmony),energy:Math.round(energy),structure:Math.round(structure)};
}

export function targetTempo(a,b){
  const candidates=[a.bpm,b.bpm,(a.bpm+b.bpm)/2];
  let best=candidates[0],score=Infinity;
  for(const t of candidates){const cost=Math.abs(Math.log(t/a.bpm))+Math.abs(Math.log(t/b.bpm));if(cost<score){score=cost;best=t;}}
  return Math.round(best*10)/10;
}

export function buildPlans(a,b,target){
  const beat=60/target,bar=beat*4;
  const align=(t)=>Math.max(0,t-(t%bar));
  const hookA=align(a.hook),hookB=align(b.hook);
  return [
    {id:'smooth',tag:'CLEAN',name:'Smooth handoff',description:'Let A establish the groove, bring B in on a phrase boundary, then hand the room over without a hard cut.',target,delayB:bar*16,startA:0,startB:Math.max(0,hookB-bar*8),fade:bar*8,duration:Math.min(120,Math.max(55,bar*32)),gainA:.85,gainB:.78},
    {id:'hook',tag:'MASHUP',name:'Hook exchange',description:'Jump near A’s strongest section and introduce B’s detected hook after eight bars for a more obvious mashup.',target,delayB:bar*8,startA:Math.max(0,hookA-bar*4),startB:hookB,fade:bar*4,duration:Math.min(95,Math.max(45,bar*24)),gainA:.78,gainB:.82},
    {id:'double',tag:'ENERGY',name:'Double drop',description:'Launch both high-energy regions together and use stereo space plus level balance to create the densest combination.',target,delayB:0,startA:hookA,startB:hookB,fade:bar*2,duration:Math.min(75,Math.max(35,bar*20)),gainA:.68,gainB:.68}
  ];
}

export function encodeWav(channels,sampleRate){
  const numChannels=channels.length,length=channels[0].length,bytes=44+length*numChannels*2,buffer=new ArrayBuffer(bytes),view=new DataView(buffer);
  const write=(o,s)=>{for(let i=0;i<s.length;i++) view.setUint8(o+i,s.charCodeAt(i));};
  write(0,'RIFF');view.setUint32(4,36+length*numChannels*2,true);write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,numChannels,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*numChannels*2,true);view.setUint16(32,numChannels*2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,length*numChannels*2,true);
  let off=44;for(let i=0;i<length;i++)for(let c=0;c<numChannels;c++){let s=Math.max(-1,Math.min(1,channels[c][i]));s=s<0?s*0x8000:s*0x7fff;view.setInt16(off,s,true);off+=2;}
  return new Blob([buffer],{type:'audio/wav'});
}
