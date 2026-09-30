/* Caldas Studio — portfolio catalogue.
   Physical works live in STUDIO_ROOMS and can have a 3D exhibit.
   Digital acquisitions live in STUDIO_DIGITAL_WORKS and can ship instantly.
   This renderer keeps entrance, All Works, and mobile portfolio in sync. */
(function () {
  const physical = Array.isArray(window.STUDIO_ROOMS) ? window.STUDIO_ROOMS : [];
  const digital = Array.isArray(window.STUDIO_DIGITAL_WORKS) ? window.STUDIO_DIGITAL_WORKS : [];
  const all = [...digital, ...physical];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);

  function renderFeatured() {
    const mount = document.getElementById('acquisitionMount');
    if (!mount) return;
    const work = digital.find(w => w.featured) || digital[0];
    if (!work) return;
    mount.innerHTML = `
      <a class="acquisition" href="${esc(work.url)}" aria-label="Open ${esc(work.n)}, new acquisition">
        <img src="${esc(work.img)}" alt="${esc(work.n)} artwork" loading="eager">
        <div class="plaque">
          <small>New acquisition · ${esc(work.acquired || 'Now')}</small>
          <b>${esc(work.n)}</b>
          <em>${esc(work.room)}</em>
          <span>Enter the work ↗</span>
        </div>
      </a>`;
  }

  function makeCatalogueCard(work) {
    const a = document.createElement('a');
    a.className = 'card digital-acquisition';
    a.href = work.url;
    a.style.setProperty('--piece-accent', work.accent || '#c9a86a');
    a.innerHTML = `
      <img loading="lazy" src="${esc(work.img)}" alt="">
      <div>
        <b>${esc(work.n)}</b>
        <span>${esc(work.room)} · New acquisition</span>
        <em>${esc(work.tag || work.note || '')}</em>
      </div>`;
    return a;
  }

  function syncCatalogue() {
    const grid = document.getElementById('worksGrid');
    if (!grid || !grid.children.length) return false;
    digital.forEach(work => {
      if (grid.querySelector('[data-digital-slug="' + CSS.escape(work.slug) + '"]')) return;
      const card = makeCatalogueCard(work);
      card.dataset.digitalSlug = work.slug;
      grid.appendChild(card);
    });
    return true;
  }

  function renderMobilePortfolio() {
    const root = document.getElementById('mobilePortfolio');
    if (!root || !all.length) return;
    const featured = digital.find(w => w.featured) || digital[0] || physical[0];
    const others = all.filter(w => !featured || w.slug !== featured.slug);
    const hero = featured ? `
      <a class="mobile-feature" href="${esc(featured.url)}">
        <div class="mobile-feature-art"><img src="${esc(featured.img)}" alt="${esc(featured.n)} artwork"></div>
        <div class="mobile-feature-overlay"></div>
        <div class="mobile-feature-copy">
          <small>Featured acquisition · ${esc(featured.acquired || '2026')}</small>
          <h1>${esc(featured.n)}</h1>
          <p>${esc(featured.tag || featured.note || '')}</p>
          <span>Enter the work ↗</span>
        </div>
      </a>` : '';
    const cards = others.map((work, i) => `
      <a class="mobile-work" href="${esc(work.url)}" style="--accent:${esc(work.accent || '#c9a86a')}">
        <img loading="lazy" src="${esc(work.img)}" alt="">
        <div><small>${String(i + 2).padStart(2, '0')} · ${esc(work.room || 'Work')}</small><b>${esc(work.n)}</b><em>${esc(work.tag || work.note || '')}</em></div>
      </a>`).join('');
    const wingTitle=w=>(window.STUDIO_WINGS?.[w.wing]?.title||w.room||'Other');
    const rooms=[...new Set(others.map(wingTitle).filter(Boolean))];
    const filters=['All',...rooms].map((room,i)=>`<button type="button" data-filter="${esc(room)}" class="${i===0?'on':''}">${esc(room)}</button>`).join('');
    root.innerHTML = `
      ${hero}
      <div class="mobile-portfolio-head">
        <small>Caldas Studio · Portfolio</small>
        <h2>Art, technology, places and ideas.</h2>
        <p>Immersive websites, digital worlds, brands and experiments. Tap any work to enter it.</p>
      </div>
      <div class="mobile-index"><h3>Selected works</h3><span>${all.length} pieces</span></div>
      <div class="mobile-filters" aria-label="Filter works">${filters}</div>
      <div class="mobile-work-grid">${cards}</div>
      <div class="mobile-footer"><span>Caldas Studio · 2026</span><a href="mailto:hello@caldas.studio">Commission a piece ↗</a></div>`;

    const buttons=[...root.querySelectorAll('.mobile-filters button')];
    const cardsEls=[...root.querySelectorAll('.mobile-work')];
    cardsEls.forEach((card,i)=>{card.dataset.room=wingTitle(others[i]||{})});
    buttons.forEach(button=>button.addEventListener('click',()=>{
      buttons.forEach(b=>b.classList.toggle('on',b===button));
      const filter=button.dataset.filter;
      cardsEls.forEach(card=>{card.hidden=filter!=='All'&&card.dataset.room!==filter});
    }));
  }

  renderFeatured();
  renderMobilePortfolio();

  if (digital.length && !syncCatalogue()) {
    const grid = document.getElementById('worksGrid');
    if (grid) {
      const observer = new MutationObserver(() => {
        if (syncCatalogue()) observer.disconnect();
      });
      observer.observe(grid, {childList: true});
    }
    setTimeout(syncCatalogue, 1200);
  }
})();