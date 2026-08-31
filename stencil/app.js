/* ============================================================================
   STENCIL — Tattoo Try-On Studio  ·  app.js   (zero dependencies)
   A client-side canvas compositor: place tattoo designs on a photo, blend them
   into skin, transform them by hand, and export a PNG. Nothing leaves the
   browser. Designs come from the built-in SVG flash set (window.STENCIL_FLASH),
   an optional AI pack (window.STENCIL_PACK), or the user's own uploads.
   ============================================================================ */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MAXDIM = 1500;              // longest edge of the working canvas
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const compose = $("#compose"), overlay = $("#overlay");
  const cx = compose.getContext("2d"), ox = overlay.getContext("2d");
  compose.style.pointerEvents = "none";
  overlay.style.pointerEvents = "auto";

  const state = {
    base: null,          // { canvas, w, h }
    layers: [],          // draw order: last = top
    selId: null,
    nextId: 1,
    grainOverlay: false, // global skin grain
  };

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------------- shared noise (film grain) ---------------- */
  const noise = document.createElement("canvas");
  noise.width = noise.height = 128;
  (function buildNoise() {
    const n = noise.getContext("2d");
    const img = n.createImageData(128, 128), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 90 + Math.random() * 76;        // mid-grey speckle
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    n.putImageData(img, 0, 0);
  })();
  const noisePattern = compose.getContext("2d").createPattern(noise, "repeat");

  /* ---------------- flash rasterisation ---------------- */
  function flashSvg(body, ink) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" ' +
      'stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" ' +
      'style="color:' + ink + '">' + body + "</svg>"
    );
  }
  function loadFlash(body, ink) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = "data:image/svg+xml," + encodeURIComponent(flashSvg(body, ink));
    });
  }
  function loadImg(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  /* ---------------- layer render cache (bakes grain into silhouette) --------- */
  function rebuildRender(layer) {
    const w = layer.iw, h = layer.ih;
    const c = layer._render || (layer._render = document.createElement("canvas"));
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.clearRect(0, 0, w, h);
    g.drawImage(layer.base, 0, 0, w, h);
    if (layer.grain > 0) {
      g.globalAlpha = layer.grain * 0.5;
      g.globalCompositeOperation = "overlay";
      g.fillStyle = noisePattern;
      g.fillRect(0, 0, w, h);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "destination-in";   // confine grain to the art
      g.drawImage(layer.base, 0, 0, w, h);
      g.globalCompositeOperation = "source-over";
    }
  }

  /* ---------------- base canvas ---------------- */
  function fitDims(w, h) {
    const s = Math.min(1, MAXDIM / Math.max(w, h));
    return [Math.round(w * s), Math.round(h * s)];
  }
  function remapLayers(oldW, oldH, newW, newH) {
    if (!oldW) return;
    const rx = newW / oldW, ry = newH / oldH, rs = Math.min(rx, ry);
    for (const l of state.layers) { l.x *= rx; l.y *= ry; l.scale *= rs; l.refScale *= rs; }
  }
  function applyBase(canvas, w, h) {
    const oldW = state.base ? state.base.w : 0, oldH = state.base ? state.base.h : 0;
    remapLayers(oldW, oldH, w, h);
    state.base = { canvas, w, h };
    compose.width = overlay.width = w;
    compose.height = overlay.height = h;
    $("#stageEmpty").classList.add("hide");
    scheduleRender();
  }
  function setPhotoBase(img) {
    const [w, h] = fitDims(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    applyBase(c, w, h);
  }
  function setBlankBase(tone) {
    const w = 900, h = 1200;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = tone; g.fillRect(0, 0, w, h);
    const shade = g.createRadialGradient(w * 0.5, h * 0.32, h * 0.1, w * 0.5, h * 0.55, h * 0.75);
    shade.addColorStop(0, "rgba(255,255,255,.10)");
    shade.addColorStop(1, "rgba(0,0,0,.16)");
    g.fillStyle = shade; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.05; g.globalCompositeOperation = "overlay";
    g.fillStyle = noisePattern; g.fillRect(0, 0, w, h);
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    applyBase(c, w, h);
  }

  /* ---------------- render ---------------- */
  let rafPending = false;
  function scheduleRender() {
    if (rafPending) return; rafPending = true;
    requestAnimationFrame(() => { rafPending = false; render(); drawOverlay(); });
  }
  function render() {
    if (!state.base) return;
    const { w, h } = state.base;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, w, h);
    cx.drawImage(state.base.canvas, 0, 0);
    for (const l of state.layers) {
      cx.save();
      cx.globalAlpha = l.opacity;
      cx.globalCompositeOperation = l.blend;
      cx.filter = l.blur > 0 ? `blur(${l.blur}px)` : "none";
      cx.translate(l.x, l.y);
      cx.rotate(l.rot);
      cx.scale(l.flipX ? -l.scale : l.scale, l.scale);
      cx.drawImage(l._render, -l.iw / 2, -l.ih / 2);
      cx.restore();
    }
    if (state.grainOverlay) {
      cx.save();
      cx.globalAlpha = 0.06; cx.globalCompositeOperation = "overlay";
      cx.fillStyle = noisePattern; cx.fillRect(0, 0, w, h);
      cx.restore();
    }
  }

  /* ---------------- selection overlay + handles ---------------- */
  const HANDLE = 7;          // css px
  function sel() { return state.layers.find((l) => l.id === state.selId) || null; }
  function screenScale() {
    const r = overlay.getBoundingClientRect();
    return overlay.width / (r.width || 1);
  }
  function corners(l) {
    const hw = (l.iw * l.scale) / 2, hh = (l.ih * l.scale) / 2, c = Math.cos(l.rot), s = Math.sin(l.rot);
    const pt = (dx, dy) => ({ x: l.x + dx * c - dy * s, y: l.y + dx * s + dy * c });
    return { tl: pt(-hw, -hh), tr: pt(hw, -hh), br: pt(hw, hh), bl: pt(-hw, hh) };
  }
  // rotate handle offset in canvas px, independent of layer scale
  function rotHandle(l) {
    const hh = (l.ih * l.scale) / 2, off = 34 * screenScale();
    return { x: l.x - Math.sin(l.rot) * -(hh + off), y: l.y + Math.cos(l.rot) * -(hh + off) };
  }
  function drawOverlay() {
    ox.setTransform(1, 0, 0, 1, 0, 0);
    ox.clearRect(0, 0, overlay.width, overlay.height);
    const l = sel(); if (!l) return;
    const ss = screenScale(), hw = (l.iw * l.scale) / 2, hh = (l.ih * l.scale) / 2;
    ox.save();
    ox.translate(l.x, l.y); ox.rotate(l.rot);
    ox.strokeStyle = "rgba(210,75,63,.95)"; ox.lineWidth = 1.5 * ss;
    ox.setLineDash([6 * ss, 5 * ss]);
    ox.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ox.setLineDash([]);
    // rotate stem
    ox.beginPath(); ox.moveTo(0, -hh); ox.lineTo(0, -hh - 34 * ss); ox.stroke();
    ox.restore();
    const R = HANDLE * ss;
    const cs = corners(l);
    for (const p of [cs.tl, cs.tr, cs.br, cs.bl]) dot(p, R, "#ece7df");
    dot(rotHandle(l), R * 1.05, "#d24b3f");
  }
  function dot(p, r, fill) {
    ox.beginPath(); ox.arc(p.x, p.y, r, 0, Math.PI * 2);
    ox.fillStyle = fill; ox.fill();
    ox.lineWidth = 1.4 * screenScale(); ox.strokeStyle = "rgba(0,0,0,.55)"; ox.stroke();
  }

  /* ---------------- pointer interaction ---------------- */
  function toCanvas(e) {
    const r = overlay.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (overlay.width / r.width),
      y: (e.clientY - r.top) * (overlay.height / r.height),
    };
  }
  function inRotatedRect(l, p) {
    const dx = p.x - l.x, dy = p.y - l.y, c = Math.cos(-l.rot), s = Math.sin(-l.rot);
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    return Math.abs(lx) <= (l.iw * l.scale) / 2 && Math.abs(ly) <= (l.ih * l.scale) / 2;
  }
  let drag = null;
  overlay.addEventListener("pointerdown", (e) => {
    if (!state.base) return;
    const p = toCanvas(e), l = sel(), R = 13 * screenScale();
    if (l) {
      const cs = corners(l), rh = rotHandle(l);
      if (dist(p, rh) <= R * 1.4) return startDrag(e, "rotate", l, p);
      const cor = [["tl", cs.tl], ["tr", cs.tr], ["br", cs.br], ["bl", cs.bl]]
        .find(([, cp]) => dist(p, cp) <= R * 1.4);
      if (cor) return startDrag(e, "scale", l, p);
      if (inRotatedRect(l, p)) return startDrag(e, "move", l, p);
    }
    // else: select topmost layer under pointer
    for (let i = state.layers.length - 1; i >= 0; i--) {
      if (inRotatedRect(state.layers[i], p)) { select(state.layers[i].id); return startDrag(e, "move", state.layers[i], p); }
    }
    select(null);
  });
  function startDrag(e, mode, l, p) {
    overlay.setPointerCapture(e.pointerId);
    drag = {
      mode, id: l.id, p0: p,
      x0: l.x, y0: l.y, s0: l.scale, r0: l.rot,
      d0: dist(p, { x: l.x, y: l.y }), a0: Math.atan2(p.y - l.y, p.x - l.x),
    };
  }
  overlay.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const l = state.layers.find((x) => x.id === drag.id); if (!l) return;
    const p = toCanvas(e);
    if (drag.mode === "move") { l.x = drag.x0 + (p.x - drag.p0.x); l.y = drag.y0 + (p.y - drag.p0.y); }
    else if (drag.mode === "scale") {
      const d = dist(p, { x: l.x, y: l.y });
      l.scale = clamp(drag.s0 * (d / (drag.d0 || 1)), l.refScale * 0.04, l.refScale * 2.4);
    } else if (drag.mode === "rotate") {
      const a = Math.atan2(p.y - l.y, p.x - l.x);
      l.rot = drag.r0 + (a - drag.a0);
    }
    if (sel() === l) syncControls(l);
    scheduleRender();
  });
  function endDrag(e) { if (drag) { try { overlay.releasePointerCapture(e.pointerId); } catch (_) {} drag = null; } }
  overlay.addEventListener("pointerup", endDrag);
  overlay.addEventListener("pointercancel", endDrag);
  overlay.addEventListener("wheel", (e) => {
    const l = sel(); if (!l) return;
    e.preventDefault();
    l.scale = clamp(l.scale * (e.deltaY < 0 ? 1.06 : 0.94), l.refScale * 0.04, l.refScale * 2.4);
    syncControls(l); scheduleRender();
  }, { passive: false });
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /* ---------------- layers ---------------- */
  function addLayer({ base, iw, ih, name, kind, body, ink }) {
    if (!state.base) { toast("Pick a canvas first"); switchTab("canvas"); return; }
    const cw = state.base.w;
    const refScale = (cw * 0.42) / iw;                 // default ~42% of canvas width
    const l = {
      id: state.nextId++, name, kind, body: body || null, ink: ink || "#161616",
      base, iw, ih,
      x: state.base.w / 2, y: state.base.h / 2,
      scale: refScale, refScale, rot: 0, flipX: false,
      opacity: 0.9, blend: "multiply", blur: 0.6, grain: 0.35,
      _render: null,
    };
    rebuildRender(l);
    state.layers.push(l);
    select(l.id);
    updateCount();
    scheduleRender();
    toast(name + " added");
  }
  async function addFlash(design) {
    const ink = "#161616";
    const img = await loadFlash(design.body, ink);
    addLayer({ base: img, iw: 512, ih: 512, name: design.name, kind: "flash", body: design.body, ink });
  }
  async function addPack(item) {
    try {
      const img = await loadImg(item.file);
      addLayer({ base: img, iw: img.naturalWidth, ih: img.naturalHeight, name: item.name, kind: "image" });
    } catch (_) { toast("Could not load that design"); }
  }
  function removeLayer(id) {
    const i = state.layers.findIndex((l) => l.id === id); if (i < 0) return;
    state.layers.splice(i, 1);
    if (state.selId === id) select(null);
    updateCount(); scheduleRender();
  }
  function select(id) {
    state.selId = id;
    const l = sel();
    $("#noSelection").hidden = !!l;
    $("#adjustBody").hidden = !l;
    if (l) { syncControls(l); if (activeTab !== "designs") switchTab("adjust"); }
    drawOverlay();
  }
  function updateCount() {
    const n = state.layers.length;
    $("#layerCount").textContent = n + (n === 1 ? " design" : " designs");
  }

  /* ---------------- adjust controls ---------------- */
  const el = {
    size: $("#sizeR"), sizeOut: $("#sizeOut"),
    rot: $("#rotR"), rotOut: $("#rotOut"),
    op: $("#opR"), opOut: $("#opOut"),
    blend: $("#blendSel"),
    blur: $("#blurR"), blurOut: $("#blurOut"),
    grain: $("#grainR"), grainOut: $("#grainOut"),
    inkRow: $("#inkRow"),
  };
  function syncControls(l) {
    el.size.value = Math.round((l.scale / l.refScale) * 100);
    el.sizeOut.textContent = el.size.value + "%";
    let deg = Math.round((l.rot * 180) / Math.PI); deg = ((deg + 180) % 360 + 360) % 360 - 180;
    el.rot.value = deg; el.rotOut.textContent = deg + "°";
    el.op.value = Math.round(l.opacity * 100); el.opOut.textContent = el.op.value + "%";
    el.blend.value = l.blend;
    el.blur.value = Math.round(l.blur * 5); el.blurOut.textContent = l.blur.toFixed(1) + "px";
    el.grain.value = Math.round(l.grain * 100); el.grainOut.textContent = el.grain.value + "%";
    el.inkRow.style.display = l.kind === "flash" ? "" : "none";
    $$("#inkSwatches button").forEach((b) => b.classList.toggle("on", b.dataset.ink === l.ink));
  }
  el.size.addEventListener("input", () => { const l = sel(); if (!l) return; l.scale = l.refScale * (el.size.value / 100); el.sizeOut.textContent = el.size.value + "%"; scheduleRender(); });
  el.rot.addEventListener("input", () => { const l = sel(); if (!l) return; l.rot = (el.rot.value * Math.PI) / 180; el.rotOut.textContent = el.rot.value + "°"; scheduleRender(); });
  el.op.addEventListener("input", () => { const l = sel(); if (!l) return; l.opacity = el.op.value / 100; el.opOut.textContent = el.op.value + "%"; scheduleRender(); });
  el.blend.addEventListener("change", () => { const l = sel(); if (!l) return; l.blend = el.blend.value; scheduleRender(); });
  el.blur.addEventListener("input", () => { const l = sel(); if (!l) return; l.blur = el.blur.value / 5; el.blurOut.textContent = l.blur.toFixed(1) + "px"; scheduleRender(); });
  el.grain.addEventListener("input", () => { const l = sel(); if (!l) return; l.grain = el.grain.value / 100; el.grainOut.textContent = el.grain.value + "%"; rebuildRender(l); scheduleRender(); });

  $("#flipBtn").addEventListener("click", () => { const l = sel(); if (!l) return; l.flipX = !l.flipX; scheduleRender(); });
  $("#delBtn").addEventListener("click", () => { const l = sel(); if (l) removeLayer(l.id); });
  $("#dupeBtn").addEventListener("click", async () => {
    const l = sel(); if (!l) return;
    const base = l.kind === "flash" ? await loadFlash(l.body, l.ink) : l.base;
    const copy = { ...l, id: state.nextId++, base, _render: null, x: l.x + l.iw * l.scale * 0.14, y: l.y + l.ih * l.scale * 0.14 };
    rebuildRender(copy); state.layers.push(copy); select(copy.id); updateCount(); scheduleRender();
  });
  $("#frontBtn").addEventListener("click", () => { const l = sel(); if (!l) return; const i = state.layers.indexOf(l); state.layers.splice(i, 1); state.layers.push(l); scheduleRender(); });
  $("#backBtn").addEventListener("click", () => { const l = sel(); if (!l) return; const i = state.layers.indexOf(l); state.layers.splice(i, 1); state.layers.unshift(l); scheduleRender(); });

  addEventListener("keydown", (e) => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    if ((e.key === "Delete" || e.key === "Backspace") && sel()) { e.preventDefault(); removeLayer(state.selId); }
    else if (e.key === "Escape") select(null);
  });

  /* ---------------- ink swatches ---------------- */
  const INKS = ["#161616", "#3a3a3a", "#5b3a2e", "#8a1c1c", "#d24b3f", "#1d3a5f", "#2f6f5e", "#c9a86a", "#e7e2d8"];
  (function buildInk() {
    const host = $("#inkSwatches");
    INKS.forEach((hex) => {
      const b = document.createElement("button");
      b.type = "button"; b.dataset.ink = hex; b.style.background = hex;
      b.setAttribute("aria-label", "Ink " + hex);
      b.addEventListener("click", async () => {
        const l = sel(); if (!l || l.kind !== "flash") return;
        l.ink = hex; l.base = await loadFlash(l.body, hex);
        rebuildRender(l); syncControls(l); scheduleRender();
      });
      host.appendChild(b);
    });
  })();

  /* ---------------- library grids ---------------- */
  (function buildFlashGrid() {
    const grid = $("#flashGrid"), list = window.STENCIL_FLASH || [];
    list.forEach((d) => {
      const cell = document.createElement("button");
      cell.type = "button"; cell.className = "lib-cell ink"; cell.title = d.name;
      cell.setAttribute("aria-label", "Add " + d.name);
      cell.innerHTML = flashSvg(d.body, "currentColor") + `<span class="nm">${d.name}</span>`;
      cell.addEventListener("click", () => addFlash(d));
      grid.appendChild(cell);
    });
  })();
  (function buildPackGrid() {
    const grid = $("#packGrid"), list = window.STENCIL_PACK || [];
    if (!list.length) { grid.innerHTML = '<div class="lib-empty">The AI pack ships with the deployed studio.</div>'; return; }
    list.forEach((it) => {
      const cell = document.createElement("button");
      cell.type = "button"; cell.className = "lib-cell"; cell.title = it.name;
      cell.setAttribute("aria-label", "Add " + it.name);
      const img = new Image(); img.loading = "lazy"; img.alt = it.name; img.src = it.file;
      cell.appendChild(img);
      const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = it.name; cell.appendChild(nm);
      cell.addEventListener("click", () => addPack(it));
      grid.appendChild(cell);
    });
  })();
  $$(".lib-tab").forEach((t) => t.addEventListener("click", () => {
    $$(".lib-tab").forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-selected", "false"); });
    t.classList.add("on"); t.setAttribute("aria-selected", "true");
    const which = t.dataset.lib;
    $("#flashGrid").hidden = which !== "flash";
    $("#packGrid").hidden = which !== "pack";
  }));

  /* ---------------- sample skins + blanks ---------------- */
  (function buildSkins() {
    const host = $("#skinThumbs"), list = window.STENCIL_SKINS || [];
    if (!list.length) { host.innerHTML = '<div class="lib-empty">Sample skins ship with the deployed studio — upload a photo to start.</div>'; return; }
    list.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "thumb"; b.style.backgroundImage = `url("${s.file}")`;
      b.setAttribute("aria-label", "Use sample skin: " + s.name);
      b.innerHTML = `<span>${s.name}</span>`;
      b.addEventListener("click", async () => {
        try { setPhotoBase(await loadImg(s.file)); markThumb(b); toast(s.name + " canvas ready"); switchTab("designs"); }
        catch (_) { toast("Could not load sample"); }
      });
      host.appendChild(b);
    });
  })();
  function markThumb(b) { $$(".thumb").forEach((t) => t.classList.remove("on")); if (b) b.classList.add("on"); }
  (function buildBlanks() {
    const host = $("#blankSwatches");
    Object.entries({ Porcelain: "#ecd0bb", Fair: "#e0b38a", Tan: "#c68b59", Deep: "#8a5a34", Ebony: "#4a3120" })
      .forEach(([name, hex]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "swatch"; b.style.background = hex;
        b.title = name; b.setAttribute("aria-label", "Blank " + name + " skin");
        b.addEventListener("click", () => { setBlankBase(hex); markThumb(null); markSwatch(b); toast(name + " canvas ready"); switchTab("designs"); });
        host.appendChild(b);
      });
  })();
  function markSwatch(b) { $$(".swatch").forEach((s) => s.classList.remove("on")); if (b) b.classList.add("on"); }

  /* ---------------- uploads ---------------- */
  function wireDrop(dropSel, inputSel, handler) {
    const drop = $(dropSel), input = $(inputSel);
    input.addEventListener("change", (e) => { if (e.target.files[0]) handler(e.target.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
    drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) handler(f); });
  }
  function readImage(file) {
    return new Promise((res, rej) => {
      if (!file.type.startsWith("image/")) return rej(new Error("not an image"));
      const fr = new FileReader();
      fr.onload = () => loadImg(fr.result).then(res).catch(rej);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }
  wireDrop("#photoDrop", "#photoInput", async (f) => {
    try { setPhotoBase(await readImage(f)); markThumb(null); markSwatch(null); toast("Photo loaded"); switchTab("designs"); }
    catch (_) { toast("That file could not be read as an image"); }
  });
  wireDrop("#artDrop", "#artInput", async (f) => {
    try {
      const img = await readImage(f);
      addLayer({ base: img, iw: img.naturalWidth, ih: img.naturalHeight, name: "Your art", kind: "image" });
    } catch (_) { toast("That file could not be read as an image"); }
  });

  /* ---------------- tabs ---------------- */
  let activeTab = "canvas";
  function switchTab(name) {
    activeTab = name;
    $$(".tab").forEach((t) => {
      const on = t.id === "tab-" + name;
      t.classList.toggle("on", on); t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".pane").forEach((p) => { p.hidden = p.id !== "pane-" + name; if (!p.hidden) p.classList.add("on"); });
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.id.replace("tab-", ""))));

  /* ---------------- export ---------------- */
  $("#expGrain").addEventListener("change", (e) => { state.grainOverlay = e.target.checked; scheduleRender(); });
  $("#downloadBtn").addEventListener("click", () => {
    if (!state.base) { toast("Nothing to export yet"); return; }
    render();                                   // clean frame, no handles (handles live on overlay)
    compose.toBlob((blob) => {
      if (!blob) { toast("Export failed"); return; }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "stencil-tryon.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast("Saved stencil-tryon.png");
    }, "image/png");
  });
  $("#resetBtn").addEventListener("click", () => {
    state.layers = []; select(null); updateCount(); scheduleRender(); toast("Designs cleared");
  });

  /* ---------------- misc chrome ---------------- */
  $("#quickStart").addEventListener("click", () => {
    const list = window.STENCIL_SKINS || [];
    if (list.length) { loadImg(list[0].file).then((img) => { setPhotoBase(img); switchTab("designs"); }).catch(() => setBlankBase("#e0b38a")); }
    else { setBlankBase("#e0b38a"); switchTab("designs"); toast("Blank canvas ready — add a design"); }
  });
  const helpModal = $("#helpModal");
  $("#helpBtn").addEventListener("click", () => { helpModal.hidden = false; });
  $("#helpClose").addEventListener("click", () => { helpModal.hidden = true; });
  helpModal.addEventListener("click", (e) => { if (e.target === helpModal) helpModal.hidden = true; });
  addEventListener("keydown", (e) => { if (e.key === "Escape") helpModal.hidden = true; });

  addEventListener("resize", () => scheduleRender());
  window.addEventListener("orientationchange", () => setTimeout(scheduleRender, 200));

  // expose a little surface for the smoke test
  window.STENCIL = { state, addFlash, setBlankBase, switchTab };
})();
