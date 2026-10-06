export function createSpatialLayoutManager({THREE,scene,xrInteractions,onStatus=()=>{},persist=async()=>({ok:false})}={}){
  const records=new Map();
  const tempPos=new THREE.Vector3(),tempQuat=new THREE.Quaternion(),tempScale=new THREE.Vector3();
  let saveTimer=0;

  function round(v){return Math.round(Number(v)*100000)/100000;}
  function captureWorld(object){
    object.updateMatrixWorld(true);
    object.getWorldPosition(tempPos);object.getWorldQuaternion(tempQuat);object.getWorldScale(tempScale);
    return {
      position:[round(tempPos.x),round(tempPos.y),round(tempPos.z)],
      quaternion:[round(tempQuat.x),round(tempQuat.y),round(tempQuat.z),round(tempQuat.w)],
      scale:round((tempScale.x+tempScale.y+tempScale.z)/3)
    };
  }
  function applyWorld(object,t){
    scene.attach(object);
    object.position.fromArray(t.position);
    object.quaternion.fromArray(t.quaternion).normalize();
    object.scale.setScalar(t.scale);
    object.updateMatrixWorld(true);
  }
  function makeDockGuide(record){
    const g=new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.6,-.83,0),new THREE.Vector3(1.6,-.83,0),
      new THREE.Vector3(1.6,-.83,0),new THREE.Vector3(1.6,.83,0),
      new THREE.Vector3(1.6,.83,0),new THREE.Vector3(-1.6,.83,0),
      new THREE.Vector3(-1.6,.83,0),new THREE.Vector3(-1.6,-.83,0)
    ]);
    const m=new THREE.LineBasicMaterial({color:0x6fd8d0,transparent:true,opacity:.28});
    const guide=new THREE.LineSegments(g,m);guide.name='Dock guide · '+record.id;guide.visible=false;
    guide.position.fromArray(record.dock.position);guide.quaternion.fromArray(record.dock.quaternion);guide.scale.setScalar(record.dock.scale);
    scene.add(guide);return guide;
  }
  function distanceToDock(record){
    record.object.getWorldPosition(tempPos);
    const d=new THREE.Vector3().fromArray(record.dock.position);
    return tempPos.distanceTo(d);
  }
  function snap(record){
    applyWorld(record.object,record.dock);
    record.docked=true;
    onStatus('Docked · '+record.label);
  }
  function serialize(){
    const panels={};
    for(const [id,r] of records){
      const t=captureWorld(r.object);
      panels[id]={...t,docked:!!r.docked};
    }
    return {panels};
  }
  async function saveNow(){
    clearTimeout(saveTimer);saveTimer=0;
    const result=await persist(serialize());
    onStatus(result?.ok?'Spatial layout saved':'Spatial layout kept locally · save failed');
    return result;
  }
  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveNow,220);
  }

  return {
    registerPanel(object,{id,label=id,dockDistance=.78,minScale=.55,maxScale=2.25}={}){
      if(!object||!id||records.has(id))return null;
      const dock=captureWorld(object);
      const record={id,label,object,dock,dockDistance,docked:true,guide:null,unregister:null};
      record.guide=makeDockGuide(record);
      const baseOpacity=object.material?.opacity??1;
      record.unregister=xrInteractions.register(object,{
        label,
        grabbable:true,
        throwable:false,
        twoHand:true,
        minScale,maxScale,
        onHover:()=>{if(object.material){object.material.transparent=true;object.material.opacity=Math.min(1,baseOpacity*.92+.08);}},
        onBlur:()=>{if(object.material)object.material.opacity=baseOpacity;},
        onGrab:()=>{record.docked=false;record.guide.visible=true;record.guide.material.opacity=.45;onStatus('Move · '+label+' · second hand resizes');},
        onTwoHandStart:()=>{record.guide.visible=true;record.guide.material.opacity=.8;onStatus('Two-hand resize · '+label);},
        onTransform:()=>{const near=distanceToDock(record)<=dockDistance;record.guide.material.opacity=near ? .95 : .32;},
        onTwoHandEnd:()=>{record.guide.material.opacity=.45;},
        onRelease:()=>{
          const near=distanceToDock(record)<=dockDistance;
          if(near)snap(record);
          record.guide.visible=false;
          scheduleSave();
        }
      });
      records.set(id,record);return record;
    },
    apply(layout){
      const panels=layout?.panels;if(!panels||typeof panels!=='object')return false;
      let applied=0;
      for(const [id,t] of Object.entries(panels)){
        const record=records.get(id);
        if(!record||!Array.isArray(t?.position)||!Array.isArray(t?.quaternion)||!Number.isFinite(Number(t?.scale)))continue;
        applyWorld(record.object,{position:t.position,quaternion:t.quaternion,scale:Number(t.scale)});
        record.docked=t.docked===true;applied++;
      }
      if(applied)onStatus('Spatial layout restored · '+applied+' panels');
      return applied>0;
    },
    reset(){
      for(const record of records.values()){snap(record);record.guide.visible=false;}
      scheduleSave();
    },
    serialize,
    saveNow,
    dispose(){
      clearTimeout(saveTimer);
      for(const r of records.values()){
        r.unregister?.();r.guide.geometry.dispose();r.guide.material.dispose();scene.remove(r.guide);
      }
      records.clear();
    }
  };
}
