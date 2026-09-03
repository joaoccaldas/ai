(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=s=>String(s||'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const $=s=>document.querySelector(s);
const state={records:[],byId:new Map(),projection:null};

async function getJson(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error(`${r.status} ${url}`);
  return r.json();
}

function allComponents(e){
  return uniq(Object.values(e?.dimensions||{}).flat());
}

function scopeText(e){
  const region=(e?.regions||[]).join(', ');
  const years=e?.year_from!=null||e?.year_to!=null?`${e?.year_from??'?'} → ${e?.year_to??'?'}`:'';
  return [e?.source_family,region,years].filter(Boolean).join(' · ');
}

function compareCell(e,dimension){
  const vals=e?.dimensions?.[dimension]||[];
  return vals.length
    ? vals.map(x=>`<a class="component" href="concept.html?term=${encodeURIComponent(pretty(x))}">${esc(pretty(x))}</a>`).join(' ')
    : '<span class="none">unknown / uncoded</span>';
}

function optionGroups(select,selected){
  const families=['REFERENCE','PULOTU','DRH'];
  select.innerHTML=families.map(family=>{
    const rows=state.records.filter(r=>r.source_family===family);
    if(!rows.length)return '';
    return `<optgroup label="${esc(family)}">${rows.map(r=>`<option value="${esc(r.id)}" ${r.id===selected?'selected':''}>${esc(r.name)} · ${esc(pretty(r.kind))}</option>`).join('')}</optgroup>`;
  }).join('');
}

function defaultPair(){
  const params=new URLSearchParams(location.search);
  const requestedA=params.get('a'),requestedB=params.get('b');
  const comparable=state.records.filter(r=>Object.keys(r.dimensions||{}).length);
  const preferred=['GOD-ODIN','GOD-ZEUS'].filter(id=>state.byId.has(id));
  const a=requestedA&&state.byId.has(requestedA)?requestedA:(preferred[0]||comparable[0]?.id||state.records[0]?.id);
  let b=requestedB&&state.byId.has(requestedB)?requestedB:(preferred[1]||comparable.find(r=>r.id!==a)?.id||state.records.find(r=>r.id!==a)?.id);
  if(b===a)b=state.records.find(r=>r.id!==a)?.id;
  return [a,b];
}

function render(){
  const A=$('#compareA'),B=$('#compareB');
  const a=state.byId.get(A.value),b=state.byId.get(B.value);
  if(!a||!b){
    $('#compareGrid').innerHTML='<div class="empty">Choose two available profiles.</div>';
    return;
  }

  const dims=uniq([...Object.keys(a.dimensions||{}),...Object.keys(b.dimensions||{})]).sort();
  const grid=$('#compareGrid');
  grid.innerHTML=`<div class="head">Dimension</div><div class="head"><a href="entity.html?id=${encodeURIComponent(a.id)}">${esc(a.name)}</a><small>${esc(scopeText(a))}</small></div><div class="head"><a href="entity.html?id=${encodeURIComponent(b.id)}">${esc(b.name)}</a><small>${esc(scopeText(b))}</small></div>`+
    (dims.length?dims.map(d=>`<div class="compare-dimension"><a href="concept.html?term=${encodeURIComponent(pretty(d))}">${esc(pretty(d))}</a></div><div>${compareCell(a,d)}</div><div>${compareCell(b,d)}</div>`).join(''):'<div class="empty compare-span">Neither profile has accepted/coded comparative dimensions in this projection.</div>');

  const ac=new Set(allComponents(a)),bc=new Set(allComponents(b));
  const shared=[...ac].filter(x=>bc.has(x));
  $('#compareSummary').innerHTML=`<div class="stats"><div class="stat"><b>${shared.length}</b><span>shared components</span></div><div class="stat"><b>${ac.size}</b><span>${esc(a.name)}</span></div><div class="stat"><b>${bc.size}</b><span>${esc(b.name)}</span></div><div class="stat"><b>${uniq([...ac,...bc]).length}</b><span>combined</span></div></div><div class="notice" style="margin-top:10px"><strong>Descriptive overlap only.</strong> Shared coding does not establish equivalent meaning, descent, diffusion, contact or causation. Unknown / uncoded is not absence.</div>`;

  const url=new URL(location.href);
  url.searchParams.set('a',a.id);url.searchParams.set('b',b.id);
  history.replaceState(null,'',url);
  $('#compareState').textContent=`${state.projection.counts.records.toLocaleString()} profiles · ${state.projection.counts.comparable_records.toLocaleString()} with coded comparison dimensions · ${state.projection.counts.dimensions} dimensions`;
}

async function boot(){
  try{
    const projection=await getJson('./compare-index-v18.json');
    if(projection.projection!=='NOEMA_COMPACT_COMPARE_V18')throw new Error('unexpected comparison projection');
    state.projection=projection;
    state.records=projection.records||[];
    state.byId=new Map(state.records.map(r=>[r.id,r]));
    const [a,b]=defaultPair();
    optionGroups($('#compareA'),a);optionGroups($('#compareB'),b);
    $('#compareA').value=a||'';$('#compareB').value=b||'';
    $('#compareA').addEventListener('change',render);
    $('#compareB').addEventListener('change',render);
    render();
  }catch(err){
    console.error(err);
    $('#compareState').textContent='Comparison projection unavailable.';
    $('#compareGrid').innerHTML=`<div class="empty compare-span">NOEMA comparison data failed to load: ${esc(err.message)}. No relationship or similarity conclusion has been inferred.</div>`;
  }
}

boot();
})();
