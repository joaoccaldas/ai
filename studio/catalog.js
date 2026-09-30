/* Caldas Studio — catalogue renderer for digital acquisitions.
   The 3D museum still owns physical exhibits. This layer makes new digital works
   data-driven so index.html never needs piece-specific markup again. */
(function () {
  const works = Array.isArray(window.STUDIO_DIGITAL_WORKS) ? window.STUDIO_DIGITAL_WORKS : [];
  if (!works.length) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);

  function renderFeatured() {
    const mount = document.getElementById('acquisitionMount');
    if (!mount) return;
    const work = works.find(w => w.featured) || works[0];
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
    works.forEach(work => {
      if (grid.querySelector('[data-digital-slug="' + CSS.escape(work.slug) + '"]')) return;
      const card = makeCatalogueCard(work);
      card.dataset.digitalSlug = work.slug;
      grid.appendChild(card);
    });
    return true;
  }

  renderFeatured();
  if (!syncCatalogue()) {
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
