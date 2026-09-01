(() => {
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),pretty=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const get=async u=>{try{const r=await fetch(u,{cache:'no-store'});return r.ok?await r.json():null}catch{return null}};
  const patterns=d=>(d?.cohorts||[]).flatMap(c=>(c.candidates||[]).map(x=>({...x,source:c.source}))).sort((a,b)=>(a.q_bh??1)-(b.q_bh??1)||Math.abs(b.phi||0)-Math.abs(a.phi||0));
  async function boot(){
    const [fed,media,pat,catalog]=await Promise.all([get('./religion-federation.json'),get('./museum-reference-media.json'),get('./pattern-candidates.json'),get('../data/reference/belief-catalog-v1.json')]);
    const s=fed?.summary||{};
    $('#homeState').textContent=`${Number(s.comparable_belief_system_profiles||0).toLocaleString()} comparable profiles · ${Number(s.accepted_semantic_assertions||0).toLocaleString()} accepted semantic assertions · research preview`;
    const entities=catalog?.entities||[], preferred=['GOD-ODIN','GOD-OSIRIS','GOD-ZEUS','GOD-ATHENA'];
    const featured=preferred.map(id=>entities.find(e=>e.id===id)).find(Boolean)||entities.find(e=>e.kind==='DEITY');
    const image=(media?.records||[]).find(r=>r.entity_id===featured?.id&&r.display_gate==='REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY')||(media?.records||[]).find(r=>r.display_gate==='REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY');
    if(featured){
      const roles=(featured.roles||[]).slice(0,6), aliases=(featured.aliases||[]).slice(0,3).join(' · ');
      $('#homeVisual').innerHTML=`<div class="clarity-feature-card"><div class="clarity-feature-media">${image?`<img src="${esc(image.image_url||image.thumbnail_url)}" alt="${esc(image.provider_title||featured.name)}" referrerpolicy="no-referrer">`:'<div class="fallback">◉</div>'}</div><div class="clarity-feature-copy"><div class="label">Worked example · decompose an entity</div><h3>${esc(featured.name)}</h3>${aliases?`<div class="aliases">${esc(aliases)}</div>`:''}<div class="clarity-role-list">${roles.map(r=>`<span>${esc(pretty(r))}</span>`).join('')}</div><a href="entity.html?id=${encodeURIComponent(featured.id)}">Open ${esc(featured.name)} → identity · components · connections · evidence</a>${image?`<div class="clarity-caveat">${esc(image.provider_title)} · ${esc(image.date_display||'undated')} · ${esc(image.rights)} · reference image, not scientific evidence</div>`:''}</div></div>`;
    }
    const rows=patterns(pat).slice(0,4);
    $('#homePatterns').innerHTML=rows.length?rows.map(x=>`<a class="clarity-pattern" href="lineages.html"><div><b>${esc(pretty(x.facet_a))} ↔ ${esc(pretty(x.facet_b))}</b><span>${esc(x.source)} · n=${Number(x.n_comparable||0).toLocaleString()} · descriptive candidate</span></div><em>φ ${Number(x.phi||0).toFixed(2)}</em></a>`).join(''):'<div class="empty">No defensible pattern candidates under the current screen.</div>';
    $('#homeSearch').addEventListener('submit',e=>{e.preventDefault();const q=$('#homeQ').value.trim();location.href=`explore.html${q?`?q=${encodeURIComponent(q)}`:''}`});
  }
  boot();
})();