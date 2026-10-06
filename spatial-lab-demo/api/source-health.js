const CHECKS=Object.freeze({
  speedmax:['https://raw.githubusercontent.com/joaoccaldas/konam/6feb3203ecc3e5d98f9b75a970699d9486d087ca/assets/museum/speedmax_web.glb',2081248],
  bellagio:['https://raw.githubusercontent.com/joaoccaldas/bellagio/b13ece357ddf46086acfec0966a4f63a947f29f3/assets/bellagio.glb',3950912]
});
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const out={};
  await Promise.all(Object.entries(CHECKS).map(async([id,[url,expected]])=>{
    try{
      const r=await fetch(url,{method:'HEAD',headers:{'user-agent':'caldas-spatial-lab/0'}});
      const bytes=Number(r.headers.get('content-length')||0);
      out[id]={ok:r.ok,status:r.status,bytes:bytes||null,expected,byteMatch:bytes?bytes===expected:null};
    }catch{out[id]={ok:false,status:null,bytes:null,expected,byteMatch:null};}
  }));
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({ok:Object.values(out).every(x=>x.ok&&x.byteMatch!==false),sources:out});
}
