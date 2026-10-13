// Creature lineup: every animal in assets/animals/animals.json (built by tools/animal.mjs) side by side, each
// playing a chosen clip, with its tack variants and an optional rider, under the same lights and ink pass as the
// scene pages. For reviewing by eye and for `node tools/animal.mjs <type> frames` (frame sheets on the real GPU).
//   ?only=donkey,ox        just those animals
//   ?tack=donkey:pack_saddle,camel:pack     show one tack variant per animal (all tack nodes are hidden otherwise)
//   ?rider=donkey:carter   seat a character (playing its 'ride' clip) on the animal's saddle point
//   ?move=1                while 'walk' plays the animal moves forward at its registry walk speed over a striped
//                          ground (0.25 m stripes), so a planted hoof that slides shows at once
//   ?sheet=1               no panel or help (frame sheets)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { InkPost } from './post.js';
import { DEFAULTS } from './settings.js';

const s = { ...DEFAULTS, fogNear: 60, fogFar: 200, inkFadeStart: 30, inkFadeEnd: 90 };
const $ = (id) => document.getElementById(id);
const deg = THREE.MathUtils.degToRad;
const q = new URLSearchParams(location.search);
const only = q.get('only')?.split(',');
const pairs = (k) => Object.fromEntries((q.get(k) || '').split(',').filter(Boolean).map((p) => p.split(':')));
const tackWanted = pairs('tack');
const riderWanted = pairs('rider');
const sheet = q.has('sheet');
const ui = { speed: 1, paused: false, all: 'idle', move: q.get('move') === '1' };

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(s.fogColor);
scene.fog = new THREE.Fog(s.fogColor, s.fogNear, s.fogFar);
const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 300);
scene.add(new THREE.HemisphereLight(s.hemiSky, s.hemiGround, s.hemiIntensity));
const sun = new THREE.DirectionalLight(s.sunColor, s.sunIntensity);
sun.position.set(8, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(2048);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun);
// a striped ground (0.25 m bands across the walking direction): a sliding hoof shows against the stripes
const stripes = document.createElement('canvas');
stripes.width = 8; stripes.height = 64;
const sx = stripes.getContext('2d');
sx.fillStyle = '#cdb48a'; sx.fillRect(0, 0, 8, 64);
sx.fillStyle = '#bfa478'; sx.fillRect(0, 0, 8, 32);
const stripeTex = new THREE.CanvasTexture(stripes);
stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
stripeTex.magFilter = THREE.NearestFilter;
stripeTex.colorSpace = THREE.SRGBColorSpace;
stripeTex.repeat.set(1, 60);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: stripeTex }));
ground.receiveShadow = true;
scene.add(ground);
const post = new InkPost(renderer);
const controls = new OrbitControls(camera, renderer.domElement);
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

const lambert = (o) => {
  o.castShadow = o.receiveShadow = true;
  o.frustumCulled = false;
  const m = o.material;
  o.material = new THREE.MeshLambertMaterial({ map: m.map, color: m.color });
};

const animals = []; // { name, info, root, mixer, clips, action, current, tack: {variant: node}, x, rider }

async function loadRider(a, charName, chars) {
  const c = chars[charName];
  if (!c) return;
  const gltf = await loader.loadAsync(c.file);
  const root = gltf.scene;
  const box = new THREE.Box3().setFromObject(root);
  root.scale.multiplyScalar(c.height_m / (box.max.y - box.min.y));
  root.traverse((o) => { if (o.isMesh) lambert(o); });
  const mixer = new THREE.AnimationMixer(root);
  const clip = gltf.animations.find((k) => k.name === 'ride');
  if (!clip) return;
  const act = mixer.clipAction(clip).play();
  act.time = 0;
  mixer.update(0);
  scene.add(root);
  root.updateMatrixWorld(true);
  // seat: the rider's hips joint sits a hand's breadth above the seat (the saddle or cloth top, else the back)
  const hips = root.getObjectByName(findHips(root));
  const hipW = hips.getWorldPosition(new THREE.Vector3());
  const rootW = root.getWorldPosition(new THREE.Vector3());
  const sad = a.info.saddle;
  const variant = a.shownTack;
  const rest = (variant && a.info.tack?.[variant]?.saddle_rest) || sad.rest;
  const seat = new THREE.Vector3(...rest).applyMatrix4(a.root.matrixWorld);
  const lift = 0.09;
  root.position.add(seat.clone().add(new THREE.Vector3(0, lift, 0)).sub(hipW));
  root.updateMatrixWorld(true);
  const bone = a.root.getObjectByName(sad.bone);
  bone.attach(root); // ride with the back
  a.rider = { name: charName, root, mixer, clip, hipsOffset: hipW.clone().sub(rootW) };
}

function findHips(root) {
  let n = 'Hips';
  root.traverse((o) => { if (o.isBone && /Hips$/.test(o.name)) n = o.name; });
  return n;
}

async function load() {
  const reg = await fetch('assets/animals/animals.json').then((r) => r.json());
  const names = Object.keys(reg).filter((n) => n !== 'about' && (!only || only.includes(n)));
  const chars = Object.keys(riderWanted).length ? await fetch('assets/chars/characters.json').then((r) => r.json()) : {};
  let x = 0;
  for (const name of names) {
    const info = reg[name];
    const gltf = await loader.loadAsync(info.file);
    const root = gltf.scene;
    const tack = {};
    root.traverse((o) => {
      if (o.isMesh) lambert(o);
      if (/^tack_/.test(o.name) && !o.isBone) tack[o.name.slice(5)] = o;
    });
    for (const [v, node] of Object.entries(tack)) node.visible = tackWanted[name] === v;
    const w = info.width_m || 0.6;
    x += animals.length ? w / 2 + 0.9 : 0;
    root.position.x = x;
    x += w / 2;
    scene.add(root);
    const a = { name, info, root, x: root.position.x, mixer: new THREE.AnimationMixer(root), clips: gltf.animations, tack, shownTack: tackWanted[name] || null };
    animals.push(a);
    play(name, a.clips.find((k) => k.name === 'idle') ? 'idle' : a.clips[0].name);
    a.mixer.update(0);
    root.updateMatrixWorld(true);
    if (riderWanted[name]) await loadRider(a, riderWanted[name], chars);
  }
  const mid = (animals[0].x + animals[animals.length - 1].x) / 2;
  for (const a of animals) { a.root.position.x -= mid; a.x -= mid; }
}

const byName = (n) => animals.find((a) => a.name === n);
function play(name, clipName) {
  const a = byName(name), clip = a.clips.find((k) => k.name === clipName);
  if (!clip) return false;
  const next = a.mixer.clipAction(clip);
  if (a.action && a.action !== next) { next.reset().play(); a.action.crossFadeTo(next, 0.3, false); } else next.play();
  a.action = next;
  a.current = clipName;
  return true;
}
// freeze an animal (and its rider) at time t of a clip, for frame sheets; with ?move the walk advances the root
function pose(name, clipName, t) {
  const a = byName(name), clip = a.clips.find((k) => k.name === clipName);
  a.mixer.stopAllAction();
  const act = a.mixer.clipAction(clip);
  act.reset().play();
  act.paused = true;
  act.time = Math.min(t, clip.duration - 1e-3);
  a.action = act; a.current = clipName;
  a.mixer.update(0);
  a.root.position.z = ui.move && clipName === 'walk' ? (a.info.walk?.speed_mps || 1) * t - 0.5 : 0;
  if (a.rider) { const r = a.rider.mixer.clipAction(a.rider.clip); r.paused = true; r.time = t % a.rider.clip.duration; a.rider.mixer.update(0); }
  return clip.duration;
}
function focus(name, azDeg = 90, dist = null, height = null) {
  const a = name ? byName(name) : null;
  const L = a ? a.info.length_m : 3;
  const h = height ?? (a ? a.info.back_m * 0.62 : 0.8);
  const target = new THREE.Vector3(a ? a.x : 0, h, a && ui.move && a.current === 'walk' ? 0.1 : 0);
  const d = dist ?? (a ? Math.max(L, a.info.top_m) * 2.6 : Math.max(6, animals.length * 1.6));
  camera.position.set(target.x + Math.sin(deg(azDeg)) * d, h + d * 0.12, target.z + Math.cos(deg(azDeg)) * d);
  controls.target.copy(target);
  controls.update();
}
function setTack(name, variant) {
  const a = byName(name);
  for (const [v, node] of Object.entries(a.tack)) node.visible = v === variant;
  a.shownTack = variant;
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

const timer = new THREE.Timer();
let clock = 0;
function tick(now) {
  timer.update(now);
  const dt = ui.paused ? 0 : Math.min(timer.getDelta(), 0.1) * ui.speed;
  clock += dt;
  for (const a of animals) {
    a.mixer.update(dt);
    if (a.rider) a.rider.mixer.update(dt);
    if (ui.paused) continue; // frozen by pose() for frame sheets
    if (ui.move && a.current === 'walk') a.root.position.z = (((a.info.walk?.speed_mps || 1) * clock) % 8) - 4;
    else a.root.position.z = 0;
  }
  scene.updateMatrixWorld(); // the ink pass leaves world matrices alone (post.js), and the animals move
  post.render(scene, camera, s);
  requestAnimationFrame(tick);
}

try {
  resize();
  await load();
  focus(animals.length === 1 ? animals[0].name : null, 35);
  if (!sheet) {
    const gui = new GUI({ title: 'Animals' });
    gui.add(ui, 'speed', 0, 2, 0.05);
    gui.add(ui, 'paused');
    gui.add(ui, 'move').name('walk moves (stripes)');
    const allClips = [...new Set(animals.flatMap((a) => a.clips.map((k) => k.name)))];
    gui.add(ui, 'all', allClips).name('everyone plays').onChange((n) => animals.forEach((a) => play(a.name, n)));
    for (const a of animals) {
      const f = gui.addFolder(a.name);
      const o = { clip: a.current, tack: a.shownTack || 'none' };
      f.add(o, 'clip', a.clips.map((k) => k.name)).onChange((n) => play(a.name, n));
      f.add(o, 'tack', ['none', ...Object.keys(a.tack)]).onChange((v) => setTack(a.name, v === 'none' ? null : v));
    }
    $('help').textContent = 'Drag to orbit · scroll to zoom · pick a clip and tack per animal · ?rider=donkey:carter seats a rider · ?move=1 walks over stripes';
  } else {
    $('help').remove();
  }
  $('loading').remove();
  const render = () => { scene.updateMatrixWorld(); post.render(scene, camera, s); };
  window.__test = { THREE, renderer, render, names: animals.map((a) => a.name), clips: Object.fromEntries(animals.map((a) => [a.name, a.clips.map((k) => [k.name, k.duration])])), play, pose, focus, setTack, ui, animals };
  requestAnimationFrame(tick);
} catch (err) {
  console.error(err);
  $('loading').textContent = 'Failed to load: ' + err.message;
}
