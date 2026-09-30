(()=>{const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const modal=q('#interestModal');const openModal=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false')};const closeModal=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')};qa('.js-interest').forEach(b=>b.addEventListener('click',openModal));q('#closeModal').onclick=closeModal;modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
let selected='Ascent';qa('.choices button').forEach((b,i)=>{if(i===0)b.classList.add('active');b.onclick=()=>{qa('.choices button').forEach(x=>x.classList.remove('active'));b.classList.add('active');selected=b.dataset.package}});
q('#composeMail').onclick=()=>{const name=q('#interestName').value.trim()||'Potential founding athlete';const email=q('#interestEmail').value.trim()||'(not provided)';const surf=q('#surfSelect').value;const subject=encodeURIComponent('Atoll Ascent — founding interest');const body=encodeURIComponent('Hi Atoll Ascent team,\n\nI am interested in the founding concept.\n\nName: '+name+'\nEmail: '+email+'\nPackage: '+selected+'\nSurf: '+surf+'\n\nI understand dates, routes, suppliers and final prices are TBC and that this is only an expression of interest.');location.href='mailto:?subject='+subject+'&body='+body};
const menu=q('#mobileMenu'),mb=q('#menuButton');const openMenu=()=>{menu.classList.add('open');menu.setAttribute('aria-hidden','false');mb.setAttribute('aria-expanded','true');document.body.classList.add('menu-open')};const closeMenu=()=>{menu.classList.remove('open');menu.setAttribute('aria-hidden','true');mb.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')};mb.onclick=openMenu;q('#menuClose').onclick=closeMenu;qa('#mobileMenu a').forEach(a=>a.addEventListener('click',closeMenu));
const reveals=qa('.reveal');if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.14});reveals.forEach(el=>io.observe(el))}else reveals.forEach(el=>el.classList.add('visible'));
const track=q('#raceTrack'),bar=q('#raceProgress');const update=()=>{const max=Math.max(1,track.scrollWidth-track.clientWidth);bar.style.width=(25+75*Math.min(1,track.scrollLeft/max))+'%'};track.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});update();
const heroQuotes=[
'Adulting is getting in the way of your life.',
'Your calendar has had enough influence.',
'You can answer emails when you get back.',
'Somewhere between responsible adult and excellent story.',
'If life feels too scheduled, race an island.',
'All-inclusive. Except common sense.',
'The out-of-office reply writes itself.',
'Your inbox will survive. Probably.',
'You did not work this hard to become boring.',
'Consider this a performance review for your soul.',
'There are easier holidays. That is not the point.',
'You can be sensible again on Monday.'
];
const heroRandom=q('#heroRandom');
const pickHeroQuote=()=>{if(!heroRandom)return;let next=heroQuotes[Math.floor(Math.random()*heroQuotes.length)];if(next===heroRandom.textContent&&heroQuotes.length>1)next=heroQuotes[(heroQuotes.indexOf(next)+1)%heroQuotes.length];heroRandom.classList.add('swap');setTimeout(()=>{heroRandom.textContent=next;heroRandom.classList.remove('swap')},160)};
pickHeroQuote();
setInterval(pickHeroQuote,5200);
const notes=['THE OCEAN DOES NOT CARE ABOUT YOUR FTP.','SLEEP IS AVAILABLE. TECHNICALLY.','PARADISE IS A TERRIBLE PLACE FOR GOOD DECISIONS.','THE BRIEFING WILL BE SERIOUS. THE IDEA IS NOT ENTIRELY.','YOU WILL PROBABLY BE FINE.'];let ni=0;q('#surprise').onclick=()=>{ni=(ni+1)%notes.length;q('#fieldNote').textContent=notes[ni];const destinations=['#race','./after-dark/','./expeditions/','#camp','#escape'];const d=destinations[ni];if(d.startsWith('#'))setTimeout(()=>q(d)?.scrollIntoView({behavior:'smooth'}),180);else setTimeout(()=>location.href=d,220)};
})();