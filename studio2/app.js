import { ACTS, PROJECTS } from './projects.js';
import { StoryWorld } from './world.js';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
let index=0, world, activeFilter='all';
const els={opening:$('#opening'),actRail:$('#actRail'),num:$('#sceneNumber'),tone:$('#sceneTone'),title:$('#sceneTitle'),line:$('#sceneLine'),body:$('#sceneBody'),copy:$('#scene-copy'),drawer:$('#projectDrawer'),drawerTitle:$('#drawerTitle'),projects:$('#projects'),search:$('#search'),filters:$('#filters'),map:$('#mapPanel'),mapGrid:$('#mapGrid'),modal:$('#projectModal'),modalContent:$('#modalContent'),quality:$('#qualityBtn')};

function init(){
  world=new StoryWorld($('#world'),d=>go(index+d));
  ACTS.forEach((a,i)=>{
    const b=document.createElement('button');b.className='act-dot';b.textContent=a.n;b.title=`${a.n} ${a.title}`;b.onclick=()=>go(i);els.actRail.append(b);
    const m=document.createElement('button');m.className='map-act';m.innerHTML=`<b>${a.n} · ${a.title}</b><span>${a.line}</span>`;m.onclick=()=>{go(i);toggleMap(false)};els.mapGrid.append(m)
  });
  ['all','living','prototype','archived','buried'].forEach(s=>{
    const b=document.createElement('button');b.className='filter'+(s==='all'?' active':'');b.textContent=s;b.onclick=()=>{activeFilter=s;$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderProjects()};els.filters.append(b)
  });
  $('#enterBtn').onclick=enter;$('#quickBtn').onclick=()=>{enter();openDrawer()};$('#homeBtn').onclick=()=>{index=0;go(0);els.opening.classList.remove('hidden');els.copy.classList.remove('visible')};
  $('#projectsBtn').onclick=openDrawer;$('#nextBtn').onclick=()=>go(index+1);$('#drawerClose').onclick=()=>toggleDrawer(false);$('#mapBtn').onclick=()=>toggleMap(true);$('#mapClose').onclick=()=>toggleMap(false);$('#modalClose').onclick=()=>els.modal.close();els.search.oninput=renderProjects;
  els.quality.onclick=()=>{const q=world.cycleQuality();els.quality.textContent='Quality · '+q[0].toUpperCase()+q.slice(1);els.quality.setAttribute('aria-pressed',q!=='auto')};
  addEventListener('keydown',e=>{if(e.key==='Escape'){toggleDrawer(false);toggleMap(false);if(els.modal.open)els.modal.close()}if(e.key==='ArrowRight')go(index+1);if(e.key==='ArrowLeft')go(index-1)});
  renderScene();
}
function enter(){els.opening.classList.add('hidden');setTimeout(()=>els.copy.classList.add('visible'),240);world.wake(3000)}
function go(i){index=(i+ACTS.length)%ACTS.length;renderScene();world.setAct(ACTS[index].id);world.wake(2200)}
function renderScene(){const a=ACTS[index];els.num.textContent=a.n;els.tone.textContent=a.tone;els.title.textContent=a.title;els.line.textContent=a.line;els.body.textContent=a.body;$$('.act-dot').forEach((b,i)=>b.classList.toggle('active',i===index))}
function toggleDrawer(on){els.drawer.classList.toggle('open',on);els.drawer.setAttribute('aria-hidden',String(!on));if(on)world.running=false;else world.wake()}
function openDrawer(){els.drawerTitle.textContent=ACTS[index].title;els.search.value='';activeFilter='all';$$('.filter').forEach((b,i)=>b.classList.toggle('active',i===0));renderProjects();toggleDrawer(true)}
function renderProjects(){
  const q=els.search.value.trim().toLowerCase();const act=ACTS[index].id;
  const data=PROJECTS.filter(p=>p.act===act).filter(p=>activeFilter==='all'||p.status===activeFilter).filter(p=>!q||[p.title,p.summary,p.built,p.lesson,...p.skills].join(' ').toLowerCase().includes(q));
  els.projects.innerHTML='';
  if(!data.length){els.projects.innerHTML='<p class="tiny">No matching projects in this act.</p>';return}
  data.forEach(p=>{
    const c=document.createElement('article');c.className='project-card';
    c.innerHTML=`<div class="project-top"><div><span class="eyebrow">${p.year||''}</span><h3>${p.title}</h3></div><span class="status ${p.status}">${p.status}</span></div><p>${p.summary}</p><div class="skills">${p.skills.map(s=>`<span class="skill">${s}</span>`).join('')}</div>`;
    c.onclick=()=>openProject(p);els.projects.append(c)
  })
}
function openProject(p){
  const links=[['Enter',p.live,'primary-link'],['Live frontend',p.frontend],['Backend / API',p.backend],['GitHub',p.repo],['Knowledge',p.knowledge]].filter(x=>x[1]);
  els.modalContent.innerHTML=`<p class="eyebrow">${ACTS.find(a=>a.id===p.act)?.title||''} · ${p.status}</p><h2>${p.title}</h2><p class="summary">${p.summary}</p><div class="meta-grid"><div class="meta"><b>What I built</b><span>${p.built}</span></div><div class="meta"><b>What survived</b><span>${p.lesson}</span></div><div class="meta"><b>Skills</b><span>${p.skills.join(' · ')}</span></div><div class="meta"><b>State</b><span>${p.status} · ${p.year||'undated'}</span></div></div><div class="link-row">${links.map(([l,u,c=''])=>`<a class="${c}" href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join('')}</div>${p.id==='studio2'?`<div class="higgsfield-art"><img alt="Studio 2 cinematic environment concept art generated with Higgsfield" src="https://d8j0ntlcm91z4.cloudfront.net/user_31Vx2ThP2hxeA9WUkkpCfbJLaeb/hf_20261001_174949_b1e6d49e-6df0-4a18-8753-bde9619e9162.png"></div>`:''}`;
  els.modal.showModal()
}
function toggleMap(on){els.map.classList.toggle('open',on);els.map.setAttribute('aria-hidden',String(!on));if(on)world.running=false;else world.wake()}
init();
