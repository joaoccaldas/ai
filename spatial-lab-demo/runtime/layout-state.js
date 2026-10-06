export async function loadSpatialLayout(){
  try{
    const r=await fetch('/api/layout',{cache:'no-store'});
    if(!r.ok)return {ok:false,layout:null,status:r.status};
    const data=await r.json();
    return {ok:data?.ok===true,layout:data?.layout||null,updated_at:data?.updated_at||null};
  }catch{return {ok:false,layout:null,status:0};}
}
export async function saveSpatialLayout(layout){
  try{
    const r=await fetch('/api/layout',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({layout})});
    if(!r.ok)return {ok:false,status:r.status};
    const data=await r.json();
    return {ok:data?.ok===true,updated_at:data?.updated_at||null};
  }catch{return {ok:false,status:0};}
}
