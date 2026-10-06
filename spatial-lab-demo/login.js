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