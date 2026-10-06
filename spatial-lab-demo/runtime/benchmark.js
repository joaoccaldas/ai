export function percentile(samples=[],p=.95){
  const sorted=[...samples].filter(Number.isFinite).sort((a,b)=>a-b);
  if(!sorted.length)return null;
  const q=Math.max(0,Math.min(1,Number(p)||0));
  return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))];
}
export function summarizeFrames(samples=[]){
  const clean=samples.filter(v=>Number.isFinite(v)&&v>0);
  if(!clean.length)return null;
  const avg=clean.reduce((a,b)=>a+b,0)/clean.length;
  return {
    samples:clean.length,
    avgMs:avg,
    p50Ms:percentile(clean,.5),
    p95Ms:percentile(clean,.95),
    p99Ms:percentile(clean,.99),
    approxFps:1000/avg
  };
}
