(() => {
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pretty=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const num=v=>Number(v||0).toLocaleString();
  const pct=v=>`${Number(v||0).toFixed(1)}%`;
  const safe=async u=>{try{const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(`${r.status} ${u}`);return await r.json()}catch(e){console.warn('NOEMA optional data unavailable',u,e);return null}};
  const freshness=ts=>{if(!ts)return'unknown';const d=new Date(ts);if(Number.isNaN(d.getTime()))return String(ts);const h=Math.max(0,(Date.now()-d.getTime())/36e5);if(h<1)return`${Math.max(1,Math.round(h*60))}m ago`;if(h<48)return`${Math.round(h)}h ago`;return`${Math.round(h/24)}d ago`};

  function patterns(doc){return(doc?.cohorts||[]).flatMap(c=>(c.candidates||[]).map(x=>({...x,source:c.source}))).sort((a,b)=>(a.q_bh??1)-(b.q_bh??1)||Math.abs(b.phi||0)-Math.abs(a.phi||0))}
  function renderMedia(media){
    const el=$('#homeMedia');if(!el)return;
    const rows=(media?.records||[]).filter(x=>x.display_gate==='REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY').slice(0,4);
    el.innerHTML=rows.length?rows.map(r=>`<figure><img src="${esc(r.thumbnail_url||r.image_url)}" alt="${esc(r.provider_title||r.entity_name)}" referrerpolicy="no-referrer"><figcaption>${esc(r.entity_name)} · ${esc(pretty(r.provider))}<br>${esc(r.rights)} · reference, not evidence</figcaption></figure>`).join(''):`<figure><div class="fallback">Ζ</div><figcaption>Open-access museum reference media will appear here after provider identity and rights checks.</figcaption></figure><figure><div class="fallback">𓂀</div><figcaption>Visual fallbacks are graphic markers, not historical depictions.</figcaption></figure>`;
    el.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{const f=img.closest('figure');if(f)f.innerHTML='<div class="fallback">◉</div><figcaption>Reference image unavailable. No substitute historical image was invented.</figcaption>'}));
  }
  function renderPatterns(doc){
    const el=$('#homePatterns');if(!el)return;
    const rows=patterns(doc).slice(0,5);
    el.innerHTML=rows.length?rows.map(x=>`<a class="home-pattern" href="patterns.html"><div><b>${esc(pretty(x.facet_a))} ↔ ${esc(pretty(x.facet_b))}</b><span>${esc(x.source)} · n=${num(x.n_comparable||x.n_profiles)} · descriptive candidate</span></div><em>φ ${Number(x.phi||0).toFixed(2)}</em></a>`).join(''):'<div class="empty">No defensible generated pattern candidates under the current null model.</div>';
  }
  function renderOntology(ontology){
    const el=$('#ontologyCloud');if(!el)return;
    const dims=Object.keys(ontology?.dimensions||{});
    el.innerHTML=dims.map(d=>`<a href="explore.html?q=${encodeURIComponent(pretty(d))}">${esc(pretty(d))}</a>`).join('');
  }
  function renderPulse(pulse){
    const el=$('#homePulse');if(!el)return;
    const rows=(pulse?.recent_runs||[]).slice(0,4);
    el.innerHTML=rows.length?rows.map(r=>`<div class="pulse-row"><b>${esc(pretty(r.task_type))}</b><time>${esc(freshness(r.completed_at))}</time><p>${esc(r.summary||'Run completed without narrative summary.')}</p></div>`).join(''):'<div class="empty">No persisted run manifests yet.</div>';
  }
  function renderCoverage(health){
    const m=health?.metrics||{},rows=[['Pulotu mapped',m.pulotu_mapping_coverage_pct],['DRH questions mapped',m.drh_question_mapping_coverage_pct],['DRH groups touched',m.drh_comparable_groups_with_any_curated_mapping_pct]];
    const el=$('#homeCoverage');if(!el)return;
    el.innerHTML=rows.map(([k,v])=>`<div class="coverage-row"><label>${esc(k)}</label><div class="coverage-track"><i style="width:${Math.max(0,Math.min(100,Number(v||0)))}%"></i></div><span>${pct(v)}</span></div>`).join('');
  }
  function renderKpis(fed,health,media){
    const s=fed?.summary||{},m=health?.metrics||{},vals=[['Profiles',s.comparable_belief_system_profiles??m.comparable_profiles],['Assertions',s.accepted_semantic_assertions??m.accepted_semantic_assertions],['Dimensions',s.ontology_dimensions??m.ontology_dimensions],['Museum refs',media?.record_count||0]];
    $('#homeKpis').innerHTML=vals.map(([k,v])=>`<div class="home-kpi"><b>${num(v)}</b><span>${esc(k)}</span></div>`).join('');
    $('#homeHeadline').textContent=`Explore ${num(s.comparable_belief_system_profiles??m.comparable_profiles)} comparable profiles and ${num(s.accepted_semantic_assertions??m.accepted_semantic_assertions)} accepted semantic assertions beneath tradition labels. Follow any connection back to scope, source and uncertainty.`;
  }
  async function boot(){
    const [fed,health,patternDoc,pulse,media,ontology]=await Promise.all([
      safe('./religion-federation.json'),safe('./research-health.json'),safe('./pattern-candidates.json'),safe('./automation-pulse.json'),safe('./museum-reference-media.json'),safe('../ontology/decomposition_v1.json')
    ]);
    renderKpis(fed,health,media);renderMedia(media);renderPatterns(patternDoc);renderOntology(ontology);renderPulse(pulse);renderCoverage(health);
    $('#homeFresh').textContent=`federation ${freshness(fed?.generated_at)} · research pulse ${freshness(pulse?.generated_at)} · museum references ${freshness(media?.generated_at)}`;
    $('#homeSearch')?.addEventListener('submit',e=>{e.preventDefault();const q=$('#homeQ').value.trim();location.href=`explore.html${q?`?q=${encodeURIComponent(q)}`:''}`});
  }
  boot();
})();
