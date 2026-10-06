export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    ok:true,
    app:'caldas-spatial-lab',
    version:'v0',
    auth:'supabase-owner-httpOnly',
    releaseSha:process.env.VERCEL_GIT_COMMIT_SHA||null,
    scenes:['world-zero','bellagio-lobby-r0']
  });
}
