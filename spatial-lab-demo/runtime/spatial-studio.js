function canvasTexture(THREE,{title,kicker='',lines=[],accent='#e85b2a',width=1024,height=512}={}){
  const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');
  x.fillStyle='#071013';x.fillRect(0,0,width,height);
  const grd=x.createLinearGradient(0,0,width,height);grd.addColorStop(0,'rgba(28,49,54,.82)');grd.addColorStop(.55,'rgba(7,16,19,.2)');grd.addColorStop(1,'rgba(5,7,8,.9)');x.fillStyle=grd;x.fillRect(0,0,width,height);
  x.strokeStyle=accent;x.lineWidth=5;x.strokeRect(18,18,width-36,height-36);
  x.fillStyle='#9cafab';x.font='700 24px system-ui';x.fillText(kicker,48,66);
  x.fillStyle='#f5f1e8';x.font='56px Georgia';x.fillText(title,48,132);
  let y=198;
  for(const line of lines){x.fillStyle='#c5cfcc';x.font='28px system-ui';x.fillText(line,48,y);y+=50;}
  x.fillStyle=accent;x.fillRect(48,height-72,Math.min(width-96,240),6);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}

function makePanel(THREE,opts={}){
  const tex=canvasTexture(THREE,opts);
  const mat=new THREE.MeshBasicMaterial({map:tex,toneMapped:false,transparent:true,opacity:.98});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(opts.worldWidth||3.4,opts.worldHeight||1.7),mat);
  mesh.userData.texture=tex;
  return mesh;
}

function makeLabel(THREE,text,{accent='#ffffff',scale=[1.45,.34,1]}={}){
  const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');
  x.fillStyle='rgba(4,8,9,.82)';x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=accent;x.lineWidth=4;x.strokeRect(7,7,c.width-14,c.height-14);
  x.fillStyle='#f7f3eb';x.font='700 36px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text,c.width/2,c.height/2);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  sprite.scale.set(...scale);sprite.userData.texture=tex;return sprite;
}

export function createCommandWall({THREE,scene,position=new THREE.Vector3(0,2.4,-5.7)}={}){
  const group=new THREE.Group();group.name='Caldas curved command wall';group.position.copy(position);
  const defs=[
    {id:'caldas-agents',title:'CALDAS // AGENTS',kicker:'SPATIAL ORCHESTRATION',lines:['SOL · orchestrate','LUNA · research','TERRA · render'],accent:'#66d8d0'},
    {id:'kona-world',title:'KONA // WORLD',kicker:'SPORTS & BIKES',lines:['Speedmax · semantic mesh','Bellagio · room system','Gaudí · architecture'],accent:'#e85b2a'},
    {id:'performance-live',title:'PERFORMANCE // LIVE',kicker:'ATHLETE SYSTEM',lines:['readiness · recovery','training load · race','private data surface'],accent:'#d9c382'}
  ];
  const xs=[-3.35,0,3.35],rot=[.18,0,-.18];
  const panels=[];
  defs.forEach((d,i)=>{const p=makePanel(THREE,{...d,worldWidth:3.15,worldHeight:1.62});p.position.set(xs[i],0,Math.abs(xs[i])*.08);p.rotation.y=rot[i];p.userData.spatialPanelId=d.id;p.userData.spatialPanelLabel=d.title;group.add(p);panels.push(p);});
  scene.add(group);
  return {group,panels};
}

export function createAgentRing({THREE,scene,center=new THREE.Vector3(0,1.55,-2.75),radius=1.85}={}){
  const group=new THREE.Group();group.name='Caldas Agent Ring';group.position.copy(center);
  const defs=[
    ['SOL','ORCHESTRATOR',0x68d6cf],
    ['LUNA','RESEARCH',0x8e79d9],
    ['TERRA','RENDER',0x69b67f],
    ['ATLAS','WORLD',0xd69c62],
    ['NOVA','SYSTEMS',0xb3bdc7]
  ];
  const agents=[];
  defs.forEach((d,i)=>{
    const a=i/defs.length*Math.PI*2-Math.PI/2;
    const root=new THREE.Group();
    root.position.set(Math.cos(a)*radius,.2*Math.sin(a*2),Math.sin(a)*radius);
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,2),new THREE.MeshPhysicalMaterial({color:d[2],emissive:d[2],emissiveIntensity:1.25,roughness:.22,metalness:.08,clearcoat:.6,clearcoatRoughness:.2}));
    const halo=new THREE.Mesh(new THREE.TorusGeometry(.34,.018,10,72),new THREE.MeshBasicMaterial({color:d[2],transparent:true,opacity:.55}));
    halo.rotation.x=Math.PI/2;root.add(core,halo);
    const label=makeLabel(THREE,d[0]+' · '+d[1],{accent:'#'+new THREE.Color(d[2]).getHexString(),scale:[1.25,.31,1]});label.position.y=.55;root.add(label);
    root.userData.agentId=d[0].toLowerCase();root.userData.baseY=root.position.y;root.userData.phase=i*1.3;group.add(root);agents.push({id:d[0],role:d[1],object:root,core,halo,color:d[2]});
  });
  scene.add(group);
  return {group,agents,update(time){for(const a of agents){a.object.position.y=a.object.userData.baseY+Math.sin(time*1.25+a.object.userData.phase)*.05;a.halo.rotation.z=time*.22+a.object.userData.phase;}}};
}

export function createIdeaOrb({THREE,scene,position=new THREE.Vector3(0,1.55,-2.75)}={}){
  const group=new THREE.Group();group.name='Caldas Idea Orb';group.position.copy(position);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,3),new THREE.MeshPhysicalMaterial({color:0xbcecff,emissive:0x4ec7ff,emissiveIntensity:2.6,roughness:.14,metalness:.04,transmission:.15,thickness:.35,clearcoat:1,clearcoatRoughness:.08}));
  const ring1=new THREE.Mesh(new THREE.TorusGeometry(.43,.022,10,84),new THREE.MeshBasicMaterial({color:0x72dfff,transparent:true,opacity:.75}));
  const ring2=ring1.clone();ring2.rotation.x=Math.PI/2;ring2.scale.setScalar(.86);
  const light=new THREE.PointLight(0x65d7ff,3.2,5,1.7);group.add(core,ring1,ring2,light);
  const label=makeLabel(THREE,'IDEA // ORB',{accent:'#72dfff',scale:[1.28,.3,1]});label.position.y=.72;group.add(label);
  scene.add(group);
  return {group,core,ring1,ring2,light,update(time){ring1.rotation.y=time*.8;ring1.rotation.x=time*.37;ring2.rotation.z=-time*.65;}};
}

export function createAgentDetailCard({THREE,scene}={}){
  const group=new THREE.Group();group.name='Agent detail card';group.visible=false;scene.add(group);
  let panel=null;
  return {
    group,
    show({agent,role,accent='#66d8d0',position=new THREE.Vector3(0,2.25,-2.15)}={}){
      if(panel){group.remove(panel);panel.material.map?.dispose();panel.material.dispose();panel.geometry.dispose();}
      panel=makePanel(THREE,{title:agent,kicker:'CALDAS AGENT',lines:[role,'select again to focus','shared spatial runtime'],accent,worldWidth:2.6,worldHeight:1.3});
      group.add(panel);group.position.copy(position);group.lookAt(0,1.6,0);group.visible=true;
    },
    hide(){group.visible=false;}
  };
}
