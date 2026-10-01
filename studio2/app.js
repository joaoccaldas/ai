import { ACTS, PROJECTS } from './projects.js';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
let index=0, activeFilter='all', drawerScope='act';
let world={running:false,setAct(){},wake(){},cycleQuality(){return '2d'}};
const els={
  opening:$('#opening'),actRail:$('#actRail'),num:$('#sceneNumber'),tone:$('#sceneTone'),title:$('#sceneTitle'),line:$('#sceneLine'),body:$('#sceneBody'),copy:$('#scene-copy'),
  drawer:$('#projectDrawer'),drawerTitle:$('#drawerTitle'),projects:$('#projects'),search:$('#search'),filters:$('#filters'),
  map:$('#mapPanel'),mapGrid:$('#mapGrid'),modal:$('#projectModal'),modalContent:$('#modalContent'),quality:$('#qualityBtn'),worldStatus:$('#worldStatus')
};

function safe(fn){return (...args)=>{try{return fn(...args)}catch(err){console.error('[studio2]',err)}}}

function initUI(){
  ACTS.forEach((a,i)=>{
    const b=document.createElement('button');b.className='act-dot';b.type='button';b.textContent=a.n;b.title=`${a.n} ${a.title}`;b.setAttribute('aria-label',`Go to ${a.title}`);b.addEventListener('click',()=>go(i));els.actRail.append(b);
    const m=document.createElement('button');m.type='button';m.className='map-act';m.innerHTML=`<b>${a.n} · ${a.title}</b><span>${a.line}</span>`;m.addEventListener('click',()=>{go(i);toggleMap(false)});els.mapGrid.append(m)
  });
  ['all','living','prototype','archived','buried'].forEach(s=>{
    const b=document.createElement('button');b.type='button';b.className='filter'+(s==='all'?' active':'');b.textContent=s;
    b.addEventListener('click',()=>{activeFilter=s;$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderProjects()});els.filters.append(b)
  });

  $('#enterBtn').addEventListener('click',enter);
  $('#quickBtn').addEventListener('click',()=>{enter();openDrawer('all')});
  $('#homeBtn').addEventListener('click',()=>{index=0;go(0);els.opening.classList.remove('hidden');els.copy.classList.remove('visible')});
  $('#projectsBtn').addEventListener('click',()=>openDrawer('act'));
  $('#allProjectsBtn').addEventListener('click',()=>openDrawer('all'));
  $('#prevBtn').addEventListener('click',()=>go(index-1));
  $('#nextBtn').addEventListener('click',()=>go(index+1));
  $('#drawerClose').addEventListener('click',()=>toggleDrawer(false));
  $('#mapBtn').addEventListener('click',()=>toggleMap(true));
  $('#mapClose').addEventListener('click',()=>toggleMap(false));
  $('#modalClose').addEventListener('click',closeModal);
  els.search.addEventListener('input',renderProjects);
  els.quality.addEventListener('click',()=>{
    const q=world.cycleQuality();els.quality.textContent='Quality · '+q[0].toUpperCase()+q.slice(1);els.quality.setAttribute('aria-pressed',q!=='auto')
  });
  addEventListener('keydown',e=>{
    if(e.key==='Escape'){toggleDrawer(false);toggleMap(false);closeModal()}
    if(e.key==='ArrowRight'&&!isTextInput(e.target))go(index+1);
    if(e.key==='ArrowLeft'&&!isTextInput(e.target))go(index-1)
  });
  renderScene();
}

async function bootWorld(){
  try{
    const {StoryWorld}=await import('./world.js');
    world=new StoryWorld($('#world'),d=>go(index+d));
    world.setAct(ACTS[index].id);
    document.body.classList.add('world-ready');
    els.worldStatus.textContent='3D ready';
    setTimeout(()=>els.worldStatus.classList.add('quiet'),1200);
  }catch(err){
    console.error('[studio2] 3D unavailable; UI remains functional.',err);
    document.body.classList.add('world-fallback');
    els.worldStatus.textContent='2D mode · projects still work';
    els.quality.disabled=true;
    els.quality.textContent='3D unavailable';
  }
}

function isTextInput(el){return el&&(['INPUT','TEXTAREA','SELECT'].includes(el.tagName)||el.isContentEditable)}
function enter(){els.opening.classList.add('hidden');els.copy.classList.add('visible');world.wake(3000)}
function go(i){
  index=(i+ACTS.length)%ACTS.length;renderScene();
  try{world.setAct(ACTS[index].id);world.wake(2200)}catch(err){console.warn('[studio2] scene switch skipped',err)}
}
function renderScene(){
  const a=ACTS[index];els.num.textContent=a.n;els.tone.textContent=a.tone;els.title.textContent=a.title;els.line.textContent=a.line;els.body.textContent=a.body;
  $$('.act-dot').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-current',i===index?'step':'false')})
}
function toggleDrawer(on){els.drawer.classList.toggle('open',on);els.drawer.setAttribute('aria-hidden',String(!on));document.body.classList.toggle('sheet-open',on||els.map.classList.contains('open'));if(on)world.running=false;else world.wake()}
function openDrawer(scope='act'){
  drawerScope=scope;els.drawerTitle.textContent=scope==='all'?'All projects':ACTS[index].title;
  els.search.value='';activeFilter='all';$$('.filter').forEach((b,i)=>b.classList.toggle('active',i===0));renderProjects();toggleDrawer(true)
}
function renderProjects(){
  const q=els.search.value.trim().toLowerCase();const act=ACTS[index].id;
  const data=PROJECTS.filter(p=>drawerScope==='all'||p.act===act).filter(p=>activeFilter==='all'||p.status===activeFilter).filter(p=>!q||[p.title,p.summary,p.built,p.lesson,...p.skills].join(' ').toLowerCase().includes(q));
  els.projects.innerHTML='';
  if(!data.length){els.projects.innerHTML='<p class="tiny">No matching projects.</p>';return}
  data.forEach(p=>{
    const c=document.createElement('button');c.type='button';c.className='project-card';
    c.innerHTML=`<div class="project-top"><div><span class="eyebrow">${p.year||''}</span><h3>${p.title}</h3></div><span class="status ${p.status}">${p.status}</span></div><p>${p.summary}</p><div class="skills">${p.skills.map(s=>`<span class="skill">${s}</span>`).join('')}</div>`;
    c.addEventListener('click',()=>openProject(p));els.projects.append(c)
  })
}
function openProject(p){
  const links=[['Enter',p.live,'primary-link'],['Live frontend',p.frontend],['Backend / API',p.backend],['GitHub',p.repo],['Knowledge',p.knowledge]].filter(x=>x[1]);
  els.modalContent.innerHTML=`<p class="eyebrow">${ACTS.find(a=>a.id===p.act)?.title||''} · ${p.status}</p><h2>${p.title}</h2><p class="summary">${p.summary}</p><div class="meta-grid"><div class="meta"><b>What I built</b><span>${p.built}</span></div><div class="meta"><b>What survived</b><span>${p.lesson}</span></div><div class="meta"><b>Skills</b><span>${p.skills.join(' · ')}</span></div><div class="meta"><b>State</b><span>${p.status} · ${p.year||'undated'}</span></div></div><div class="link-row">${links.map(([l,u,c=''])=>`<a class="${c}" href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join('')}</div>${p.id==='studio2'?`<div class="higgsfield-art"><img alt="Studio 2 cinematic environment concept art generated with Higgsfield" src="https://d8j0ntlcm91z4.cloudfront.net/user_31Vx2ThP2hxeA9WUkkpCfbJLaeb/hf_20261001_174949_b1e6d49e-6df0-4a18-8753-bde9619e9162.png"></div>`:''}`;
  if(typeof els.modal.showModal==='function')els.modal.showModal();else{els.modal.setAttribute('open','');els.modal.classList.add('dialog-fallback')}
}
function closeModal(){if(!els.modal)return;if(typeof els.modal.close==='function'&&els.modal.open)els.modal.close();else{els.modal.removeAttribute('open');els.modal.classList.remove('dialog-fallback')}}
function toggleMap(on){els.map.classList.toggle('open',on);els.map.setAttribute('aria-hidden',String(!on));document.body.classList.toggle('sheet-open',on||els.drawer.classList.contains('open'));if(on)world.running=false;else world.wake()}

initUI();
bootWorld();
