/* ============================================================================
   charts.js — hand-rolled SVG. No chart library.

   Every element carries explicit fill/stroke attributes rather than CSS
   classes, because these SVGs get serialised for the PowerPoint and PDF
   exports and stylesheets do not travel with them.
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';
export const C = {
  ink:'#1C1B1A', steel:'#8A8B87', rule:'#D6D6D1', paper:'#F7F7F5',
  bad:'#9E1B1B', good:'#2F5D50', brass:'#B08A3E', silver:'#B9BCB6', mute:'#EFEFEC'
};
export const el = (t, a = {}) => {
  const e = document.createElementNS(NS, t);
  for (const k in a) if (a[k] !== undefined && a[k] !== null) e.setAttribute(k, a[k]);
  return e;
};
export const tx = (x, y, s, a = {}) => {
  const e = el('text', { x, y, 'font-family':'IBM Plex Mono, monospace', 'font-size':10,
                         fill:C.steel, ...a });
  e.textContent = s; return e;
};
export const svg = (w, h) => el('svg', { width:'100%', height:h, viewBox:`0 0 ${w} ${h}`,
  xmlns:NS, style:'display:block' });
export const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); };
export const eur = v => (Math.abs(v) >= 1e6 ? '€' + (v/1e6).toFixed(1) + 'm'
                       : Math.abs(v) >= 1e3 ? '€' + Math.round(v/1e3) + 'k'
                       : '€' + Math.round(v));
export const seur = v => (v < 0 ? '−' : '+') + eur(Math.abs(v));
export const pct = (v, d = 1) => (v * 100).toFixed(d) + '%';
export const spp = (v, d = 1) => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(d) + 'pp';

/* ------------------------------- waterfall ------------------------------- */
export function waterfall(host, { from, to, parts, fromLab, toLab, height = 300, onPick }) {
  clear(host);
  const W = Math.max(640, host.clientWidth || 900), H = height;
  const s = svg(W, H); host.appendChild(s);
  const pad = { l:6, r:6, t:30, b:60 }, iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  const steps = [{ lab:fromLab, tot:true, v:from },
                 ...parts.map(p => ({ ...p, tot:false })),
                 { lab:toLab, tot:true, v:to }];
  let run = 0; const segs = [];
  for (const st of steps) {
    if (st.tot) { segs.push({ ...st, a:0, b:st.v }); run = st.v; }
    else { segs.push({ ...st, a:run, b:run + st.v }); run += st.v; }
  }
  /* Totals are anchored at zero by construction, so they must not drag the
     scale down — judge the range on the tops and on the delta bars only. */
  const tops = segs.flatMap(x => x.tot ? [x.b] : [x.a, x.b]);
  const loRaw = Math.min(...tops), hi = Math.max(...tops);
  const lo = Math.min(0, loRaw);
  const sp = (hi - lo) || 1;
  /* A €2m move on a €28m base is invisible against a zero baseline. When every
     bar sits well above zero, float the axis and say so — the alternative is a
     chart where the only readable thing is how big the totals are. */
  const truncated = loRaw > 0 && (hi - loRaw) / hi < 0.45;
  let bot = truncated ? loRaw - (hi - loRaw) * 0.55 : lo - sp * 0.06;
  const top = hi + (hi - bot) * 0.14;
  const Y = v => pad.t + ih - (v - bot) / (top - bot) * ih;

  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ih - ih * i / 4;
    s.appendChild(el('line', { x1:pad.l, x2:W-pad.r, y1:y, y2:y, stroke:C.rule, 'stroke-width':1 }));
  }
  if (truncated)
    s.appendChild(tx(W - pad.r, pad.t - 12, 'axis starts at ' + eur(bot),
      { 'text-anchor':'end', 'font-size':9 }));
  const bw = iw / segs.length, gap = bw * 0.26;
  const total = to - from;

  segs.forEach((g, i) => {
    const x = pad.l + i*bw + gap/2, w = bw - gap;
    const yA = Y(g.tot ? bot : g.a), yB = Y(g.b);
    const y = Math.min(yA, yB), h = Math.max(2, Math.abs(yA - yB));
    const col = g.tot ? C.ink : (g.v >= 0 ? C.good : C.bad);
    const grp = el('g', { style: onPick && !g.tot ? 'cursor:pointer' : '' });
    grp.appendChild(el('rect', { x, y, width:w, height:h, fill:col }));
    if (i < segs.length - 1)
      grp.appendChild(el('line', { x1:x+w, x2:x+w+gap, y1:Y(g.b), y2:Y(g.b),
        stroke:C.steel, 'stroke-width':1, 'stroke-dasharray':'2 2' }));
    grp.appendChild(tx(x + w/2, (g.v >= 0 || g.tot ? y - 8 : y + h + 15),
      g.tot ? eur(g.v) : seur(g.v),
      { 'text-anchor':'middle', 'font-size':11, 'font-weight':600, fill:col }));
    grp.appendChild(tx(x + w/2, pad.t + ih + 21, g.lab,
      { 'text-anchor':'middle', 'font-family':'Archivo, sans-serif', 'font-size':10,
        'font-weight':600, 'letter-spacing':'0.09em', fill:C.ink,
        style:'text-transform:uppercase' }));
    if (!g.tot && total)
      grp.appendChild(tx(x + w/2, pad.t + ih + 36,
        (g.v >= 0 ? '+' : '−') + Math.abs(g.v/total*100).toFixed(0) + '% of Δ',
        { 'text-anchor':'middle', 'font-size':9 }));
    if (onPick && !g.tot) {
      // full-height hit area: a 30px bar is a hard target in a live meeting
      const hit = el('rect', { x:pad.l + i*bw, y:pad.t, width:bw, height:ih,
        fill:'transparent' });
      hit.addEventListener('click', () => onPick(g.id));
      hit.addEventListener('mouseenter', () => grp.setAttribute('opacity', .75));
      hit.addEventListener('mouseleave', () => grp.setAttribute('opacity', 1));
      grp.appendChild(hit);
    }
    s.appendChild(grp);
  });
  return s;
}

/* ---------------------------- fan / trajectory --------------------------- */
export function fan(host, { months, actual, forecast, budget, band, cursor, height = 220 }) {
  clear(host);
  const W = Math.max(420, host.clientWidth || 700), H = height;
  const s = svg(W, H); host.appendChild(s);
  const pad = { l:44, r:10, t:12, b:26 }, iw = W-pad.l-pad.r, ih = H-pad.t-pad.b;
  const all = [...actual, ...forecast, ...budget,
               ...band.map(b => b[0]), ...band.map(b => b[1])].filter(v => v != null);
  const lo = Math.min(...all) * 0.92, hi = Math.max(...all) * 1.05;
  const X = i => pad.l + i/(months-1)*iw, Y = v => pad.t + ih - (v-lo)/(hi-lo)*ih;

  for (let i = 0; i <= 3; i++) {
    const v = lo + (hi-lo)*i/3;
    s.appendChild(el('line', { x1:pad.l, x2:W-pad.r, y1:Y(v), y2:Y(v), stroke:C.rule }));
    s.appendChild(tx(pad.l-6, Y(v)+3, eur(v), { 'text-anchor':'end', 'font-size':9 }));
  }
  const bandPts = band.map((b,i)=>b[0]!=null?`${X(i)},${Y(b[1])}`:null).filter(Boolean)
    .concat(band.map((b,i)=>b[0]!=null?`${X(i)},${Y(b[0])}`:null).filter(Boolean).reverse());
  if (bandPts.length) s.appendChild(el('polygon', { points:bandPts.join(' '), fill:C.bad, opacity:.12 }));

  const line = (arr, col, w, dash) => {
    const p = arr.map((v,i) => v==null?null:`${X(i)},${Y(v)}`).filter(Boolean).join(' ');
    if (p) s.appendChild(el('polyline', { points:p, fill:'none', stroke:col, 'stroke-width':w,
      'stroke-dasharray':dash, 'stroke-linejoin':'round' }));
  };
  line(budget,   C.steel, 1.4, '4 3');
  line(forecast, C.bad,   2,   null);
  line(actual,   C.ink,   2,   null);

  s.appendChild(el('line', { x1:X(cursor), x2:X(cursor), y1:pad.t, y2:pad.t+ih,
    stroke:C.ink, 'stroke-width':1, 'stroke-dasharray':'3 3' }));
  s.appendChild(tx(X(cursor)+4, pad.t+10, 'actuals close', { 'font-size':9, fill:C.ink }));
  return s;
}

/* -------------------------------- tornado -------------------------------- */
export function tornadoChart(host, rows, height = 210) {
  clear(host);
  const W = Math.max(360, host.clientWidth || 600), H = height;
  const s = svg(W, H); host.appendChild(s);
  const pad = { l:112, r:52, t:8, b:24 }, iw = W-pad.l-pad.r, ih = H-pad.t-pad.b;
  const mx = Math.max(...rows.map(r => Math.abs(r.hi)), 1);
  const X = v => pad.l + iw/2 + v/mx*(iw/2 - 2);
  const bh = ih / Math.max(1, rows.length);
  s.appendChild(el('line', { x1:X(0), x2:X(0), y1:pad.t, y2:pad.t+ih, stroke:C.ink }));
  rows.forEach((r, i) => {
    const y = pad.t + i*bh + bh*0.2, h = bh*0.6;
    for (const v of [r.lo, r.hi]) {
      const x0 = Math.min(X(0), X(v));
      s.appendChild(el('rect', { x:x0, y, width:Math.max(1, Math.abs(X(v)-X(0))), height:h,
        fill: v >= 0 ? C.good : C.bad, opacity:.88 }));
    }
    s.appendChild(tx(pad.l-8, y+h/2+3.5, r.name, { 'text-anchor':'end', fill:C.ink, 'font-size':10 }));
    s.appendChild(tx(X(Math.abs(r.hi))+6, y+h/2+3.5,
      '±' + r.sigma.toFixed(1) + (r.unit === 'pp' ? 'pp' : '%'), { 'font-size':9 }));
  });
  s.appendChild(tx(pad.l, H-7, '−'+eur(mx), { 'font-size':9 }));
  s.appendChild(tx(X(0), H-7, 'forecast', { 'text-anchor':'middle', 'font-size':9, fill:C.ink }));
  s.appendChild(tx(W-pad.r, H-7, '+'+eur(mx), { 'text-anchor':'end', 'font-size':9 }));
  return s;
}

/* ------------------------------- histogram ------------------------------- */
export function histChart(host, hist, marks = [], height = 190) {
  clear(host);
  const W = Math.max(360, host.clientWidth || 600), H = height;
  const s = svg(W, H); host.appendChild(s);
  const pad = { l:10, r:10, t:24, b:30 }, iw = W-pad.l-pad.r, ih = H-pad.t-pad.b;
  const d0 = Math.min(hist.lo, ...marks.map(m => m.v));
  const d1 = Math.max(hist.hi, ...marks.map(m => m.v));
  const X = v => pad.l + (v - d0) / ((d1 - d0) || 1) * iw;
  const bw = Math.max(1, (X(hist.lo + hist.w) - X(hist.lo)) - 1);
  hist.h.forEach((c, i) => {
    const h = c / hist.max * ih;
    s.appendChild(el('rect', { x:X(hist.lo + i*hist.w) + 0.5, y:pad.t+ih-h, width:bw, height:h,
      fill:C.ink, opacity:.16 }));
  });
  marks.forEach(m => {
    const x = X(m.v);
    s.appendChild(el('line', { x1:x, x2:x, y1:pad.t-6, y2:pad.t+ih, stroke:m.col ?? C.bad,
      'stroke-width':1.5, 'stroke-dasharray':m.dash ?? null }));
    s.appendChild(tx(x, pad.t-10, m.lab, { 'text-anchor':'middle', 'font-size':9,
      fill:m.col ?? C.bad, 'font-weight':600 }));
  });
  s.appendChild(tx(pad.l, H-8, eur(d0), { 'font-size':9 }));
  s.appendChild(tx(W-pad.r, H-8, eur(d1), { 'text-anchor':'end', 'font-size':9 }));
  return s;
}

/* ------------------------------ stacked area ----------------------------- */
export function area(host, { series, cols, n, cursor, height = 200 }) {
  clear(host);
  const W = Math.max(320, host.clientWidth || 500), H = height;
  const s = svg(W, H); host.appendChild(s);
  const pad = { l:34, r:8, t:8, b:22 }, iw = W-pad.l-pad.r, ih = H-pad.t-pad.b;
  const X = i => pad.l + i/(n-1)*iw;
  let base = new Array(n).fill(0);
  series.forEach((row, si) => {
    const top = row.map((v, i) => base[i] + v);
    const up = top.map((v, i) => `${X(i)},${pad.t+ih-v*ih}`);
    const dn = base.map((v, i) => `${X(i)},${pad.t+ih-v*ih}`).reverse();
    s.appendChild(el('polygon', { points:[...up, ...dn].join(' '), fill:cols[si], opacity:.92 }));
    base = top;
  });
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ih - ih*i/4;
    s.appendChild(el('line', { x1:pad.l, x2:W-pad.r, y1:y, y2:y, stroke:'#fff', opacity:.35 }));
    s.appendChild(tx(pad.l-6, y+3, (i*25)+'%', { 'text-anchor':'end', 'font-size':9 }));
  }
  s.appendChild(el('line', { x1:X(cursor), x2:X(cursor), y1:pad.t, y2:pad.t+ih,
    stroke:C.mute, 'stroke-width':1.5, 'stroke-dasharray':'3 3' }));
  return s;
}

/* -------------------------------- scatter -------------------------------- */
export function scatter(host, { pts, band, height = 200 }) {
  clear(host);
  const W = Math.max(320, host.clientWidth || 500), H = height;
  const s = svg(W, H); host.appendChild(s);
  const pad = { l:36, r:12, t:12, b:28 }, iw = W-pad.l-pad.r, ih = H-pad.t-pad.b;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = 0, x1 = Math.max(...xs, band[1]) * 1.06;
  const y0 = Math.min(...ys) - .03, y1 = Math.max(...ys) + .03;
  const X = v => pad.l + (v-x0)/(x1-x0)*iw, Y = v => pad.t + ih - (v-y0)/(y1-y0)*ih;
  s.appendChild(el('rect', { x:X(band[0]), y:pad.t, width:Math.max(1,X(band[1])-X(band[0])),
    height:ih, fill:C.rule, opacity:.55 }));
  for (let i = 0; i <= 3; i++) {
    const v = y0 + (y1-y0)*i/3;
    s.appendChild(el('line', { x1:pad.l, x2:W-pad.r, y1:Y(v), y2:Y(v), stroke:C.rule }));
    s.appendChild(tx(pad.l-6, Y(v)+3, (v*100).toFixed(0)+'%', { 'text-anchor':'end', 'font-size':9 }));
  }
  const mz = Math.max(...pts.map(p => p.z), 1);
  pts.forEach(p => {
    const out = p.x < band[0] || p.x > band[1];
    s.appendChild(el('circle', { cx:X(p.x), cy:Y(p.y), r:3+Math.sqrt(p.z/mz)*8, fill:p.col,
      opacity: out ? .95 : .55, stroke: out ? C.bad : null, 'stroke-width': out ? 1.4 : null }));
  });
  s.appendChild(tx(pad.l, H-8, 'ASP €  →', { 'font-size':9 }));
  s.appendChild(tx(pad.l+2, pad.t+9, 'Margin rate ↑', { 'font-size':9 }));
  return s;
}

/* -------------------------------- heatmap -------------------------------- */
export function heat(host, { rows, cols, cells, fmt = spp }) {
  const mx = Math.max(...cells.flat().map(Math.abs), 1e-9);
  const th = cols.map(c => `<th>${c}</th>`).join('');
  const body = rows.map((r, i) => '<tr><td class="rowlab">' + r + '</td>' +
    cells[i].map((v, j) => {
      const a = Math.min(1, Math.abs(v)/mx) * 0.82;
      const bg = v >= 0 ? `rgba(47,93,80,${a.toFixed(2)})` : `rgba(158,27,27,${a.toFixed(2)})`;
      const fg = a > .45 ? '#F7F7F5' : C.ink;
      const bd = j === cells[i].length-1 ? 'border-left:2px solid #1C1B1A;' : '';
      return `<td><div class="cell" style="background:${bg};color:${fg};${bd}">${fmt(v)}</div></td>`;
    }).join('') + '</tr>').join('');
  host.innerHTML = `<table><tr><th></th>${th}</tr>${body}</table>`;
}

/* ------------------------------- sparkline ------------------------------- */
export function spark(vals, w, h, col, split) {
  const s = svg(w, h); s.setAttribute('width', w);
  const lo = Math.min(...vals), hi = Math.max(...vals), sp = (hi-lo) || 1;
  const P = (v, i) => `${i/(vals.length-1)*w},${h-(v-lo)/sp*(h-3)-1.5}`;
  if (split != null) {
    s.appendChild(el('polyline', { points:vals.slice(0, split+1).map(P).join(' '),
      fill:'none', stroke:C.ink, 'stroke-width':1.5 }));
    s.appendChild(el('polyline', { points:vals.map(P).slice(split).join(' '),
      fill:'none', stroke:col, 'stroke-width':1.5, 'stroke-dasharray':'3 2' }));
  } else {
    s.appendChild(el('polyline', { points:vals.map(P).join(' '), fill:'none',
      stroke:col, 'stroke-width':1.5 }));
  }
  return s;
}
