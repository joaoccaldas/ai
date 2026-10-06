export async function persistBenchmark(receipt){
  try{
    const r=await fetch('/api/benchmark',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify(receipt)
    });
    if(!r.ok)return {ok:false,status:r.status};
    const data=await r.json();
    return {ok:data?.ok===true,id:data?.id||null,release_sha:data?.release_sha||null};
  }catch{return {ok:false,status:0};}
}
