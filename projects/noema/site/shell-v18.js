(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const page=document.body.dataset.page||'';
  const groups=[
    ['explore','Explore','explore.html',['explore','concept','gods','systems','rituals','altered']],
    ['atlas','Atlas','human-meaning-atlas.html',['atlas','deep-time','history']],
    ['analyze','Analyze','lineages.html',['lineages','patterns','compare','simulations']],
    ['library','Library','library.html',['library','entity']],
    ['research','Research','research.html',['research','health','pulse','drh','sources','cognition']]
  ];
  function active(){return groups.find(g=>g[3].includes(page))||groups[0]}
  function installSkip(){if(document.querySelector('.skip-link'))return;const a=document.createElement('a');a.className='skip-link';a.href='#main';a.textContent='Skip to main content';document.body.prepend(a);const main=document.getElementById('main');if(main&&!main.hasAttribute('tabindex'))main.tabIndex=-1}
  function nav(){const el=document.getElementById('appNav');if(!el)return;const a=active();el.innerHTML=`<div class="nav-primary">${groups.map(g=>`<a href="${g[2]}"${g===a?' class="active" aria-current="page"':''}>${g[1]}</a>`).join('')}</div>`}
  async function status(){const el=document.getElementById('globalStatus');if(!el)return;try{const r=await fetch('./data.json');if(!r.ok)throw new Error();const d=await r.json();el.innerHTML=`<span class="chip live">NOEMA ${esc(d.release||'research preview')}</span><span class="chip">${Number(d.counts?.comparable_belief_system_profiles||0).toLocaleString()} comparable profiles</span><span class="chip warn">research preview</span>`}catch{el.innerHTML='<span class="chip warn">research preview · status unavailable</span>'}}
  installSkip();nav();status();
})();
