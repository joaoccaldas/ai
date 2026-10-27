/* Session memory for one reading. Nothing here is a source, a date, or a finding. */
(() => {
  const key = () => 'noema-scroll:' + location.pathname + location.search;

  function save() {
    try {
      sessionStorage.setItem(key(), String(window.scrollY || 0));
    } catch (err) {
      /* Private mode can refuse storage. The page still reads. */
    }
  }

  function mirror() {
    save();
    const bridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.noemaState;
    if (!bridge) return;
    bridge.postMessage({
      scroll: window.scrollY || 0,
      path: location.pathname + location.search
    });
  }

  let timer = 0;
  window.addEventListener('scroll', () => {
    clearTimeout(timer);
    timer = setTimeout(mirror, 160);
  }, { passive: true });
  window.addEventListener('pagehide', mirror);

  window.noemaRestoreScroll = () => {
    let y = 0;
    try {
      y = Number(sessionStorage.getItem(key()) || 0);
    } catch (err) {
      y = 0;
    }
    if (y > 40) window.scrollTo(0, y);
  };

  window.noemaRememberChapter = chapter => {
    try {
      sessionStorage.setItem('noema-last-chapter', JSON.stringify(chapter));
    } catch (err) {
      /* The chapter is still on screen. */
    }
  };

  window.noemaLastChapter = () => {
    try {
      return JSON.parse(sessionStorage.getItem('noema-last-chapter') || 'null');
    } catch (err) {
      return null;
    }
  };
})();
