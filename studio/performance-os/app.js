const SUPABASE_URL='https://mtvpnoqwjpoqaiocrklq.supabase.co';
const SUPABASE_KEY='sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u';
const SESSION_KEY='kona.supabase.session.v1';
const DATA_API='https://ep-old-unit-b2kpv7vr.apirest.c-6.eu-central-1.aws.neon.tech/performance_os/rest/v1';

const $=id=>document.getElementById(id);
const json=async r=>{
 const t=await r.text();
 let d=null;
 try{d=t?JSON.parse(t):null}catch{}
 if(!r.ok){
   const msg = d?.msg || d?.error_description || d?.message || d?.error || d?.hint || ('HTTP '+r.status);
   throw new Error(msg);
 }
 return d;
};
const baseHeaders=()=>({apikey:SUPABASE_KEY,'Content-Type':'application/json'});
const readSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
const saveSession=s=>{try{s?localStorage.setItem(SESSION_KEY,JSON.stringify(s)):localStorage.removeItem(SESSION_KEY)}catch{}};

function consumeUrlOrToken(raw){
 if(!raw) return false;
 let str = String(raw).trim();
 if(str.includes('#')) str = str.split('#')[1];
 if(str.includes('?')) str = str.split('?')[1];
 const h = new URLSearchParams(str);
 const token = h.get('access_token') || (str.startsWith('ey') ? str : null);
 if(token){
  const now = Math.floor(Date.now()/1000);
  const exp = Number(h.get('expires_in') || 3600);
  saveSession({
   access_token: token,
   refresh_token: h.get('refresh_token') || '',
   token_type: h.get('token_type') || 'bearer',
   expires_in: exp,
   expires_at: Number(h.get('expires_at') || (now + exp))
  });
  return true;
 }
 return false;
}

function consumeCallback(){
 if(consumeUrlOrToken(location.hash)) {
  history.replaceState(null, '', location.pathname + location.search);
  return true;
 }
 return false;
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
 const cleanEmail = String(email).trim().toLowerCase();
 return json(await fetch(SUPABASE_URL+'/auth/v1/otp',{
  method:'POST',
  headers:baseHeaders(),
  body:JSON.stringify({
   email: cleanEmail,
   create_user: true,
   email_redirect_to: location.origin + location.pathname
  })
 }));
}

async function verifyOtp(email, token){
 const cleanEmail = String(email).trim().toLowerCase();
 const cleanToken = String(token).trim().replace(/\s+/g, '');
 if(!cleanEmail) throw new Error('Please enter your email');
 if(!cleanToken) throw new Error('Please enter the 6-digit code');

 const d = await json(await fetch(SUPABASE_URL+'/auth/v1/verify',{
  method:'POST',
  headers:baseHeaders(),
  body:JSON.stringify({
   type: 'email',
   email: cleanEmail,
   token: cleanToken
  })
 }));
 if(d?.access_token){
  saveSession(d);
  return d;
 }
 throw new Error(d?.msg || d?.message || d?.error_description || 'Invalid or expired code');
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

function showTab(tab){
 $('tabCodeBtn').classList.toggle('active', tab === 'code');
 $('tabEmailBtn').classList.toggle('active', tab === 'email');
 $('tabPasteBtn').classList.toggle('active', tab === 'paste');

 $('otpBox').hidden = (tab !== 'code');
 $('loginForm').hidden = (tab !== 'email');
 $('pasteBox').hidden = (tab !== 'paste');
}

$('tabCodeBtn').addEventListener('click', ()=>showTab('code'));
$('tabEmailBtn').addEventListener('click', ()=>showTab('email'));
$('tabPasteBtn').addEventListener('click', ()=>showTab('paste'));

async function start(){
 consumeCallback();
 const u=await currentUser();
 if(!u){
  $('identityState').textContent='Enter your email or verification code to access Performance OS.';
  showTab('code');
  return;
 }
 $('identityState').textContent='Account linked. Loading your verified performance data…';
 try{render(await bootstrap())}
 catch(e){
  $('identityState').textContent='Data bridge issue: '+e.message;
  $('signOutBtn').hidden = false;
 }
}

// Handle Send Email
$('loginForm').addEventListener('submit', async e=>{
 e.preventDefault();
 const btn=e.currentTarget.querySelector('button');
 const email=$('emailInput').value.trim();
 btn.disabled=true;
 $('identityState').textContent='Sending code to '+email+'…';
 try{
  await sendMagicLink(email);
  $('otpEmailInput').value = email;
  $('identityState').textContent='Check your inbox for the 6-digit code or sign-in link.';
  showTab('code');
  $('otpInput').focus();
 }catch(err){
  if(String(err.message).includes('rate limit') || String(err.message).includes('429')){
   $('identityState').textContent='Email rate limit reached for new emails. If you already received a code earlier, enter it below:';
   $('otpEmailInput').value = email;
   showTab('code');
   $('otpInput').focus();
  } else {
   $('identityState').textContent=err.message;
  }
 }finally{
  btn.disabled=false;
 }
});

// Handle Verify OTP
async function handleVerify(){
 const email = $('otpEmailInput').value.trim();
 const code = $('otpInput').value.trim();
 if(!email){alert('Please enter your email');$('otpEmailInput').focus();return}
 if(!code){alert('Please enter the 6-digit code');$('otpInput').focus();return}

 const btn=$('verifyOtpBtn');
 btn.disabled=true;btn.textContent='Verifying…';
 $('identityState').textContent='Verifying code…';
 try{
  await verifyOtp(email, code);
  $('identityState').textContent='Authenticated. Loading Performance OS…';
  render(await bootstrap());
 }catch(err){
  $('identityState').textContent='Verification failed: '+err.message;
 }finally{
  btn.disabled=false;btn.textContent='Verify & Sign In';
 }
}

$('verifyOtpBtn').addEventListener('click', handleVerify);
$('otpInput').addEventListener('keydown', e=>{if(e.key==='Enter'){e.preventDefault();handleVerify()}});

// Handle Paste Link / Token
async function handlePaste(){
 const raw = $('pasteInput').value.trim();
 if(!raw){alert('Please paste the URL or token');return}
 const btn=$('verifyPasteBtn');
 btn.disabled=true;btn.textContent='Authenticating…';
 $('identityState').textContent='Extracting token…';
 try{
  if(!consumeUrlOrToken(raw)){
   throw new Error('Could not find an access token in the pasted text. Make sure you paste the full URL or JWT token.');
  }
  $('identityState').textContent='Token saved. Loading Performance OS…';
  render(await bootstrap());
 }catch(err){
  $('identityState').textContent=err.message;
 }finally{
  btn.disabled=false;btn.textContent='Sign In with Link / Token';
 }
}

$('verifyPasteBtn').addEventListener('click', handlePaste);

$('refreshBtn').addEventListener('click',async()=>{try{render(await bootstrap())}catch(e){alert(e.message)}});
$('signOutBtn').addEventListener('click',async()=>{const s=await validSession();if(s?.access_token)fetch(SUPABASE_URL+'/auth/v1/logout',{method:'POST',headers:{...baseHeaders(),Authorization:'Bearer '+s.access_token}}).catch(()=>{});saveSession(null);location.reload()});
$('themeBtn').addEventListener('click',()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark';document.querySelector('meta[name="theme-color"]').content=h.dataset.theme==='dark'?'#071018':'#F8F8F3'});

let installPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').hidden=false});
$('installBtn').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').hidden=true});

// 4. Service Worker: bypass cache on development/beta updates
if('serviceWorker'in navigator){
 navigator.serviceWorker.register('./sw.js').then(reg=>{
  reg.update().catch(()=>{});
 }).catch(()=>{});
}

start();
