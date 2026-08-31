(() => {
  const results=document.getElementById('results');
  if(!results) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let byEntity=new Map(),ready=false;
  const load=async()=>{try{const r=await fetch('./museum-reference-media.json',{cache:'no-store'});if(!r.ok)return;const d=await r.json();for(const x of d.records||[]){if(x.display_gate!=='REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY')continue;if(!byEntity.has(x.entity_id))byEntity.set(x.entity_id,x)}ready=true;decorate()}catch{ready=true}};
  function decorate(){
    if(!ready)return;
    for(const card of results.querySelectorAll('.card')){
      if(card.dataset.visualCard==='1')continue;
      const link=card.querySelector('a.title[href*="entity.html?id="]');if(!link)continue;
      const u=new URL(link.href,location.href),id=u.searchParams.get('id'),m=byEntity.get(id);
      card.dataset.visualCard='1';card.classList.add('vc-result-card');
      if(!m)continue;
      const fig=document.createElement('a');fig.className='vc-card-media';fig.href=link.href;fig.innerHTML=`<img src="${esc(m.thumbnail_url||m.image_url)}" alt="${esc(m.provider_title||link.textContent)}" referrerpolicy="no-referrer"><span>${esc(m.rights)} · museum reference</span>`;
      fig.querySelector('img').addEventListener('error',()=>fig.remove());
      card.prepend(fig);
    }
  }
  new MutationObserver(decorate).observe(results,{childList:true,subtree:true});
  load();decorate();
})();
