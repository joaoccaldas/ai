/* Phones in "Desktop view" (Samsung Internet, Chrome "Desktop site", some in-app browsers)
   report a ~980px-wide layout on a ~400px screen, so the page gets the desktop layout at a
   tiny scale. Detect that, switch to the phone layout and scale the controls back up.
   The 3D canvas is left alone; only the UI layers are zoomed (see html.phone-fit in the CSS). */
(function fit() {
  var html = document.documentElement;
  function apply() {
    var short = Math.min(screen.width, screen.height);
    var touch = matchMedia('(pointer: coarse)').matches;
    var landscape = window.innerWidth > window.innerHeight;
    var ratio = window.innerWidth / (landscape ? Math.max(screen.width, screen.height) : short);
    var on = touch && short < 600 && ratio > 1.3;
    html.classList.toggle('phone-fit', on);
    html.style.setProperty('--fit', on ? ratio.toFixed(3) : '1');
  }
  apply();
  addEventListener('resize', apply);
  addEventListener('orientationchange', function () { setTimeout(apply, 250); });
})();
