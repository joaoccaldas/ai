(() => {
  const svg=document.getElementById('network');
  if(!svg) return;
  const host=svg.parentElement;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const pretty=v=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const load=async()=>{const r=await fetch('../data/reference/belief-catalog-v1.json',{cache:'no-store'});return r.json()};
  const focusParam=new URLSearchParams(location.search).get('focus');
  let scale=1,tx=0,ty=0,drag=null,selected=focusParam||null,kind='ALL',query='';
  const W=1100,H=640;

  const controls=document.createElement('div');
  controls.className='rg-controls';
  controls.innerHTML=`<div class="rg-search"><input id="rgQ" placeholder="Find an entity in the graph"><button type="button" id="rgReset">Reset view</button></div>
    <select id="rgKind"><option value="ALL">All entity types</option></select>
    <div class="rg-legend"><span><i class="rg-swatch sys"></i>systems</span><span><i class="rg-swatch agent"></i>agents</span><span><i class="rg-swatch practice"></i>practice/material</span><span>edges = explicit reference association only</span></div>`;
  host.insertBefore(controls,svg);

  const inspector=document.createElement('aside');
  inspector.className='rg-inspector';
  host.appendChild(inspector);
  const stage=document.createElement('div');
  stage.className='rg-stage';
  svg.parentNode.insertBefore(stage,svg);
  stage.appendChild(svg);
  stage.appendChild(inspector);

  function kindGroup(e){
    if(['BELIEF_SYSTEM','PRACTICE_COMPLEX','CULTURAL_TRADITION_PROFILE'].includes(e.kind))return'sys';
    if(['DEITY','SPIRIT','SUPERNATURAL_AGENT'].includes(e.kind))return'agent';
    return'practice';
  }
  function layout(nodes){
    const groups={sys:[],agent:[],practice:[]};
    nodes.forEach(n=>groups[kindGroup(n)].push(n));
    const pos=new Map();
    const place=(arr,cx,cy,rx,ry)=>{
      arr.forEach((n,i)=>{
        const a=(Math.PI*2*i/Math.max(1,arr.length))-Math.PI/2;
        pos.set(n.id,{x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry});
      })
    };
    place(groups.sys,260,320,170,250);
    place(groups.agent,720,250,235,180);
    place(groups.practice,720,500,235,90);
    return pos;
  }
  function neighbors(id,edges){
    const s=new Set();
    for(const e of edges){if(e.a===id)s.add(e.b);if(e.b===id)s.add(e.a)}
    return s;
  }
  function inspect(e,byId,edges){
    if(!e){inspector.innerHTML=`<div class="eyebrow">Graph inspector</div><h3>Select an entity</h3><p>Click a node to keep its neighborhood highlighted. The graph never upgrades a reference association into descent, diffusion or common origin.</p>`;return}
    const ns=[...neighbors(e.id,edges)].map(x=>byId.get(x)).filter(Boolean);
    inspector.innerHTML=`<div class="eyebrow">${esc(pretty(e.kind))}</div><h3>${esc(e.name)}</h3>
      ${(e.aliases||[]).length?`<p>${esc(e.aliases.join(' · '))}</p>`:''}
      <div class="rg-kpis"><span><b>${(e.related_entities||[]).length}</b> direct links</span><span><b>${(e.regions||[]).length}</b> regions</span><span><b>${(e.roles||[]).length}</b> roles</span></div>
      ${(e.roles||[]).length?`<div class="rg-tags">${e.roles.slice(0,10).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}
      <a class="btn" href="entity.html?id=${encodeURIComponent(e.id)}">open entity workspace →</a>
      <div class="rg-neighbor-list"><div class="eyebrow">Direct neighborhood</div>${ns.slice(0,12).map(n=>`<button type="button" data-id="${esc(n.id)}">${esc(n.name)}<small>${esc(pretty(n.kind))}</small></button>`).join('')||'<p>No direct edges encoded.</p>'}</div>
      <div class="notice">Reference association only. A historical mechanism must separately encode direction, time plausibility, geography/contact, source support, counterevidence and rivals.</div>`;
    inspector.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.id;render()}));
  }

  let data=null;
  async function init(){
    data=await load();
    const all=data.entities||[];
    const kinds=[...new Set(all.map(e=>e.kind))].sort();
    const sel=document.getElementById('rgKind');
    sel.innerHTML='<option value="ALL">All entity types</option>'+kinds.map(k=>`<option value="${esc(k)}">${esc(pretty(k))}</option>`).join('');
    document.getElementById('rgQ').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render()});
    sel.addEventListener('change',e=>{kind=e.target.value;render()});
    document.getElementById('rgReset').addEventListener('click',()=>{scale=1;tx=0;ty=0;selected=null;query='';document.getElementById('rgQ').value='';kind='ALL';sel.value='ALL';render()});
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    svg.addEventListener('wheel',e=>{e.preventDefault();const d=e.deltaY<0?1.1:.9;scale=Math.max(.55,Math.min(2.5,scale*d));applyTransform()},{passive:false});
    svg.addEventListener('pointerdown',e=>{if(e.target.closest('[data-node]'))return;drag={x:e.clientX,y:e.clientY,tx,ty};svg.setPointerCapture(e.pointerId)});
    svg.addEventListener('pointermove',e=>{if(!drag)return;tx=drag.tx+(e.clientX-drag.x);ty=drag.ty+(e.clientY-drag.y);applyTransform()});
    svg.addEventListener('pointerup',()=>drag=null);
    svg.addEventListener('pointercancel',()=>drag=null);
    render();
  }
  function applyTransform(){
    const g=svg.querySelector('#rgViewport'); if(g)g.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);
  }
  function render(){
    const all=data?.entities||[];
    const included=new Set(all.filter(e=>(kind==='ALL'||e.kind===kind)&&(!query||[e.name,...(e.aliases||[]),...(e.roles||[])].join(' ').toLowerCase().includes(query))).map(e=>e.id));
    let nodes=all.filter(e=>included.has(e.id));
    const sourceIds=new Set(nodes.map(n=>n.id));
    if(selected && !sourceIds.has(selected)){
      const s=all.find(e=>e.id===selected); if(s){nodes=[s,...nodes];sourceIds.add(s.id)}
    }
    const allEdges=[];
    for(const e of all)for(const r of e.related_entities||[])if(all.some(x=>x.id===r))allEdges.push({a:e.id,b:r});
    const neigh=selected?neighbors(selected,allEdges):new Set();
    if(selected){
      for(const n of all)if(neigh.has(n.id)&&!sourceIds.has(n.id)){nodes.push(n);sourceIds.add(n.id)}
    }
    const edges=allEdges.filter(e=>sourceIds.has(e.a)&&sourceIds.has(e.b));
    const byId=new Map(all.map(e=>[e.id,e]));
    const pos=layout(nodes);
    let html='<g id="rgViewport">';
    for(const e of edges){
      const a=pos.get(e.a),b=pos.get(e.b);if(!a||!b)continue;
      const hi=!selected||e.a===selected||e.b===selected;
      html+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${hi?'hi':'dim'}"><title>Reference association: ${esc(byId.get(e.a)?.name)} ↔ ${esc(byId.get(e.b)?.name)}</title></line>`;
    }
    for(const n of nodes){
      const p=pos.get(n.id),g=kindGroup(n),hi=!selected||n.id===selected||neigh.has(n.id);
      html+=`<g data-node="${esc(n.id)}" class="rg-node ${g} ${hi?'hi':'dim'}" tabindex="0" role="link" aria-label="${esc(n.name)}">
        <circle cx="${p.x}" cy="${p.y}" r="${n.id===selected?12:8}"></circle>
        <text x="${p.x+13}" y="${p.y+4}">${esc(n.name)}</text>
        <title>${esc(n.name)} · ${esc(pretty(n.kind))}</title></g>`;
    }
    html+='</g>';
    svg.innerHTML=html;applyTransform();
    svg.querySelectorAll('[data-node]').forEach(g=>{
      const choose=()=>{selected=g.dataset.node;render()};
      g.addEventListener('click',choose);
      g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}});
    });
    inspect(selected?byId.get(selected):null,byId,allEdges);
  }
  init().catch(err=>{inspector.innerHTML=`<div class="notice">Relationship canvas failed to load: ${esc(err.message)}</div>`});
})();
