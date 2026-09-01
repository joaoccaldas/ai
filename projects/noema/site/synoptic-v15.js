(() => {
  const page=document.body?.dataset?.page;
  if(!['concept','entity'].includes(page))return;
  const params=new URLSearchParams(location.search);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pretty=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const norm=v=>String(v||'').toLowerCase().replaceAll('_',' ').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const arr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
  const json=async(u,opt=false)=>{try{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(`${r.status} ${u}`);return await r.json()}catch(e){if(opt)return null;throw e}};
  const sourceKey=e=>String(e?.source_profile||'UNKNOWN').toUpperCase();
  const sourceName=e=>sourceKey(e)==='DRH'?'DRH':sourceKey(e)==='PULOTU'?'Pulotu':sourceKey(e)==='REFERENCE_CATALOG'?'Reference catalog':pretty(sourceKey(e));
  const yearLabel=y=>y<0?`${Math.abs(Math.round(y)).toLocaleString()} BCE`:`${Math.round(y).toLocaleString()} CE`;
  const observations=e=>Object.entries(e?.dimensions||{}).flatMap(([dimension,vals])=>arr(vals).map(value=>({dimension,value})));
  const components=e=>uniq(observations(e).map(o=>o.value));
  const rangeOf=e=>{const t=e?.time||{};let a=null,b=null;if(t.start_bce!=null)a=-Number(t.start_bce);else if(t.start_ce!=null)a=Number(t.start_ce);else if(e?.year_from!=null)a=Number(e.year_from);if(t.end_bce!=null)b=-Number(t.end_bce);else if(t.end_ce!=null)b=Number(t.end_ce);else if(e?.year_to!=null)b=Number(e.year_to);if(a==null&&b==null)return null;if(a==null)a=b;if(b==null)b=a;if(!Number.isFinite(a)||!Number.isFinite(b))return null;if(a>b)[a,b]=[b,a];return[a,b]};
  const hasCoords=e=>Number.isFinite(Number(e?.latitude))&&Number.isFinite(Number(e?.longitude));

  function normalizeReference(doc,ontology){
    const canonical=new Set(Object.keys(ontology?.dimensions||{}));
    return (doc?.entities||[]).map(e=>{const dimensions={},reference_traits={};for(const [k,v] of Object.entries(e.dimensions||{}))(canonical.has(k)?dimensions:reference_traits)[k]=arr(v);return {...e,dimensions,reference_traits,source_profile:e.source_profile||'REFERENCE_CATALOG'}})
  }
  function pulotuEntities(doc){
    if(!doc?.subjects?.length)return[];const by=new Map();
    for(const a of doc.assertions||[]){if(a.state!=='PRESENT'||a.mapping_status!=='EXPLICIT_V1')continue;if(!by.has(a.subject_id))by.set(a.subject_id,{});const d=by.get(a.subject_id);(d[a.dimension]??=[]).push(a.facet)}
    return doc.subjects.map(s=>({id:`PULOTU:${s.id}`,kind:'CULTURAL_TRADITION_PROFILE',name:s.name,regions:[],roles:[],dimensions:Object.fromEntries(Object.entries(by.get(s.id)||{}).map(([k,v])=>[k,uniq(v)])),reference_traits:{},source_profile:'PULOTU',profile_status:'UPSTREAM_CODED_MAPPING_REVIEW_PENDING',latitude:s.latitude,longitude:s.longitude,glottocode:s.glottocode,description:s.comment||''}))
  }
  function drhEntities(doc){
    if(!doc?.subjects?.length)return[];const by=new Map();
    for(const a of doc.assertions||[]){if(a.state!=='PRESENT'||a.mapping_status!=='CURATED_CROSSWALK_V1')continue;if(!by.has(a.subject_id))by.set(a.subject_id,{});const d=by.get(a.subject_id);(d[a.dimension]??=[]).push(a.facet)}
    return doc.subjects.map(s=>({id:s.id,kind:s.comparable_belief_system?'HISTORICAL_RELIGIOUS_GROUP':`DRH_${s.unit_type||'ENTRY'}`,name:s.name,regions:uniq([s.world_region,s.region_name]),roles:[],dimensions:Object.fromEntries(Object.entries(by.get(s.id)||{}).map(([k,v])=>[k,uniq(v)])),reference_traits:{},source_profile:'DRH',profile_status:'UPSTREAM_EXPERT_CODED_MAPPING_REVIEW_PENDING',year_from:s.year_from,year_to:s.year_to,description:s.description||'',expert_name:s.expert_name,data_source:s.data_source}))
  }

  function conceptContext(profiles){
    const raw=(params.get('term')||params.get('q')||'afterlife').trim(),terms=norm(raw).split(/\s+/).filter(Boolean),match=v=>{const n=norm(v);return terms.length&&terms.every(t=>n.includes(t))};
    const matches=[];
    for(const e of profiles){const obs=observations(e),matched=obs.filter(o=>match(o.value)||match(o.dimension));if(matched.length){matches.push({...e,_matchMode:'COMPARABLE',_matchScore:matched.length,_matched:matched});continue}const refs=Object.entries(e.reference_traits||{}).flatMap(([dimension,vals])=>arr(vals).map(value=>({dimension,value}))).filter(o=>match(o.value)||match(o.dimension));if(refs.length){matches.push({...e,_matchMode:'REFERENCE_ONLY',_matchScore:refs.length,_matched:refs});continue}if([e.name,...arr(e.aliases),...arr(e.roles)].some(match))matches.push({...e,_matchMode:'IDENTITY_ONLY',_matchScore:1,_matched:[]})}
    matches.sort((a,b)=>{const rank=x=>x._matchMode==='COMPARABLE'?3:x._matchMode==='REFERENCE_ONLY'?2:1;return rank(b)-rank(a)||b._matchScore-a._matchScore||String(a.name).localeCompare(String(b.name))});
    return {kind:'CONCEPT',key:raw,label:pretty(raw),profiles:matches,focus:null,guard:'Edges mean “this profile matched the current concept handle.” Co-occurrence and shared labels do not establish causality, descent, diffusion or equivalent local meaning.'}
  }
  function entityContext(profiles){
    const id=params.get('id'),focus=profiles.find(e=>String(e.id)===String(id));if(!focus)return {kind:'ENTITY',key:id,label:id||'Unknown entity',profiles:[],focus:null,guard:'No federated profile was found for this entity. NOEMA does not fabricate neighbors.'};
    const fc=new Set(components(focus)),related=[];
    for(const e of profiles){if(String(e.id)===String(focus.id)){related.push({...e,_matchMode:'FOCAL',_matchScore:999,_shared:[...fc]});continue}const shared=components(e).filter(c=>fc.has(c));if(shared.length)related.push({...e,_matchMode:'SHARED_COMPONENT',_matchScore:shared.length,_shared:shared})}
    related.sort((a,b)=>b._matchScore-a._matchScore||String(a.name).localeCompare(String(b.name)));
    return {kind:'ENTITY',key:id,label:focus.name,profiles:related,focus,guard:'Edges mean “shares at least one encoded comparable component with the focal entity.” They are not ancestry, influence, historical contact, diffusion or shared theology.'}
  }

  const state={source:'ALL',allTime:true,focusYear:null,selected:null};
  let context=null,host=null;
  const profileById=id=>context?.profiles?.find(p=>String(p.id)===String(id));
  const active=p=>{if(state.source!=='ALL'&&sourceKey(p)!==state.source)return false;if(state.allTime)return true;const r=rangeOf(p);if(!r||state.focusYear==null)return false;const dated=context.profiles.map(rangeOf).filter(Boolean),lo=dated.length?Math.min(...dated.map(x=>x[0])):state.focusYear,hi=dated.length?Math.max(...dated.map(x=>x[1])):state.focusYear,window=Math.max(25,(hi-lo)*.035);return r[0]<=state.focusYear+window&&r[1]>=state.focusYear-window};
  const selected=()=>profileById(state.selected);

  function shell(){
    const profiles=context.profiles,dated=profiles.map(p=>({p,r:rangeOf(p)})).filter(x=>x.r),sources=uniq(profiles.map(sourceKey));const min=dated.length?Math.min(...dated.map(x=>x.r[0])):0,max=dated.length?Math.max(...dated.map(x=>x.r[1])):1;if(state.focusYear==null)state.focusYear=Math.round((min+max)/2);
    host.innerHTML=`<div class="synoptic-head"><div><div class="eyebrow"><span class="synoptic-live-dot"></span>v1.5 synchronized lens</div><h2>Map · Time · Graph · Evidence</h2></div><p>One research state drives all four views. Select a profile anywhere and the same object is highlighted everywhere.</p></div><div class="synoptic-toolbar"><button class="synoptic-tool active" data-source="ALL">All sources</button>${sources.map(s=>`<button class="synoptic-tool" data-source="${esc(s)}">${esc(sourceName({source_profile:s}))}</button>`).join('')}<button class="synoptic-tool active" id="synAllTime">All time</button></div><div class="synoptic-grid"><section class="synoptic-panel" id="synMap"><div class="synoptic-panel-inner"><div class="eyebrow">Geographic lens</div><h3>Source-bounded coordinates only</h3><div class="synoptic-small" id="synMapCount"></div></div><svg class="synoptic-map" id="synMapSvg" viewBox="0 0 1000 430" aria-label="Coordinate plot for current research context"></svg><div class="synoptic-map-note">Region-only profiles stay unlocated. NOEMA never assigns a point from a broad region label.</div></section><section class="synoptic-panel"><div class="synoptic-panel-inner"><div class="eyebrow">Temporal lens</div><h3>Move the focus through encoded windows</h3>${dated.length?`<div class="synoptic-time-controls"><input id="synTime" type="range" min="${min}" max="${max}" step="1" value="${state.focusYear}"><div class="synoptic-time-readout" id="synTimeReadout">${esc(yearLabel(state.focusYear))}</div></div><div class="synoptic-timeline" id="synTimeline"></div>`:'<div class="synoptic-empty">No source-bounded dated windows in this context.</div>'}</div></section><section class="synoptic-panel"><div class="synoptic-panel-inner"><div class="eyebrow">Relationship lens</div><h3>Descriptive network, not genealogy</h3><div class="synoptic-small">Profiles and neighboring components update with the same source and time filters.</div></div><svg class="synoptic-graph" id="synGraph" viewBox="0 0 620 360" aria-label="Interactive descriptive relationship graph"></svg></section><section class="synoptic-panel"><div class="synoptic-panel-inner"><div class="eyebrow">Evidence + provenance drawer</div><h3 id="synDrawerTitle">Research state</h3><div class="synoptic-drawer" id="synDrawer"></div></div></section></div>`;
    host.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>{state.source=b.dataset.source;host.querySelectorAll('[data-source]').forEach(x=>x.classList.toggle('active',x.dataset.source===state.source));renderAll()}));
    const all=host.querySelector('#synAllTime');all?.addEventListener('click',()=>{state.allTime=!state.allTime;all.classList.toggle('active',state.allTime);renderAll()});
    const time=host.querySelector('#synTime');time?.addEventListener('input',()=>{state.focusYear=Number(time.value);state.allTime=false;all?.classList.remove('active');renderAll()});
    renderAll();
  }

  function setSelected(id){state.selected=String(id);renderAll()}
  function renderMap(){
    const svg=host.querySelector('#synMapSvg');if(!svg)return;const mapped=context.profiles.filter(hasCoords),activeMapped=mapped.filter(active),unlocated=context.profiles.length-mapped.length;host.querySelector('#synMapCount').textContent=`${activeMapped.length.toLocaleString()} active mapped profiles · ${unlocated.toLocaleString()} unlocated in current context`;
    const lon=x=>(Number(x)+180)/360*920+40,lat=y=>(90-Number(y))/180*330+45;let s='<rect class="ocean" x="40" y="45" width="920" height="330" rx="12"/>';
    for(let x=-120;x<=120;x+=60)s+=`<line class="grid" x1="${lon(x)}" x2="${lon(x)}" y1="45" y2="375"/>`;
    for(let y=-60;y<=60;y+=30)s+=`<line class="grid" x1="40" x2="960" y1="${lat(y)}" y2="${lat(y)}"/>`;
    s+='<text class="axis" x="46" y="397">180°W</text><text class="axis" x="487" y="397">0°</text><text class="axis" x="922" y="397">180°E</text>';
    for(const p of mapped){const cls=`pt ${sourceKey(p).toLowerCase()} ${active(p)?'':'muted'} ${String(p.id)===String(state.selected)?'selected':''}`;s+=`<g class="${cls}" data-profile="${esc(p.id)}" transform="translate(${lon(p.longitude).toFixed(1)},${lat(p.latitude).toFixed(1)})"><circle r="4.7"/><text x="8" y="-7">${esc(p.name)}</text><title>${esc(p.name)} · ${Number(p.latitude).toFixed(2)}, ${Number(p.longitude).toFixed(2)}</title></g>`}
    svg.innerHTML=s;svg.querySelectorAll('[data-profile]').forEach(n=>n.addEventListener('click',()=>setSelected(n.dataset.profile)));
  }
  function renderTimeline(){
    const root=host.querySelector('#synTimeline'),slider=host.querySelector('#synTime'),readout=host.querySelector('#synTimeReadout');if(!root||!slider)return;readout.textContent=state.allTime?'All encoded time':yearLabel(state.focusYear);slider.value=state.focusYear;
    const dated=context.profiles.map(p=>({p,r:rangeOf(p)})).filter(x=>x.r).sort((a,b)=>a.r[0]-b.r[0]);if(!dated.length)return;const min=Math.min(...dated.map(x=>x.r[0])),max=Math.max(...dated.map(x=>x.r[1])),span=Math.max(1,max-min),focus=100*(state.focusYear-min)/span;
    root.innerHTML=dated.slice(0,42).map(({p,r})=>{const left=100*(r[0]-min)/span,width=Math.max(1,100*(r[1]-r[0])/span),cls=`synoptic-time-row ${active(p)?'':'muted'} ${String(p.id)===String(state.selected)?'selected':''}`;return `<div class="${cls}" data-profile="${esc(p.id)}"><div class="synoptic-time-name" title="${esc(p.name)}">${esc(p.name)}</div><div class="synoptic-time-track"><span class="synoptic-time-band" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"></span>${state.allTime?'':`<i class="synoptic-time-focus" style="left:${focus.toFixed(2)}%"></i>`}</div></div>`}).join('');root.querySelectorAll('[data-profile]').forEach(n=>n.addEventListener('click',()=>setSelected(n.dataset.profile)));
  }
  function renderGraph(){
    const svg=host.querySelector('#synGraph');if(!svg)return;const usable=context.profiles.filter(active),chosen=[];const sel=selected();if(sel&&active(sel))chosen.push(sel);for(const p of usable){if(chosen.length>=12)break;if(!chosen.some(x=>String(x.id)===String(p.id)))chosen.push(p)}
    const co=new Map();for(const p of chosen){for(const c of components(p)){const key=pretty(c);if(context.kind==='CONCEPT'&&norm(key)===norm(context.label))continue;co.set(key,(co.get(key)||0)+1)}}const comps=[...co.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,8).map(x=>x[0]);
    const cx=310,cy=180,nodes=[{id:'__focus',label:context.label,type:'focus',x:cx,y:cy}];
    chosen.forEach((p,i)=>{const a=(-Math.PI/2)+(i/Math.max(1,chosen.length))*Math.PI*2;nodes.push({id:String(p.id),label:p.name,type:'profile',x:cx+125*Math.cos(a),y:cy+120*Math.sin(a),p})});
    comps.forEach((c,i)=>{const a=(-Math.PI/2)+(i/Math.max(1,comps.length))*Math.PI*2;nodes.push({id:`c:${c}`,label:c,type:'component',x:cx+255*Math.cos(a),y:cy+150*Math.sin(a),concept:c})});
    const profileNodes=nodes.filter(n=>n.type==='profile'),componentNodes=nodes.filter(n=>n.type==='component');let edges=[];for(const n of profileNodes)edges.push({a:nodes[0],b:n,active:active(n.p)});for(const pn of profileNodes){const set=new Set(components(pn.p).map(pretty));for(const cn of componentNodes)if(set.has(cn.concept))edges.push({a:pn,b:cn,active:active(pn.p)})}
    let s=edges.map(e=>`<line class="edge ${e.active?'':'muted'}" x1="${e.a.x}" y1="${e.a.y}" x2="${e.b.x}" y2="${e.b.y}"/>`).join('');
    s+=nodes.map(n=>{const muted=n.p&&!active(n.p),selectedNode=n.p&&String(n.p.id)===String(state.selected),r=n.type==='focus'?24:n.type==='profile'?11:8,label=n.label.length>22?`${n.label.slice(0,20)}…`:n.label;return `<g class="node ${n.type} ${muted?'muted':''} ${selectedNode?'selected':''}" data-node="${esc(n.id)}" transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})"><circle r="${r}"/><text text-anchor="middle" y="${n.type==='focus'?40:23}">${esc(label)}</text></g>`}).join('');svg.innerHTML=s;
    svg.querySelectorAll('.node.profile').forEach(n=>n.addEventListener('click',()=>setSelected(n.dataset.node)));svg.querySelectorAll('.node.component').forEach(n=>n.addEventListener('click',()=>{location.href=`concept.html?term=${encodeURIComponent(n.dataset.node.slice(2))}`}));
  }
  function renderDrawer(){
    const root=host.querySelector('#synDrawer'),title=host.querySelector('#synDrawerTitle'),p=selected(),activeProfiles=context.profiles.filter(active),mapped=activeProfiles.filter(hasCoords).length,dated=activeProfiles.filter(x=>rangeOf(x)).length;if(!root)return;
    if(!p){title.textContent=`${context.label} · current state`;root.innerHTML=`<div class="synoptic-drawer-card"><div class="synoptic-kv"><span>Context</span><b>${esc(context.kind==='CONCEPT'?'Concept federation':'Entity neighborhood')}</b><span>Active profiles</span><b>${activeProfiles.length.toLocaleString()}</b><span>Mapped</span><b>${mapped.toLocaleString()}</b><span>Dated</span><b>${dated.toLocaleString()}</b><span>Source filter</span><b>${esc(state.source==='ALL'?'All source families':sourceName({source_profile:state.source}))}</b></div></div><div class="synoptic-guard">${esc(context.guard)}</div><div class="synoptic-small">Select a point, timeline row or graph profile to inspect its source family, encoded window, coordinates and comparable components.</div>`;return}
    title.textContent=p.name;const r=rangeOf(p),comps=components(p),coords=hasCoords(p)?`${Number(p.latitude).toFixed(3)}, ${Number(p.longitude).toFixed(3)}`:'Not encoded';const mode=p._matchMode==='FOCAL'?'Focal entity':p._matchMode==='SHARED_COMPONENT'?`${p._shared?.length||0} shared encoded component(s)`:p._matchMode==='COMPARABLE'?'Comparable coding match':p._matchMode==='REFERENCE_ONLY'?'Reference-only match':'Identity-only match';
    root.innerHTML=`<div class="synoptic-drawer-card"><div class="synoptic-kv"><span>Relation here</span><b>${esc(mode)}</b><span>Source family</span><b>${esc(sourceName(p))}</b><span>Profile status</span><b>${esc(pretty(p.profile_status||'unknown'))}</b><span>Time window</span><b>${r?`${esc(yearLabel(r[0]))} → ${esc(yearLabel(r[1]))}`:'Not encoded'}</b><span>Coordinates</span><b>${esc(coords)}</b><span>Regions</span><b>${esc((p.regions||[]).join(' · ')||'Not normalized')}</b></div></div><div class="synoptic-drawer-card"><div class="eyebrow">Comparable components</div><div class="synoptic-tags" style="margin-top:8px">${comps.slice(0,24).map(c=>`<a href="concept.html?term=${encodeURIComponent(pretty(c))}">${esc(pretty(c))}</a>`).join('')||'<span>None accepted in current ontology mapping</span>'}</div></div><div class="synoptic-guard">This drawer shows source-scoped coding and identity context. It does not promote the profile to a causal, historical-descent or theological claim.</div><div><a class="btn" href="entity.html?id=${encodeURIComponent(p.id)}">Open full entity workspace →</a></div>`;
  }
  function renderAll(){renderMap();renderTimeline();renderGraph();renderDrawer()}

  async function boot(){
    try{
      const [catalog,ontology,pulotu,drh]=await Promise.all([json('../data/reference/belief-catalog-v1.json',true),json('../ontology/decomposition_v1.json',true),json('./religion-decomposition.json',true),json('./drh-decomposition.json',true)]);const profiles=[...normalizeReference(catalog||{},ontology||{}),...pulotuEntities(pulotu),...drhEntities(drh)];context=page==='concept'?conceptContext(profiles):entityContext(profiles);if(context.kind==='ENTITY'&&context.focus)state.selected=String(context.focus.id);
      const mount=()=>{if(document.querySelector('.synoptic-v15'))return true;const anchor=page==='concept'?document.querySelector('.concept-lenses'):document.querySelector('.entity-lensbar');if(!anchor)return false;host=document.createElement('section');host.className='synoptic-v15';host.id='synoptic-lens';anchor.insertAdjacentElement('afterend',host);shell();const link=document.createElement('a');link.href='#synoptic-lens';link.textContent='Synoptic';anchor.appendChild(link);return true};if(mount())return;const ob=new MutationObserver(()=>{if(mount())ob.disconnect()});ob.observe(document.getElementById(page==='concept'?'conceptRoot':'entityRoot'),{childList:true,subtree:true});
    }catch(err){console.error('synoptic v1.5',err)}
  }
  boot();
})();