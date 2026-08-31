(() => {
  const root = document.getElementById('entityRoot');
  if (!root) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pretty = v => String(v || '').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const id = new URLSearchParams(location.search).get('id');
  const json = async u => { try { const r=await fetch(u,{cache:'no-store'}); return r.ok ? await r.json() : null } catch { return null } };

  function timeLabel(e){
    const t=e?.time||{};
    if(t.start_bce!=null || t.end_bce!=null || t.start_ce!=null || t.end_ce!=null){
      const fmt=(bce,ce,edge)=>{ if(bce!=null) return `${Number(bce).toLocaleString()} BCE`; if(ce!=null) return `${Number(ce).toLocaleString()} CE`; return edge==='end'?'present / unresolved':'unresolved' };
      return [fmt(t.start_bce,t.start_ce,'start'),fmt(t.end_bce,t.end_ce,'end')];
    }
    if(e?.year_from!=null || e?.year_to!=null) return [e.year_from ?? 'unresolved',e.year_to ?? 'present / unresolved'];
    return ['historical scope unresolved','historical scope unresolved'];
  }
  function monogram(name){const parts=String(name||'?').trim().split(/\s+/);return parts.slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || '?'}
  function graphSvg(e, byId){
    const related=(e.related_entities||[]).map(x=>byId.get(x)).filter(Boolean).slice(0,10);
    if(!related.length) return '<div class="empty">No direct reference-neighborhood edges encoded yet.</div>';
    const W=700,H=220,cx=350,cy=110,R=82;let lines='',nodes='';
    related.forEach((r,i)=>{const a=(Math.PI*2*i/related.length)-Math.PI/2,x=cx+Math.cos(a)*R*2.2,y=cy+Math.sin(a)*R;lines+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#314753" stroke-width="1"/>`;nodes+=`<a href="entity.html?id=${encodeURIComponent(r.id)}"><circle cx="${x}" cy="${y}" r="7" fill="#111e27" stroke="#54717f"/><text x="${x+11}" y="${y+4}" fill="#cbd6db" font-size="10">${esc(r.name)}</text></a>`});
    return `<svg class="vc-mini-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Direct reference neighborhood">${lines}<circle cx="${cx}" cy="${cy}" r="12" fill="#17303a" stroke="#83dce5"/><text x="${cx+18}" y="${cy+4}" fill="#f4f7f8" font-size="11">${esc(e.name)}</text>${nodes}</svg>`;
  }
  function installTabs(){
    const heads=[...root.querySelectorAll('.sectionhead')]; if(!heads.length || root.querySelector('.vc-section-tabs')) return;
    const tabs=[]; heads.forEach((h,i)=>{const title=h.querySelector('h2')?.textContent?.trim()||`Section ${i+1}`,sid=`vc-section-${i+1}`;h.id=sid;tabs.push(`<a href="#${sid}">${esc(title)}</a>`)});
    const nav=document.createElement('nav');nav.className='vc-section-tabs';nav.innerHTML=tabs.join('');root.querySelector('.entity-hero')?.insertAdjacentElement('afterend',nav);
  }
  function museumRecords(media){return (media?.records||[]).filter(x=>x.entity_id===id && x.display_gate==='REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY').map(x=>({...x,media_source_class:'INSTITUTION_OPEN_ACCESS'}))}
  function commonsRecords(media){return (media?.items||[]).filter(x=>x.entity_id===id && x.identity_status==='SOURCE_VERIFIED' && x.rights_status==='SOURCE_VERIFIED' && x.evidence_status==='REFERENCE_ONLY_NOT_EVIDENCE').map(x=>({
    entity_id:x.entity_id,entity_name:x.entity_name,provider:'WIKIMEDIA_COMMONS',provider_title:x.title,provider_page_url:x.source_page_url,image_url:x.image_url,thumbnail_url:x.image_url,date_display:x.collection||'',creator:x.creator_or_photographer||'',place:'',medium:x.media_class,credit:'',rights:x.license,display_class:x.media_class,evidence_status:'NOT_EVIDENCE',media_source_class:'SOURCE_VERIFIED_COMMONS',epistemic_note:x.description
  }))}
  function mediaCaption(r){return `<strong>${esc(r.provider_title)}</strong><br>${esc(r.date_display||r.medium||'Source-verified reference')} · ${esc(pretty(r.provider))}<br><span style="color:#83d19a">${esc(r.rights)}</span> · reference depiction, not evidence · <a href="${esc(r.provider_page_url)}" target="_blank" rel="noopener">source + rights ↗</a>`}

  async function enhance(){
    if(root.dataset.visualCore==='ready' || !root.querySelector('.entity-hero')) return;
    root.dataset.visualCore='ready';
    const [catalog,museum,commons]=await Promise.all([json('../data/reference/belief-catalog-v1.json'),json('./museum-reference-media.json'),json('../data/reference/media-reviewed-v1.json')]);
    const entities=catalog?.entities||[],byId=new Map(entities.map(e=>[e.id,e])),e=byId.get(id) || {id,name:root.querySelector('.entity-name')?.textContent||id,kind:'ENTITY'};
    const records=[...museumRecords(museum),...commonsRecords(commons)],primary=records[0]||null,[start,end]=timeLabel(e),related=(e.related_entities||[]).length,roles=(e.roles||[]).length,regions=(e.regions||[]).length,sources=(e.sources||[]).length;

    const visual=document.createElement('section');visual.className='vc-media-strip';visual.innerHTML=`<div class="vc-media-frame" id="vcMediaFrame">${primary?`<img src="${esc(primary.image_url)}" alt="${esc(primary.provider_title || e.name)}" referrerpolicy="no-referrer">`:`<div class="vc-media-placeholder"><strong>${esc(monogram(e.name))}</strong></div>`}<div class="vc-media-caption">${primary?mediaCaption(primary):'No source-verified reusable reference image has been published for this entity yet. The visual fallback is not a historical depiction.'}</div></div><div class="panel"><div class="eyebrow">Entity lenses</div><div class="vc-entity-lenses"><div class="vc-lens"><small>Type</small><b>${esc(pretty(e.kind))}</b><span>identity layer</span></div><div class="vc-lens"><small>Regions</small><b>${regions}</b><span>reference regions</span></div><div class="vc-lens"><small>Roles</small><b>${roles}</b><span>coded associations</span></div><div class="vc-lens"><small>Neighbors</small><b>${related}</b><span>direct reference links</span></div><div class="vc-lens"><small>Media</small><b>${records.length}</b><span>verified reference visuals</span></div><div class="vc-lens"><small>Sources</small><b>${sources}</b><span>identity references</span></div></div><div class="sectionhead" style="margin-top:18px"><div><div class="eyebrow">Historical scope</div><h2>Time is part of identity</h2></div></div><div class="vc-timeline"><div class="range"></div><label>${esc(start)}</label><label>${esc(end)}</label></div><div class="sectionhead" style="margin-top:20px"><div><div class="eyebrow">Reference graph</div><h2>Immediate neighborhood</h2></div><a class="btn" href="lineages.html?focus=${encodeURIComponent(id)}">open graph →</a></div>${graphSvg(e,byId)}<div class="notice" style="margin-top:10px">A visible reference edge means “catalogued association,” not historical descent. Diffusion, ancestry, convergence and contact require separate evidence-gated relationship records.</div></div>`;
    root.prepend(visual);
    const img=visual.querySelector('img');img?.addEventListener('error',()=>{const frame=document.getElementById('vcMediaFrame');if(frame)frame.innerHTML=`<div class="vc-media-placeholder"><strong>${esc(monogram(e.name))}</strong></div><div class="vc-media-caption">Reference image could not be loaded. NOEMA has fallen back to a non-historical visual marker.</div>`});
    if(records.length>1){
      const chooser=document.createElement('div');chooser.className='vc-media-chooser';chooser.innerHTML=records.map((r,i)=>`<button type="button" data-i="${i}" class="${i===0?'active':''}" title="${esc(r.provider_title)}">${i+1}</button>`).join('');visual.querySelector('.vc-media-frame')?.appendChild(chooser);
      chooser.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const r=records[Number(b.dataset.i)];if(!r)return;chooser.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));const im=visual.querySelector('img');if(im){im.src=r.image_url;im.alt=r.provider_title||e.name}const cap=visual.querySelector('.vc-media-caption');if(cap)cap.innerHTML=mediaCaption(r)});
    }
    installTabs();
  }
  const observer=new MutationObserver(()=>enhance());observer.observe(root,{childList:true,subtree:true});enhance();
})();
