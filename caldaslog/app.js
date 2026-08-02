(() => {
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motionEnabled = !reduceMotion;

  // Loader
  addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), 380));

  // Reveal + nav rail
  const panels = $$('.panel');
  const rail = $('#rail');
  panels.forEach((p, i) => {
    const b = document.createElement('button'); b.className='rail-dot'; b.setAttribute('aria-label', `Go to section ${i+1}`); b.onclick=()=>p.scrollIntoView({behavior:'smooth'}); rail.appendChild(b);
  });
  const railDots = $$('.rail-dot');
  const io = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) $$('.reveal', e.target).forEach(el=>el.classList.add('in')); }), {threshold:.16});
  panels.forEach(p=>io.observe(p));
  $$('.reveal', panels[0]).forEach(el=>el.classList.add('in'));
  const panelObserver = new IntersectionObserver(entries => entries.forEach(e=>{ if(e.isIntersecting){ const i=panels.indexOf(e.target); railDots.forEach((d,j)=>d.classList.toggle('active',i===j)); }}),{threshold:.52});
  panels.forEach(p=>panelObserver.observe(p));

  // Scroll state
  let scrollN=0;
  const syncScroll = () => {
    const max = document.documentElement.scrollHeight-innerHeight;
    scrollN = max ? scrollY/max : 0;
    $('#progress').style.width = `${scrollN*100}%`;
    $('#header').classList.toggle('scrolled', scrollY>30);
    $('#commandBar').classList.toggle('show', scrollY>innerHeight*.55);
  };
  addEventListener('scroll', syncScroll, {passive:true}); syncScroll();
  $$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.scroll).scrollIntoView({behavior:'smooth'})));

  // Mobile menu simply opens settings/navigation drawer for MVP
  $('#menuBtn').onclick = () => openDrawer();
  $('#settingsBtn').onclick = () => openDrawer();
  function openDrawer(){ $('#drawer').classList.add('open'); document.body.style.overflow='hidden'; }
  function closeDrawer(){ $('#drawer').classList.remove('open'); document.body.style.overflow=''; }
  $$('[data-close-drawer]').forEach(x=>x.onclick=closeDrawer);
  $$('.toggle').forEach(t=>t.onclick=()=>{
    t.classList.toggle('on');
    if(t.dataset.toggle==='motion') motionEnabled=t.classList.contains('on') && !reduceMotion;
    if(t.dataset.toggle==='command') $('#commandBar').style.display=t.classList.contains('on')?'flex':'none';
  });

  // Demo sync
  let toastTimer;
  const runSync = () => {
    $('#syncText').textContent='Syncing mock sources…';
    setTimeout(()=>{
      $('#syncText').textContent='Synced just now';
      showToast('Demo sync complete','14 synthetic items normalized into 4 events, 3 actions and 1 wardrobe reminder.');
    },760);
  };
  ['syncBtn','heroSync','finalSync'].forEach(id=>$('#'+id).onclick=runSync);
  function showToast(title,copy){ clearTimeout(toastTimer); $('#toastTitle').textContent=title; $('#toastCopy').textContent=copy; $('#toast').classList.add('show'); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4200); }

  // Actions
  $$('.check-btn').forEach(btn=>btn.onclick=()=>{ const card=btn.closest('.action-card'); card.classList.toggle('done'); showToast(card.classList.contains('done')?'Action completed':'Action reopened', $('.action-copy h4',card).textContent); });

  // Ask demo
  const answers = [
    '<strong>Tomorrow:</strong> pack indoor shoes, a water bottle and the blue training top. Leave by 16:05 for practice. No forms are due.',
    '<strong>One conflict:</strong> pickup ends 15 minutes before handball departure. The safest handoff is to assign pickup to the second parent.',
    '<strong>Wardrobe:</strong> the rain shell is ready, match shorts are drying, and the fleece should be reviewed for size within three weeks.'
  ];
  let ai=0;
  function answer(input,target){ target.innerHTML='<span style="opacity:.65">Reading the family graph…</span>'; setTimeout(()=>{ target.innerHTML=answers[ai++%answers.length]; },520); }
  $('#askBtn').onclick=()=>answer($('#askInput').value,$('#answer'));
  $('#askInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#askBtn').click()});
  $('#commandBtn').onclick=()=>{ answer($('#commandInput').value,$('#answer')); $('#actions').scrollIntoView({behavior:'smooth'}); };
  $('#commandInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#commandBtn').click()});

  // Clothes carousel + filters
  const carousel=$('#clothesCarousel');
  $('#nextClothes').onclick=()=>carousel.scrollBy({left:carousel.clientWidth*.72,behavior:'smooth'});
  $('#prevClothes').onclick=()=>carousel.scrollBy({left:-carousel.clientWidth*.72,behavior:'smooth'});
  $$('.filter-btn').forEach(b=>b.onclick=()=>{
    $$('.filter-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    $$('.clothing-card').forEach(c=>{ const show=b.dataset.filter==='all'||c.dataset.cat===b.dataset.filter; c.style.display=show?'flex':'none'; }); carousel.scrollTo({left:0,behavior:'smooth'});
  });

  // Pointer parallax
  const pointer={x:.5,y:.5};
  addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth; pointer.y=e.clientY/innerHeight; if(motionEnabled){ $('#orbitStage').style.transform=`rotateY(${(pointer.x-.5)*3}deg) rotateX(${(.5-pointer.y)*2}deg)`; }},{passive:true});

  // WebGL ambient scene. Pure WebGL, no external dependencies.
  const canvas=$('#scene');
  const gl=canvas.getContext('webgl',{antialias:false,alpha:false,powerPreference:'high-performance'});
  if(!gl){ canvas.style.background='radial-gradient(circle at 50% 20%,#15203a,#070915 60%)'; return; }
  const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs=`precision highp float;
    uniform vec2 r; uniform float t; uniform float s; uniform vec2 m; uniform float motion;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
    float lineCircle(vec2 uv,float rad,float w){return smoothstep(w,0.,abs(length(uv)-rad));}
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*r.xy)/min(r.x,r.y);
      vec2 q=gl_FragCoord.xy/r.xy;
      float tt=t*(.06+.08*motion);
      vec2 drift=vec2((m.x-.5)*.22,(m.y-.5)*.15)*motion;
      float n=fbm(uv*2.3+vec2(tt,-tt*.7)+drift);
      float n2=fbm(uv*4.1-vec2(tt*.7,tt*.3));
      vec3 bg=mix(vec3(.025,.035,.085),vec3(.055,.045,.13),q.y);
      vec3 cyan=vec3(.20,.82,.76),violet=vec3(.48,.36,.86),peach=vec3(.92,.48,.31);
      float aur=smoothstep(.36,.88,n)*(.22+.24*sin(s*6.283));
      bg+=mix(cyan,violet,n2)*aur*.28;
      bg+=peach*pow(max(0.,n2-.64),2.)*.24*(.4+.6*s);
      float core=exp(-5.6*length(uv-vec2(sin(tt*.8)*.06,cos(tt*.6)*.04)));
      bg+=mix(cyan,violet,s)*core*.2;
      float rings=lineCircle(uv, .25+.04*sin(s*6.283),.003)+lineCircle(uv,.43+.03*cos(s*9.),.002);
      bg+=cyan*rings*(.08+.1*(1.-s));
      vec2 grid=fract((uv+vec2(s*.13,0.))*vec2(48.,31.))-.5;
      vec2 id=floor((uv+vec2(s*.13,0.))*vec2(48.,31.));
      float star=step(.982,hash(id))*smoothstep(.09,0.,length(grid));
      bg+=vec3(1.)*star*(.35+.65*hash(id+4.));
      float vign=smoothstep(1.05,.18,length(uv)); bg*=.55+.45*vign;
      bg+=.012*(hash(gl_FragCoord.xy+fract(t)*91.)-.5);
      gl_FragColor=vec4(bg,1.);
    }`;
  function shader(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);return sh}
  const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);gl.useProgram(prog);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const U={r:gl.getUniformLocation(prog,'r'),t:gl.getUniformLocation(prog,'t'),s:gl.getUniformLocation(prog,'s'),m:gl.getUniformLocation(prog,'m'),motion:gl.getUniformLocation(prog,'motion')};
  function resize(){const d=Math.min(devicePixelRatio,1.6);const w=Math.floor(innerWidth*d),h=Math.floor(innerHeight*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}} addEventListener('resize',resize);resize();
  const start=performance.now();
  function frame(now){resize();gl.uniform2f(U.r,canvas.width,canvas.height);gl.uniform1f(U.t,(now-start)/1000);gl.uniform1f(U.s,scrollN);gl.uniform2f(U.m,pointer.x,pointer.y);gl.uniform1f(U.motion,motionEnabled?1:0);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(frame)} requestAnimationFrame(frame);
})();
