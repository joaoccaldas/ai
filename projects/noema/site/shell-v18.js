(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const page=document.body.dataset.page||'';
  const groups=[
    ['home','Home','index.html',['home']],
    ['explore','Explore','explore.html',['explore','concept','gods','systems','rituals','altered','entity']],
    ['atlas','Atlas','human-meaning-atlas.html',['atlas','deep-time','history']],
    ['connections','Connections','lineages.html',['lineages','patterns','compare','simulations']],
    ['research','Research','research.html',['research','health','pulse','drh','sources','cognition','library','review']]
  ];
  function active(){return groups.find(g=>g[3].includes(page))||null}
  function installSkip(){if(document.querySelector('.skip-link'))return;const a=document.createElement('a');a.className='skip-link';a.href='#main';a.textContent='Skip to content';document.body.prepend(a);const main=document.getElementById('main');if(main&&!main.hasAttribute('tabindex'))main.tabIndex=-1}
  function nav(){const el=document.getElementById('appNav');if(!el)return;const a=active();el.setAttribute('aria-label','Primary');el.innerHTML=`<div class="nav-primary">${groups.map(g=>`<a href="${g[2]}"${a&&g===a?' class="active" aria-current="page"':''}>${g[1]}</a>`).join('')}</div>`;if(window.noemaMountNav)window.noemaMountNav()}
  async function status(){const el=document.getElementById('globalStatus');if(!el)return;if(page==='explore'){el.innerHTML='<p class="nm-quiet">A working shelf. The count is coverage, not proof.</p>';return}try{const r=await fetch('./data.json');if(!r.ok)throw new Error();const d=await r.json();el.innerHTML=`<span class="chip live">NOEMA ${esc(d.release||'research preview')}</span><span class="chip">${Number(d.counts?.comparable_belief_system_profiles||0).toLocaleString()} comparable profiles</span><span class="chip warn">research preview</span>`}catch{el.innerHTML='<span class="chip warn">research preview · status unavailable</span>'}}
  installSkip();nav();status();
})();
