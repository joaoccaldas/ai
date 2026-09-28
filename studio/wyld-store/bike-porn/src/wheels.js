import * as THREE from 'three';

// Wheel extras for the films: a full rear disc (a super-9 style lathe profile, same shape the
// Canyon Museum uses for its disc option) with an original WYLD graphic, and neon rings that
// hug both rims. Both live inside the wheel nodes, so they turn with the wheels.
const PROFILE = [[.012, .019], [.035, .016], [.075, .0152], [.23, .0152], [.285, .0152], [.303, .0148], [.311, .012], [.311, -.012], [.303, -.0148], [.285, -.0152], [.23, -.0152], [.075, -.0152], [.035, -.016], [.012, -.019], [.012, .019]];

function discTexture(neon, label) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const x = c.getContext('2d'), m = 512;
  const g = x.createRadialGradient(m, m, 40, m, m, 512); g.addColorStop(0, '#16161a'); g.addColorStop(1, '#070708');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
  x.globalAlpha = .08; x.strokeStyle = '#ffffff';
  for (let a = 0; a < 180; a++) { x.beginPath(); x.moveTo(m, m); x.lineTo(m + Math.cos(a / 180 * Math.PI * 2) * 512, m + Math.sin(a / 180 * Math.PI * 2) * 512); x.stroke(); }
  x.globalAlpha = 1; x.strokeStyle = neon; x.shadowColor = neon; x.shadowBlur = 24;
  for (const [r, w] of [[492, 10], [452, 3], [150, 6]]) { x.lineWidth = w; x.beginPath(); x.arc(m, m, r, 0, Math.PI * 2); x.stroke(); }
  x.font = '400 150px Chewy, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = neon;
  x.save(); x.translate(m, m); x.rotate(-Math.PI / 2);
  for (const s of [-1, 1]) { x.save(); x.translate(s * 300, 0); x.rotate(s * Math.PI / 2); x.fillText('WYLD', 0, 0); x.restore(); }
  x.restore();
  x.shadowBlur = 0; x.font = '600 34px system-ui, sans-serif'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText(label.toUpperCase(), m, m + 212);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function makeWheelKit(wheelF, wheelR, parts) {
  const neonM = new THREE.MeshBasicMaterial({ toneMapped: false });
  const ringGeo = new THREE.TorusGeometry(.298, .0045, 8, 160);
  const rings = [];
  for (const w of [wheelF, wheelR]) if (w) for (const z of [-.0175, .0175]) { const r = new THREE.Mesh(ringGeo, neonM); r.position.z = z; r.visible = false; w.add(r); rings.push(r); }

  const geo = new THREE.LatheGeometry(PROFILE.map(p => new THREE.Vector2(...p)), 160); geo.rotateX(Math.PI / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, .5 + pos.getX(i) / .311 * .5 * (pos.getZ(i) > 0 ? 1 : -1), .5 + pos.getY(i) / .311 * .5);
  const discM = new THREE.MeshPhysicalMaterial({ roughness: .35, clearcoat: 1, clearcoatRoughness: .08, emissive: '#ffffff', emissiveIntensity: .9 });
  const disc = new THREE.Mesh(geo, discM); disc.castShadow = disc.receiveShadow = true; disc.visible = false;
  wheelR?.add(disc);
  let neonColor = new THREE.Color(), on = false, key = '';

  const vis = (id, v) => { if (parts[id]) parts[id].visible = v; };
  return {
    set(l) {
      on = !!l.neon;
      if (on) neonColor.set(l.neon);
      rings.forEach(r => { r.visible = on; });
      const wantDisc = !!l.disc;
      disc.visible = wantDisc;
      vis('spokes_rear', !wantDisc); vis('rim_rear', !wantDisc); vis('hub_rear', !wantDisc);
      if (wantDisc && key !== l.id) {
        key = l.id; discM.map?.dispose(); discM.emissiveMap?.dispose();
        const t = discTexture(l.neon || l.glow || '#ffffff', l.film || l.name);
        discM.map = t; discM.emissiveMap = t; discM.needsUpdate = true;
      }
    },
    update(t, boost = 0) {
      if (!on) return;
      neonM.color.copy(neonColor).multiplyScalar(2.2 + .8 * Math.sin(t * 4) + boost * 4);
    },
  };
}
