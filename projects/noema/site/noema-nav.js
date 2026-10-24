/* Shared primary navigation for the NOEMA MVP. Idempotent; safe if a page shell rebuilds #appNav. */
(() => {
  const ITEMS = [
    ['home', 'Home', 'index.html'],
    ['explore', 'Explore', 'explore.html'],
    ['atlas', 'Atlas', 'human-meaning-atlas.html'],
    ['connections', 'Connections', 'lineages.html'],
    ['research', 'Research', 'research.html']
  ];
  const FILE_KEY = {
    'index.html': 'home',
    'explore.html': 'explore',
    'concept.html': 'explore',
    'gods.html': 'explore',
    'belief-systems.html': 'explore',
    'rituals.html': 'explore',
    'altered-states.html': 'explore',
    'entity.html': 'explore',
    'human-meaning-atlas.html': 'atlas',
    'deep-time.html': 'atlas',
    'history.html': 'atlas',
    'lineages.html': 'connections',
    'patterns.html': 'connections',
    'compare.html': 'connections',
    'simulations.html': 'connections',
    'research.html': 'research',
    'research-health.html': 'research',
    'automation-pulse.html': 'research',
    'drh.html': 'research',
    'sources-v1.html': 'research',
    'cognition.html': 'research',
    'library.html': 'research',
    'review.html': 'research',
    'religion-decomposition.html': 'research'
  };

  function currentFile() {
    const name = location.pathname.split('/').pop();
    return name || 'index.html';
  }
  function currentKey() {
    return FILE_KEY[currentFile()] || '';
  }
  function linksHtml() {
    const cur = currentKey();
    return ITEMS.map(([key, label, href]) => {
      const on = key === cur;
      return `<a href="${href}"${on ? ' class="active" aria-current="page"' : ''}>${label}</a>`;
    }).join('');
  }
  function bindToggle(root) {
    const btn = root.querySelector(':scope > .nm-toggle, .nm-toggle');
    const menu = root.querySelector('.nm-menu, .home-nav, nav.nm-menu');
    if (!btn || !menu || btn.dataset.nmBound) return;
    btn.dataset.nmBound = '1';
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      menu.classList.toggle('is-open', !open);
      root.classList.toggle('is-open', !open);
    });
  }
  function ensureSkip() {
    if (document.querySelector('.skip-link')) return;
    const a = document.createElement('a');
    a.className = 'skip-link';
    a.href = '#main';
    a.textContent = 'Skip to content';
    document.body.prepend(a);
    const main = document.getElementById('main') || document.querySelector('main');
    if (main) {
      if (!main.id) main.id = 'main';
      if (!main.hasAttribute('tabindex')) main.tabIndex = -1;
    }
  }
  function ensureLogo(nav) {
    if (nav.querySelector('.nm-logo')) return;
    const logo = document.createElement('a');
    logo.className = 'nm-logo';
    logo.href = 'index.html';
    logo.textContent = 'NOEMA';
    nav.insertBefore(logo, nav.firstChild);
  }

  function mount() {
    document.body.classList.add('nm-ready');
    ensureSkip();

    const home = document.querySelector('nav.home-nav');
    if (home) {
      const header = home.closest('header') || document.body;
      bindToggle(header);
      return;
    }

    const top = document.querySelector('header.topbar nav');
    if (top) {
      top.setAttribute('aria-label', 'Primary');
      top.classList.add('nm-menu');
      if (!top.id) top.id = 'obs-nav';
      top.innerHTML = linksHtml();
      let btn = document.querySelector('header.topbar .nm-toggle');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nm-toggle';
        btn.textContent = 'Menu';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', top.id);
        top.parentElement.insertBefore(btn, top);
      }
      bindToggle(top.parentElement);
      return;
    }

    const nav = document.getElementById('appNav') || document.querySelector('nav.nav');
    if (nav) {
      nav.setAttribute('aria-label', 'Primary');
      ensureLogo(nav);
      let primary = nav.querySelector('.nav-primary');
      if (!primary) {
        primary = document.createElement('div');
        primary.className = 'nav-primary';
        nav.appendChild(primary);
      }
      primary.innerHTML = linksHtml();
      if (!nav.querySelector('.nm-toggle')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nm-toggle';
        btn.textContent = 'Menu';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'nm-menu');
        const menu = document.createElement('div');
        menu.id = 'nm-menu';
        menu.className = 'nm-menu';
        const context = nav.querySelector('.nav-context');
        menu.appendChild(primary);
        if (context) menu.appendChild(context);
        nav.appendChild(btn);
        nav.appendChild(menu);
      }
      bindToggle(nav);
      return;
    }

    if (!document.querySelector('.nm-bar')) {
      const bar = document.createElement('header');
      bar.className = 'nm-bar';
      bar.innerHTML = `<a class="nm-logo" href="index.html">NOEMA</a><button class="nm-toggle" type="button" aria-expanded="false" aria-controls="nm-menu">Menu</button><nav id="nm-menu" class="nm-menu" aria-label="Primary">${linksHtml()}</nav>`;
      document.body.prepend(bar);
      bindToggle(bar);
    }
  }

  window.noemaMountNav = mount;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
