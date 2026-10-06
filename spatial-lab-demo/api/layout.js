const SUPA_URL='https://mtvpnoqwjpoqaiocrklq.supabase.co';
const SUPA_KEY='sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u';
const OWNER_ID='a0468c5f-ea3c-4e59-9c7f-201c0131bea9';
const SCENE_ID='scene:spatial-lab:world-zero-r0';
const PANEL_IDS=new Set(['caldas-agents','kona-world','performance-live']);

function cookie(req,name){
  const raw=String(req.headers.cookie||'');
  for(const part of raw.split(/;\s*/)){const i=part.indexOf('=');if(i>0&&part.slice(0,i)===name)return decodeURIComponent(part.slice(i+1));}
  return '';
}
async function owner(req){
  const token=cookie(req,'spatial_token');if(!token)return null;
  try{
    const r=await fetch(SUPA_URL+'/auth/v1/user',{headers:{apikey:SUPA_KEY,authorization:'Bearer '+token}});
    if(!r.ok)return null;
    const user=await r.json();
    return user.id===OWNER_ID?{token,user}:null;
  }catch{return null;}
}
const finite=(v,min,max)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null};
function vector(arr,len,min,max){
  if(!Array.isArray(arr)||arr.length!==len)return null;
  const out=arr.map(v=>finite(v,min,max));
  return out.every(v=>v!==null)?out:null;
}
function validateLayout(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const panels=input.panels;
  if(!panels||typeof panels!=='object'||Array.isArray(panels))return null;
  const keys=Object.keys(panels);
  if(keys.length>PANEL_IDS.size||keys.some(k=>!PANEL_IDS.has(k)))return null;
  const clean={panels:{}};
  for(const id of keys){
    const raw=panels[id];
    if(!raw||typeof raw!=='object')return null;
    const position=vector(raw.position,3,-20,20);
    const quaternion=vector(raw.quaternion,4,-1.001,1.001);
    const scale=finite(raw.scale,.45,2.5);
    if(!position||!quaternion||scale===null)return null;
    const norm=Math.hypot(...quaternion);
    if(norm<.9||norm>1.1)return null;
    clean.panels[id]={position,quaternion,scale,docked:raw.docked===true};
  }
  return clean;
}
export default async function handler(req,res){
  if(!['GET','PUT'].includes(req.method))return res.status(405).json({ok:false,error:'method_not_allowed'});
  const identity=await owner(req);if(!identity)return res.status(401).json({ok:false,error:'sign_in_required'});
  if(req.method==='GET'){
    try{
      const url=SUPA_URL+'/rest/v1/spatial_layout_state?select=scene_id,schema_version,layout,updated_at&scene_id=eq.'+encodeURIComponent(SCENE_ID)+'&limit=1';
      const r=await fetch(url,{headers:{apikey:SUPA_KEY,authorization:'Bearer '+identity.token}});
      if(!r.ok)return res.status(502).json({ok:false,error:'layout_read_failed'});
      const rows=await r.json();const row=Array.isArray(rows)?rows[0]:null;
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json({ok:true,layout:row?.layout||null,schema_version:row?.schema_version||1,updated_at:row?.updated_at||null});
    }catch{return res.status(502).json({ok:false,error:'layout_read_failed'});}
  }
  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{return res.status(400).json({ok:false,error:'invalid_json'})}}
  const layout=validateLayout(body?.layout);
  if(!layout)return res.status(400).json({ok:false,error:'invalid_layout'});
  const row={user_id:identity.user.id,scene_id:SCENE_ID,schema_version:1,layout,updated_at:new Date().toISOString()};
  try{
    const url=SUPA_URL+'/rest/v1/spatial_layout_state?on_conflict=user_id,scene_id';
    const r=await fetch(url,{
      method:'POST',
      headers:{apikey:SUPA_KEY,authorization:'Bearer '+identity.token,'content-type':'application/json',prefer:'resolution=merge-duplicates,return=representation'},
      body:JSON.stringify(row)
    });
    if(!r.ok){console.error('layout_write_failed',r.status);return res.status(502).json({ok:false,error:'layout_write_failed'});}
    const data=await r.json();const saved=Array.isArray(data)?data[0]:data;
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ok:true,updated_at:saved?.updated_at||row.updated_at});
  }catch{return res.status(502).json({ok:false,error:'layout_write_failed'});}
}
