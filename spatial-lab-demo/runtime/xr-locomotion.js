function labelSprite(THREE,text,color){
  const c=document.createElement('canvas');c.width=384;c.height=96;const x=c.getContext('2d');
  x.fillStyle='rgba(4,8,9,.78)';x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='#'+new THREE.Color(color).getHexString();x.lineWidth=4;x.strokeRect(5,5,c.width-10,c.height-10);
  x.fillStyle='#f6f2e9';x.font='700 30px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text,c.width/2,c.height/2);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  sprite.scale.set(1.45,.36,1);sprite.userData.texture=tex;return sprite;
}

export function createTeleportSystem({THREE,renderer,scene,rig,xrInteractions,onStatus=()=>{},canTeleport=()=>true}={}){
  const anchors=[];
  const head=new THREE.Vector3();

  function teleport(target,label){
    if(!renderer.xr.isPresenting)return;
    if(!canTeleport()){onStatus('MR · move physically instead of teleporting');return;}
    const xrCamera=renderer.xr.getCamera();
    xrCamera.getWorldPosition(head);
    rig.position.x+=target.x-head.x;
    rig.position.z+=target.z-head.z;
    rig.updateMatrixWorld(true);
    onStatus('Teleported · '+label);
  }

  function addAnchor({id,label,position,color=0x66d8d0}){
    const root=new THREE.Group();root.name='Teleport · '+id;root.position.copy(position);
    const ring=new THREE.Mesh(
      new THREE.RingGeometry(.28,.38,48),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false})
    );
    ring.rotation.x=-Math.PI/2;ring.position.y=.018;root.add(ring);
    const dot=new THREE.Mesh(new THREE.CircleGeometry(.08,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));
    dot.rotation.x=-Math.PI/2;dot.position.y=.021;root.add(dot);
    const labelObj=labelSprite(THREE,label,color);labelObj.position.set(0,.58,0);root.add(labelObj);
    root.visible=false;scene.add(root);
    const base=ring.scale.clone();
    const unregister=xrInteractions.register(root,{
      label:'Teleport · '+label,
      onHover:()=>ring.scale.copy(base).multiplyScalar(1.18),
      onBlur:()=>ring.scale.copy(base),
      onSelect:()=>teleport(position,label)
    });
    anchors.push({id,label,position:position.clone(),root,ring,unregister});
    return root;
  }

  return {
    addAnchor,
    update(time=0){
      const visible=renderer.xr.isPresenting&&canTeleport();
      for(const a of anchors){
        a.root.visible=visible;
        if(visible)a.ring.material.opacity=.52+.18*Math.sin(time*2.1+a.position.x*.7);
      }
    },
    dispose(){
      for(const a of anchors){
        a.unregister?.();
        a.root.traverse(o=>{o.geometry?.dispose?.();if(o.material){o.material.map?.dispose?.();o.material.dispose?.();}});
        scene.remove(a.root);
      }
      anchors.length=0;
    }
  };
}
