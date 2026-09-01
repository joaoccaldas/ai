// StageEngine — canvas compositor for the try-on placement step.
// A clean `compose` canvas holds the base photo + design layers (multiply blend,
// so ink darkens and follows the skin). A transparent `overlay` canvas draws the
// selection box + handles and captures pointer input: drag to move, corner to
// scale, top handle to rotate, two-finger pinch to scale+rotate. Sources are all
// same-origin (data/object URLs), so exporting the composite never taints.

export type Layer = {
  id: number;
  img: CanvasImageSource;
  iw: number;
  ih: number;
  name: string;
  kind: "flash" | "image";
  body?: string; // flash svg body, for retinting by the caller
  x: number;
  y: number;
  scale: number;
  refScale: number;
  rot: number;
  opacity: number;
  flipX: boolean;
};

type AddOpts = { img: CanvasImageSource; iw: number; ih: number; name: string; kind: "flash" | "image"; body?: string };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export class StageEngine {
  compose: HTMLCanvasElement;
  overlay: HTMLCanvasElement;
  private cx: CanvasRenderingContext2D;
  private ox: CanvasRenderingContext2D;
  base: CanvasImageSource | null = null;
  private baseW = 0;
  private baseH = 0;
  layers: Layer[] = [];
  selId: number | null = null;
  private nextId = 1;
  private raf = 0;
  private onChange: () => void;

  // gesture state
  private drag: { mode: "move" | "scale" | "rotate"; id: number; p0: { x: number; y: number }; x0: number; y0: number; s0: number; r0: number; d0: number; a0: number } | null = null;
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch: { d0: number; a0: number; s0: number; r0: number; id: number } | null = null;

  constructor(compose: HTMLCanvasElement, overlay: HTMLCanvasElement, onChange: () => void) {
    this.compose = compose;
    this.overlay = overlay;
    this.cx = compose.getContext("2d")!;
    this.ox = overlay.getContext("2d")!;
    this.onChange = onChange;
    this.bind();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    const o = this.overlay;
    o.onpointerdown = o.onpointermove = o.onpointerup = o.onpointercancel = null;
    o.onwheel = null;
  }

  /* ---------- base ---------- */
  setBase(img: HTMLImageElement, maxdim = 1100) {
    const w0 = img.naturalWidth || (img as HTMLImageElement).width;
    const h0 = img.naturalHeight || (img as HTMLImageElement).height;
    const s = Math.min(1, maxdim / Math.max(w0, h0));
    this.baseW = Math.round(w0 * s);
    this.baseH = Math.round(h0 * s);
    this.compose.width = this.overlay.width = this.baseW;
    this.compose.height = this.overlay.height = this.baseH;
    this.base = img;
    this.schedule();
  }

  /* ---------- layers ---------- */
  add(opts: AddOpts): number {
    if (!this.base) return -1;
    const refScale = (this.baseW * 0.42) / opts.iw;
    const layer: Layer = {
      id: this.nextId++,
      img: opts.img,
      iw: opts.iw,
      ih: opts.ih,
      name: opts.name,
      kind: opts.kind,
      body: opts.body,
      x: this.baseW / 2,
      y: this.baseH / 2,
      scale: refScale,
      refScale,
      rot: 0,
      opacity: 0.9,
      flipX: false,
    };
    this.layers.push(layer);
    this.selId = layer.id;
    this.schedule();
    this.onChange();
    return layer.id;
  }
  selected(): Layer | null {
    return this.layers.find((l) => l.id === this.selId) ?? null;
  }
  select(id: number | null) {
    this.selId = id;
    this.schedule();
    this.onChange();
  }
  removeSelected() {
    const i = this.layers.findIndex((l) => l.id === this.selId);
    if (i < 0) return;
    this.layers.splice(i, 1);
    this.selId = this.layers.length ? this.layers[this.layers.length - 1].id : null;
    this.schedule();
    this.onChange();
  }
  replaceSelectedImage(img: CanvasImageSource, iw: number, ih: number) {
    const l = this.selected();
    if (!l) return;
    l.img = img; l.iw = iw; l.ih = ih;
    this.schedule();
  }
  bring(dir: "front" | "back") {
    const l = this.selected(); if (!l) return;
    const i = this.layers.indexOf(l);
    this.layers.splice(i, 1);
    if (dir === "front") this.layers.push(l); else this.layers.unshift(l);
    this.schedule(); this.onChange();
  }
  flip() { const l = this.selected(); if (l) { l.flipX = !l.flipX; this.schedule(); } }
  setSizePct(p: number) { const l = this.selected(); if (l) { l.scale = l.refScale * (p / 100); this.schedule(); } }
  setRotDeg(d: number) { const l = this.selected(); if (l) { l.rot = (d * Math.PI) / 180; this.schedule(); } }
  setOpacity(v: number) { const l = this.selected(); if (l) { l.opacity = v; this.schedule(); } }

  params() {
    const l = this.selected();
    if (!l) return null;
    let deg = Math.round((l.rot * 180) / Math.PI);
    deg = (((deg + 180) % 360) + 360) % 360 - 180;
    return { sizePct: Math.round((l.scale / l.refScale) * 100), rotDeg: deg, opacity: l.opacity, kind: l.kind };
  }

  /* ---------- render ---------- */
  private schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); this.drawOverlay(); });
  }
  private render() {
    if (!this.base) return;
    const { cx } = this;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, this.baseW, this.baseH);
    cx.drawImage(this.base, 0, 0, this.baseW, this.baseH);
    for (const l of this.layers) {
      cx.save();
      cx.globalAlpha = l.opacity;
      cx.globalCompositeOperation = "multiply";
      cx.translate(l.x, l.y);
      cx.rotate(l.rot);
      cx.scale(l.flipX ? -l.scale : l.scale, l.scale);
      cx.drawImage(l.img, -l.iw / 2, -l.ih / 2, l.iw, l.ih);
      cx.restore();
    }
  }

  private screenScale() {
    const r = this.overlay.getBoundingClientRect();
    return this.overlay.width / (r.width || 1);
  }
  private corners(l: Layer) {
    const hw = (l.iw * l.scale) / 2, hh = (l.ih * l.scale) / 2, c = Math.cos(l.rot), s = Math.sin(l.rot);
    const pt = (dx: number, dy: number) => ({ x: l.x + dx * c - dy * s, y: l.y + dx * s + dy * c });
    return { tl: pt(-hw, -hh), tr: pt(hw, -hh), br: pt(hw, hh), bl: pt(-hw, hh) };
  }
  private rotHandle(l: Layer) {
    const hh = (l.ih * l.scale) / 2, off = 34 * this.screenScale();
    return { x: l.x + Math.sin(l.rot) * (hh + off), y: l.y - Math.cos(l.rot) * (hh + off) };
  }
  private drawOverlay() {
    const { ox } = this;
    ox.setTransform(1, 0, 0, 1, 0, 0);
    ox.clearRect(0, 0, this.overlay.width, this.overlay.height);
    const l = this.selected(); if (!l) return;
    const ss = this.screenScale(), hw = (l.iw * l.scale) / 2, hh = (l.ih * l.scale) / 2;
    ox.save();
    ox.translate(l.x, l.y); ox.rotate(l.rot);
    ox.strokeStyle = "rgba(210,75,63,.95)"; ox.lineWidth = 1.5 * ss;
    ox.setLineDash([6 * ss, 5 * ss]);
    ox.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ox.setLineDash([]);
    ox.beginPath(); ox.moveTo(0, -hh); ox.lineTo(0, -hh - 34 * ss); ox.stroke();
    ox.restore();
    const R = 7 * ss;
    const cs = this.corners(l);
    for (const p of [cs.tl, cs.tr, cs.br, cs.bl]) this.dot(p, R, "#ece7df");
    this.dot(this.rotHandle(l), R * 1.05, "#d24b3f");
  }
  private dot(p: { x: number; y: number }, r: number, fill: string) {
    const { ox } = this;
    ox.beginPath(); ox.arc(p.x, p.y, r, 0, Math.PI * 2);
    ox.fillStyle = fill; ox.fill();
    ox.lineWidth = 1.4 * this.screenScale(); ox.strokeStyle = "rgba(0,0,0,.55)"; ox.stroke();
  }

  /* ---------- pointer ---------- */
  private toCanvas(e: PointerEvent) {
    const r = this.overlay.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (this.overlay.width / r.width), y: (e.clientY - r.top) * (this.overlay.height / r.height) };
  }
  private inRect(l: Layer, p: { x: number; y: number }) {
    const dx = p.x - l.x, dy = p.y - l.y, c = Math.cos(-l.rot), s = Math.sin(-l.rot);
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    return Math.abs(lx) <= (l.iw * l.scale) / 2 && Math.abs(ly) <= (l.ih * l.scale) / 2;
  }
  private bind() {
    const o = this.overlay;
    o.style.touchAction = "none";
    o.onpointerdown = (e) => {
      o.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) { this.startPinch(); return; }
      const p = this.toCanvas(e), R = 14 * this.screenScale();
      const l = this.selected();
      if (l) {
        if (dist(p, this.rotHandle(l)) <= R * 1.4) return this.startDrag("rotate", l, p);
        const cs = this.corners(l);
        if ([cs.tl, cs.tr, cs.br, cs.bl].some((c) => dist(p, c) <= R * 1.4)) return this.startDrag("scale", l, p);
        if (this.inRect(l, p)) return this.startDrag("move", l, p);
      }
      for (let i = this.layers.length - 1; i >= 0; i--) {
        if (this.inRect(this.layers[i], p)) { this.select(this.layers[i].id); return this.startDrag("move", this.layers[i], p); }
      }
      this.select(null);
    };
    o.onpointermove = (e) => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.pointers.size >= 2) return this.movePinch();
      if (!this.drag) return;
      const l = this.layers.find((x) => x.id === this.drag!.id); if (!l) return;
      const p = this.toCanvas(e);
      if (this.drag.mode === "move") { l.x = this.drag.x0 + (p.x - this.drag.p0.x); l.y = this.drag.y0 + (p.y - this.drag.p0.y); }
      else if (this.drag.mode === "scale") { const d = dist(p, { x: l.x, y: l.y }); l.scale = clamp(this.drag.s0 * (d / (this.drag.d0 || 1)), l.refScale * 0.05, l.refScale * 3); }
      else { const a = Math.atan2(p.y - l.y, p.x - l.x); l.rot = this.drag.r0 + (a - this.drag.a0); }
      this.schedule(); this.onChange();
    };
    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      try { o.releasePointerCapture(e.pointerId); } catch {}
      if (this.pointers.size < 2) this.pinch = null;
      this.drag = null;
    };
    o.onpointerup = end;
    o.onpointercancel = end;
    o.onwheel = (e) => {
      const l = this.selected(); if (!l) return;
      e.preventDefault();
      l.scale = clamp(l.scale * (e.deltaY < 0 ? 1.06 : 0.94), l.refScale * 0.05, l.refScale * 3);
      this.schedule(); this.onChange();
    };
  }
  private startDrag(mode: "move" | "scale" | "rotate", l: Layer, p: { x: number; y: number }) {
    this.drag = { mode, id: l.id, p0: p, x0: l.x, y0: l.y, s0: l.scale, r0: l.rot, d0: dist(p, { x: l.x, y: l.y }), a0: Math.atan2(p.y - l.y, p.x - l.x) };
  }
  private twoPointers() {
    const pts = [...this.pointers.values()];
    return { a: pts[0], b: pts[1] };
  }
  private startPinch() {
    const l = this.selected() ?? this.layers[this.layers.length - 1];
    if (!l) return;
    this.selId = l.id;
    const { a, b } = this.twoPointers();
    this.pinch = { d0: dist(a, b), a0: Math.atan2(b.y - a.y, b.x - a.x), s0: l.scale, r0: l.rot, id: l.id };
    this.drag = null;
  }
  private movePinch() {
    if (!this.pinch) return;
    const l = this.layers.find((x) => x.id === this.pinch!.id); if (!l) return;
    const { a, b } = this.twoPointers();
    if (!a || !b) return;
    const d = dist(a, b), ang = Math.atan2(b.y - a.y, b.x - a.x);
    l.scale = clamp(this.pinch.s0 * (d / (this.pinch.d0 || 1)), l.refScale * 0.05, l.refScale * 3);
    l.rot = this.pinch.r0 + (ang - this.pinch.a0);
    this.schedule(); this.onChange();
  }

  exportDataUrl(type = "image/jpeg", quality = 0.92): string {
    this.render(); // clean frame (handles are on the overlay)
    return this.compose.toDataURL(type, quality);
  }
}
