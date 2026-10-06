export default function handler(req,res){
  res.setHeader('Set-Cookie','spatial_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.setHeader('Cache-Control','no-store');
  res.status(204).end();
}