/* Always-available way back to the main ond.ai page from the world / lantern / arch pages.
   Mac app serves these at /greatlinq-showcase/…, the web build at …/greatlinq-showcase/v2/…, so the home URL differs. */
(() => {
  if (/[?&]embed=1\b/.test(location.search)) return;               // hero iframe: no chrome
  const home = location.pathname.startsWith('/greatlinq-showcase/')
    ? '/app/#enter'
    : new URL('../../#enter', location.href).href;
  const a = document.createElement('a');
  a.className = 'gl-back'; a.href = home; a.setAttribute('aria-label', 'Back to ond.ai Spatial Studio, main page');
  a.innerHTML = '<span aria-hidden="true">←</span> ond.ai';
  const s = document.createElement('style');
  s.textContent = '.gl-back{position:fixed;z-index:2147483000;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));'
    + 'display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;border-radius:999px;font:600 14px/1 Inter,system-ui,sans-serif;'
    + 'color:#fff;text-decoration:none;background:rgba(10,16,28,.82);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(14px);box-shadow:0 8px 24px rgba(0,0,0,.35)}'
    + '.gl-back:hover{background:rgba(10,16,28,.95);border-color:#fff}.gl-back:focus-visible{outline:3px solid #fff;outline-offset:3px}';
  document.head.appendChild(s); document.body.appendChild(a);
  // fallback messages inside these pages link to "../../" (the old collection); send that to the real main page instead
  document.addEventListener('click', e => {
    const l = e.target.closest && e.target.closest('a[href="../../"]');
    if (l) { e.preventDefault(); location.assign(home); }
  });
})();
