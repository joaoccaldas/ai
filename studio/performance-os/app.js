const SUPABASE_URL='https://mtvpnoqwjpoqaiocrklq.supabase.co';
const SUPABASE_KEY='sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u';
const SESSION_KEY='kona.supabase.session.v1';
const DATA_API='https://ep-old-unit-b2kpv7vr.apirest.c-6.eu-central-1.aws.neon.tech/performance_os/rest/v1';

const $=id=>document.getElementById(id);
const json=async r=>{const t=await r.text();let d=null;try{d=t?JSON.parse(t):null}catch{}if(!r.ok)throw new Error(d?.message||d?.error_description||d?.error||d?.hint||('HTTP '+r.status));return d};
const baseHeaders=()=>({apikey:SUPABASE_KEY,'Content-Type':'application/json'});
const readSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
const saveSession=s=>{try{s?localStorage.setItem(SESSION_KEY,JSON.stringify(s)):localStorage.removeItem(SESSION_KEY)}catch{}};

let pendingEmail='';

function consumeCallback(){
 const h=new URLSearchParams(location.hash.replace(/^#/,''));
 if(!h.get('access_token'))return false;
 const now=Math.floor(Date.now()/1000);
 saveSession({access_token:h.get('access_token'),refresh_token:h.get('refresh_token'),token_type:h.get('token_type')||'bearer',expires_in:Number(h.get('expires_in')||3600),expires_at:Number(h.get('expires_at')||(now+Number(h.get('expires_in')||3600)))});
 history.replaceState(null,'',location.pathname+location.search);
 return true;
}
async function refreshSession(s){
 if(!s?.refresh_token)return null;
 try{
  const d=await json(await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:baseHeaders(),body:JSON.stringify({refresh_token:s.refresh_token})}));
  saveSession(d);return d;
 }catch{saveSession(null);return null}
}
async function validSession(){
 let s=readSession();if(!s?.access_token)return null;
 if(Number(s.expires_at||0)*1000<Date.now()+60000)s=await refreshSession(s);
 return s;
}
async function currentUser(){
 const s=await validSession();if(!s)return null;
 try{return await json(await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{...baseHeaders(),Authorization:'Bearer '+s.access_token}}))}
 catch{saveSession(null);return null}
}
async function sendMagicLink(email){
 pendingEmail=String(email).trim().toLowerCase();
 return json(await fetch(SUPABASE_URL+'/auth/v1/otp',{
  method:'POST',
  headers:baseHeaders(),
  body:JSON.stringify({
   email:pendingEmail,
   create_user:true,
   email_redirect_to:location.origin+location.pathname
  })
 }));
}
async function verifyOtp(token){
 if(!pendingEmail)pendingEmail=$('emailInput').value.trim().toLowerCase();
 if(!pendingEmail)throw new Error('Please enter your email first');
 const cleanToken=String(token).trim().replace(/\s+/g,'');
 const d=await json(await fetch(SUPABASE_URL+'/auth/v1/verify',{
  method:'POST',
  headers:baseHeaders(),
  body:JSON.stringify({
   type:'email',
   email:pendingEmail,
   token:cleanToken
  })
 }));
 if(d?.access_token){
  saveSession(d);
  return d;
 }
 throw new Error(d?.message||d?.error_description||'Invalid or expired code');
}
async function bootstrap(){
 const s=await validSession();if(!s)throw new Error('Sign in first');
 return json(await fetch(DATA_API+'/rpc/bootstrap',{method:'POST',headers:{Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:'{}'}));
}
const age=t=>{if(!t)return 'never';const ms=Date.now()-new Date(t).getTime();if(ms<0)return 'just now';const h=Math.floor(ms/36e5);if(h<1)return Math.max(1,Math.floor(ms/6e4))+'m ago';if(h<48)return h+'h ago';return Math.floor(h/24)+'d ago'};
const fmtNum=(v,d=0)=>v==null?'—':Number(v).toFixed(d);
function render(data){
 $('gate').hidden=true;$('app').hidden=false;
 const t=data.today||{},a=data.latest_activity||{},f=data.freshness||{};
 $('freshnessText').textContent='Health '+age(f.health)+' · activity '+age(f.activity);
 $('todayTitle').textContent=t.day?'Latest verified day':'Data connection';
 $('todayMeta').textContent=t.day?new Date(t.day).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}):'No daily metric received yet';
 $('rhr').textContent=fmtNum(t.resting_hr);
 $('hrv').textContent=fmtNum(t.hrv_rmssd);
 $('sleep').textContent=t.sleep_s==null?'—':fmtNum(t.sleep_s/3600,1);
 $('activity').textContent=a.sport?String(a.sport).replaceAll('_',' '):'—';
 const bits=[];if(a.distance_meters)bits.push((a.distance_meters/1000).toFixed(1)+' km');if(a.average_heart_rate)bits.push(Math.round(a.average_heart_rate)+' bpm');if(a.average_power_watts)bits.push(Math.round(a.average_power_watts)+' W');
 $('activityMeta').textContent=bits.join(' · ')||'canonical activity';
 const box=$('sourcesList');box.replaceChildren();
 (data.sources||[]).forEach(s=>{const row=document.createElement('div');row.className='source';const left=document.createElement('div');const b=document.createElement('b');b.textContent=s.provider;const sm=document.createElement('small');sm.textContent=s.last_sync_at?' · '+age(s.last_sync_at):' · never synced';left.append(b,sm);const st=document.createElement('span');st.className='state '+String(s.status||'').toLowerCase();st.textContent=s.status||'unknown';row.append(left,st);box.append(row)});
}
async function start(){
 consumeCallback();
 const u=await currentUser();
 if(!u){
  $('identityState').textContent='Enter your email to sign in or register.';
  $('loginForm').hidden=false;return;
 }
 $('identityState').textContent='Linked account detected. Loading Performance OS…';
 try{render(await bootstrap())}
 catch(e){$('identityState').textContent='Account linked, but data bridge returned: '+e.message;$('loginForm').hidden=true}
}

$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const btn=e.currentTarget.querySelector('button');
 const email=$('emailInput').value.trim();
 btn.disabled=true;
 $('identityState').textContent='Sending code to '+email+'…';
 try{
  await sendMagicLink(email);
  $('sentEmailDisplay').textContent=email;
  $('identityState').textContent='Check your email for the 6-digit code or sign-in link.';
  $('loginForm').hidden=true;
  $('otpBox').hidden=false;
  $('otpInput').value='';
  $('otpInput').focus();
 }catch(err){
  $('identityState').textContent=err.message;
 }finally{
  btn.disabled=false;
 }
});

async function handleVerify(){
 const code=$('otpInput').value.trim();
 if(!code){alert('Please enter the 6-digit code');return}
 const btn=$('verifyOtpBtn');
 btn.disabled=true;btn.textContent='Verifying…';
 $('identityState').textContent='Verifying code…';
 try{
  await verifyOtp(code);
  $('otpBox').hidden=true;
  $('identityState').textContent='Authenticated. Loading Performance OS…';
  render(await bootstrap());
 }catch(err){
  $('identityState').textContent='Verification failed: '+err.message;
 }finally{
  btn.disabled=false;btn.textContent='Verify & Sign In';
 }
}

$('verifyOtpBtn').addEventListener('click',handleVerify);
$('otpInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handleVerify()}});

$('backToEmailBtn').addEventListener('click',()=>{
 $('otpBox').hidden=true;
 $('loginForm').hidden=false;
 $('identityState').textContent='Enter your email to sign in or register.';
 $('emailInput').focus();
});

$('refreshBtn').addEventListener('click',async()=>{try{render(await bootstrap())}catch(e){alert(e.message)}});
$('signOutBtn').addEventListener('click',async()=>{const s=await validSession();if(s?.access_token)fetch(SUPABASE_URL+'/auth/v1/logout',{method:'POST',headers:{...baseHeaders(),Authorization:'Bearer '+s.access_token}}).catch(()=>{});saveSession(null);location.reload()});
$('themeBtn').addEventListener('click',()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark';document.querySelector('meta[name="theme-color"]').content=h.dataset.theme==='dark'?'#071018':'#F8F8F3'});

let installPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').hidden=false});
$('installBtn').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').hidden=true});

if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
start();
