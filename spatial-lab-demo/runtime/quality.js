export function qualityProfile(name='auto',env={}){
  const coarse=env.coarse??false;
  const cores=Number(env.cores||4);
  const memory=Number(env.memory||4);
  const short=Number(env.short||800);
  let tier=name;
  if(tier==='auto')tier=(coarse||short<700||cores<=4||memory<=4)?'balanced':(cores>=8&&memory>=8?'high':'balanced');
  const profile={
    low:{dpr:.9,shadow:false,foveation:.8},
    balanced:{dpr:1.25,shadow:false,foveation:.55},
    high:{dpr:1.7,shadow:true,foveation:.3},
    ultra:{dpr:2,shadow:true,foveation:.1}
  }[tier]||{dpr:1.25,shadow:false,foveation:.55};
  const sceneCap=Number(env.caps?.[tier]);
  return {tier,...profile,dpr:Number.isFinite(sceneCap)?sceneCap:profile.dpr};
}

export function percentile95(samples=[]){
  if(!samples.length)return null;
  const sorted=[...samples].filter(Number.isFinite).sort((a,b)=>a-b);
  if(!sorted.length)return null;
  return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))];
}

export function nextAutoDpr({p95,current,cap,min=.75}={}){
  if(!Number.isFinite(p95)||!Number.isFinite(current)||!Number.isFinite(cap))return current;
  if(p95>20.5&&current>min)return Math.max(min,Math.round((current-.1)*100)/100);
  if(p95<14.5&&current<cap)return Math.min(cap,Math.round((current+.05)*100)/100);
  return current;
}
