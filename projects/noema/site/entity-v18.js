(()=>{
  const root=document.getElementById('entityRoot');
  if(!root)return;
  const id=new URLSearchParams(location.search).get('id');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pretty=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const json=async u=>{const r=await fetch(u);if(!r.ok)throw new Error(`${r.status} ${u}`);return r.json()};
  const state={entity:null,catalog:null,ontology:null};

  function splitReference(e,ontology){
    if(!e)return null;
    const canonical=new Set(Object.keys(ontology?.dimensions||{})),dimensions={},reference_traits={};
    for(const [k,v] of Object.entries(e?.dimensions||{}))(canonical.has(k)?dimensions:reference_traits)[k]=v;
    return {...e,dimensions,reference_traits,source_profile:'REFERENCE_CATALOG'};
  }
  function allComponents(e){return uniq(Object.values(e?.dimensions||{}).flat())}
  function summary(e){
    if((e.roles||[]).length)return e.roles.slice(0,5).map(pretty).join(' · ');
    if(e.description)return e.description.length>220?`${e.description.slice(0,217)}…`:e.description;
    const c=allComponents(e).slice(0,6);return c.length?c.map(pretty).join(' · '):'Reference identity profile. Historical claims require claim-level evidence.';
  }
  function rangeOf(e){
    const t=e?.time||{};let a=null,b=null;
    if(t.start_bce!=null)a=-Number(t.start_bce);else if(t.start_ce!=null)a=Number(t.start_ce);else if(e?.year_from!=null)a=Number(e.year_from);
    if(t.end_bce!=null)b=-Number(t.end_bce);else if(t.end_ce!=null)b=Number(t.end_ce);else if(e?.year_to!=null)b=Number(e.year_to);
    if(a==null&&b==null)return null;if(a==null)a=b;if(b==null)b=a;if(!Number.isFinite(a)||!Number.isFinite(b))return null;if(a>b)[a,b]=[b,a];return[a,b];
  }
  const yearLabel=y=>y<0?`${Math.abs(Math.round(y)).toLocaleString()} BCE`:`${Math.round(y).toLocaleString()} CE`;
  function entityCard(e){return `<article class="card ux-card"><div class="ux-card-top"><span class="pill kind">${esc(pretty(e.kind||'entity'))}</span><span class="ux-source">REFERENCE</span></div><a class="title ux-title" href="entity.html?id=${encodeURIComponent(e.id)}">${esc(e.name)}</a><p class="ux-summary">${esc(summary(e))}</p></article>`}
  function sourceCards(e){
    const refs=e?.sources||[];
    if(!refs.length)return '<div class="empty">No public reference source is attached to this identity record yet.</div>';
    return refs.map(s=>`<article class="entity-source-card"><div class="eyebrow">${esc(pretty(s.tier||'reference'))}</div>${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener">Open reference source ↗</a>`:'<strong>Reference record</strong>'}<p>${esc(s.note||'Reference identity source. It does not automatically support a historical or causal claim.')}</p></article>`).join('');
  }
  function graphSvg(e,byId){
    const related=(e.related_entities||[]).map(x=>byId.get(x)).filter(Boolean).slice(0,10);
    if(!related.length)return '<div class="empty">No direct reference-neighborhood edges encoded yet.</div>';
    const W=700,H=220,cx=350,cy=110,R=82;let lines='',nodes='';
    related.forEach((r,i)=>{const a=(Math.PI*2*i/related.length)-Math.PI/2,x=cx+Math.cos(a)*R*2.2,y=cy+Math.sin(a)*R;lines+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#314753" stroke-width="1"/>`;nodes+=`<a href="entity.html?id=${encodeURIComponent(r.id)}"><circle cx="${x}" cy="${y}" r="7" fill="#111e27" stroke="#54717f"/><text x="${x+11}" y="${y+4}" fill="#cbd6db" font-size="10">${esc(r.name)}</text></a>`});
    return `<svg class="vc-mini-graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Direct reference neighborhood">${lines}<circle cx="${cx}" cy="${cy}" r="12" fill="#17303a" stroke="#83dce5"/><text x="${cx+18}" y="${cy+4}" fill="#f4f7f8" font-size="11">${esc(e.name)}</text>${nodes}</svg>`;
  }
  function render(){
    const e=state.entity,entities=state.catalog?.entities||[],byId=new Map(entities.map(x=>[x.id,x]));
    if(!e){root.innerHTML='<div class="empty">Entity not found in the public reference catalog.</div>';return}
    document.title=`${e.name} · NOEMA`;
    const dims=Object.entries(e.dimensions||{}),refTraits=Object.entries(e.reference_traits||{}),related=(e.related_entities||[]).map(x=>byId.get(x)).filter(Boolean),range=rangeOf(e),regions=e.regions||[],comps=allComponents(e),roles=e.roles||[],traditions=e.traditions||[];
    root.innerHTML=`
      <section class="entity-hero ux-entity-hero" id="entity-overview">
        <div class="panel gradient"><div class="eyebrow">${esc(pretty(e.kind))}</div><h1 class="entity-name">${esc(e.name)}</h1>${(e.aliases||[]).length?`<p class="ux-aliases-large">${esc(e.aliases.join(' · '))}</p>`:''}<p class="ux-lede">${esc(summary(e))}</p><div class="meta">${regions.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}${traditions.map(x=>`<span class="pill kind">${esc(pretty(x))}</span>`).join('')}</div><div class="ux-actions"><a class="btn" href="lineages.html?focus=${encodeURIComponent(e.id)}">Connections</a><a class="btn" href="compare.html?a=${encodeURIComponent(e.id)}">Compare</a></div></div>
        <aside class="panel ux-certainty"><div class="eyebrow">At a glance</div><div class="kv"><div class="k">Regions</div><div class="v">${esc(regions.join(', ')||'not normalized')}</div></div><div class="kv"><div class="k">Comparable dimensions</div><div class="v">${dims.length}</div></div><div class="kv"><div class="k">Direct links</div><div class="v">${related.length}</div></div><div class="notice">Reference identity profile. Similarity, graph proximity and shared components do not establish descent, diffusion or causation.</div></aside>
      </section>
      <nav class="entity-lensbar" aria-label="Entity lenses"><a href="#entity-overview">Overview</a><a href="#entity-components">Components</a><a href="#entity-geography">Map</a><a href="#entity-time-context">Time</a><a href="#entity-network">Graph</a><a href="compare.html?a=${encodeURIComponent(e.id)}">Compare</a><a href="#entity-evidence">Evidence</a></nav>
      <section class="vc-media-strip" id="entity-media"><div class="vc-media-frame" id="entityMediaFrame"><div class="vc-media-placeholder"><strong>${esc(String(e.name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase())}</strong></div><div class="vc-media-caption">Reference media loads separately from identity data and is never treated as scientific evidence.</div></div><div class="panel"><div class="eyebrow">Entity lenses</div><div class="vc-entity-lenses"><div class="vc-lens"><small>Type</small><b>${esc(pretty(e.kind))}</b><span>identity layer</span></div><div class="vc-lens"><small>Regions</small><b>${regions.length}</b><span>reference regions</span></div><div class="vc-lens"><small>Roles</small><b>${roles.length}</b><span>coded associations</span></div><div class="vc-lens"><small>Neighbors</small><b>${related.length}</b><span>direct reference links</span></div><div class="vc-lens"><small>Sources</small><b>${(e.sources||[]).length}</b><span>identity references</span></div></div></div></section>
      <div class="sectionhead" id="entity-components"><div><div class="eyebrow">Decomposition</div><h2>What this profile is made of</h2></div><p>${dims.length} accepted canonical dimensions</p></div>
      <section class="dimension-grid">${dims.map(([d,vals])=>`<div class="dimension-card"><h3>${esc(pretty(d))}</h3><div class="component-list">${(vals||[]).map(v=>`<a class="component" href="concept.html?term=${encodeURIComponent(pretty(v))}">${esc(pretty(v))}</a>`).join('')}</div></div>`).join('')||'<div class="empty">No accepted canonical decomposition encoded yet.</div>'}</section>
      <section class="entity-context"><article class="panel" id="entity-geography"><div class="eyebrow">Geographic lens</div><h2>Where is this profile situated?</h2><div class="entity-context-list"><div class="entity-context-row"><span>Regions</span><b>${esc(regions.join(' · ')||'No normalized region')}</b></div><div class="entity-context-row"><span>Coordinates</span><b>Not inferred unless source encoded</b></div><div class="entity-context-row"><span>Source family</span><b>NOEMA reference catalog</b></div></div><p>Regional labels are reference context, not an origin claim.</p><a class="btn" href="human-meaning-atlas.html">Open Human Meaning Atlas →</a></article><article class="panel" id="entity-time-context"><div class="eyebrow">Temporal lens</div><h2>When is this profile scoped?</h2>${range?`<div class="entity-time-window"><span>${esc(yearLabel(range[0]))}</span><div class="track"></div><span>${esc(yearLabel(range[1]))}</span></div><p>This is an encoded reference window, not an inferred origin date.</p>`:'<p>No source-bounded time window is encoded. NOEMA leaves it unresolved.</p>'}<div class="entity-context-list"><div class="entity-context-row"><span>Profile status</span><b>${esc(pretty(e.profile_status||'unknown'))}</b></div><div class="entity-context-row"><span>Comparable components</span><b>${comps.length}</b></div><div class="entity-context-row"><span>Reference-only traits</span><b>${refTraits.reduce((n,[,v])=>n+(v||[]).length,0)}</b></div></div></article></section>
      <div class="sectionhead" id="entity-network"><div><div class="eyebrow">Reference graph</div><h2>Immediate neighborhood</h2></div><a class="btn" href="lineages.html?focus=${encodeURIComponent(e.id)}">Open graph →</a></div>${graphSvg(e,byId)}<div class="notice" style="margin-top:10px">A visible reference edge means catalogued association, not historical descent. Diffusion, ancestry, convergence and contact require evidence-gated relationship records.</div>
      ${related.length?`<div class="sectionhead"><div><div class="eyebrow">Connections</div><h2>Directly related entities</h2></div></div><section class="grid">${related.slice(0,9).map(entityCard).join('')}</section>`:''}
      <section class="entity-source-section" id="entity-evidence"><div class="sectionhead"><div><div class="eyebrow">Visible source trail</div><h2>Where the reference identity comes from</h2></div><p>Reference sources ≠ claim-level evidence</p></div><div class="entity-source-grid">${sourceCards(e)}</div><div class="notice" style="margin-top:10px">These sources support reference identity or upstream context. Historical descent, diffusion, causality and theology require source-bounded claims and review.</div></section>
      ${refTraits.length?`<section class="panel"><div class="eyebrow">Reference-only traits</div><h2>Searchable, not comparative evidence</h2>${refTraits.map(([d,vals])=>`<div class="kv"><div class="k">${esc(pretty(d))}</div><div class="v">${esc((vals||[]).map(pretty).join(' · '))}</div></div>`).join('')}</section>`:''}`;
  }
  function mediaCaption(r){return `<strong>${esc(r.provider_title||r.title||state.entity.name)}</strong><br>${esc(r.date_display||r.medium||'Source-verified reference')} · ${esc(pretty(r.provider||'reference source'))}<br><span style="color:#83d19a">${esc(r.rights||r.license||'rights verified')}</span> · reference depiction, not evidence${r.provider_page_url||r.source_page_url?` · <a href="${esc(r.provider_page_url||r.source_page_url)}" target="_blank" rel="noopener">source + rights ↗</a>`:''}`}
  async function loadMedia(){
    const frame=document.getElementById('entityMediaFrame');if(!frame||!state.entity)return;
    try{
      const [museum,commons]=await Promise.all([json('./museum-reference-media.json').catch(()=>({records:[]})),json('../data/reference/media-reviewed-v1.json').catch(()=>({items:[]}))]);
      const records=[...(museum.records||[]).filter(x=>x.entity_id===id&&x.display_gate==='REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY'),...(commons.items||[]).filter(x=>x.entity_id===id&&x.identity_status==='SOURCE_VERIFIED'&&x.rights_status==='SOURCE_VERIFIED'&&x.evidence_status==='REFERENCE_ONLY_NOT_EVIDENCE').map(x=>({provider_title:x.title,provider:'WIKIMEDIA_COMMONS',image_url:x.image_url,date_display:x.collection,rights:x.license,provider_page_url:x.source_page_url}))];
      const r=records[0];if(!r)return;
      frame.innerHTML=`<img src="${esc(r.image_url||r.thumbnail_url)}" alt="${esc(r.provider_title||state.entity.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><div class="vc-media-caption">${mediaCaption(r)}</div>`;
      frame.querySelector('img')?.addEventListener('error',()=>{frame.innerHTML='<div class="vc-media-placeholder"><strong>∅</strong></div><div class="vc-media-caption">Reference media could not be loaded. Identity and evidence remain unaffected.</div>'});
    }catch(err){console.warn('NOEMA reference media unavailable',err)}
  }
  async function boot(){
    if(!id){root.innerHTML='<div class="empty">No entity ID supplied.</div>';return}
    try{
      const [catalog,ontology]=await Promise.all([json('../data/reference/belief-catalog-v1.json'),json('../ontology/decomposition_v1.json')]);
      state.catalog=catalog;state.ontology=ontology;state.entity=splitReference((catalog.entities||[]).find(x=>x.id===id),ontology);render();
      const start=()=>loadMedia();if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:1800});else setTimeout(start,250);
    }catch(err){root.innerHTML=`<div class="notice">Could not load entity data: ${esc(err.message)}</div>`}
  }
  boot();
})();
