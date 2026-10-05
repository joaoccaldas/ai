(() => {
  const tools=document.querySelector('.browse-tools'); if (!tools) return;
  const cards=[...document.querySelectorAll('.project-card')], buttons=[...document.querySelectorAll('[data-filter]')];
  const input=document.getElementById('project-search'), count=document.getElementById('project-count'), empty=document.getElementById('no-results');
  const params=new URLSearchParams(location.search);
  let filter=buttons.some(b=>b.dataset.filter===params.get('category'))?params.get('category'):'all';
  input.value=params.get('q')||'';
  function apply() {
    const query=input.value.trim().toLowerCase(); let visible=0;
    for (const c of cards) { c.hidden=!(filter==='all'||c.dataset.category===filter)||!c.dataset.search.includes(query); if(!c.hidden) visible++; }
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
    count.textContent=`${visible} ${visible===1?'project':'projects'}`; empty.hidden=visible>0;
    const u=new URL(location.href); filter==='all'?u.searchParams.delete('category'):u.searchParams.set('category',filter);
    query?u.searchParams.set('q',input.value.trim()):u.searchParams.delete('q');
    history.replaceState(null,'',u);
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;apply();}));
  input.addEventListener('input',apply);
  document.getElementById('clear-filters').onclick=()=>{filter='all';input.value='';apply();input.focus();};
  tools.hidden=false;apply();
})();
