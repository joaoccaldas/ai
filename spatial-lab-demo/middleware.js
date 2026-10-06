const SUPA_URL="https://mtvpnoqwjpoqaiocrklq.supabase.co";
const SUPA_KEY="sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u";
const OWNER_ID="a0468c5f-ea3c-4e59-9c7f-201c0131bea9";
const PUBLIC=new Set(['/login.html','/login.js','/favicon.ico','/api/session','/api/logout','/api/health','/api/source-health']);
function cookie(req,name){
  for(const part of (req.headers.get('cookie')||'').split(/;\s*/)){
    const i=part.indexOf('=');
    if(i>0&&part.slice(0,i)===name)return decodeURIComponent(part.slice(i+1));
  }
  return '';
}
async function authorized(req){
  const token=cookie(req,'spatial_token'); if(!token)return false;
  try{
    const r=await fetch(SUPA_URL+'/auth/v1/user',{headers:{apikey:SUPA_KEY,authorization:'Bearer '+token},cache:'no-store'});
    if(!r.ok)return false;
    const user=await r.json();
    return user.id===OWNER_ID;
  }catch{return false;}
}
export const config={matcher:'/:path*'};
export default async function middleware(req){
  const url=new URL(req.url);
  if(PUBLIC.has(url.pathname))return;
  if(await authorized(req))return;
  if(url.pathname.startsWith('/api/'))return new Response(JSON.stringify({ok:false,error:'sign_in_required'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
  const login=new URL('/login.html',url.origin); login.searchParams.set('next',url.pathname+url.search);
  return Response.redirect(login,302);
}