/* ============================================================================
   CALDAS STUDIO — Immersive Kit  ·  kit.js   (zero dependencies)
   window.Studio = { background, motion helpers }.  Auto-inits from the DOM:
     <canvas class="studio-bg" data-bg data-colors="#a,#b,#c" data-mode="aurora">
     [data-kin]  [data-reveal]  [data-parallax="0.2"]  [data-tilt]  [data-count]
   ============================================================================ */
(function(){
  "use strict";
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hex = h => { h=h.trim().replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join('');
    return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255]; };

  /* ---------------- WebGL living background ---------------- */
  const FRAG = `
  precision highp float;
  uniform vec2 uRes; uniform float uTime,uScroll,uMode; uniform vec2 uMouse; uniform vec3 uA,uB,uC;
  float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
  float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.02; a*=.5; } return s; }
  void main(){
    vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
    float t=uTime*0.045;
    float warp=fbm(p*1.5+vec2(t,-t*0.7)+uMouse*0.25);
    float n=fbm(p*2.3-vec2(t*0.8,t)+warp*1.2);
    vec3 col=mix(uB,uA,smoothstep(-.7,.85,p.y+warp*0.45));
    col=mix(col,uC,smoothstep(.25,.85,n)*0.65);
    // flowing glow orbs
    float orb=0.;
    for(int i=0;i<3;i++){ float fi=float(i);
      vec2 c=vec2(sin(t*1.3+fi*2.1)*0.55, cos(t*1.05+fi*1.7)*0.32+0.12);
      orb+=0.018/(length(p-c)+0.04); }
    col+=uC*orb*mix(0.18,0.42,step(0.5,uMode));
    // aurora vertical ribbons when mode>1.5
    if(uMode>1.5){ float rib=(0.5+0.5*sin(p.x*7.+t*6.))*(0.5+0.5*sin(p.x*15.-t*4.+p.y*5.));
      rib*=smoothstep(-0.1,0.6,p.y); col+=uC*rib*0.25; }
    col*=mix(1.0,0.55,clamp(uScroll,0.,1.)*0.7);          // settle darker as you descend
    col*=1.0-0.42*length(p*vec2(.72,1.));                  // vignette
    col+=(hash(gl_FragCoord.xy+uTime)-0.5)*0.02;           // dither
    gl_FragColor=vec4(max(col,0.0),1.0);
  }`;
  const VERT = `attribute vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;

  function LivingBackground(canvas, opts){
    opts = opts||{};
    const colors = (opts.colors||['#0b0b12','#241a3a','#e0b25c']).map(hex);
    while(colors.length<3) colors.push(colors[colors.length-1]);
    const modeMap={haze:0,embers:1,waves:0,pulse:1,aurora:2};
    const mode = modeMap[opts.mode]!==undefined ? modeMap[opts.mode] : 0;
    let gl, prog, U={}, raf, mouse=[0,0], tmouse=[0,0], scroll=0, t0=performance.now();
    try{
      gl = canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});
      if(!gl) throw 0;
      const sh=(type,src)=>{ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
        if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      prog=gl.createProgram(); gl.attachShader(prog,sh(gl.VERTEX_SHADER,VERT)); gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FRAG));
      gl.linkProgram(prog); gl.useProgram(prog);
      const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(prog,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      ['uRes','uTime','uScroll','uMode','uMouse','uA','uB','uC'].forEach(n=>U[n]=gl.getUniformLocation(prog,n));
      gl.uniform3fv(U.uA,colors[0]); gl.uniform3fv(U.uB,colors[1]); gl.uniform3fv(U.uC,colors[2]); gl.uniform1f(U.uMode,mode);
    }catch(e){ // fallback: CSS gradient
      canvas.style.display='none';
      document.body.style.background=`linear-gradient(160deg, ${opts.colors?opts.colors.join(','):'#0b0b12,#241a3a,#e0b25c'})`;
      return;
    }
    const resize=()=>{ const d=Math.min(devicePixelRatio,2); canvas.width=innerWidth*d; canvas.height=innerHeight*d;
      canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(U.uRes,canvas.width,canvas.height); };
    resize(); addEventListener('resize',resize);
    addEventListener('pointermove',e=>{ tmouse=[(e.clientX/innerWidth)*2-1,-((e.clientY/innerHeight)*2-1)]; },{passive:true});
    addEventListener('scroll',()=>{ const h=document.body.scrollHeight-innerHeight; scroll=h>0?scrollY/h:0; },{passive:true});
    canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); cancelAnimationFrame(raf); });
    function frame(){ raf=requestAnimationFrame(frame);
      mouse[0]+=(tmouse[0]-mouse[0])*0.05; mouse[1]+=(tmouse[1]-mouse[1])*0.05;
      gl.uniform1f(U.uTime,(performance.now()-t0)/1000);
      gl.uniform1f(U.uScroll,scroll); gl.uniform2f(U.uMouse,mouse[0],mouse[1]);
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(reduce){ cancelAnimationFrame(raf); } }
    frame();
    return { destroy(){ cancelAnimationFrame(raf); } };
  }

  /* ---------------- motion primitives ---------------- */
  function reveal(){ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:.16});
    document.querySelectorAll('.reveal,[data-reveal]').forEach(el=>{ el.classList.add('reveal'); io.observe(el); }); }

  function kinetic(){ document.querySelectorAll('[data-kin]').forEach(el=>{ const txt=el.textContent; el.textContent=''; el.classList.add('kin');
    [...txt].forEach((ch,i)=>{ const s=document.createElement('span'); s.textContent=ch===' '?' ':ch; s.style.animationDelay=(0.12+i*0.045)+'s'; el.appendChild(s); }); }); }

  function parallax(){ if(reduce) return; const els=[...document.querySelectorAll('[data-parallax]')];
    const tiles=[...document.querySelectorAll('.tile .layer')];
    addEventListener('scroll',()=>{ const vh=innerHeight;
      els.forEach(el=>{ const r=el.getBoundingClientRect(); const s=parseFloat(el.dataset.parallax)||0.15;
        el.style.transform=`translateY(${(r.top+r.height/2-vh/2)*-s}px)`; });
      tiles.forEach(el=>{ const r=el.parentElement.getBoundingClientRect();
        el.style.transform=`translateY(${(r.top+r.height/2-vh/2)*-0.08}px) scale(1.15)`; });
    },{passive:true}); }

  function tilt(){ if(reduce) return; document.querySelectorAll('[data-tilt],.card').forEach(el=>{
    el.addEventListener('pointermove',e=>{ const r=el.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      el.style.transform=`perspective(800px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-6px)`; });
    el.addEventListener('pointerleave',()=>{ el.style.transform=''; }); }); }

  function magnetic(){ if(reduce) return; document.querySelectorAll('.magnetic,[data-magnetic]').forEach(el=>{
    el.addEventListener('pointermove',e=>{ const r=el.getBoundingClientRect();
      el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*0.25}px,${(e.clientY-r.top-r.height/2)*0.35}px)`; });
    el.addEventListener('pointerleave',()=>{ el.style.transform=''; }); }); }

  function cursor(){ if(matchMedia('(hover:none),(pointer:coarse)').matches) return;
    const dot=document.createElement('div'), ring=document.createElement('div');
    dot.className='cur-dot'; ring.className='cur-ring'; document.body.append(dot,ring); document.body.classList.add('cursor-on');
    let rx=0,ry=0,mx=0,my=0; addEventListener('pointermove',e=>{ mx=e.clientX; my=e.clientY; },{passive:true});
    (function loop(){ rx+=(mx-rx)*.18; ry+=(my-ry)*.18;
      dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    document.querySelectorAll('a,button,.card,[data-tilt],.rail i').forEach(el=>{
      el.addEventListener('pointerenter',()=>ring.classList.add('big'));
      el.addEventListener('pointerleave',()=>ring.classList.remove('big')); }); }

  function navScroll(){ const nav=document.querySelector('.nav'); if(!nav) return;
    addEventListener('scroll',()=>nav.classList.toggle('solid',scrollY>innerHeight*0.5),{passive:true}); }

  function rail(){ const host=document.querySelector('.rail'); if(!host) return;
    const secs=[...document.querySelectorAll('section[id]')]; if(!secs.length){ host.remove(); return; }
    secs.forEach(s=>{ const i=document.createElement('i'); i.title=s.id; i.onclick=()=>s.scrollIntoView({behavior:'smooth'}); host.appendChild(i); });
    const dots=[...host.children];
    new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ const k=secs.indexOf(e.target); dots.forEach((d,i)=>d.classList.toggle('on',i===k)); } }),{threshold:.5})
      .observe && secs.forEach((s,i)=>new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) dots.forEach((d,j)=>d.classList.toggle('on',j===i)); }),{threshold:.5}).observe(s)); }

  function countUp(){ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting) return; io.unobserve(e.target);
    const el=e.target, to=parseFloat(el.dataset.count), suf=el.dataset.suffix||'', dur=1400, t0=performance.now();
    (function tick(now){ const p=Math.min(1,(now-t0)/dur); const v=to*(1-Math.pow(1-p,3));
      el.textContent=(to%1?v.toFixed(1):Math.round(v))+suf; if(p<1) requestAnimationFrame(tick); })(t0); }),{threshold:.5});
    document.querySelectorAll('[data-count]').forEach(el=>io.observe(el)); }

  function marquee(){ document.querySelectorAll('.marquee .track').forEach(tr=>{ tr.innerHTML+=tr.innerHTML; }); }

  function loader(){ const el=document.querySelector('.loader'); if(!el) return; const bar=el.querySelector('.bar i'); let p=0;
    const iv=setInterval(()=>{ p=Math.min(100,p+Math.random()*24); if(bar) bar.style.width=p+'%';
      if(p>=100){ clearInterval(iv); setTimeout(()=>el.classList.add('done'),400); } },120);
    setTimeout(()=>el.classList.add('done'),4200); addEventListener('load',()=>setTimeout(()=>el.classList.add('done'),700)); }

  let scrollY0=0; addEventListener('scroll',()=>scrollY0=scrollY,{passive:true});

  function init(){
    document.querySelectorAll('canvas[data-bg]').forEach(c=>{
      LivingBackground(c,{ colors:(c.dataset.colors||'').split(',').filter(Boolean), mode:c.dataset.mode }); });
    reveal(); kinetic(); parallax(); tilt(); magnetic(); cursor(); navScroll(); rail(); countUp(); marquee(); loader();
  }
  window.Studio = { LivingBackground, init };
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);
})();
