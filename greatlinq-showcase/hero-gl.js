// Ambient WebGL accent for Enter — same lantern GLB as the live chapter (MEASURED asset).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('heroGl');
if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) {
  if (canvas) canvas.hidden = true;
} else {
  const reduce = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 40);
  camera.position.set(0.55, 0.42, 1.35);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xfff2e0, 1.4);
  key.position.set(2, 3, 2);
  scene.add(key, new THREE.AmbientLight(0x8899bb, 0.35));
  const glow = new THREE.PointLight(0xffc48a, 0, 4, 2);
  glow.position.set(0, 0.35, 0);
  scene.add(glow);

  let root = null;
  let lightT = 0;
  const targetLight = { v: 0.55 };

  const draco = new DRACOLoader().setDecoderPath('vendor/three@0.170.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  loader.load('v2/lantern/media/ondai-lantern.glb', (gltf) => {
    root = gltf.scene;
    root.scale.setScalar(1.15);
    root.position.set(0, -0.15, 0);
    scene.add(root);
    canvas.classList.add('is-ready');
  }, undefined, () => { canvas.hidden = true; });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 320;
    const h = canvas.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (root) root.rotation.y = t * 0.22;
    lightT += (targetLight.v - lightT) * 0.04;
    glow.intensity = 0.4 + lightT * 2.2;
    renderer.render(scene, camera);
  }
  frame();

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    targetLight.v = 0.25 + x * 0.9;
  });
}
