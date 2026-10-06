const SUPA_URL='https://mtvpnoqwjpoqaiocrklq.supabase.co';
const SUPA_KEY='sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u';
const OWNER_ID='a0468c5f-ea3c-4e59-9c7f-201c0131bea9';
const SCENES=new Set(['scene:spatial-lab:world-zero-r0','scene:spatial-lab:bellagio-lobby-r0']);
const MODES=new Set(['auto','low','balanced','high','ultra']);
const TIERS=new Set(['low','balanced','high','ultra']);
function cookie(req,name){
  const raw=String(req.headers.cookie||'');
  for(const part of raw.split(/;\s*/)){const i=part.indexOf('=');if(i>0&&part.slice(0,i)===name)return decodeURIComponent(part.slice(i+1));}
  return '';
}
const finite=(v,min,max)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null};
const integer=(v,min,max)=>{const n=Number(v);return Number.isInteger(n)&&n>=min&&n<=max?n:null};
async function owner(req){
  const token=cookie(req,'spatial_token');if(!token)return null;
  try{
    const r=await fetch(SUPA_URL+'/auth/v1/user',{headers:{apikey:SUPA_KEY,authorization:'Bearer '+token}});
    if(!r.ok)return null;
    const user=await r.json();
    if(user.id!==OWNER_ID)return null;
    return {token,user};
  }catch{return null;}
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const identity=await owner(req);if(!identity)return res.status(401).json({ok:false,error:'sign_in_required'});
  const release=String(process.env.VERCEL_GIT_COMMIT_SHA||'');
  if(!/^[0-9a-f]{40}$/.test(release))return res.status(503).json({ok:false,error:'release_identity_unavailable'});
  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{return res.status(400).json({ok:false,error:'invalid_json'})}}
  if(!body||typeof body!=='object')return res.status(400).json({ok:false,error:'invalid_body'});
  const sceneId=String(body.scene_id||'');
  const qualityMode=String(body.quality_mode||'');
  const qualityTier=body.quality_tier==null?null:String(body.quality_tier);
  if(!SCENES.has(sceneId)||!MODES.has(qualityMode)||(qualityTier!==null&&!TIERS.has(qualityTier)))return res.status(400).json({ok:false,error:'invalid_dimension'});
  const row={
    user_id:identity.user.id,
    scene_id:sceneId,
    release_sha:release,
    asset_state:body.asset_state==null?null:String(body.asset_state).slice(0,64),
    quality_mode:qualityMode,
    quality_tier:qualityTier,
    dpr:finite(body.dpr,.25,4),
    approx_fps:finite(body.approx_fps,.1,240),
    avg_ms:finite(body.avg_ms,.1,1000),
    p50_ms:finite(body.p50_ms,.1,1000),
    p95_ms:finite(body.p95_ms,.1,1000),
    p99_ms:finite(body.p99_ms,.1,1000),
    draw_calls:integer(body.draw_calls,0,1000000),
    triangles:integer(body.triangles,0,10000000000),
    viewport_width:integer(body.viewport_width,1,20000),
    viewport_height:integer(body.viewport_height,1,20000),
    hardware_concurrency:body.hardware_concurrency==null?null:integer(body.hardware_concurrency,1,1024),
    device_memory_gb:body.device_memory_gb==null?null:finite(body.device_memory_gb,.1,2048),
    webxr:body.webxr===true,
    webgpu:body.webgpu===true
  };
  for(const key of ['dpr','approx_fps','avg_ms','p50_ms','p95_ms','p99_ms','draw_calls','triangles','viewport_width','viewport_height']){
    if(row[key]===null)return res.status(400).json({ok:false,error:'invalid_metric',field:key});
  }
  if(body.hardware_concurrency!=null&&row.hardware_concurrency===null)return res.status(400).json({ok:false,error:'invalid_metric',field:'hardware_concurrency'});
  if(body.device_memory_gb!=null&&row.device_memory_gb===null)return res.status(400).json({ok:false,error:'invalid_metric',field:'device_memory_gb'});
  try{
    const r=await fetch(SUPA_URL+'/rest/v1/spatial_benchmarks',{
      method:'POST',
      headers:{apikey:SUPA_KEY,authorization:'Bearer '+identity.token,'content-type':'application/json',prefer:'return=representation'},
      body:JSON.stringify(row)
    });
    if(!r.ok){console.error('benchmark_write_failed',r.status);return res.status(502).json({ok:false,error:'evidence_store_failed'});}
    const data=await r.json();const saved=Array.isArray(data)?data[0]:data;
    res.setHeader('Cache-Control','no-store');
    return res.status(201).json({ok:true,id:saved?.id||null,created_at:saved?.created_at||null,release_sha:release});
  }catch(error){
    console.error('benchmark_write_error',String(error?.message||error));
    return res.status(502).json({ok:false,error:'evidence_store_failed'});
  }
}
