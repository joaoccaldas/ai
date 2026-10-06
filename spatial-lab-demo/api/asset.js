const SOURCES=Object.freeze({
  'speedmax':{
    url:'https://raw.githubusercontent.com/joaoccaldas/konam/6feb3203ecc3e5d98f9b75a970699d9486d087ca/assets/museum/speedmax_web.glb',
    type:'model/gltf-binary',
    expectedBytes:2081248,
    provenance:'joaoccaldas/konam@6feb3203ec:assets/museum/speedmax_web.glb'
  },
  'bellagio-glb':{
    url:'https://raw.githubusercontent.com/joaoccaldas/bellagio/b13ece357ddf46086acfec0966a4f63a947f29f3/assets/bellagio.glb',
    type:'model/gltf-binary',
    expectedBytes:3950912,
    provenance:'joaoccaldas/bellagio@b13ece357d:assets/bellagio.glb'
  },
  'bellagio-lightmap':{
    url:'https://raw.githubusercontent.com/joaoccaldas/bellagio/b13ece357ddf46086acfec0966a4f63a947f29f3/assets/lm_interior_day.webp',
    type:'image/webp',
    expectedBytes:919872,
    provenance:'joaoccaldas/bellagio@b13ece357d:assets/lm_interior_day.webp'
  },
  'bellagio-hdr':{
    url:'https://raw.githubusercontent.com/joaoccaldas/bellagio/b13ece357ddf46086acfec0966a4f63a947f29f3/assets/env_day.hdr',
    type:'application/octet-stream',
    expectedBytes:844034,
    provenance:'joaoccaldas/bellagio@b13ece357d:assets/env_day.hdr'
  },
  'bellagio-manifest':{
    url:'https://raw.githubusercontent.com/joaoccaldas/bellagio/b13ece357ddf46086acfec0966a4f63a947f29f3/assets/manifest.json',
    type:'application/json; charset=utf-8',
    expectedBytes:236024,
    provenance:'joaoccaldas/bellagio@b13ece357d:assets/manifest.json'
  }
});
export default async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const item=SOURCES[String(req.query?.id||'')];
  if(!item)return res.status(404).json({ok:false,error:'unknown_asset'});
  try{
    const upstream=await fetch(item.url,{method:req.method==='HEAD'?'HEAD':'GET',headers:{'user-agent':'caldas-spatial-lab/0'}});
    if(!upstream.ok)return res.status(502).json({ok:false,error:'upstream_unavailable',status:upstream.status});
    const length=Number(upstream.headers.get('content-length')||0);
    if(length&&item.expectedBytes&&length!==item.expectedBytes)return res.status(502).json({ok:false,error:'source_size_mismatch',expected:item.expectedBytes,actual:length});
    res.setHeader('Content-Type',item.type);
    res.setHeader('Cache-Control','private, max-age=3600');
    res.setHeader('X-Asset-Provenance',item.provenance);
    res.setHeader('X-Content-Type-Options','nosniff');
    if(length)res.setHeader('Content-Length',String(length));
    if(req.method==='HEAD')return res.status(200).end();
    const bytes=Buffer.from(await upstream.arrayBuffer());
    if(item.expectedBytes&&bytes.length!==item.expectedBytes)return res.status(502).json({ok:false,error:'source_size_mismatch',expected:item.expectedBytes,actual:bytes.length});
    return res.status(200).send(bytes);
  }catch(error){
    console.error('asset_gateway_failure',String(error?.message||error));
    return res.status(502).json({ok:false,error:'asset_gateway_failure'});
  }
}
