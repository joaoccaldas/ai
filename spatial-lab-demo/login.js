const SUPA_URL="https://mtvpnoqwjpoqaiocrklq.supabase.co";
const SUPA_KEY="sb_publishable_lVueu3GqNcPe4Z9KsChvJw_VfmnVi5u";
const form=document.querySelector('#login');
const status=document.querySelector('#status');
const safeNext=()=>{const v=new URLSearchParams(location.search).get('next')||'/';return v.startsWith('/')&&!v.startsWith('//')?v:'/';};
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const button=form.querySelector('button'); button.disabled=true; status.textContent='Verifying identity…';
  try{
    const data=new FormData(form);
    const response=await fetch(SUPA_URL+'/auth/v1/token?grant_type=password',{
      method:'POST',
      headers:{apikey:SUPA_KEY,'content-type':'application/json'},
      body:JSON.stringify({email:String(data.get('email')||'').trim(),password:String(data.get('password')||'')})
    });
    if(!response.ok)throw new Error('credentials');
    const auth=await response.json();
    const gate=await fetch('/api/session',{method:'POST',headers:{authorization:'Bearer '+auth.access_token}});
    if(gate.status===403)throw new Error('owner');
    if(!gate.ok)throw new Error('gate');
    location.replace(safeNext());
  }catch(error){
    status.textContent=error.message==='owner'?'This confirmed account is not authorized for Spatial Lab.':'Sign-in failed. Check the account and password.';
    form.querySelector('[name=password]').value='';
  }finally{button.disabled=false;}
});
const recover=document.querySelector('#recover');
recover.addEventListener('click',async()=>{
  const email=String(new FormData(form).get('email')||'').trim();
  if(!email||!email.includes('@')){status.textContent='Enter your KONA account email first.';return;}
  recover.disabled=true; status.textContent='Requesting a reset link…';
  try{
    const redirect='https://joaoccaldas.github.io/konam/index.html';
    const response=await fetch(SUPA_URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(redirect),{
      method:'POST',
      headers:{apikey:SUPA_KEY,'content-type':'application/json'},
      body:JSON.stringify({email})
    });
    if(response.status===429){status.textContent='Too many reset requests. Check your inbox for an earlier link, then try again later.';return;}
    if(!response.ok)throw new Error('recover');
    status.textContent='If that KONA account exists, check your email. Reset the password in KONA, then return here and sign in.';
  }catch{
    status.textContent='Password reset could not be requested right now.';
  }finally{recover.disabled=false;}
});
