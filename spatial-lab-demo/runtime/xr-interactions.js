import {XRHandModelFactory} from 'https://esm.sh/three@0.186.1/examples/jsm/webxr/XRHandModelFactory.js';

export function createXRInteractionSystem({THREE,renderer,scene,maxDistance=12,onStatus=()=>{}}){
  const raycaster=new THREE.Raycaster();
  const rotation=new THREE.Matrix4();
  const interactables=[];
  const controllers=[];
  const hands=[];
  const handFactory=new XRHandModelFactory();
  let hovered=null;
  let lastUpdate=performance.now();

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

  function beginSelect(state){
    const picked=resolveHit(state.controller);
    setHover(picked);
    if(!picked)return;
    const entry=picked.entry;
    try{
      if(entry.grabbable&&!entry.heldBy){
        entry.heldBy=state.controller;
        entry.velocity?.set(0,0,0);
        state.held=entry;
        state.controller.attach(entry.object);
        entry.onGrab?.(picked.hit);
        onStatus(entry.label?('XR grabbed · '+entry.label):'XR grabbed object');
        return;
      }
      entry.onSelect?.(picked.hit);
      onStatus(entry.label?('XR selected · '+entry.label):'XR selection');
    }catch(error){
      console.warn('XR select/grab failed',error);
      onStatus('XR interaction failed safely');
    }
  }

  function endSelect(state){
    const entry=state.held;
    if(!entry)return;
    try{
      scene.attach(entry.object);
      entry.heldBy=null;
      if(entry.throwable&&entry.velocity)entry.velocity.copy(state.velocity).multiplyScalar(entry.throwScale);
      entry.onRelease?.(entry.velocity);
      onStatus(entry.label?('XR released · '+entry.label):'XR released object');
    }catch(error){
      console.warn('XR release failed',error);
      onStatus('XR release failed safely');
    }finally{state.held=null;}
  }

  function makeController(index){
    const c=renderer.xr.getController(index);
    c.visible=false;
    c.userData.inputIndex=index;
    const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1)]);
    const mat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.46});
    const line=new THREE.Line(geo,mat);
    line.name='Caldas XR target ray';
    line.scale.z=maxDistance;
    c.add(line);
    const state={
      controller:c,line,held:null,
      lastPosition:new THREE.Vector3(),
      currentPosition:new THREE.Vector3(),
      velocity:new THREE.Vector3(),
      hasPosition:false
    };
    c.addEventListener('connected',()=>{c.visible=true;});
    c.addEventListener('disconnected',()=>{c.visible=false;endSelect(state);});
    c.addEventListener('selectstart',()=>beginSelect(state));
    c.addEventListener('selectend',()=>endSelect(state));
    scene.add(c);
    controllers.push(state);
    return state;
  }

  function makeHand(index){
    const hand=renderer.xr.getHand(index);
    try{
      const model=handFactory.createHandModel(hand,'spheres');
      model.name='Caldas tracked hand '+index;
      hand.add(model);
    }catch(error){console.warn('XR hand model unavailable',error);}
    scene.add(hand);
    hands.push(hand);
  }

  makeController(0);makeController(1);
  makeHand(0);makeHand(1);

  renderer.xr.addEventListener('sessionstart',()=>onStatus('XR session · point, pinch or trigger'));
  renderer.xr.addEventListener('sessionend',()=>{
    setHover(null);
    for(const state of controllers)endSelect(state);
    onStatus('XR session ended');
  });

  function updatePhysics(dt){
    for(const entry of interactables){
      if(!entry.throwable||entry.heldBy||!entry.velocity)continue;
      if(entry.velocity.lengthSq()<0.00005)continue;
      entry.velocity.y-=entry.gravity*dt;
      entry.object.position.addScaledVector(entry.velocity,dt);
      if(entry.object.position.y<entry.floorY){
        entry.object.position.y=entry.floorY;
        if(Math.abs(entry.velocity.y)<.18)entry.velocity.y=0;
        else entry.velocity.y=Math.abs(entry.velocity.y)*entry.bounce;
        entry.velocity.x*=entry.floorDamping;
        entry.velocity.z*=entry.floorDamping;
      }
      entry.velocity.multiplyScalar(Math.pow(entry.airDamping,dt*60));
      if(entry.velocity.length()<.015)entry.velocity.set(0,0,0);
      entry.onPhysics?.(dt,entry.velocity);
    }
  }

  return {
    register(object,{label='',onSelect,onHover,onBlur,onGrab,onRelease,onPhysics,grabbable=false,throwable=false,floorY=.35,gravity=4.8,bounce=.48,floorDamping=.78,airDamping=.992,throwScale=1}={}){
      if(!object)return ()=>{};
      const entry={
        object,label,onSelect,onHover,onBlur,onGrab,onRelease,onPhysics,
        grabbable,throwable:throwable||grabbable,heldBy:null,
        velocity:new THREE.Vector3(),floorY,gravity,bounce,floorDamping,airDamping,throwScale
      };
      interactables.push(entry);
      return ()=>{
        const i=interactables.indexOf(entry);
        if(i>=0)interactables.splice(i,1);
        if(hovered?.entry===entry)setHover(null);
      };
    },
    update(){
      const now=performance.now(),dt=Math.min(.05,Math.max(.001,(now-lastUpdate)/1000));lastUpdate=now;
      updatePhysics(dt);
      if(!renderer.xr.isPresenting){setHover(null);return;}
      let best=null;
      for(const state of controllers){
        const c=state.controller;
        c.getWorldPosition(state.currentPosition);
        if(state.hasPosition)state.velocity.copy(state.currentPosition).sub(state.lastPosition).multiplyScalar(1/dt);
        else state.hasPosition=true;
        state.lastPosition.copy(state.currentPosition);
        if(!c.visible)continue;
        const picked=resolveHit(c);
        state.line.scale.z=picked?.hit?.distance?Math.min(maxDistance,picked.hit.distance):maxDistance;
        if(picked&&(!best||picked.hit.distance<best.hit.distance))best=picked;
      }
      setHover(best);
    },
    dispose(){
      setHover(null);
      for(const state of controllers){
        endSelect(state);
        state.controller.remove(state.line);
        state.line.geometry.dispose();
        state.line.material.dispose();
        scene.remove(state.controller);
      }
      for(const hand of hands)scene.remove(hand);
      interactables.length=0;
    }
  };
}
