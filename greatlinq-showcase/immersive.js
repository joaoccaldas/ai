/* Pointer parallax + light for the hero. Fine pointers only; no-op with reduced motion. */
(() => {
  const fine = matchMedia('(pointer:fine)').matches;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || calm) return;
  const root = document.documentElement;
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const tick = () => {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    root.style.setProperty('--px', x.toFixed(3));
    root.style.setProperty('--py', y.toFixed(3));
    raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.002) ? requestAnimationFrame(tick) : 0;
  };
  addEventListener('pointermove', e => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
})();

/* ───────── Chapter menu + legacy hooks ─────────
   1. A real, labelled Menu in the header (the top nav is hidden in deck mode; the rail dots alone were too small).
   2. The Mac app's native "Chapters" menu calls document.getElementById('<old id>').scrollIntoView().
      The old ids no longer exist, so give each one an invisible stand-in that jumps to the matching chapter. */
(() => {
  const CHAPTERS = [['enter', 'Enter'], ['live', 'Live lantern'], ['featured', 'Featured'], ['worlds', 'Worlds'], ['concepts', 'Rooms & concepts'],
    ['objects', 'Objects & bikes'], ['about', 'About João', 'about.html'], ['next', 'Next']];
  const go = id => { if (location.hash !== '#' + id) location.hash = '#' + id; };

  // legacy ids used by the native menu (Open, Offer, Object, Worlds, Rooms, Play, Inventory, Craft, Different)
  const LEGACY = { open: 'enter', offer: 'featured', object: 'live', worlds: 'worlds', rooms: 'concepts', play: 'worlds', inventory: 'objects', craft: 'about', different: 'next' };
  for (const [legacy, target] of Object.entries(LEGACY)) {
    let el = document.getElementById(legacy);
    if (!el) { el = document.createElement('span'); el.id = legacy; el.setAttribute('aria-hidden', 'true'); el.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;pointer-events:none'; document.body.appendChild(el); }
    el.scrollIntoView = () => (legacy === 'craft' ? location.assign('about.html') : go(target));
  }
  for (const [id] of CHAPTERS) { const c = document.getElementById(id); if (c) c.scrollIntoView = () => go(id); }

  // header Menu
  const top = document.getElementById('top'); const aud = document.getElementById('audToggle');
  if (!top) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ghost menu-btn'; btn.id = 'menuBtn';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'chapterMenu'); btn.setAttribute('aria-haspopup', 'true');
  btn.innerHTML = '<span class="menu-ico" aria-hidden="true"></span>Menu';
  const panel = document.createElement('nav');
  panel.id = 'chapterMenu'; panel.className = 'chapter-menu'; panel.setAttribute('aria-label', 'Chapter menu'); panel.hidden = true;
  panel.innerHTML = '<ol>' + CHAPTERS.map(([id, label, page], i) => `<li><a href="${page || '#' + id}" data-id="${id}"${page ? ' data-page="1"' : ''}><b>${String(i + 1).padStart(2, '0')}</b>${label}${page ? '<span class="menu-ext" aria-hidden="true">page ↗</span>' : ''}</a></li>`).join('') + '</ol>';
  top.appendChild(btn); document.body.appendChild(panel);
  if (aud) top.insertBefore(btn, aud);

  const current = () => (location.hash || '#enter').slice(1);
  const mark = () => panel.querySelectorAll('a').forEach(a => a.setAttribute('aria-current', String(a.dataset.id === current() && !a.dataset.page)));
  const open = () => { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); mark(); (panel.querySelector('[aria-current="true"]') || panel.querySelector('a')).focus(); };
  const close = (back = true) => { if (panel.hidden) return; panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus(); };
  btn.addEventListener('click', () => (panel.hidden ? open() : close()));
  panel.addEventListener('click', e => { const a = e.target.closest('a[data-id]'); if (!a || a.dataset.page) return; e.preventDefault(); close(false); go(a.dataset.id); });
  document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (!panel.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault(); const links = [...panel.querySelectorAll('a')]; const i = links.indexOf(document.activeElement);
      links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus();
    }
    const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'm' || e.key === 'M') { if (!e.metaKey && !e.ctrlKey && !e.altKey) (panel.hidden ? open() : close()); }
  });
})();
