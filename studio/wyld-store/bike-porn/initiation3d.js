(() => {
  'use strict';

  // Web-optimized 3D ceremony derived from the Blender/Higgsfield art-direction scene.
  // It is deliberately isolated from the Speedmax Three.js renderer. If WebGL2 fails,
  // initiation.js keeps the SVG/CSS theatre as a complete fallback.

  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / Math.max(1e-6, b - a));
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;

  function mat4Identity() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }
  function mat4Mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[0 * 4 + r] * b[c * 4 + 0] + a[1 * 4 + r] * b[c * 4 + 1] + a[2 * 4 + r] * b[c * 4 + 2] + a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }
  function mat4Translate(x, y, z) {
    const m = mat4Identity(); m[12] = x; m[13] = y; m[14] = z; return m;
  }
  function mat4Scale(x, y, z) {
    const m = mat4Identity(); m[0] = x; m[5] = y; m[10] = z; return m;
  }
  function mat4RotX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
  }
  function mat4RotY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
  }
  function mat4RotZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
  }
  function compose(p = [0,0,0], r = [0,0,0], s = [1,1,1]) {
    return mat4Mul(mat4Translate(...p), mat4Mul(mat4RotZ(r[2] || 0), mat4Mul(mat4RotY(r[1] || 0), mat4Mul(mat4RotX(r[0] || 0), mat4Scale(...s)))));
  }
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,(2*far*near)*nf,0]);
  }
  function normalize(v) {
    const l = Math.hypot(v[0],v[1],v[2]) || 1; return [v[0]/l,v[1]/l,v[2]/l];
  }
  function cross(a,b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function sub(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
  function lookAt(eye, center, up=[0,1,0]) {
    const z = normalize(sub(eye,center));
    const x = normalize(cross(up,z));
    const y = cross(z,x);
    return new Float32Array([
      x[0],y[0],z[0],0,
      x[1],y[1],z[1],0,
      x[2],y[2],z[2],0,
      -(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),
      -(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),
      -(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1
    ]);
  }

  function geometryCube() {
    const p = [
      -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1,
       1,-1,-1, -1,-1,-1, -1, 1,-1,  1, 1,-1,
      -1, 1, 1,  1, 1, 1,  1, 1,-1, -1, 1,-1,
      -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,
       1,-1, 1,  1,-1,-1,  1, 1,-1,  1, 1, 1,
      -1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1
    ];
    const n = [
      0,0,1, 0,0,1, 0,0,1, 0,0,1,
      0,0,-1,0,0,-1,0,0,-1,0,0,-1,
      0,1,0,0,1,0,0,1,0,0,1,0,
      0,-1,0,0,-1,0,0,-1,0,0,-1,0,
      1,0,0,1,0,0,1,0,0,1,0,0,
      -1,0,0,-1,0,0,-1,0,0,-1,0,0
    ];
    const idx=[]; for(let f=0;f<6;f++){const o=f*4;idx.push(o,o+1,o+2,o,o+2,o+3);} return {p,n,idx};
  }
  function geometrySphere(lat=12, lon=18) {
    const p=[],n=[],idx=[];
    for(let y=0;y<=lat;y++){
      const v=y/lat, ph=v*Math.PI, sp=Math.sin(ph), cp=Math.cos(ph);
      for(let x=0;x<=lon;x++){
        const u=x/lon, th=u*TAU, st=Math.sin(th), ct=Math.cos(th);
        const nx=sp*ct, ny=cp, nz=sp*st; p.push(nx,ny,nz); n.push(nx,ny,nz);
      }
    }
    for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){
      const a=y*(lon+1)+x,b=a+lon+1;idx.push(a,b,a+1,b,b+1,a+1);
    } return {p,n,idx};
  }
  function geometryCylinder(seg=18) {
    const p=[],n=[],idx=[];
    for(let i=0;i<=seg;i++){
      const a=i/seg*TAU,c=Math.cos(a),s=Math.sin(a);
      p.push(c,-1,s,c,1,s);n.push(c,0,s,c,0,s);
    }
    for(let i=0;i<seg;i++){const a=i*2,b=a+2;idx.push(a,a+1,b,a+1,b+1,b);}
    const bot=p.length/3;p.push(0,-1,0);n.push(0,-1,0);
    const top=bot+1;p.push(0,1,0);n.push(0,1,0);
    for(let i=0;i<seg;i++){
      const a=i*2,b=((i+1)%seg)*2;idx.push(bot,b,a);idx.push(top,a+1,b+1);
    }
    return {p,n,idx};
  }
  function geometryTorus(M=24,N=8,R=.72,r=.18) {
    const p=[],n=[],idx=[];
    for(let i=0;i<M;i++){
      const u=i/M*TAU,cu=Math.cos(u),su=Math.sin(u);
      for(let j=0;j<N;j++){
        const v=j/N*TAU,cv=Math.cos(v),sv=Math.sin(v);
        p.push((R+r*cv)*cu,(R+r*cv)*su,r*sv);n.push(cv*cu,cv*su,sv);
      }
    }
    for(let i=0;i<M;i++)for(let j=0;j<N;j++){
      const ni=(i+1)%M,nj=(j+1)%N,a=i*N+j,b=ni*N+j,c=ni*N+nj,d=i*N+nj;idx.push(a,b,c,a,c,d);
    } return {p,n,idx};
  }

  const VS = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNor;
  uniform mat4 uVP;
  uniform mat4 uModel;
  out vec3 vN;
  out vec3 vW;
  void main(){vec4 w=uModel*vec4(aPos,1.0);vW=w.xyz;vN=mat3(uModel)*aNor;gl_Position=uVP*w;}`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 vN;in vec3 vW;
  uniform vec4 uColor;
  uniform vec3 uEmission;
  uniform float uMetal;
  uniform vec3 uCam;
  out vec4 outColor;
  void main(){
    vec3 N=normalize(vN);vec3 L=normalize(vec3(-.35,.76,.58));vec3 V=normalize(uCam-vW);
    float nd=max(dot(N,L),0.0);float rim=pow(1.0-max(dot(N,V),0.0),3.0);
    vec3 base=uColor.rgb*(.19+nd*.82);vec3 spec=vec3(.55)*pow(max(dot(reflect(-L,N),V),0.0),28.0)*(.15+uMetal*.8);
    vec3 col=base+spec+rim*vec3(.18,.23,.3)+uEmission;
    float fog=clamp((length(uCam-vW)-7.0)/12.0,0.0,1.0);col=mix(col,vec3(.018,.02,.027),fog*.5);
    outColor=vec4(col,uColor.a);
  }`;

  function compile(gl, type, src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function program(gl){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,VS));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
  function upload(gl,g){
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);
    const pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.p),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
    const nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.n),gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(g.idx),gl.STATIC_DRAW);
    gl.bindVertexArray(null);return {vao,count:g.idx.length};
  }

  const C = {
    stone:[.075,.085,.105,1], stone2:[.17,.15,.16,1], wood:[.29,.12,.05,1], iron:[.035,.04,.05,1], gold:[.58,.38,.11,1],
    velvet:[.31,.018,.065,1], black:[.018,.02,.028,1], ivory:[.82,.78,.7,1], koala:[.39,.43,.46,1], dark:[.055,.06,.07,1],
    alien:[.42,.6,.62,1], ghost:[.55,.82,.88,.55], pink:[.78,.015,.28,1], cyan:[.04,.43,.62,1], portal:[.92,.75,.48,.72]
  };

  function attach(container){
    try{
      const canvas=document.createElement('canvas');canvas.className='wyld-init__3d';canvas.setAttribute('aria-hidden','true');container.prepend(canvas);
      const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});
      if(!gl){canvas.remove();return null;}
      const prog=program(gl);gl.useProgram(prog);
      const uVP=gl.getUniformLocation(prog,'uVP'),uModel=gl.getUniformLocation(prog,'uModel'),uColor=gl.getUniformLocation(prog,'uColor'),uEmission=gl.getUniformLocation(prog,'uEmission'),uMetal=gl.getUniformLocation(prog,'uMetal'),uCam=gl.getUniformLocation(prog,'uCam');
      const geo={cube:upload(gl,geometryCube()),sphere:upload(gl,geometrySphere()),cyl:upload(gl,geometryCylinder()),torus:upload(gl,geometryTorus())};
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

      let running=true,ceremonyStart=null,ceremonyDone=false,unlockStart=null,lastW=0,lastH=0;
      const eye=[0,3.0,11.8],target=[0,2.25,-.45];

      function resize(){
        const dpr=Math.min(devicePixelRatio||1,innerWidth<800?1.35:1.7),w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
        if(w!==lastW||h!==lastH){lastW=w;lastH=h;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);} return w/h;
      }
      function draw(kind,p,r,s,color,em=[0,0,0],metal=0,parent=null){
        let M=compose(p,r,s);if(parent)M=mat4Mul(parent,M);const g=geo[kind];gl.bindVertexArray(g.vao);gl.uniformMatrix4fv(uModel,false,M);gl.uniform4fv(uColor,color);gl.uniform3fv(uEmission,em);gl.uniform1f(uMetal,metal);gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_SHORT,0);return M;
      }
      function drawStage(t,ut){
        draw('cube',[0,-.28,.25],[0,0,0],[5.9,.18,3.4],C.stone);
        draw('cube',[0,2.65,-2.6],[0,0,0],[5.75,2.8,.14],C.stone);
        draw('cube',[0,5.05,-1.75],[0,0,0],[5.55,.24,.36],C.stone2,[0,0,0],.2);
        draw('cube',[-5.25,2.45,-1.95],[0,0,0],[.3,2.65,.42],C.stone2);draw('cube',[5.25,2.45,-1.95],[0,0,0],[.3,2.65,.42],C.stone2);
        for(let i=0;i<13;i++)draw('sphere',[-5+i*.84,.05,-2.05],[0,0,0],[.105,.105,.105],C.gold,[.05,.025,0],.8);
        const curtainOut=smooth(.8,2.6,t)*1.55;
        for(const side of [-1,1])for(let i=0;i<6;i++){
          const base=side*(4.2+i*.23)+side*curtainOut;draw('cyl',[base,2.65,-1.85],[0,0,0],[.18,2.65,.18],C.velvet);
        }
        draw('cube',[-2.05,2.18,-2.18],[0,0,0],[.23,2.25,.3],C.stone2);draw('cube',[2.05,2.18,-2.18],[0,0,0],[.23,2.25,.3],C.stone2);draw('cube',[0,4.48,-2.18],[0,0,0],[2.28,.24,.3],C.stone2);
        const portalScale=ut>0?smooth(.55,2.15,ut):.01;draw('cube',[0,2.3,-2.28],[0,0,0],[1.7*portalScale,1.95*portalScale,.045],C.portal,[.55,.28,.12],0);
        const leftA=ut>0?-1.45*smooth(.45,2.25,ut):0,rightA=-leftA;
        const lRoot=compose([-1.72,2.28,-2.05],[0,leftA,0],[1,1,1]);const rRoot=compose([1.72,2.28,-2.05],[0,rightA,0],[1,1,1]);
        draw('cube',[.86,0,0],[0,0,0],[.86,2.0,.15],C.wood,[0,0,0],0,lRoot);draw('cube',[-.86,0,0],[0,0,0],[.86,2.0,.15],C.wood,[0,0,0],0,rRoot);
        for(const root of [lRoot,rRoot])for(const y of [-1.2,0,1.2])draw('cube',[root===lRoot?.86:-.86,y,-.18],[0,0,0],[.8,.065,.05],C.iron,[0,0,0],.8,root);
        draw('torus',[0,2.34,-1.84],[Math.PI/2,0,0],[.48,.48,.48],C.gold,[.03,.015,0],.9);draw('sphere',[0,2.34,-1.76],[0,0,0],[.11,.11,.055],C.cyan,[.08,.35,.55],.2);
        for(let i=0;i<5;i++){
          const appear=smooth(19.15+i*.48,19.45+i*.48,t),pulse=1+.32*Math.sin(Math.PI*smooth(19.2+i*.48,19.75+i*.48,t));
          draw('torus',[-1.35+i*.675,.52,-1.8],[0,0,0],[.2*appear*pulse,.2*appear*pulse,.2*appear*pulse],C.cyan,[.06,.32,.48],.1);
        }
        const fall=smooth(25.4,26.35,t),spY=mix(4.1,3.05,fall),spA=mix(-.25,-1.28,fall);
        draw('cyl',[4.15,spY,-.6],[Math.PI/2,0,spA],[.36,.32,.36],C.iron,[0,0,0],.75);
      }
      function drawKlaus(t,ut){
        let y=6.4;if(t>=4.3){if(t<4.75)y=mix(6.4,-.08,smooth(3.2,4.3,t));else if(t<5.2)y=mix(-.08,.18,smooth(4.3,4.75,t));else y=mix(.18,0,smooth(4.75,5.2,t));}
        const out=ut>0?smooth(.7,2.4,ut)*-.5:0,rz=t<4.3?-.18:(t<4.75?.14:t<5.2?-.06:0),root=compose([-2.6+out,y,-.95],[0,0,rz],[1,1,1]);
        draw('sphere',[0,1.04,0],[0,0,0],[.45,.62,.38],C.koala,[0,0,0],0,root);draw('sphere',[0,1.88,-.01],[0,0,0],[.57,.5,.44],C.koala,[0,0,0],0,root);
        for(const x of [-.48,.48]){draw('sphere',[x,2.15,-.02],[0,0,0],[.26,.25,.16],C.koala,[0,0,0],0,root);draw('sphere',[x,2.15,-.16],[0,0,0],[.14,.14,.06],C.dark,[0,0,0],0,root);}
        for(const x of [-.19,.19])draw('sphere',[x,2.02,-.42],[0,0,0],[.055,.06,.035],C.dark,[.01,.01,.015],0,root);
        draw('sphere',[0,1.84,-.47],[0,0,0],[.13,.10,.07],C.dark,[0,0,0],0,root);
        draw('cube',[0,1.03,-.39],[0,0,0],[.17,.28,.045],C.ivory,[0,0,0],0,root);draw('cube',[-.23,1.03,-.38],[0,0,-.08],[.15,.35,.05],C.black,[0,0,0],0,root);draw('cube',[.23,1.03,-.38],[0,0,.08],[.15,.35,.05],C.black,[0,0,0],0,root);
        draw('torus',[0,1.37,-.48],[Math.PI/2,0,0],[.13,.08,.08],C.pink,[.15,0,.04],.1,root);draw('torus',[0,1.19,-.5],[Math.PI/2,0,0],[.09,.09,.09],C.gold,[.02,.01,0],.8,root);
      }
      function drawValentino(t,ut){
        const inT=smooth(8.8,10.4,t),out=ut>0?smooth(.7,2.4,ut)*.65:0,x=mix(6.2,2.55,inT)+out,root=compose([x,0,-.9],[0,0,0],[1,1,1]);
        draw('cube',[0,1.45,0],[0,0,0],[.27,.72,.25],C.black,[0,0,0],.12,root);draw('sphere',[0,2.48,-.02],[0,0,0],[.31,.48,.25],C.alien,[.02,.035,.04],.18,root);
        for(const ex of [-.11,.11])draw('sphere',[ex,2.59,-.25],[0,0,0],[.07,.032,.035],C.dark,[.04,.25,.34],.2,root);
        for(const ax of [-.28,.28])draw('cyl',[ax,1.48,0],[0,0,ax<0?-.06:.06],[.07,.62,.07],C.alien,[0,0,0],.12,root);
        for(const lx of [-.14,.14])draw('cyl',[lx,.48,0],[0,0,0],[.085,.72,.085],C.black,[0,0,0],.12,root);
        draw('torus',[0,1.55,-.35],[Math.PI/2,0,0],[.32,.32,.32],C.gold,[.04,.018,0],.85,root);
      }
      function drawBoo(t,ut){
        const pop=smooth(13.8,14.38,t),settle=smooth(14.38,15.35,t),s=mix(.01,1.28,pop)*(1-.22*settle),lift=ut>0?smooth(.7,2.4,ut)*.45:0,root=compose([0,lift,-.7],[0,0,0],[s,s,s]);
        gl.disable(gl.CULL_FACE);draw('sphere',[0,2.02,0],[0,0,0],[.42,.46,.34],C.ghost,[.07,.2,.23],0,root);draw('cyl',[0,1.08,0],[0,0,0],[.58,.76,.48],C.ghost,[.04,.15,.17],0,root);gl.enable(gl.CULL_FACE);
        for(const ex of [-.15,.15])draw('sphere',[ex,2.08,-.31],[0,0,0],[.075,.11,.035],C.dark,[0,0,0],0,root);draw('cube',[.55,1.15,-.18],[0,0,-.12],[.21,.31,.035],C.wood,[0,0,0],0,root);
      }
      function frame(now){
        if(!running)return;const aspect=resize();
        gl.clearColor(.004,.005,.008,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(prog);
        const vp=mat4Mul(perspective(38*Math.PI/180,aspect,.1,50),lookAt(eye,target));gl.uniformMatrix4fv(uVP,false,vp);gl.uniform3fv(uCam,eye);
        let t=ceremonyDone?30:(ceremonyStart==null?0:Math.min(30,(now-ceremonyStart)/1000));if(t>=30)ceremonyDone=true;
        const ut=unlockStart==null?0:Math.min(3.5,(now-unlockStart)/1000);
        drawStage(t,ut);drawKlaus(t,ut);drawValentino(t,ut);drawBoo(t,ut);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      return {
        canvas,
        startCeremony(){ceremonyStart=performance.now();ceremonyDone=false;unlockStart=null;},
        finishCeremony(){ceremonyDone=true;ceremonyStart=null;},
        startUnlock(){ceremonyDone=true;ceremonyStart=null;unlockStart=performance.now();},
        destroy(){running=false;canvas.remove();}
      };
    }catch(err){console.warn('[WYLD initiation 3D] fallback active',err);return null;}
  }

  window.WYLD_INIT_3D={attach};
})();
