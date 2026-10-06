const SUPA_URL="https://mtvpnoqwjpoqaiocrklq.supabase.co";
const SUPA_KEY="sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u";
const OWNER_ID="a0468c5f-ea3c-4e59-9c7f-201c0131bea9";
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const auth=String(req.headers.authorization||'');
  if(!auth.startsWith('Bearer '))return res.status(401).json({ok:false,error:'sign_in_required'});
  const token=auth.slice(7).trim();
  try{
    const r=await fetch(SUPA_URL+'/auth/v1/user',{headers:{apikey:SUPA_KEY,authorization:'Bearer '+token}});
    if(!r.ok)return res.status(401).json({ok:false,error:'invalid_identity'});
    const user=await r.json();
    if(user.id!==OWNER_ID)return res.status(403).json({ok:false,error:'not_authorized'});
    res.setHeader('Set-Cookie','spatial_token='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600');
    res.setHeader('Cache-Control','no-store');
    return res.status(204).end();
  }catch{return res.status(503).json({ok:false,error:'identity_provider_unavailable'});}
}