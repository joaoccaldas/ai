// Device budgets inspired by the inspected Konam and Studio 2 quality policies.
export function renderProfile(choice,{coarse=false,software=false,dpr=1}={}) {
  const mode=['balanced','cinematic'].includes(choice)?choice:(coarse||software?'balanced':'cinematic');
  const cap=software?.6:mode==='balanced'?(coarse?1:1.2):(coarse?1.25:1.75);
  return {mode,dpr:Math.min(dpr,cap),coat:mode==='cinematic'&&!software,bloom:mode==='cinematic'&&!software,reflection:mode==='cinematic'&&!software&&!coarse};
}
