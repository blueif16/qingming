// Character lineup: every character in assets/chars/characters.json side by side, each playing a chosen clip,
// with the same lights and ink post as the scene pages. For reviewing clips by eye, and for
// tools/clip_sheet.mjs (frame sheets per clip). ?only=a,b shows just those characters.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { loadCharacters } from './people.js';
import { InkPost } from './post.js';
import { DEFAULTS } from './settings.js';

const s = { ...DEFAULTS, fogNear: 60, fogFar: 200, inkFadeStart: 30, inkFadeEnd: 90 };
const $ = (id) => document.getElementById(id);
const deg = THREE.MathUtils.degToRad;
const only = new URLSearchParams(location.search).get('only')?.split(',');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(s.fogColor);
scene.fog = new THREE.Fog(s.fogColor, s.fogNear, s.fogFar);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 300);
const hemi = new THREE.HemisphereLight(s.hemiSky, s.hemiGround, s.hemiIntensity);
const sun = new THREE.DirectionalLight(s.sunColor, s.sunIntensity);
sun.position.set(-6, 10, 8);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 64).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#cdb48a' }));
ground.receiveShadow = true;
scene.add(ground);
const post = new InkPost(renderer);
const controls = new OrbitControls(camera, renderer.domElement);

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const SHOW_PROPS = new URLSearchParams(location.search).get('props') || '';
const chars = []; // { name, root, mixer, clips, action, label }
async function load() {
  // the same loading as the scene pages (people.js): height, grounded clips, locomotion drift removed
  const models = await loadCharacters(loader, 'assets/chars/characters.json', only);
  const names = Object.keys(models).sort();
  const gap = 1.3, x0 = -((names.length - 1) * gap) / 2;
  names.forEach((name, i) => {
    const m = models[name];
    const root = SkeletonUtils.clone(m.scene);
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      o.frustumCulled = false;
      o.material = new THREE.MeshLambertMaterial({ map: o.material.map, color: o.material.color });
      // carried props (prop_<name>) are off unless asked for: ?props=1 shows them all, ?props=fan_round,bucket some
      if (/^prop_/.test(o.name)) o.visible = SHOW_PROPS === '1' || SHOW_PROPS.split(',').includes(o.name.slice(5));
    });
    root.position.x = x0 + i * gap;
    scene.add(root);
    const label = document.createElement('div');
    label.style.cssText = 'position:fixed;transform:translate(-50%,0);font:12px ui-monospace,monospace;color:#3a2617;pointer-events:none;';
    document.body.appendChild(label);
    chars[i] = { name, root, mixer: new THREE.AnimationMixer(root), clips: m.clips, label };
  });
  for (const c of chars) play(c.name, c.clips.find((k) => k.name === 'idle') ? 'idle' : c.clips[0].name);
}

const byName = (n) => chars.find((c) => c.name === n);
function play(name, clipName) {
  const c = byName(name), clip = c.clips.find((k) => k.name === clipName);
  if (!clip) return false;
  const next = c.mixer.clipAction(clip);
  if (c.action && c.action !== next) { next.reset().play(); c.action.crossFadeTo(next, 0.3, false); } else next.play();
  c.action = next;
  c.current = clipName;
  return true;
}
// freeze a character at time t of a clip (no blending), for frame sheets
function pose(name, clipName, t) {
  const c = byName(name), clip = c.clips.find((k) => k.name === clipName);
  c.mixer.stopAllAction();
  const a = c.mixer.clipAction(clip);
  a.reset().play();
  a.paused = true;
  a.time = Math.min(t, clip.duration - 1e-3);
  c.action = a; c.current = clipName;
  c.mixer.update(0);
  return clip.duration;
}
function focus(name, azDeg = 25, dist = 4.2, height = 0.95) {
  const c = name ? byName(name) : null;
  const target = new THREE.Vector3(c ? c.root.position.x : 0, height, 0);
  const d = c ? dist : Math.max(6, chars.length * 1.25);
  camera.position.set(target.x + Math.sin(deg(azDeg)) * d, height + 0.35, Math.cos(deg(azDeg)) * d);
  controls.target.copy(target);
  controls.update();
}

function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  post.setSize(size.x, size.y);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

const ui = { speed: 1, paused: false, all: 'idle' };
const timer = new THREE.Timer();
const v = new THREE.Vector3();
function tick(now) {
  timer.update(now);
  const dt = ui.paused ? 0 : Math.min(timer.getDelta(), 0.1) * ui.speed;
  for (const c of chars) c.mixer.update(dt);
  post.render(scene, camera, s);
  for (const c of chars) {
    v.set(c.root.position.x, -0.12, 0.35).project(camera);
    Object.assign(c.label.style, { left: `${(v.x * 0.5 + 0.5) * innerWidth}px`, top: `${(-v.y * 0.5 + 0.5) * innerHeight}px` });
    c.label.textContent = `${c.name} · ${c.current}`;
  }
  requestAnimationFrame(tick);
}

try {
  resize();
  await load();
  focus(null, 0);
  const gui = new GUI({ title: 'Characters' });
  gui.add(ui, 'speed', 0, 2, 0.05);
  gui.add(ui, 'paused');
  const allClips = [...new Set(chars.flatMap((c) => c.clips.map((k) => k.name)))];
  gui.add(ui, 'all', allClips).name('everyone plays').onChange((n) => chars.forEach((c) => play(c.name, n)));
  for (const c of chars) {
    const o = { clip: c.current };
    gui.add(o, 'clip', c.clips.map((k) => k.name)).name(c.name).onChange((n) => play(c.name, n));
  }
  $('help').textContent = 'Drag to orbit · scroll to zoom · pick a clip per character in the panel';
  $('loading').remove();
  window.__test = { THREE, renderer, names: chars.map((c) => c.name), clips: Object.fromEntries(chars.map((c) => [c.name, c.clips.map((k) => [k.name, k.duration])])), play, pose, focus, ui };
  requestAnimationFrame(tick);
} catch (err) {
  console.error(err);
  $('loading').textContent = 'Failed to load: ' + err.message;
}
