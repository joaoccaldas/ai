export function createXRInteractionSystem({THREE,renderer,scene,maxDistance=12,onStatus=()=>{}}){
  const raycaster=new THREE.Raycaster();
  const rotation=new THREE.Matrix4();
  const interactables=[];
  const controllers=[];
  let hovered=null;

  function controllerRay(controller){
    rotation.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0,0,-1).applyMatrix4(rotation).normalize();
  }

  function resolveHit(controller){
    controllerRay(controller);
    const roots=interactables.map(x=>x.object).filter(Boolean);
    const hits=raycaster.intersectObjects(roots,true);
    for(const hit of hits){
      let node=hit.object;
      while(node){
        const entry=interactables.find(x=>x.object===node);
        if(entry)return {entry,hit};
        node=node.parent;
      }
    }
    return null;
  }

  function setHover(next){
    if(hovered?.entry===next?.entry)return;
    if(hovered?.entry?.onBlur)try{hovered.entry.onBlur(hovered.hit)}catch{}
    hovered=next;
    if(hovered?.entry?.onHover)try{hovered.entry.onHover(hovered.hit)}catch{}
  }

  function select(controller){
    const picked=resolveHit(controller);
    setHover(picked);
    if(!picked)return;
    try{
      picked.entry.onSelect?.(picked.hit);
      onStatus(picked.entry.label?('XR selected · '+picked.entry.label):'XR selection');
    }catch(error){
      console.warn('XR selection failed',error);
      onStatus('XR selection failed safely');
    }
  }

  function makeController(index){
    const c=renderer.xr.getController(index);
    c.visible=false;
    c.userData.inputIndex=index;
    const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1)]);
    const mat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.58});
    const line=new THREE.Line(geo,mat);
    line.name='Caldas XR target ray';
    line.scale.z=maxDistance;
    c.add(line);
    c.addEventListener('connected',()=>{c.visible=true;});
    c.addEventListener('disconnected',()=>{c.visible=false;});
    c.addEventListener('selectstart',()=>select(c));
    scene.add(c);
    controllers.push({controller:c,line});
    return c;
  }

  makeController(0);
  makeController(1);

  renderer.xr.addEventListener('sessionstart',()=>onStatus('XR session · aim and select'));
  renderer.xr.addEventListener('sessionend',()=>{setHover(null);onStatus('XR session ended');});

  return {
    register(object,{label='',onSelect,onHover,onBlur}={}){
      if(!object)return ()=>{};
      const entry={object,label,onSelect,onHover,onBlur};
      interactables.push(entry);
      return ()=>{
        const i=interactables.indexOf(entry);
        if(i>=0)interactables.splice(i,1);
        if(hovered?.entry===entry)setHover(null);
      };
    },
    update(){
      if(!renderer.xr.isPresenting){setHover(null);return;}
      let best=null;
      for(const item of controllers){
        if(!item.controller.visible)continue;
        const picked=resolveHit(item.controller);
        item.line.scale.z=picked?.hit?.distance?Math.min(maxDistance,picked.hit.distance):maxDistance;
        if(picked&&(!best||picked.hit.distance<best.hit.distance))best=picked;
      }
      setHover(best);
    },
    dispose(){
      setHover(null);
      for(const {controller,line} of controllers){
        controller.remove(line);
        line.geometry.dispose();
        line.material.dispose();
        scene.remove(controller);
      }
      interactables.length=0;
    }
  };
}
