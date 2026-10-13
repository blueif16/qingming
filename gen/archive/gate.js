// Gate section test page: the walkable gate scene (blender/gate_scene.py), its people (the scroll figures at their
// positions from the scroll map (layout.json), and the painted walkers, all run by people.js from people.json), painted tree
// cards, and load-test options (extra traffic, copies of the section, stand-in buildings). Same renderer, ink post,
// walker and tuning panel as the street B1 page (main.js).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { InkPost } from './post.js';
import { patchSurface, SURFACE_KINDS } from './surface.js';
import { Player } from './player.js';
import { DEFAULTS, loadSettings, buildGui, saveSettings } from './settings.js';
import { loadCharacters, People } from './people.js';
import { FollowCam } from './followcam.js';
import { lightAt, Sky, clock, localHour } from './daylight.js';
import { Sundial } from './sundial.js';
import { trueColor } from './palette.js';
import { setupBackdrop } from './backdrop.js';

const KEY = 'qingming-gate-test-v2'; // v2: true colours and daylight (v1 kept the aged-silk yellow tuning)
// the look of the real town, not of the aged scroll: no warm grade, no paper stains, neutral ink; the light and
// the haze come from the hour (daylight.js), the materials' colours from the palette (palette.js)
const GATE_DEFAULTS = {
  ...DEFAULTS, fogNear: 45, fogFar: 230, crowd: 0, sections: 1, proxy: false, view: 'third', camDistance: 3.2, avatar: 'official',
  warmth: 0, saturation: 1.0, stains: 0, grain: 0.015, vignette: 0.18, inkColor: '#2a2521',
  daylight: true, localTime: true, hour: 10, timeFlow: 0, trueColors: true,
};
const s = loadSettings(KEY, GATE_DEFAULTS);
// the world's time of day is the viewer's own clock; ?hour=18.5&flow=10 (or the panel) sets an hour instead, and how
// fast it runs (game minutes per second)
const query = new URLSearchParams(location.search);
if (query.has('hour')) { s.hour = +query.get('hour'); s.localTime = false; }
if (query.has('flow')) { s.timeFlow = +query.get('flow'); s.localTime = false; }
if (s.localTime) s.hour = localHour();
const moonDate = query.has('date') ? new Date(query.get('date') + 'T12:00') : null; // ?date=2026-10-25: that night's moon
const isTouch = matchMedia('(pointer: coarse)').matches;
const $ = (id) => document.getElementById(id);
const deg = THREE.MathUtils.degToRad;

// ---------------------------------------------------------------- renderer, scene, lights (as main.js)
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
// one shadow map over the whole section (X -46..28, D -12..34)
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 220 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);
const SHADOW_CENTER = new THREE.Vector3(-9, 0, -11);
const sky = new Sky();
scene.add(sky.mesh);
const light = {};
const dial = new Sundial(document.getElementById('dial'));
let backdrop = null; // the painted ring and the mist beyond the painted area (backdrop.js)

// daylight on: sun (or moon), fill, sky and haze from the hour (daylight.js); off: the panel's own sun and colours
function applyLight() {
  sky.mesh.visible = s.daylight;
  lightAt(s.hour, light, moonDate || new Date());
  dial.set(s.hour, light, { local: s.localTime, clockText: clock(s.hour) });
  if (s.daylight) {
    // one shadow-casting light: the sun, or after dark the moon when it is up
    const moon = light.moonIntensity > light.sunIntensity;
    sun.position.copy(SHADOW_CENTER).addScaledVector(moon ? light.moonDir : light.sunDir, 100);
    sun.color.copy(moon ? light.moonColor : light.sunColor);
    sun.intensity = moon ? light.moonIntensity : light.sunIntensity;
    hemi.color.copy(light.hemiSky);
    hemi.groundColor.copy(light.hemiGround);
    hemi.intensity = light.hemiIntensity;
    scene.background.copy(light.horizon);
    scene.fog.color.copy(light.horizon).lerp(light.zenith, 0.12);
    sky.set(light, camera);
  } else {
    const az = deg(s.sunAzimuth), el = deg(s.sunElevation);
    const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    sun.position.copy(SHADOW_CENTER).addScaledVector(dir, 100);
    sun.color.set(s.sunColor);
    sun.intensity = s.sunIntensity;
    hemi.color.set(s.hemiSky);
    hemi.groundColor.set(s.hemiGround);
    hemi.intensity = s.hemiIntensity;
    scene.background.set(s.fogColor);
    scene.fog.color.set(s.fogColor);
  }
  backdrop?.update(scene.fog.color);
  sun.target.position.copy(SHADOW_CENTER);
  sun.castShadow = s.shadows && sun.intensity > 0.01;
  sun.shadow.radius = s.shadowSoftness;
  sun.shadow.camera.updateProjectionMatrix();
  scene.fog.near = s.fogNear;
  scene.fog.far = s.fogFar;
}

// ---------------------------------------------------------------- materials (switchable shading, as main.js)
const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 185, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const shaded = []; // { mesh, std }
const variants = new Map(); // std material -> { mode, mat }: clones of one character share their material
const stdOf = new WeakMap(); // shading variant -> the material it was made from

const SURFACE_OFF = query.get('surface') === '0'; // A/B: ?surface=0 skips surface.js
// the colour a material is drawn with: its true colour (palette.js) unless the panel turns that off
const trueColors = new WeakMap();
function colorOf(std) {
  if (!s.trueColors) return std.color;
  if (!trueColors.has(std)) {
    const c = trueColor(std.name, std.map);
    if (!c) return std.color; // not in the palette, or its texture isn't loaded yet
    trueColors.set(std, c);
  }
  return trueColors.get(std);
}
function makeMaterial(std, mode) {
  if (mode === 'pbr') return std;
  const p = { map: std.map, color: colorOf(std).clone(), side: std.side, transparent: std.transparent, alphaTest: std.alphaTest, name: std.name };
  const kind = SURFACE_OFF ? null : SURFACE_KINDS[std.name]; // world materials only: no swatch may read as repeated tiles
  if (mode === 'toon') return patchSurface(new THREE.MeshToonMaterial({ ...p, gradientMap: toonRamp }), kind);
  if (mode === 'unlit') return patchSurface(new THREE.MeshBasicMaterial(p), kind);
  return patchSurface(new THREE.MeshLambertMaterial(p), kind);
}

function materialFor(std) {
  let v = variants.get(std);
  if (!v || v.mode !== s.shading) {
    if (v && v.mat !== std) v.mat.dispose();
    v = { mode: s.shading, mat: makeMaterial(std, s.shading) };
    variants.set(std, v);
    stdOf.set(v.mat, std);
  }
  return v.mat;
}

function applyShading() {
  for (const it of shaded) it.mesh.material = materialFor(it.std);
}

function applyColors() {
  for (const [std, v] of variants) if (v.mat !== std) v.mat.color.copy(colorOf(std));
}

// ---------------------------------------------------------------- loading
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const player = new Player(camera, renderer.domElement, s);
const post = new InkPost(renderer);
const noNormalPass = [sky.mesh]; // alpha-tested cards would show as rectangles in the normal buffer; the sky is background

let gateScene = null;
const floors = []; // the visible solid meshes: what trees stand on
async function loadGate() {
  const gltf = await loader.loadAsync('assets/gate.glb');
  gateScene = gltf.scene;
  scene.add(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  const colliders = [];
  const v = new THREE.Vector3();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name.includes('hidden__')) {
      o.visible = false; // collider-only geometry: tree trunks, moat banks, the section's edge
    } else {
      o.castShadow = true;
      o.receiveShadow = true;
      shaded.push({ mesh: o, std: o.material });
      if (o.name.endsWith('__col')) floors.push(o);
    }
    if (!o.name.endsWith('__col')) return;
    const src = o.geometry.getAttribute('position');
    const arr = new Float32Array(src.count * 3);
    for (let i = 0; i < src.count; i++) v.fromBufferAttribute(src, i).applyMatrix4(o.matrixWorld).toArray(arr, i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    g.setIndex(o.geometry.index ? Array.from(o.geometry.index.array) : null);
    colliders.push(g);
  });
  player.setCollider(mergeGeometries(colliders));
}

function dropToSupport(x, z, fromY) {
  // the floor under a point: the bridge deck, the office floor, the tower floor
  const ray = new THREE.Ray(new THREE.Vector3(x, fromY, z), new THREE.Vector3(0, -1, 0));
  const hit = player.bvh.raycastFirst(ray, THREE.DoubleSide);
  return hit ? hit.point.y : 0;
}

// the visible floor under a point (ground, deck, wall top), never the hidden colliders: from above, a tree's probe
// lands on the top of its own trunk collider (2.5 m up) and the tree floats
const floorRay = new THREE.Raycaster();
function floorUnder(x, z) {
  floorRay.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0));
  const hit = floorRay.intersectObjects(floors, false)[0];
  return hit ? hit.point.y : 0;
}

// ---------------------------------------------------------------- people (web/src/people.js), trees
// people.json says who each scroll figure is and what they do, and who walks where. Only painted figures appear
// (map/BUILDING.md); load_test_traffic is used by the load-test panel only, never by default.
let people = null, peopleSpec = null, layout = null;
const hooks = {
  scene,
  onMesh: (o) => {
    o.castShadow = o.receiveShadow = true;
    // cull people off screen: a bind-pose bounding sphere padded so sitting, leaning and pointing stay inside it
    if (o.isSkinnedMesh) { o.computeBoundingSphere(); o.boundingSphere.radius *= 1.5; }
    shaded.push({ mesh: o, std: o.material });
    o.material = materialFor(o.material);
  },
  // three rays so the gaps between deck planks don't drop anyone into the moat
  ground: (x, z, fromY) => Math.max(dropToSupport(x, z, fromY), dropToSupport(x + 0.12, z, fromY), dropToSupport(x - 0.12, z, fromY)),
  // is anything solid (a wall, railing, trunk) on the level segment from (x0, z0) to (x1, z1) at height y?
  blocked: (x0, z0, x1, z1, y) => {
    const d = Math.hypot(x1 - x0, z1 - z0);
    const ray = new THREE.Ray(new THREE.Vector3(x0, y, z0), new THREE.Vector3((x1 - x0) / d, 0, (z1 - z0) / d));
    const hit = player.bvh.raycastFirst(ray, THREE.DoubleSide);
    return !!hit && hit.distance <= d;
  },
};

function populate(offsetX) {
  const byId = Object.fromEntries(figureList.map((f) => [f.id, f]));
  const made = [];
  for (const [id, spec] of Object.entries(peopleSpec.figures || {})) if (byId[id]) made.push(people.addFigure(byId[id], spec, offsetX));
  for (const w of peopleSpec.walkers || []) {
    const f = byId[w.figure];
    made.push(people.addWalker({ ...w, startAt: f ? [f.X, f.D] : undefined }, offsetX).p);
  }
  return made;
}

// a path in people.json is [[X, D], ...] or {route: [from, to]}: stations along the mapped road (metres from the
// datum, + east), turned into the road's centre-line points between them
function routePath(route, path) {
  if (Array.isArray(path)) return path;
  const [s0, s1] = path.route, c = route.centre, st = route.stations;
  const at = (s) => {
    let i = 0;
    while (i < st.length - 2 && s > st[i + 1]) i++;
    const t = (s - st[i]) / (st[i + 1] - st[i]);
    return [c[i][0] + t * (c[i + 1][0] - c[i][0]), c[i][1] + t * (c[i + 1][1] - c[i][1])];
  };
  const lo = Math.min(s0, s1), hi = Math.max(s0, s1);
  const pts = [at(lo), ...c.filter((_, i) => st[i] > lo && st[i] < hi), at(hi)];
  return s0 <= s1 ? pts : pts.reverse();
}

function forget(list) {
  people.remove(list);
  for (const p of list) p.root.traverse((o) => { if (o.isMesh) { const i = shaded.findIndex((it) => it.mesh === o); if (i >= 0) shaded.splice(i, 1); } });
}

const willowTex = new THREE.TextureLoader().loadAsync('assets/willow_card.webp'); // loaded before the cards: palette.js reads its mean
function placeTrees(trees, tex) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const H = 8.5;
  const geo = new THREE.PlaneGeometry(H, H);
  geo.translate(0.48, H / 2 - 0.048 * H, 0); // trunk base (u 0.444, v 0.048 in the painting) at the origin
  const std = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, name: 'willow_card' });
  const cards = [];
  for (const { X: x, D: d, scale: k } of trees) {
    const m = new THREE.Mesh(geo, materialFor(std));
    m.position.set(x, floorUnder(x, -d) - 0.05, -d); // ground, or the top of the wall for the trees on it
    m.scale.setScalar(k);
    m.castShadow = true;
    m.receiveShadow = true;
    shaded.push({ mesh: m, std });
    noNormalPass.push(m);
    scene.add(m);
    cards.push(m);
  }
  return cards;
}

// load test: extra traffic on the road (people.json load_test_traffic), spread over the section copies
let extraTraffic = [];
function setCrowd(n) {
  forget(extraTraffic);
  extraTraffic = [];
  if (!n || !peopleSpec.load_test_traffic) return;
  for (let k = 0; k < s.sections; k++) {
    const count = Math.round(n / s.sections) + (k < n % s.sections ? 1 : 0);
    if (count) extraTraffic.push(...people.addTraffic({ ...peopleSpec.load_test_traffic, count, seed: 1000 + k, pairs: 0.25 }, k * SECTION_STEP).map((a) => a.p));
  }
}

// ---------------------------------------------------------------- load test: more sections, real density
// sections: copies of the gate section (structures, trees, its people) side by side along X. proxy: per section,
// stand-in buildings at Messenger's measured density (38 tris/m2 over the section's 74 x 46 m, about 130k
// triangles), made from the B1 street's own buildings, merged per material as the Blender builders do. Neither is
// content: they only load the GPU and CPU like a properly built section would.
const SECTION_STEP = 80;
const extra = { groups: [], proxyParts: null };
let figureList = null, treeList = null;

async function proxyParts() {
  if (extra.proxyParts) return extra.proxyParts;
  const gltf = await loader.loadAsync('assets/street_b1.glb');
  gltf.scene.updateMatrixWorld(true);
  const parts = [];
  const m = new THREE.Matrix4(), place = new THREE.Matrix4();
  gltf.scene.traverse((o) => {
    if (!o.isMesh || /^(earth|paving|hidden)__/.test(o.name)) return;
    const copies = [];
    for (let k = 0; k < 10; k++) {
      // ten B1 streets shrunk into a 5 x 2 grid over the section footprint (keeps triangles, limits overdraw)
      place.compose(new THREE.Vector3(-40 + (k % 5) * 15, 0, -(-4 + Math.floor(k / 5) * 26)),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), new THREE.Vector3(0.45, 0.8, 0.45));
      const g = o.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      // quantized attributes (meshopt) -> float, so the copies merge
      for (const name of ['position', 'normal', 'uv']) {
        const a = g.attributes[name];
        const f = new Float32Array(a.count * a.itemSize);
        for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) f[i * a.itemSize + c] = a.getComponent(i, c);
        g.setAttribute(name, new THREE.BufferAttribute(f, a.itemSize));
      }
      g.applyMatrix4(m.multiplyMatrices(place, o.matrixWorld));
      copies.push(g);
    }
    parts.push({ geometry: mergeGeometries(copies), material: o.material, name: o.name });
  });
  extra.proxyParts = parts;
  return parts;
}

async function setLoad() {
  for (const g of extra.groups) {
    scene.remove(g.group);
    forget(g.people);
    for (const m of g.cards) { scene.remove(m); const i = cards.indexOf(m); if (i >= 0) cards.splice(i, 1); const j = noNormalPass.indexOf(m); if (j >= 0) noNormalPass.splice(j, 1); }
  }
  extra.groups = [];
  const parts = s.proxy ? await proxyParts() : null;
  for (let k = 0; k < s.sections; k++) {
    const group = new THREE.Group();
    group.position.x = k * SECTION_STEP;
    const entry = { group, people: [], cards: [] };
    if (k > 0) {
      const g = gateScene.clone();
      g.traverse((o) => { if (o.isMesh && !o.name.includes('hidden__')) shaded.push({ mesh: o, std: stdOf.get(o.material) || o.material }); });
      group.add(g);
      for (const m of placeTrees(treeList, await willowTex)) { m.position.x += k * SECTION_STEP; entry.cards.push(m); cards.push(m); }
      entry.people = populate(k * SECTION_STEP);
    }
    if (parts) {
      for (const p of parts) {
        const mesh = new THREE.Mesh(p.geometry, materialFor(p.material));
        mesh.castShadow = mesh.receiveShadow = true;
        shaded.push({ mesh, std: p.material });
        group.add(mesh);
      }
    }
    scene.add(group);
    extra.groups.push(entry);
  }
  setCrowd(s.crowd);
}

// ---------------------------------------------------------------- GPU timer (EXT_disjoint_timer_query_webgl2)
const gl = renderer.getContext();
const tq = gl.getExtension('EXT_disjoint_timer_query_webgl2');
const pendingQ = [];
const acc = { frames: 0, time: 0, cpu: 0, anim: 0, gpu: 0, gpuN: 0 };
function gpuPoll() {
  while (pendingQ.length) {
    const q = pendingQ[0];
    if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
    if (!gl.getParameter(tq.GPU_DISJOINT_EXT)) { acc.gpu += gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; acc.gpuN++; }
    gl.deleteQuery(q);
    pendingQ.shift();
  }
}

// ---------------------------------------------------------------- resize, UI
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
  camera.fov = s.fov;
  camera.updateProjectionMatrix();
  if (key === 'shading' || key === '*') applyShading();
  if (key === 'trueColors' || key === '*') applyColors();
  if (key === 'pixelRatioCap' || key === '*') resize();
  if ((key === 'view' || key === '*') && avatar) setView(s.view);
  if ((key === 'avatar' || key === '*') && people) setAvatar(s.avatar);
  if ((key === 'camDistance' || key === '*') && followCam) followCam.distance = s.camDistance;
  if ((key === 'crowd' || key === '*') && people) setCrowd(s.crowd);
  if ((key === 'sections' || key === 'proxy' || key === '*') && people) return setLoad();
}

const gui = buildGui(s, onSettingChange, {}, { title: 'Gate section test — tuning', key: KEY, defaults: GATE_DEFAULTS, street: false });
const load = gui.addFolder('Load test');
load.add(s, 'crowd', 0, 600, 1).name('extra walkers').onChange(() => { saveSettings(s, KEY); onSettingChange('crowd'); });
load.add(s, 'sections', 1, 4, 1).name('gate sections').onChange(() => { saveSettings(s, KEY); onSettingChange('sections'); });
load.add(s, 'proxy').name('stand-in buildings at Messenger density').onChange(() => { saveSettings(s, KEY); onSettingChange('proxy'); });
load.close();
const day = gui.addFolder('Time of day');
day.add(s, 'daylight').name('light from the hour').onChange(() => { saveSettings(s, KEY); onSettingChange('daylight'); });
day.add(s, 'localTime').name('your local time').onChange(() => { if (s.localTime) s.hour = localHour(); saveSettings(s, KEY); onSettingChange('hour'); }).listen();
day.add(s, 'hour', 0, 24, 0.05).name('hour (solar time)').onChange(() => { s.localTime = false; saveSettings(s, KEY); onSettingChange('hour'); }).listen();
day.add(s, 'timeFlow', 0, 120, 1).name('time flow (min per s)').onChange(() => { if (s.timeFlow > 0) s.localTime = false; saveSettings(s, KEY); });
day.add(s, 'trueColors').name('true colours (palette.js)').onChange(() => { saveSettings(s, KEY); onSettingChange('trueColors'); });
day.open();
const you = gui.addFolder('You');
const ch = (k) => () => { saveSettings(s, KEY); onSettingChange(k); };
you.add(s, 'view', { 'third person (Messenger)': 'third', 'first person': 'first' }).name('view (V)').onChange(ch('view')).listen();
you.add(s, 'camDistance', 1.4, 7, 0.1).name('camera distance (wheel)').onChange(ch('camDistance')).listen();
addEventListener('keydown', (e) => {
  if (e.code === 'KeyH') gui._hidden ? gui.show() : gui.hide();
  if (e.code === 'KeyV') { s.view = s.view === 'first' ? 'third' : 'first'; saveSettings(s, KEY); onSettingChange('view'); }
});
document.addEventListener('pointerlockchange', () => {
  $('crosshair').style.display = document.pointerLockElement ? 'block' : 'none';
});
$('help').innerHTML = isTouch
  ? 'Left thumb: walk · Right thumb: look · Panel top-right: tuning'
  : 'Click to walk · WASD / arrows · Shift run · mouse look · wheel zoom · V first / third person · Esc release mouse · H hide panel';

// ---------------------------------------------------------------- the player's body and view
// third person (Messenger): FollowCam behind your own character. first person: the camera at the eyes, your body
// still there below it (its head bone collapsed so the camera isn't inside it), without its shadow.
let avatar = null, avatarYaw = 0, followCam = null;
function setAvatar(name) {
  if (avatar) {
    scene.remove(avatar.root);
    avatar.mixer.stopAllAction();
    avatar.root.traverse((o) => { if (o.isMesh) { const i = shaded.findIndex((it) => it.mesh === o); if (i >= 0) shaded.splice(i, 1); } });
  }
  avatar = people.createPerson(people.models[name] ? name : 'sightseer');
  avatar.root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  avatar.head = null;
  avatar.root.traverse((o) => { if (!avatar.head && o.isBone && /Head$/.test(o.name)) avatar.head = o; });
  avatar.play('idle', { fade: 0 });
  setView(s.view);
}
function setView(mode) {
  player.mode = mode === 'first' ? 'first' : 'third';
  player.pitch = THREE.MathUtils.clamp(player.pitch, ...player.pitchRange());
  if (!avatar) return;
  avatar.head?.scale.setScalar(player.mode === 'first' ? 0.001 : 1);
  avatar.root.traverse((o) => { if (o.isMesh) o.castShadow = player.mode === 'third'; });
}
const turnTo = (cur, target, step) => cur + THREE.MathUtils.clamp(((target - cur + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI, -step, step);
function updateAvatar(dt) {
  const v = player.velocity;
  let speed = Math.hypot(v.x, v.z);
  const first = player.mode === 'first';
  // a teleport (view(), tools): face the way the camera looks instead of turning round from the old spot
  if (avatar.root.position.distanceTo(player.pos) > 1.0) { avatarYaw = player.yaw + Math.PI; speed = 0; }
  // facing: where you move (third person), where you look (first person)
  if (first) avatarYaw = player.yaw + Math.PI;
  else if (speed > 0.3) avatarYaw = turnTo(avatarYaw, Math.atan2(v.x, v.z), dt * 10);
  avatar.root.rotation.y = avatarYaw;
  avatar.root.position.copy(player.pos);
  if (first) avatar.root.position.add(new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).multiplyScalar(0.22));
  const want = speed < 0.3 ? 'idle' : player.running && speed > 2.8 ? 'run' : 'walk';
  if (want !== avatar.clip) avatar.play(want, { fade: 0.25 });
  if (want !== 'idle') {
    const stride = avatar.model.clips.find((c) => c.name === want)?.userData.stride || 1.45;
    avatar.action.timeScale = THREE.MathUtils.clamp(speed / stride, 0.6, 2);
  }
  avatar.mixer.update(dt);
}
addEventListener('wheel', (e) => {
  if (player.mode !== 'third') return;
  s.camDistance = THREE.MathUtils.clamp(s.camDistance * (e.deltaY > 0 ? 1.1 : 0.9), 1.4, 7);
  if (followCam) followCam.distance = s.camDistance;
}, { passive: true });

// ---------------------------------------------------------------- main loop
const timer = new THREE.Timer();
let cards = [], measuring = null;

function tick(now) {
  const t0 = performance.now();
  timer.update(now);
  const dt = Math.min(timer.getDelta(), 0.1);
  player.update(dt / 2);
  player.update(dt / 2);
  if (avatar) updateAvatar(dt);
  if (player.mode === 'third' && followCam) followCam.update(dt);
  const ta = performance.now();
  people.update(dt);
  acc.anim += performance.now() - ta;
  for (const m of cards) m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
  if (s.localTime) {
    const h = localHour(); // the light follows the clock in 10-second steps
    if (Math.abs(h - s.hour) > 1 / 360) { s.hour = h; applyLight(); }
  } else if (s.timeFlow > 0) {
    s.hour = (s.hour + (dt * s.timeFlow) / 60) % 24;
    applyLight();
  }
  sky.mesh.position.copy(camera.position);
  renderer.info.reset();
  let q = null;
  if (tq) { q = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, q); }
  post.render(scene, camera, s, noNormalPass);
  if (q) { gl.endQuery(tq.TIME_ELAPSED_EXT); pendingQ.push(q); gpuPoll(); }
  acc.cpu += performance.now() - t0;
  acc.frames++;
  acc.time += dt;

  if (acc.time > (measuring ? measuring.seconds : 0.5)) {
    const info = renderer.info.render;
    const r = {
      fps: acc.frames / acc.time, cpuMs: acc.cpu / acc.frames, animMs: acc.anim / acc.frames, gpuMs: acc.gpuN ? acc.gpu / acc.gpuN : null,
      calls: info.calls, tris: info.triangles, people: people.all.length, dpr: renderer.getPixelRatio(),
    };
    $('stats').textContent = `${Math.round(r.fps)} fps · cpu ${r.cpuMs.toFixed(2)} ms (anim ${r.animMs.toFixed(2)}) · gpu ${r.gpuMs == null ? '–' : r.gpuMs.toFixed(2) + ' ms'}`
      + ` · ${r.calls} draw calls · ${(r.tris / 1000).toFixed(1)}k tris (all passes) · ${r.people} people · dpr ${r.dpr.toFixed(2)}`;
    if (measuring) { measuring.resolve(r); measuring = null; }
    Object.assign(acc, { frames: 0, time: 0, cpu: 0, anim: 0, gpu: 0, gpuN: 0 });
  }
  requestAnimationFrame(tick);
}

// average over `seconds` of frames, starting at the next stats window (for tools/bench_page.mjs)
function measure(seconds = 3) {
  return new Promise((resolve) => {
    Object.assign(acc, { frames: 0, time: 0, cpu: 0, anim: 0, gpu: 0, gpuN: 0 });
    measuring = { seconds, resolve };
  });
}

// stand at a named view from scene.json (facing_deg 0 = +X, 90 = north; the walker's yaw 0 looks down -z)
function view(name) {
  const v = layout.views[name] || layout.spawn;
  player.pos.set(v.X, (v.H || 0) + 0.2, -v.D);
  player.vel.set(0, 0, 0);
  player.yaw = deg(v.facing_deg) - Math.PI / 2;
  player.pitch = deg(v.pitch_deg || 0);
  if (player.mode === 'third' && !v.pitch_deg) player.pitch = -0.2; // look down on yourself a little, as Messenger does
  avatarYaw = player.yaw + Math.PI;
}

try {
  applyLight();
  resize();
  const [, models, mapLayout, sceneJson, peopleJson] = await Promise.all([
    loadGate(),
    loadCharacters(loader),
    fetch('assets/gate/layout.json').then((r) => r.json()),
    fetch('assets/gate/scene.json').then((r) => r.json()),
    fetch('assets/gate/people.json').then((r) => r.json()),
  ]);
  layout = sceneJson;
  peopleSpec = peopleJson;
  // positions come from the scroll map (layout.json): figures, trees, and paths given as stations on the road
  figureList = mapLayout.figures;
  treeList = mapLayout.trees;
  for (const w of peopleSpec.walkers || []) w.path = routePath(mapLayout.route, w.path);
  if (peopleSpec.load_test_traffic) peopleSpec.load_test_traffic.path = routePath(mapLayout.route, peopleSpec.load_test_traffic.path);
  people = new People(models, hooks);
  people.player = player.pos;
  people.camera = camera;
  player.pushOut = (pos, r) => people.pushOut(pos, r);
  populate(0);
  followCam = new FollowCam(camera, player, { distance: s.camDistance });
  if (!models[s.avatar]) s.avatar = 'sightseer';
  you.add(s, 'avatar', Object.keys(models).sort()).name('your character').onChange(ch('avatar'));
  setAvatar(s.avatar);
  cards = placeTrees(treeList, await willowTex);
  // beyond the walkable area: mist and the painted ring (backdrop.js); the floor's hole is the ground mesh's extent
  const groundMesh = gateScene.getObjectByName('g_ground__col');
  const gb = groundMesh ? new THREE.Box3().setFromObject(groundMesh) : null;
  const backdropCfg = await fetch('assets/gate/backdrop.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (backdropCfg) {
    backdrop = await setupBackdrop(scene, post, mapLayout, backdropCfg,
      { extent: gb && { x0: gb.min.x, x1: gb.max.x, y0: -gb.max.z, y1: -gb.min.z } });
    noNormalPass.push(...backdrop.meshes);
    applyLight();
  }
  await setLoad();
  view('spawn');
  applyShading();
  $('loading').remove();
  window.__test = {
    THREE, scene, camera, player, people, s, renderer, measure, view, views: Object.keys(layout.views || {}),
    followCam, get avatar() { return avatar; },
    set: (k, v) => { s[k] = v; if (k === 'hour' || k === 'timeFlow') s.localTime = false; return onSettingChange(k); },
    gpuTimer: !!tq,
  };
  requestAnimationFrame(tick);
} catch (err) {
  console.error(err);
  $('loading').textContent = 'Failed to load: ' + err.message;
}
