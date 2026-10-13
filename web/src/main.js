// Street B1 test page: the rebuilt street slice, two Meshy characters, first-person walking,
// ink-on-silk post-processing, a tuning panel and a reference view against the B1 target frame.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { InkPost } from './post.js';
import { Player } from './player.js';
import { loadSettings, buildGui } from './settings.js';

const s = loadSettings();
const isTouch = matchMedia('(pointer: coarse)').matches;
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- renderer, scene, lights
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.info.autoReset = false;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(s.fogColor);
scene.fog = new THREE.Fog(s.fogColor, s.fogNear, s.fogFar);
const camera = new THREE.PerspectiveCamera(s.fov, innerWidth / innerHeight, 0.1, 300);

const hemi = new THREE.HemisphereLight(s.hemiSky, s.hemiGround, s.hemiIntensity);
const sun = new THREE.DirectionalLight(s.sunColor, s.sunIntensity);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(isTouch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 30, bottom: -30, near: 1, far: 160 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);
const SHADOW_CENTER = new THREE.Vector3(0, 0, -14);

function applyLight() {
  const az = THREE.MathUtils.degToRad(s.sunAzimuth), el = THREE.MathUtils.degToRad(s.sunElevation);
  const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  sun.position.copy(SHADOW_CENTER).addScaledVector(dir, 70);
  sun.target.position.copy(SHADOW_CENTER);
  sun.color.set(s.sunColor);
  sun.intensity = s.sunIntensity;
  sun.castShadow = s.shadows;
  sun.shadow.radius = s.shadowSoftness;
  sun.shadow.camera.updateProjectionMatrix();
  hemi.color.set(s.hemiSky);
  hemi.groundColor.set(s.hemiGround);
  hemi.intensity = s.hemiIntensity;
  scene.background.set(s.fogColor);
  scene.fog.color.set(s.fogColor);
  scene.fog.near = s.fogNear;
  scene.fog.far = s.fogFar;
}

// ---------------------------------------------------------------- materials (switchable shading)
const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 185, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const shaded = []; // { mesh, std } — std is the material the GLB came with

function makeMaterial(std, mode) {
  if (mode === 'pbr') return std;
  const p = { map: std.map, color: std.color, side: std.side, transparent: std.transparent, alphaTest: std.alphaTest, name: std.name };
  if (mode === 'toon') return new THREE.MeshToonMaterial({ ...p, gradientMap: toonRamp });
  if (mode === 'unlit') return new THREE.MeshBasicMaterial(p);
  return new THREE.MeshLambertMaterial(p);
}

function applyShading() {
  for (const it of shaded) {
    const old = it.mesh.material;
    it.mesh.material = makeMaterial(it.std, s.shading);
    if (old !== it.std) old.dispose();
  }
}

// ---------------------------------------------------------------- loading
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const player = new Player(camera, renderer.domElement, s);
const post = new InkPost(renderer);
let refPose = null;

async function loadStreet() {
  const gltf = await loader.loadAsync('assets/street_b1.glb');
  scene.add(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  const colliders = [];
  const v = new THREE.Vector3();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name.startsWith('hidden__')) {
      o.visible = false; // collider-only geometry (e.g. the willow trunk)
    } else {
      o.castShadow = true;
      o.receiveShadow = true;
      shaded.push({ mesh: o, std: o.material });
    }
    if (!o.name.endsWith('__col')) return;
    // positions may be quantized (meshopt); bake them to float world space for the collider
    const src = o.geometry.getAttribute('position');
    const arr = new Float32Array(src.count * 3);
    for (let i = 0; i < src.count; i++) v.fromBufferAttribute(src, i).applyMatrix4(o.matrixWorld).toArray(arr, i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    g.setIndex(o.geometry.index ? Array.from(o.geometry.index.array) : null);
    colliders.push(g);
  });
  player.setCollider(mergeGeometries(colliders));
  const cam = gltf.cameras?.[0];
  if (cam) {
    cam.updateMatrixWorld(true);
    refPose = { position: cam.getWorldPosition(new THREE.Vector3()), quaternion: cam.getWorldQuaternion(new THREE.Quaternion()), fov: cam.fov };
  } else {
    refPose = { position: new THREE.Vector3(0, 1.6, 1), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(1.5), 0, 0)), fov: 46 };
  }
}

function inPlace(clip) {
  // keep the root bone's vertical bob but drop any forward drift, so path code owns movement
  for (const t of clip.tracks) {
    if (!/Hips\.position$/.test(t.name)) continue;
    const v = t.values;
    for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
  }
}

async function loadCharacter(url, height) {
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false;
    shaded.push({ mesh: o, std: o.material });
  });
  const box = new THREE.Box3().setFromObject(root);
  const h = box.max.y - box.min.y;
  if (h > 0.3) root.scale.multiplyScalar(height / h);
  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  for (const clip of gltf.animations) {
    inPlace(clip);
    actions[clip.name] = mixer.clipAction(clip);
  }
  scene.add(root);
  return { root, mixer, actions, current: null, name: url };
}

function play(ch, name, fade = 0.35) {
  const a = ch.actions[name];
  if (!a || ch.current === a) return;
  a.reset().fadeIn(fade).play();
  ch.current?.fadeOut(fade);
  ch.current = a;
}

// ---------------------------------------------------------------- willow: painted card(s) or Meshy 3D
const WILLOW_POS = new THREE.Vector3(-3.75, 0.15, -9.5);
const willow = { group: new THREE.Group(), billboard: null, meshy: null };
willow.group.position.copy(WILLOW_POS);
scene.add(willow.group);
const noNormalPass = []; // alpha-tested cards would show as rectangles in the normal buffer

function willowCards(count) {
  const tex = new THREE.TextureLoader().load('assets/willow_card.webp');
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const H = 8.5;
  const geo = new THREE.PlaneGeometry(H, H);
  geo.translate(0.48, H / 2 - 0.048 * H, 0); // trunk base (u 0.444, v 0.048 in the painting) at the origin
  const std = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, std);
    m.rotation.y = (i * Math.PI) / count;
    m.castShadow = true;
    m.receiveShadow = true;
    shaded.push({ mesh: m, std });
    noNormalPass.push(m);
    group.add(m);
  }
  return group;
}

async function setWillow() {
  willow.group.clear();
  willow.billboard = null;
  if (s.willowMode === 'billboard') {
    willow.billboard = willowCards(1);
    willow.group.add(willow.billboard);
  } else if (s.willowMode === 'cross') {
    willow.group.add(willowCards(3));
  } else if (s.willowMode === 'meshy') {
    if (!willow.meshy) {
      try {
        const g = await loader.loadAsync('assets/willow_meshy.glb');
        willow.meshy = g.scene;
        const box = new THREE.Box3().setFromObject(willow.meshy);
        willow.meshy.scale.multiplyScalar(8.0 / (box.max.y - box.min.y));
        willow.meshy.position.y = -box.min.y * willow.meshy.scale.y;
        willow.meshy.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; shaded.push({ mesh: o, std: o.material }); } });
        applyShading();
      } catch (e) {
        console.warn('Meshy willow not available yet', e);
        return;
      }
    }
    willow.group.add(willow.meshy);
  }
  applyShading();
}

// ---------------------------------------------------------------- characters' behaviour
const PORTER_A = new THREE.Vector3(-1.5, 0, -3);
const PORTER_B = new THREE.Vector3(-1.5, 0, -24);
const porterState = { t: 0.08, dir: 1, yaw: Math.PI };
const TOWNSMAN_SPOT = new THREE.Vector3(3.5, 0.15, -7.5);
const townsmanState = { clock: 0, step: 0 };
const TOWNSMAN_CYCLE = [['idle', 6], ['talk', 8], ['look', 11.3]];

function updatePorter(ch, dt) {
  const clip = s.porterClip;
  if (clip === 'idle') {
    play(ch, 'idle');
  } else {
    play(ch, clip);
    const mult = clip === 'run' ? 2.4 : clip === 'carry' ? 0.8 : 1;
    const speed = s.porterSpeed * mult;
    ch.actions[clip].timeScale = Math.max(0.05, s.porterSpeed / 1.25);
    const len = PORTER_A.distanceTo(PORTER_B);
    porterState.t += (porterState.dir * speed * dt) / len;
    if (porterState.t > 1 || porterState.t < 0) {
      porterState.t = THREE.MathUtils.clamp(porterState.t, 0, 1);
      porterState.dir *= -1;
    }
  }
  ch.root.position.lerpVectors(PORTER_A, PORTER_B, porterState.t);
  const targetYaw = porterState.dir > 0 ? Math.PI : 0; // the rig faces +Z; walking towards -Z means turning around
  porterState.yaw += Math.atan2(Math.sin(targetYaw - porterState.yaw), Math.cos(targetYaw - porterState.yaw)) * Math.min(1, dt * 4);
  ch.root.rotation.y = porterState.yaw;
}

function updateTownsman(ch, dt) {
  ch.root.position.copy(TOWNSMAN_SPOT);
  ch.root.rotation.y = -Math.PI / 2; // face the street
  if (s.townsmanClip !== 'cycle') { play(ch, s.townsmanClip); return; }
  townsmanState.clock += dt;
  const [name, dur] = TOWNSMAN_CYCLE[townsmanState.step];
  play(ch, name);
  if (townsmanState.clock > dur) { townsmanState.clock = 0; townsmanState.step = (townsmanState.step + 1) % TOWNSMAN_CYCLE.length; }
}

// ---------------------------------------------------------------- reference view, resize, UI
const refImg = $('ref');
let refMode = false;
function toggleRef() {
  if (!refPose) return;
  refMode = !refMode;
  player.frozen = refMode;
  if (refMode) {
    document.exitPointerLock?.();
    camera.position.copy(refPose.position);
    camera.quaternion.copy(refPose.quaternion);
    camera.fov = refPose.fov;
  } else {
    camera.fov = s.fov;
  }
  camera.updateProjectionMatrix();
  refImg.style.display = refMode ? 'block' : 'none';
}

function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, s.pixelRatioCap));
  renderer.setSize(innerWidth, innerHeight);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  post.setSize(size.x, size.y);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

function onSettingChange(key) {
  applyLight();
  if (!refMode) { camera.fov = s.fov; camera.updateProjectionMatrix(); }
  if (key === 'shading' || key === '*') applyShading();
  if (key === 'pixelRatioCap' || key === '*') resize();
  if (key === 'willowMode' || key === '*') setWillow();
  refImg.style.opacity = s.refOpacity;
}

const gui = buildGui(s, onSettingChange, { toggleRef });
addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') toggleRef();
  if (e.code === 'KeyH') gui._hidden ? gui.show() : gui.hide();
});
document.addEventListener('pointerlockchange', () => {
  $('crosshair').style.display = document.pointerLockElement ? 'block' : 'none';
});
$('help').innerHTML = isTouch
  ? 'Left thumb: walk · Right thumb: look · Panel top-right: tuning'
  : 'Click to walk · WASD / arrows · Shift run · mouse look · Esc release mouse<br>R reference view (B1 overlay) · H hide panel';

// ---------------------------------------------------------------- main loop
const timer = new THREE.Timer();
let porter = null, townsman = null, frames = 0, fpsTime = 0;

function tick(now) {
  timer.update(now);
  const dt = Math.min(timer.getDelta(), 0.1);
  player.update(dt / 2);
  player.update(dt / 2);
  if (porter) { updatePorter(porter, dt); porter.mixer.update(dt); }
  if (townsman) { updateTownsman(townsman, dt); townsman.mixer.update(dt); }
  if (willow.billboard) willow.billboard.rotation.y = Math.atan2(camera.position.x - WILLOW_POS.x, camera.position.z - WILLOW_POS.z);
  renderer.info.reset();
  post.render(scene, camera, s, noNormalPass);

  frames++;
  fpsTime += dt;
  if (fpsTime > 0.5) {
    const info = renderer.info.render;
    $('stats').textContent = `${Math.round(frames / fpsTime)} fps · ${info.calls} draw calls · ${(info.triangles / 1000).toFixed(1)}k tris (all passes)`
      + ` · dpr ${renderer.getPixelRatio().toFixed(2)}${refMode ? ' · REFERENCE VIEW' : ''}`;
    frames = 0;
    fpsTime = 0;
  }
  requestAnimationFrame(tick);
}

try {
  applyLight();
  resize();
  refImg.style.opacity = s.refOpacity;
  await loadStreet();
  await setWillow();
  [porter, townsman] = await Promise.all([loadCharacter('assets/porter.glb', 1.68), loadCharacter('assets/townsman.glb', 1.72)]);
  applyShading();
  $('loading').remove();
  window.__test = { scene, camera, player, porter, townsman, s, toggleRef, renderer, set: (k, v) => { s[k] = v; onSettingChange(k); } }; // for automated checks
  requestAnimationFrame(tick);
} catch (err) {
  console.error(err);
  $('loading').textContent = 'Failed to load: ' + err.message;
}
