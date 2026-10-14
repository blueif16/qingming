// The walkable world: any set of built scroll sections, joined in their one shared frame (map/README.md, Frames),
// with their painted people and tree cards, mist and painted panels beyond the outer edges, and the player.
//   world.html?sections=inner_city,gate,outer_road   (gate.html is this page with ?sections=gate)
//   &spawn=<view>  a camera spot from any section's scene.json (default: the body's data-spawn when the page lists its
//                  own sections, else the first section's spawn)
//   &window=<n>    how many sections either side of yours stay loaded (default 1; 0 = yours only; all = everything)
// Each section ships assets/<name>.glb (its Blender builder, tools/export_web_scene.mjs) and assets/<name>/
// layout.json, people.json, scene.json, backdrop.json. Joining: the walls on a seam between two loaded sections
// come down (each builder makes one wall per side, g_edge_<side>_hidden__col), the walkable area is the union, and a
// panel stands only beyond an outer edge (backdrop.js). Sizes (the user, 2026-10-11: "mind the sizings and do
// optimizations for both quality and sizing"): every material is shared by name across sections (one GPU texture
// per kit swatch); people pose less often far away and off screen (people.js); the shadow map follows you instead of
// covering the whole world.
// Streaming (the scroll is seven sections, too much for a phone at once): only the sections near you are loaded,
// yours and `window` either side (see "the streaming window"). A section loads before you can reach its seam and is
// disposed once you are far enough past it, with everything only it used: its geometry, materials, colliders,
// walls, people and animals, trees and panels. Shared things (the kit's textures, characters and animals, tree
// cards) are counted by who uses them and go when nobody does. A seam to an unloaded neighbour is an outer edge:
// its wall stands, and mist and the neighbour's painted panel cover it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { InkPost } from './post.js';
import { Tiers } from './tiers.js';
import { applyDetail, detailStats } from './detail.js';
import { patchSurface, SURFACE_KINDS } from './surface.js';
import { Player } from './player.js';
import { DEFAULTS, loadSettings, buildGui, saveSettings } from './settings.js';
import { loadCharacters, loadClips, People, CLIP_META } from './people.js';
import { castClips, trafficClips, LATE_CLIPS } from './cast_clips.js';
import { FollowCam } from './followcam.js';
import { lightAt, Sky, localHour } from './daylight.js';
import { TimeScroll } from './ui/time.js';
import { PACES, paceOf, hourWords } from './ui/time_words.js';
import { trueColor } from './palette.js';
import { setupBackdrop, walkableBoxes } from './backdrop.js';
import { trackGpuMemory } from './gpumem.js';
import { TextureCache, sharedTexturePlugin } from './assets.js';
import { ScrollHud } from './scroll_hud.js';
import { Boats } from './boats.js';
import { Cells } from './cells.js';
import { createAmbient } from './ambient.js';
import { Trees3D, trunkColliders } from './trees3d.js';
import { Sound } from './sound.js';
import { createUI } from './ui/index.js';
import { waitForStart } from './ui/start.js';

const query = new URLSearchParams(location.search);
const NAMES = (query.get('sections') || document.body.dataset.sections || 'gate').split(',').map((x) => x.trim()).filter(Boolean);
const MIST_WALK = query.get('mistwalk') !== '0'; // ?mistwalk=0: the mist from the raw painted area (as before), for A/B
const KEY = 'qingming-gate-test-v2'; // the tuning panel's saved settings (shared with the gate page it grew from)
// the look of the real town, not of the aged scroll: no warm grade, no paper stains, neutral ink; the light and
// the haze come from the hour (daylight.js), the materials' colours from the palette (palette.js)
const WORLD_DEFAULTS = {
  ...DEFAULTS, fogNear: 45, fogFar: 230, crowd: 0, view: 'third', camDistance: 3.2, avatar: 'official',
  warmth: 0, saturation: 1.0, stains: 0, grain: 0.015, vignette: 0.18, inkColor: '#2a2521',
  daylight: true, localTime: true, hour: 10, timeFlow: 0, trueColors: true,
  shading: 'toon', // stepped (分階) by default (the user, 2026-10-13)
  quality: 'auto', // the device tier (tiers.js): auto | low | mid | high
  boats: 'auto', // the river's boats (boatMode below): auto | moored | painted | waves
  v: 2, // the saved settings' version (below)
};
const s = loadSettings(KEY, WORLD_DEFAULTS);
// the page saves every key whenever one changes, so a new default would never reach a returning visitor: each version
// puts its new defaults over the saved copy once, and choices made after that stay (v2, 2026-10-13: stepped shading,
// true colours)
if (!(s.v >= 2)) { s.shading = 'toon'; s.trueColors = true; s.v = 2; }
// the world's time of day is the viewer's own clock; ?hour=18.5&flow=10 (or the panel) sets an hour instead, and how
// fast it runs (game minutes per second). Every visit starts on the viewer's own clock: an hour set with the time
// instrument holds only for that visit (lead, 2026-10-12; the standing rule that the world's hour is the viewer's).
s.localTime = true; s.timeFlow = 0;
if (query.has('hour')) { s.hour = +query.get('hour'); s.localTime = false; }
if (query.has('flow')) { s.timeFlow = +query.get('flow'); s.localTime = false; }
if (s.localTime) s.hour = localHour();
const moonDate = query.has('date') ? new Date(query.get('date') + 'T12:00') : null; // ?date=2026-10-25: that night's moon
const isTouch = matchMedia('(pointer: coarse)').matches;
const $ = (id) => document.getElementById(id);
const deg = THREE.MathUtils.degToRad;

// ---------------------------------------------------------------- renderer, scene, lights
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.info.autoReset = false;
document.body.appendChild(renderer.domElement);
// the device tier (tiers.js): render scale, anti-aliasing, the colour target, shadows and the streaming window by
// device; ?tier=low|mid|high, ?adapt=0 (no adaptive resolution), ?mrt=0 (the separate normal pass, for A/B)
const MRT = query.get('mrt') !== '0';
const tiers = new Tiers({ gl: renderer.getContext(), settings: s, query, onChange: (cfg) => applyTier(cfg), onDetail: applyDetail });
applyDetail(tiers.cfg, tiers.detailScale); // the detail systems (detail.js) read the tier's numbers as they register
const gpuMem = query.get('gpumem') === '1' ? trackGpuMemory(renderer.getContext()) : null; // ?gpumem=1: count GPU bytes (gpumem.js)

const scene = new THREE.Scene();
scene.background = new THREE.Color(s.fogColor);
scene.fog = new THREE.Fog(s.fogColor, s.fogNear, s.fogFar);
const camera = new THREE.PerspectiveCamera(s.fov, innerWidth / innerHeight, 0.1, 300);

const hemi = new THREE.HemisphereLight(s.hemiSky, s.hemiGround, s.hemiIntensity);
const sun = new THREE.DirectionalLight(s.sunColor, s.sunIntensity);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(tiers.cfg.shadow.size); // 1024 on touch screens and the low tier
// the shadow map follows you along the joined world, snapped to its texels so shadows don't shimmer as you walk. Its box
// and how often it is redrawn are the tier's (tiers.js shadow; placeSun, shadowPolicy): high, 96 x 96 m round you, its
// centre snapped to 1 m, the people every frame; mid and low, a smaller box pushed ahead of where you look, its centre
// snapped to 1-2 m, the people (and boats) 20 or 15 times a second. The world's own layer is redrawn only when that
// centre or the sun moves (shadowLayers: the people's redraws draw over a kept copy of it)
let SHADOW_HALF = tiers.cfg.shadow.half;
Object.assign(sun.shadow.camera, { left: -SHADOW_HALF, right: SHADOW_HALF, top: SHADOW_HALF, bottom: -SHADOW_HALF, near: 1, far: 220 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);
const shadowCenter = new THREE.Vector3();
const sunDir = new THREE.Vector3(0, 1, 0);
const sky = new Sky();
scene.add(sky.mesh);
const light = {};
// the hour, as the UI sets it (gen/ui/r2_time.md "The time contract"): the time instrument in #dial (ui/time.js) and
// the settings screen go through this object, never through `s` directly. A set hour is applied once per frame
// (tick), however fast a finger drags; a jump in time is not a passing hour, so the sound's hour events (the dusk drum,
// the watches) never fire in a burst while you scrub (sound.lastHour follows the jump).
let timeDirty = false, scrubbing = false;
const timeCost = { ms: 0, n: 0 }; // what re-lighting costs (applyLight and the instrument), for gen/ui/shots/time_cost.mjs
const timeListeners = new Set();
const time = {
  get: () => ({ hour: s.hour, local: s.localTime, flow: paceOf(s.timeFlow, s.localTime), scrubbing, ...hourWords(s.hour), night: light.night ?? 0 }),
  setHour(h, { scrub = false } = {}) {
    if (s.localTime) { s.localTime = false; s.timeFlow = 0; } // leaving your clock holds the hour (靜)
    s.hour = ((h % 24) + 24) % 24;
    scrubbing = scrub;
    timeJumped();
    if (!scrub) saveSettings(s, KEY);
  },
  setFlow(step) {
    if (step === '今') return time.toLocal();
    s.localTime = false;
    s.timeFlow = PACES[step] ?? 0;
    saveSettings(s, KEY);
    timeJumped();
  },
  toLocal() {
    s.localTime = true;
    s.hour = localHour();
    scrubbing = false;
    saveSettings(s, KEY);
    timeJumped();
  },
  on(fn) { timeListeners.add(fn); return () => timeListeners.delete(fn); },
  cost: (reset = false) => { const r = { msPerLight: timeCost.n ? timeCost.ms / timeCost.n : 0, lights: timeCost.n }; if (reset) timeCost.ms = timeCost.n = 0; return r; }, // the checks
};
function timeJumped() {
  timeDirty = true;
  try { if (sound) sound.lastHour = s.hour; } catch { /* sound not made yet */ }
  for (const fn of timeListeners) { try { fn(time.get()); } catch (err) { console.error(err); } }
}
const dial = new TimeScroll(document.getElementById('dial'), { time, blocked: () => { try { return hud.open; } catch { return true; } }, date: moonDate || undefined });
let backdrop = null; // the painted ring and the mist beyond the painted area (backdrop.js)

function placeSun() {
  const sh = tiers.cfg.shadow;
  if (sh.half !== SHADOW_HALF) {
    SHADOW_HALF = sh.half;
    Object.assign(sun.shadow.camera, { left: -SHADOW_HALF, right: SHADOW_HALF, top: SHADOW_HALF, bottom: -SHADOW_HALF });
    sun.shadow.camera.updateProjectionMatrix();
    shadowState.dirty = true;
  }
  const texel = (2 * SHADOW_HALF) / sun.shadow.mapSize.x;
  const step = sh.snap ? Math.max(1, Math.round(sh.snap / texel)) * texel : texel; // whole texels, so nothing shimmers
  const snap = (v) => Math.round(v / step) * step;
  // ahead of where you look (on the ground): what you see near you stays inside a smaller box
  const ax = -Math.sin(player.yaw) * sh.ahead, az = -Math.cos(player.yaw) * sh.ahead;
  shadowCenter.set(snap(player.pos.x + ax), 0, snap(player.pos.z + az));
  sun.position.copy(shadowCenter).addScaledVector(sunDir, 100);
  sun.target.position.copy(shadowCenter);
}
// redraw the shadow map this frame? Its snapped centre or the sun moved, something asked (a section came or went, the
// shadows were switched on), or the people's (and boats') turn came: every frame on high, 20 Hz on mid, 15 Hz on low.
// Between redraws the map and the matrix it was drawn with stay together, so nothing slides.
const shadowState = { dirty: true, age: Infinity, x: NaN, z: NaN, sx: NaN, sy: NaN, sz: NaN, redraws: 0, frames: 0 };
function shadowPolicy(dt) {
  const st = shadowState, hz = tiers.cfg.shadow.peopleHz;
  st.age += dt;
  st.frames++;
  const moved = shadowCenter.x !== st.x || shadowCenter.z !== st.z || sunDir.x !== st.sx || sunDir.y !== st.sy || sunDir.z !== st.sz;
  const turn = !(hz < Infinity) || st.age >= 1 / hz - 1e-4, redraw = st.dirty || moved || turn;
  // the world's layer too (the people's turn alone redraws only the movers); the tree cards are in it and turn to the
  // camera, so a people's turn also redraws it once the camera has gone CARD_STEP from where it was last drawn
  if (st.dirty || moved || (turn && camera.position.distanceToSquared(shadowLayers.cam) > CARD_STEP * CARD_STEP)) shadowLayers.world = true;
  if (redraw) {
    Object.assign(st, { dirty: false, age: 0, x: shadowCenter.x, z: shadowCenter.z, sx: sunDir.x, sy: sunDir.y, sz: sunDir.z });
    st.redraws++;
  }
  post.shadowUpdate = redraw;
}
// Two layers (perf batch 2, proposal rank 4). The split rule: everything in the scene is the world's layer (static) by
// default; a direct child of the scene with `userData.shadowMover = true` is a mover, its whole subtree drawn in the
// per-frame layer. Movers today: the crowd's group and people's own roots (crowd.js, people.js), the boats' batches
// (boats.js) and your character. Anything else that casts a shadow and moves must set the flag on the object it adds to
// the scene, or its shadow stays where it was until the world's layer is redrawn (a wind sway in the shader is no move:
// its shadow material keeps the rest pose). The world's layer is drawn into the shadow map only when it is due (above:
// its snapped centre or the sun stepped, a section came or went, the shadows changed, the camera went CARD_STEP for the
// tree cards; here: a static direct child of the scene came or went), and its depth is kept in a depth-only
// renderbuffer. The other redraws (the people's turn, peopleHz) copy that depth back in place of the clear
// (blitFramebuffer) and draw only the movers over it. A static thing that changes inside an object already in the scene
// asks for the world's layer with shadowLayers.world = true. The map the materials sample is three's own, as before.
// ?shadowcache=0: one layer, as before.
const CARD_STEP = 1; // metres the camera goes before the tree cards' shadows (turned to it) are redrawn
const shadowLayers = { on: query.get('shadowcache') !== '0', world: true, fb: null, rb: null, w: 0, h: 0, worldDraws: 0, moverDraws: 0,
  cam: new THREE.Vector3(), last: [], // the camera and the scene's static children when the world's layer was last drawn
  statics: new THREE.Object3D(), movers: new THREE.Object3D() }; // stand-in roots: the shadow pass walks only their children
{
  const sm = renderer.shadowMap, draw = sm.render, gl = renderer.getContext(), st = renderer.state, L = shadowLayers, ownClear = renderer.clear;
  const fbOf = (rt) => renderer.properties.get(rt).__webglFramebuffer;
  const copyDepth = (from, to) => {
    st.bindFramebuffer(gl.READ_FRAMEBUFFER, from);
    st.bindFramebuffer(gl.DRAW_FRAMEBUFFER, to);
    gl.blitFramebuffer(0, 0, L.w, L.h, 0, 0, L.w, L.h, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    st.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  };
  const statics = L.statics.children, movers = L.movers.children; // filled per pass (never the objects' parent)
  sm.render = function (lights, sc, cam) {
    if (!L.on || sc !== scene || !this.enabled || (!this.autoUpdate && !this.needsUpdate) || !lights.length) return draw.call(this, lights, sc, cam);
    statics.length = movers.length = 0;
    for (const o of sc.children) (o.userData.shadowMover ? movers : statics).push(o);
    // something static came into the scene or left it (a section's trees, a module's meshes): the world's layer again
    if (statics.length !== L.last.length || statics.some((o, i) => o !== L.last[i])) L.world = true;
    let clear;
    if (L.world || !sun.shadow.map || !L.fb || sun.shadow.map.width !== L.w || sun.shadow.map.height !== L.h) {
      L.last = [...statics];
      L.cam.copy(camera.position);
      // the world's layer: cleared and drawn as three does, its depth kept (the same format: DEPTH_COMPONENT24), then
      // the movers drawn over it without a clear
      draw.call(this, lights, L.statics, cam);
      const map = sun.shadow.map;
      if (!L.fb || map.width !== L.w || map.height !== L.h) {
        if (L.fb) { gl.deleteFramebuffer(L.fb); gl.deleteRenderbuffer(L.rb); }
        L.w = map.width; L.h = map.height;
        L.rb = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, L.rb);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, L.w, L.h);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        L.fb = gl.createFramebuffer();
        st.bindFramebuffer(gl.DRAW_FRAMEBUFFER, L.fb);
        gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, L.rb);
      }
      clear = () => { const m = fbOf(map); copyDepth(m, L.fb); st.bindFramebuffer(gl.DRAW_FRAMEBUFFER, m); };
      L.world = false;
      L.worldDraws++;
      this.needsUpdate = true;
    } else {
      const map = sun.shadow.map;
      clear = () => copyDepth(L.fb, fbOf(map)); // the world's depth in place of the clear
    }
    renderer.clear = clear;
    try { draw.call(this, lights, L.movers, cam); } finally { renderer.clear = ownClear; statics.length = movers.length = 0; }
    L.moverDraws++;
  };
}

// daylight on: sun (or moon), fill, sky and haze from the hour (daylight.js); off: the panel's own sun and colours
// moving: the hour is running or being dragged. Then the light's direction (and with it the shadow map, shadowPolicy)
// turns at the tier's shadow rate (peopleHz: 15 Hz low, 20 mid, every frame high), not every frame; colours, sky and
// haze still follow every frame, and a held hour is always exact (gen/ui/r2_time.md "Cost").
let sunMovedAt = -Infinity;
function applyLight(moving = false) {
  sky.mesh.visible = s.daylight;
  lightAt(s.hour, light, moonDate || new Date());
  dial.set(s.hour, light, { local: s.localTime, flow: s.timeFlow });
  if (s.daylight) {
    // one shadow-casting light: the sun, or after dark the moon when it is up
    const moon = light.moonIntensity > light.sunIntensity, hz = tiers.cfg.shadow.peopleHz, now = performance.now();
    if (!moving || !(hz < Infinity) || now - sunMovedAt >= 1000 / hz - 1) { sunDir.copy(moon ? light.moonDir : light.sunDir); sunMovedAt = now; }
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
    sunDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    sun.color.set(s.sunColor);
    sun.intensity = s.sunIntensity;
    hemi.color.set(s.hemiSky);
    hemi.groundColor.set(s.hemiGround);
    hemi.intensity = s.hemiIntensity;
    scene.background.set(s.fogColor);
    scene.fog.color.set(s.fogColor);
  }
  backdrop?.update(scene.fog.color);
  placeSun();
  const cast = s.shadows && sun.intensity > 0.01;
  // a setting change redraws the shadow map now; a moving hour redraws it through shadowPolicy as the sun turns (at
  // the tier's rate, above), unless the shadows switch on or off or soften
  if (!moving || cast !== sun.castShadow || sun.shadow.radius !== s.shadowSoftness) shadowState.dirty = true;
  sun.castShadow = cast;
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
// one material per name across all sections: the kit's swatches (roof, timber, plaster, ...) are the same in every
// section, so a later section's copies are dropped and its meshes share the first one's material and texture. Each
// name counts the loaded sections that use it, and goes with the last of them.
const stdByName = new Map(); // name -> { mat, n }
function sharedStd(m) {
  if (!m.name) return m;
  const e = stdByName.get(m.name);
  if (!e) { stdByName.set(m.name, { mat: m, n: 0 }); return m; }
  if (e.mat !== m) m.dispose(); // its map is the shared cache's (assets.js), given back when the section unloads
  return e.mat;
}
// a material nobody draws with any more: it and its shading variant
function disposeStd(std) {
  const v = variants.get(std);
  if (v && v.mat !== std) v.mat.dispose();
  variants.delete(std);
  std.dispose();
}

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
  if (mode === 'pbr') return std.userData.qmPatch ? std.userData.qmPatch(std) : std; // a material with its own shader patch (trees3d.js)
  const p = { map: std.map, color: colorOf(std).clone(), side: std.side, transparent: std.transparent, alphaTest: std.alphaTest, name: std.name };
  const kind = SURFACE_OFF ? null : SURFACE_KINDS[std.name]; // world materials only: no swatch may read as repeated tiles
  const m = mode === 'toon' ? new THREE.MeshToonMaterial({ ...p, gradientMap: toonRamp }) : mode === 'unlit' ? new THREE.MeshBasicMaterial(p) : new THREE.MeshLambertMaterial(p);
  // tree cards and the boats' wet rings write the empty normal (post.js): no ink from a camera-facing plane, and a ring
  // (transparent) leaves the water's normal under it, as when both were left out of the separate normal pass
  if (std.defines?.QM_INK_NEUTRAL !== undefined || std.name === 'water_ring') m.defines = { QM_INK_NEUTRAL: '' };
  const out = patchSurface(m, kind);
  return std.userData.qmPatch ? std.userData.qmPatch(out) : out;
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

const unshade = (mesh) => { const i = shaded.findIndex((it) => it.mesh === mesh); if (i >= 0) shaded.splice(i, 1); };
const without = (list, item) => { const i = list.indexOf(item); if (i >= 0) list.splice(i, 1); };

// ---------------------------------------------------------------- sections
// THREE.Cache stays off: it held every GLB's bytes and every image for the life of the page. Textures shared between
// sections come from the counted cache instead (assets.js).
const texCache = new TextureCache();
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
loader.register(sharedTexturePlugin(texCache));
// the 3D trees (trees3d.js; gen/details/trees/): near you a tree's wood and painted crown, in the wind; its card stays the
// far level. One top-level batch, static in the shadow layers (at rest). ?trees=cards: the cards alone, as before
const trees3d = query.get('trees') === 'cards' ? null : new Trees3D({ scene, texture: (u) => texCache.image(u), release: (u) => texCache.release(u),
  shade: (mesh, std, on) => { if (on) { shaded.push({ mesh, std }); mesh.material = materialFor(std); } else unshade(mesh); }, onChange: () => { shadowState.dirty = true; } });
const player = new Player(camera, renderer.domElement, s);
const postOptions = () => ({ mrt: MRT, samples: tiers.cfg.msaa, hdr: tiers.cfg.hdr, fxaa: tiers.cfg.fxaa });
const post = new InkPost(renderer, postOptions());
const noNormalPass = [sky.mesh]; // alpha-tested cards would show as rectangles in the normal buffer; the sky is background
// boats (boats.js): their roots load with their section, move in step with the walker, and their decks carry you
// The river's boats by device (the user, 2026-10-13: "if his device supports, a more complex flow"; map/BUILDING.md):
//   moored   map/BUILDING.md's painted motion: boats under way go a short way along their heading and back;
//   painted  the painted boats under way that have a river sail it (boatflow.js);
//   waves    and copies of the loaded boats come in waves, at most the tier's flowCap a section (2 when chosen on light);
//   auto     by tier: light painted, balanced and full waves (tiers.js flowCap 0 / 3 / 6).
// ?boatflow=moored|painted|waves wins over the setting; ?boatflowcap=N over the cap. Between moored and the others the
// change waits for the next visit (the flow's lanes, crews and trackers are set up as a section loads); painted and
// waves switch at once (the cap).
const BOAT_Q = ['moored', 'painted', 'waves'].includes(query.get('boatflow')) ? query.get('boatflow') : null;
const boatMode = () => { const m = BOAT_Q || s.boats; return m === 'auto' || !['moored', 'painted', 'waves'].includes(m) ? (tiers.cfg.flowCap > 0 ? 'waves' : 'painted') : m; };
const boatCap = () => (query.has('boatflowcap') ? Math.max(0, Math.floor(+query.get('boatflowcap')) || 0)
  : boatMode() === 'waves' ? Math.max(tiers.cfg.flowCap, 2) : 0);
// the boats' batches are one per material across the loaded sections (boats.js join): the page shades them while they
// live (their material's variant, as a section's meshes) and disposes the material with the last of them
const onBatch = (bm, on) => {
  if (on) { shaded.push({ mesh: bm, std: bm.material }); bm.material = materialFor(bm.material); scene.add(bm); return; }
  const it = shaded.find((x) => x.mesh === bm);
  scene.remove(bm); unshade(bm);
  if (it) disposeStd(it.std);
};
const boats = new Boats({ scene, loader, player, noNormalPass, getPeople: () => people, onBatch, flow: boatMode() === 'moored' ? null : 'waves' });
if (boats.flow) boats.flow.cap = boatCap(); // the most waves boats a section
// the world in cells (cells.js; tools/cells.mjs cuts them at export): every material's meshes of the loaded sections as
// one batch, drawn cell by cell; shaded and disposed through the same hook as the boats' batches. Opt-in (?cells=1):
// the S3 pilot showed no clear gain on the phone proxy (the crowd, not the world, is most of what the crown draws), and
// no shipped GLB is cut yet (gen/perf/batch2/notes.md, "Cells").
const cells = new Cells({ renderer, onBatch, enabled: query.get('cells') === '1' });
player.platforms = boats;

const sections = new Map(); // the loaded ones: name -> { name, layout, people, scene, backdrop, root, bvh, edges: {side: geometry}, ... }
const EDGE = /^g_edge_(\w+?)_hidden__col$/;

const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
async function fetchSection(name) {
  const base = `assets/${name}/`;
  const layoutP = json(`${base}layout.json`);
  const [gltf, layout, people, sceneJson, backdropCfg, boatSet, corridors] = await Promise.all([
    loader.loadAsync(`assets/${name}.glb`), layoutP, json(`${base}people.json`), json(`${base}scene.json`), json(`${base}backdrop.json`),
    layoutP.then((l) => boats.fetch(name, l)), // its boats GLB, when its layout lists boats
    query.get('corridors') === '0' ? null : json(`${base}corridors.json`), // its walkers' corridors, measured offline (people.js)
  ]);
  const sec = { name, base, root: gltf.scene, layout, people: people || {}, scene: sceneJson || {}, backdrop: backdropCfg, edges: {}, corridors,
    textures: gltf.parser.sharedTextures || [], materials: new Set(), ownMaterials: new Set(), batchMaterials: new Set(), meshes: [] };
  sec.root.name = `section_${name}`;
  // the boats join the section's root (its materials, shading, warm-up and disposal cover them); boats.js keeps their colliders
  if (boatSet) { sec.boats = boatSet; sec.root.add(boatSet.group); sec.textures.push(...boatSet.textures); }
  sec.root.updateMatrixWorld(true);
  const v = new THREE.Vector3(), colliders = [];
  let verts = 0;
  sec.floorVerts = []; // [first, end) vertex ranges of the visible solid meshes in the merged collider (floorUnder)
  sec.root.traverse((o) => {
    if (!o.isMesh) return;
    sec.meshes.push(o);
    const edge = o.name.match(EDGE);
    if (o.name.includes('hidden__')) {
      o.visible = false; // collider-only geometry: tree trunks, banks, the walkable area's edges
      sec.ownMaterials.add(o.material);
    } else if (o.isBatchedMesh) {
      // the boats' batches keep a material of their own (a copy of the kit's, by name): a batched and a plain mesh need
      // different programs, so one material shared by both re-resolved its program at every switch (the perf batch)
      sec.batchMaterials.add(o.material);
      o.castShadow = true;
      o.receiveShadow = true;
    } else {
      o.material = sharedStd(o.material);
      if (o.material.name) sec.materials.add(o.material.name); else sec.ownMaterials.add(o.material);
      o.castShadow = true;
      o.receiveShadow = true;
    }
    if (!o.name.endsWith('__col')) return;
    const src = o.geometry.getAttribute('position');
    const arr = new Float32Array(src.count * 3);
    for (let i = 0; i < src.count; i++) v.fromBufferAttribute(src, i).applyMatrix4(o.matrixWorld).toArray(arr, i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    if (o.geometry.index) g.setIndex(new THREE.BufferAttribute(o.geometry.index.array.slice(), 1));
    if (edge) { sec.edges[edge[1]] = g; return; }
    if (o.visible) sec.floorVerts.push([verts, verts + src.count, o.name.replace(/__col$/, '')]); // the name: footsteps by floor (sound.js)
    verts += src.count;
    colliders.push(g);
  });
  // the walkable area past its painted edges (moved things, edge walls), where the mist starts (backdrop.js)
  const ground = sec.root.getObjectByName('g_ground__col'), gb = ground && new THREE.Box3().setFromObject(ground);
  sec.walkable = walkableBoxes(layout, Object.fromEntries(Object.entries(sec.edges).map(([k, g]) => [k, { pos: g.attributes.position.array, index: g.index?.array }])),
    gb && !gb.isEmpty() ? { d0: -gb.max.z, d1: -gb.min.z } : null, backdropCfg?.mist?.full);
  // the section's own collider: one BVH, built once (the edge walls are added or dropped by the seams: walls())
  sec.colliderTris = colliders.reduce((a, g) => a + (g.index ? g.index.count : g.attributes.position.count) / 3, 0);
  const t0 = performance.now();
  sec.bvh = colliders.length ? new MeshBVH(colliders.length === 1 ? colliders[0] : mergeGeometries(colliders)) : null;
  sec.bvhMs = performance.now() - t0;
  for (const n of sec.materials) stdByName.get(n).n++;
  cells.prepare(sec); // its cell meshes as batch geometry (cells.js); the meshes stay, hidden, their colliders built above
  return sec;
}

// sections in scroll order, west -> east (by their painted areas), and the seams where two loaded ones meet: a
// section's west edge (nw -> sw) is the same line as its west neighbour's east edge (se -> ne)
const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05;
function ordered() { return [...sections.values()].sort((a, b) => a.layout.painted_area.corners[0][0] - b.layout.painted_area.corners[0][0]); }
function seams() {
  const out = new Set();
  const list = ordered();
  for (const a of list) for (const b of list) {
    if (a === b) continue;
    const [, ase, ane] = a.layout.painted_area.corners, [bsw, , , bnw] = b.layout.painted_area.corners;
    if (near(ase, bsw) && near(ane, bnw)) { out.add(`${a.name}:east`); out.add(`${b.name}:west`); }
  }
  return out;
}

// the collider: every loaded section's own BVH plus one for the edge walls, except the walls on a seam between two
// loaded sections (a seam to an unloaded neighbour keeps its wall: an outer edge until the neighbour is in)
let wallsBVH = null;
function rebuildCollider() {
  const sm = seams(), walls = [];
  for (const sec of sections.values()) for (const [side, g] of Object.entries(sec.edges)) if (!sm.has(`${sec.name}:${side}`)) walls.push(g);
  wallsBVH = walls.length ? new MeshBVH(mergeGeometries(walls)) : null;
  player.setColliders([...[...sections.values()].flatMap((x) => [x.bvh, x.trunks, ...(x.movers || [])]), wallsBVH].filter(Boolean)); // movers: boats.js; trunks: placeTrees
}

// P4 (details pass, gen/details/contacts/fix_s4/engine_patches.md): a static figure or animal of a loaded neighbour
// standing within 3 m of a section that has just joined was grounded before that section's colliders existed (S6's
// archer_waistguard_5465 stands on S5's casks when the gate loads first, on the ground when it loads after): ground it
// again the way addFigure / addAnimal did. Walkers, riders, boat crews, root_h figures and perched animals keep theirs.
function regroundNear(sec) {
  const poly = sec.layout.painted_area.corners;
  const segD = (x, d, a, b) => {
    const ex = b[0] - a[0], ed = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (d - a[1]) * ed) / (ex * ex + ed * ed || 1)));
    return Math.hypot(x - a[0] - t * ex, d - a[1] - t * ed);
  };
  const near = (x, d) => poly.some((a, i) => segD(x, d, a, poly[(i + 1) % poly.length]) < 3);
  const moving = new Set([...people.riders.map((r) => r.p), ...people.attached.map((a) => a.p)]);
  for (const n of sections.values()) {
    if (n === sec || !n.persons) continue;
    const figs = n.people.figures || {}, anis = n.people.animals || {};
    const byId = Object.fromEntries(n.layout.figures.map((f) => [f.id, f]));
    for (const p of n.persons) {
      if (moving.has(p) || people.agentOf.get(p)?.path) continue;
      const q = p.root.position;
      if (!near(q.x, -q.z)) continue;
      const f = figs[p.id] ? byId[p.id] : null;
      const e = !f && anis[p.id] ? n.layout.entities[`${n.layout.section}.ani.${p.id}`] : null;
      if ((!f && !e) || Number.isFinite(figs[p.id]?.root_h) || (e && people.models[anis[p.id].model]?.info?.perch)) continue;
      q.y = hooks.ground(q.x, q.z, ((f || e).H || 0) + 1.2);
    }
  }
}

function dropToSupport(x, z, fromY) {
  // the floor under a point: the bridge deck, the office floor, the tower floor
  const ray = new THREE.Ray(new THREE.Vector3(x, fromY, z), new THREE.Vector3(0, -1, 0));
  const hit = player.bvh.raycastFirst(ray, THREE.DoubleSide);
  return hit ? hit.point.y : 0;
}

// the visible floor under a point (ground, deck, wall top), never the hidden colliders: from above, a tree's probe
// lands on the top of its own trunk collider (2.5 m up) and the tree floats. Through each section's BVH: every hit
// down the ray, the highest on a visible solid mesh (its vertex range in the merged collider).
const floorRay = new THREE.Ray();
function floorUnder(x, z) {
  floorRay.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0));
  let top = null;
  for (const sec of sections.values()) {
    if (!sec.bvh) continue;
    for (const h of sec.bvh.raycast(floorRay, THREE.DoubleSide)) {
      const a = h.face.a;
      if ((top === null || h.point.y > top) && sec.floorVerts.some(([i0, i1]) => a >= i0 && a < i1)) top = h.point.y;
    }
  }
  return top ?? 0;
}
// the visible floor's collider name under a point, the highest below `y` (sound.js: footsteps on g_ground, g_deck ...)
function surfaceUnder(x, y, z) {
  floorRay.set(new THREE.Vector3(x, y, z), new THREE.Vector3(0, -1, 0));
  let top = null, name = null;
  for (const sec of sections.values()) {
    if (!sec.bvh) continue;
    for (const h of sec.bvh.raycast(floorRay, THREE.DoubleSide)) {
      if (top !== null && h.point.y <= top) continue;
      const r = sec.floorVerts.find(([i0, i1]) => h.face.a >= i0 && h.face.a < i1);
      if (r) { top = h.point.y; name = r[2]; }
    }
  }
  return name;
}

// ---------------------------------------------------------------- people (web/src/people.js), trees
// people.json says who each scroll figure is and what they do, and who walks where. Only painted figures appear
// (map/BUILDING.md); load_test_traffic is used by the load-test panel only, never by default.
let people = null, crowdOverlay = null;
const crowdHide = [];
const hooks = {
  scene,
  batch: query.get('batch') !== '0', // ?batch=0: one skinned mesh per person (A/B for crowd.js)
  forget: (mesh) => unshade(mesh),
  host: (f, spec, p, ppl) => boats.host(f, spec, p, ppl), // a boat's crew stand on it (boats.js)
  disposeMaterial: (std) => disposeStd(std), // a crowd batch's own copy of its character's material
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

// a path in people.json is [[X, D], ...] or {route: [from, to]}: stations along the section's mapped road (metres
// from S5's datum, + east; they run on across sections), turned into the road's centre-line points between them
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

// the characters and animals: loaded for the sections that cast them, counted by who uses them (a section, your
// avatar, the load test), and disposed when nobody does
let reg = {}, beastReg = {}; // assets/chars/characters.json, assets/animals/animals.json
let clipMeta = null; // assets/clip_meta.json: each clip's grounding and stride, measured offline (people.js)
// per-clip animation files (perf batch 2: tools/clip_split.mjs, assets/chars/clips.json): a character's body comes with
// its idle, and a section's cast with the clips its routines play (castClips), fetched while the section loads; ?clipfiles=0
// loads the full GLBs as before
let clipFiles = null;
const AVATAR_CLIPS = new Set(['idle', 'walk', 'run']); // updateAvatar
// a character's split if the page may use it: listed, holding every clip characters.json gives it, and cut from the full
// GLB this build ships (the build's content hash of that file, web/vite_asset_hashes.js; the dev and check servers have
// no hashes and take the manifest's word); else its full GLB, so a split left stale costs bytes, never a clip
function splitOf(n) {
  const e = clipFiles?.chars?.[n];
  if (!e || !reg[n]?.file || !(reg[n].clips || []).every((c) => e.base.includes(c) || e.clips[c])) return null;
  const h = window.__qmAsset?.(reg[n].file).match(/\.([0-9a-f]{8})\.glb$/)?.[1];
  return !h || h === e.src ? e : null;
}
const models = {}; // people.models is this object
const modelUsers = new Map(); // model name -> Set of users
const PINNED = ['sightseer', 'townsman']; // your fallback character, and the stand-in of last resort (populate)
// the character a figure is drawn with: its own if it is made, else its stand-in, else the townsman (as populate)
const castAs = (f) => (reg[f.character]?.file ? f.character : reg[f.stand_in]?.file ? f.stand_in : 'townsman');
function modelsOf(sec) {
  const spec = sec.people, out = new Set();
  for (const f of Object.values(spec.figures || {})) if (!f.carried_by) out.add(castAs(f));
  for (const w of spec.walkers || []) out.add(castAs(w));
  for (const a of Object.values(spec.animals || {})) if (beastReg[a.model]?.file) out.add(a.model);
  return out;
}
const clipsOf = (sec) => castClips(sec.people, castAs); // character -> the clips its routines here play
const modelLoads = new Map(); // name -> promise, while it loads (two callers never load one model twice)
// clips (optional): character -> clips to have in before it returns (split characters; the others hold every clip)
async function ensureModels(names, clips = null) {
  const want = [...names].filter((n) => !models[n] && !modelLoads.has(n));
  const chars = want.filter((n) => reg[n]?.file), beasts = want.filter((n) => !reg[n]?.file && beastReg[n]?.file);
  const split = Object.fromEntries(chars.map((n) => [n, splitOf(n)]).filter(([, e]) => e));
  const job = Promise.all([chars.length ? loadCharacters(loader, null, chars, reg, nextFrame, clipMeta, split, clips) : {},
    beasts.length ? loadCharacters(loader, null, beasts, beastReg, nextFrame, clipMeta).catch((e) => { console.warn('animals', e); return {}; }) : {}])
    .then(([a, b]) => { Object.assign(models, a, b); });
  for (const n of [...chars, ...beasts]) modelLoads.set(n, job);
  // the models already in (or loading for someone else): the clips they don't have yet, side by side with the new ones
  const more = clips ? [...names].filter((n) => !want.includes(n) && clips.get(n)) : [];
  const moreClips = more.map(async (n) => { await modelLoads.get(n); if (models[n]) await loadClips(models[n], clips.get(n)); });
  try { await Promise.all([job, ...moreClips, ...[...names].map((n) => modelLoads.get(n))].filter(Boolean)); } finally { for (const n of [...chars, ...beasts]) modelLoads.delete(n); }
}
function useModels(user, names) { for (const n of names) { if (!modelUsers.has(n)) modelUsers.set(n, new Set()); modelUsers.get(n).add(user); } }
function releaseModels(user) {
  for (const [n, users] of modelUsers) {
    if (!users.delete(user) || users.size) continue;
    modelUsers.delete(n);
    if (PINNED.includes(n) || !models[n]) continue;
    const m = models[n];
    delete models[n];
    people?.crowd?.disposeModel(m);
    m.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      for (const mat of [].concat(o.material)) {
        const map = mat.map;
        disposeStd(mat);
        if (map) { map.dispose(); if (typeof ImageBitmap !== 'undefined' && map.image instanceof ImageBitmap) map.image.close(); }
      }
    });
  }
}

function populate(sec) {
  const spec = sec.people;
  // the walkers' corridors measured offline against this build of the section (its collider's triangle count)
  if (sec.corridors?.collider_tris === sec.colliderTris) sec.corridorsSeeded = people.seedCorridors(sec.corridors.paths);
  const byId = Object.fromEntries(sec.layout.figures.map((f) => [f.id, f]));
  const made = [];
  // a character not made yet plays its stand_in (people.json), so a section can be cast before the workshop delivers
  const cast = (f) => (people.models[f.character] ? f : { ...f, character: people.models[f.stand_in] ? f.stand_in : 'townsman' });
  // the painted animals first (people.json animals, by slug), at their map positions, so riders can mount them
  for (const [slug, a] of Object.entries(spec.animals || {})) {
    const e = sec.layout.entities[`${sec.layout.section}.ani.${slug}`];
    if (e && people.models[a.model]) made.push(people.addAnimal(e, a, slug));
    else console.warn(`animal ${slug}: ${e ? `no model "${a.model}"` : 'not in the layout'}`);
  }
  // a child carried in someone's arms is drawn by its carrier's prop (people.json carried_by; the woman's child_in_arms)
  for (const [id, f] of Object.entries(spec.figures || {})) if (byId[id] && !f.carried_by) made.push(people.addFigure(byId[id], cast(f)));
  for (const w of spec.walkers || []) {
    const f = byId[w.figure];
    // beside: a driver walking at a painted walking animal's side, a hand on its load (people.json walkers[].beside
    // {animal: <slug>, gap: m across, + = left of travel, along: m ahead}; gen/details/contacts/fix_river/engine_beside.md):
    // he walks the animal's own path as the follower of a pair (as addTraffic's pairs), at its place and pace, stopping
    // and turning with it
    const L = w.beside && people.walkers.find((q) => q.p.id === w.beside.animal);
    const a = people.addWalker({ ...cast(w), path: L ? spec.animals[w.beside.animal].path : routePath(sec.layout.route, w.path), startAt: f ? [f.X, f.D] : undefined });
    if (L) {
      Object.assign(a, { follower: true, leader: L, beside: w.beside, gap: w.beside.gap ?? -0.57, sOff: w.beside.along || 0, sOffTarget: w.beside.along || 0, speed: L.speed });
      L.partner = a;
      a.l = a.targetL = people.laneOf(a);
      people.startWalking(a);
    }
    made.push(a.p);
  }
  return made;
}

function forget(list) {
  people.remove(list);
  for (const p of list) p.root.traverse((o) => { if (o.isMesh) unshade(o); });
}

// trees: painted alpha cards, one per form the scroll paints (assets/trees/trees.json, the tree-card workshop:
// file, base_uv = the trunk foot in the image, height_m / width_m = the real tree at scale 1), each tree on its own card
// (layout.json trees[].card, from trees/assign/<S>.json), mirrored where assigned. Drawn as one InstancedMesh per card,
// turned to face the camera every frame. Without a card a tree takes the willow card. A card is loaded while a loaded
// section has a tree on it, and freed with the last one.
// A card comes first at 256 px (trees.json small: tools/tree_cards.mjs small; 5-60 KB instead of 100-600 KB) and is
// swapped for the full card once the stream has nothing else to load, nearest first (sharpenCards; the tools'
// settle() waits for the swaps, so their pictures are the full cards). ?smallcards=0 loads the full cards at once,
// ?smallcards=only never swaps (to look at what a slow link shows first).
const SMALL_CARDS = query.get('smallcards') !== '0', SMALL_ONLY = query.get('smallcards') === 'only';
const cardReg = fetch('assets/trees/trees.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
const cardKinds = new Map(); // card name -> { mesh, std, url, trees: [{x, y, z, s, flip, sec}] }
const cards = [];
const WILLOW = { file: 'assets/willow_card.webp', base_uv: [0.444, 0.048], height_m: 8.5, width_m: 8.5 };
function cardKind(name) {
  if (!cardKinds.has(name)) {
    cardKinds.set(name, (async () => {
      const reg = await cardReg;
      const c = reg[name] || WILLOW;
      const url = SMALL_CARDS && c.small ? c.small : c.file;
      const tex = await texCache.image(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const geo = new THREE.PlaneGeometry(c.width_m, c.height_m);
      geo.translate((0.5 - c.base_uv[0]) * c.width_m, (0.5 - c.base_uv[1]) * c.height_m, 0); // the trunk foot at the origin
      const std = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, name: reg[name] ? name : 'willow_card' });
      std.defines = { QM_INK_NEUTRAL: '' }; // a card writes the empty normal (post.js): no ink from a camera-facing plane
      if (trees3d) std.userData.qmPatch = trees3d.cardPatch(name); // the dithered hand-over to its 3D tree (trees3d.js)
      return { name, card: c, url, full: url !== c.file ? c.file : null, geo, std, trees: [], mesh: null };
    })());
  }
  return cardKinds.get(name);
}
function dropCardMesh(kind) {
  if (!kind.mesh) return;
  trees3d?.uncard(kind.mesh);
  scene.remove(kind.mesh); kind.mesh.dispose(); unshade(kind.mesh); without(noNormalPass, kind.mesh);
  kind.mesh = null;
}
function buildCardMesh(kind) {
  dropCardMesh(kind);
  const m = new THREE.InstancedMesh(kind.geo, materialFor(kind.std), kind.trees.length);
  m.name = `trees_${kind.name}`;
  m.castShadow = m.receiveShadow = true;
  m.frustumCulled = false;
  shaded.push({ mesh: m, std: kind.std });
  noNormalPass.push(m);
  scene.add(m);
  kind.mesh = m;
  trees3d?.card(m, kind.name); // its shadow: the 3D tree's, at rest, where the tier gives one (trees3d.js)
  if (!cards.includes(kind)) cards.push(kind);
}
async function placeTrees(sec) {
  const touched = new Set();
  // the section's cards load side by side (one after another took 1-7 s at 4x CPU), then the trees go on them
  const trees = sec.layout.trees.filter((t) => t.card !== 'kit'); // 'kit': built in the section's GLB (a stump, a bent trunk)
  const kinds = new Map(await Promise.all([...new Set(trees.map((t) => t.card || 'willow_card'))].map(async (n) => [n, await cardKind(n)])));
  for (const t of trees) {
    const kind = kinds.get(t.card || 'willow_card');
    // real size (map/BUILDING.md rule 5): the card's own height, nudged by the painted height within limits
    const sc = t.card && t.height_m ? THREE.MathUtils.clamp(t.height_m / kind.card.height_m, 0.7, 1.4) : t.scale;
    kind.trees.push({ x: t.X, y: floorUnder(t.X, -t.D) - 0.05, z: -t.D, s: sc, flip: !!t.flip, sec: sec.name });
    touched.add(kind);
  }
  for (const kind of touched) buildCardMesh(kind);
  sec.cards = touched;
  const placed = [...touched].flatMap((k) => k.trees.filter((t) => t.sec === sec.name).map((t) => ({ ...t, card: k.name })));
  // the 3D trees come in behind the stream (their cards show until they do): they never hold up a section's people
  trees3d?.place(sec.name, placed);
  // the trunks' colliders, as wide as the painted bole (trees3d.js trunkColliders), the cards' and the 3D trees' alike
  const g = await trunkColliders(placed);
  if (g && sections.get(sec.name) === sec && !sec.trunks) {
    sec.trunks = new MeshBVH(g);
    rebuildCollider();
  } else g?.dispose();
}
function removeTrees(sec) {
  sec.trunks?.geometry.dispose();
  sec.trunks = null;
  trees3d?.remove(sec.name);
  for (const kind of sec.cards || []) {
    kind.trees = kind.trees.filter((t) => t.sec !== sec.name);
    if (kind.trees.length) { buildCardMesh(kind); continue; }
    dropCardMesh(kind);
    without(cards, kind);
    cardKinds.delete(kind.name);
    kind.gone = true; // a full card still loading for it is given back when it comes
    kind.geo.dispose();
    disposeStd(kind.std);
    texCache.release(kind.url);
  }
}
// the full cards of the small ones in use, nearest first, `limit` loading at once (the stream calls it every idle
// frame: no allocation unless a card is waiting); with `wait`, a promise of every swap under way
const wantsFull = (k) => k.full && !SMALL_ONLY && !trees3d?.keepsSmall(k.name); // a card only seen beyond its 3D tree stays small (trees3d.js)
function sharpenCards(limit = 3, wait = false) {
  let busy = 0, waiting = 0;
  for (const k of cards) { if (k.sharpening) busy++; else if (wantsFull(k)) waiting++; }
  if (waiting && busy < limit) {
    const near = (k) => Math.min(...k.trees.map((t) => (t.x - player.pos.x) ** 2 + (t.z - player.pos.z) ** 2));
    const todo = cards.filter((k) => wantsFull(k) && !k.sharpening).sort((a, b) => near(a) - near(b));
    for (const kind of todo.slice(0, limit - busy)) sharpen(kind);
  }
  return wait ? Promise.all(cards.map((k) => k.sharpening).filter(Boolean)) : null;
}
function sharpen(kind) {
  const url = kind.full;
  kind.sharpening = texCache.image(url).then((tex) => {
    if (kind.gone) { texCache.release(url); return; }
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    for (const m of new Set([kind.std, variants.get(kind.std)?.mat])) if (m) { m.map = tex; m.needsUpdate = true; }
    texCache.release(kind.url); // the small card
    kind.url = url;
  }).catch((err) => console.warn(`tree card ${kind.name}: ${err.message || err}`)).finally(() => { kind.sharpening = null; kind.full = null; });
  return kind.sharpening;
}
// turn every card to face the camera (about its trunk)
const _cm = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _cv = new THREE.Vector3(), _cs = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function faceCards() {
  for (const kind of cards) {
    kind.trees.forEach((t, i) => {
      _cq.setFromAxisAngle(_up, Math.atan2(camera.position.x - t.x, camera.position.z - t.z));
      _cm.compose(_cv.set(t.x, t.y, t.z), _cq, _cs.set(t.flip ? -t.s : t.s, t.s, t.s));
      kind.mesh.setMatrixAt(i, _cm);
    });
    kind.mesh.instanceMatrix.needsUpdate = true;
  }
}

// load test: extra traffic on the road (a loaded section's people.json load_test_traffic); it goes with that section
let extraTraffic = [], trafficSec = null;
async function setCrowd(n) {
  if (!people) return;
  forget(extraTraffic);
  extraTraffic = [];
  trafficSec = null;
  releaseModels('traffic');
  const sec = [...sections.values()].find((x) => x.people.load_test_traffic);
  if (!n || !sec) return;
  const spec = { ...sec.people.load_test_traffic, path: routePath(sec.layout.route, sec.people.load_test_traffic.path) };
  const kinds = new Set(spec.kinds.map((k) => k.character));
  await ensureModels(kinds, trafficClips(spec));
  useModels('traffic', kinds);
  if (!sections.has(sec.name)) return;
  extraTraffic = people.addTraffic({ ...spec, count: n, seed: 1000, pairs: 0.25 }).map((a) => a.p);
  trafficSec = sec.name;
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
  renderer.setPixelRatio(tiers.pixelRatio(devicePixelRatio)); // the tier's cap, the settings' sharpness, the adaptive scale
  renderer.setSize(innerWidth, innerHeight);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  post.setSize(size.x, size.y);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
// the distance past which people are drawn with their far body (tiers.js peopleLod; ?peoplelod=<m>, Infinity: never;
// ?lodsplit=1 also draws the far people of a character with people near apart: crowd.js lodSplit)
const peopleLod = (cfg) => (query.has('peoplelod') ? Number(query.get('peoplelod')) : cfg.peopleLod ?? Infinity);
// a new tier: the colour target and its anti-aliasing, the shadow map, the window (the next streamUpdate)
function applyTier(cfg) {
  applyDetail(cfg, tiers.detailScale); // detail.js
  post.configure(postOptions());
  if (boats.flow) boats.flow.cap = boatCap(); // boatflow.js
  if (people?.crowd) people.crowd.shadowFar = cfg.shadow.peopleFar; // people cast no shadow past this (crowd.js)
  if (people?.crowd) people.crowd.lodFar = peopleLod(cfg); // people's far bodies past this (crowd.js)
  shadowState.dirty = true;
  if (sun.shadow.mapSize.x !== cfg.shadow.size) {
    sun.shadow.mapSize.setScalar(cfg.shadow.size);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }
  resize();
}

function onSettingChange(key) {
  applyLight();
  camera.fov = s.fov;
  camera.updateProjectionMatrix();
  if (key === 'shading' || key === '*') applyShading();
  if (key === 'trueColors' || key === '*') applyColors();
  if (key === 'quality' || key === '*') tiers.chosen(); // the Quality choice: a tier by hand, or auto (tiers.js)
  if ((key === 'boats' || key === '*') && boats.flow) boats.flow.cap = boatCap(); // the Boats choice (moored: next visit)
  if (key === 'pixelRatioCap' || key === '*') resize();
  if ((key === 'view' || key === '*') && avatar) setView(s.view);
  if ((key === 'avatar' || key === '*') && people) setAvatar(s.avatar);
  if ((key === 'camDistance' || key === '*') && followCam) followCam.distance = s.camDistance;
  if ((key === 'crowd' || key === '*') && people) return setCrowd(s.crowd);
}
// the one setter for world settings from the UI (the settings screen and the view tiles, ui/hud.js; createUI's
// o.settings.set): the tuning panel's rules (an hour or a pace leaves your clock; your clock sets the hour), saved per
// page as the panel saves, then onSettingChange
function setSetting(key, v) {
  s[key] = v;
  if (key === 'hour' || key === 'timeFlow') s.localTime = false;
  if (key === 'localTime' && v) s.hour = localHour();
  saveSettings(s, KEY);
  try { if (hud.tune) for (const c of gui.controllersRecursive()) c.updateDisplay(); } catch { /* the panel isn't up */ }
  return onSettingChange(key === 'localTime' ? 'hour' : key);
}
function resetSettings() {
  Object.assign(s, WORLD_DEFAULTS);
  if (s.localTime) s.hour = localHour();
  saveSettings(s, KEY);
  for (const c of gui.controllersRecursive()) c.updateDisplay();
  return onSettingChange('*');
}
// the full lil-gui panel is a developer's tool now (the user, round 2: settings "not in row form like this"): it shows
// beside the painting only with ?tune=1 or the settings screen's 進階 row, which also puts ?tune=1 in the address
function setTune(on) {
  hud.tune = !!on;
  if (!on) gui.hide();
  try { const u = new URL(location.href); if (on) u.searchParams.set('tune', '1'); else u.searchParams.delete('tune'); history.replaceState(history.state, '', u); } catch { /* fine */ }
}

const gui = buildGui(s, onSettingChange, {}, { title: `World: ${NAMES.join(' · ')} — tuning`, key: KEY, defaults: WORLD_DEFAULTS, street: false });
// the device tier by hand (tiers.js; the settings screen can offer the same key through setSetting('quality', ...))
gui.add(s, 'quality', { 'auto (by device)': 'auto', low: 'low', mid: 'mid', high: 'high' }).name('Quality').onChange(() => { saveSettings(s, KEY); onSettingChange('quality'); });
const load = gui.addFolder('Load test');
load.add(s, 'crowd', 0, 600, 1).name('extra walkers').onChange(() => { saveSettings(s, KEY); onSettingChange('crowd'); });
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
  if (e.code === 'KeyV') { s.view = s.view === 'first' ? 'third' : 'first'; saveSettings(s, KEY); onSettingChange('view'); }
});
document.addEventListener('pointerlockchange', () => {
  $('crosshair').style.display = document.pointerLockElement ? 'block' : 'none';
});
// the scroll HUD (scroll_hud.js): Space (a button on touch screens) shows where you stand on the original painting,
// with the people round you; the tuning panel shows there only with ?tune=1 (H hides it there). The page stops
// drawing meanwhile.
const hud = new ScrollHud({ sections, player, gui, tune: query.get('tune') === '1', canvas: renderer.domElement, getPeople: () => people });
$('help').innerHTML = isTouch
  ? 'Left thumb: walk · Right thumb: look · Scroll button top-right: the painting · › top left: settings<br><small>Sound effects: ElevenLabs</small>'
  : 'Click to walk · WASD / arrows · Shift run · mouse look · wheel zoom · V first / third person · Esc release mouse · Space the painting · O settings · H help · M sound<br><small>Sound effects: ElevenLabs</small>';
// the ink UI (web/src/ui/, gen/ui/STYLE.md): loading screen, place names, near conversations, help, the chrome's look.
// It replaces the help above with its own; ?stats=1 shows the stats line; ?ui=0 leaves out notifications and talk.
const ui = createUI({
  camera, player, query, hud,
  sections: () => sections,
  current: () => index[stream.cur]?.name,
  night: () => light.night ?? 0,
  hudOpen: () => hud.open,
  time, // the hour's setter (gen/ui/r2_time.md): the settings screen's 時辰 rows
  sfx: (n, g = 0.8) => { try { if (sound?.ctx && sound.on) sound.voice(n, { group: 'ui', gain: g }); } catch { /* sound is optional */ } },
  // the direct HUD and the settings screen (ui/hud.js, ui/settings_screen.js): world settings only through setSetting
  settings: { s, set: setSetting, reset: resetSettings },
  sound: () => sound,
  canvas: renderer.domElement,
  tune: { get: () => hud.tune, set: setTune },
  ahead: () => aheadLoading(), // the painting near you still coming in: the ink note 前路漸展 (ui/index.js)
});
hud.titleFor = (S, meta) => ui.regionTitle(meta?.folder);

// ---------------------------------------------------------------- the player's body and view
// third person (Messenger): FollowCam behind your own character. first person: the camera at the eyes, your body
// still there below it (its head bone collapsed so the camera isn't inside it), without its shadow.
let avatar = null, avatarYaw = 0, followCam = null;
async function setAvatar(name) {
  name = reg[name]?.file ? name : 'sightseer';
  await ensureModels([name], new Map([[name, AVATAR_CLIPS]]));
  useModels('avatar:new', [name]);
  if (avatar) {
    scene.remove(avatar.root);
    avatar.mixer.stopAllAction();
    avatar.root.traverse((o) => { if (o.isMesh) unshade(o); });
  }
  releaseModels('avatar');
  useModels('avatar', [name]);
  releaseModels('avatar:new');
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

// ---------------------------------------------------------------- the streaming window
// Every section of the world is known from the start by its painted area (layout.json painted_area) and camera spots
// (scene.json); only the sections near you are loaded. "Your" section is the one you stand in, and it changes only
// once you are STICK/2 m inside another (or at a teleport), so walking to and fro across a seam changes nothing.
// Loaded: yours and WINDOW sections either side of it, plus any section whose painted area is within AHEAD m of you
// (with WINDOW 0 a neighbour comes in as you near its seam). A section outside that set is disposed once it is
// over KEEP m away and has stayed unwanted for UNLOAD_AFTER s. One load or unload runs at a time, nearest first.
// Sections are about 37 m deep across their slanted seams, so with WINDOW 1 the next one starts loading at least
// 27 m (STICK/2 m past the seam you crossed, the rest of the section) before you can reach its seam: over 5 s at a
// run (4.8 m/s), where a section takes about 1-2 s to come in on a desktop. Until it is in, its seam is a wall.
// ?window= wins (a number, all, or 'ahead': yours and the one you walk or look toward); else the tier's (1)
const WINDOW_Q = (() => { const w = query.get('window'); if (w === 'all') return Infinity; if (w === 'ahead') return w; const n = parseInt(w, 10); return Number.isFinite(n) && n >= 0 ? n : null; })();
const windowOf = () => WINDOW_Q ?? tiers.cfg.window;
const AHEAD = 20, KEEP = 32, STICK = 20, UNLOAD_AFTER = 2;
const index = []; // west -> east: { name, edges: [[nX, nD, c] x 4], views, spawn, state: 'out'|'loading'|'in'|'failed', sec, idle }
const stream = { cur: -1, busy: false, hurry: false, waiters: [], events: [], op: null, lastTick: 0, maxGap: 0, pending: [] }; // pending: operations queued before any load or unload
// the outward distance of (X, D) from a painted area (negative inside): the largest of its four edge lines'
function outside(e, X, D) { let o = -Infinity; for (const [nx, nd, c] of e.edges) o = Math.max(o, nx * X + nd * D + c); return o; }
function edgeLines(corners) {
  return corners.map(([ax, ad], i) => {
    const [bx, bd] = corners[(i + 1) % 4], len = Math.hypot(bx - ax, bd - ad);
    const nx = (bd - ad) / len, nd = -(bx - ax) / len; // right-hand normal of the counter-clockwise ring: outward
    return [nx, nd, -(nx * ax + nd * ad)];
  });
}
async function buildIndex() {
  const list = await Promise.all(NAMES.map(async (name) => {
    const [layout, sc] = await Promise.all([json(`assets/${name}/layout.json`), json(`assets/${name}/scene.json`)]);
    if (!layout?.painted_area) { console.warn(`section ${name}: no layout.json painted_area`); return null; }
    return { name, west: layout.painted_area.corners[0][0], corners: layout.painted_area.corners, edges: edgeLines(layout.painted_area.corners), views: sc?.views || {}, spawn: sc?.spawn, state: 'out', sec: null, idle: null };
  }));
  // camera spots, named in NAMES order (a name two sections use gets the later one's prefix), then scroll order
  for (const e of list.filter(Boolean)) {
    for (const [n, v] of Object.entries(e.views)) views[views[n] ? `${e.name}:${n}` : n] = v;
    if (e.spawn) views[`${e.name}:spawn`] = e.spawn;
  }
  index.push(...list.filter(Boolean).sort((a, b) => a.west - b.west));
}
const nextFrame = () => new Promise((r) => { let done = false; const f = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(f); setTimeout(f, 100); });
// the sections you should have now, from where the player stands
function wanted(force) {
  const X = player.pos.x, D = -player.pos.z, ds = index.map((e) => outside(e, X, D));
  let best = 0;
  for (let i = 1; i < ds.length; i++) if (ds[i] < ds[best]) best = i;
  if (stream.cur < 0 || force || ds[stream.cur] - ds[best] > STICK) stream.cur = best;
  const W = windowOf();
  // 'ahead': the neighbour east or west as you walk (or, standing, as you look); sections run west -> east along x
  const dir = W === 'ahead' ? (Math.abs(player.velocity?.x || 0) > 0.3 ? Math.sign(player.velocity.x) : Math.sign(-Math.sin(player.yaw)) || 1) : 0;
  const want = new Set(index.filter((e, i) => (W === 'ahead' ? i === stream.cur || i === stream.cur + dir : Math.abs(i - stream.cur) <= W) || ds[i] < AHEAD));
  return { ds, want };
}
function streamUpdate(force = false) {
  if (!index.length || !people) return;
  const now = performance.now(), { ds, want } = wanted(force);
  index.forEach((e, i) => { e.idle = want.has(e) || ds[i] <= KEEP ? null : e.idle ?? now; });
  if (stream.busy) return;
  if (stream.pending.length) { run(stream.pending.shift()); return; }
  const hurry = stream.hurry || force;
  const drop = index.find((e) => e.state === 'in' && e.idle != null && (hurry || now - e.idle > UNLOAD_AFTER * 1000));
  if (drop) { run(() => unloadSection(drop)); return; }
  const next = index.map((e, i) => [e, ds[i]]).filter(([e]) => want.has(e) && e.state === 'out').sort((a, b) => a[1] - b[1])[0];
  if (next) { run(() => loadSection(next[0])); return; }
  sharpenCards(); // nothing to load: the small tree cards' full ones
  if (stream.waiters.length && !index.some((e) => e.state === 'in' && e.idle != null)) {
    stream.hurry = false;
    for (const w of stream.waiters.splice(0)) w();
  }
}
// a section you stand in, or are within AHEAD_NOTE_M of, that isn't in yet (its seam is a wall until it is): the UI's
// ink note that the way ahead is still coming in (the user, 2026-10-13: at the end of a section the walk sometimes
// stopped while the next one loaded). A section that failed never comes, so it doesn't count.
const AHEAD_NOTE_M = 12;
function aheadLoading() {
  const X = player.pos.x, D = -player.pos.z;
  return index.some((e) => (e.state === 'out' || e.state === 'loading') && outside(e, X, D) < AHEAD_NOTE_M);
}
// one operation at a time; the longest frame while it runs (and the half second after, when its new things are
// first drawn: uploads and shader compiles) is its stall
async function run(op) {
  stream.busy = true;
  try { await op(); } catch (err) { console.error(err); } finally { stream.busy = false; }
}
const longTasks = [];
try { new PerformanceObserver((l) => { for (const t of l.getEntries()) longTasks.push([t.startTime, t.duration]); if (longTasks.length > 500) longTasks.splice(0, 250); }).observe({ type: 'longtask' }); } catch { /* not in Safari */ }
function beginOp(kind, name) { stream.op = { kind, name, t0: performance.now(), maxGap: 0, steps: {}, programs: renderer.info.programs.length, bakeMs: 0, maxBakeMs: 0 }; }
function endOp(extra = {}) {
  const op = stream.op;
  op.ms = performance.now() - op.t0;
  Object.assign(op, extra);
  stream.op = null;
  // the frames right after the operation still belong to it (first draw of what it added)
  const tail = { maxGap: 0, bakeMs: 0, maxBakeMs: 0 };
  stream.tail = tail;
  setTimeout(() => {
    if (stream.tail === tail) stream.tail = null;
    const t1 = performance.now();
    const tasks = longTasks.filter(([st, d]) => st + d >= op.t0 && st <= t1).map(([, d]) => d);
    stream.events.push({ kind: op.kind, name: op.name, ms: Math.round(op.ms), stallMs: Math.round(Math.max(op.maxGap, tail.maxGap)),
      longestTaskMs: tasks.length ? Math.round(Math.max(...tasks)) : null, steps: op.steps, newPrograms: renderer.info.programs.length - op.programs,
      bakeMs: Math.round(op.bakeMs + tail.bakeMs), maxBakeMs: Math.round(Math.max(op.maxBakeMs, tail.maxBakeMs)), ...extra });
    if (stream.events.length > 200) stream.events.shift();
  }, 600);
}
const step = async (name, fn) => { const t = performance.now(); const r = await fn(); if (stream.op) stream.op.steps[name] = Math.round(performance.now() - t); return r; };

async function loadSection(e) {
  e.state = 'loading';
  beginOp('load', e.name);
  try {
    const sec = await step('fetch', () => fetchSection(e.name));
    const cast = modelsOf(sec);
    await step('models', () => ensureModels(cast, clipsOf(sec)));
    useModels(sec.name, cast);
    await nextFrame();
    await addSection(sec);
    e.sec = sec;
    e.state = 'in';
    endOp({ bvhMs: Math.round(sec.bvhMs), colliderTris: sec.colliderTris });
  } catch (err) {
    console.error(`section ${e.name} failed to load`, err);
    e.state = 'failed';
    endOp({ failed: String(err) });
  }
}

async function addSection(sec, { defer = false } = {}) {
  // its materials compiled before it is drawn (KHR_parallel_shader_compile: the GPU process compiles while frames go
  // on), so its first frame doesn't wait for shaders; stand-ins share each visible mesh's geometry and material
  const proxies = new THREE.Group();
  for (const o of sec.meshes) {
    if (!o.visible) continue;
    shaded.push({ mesh: o, std: o.material });
    o.material = materialFor(o.material);
    const p = new THREE.Mesh(o.geometry, o.material);
    p.castShadow = o.castShadow; p.receiveShadow = o.receiveShadow;
    proxies.add(p);
  }
  const fresh = cells.join(sec); // its cells into the materials' batches; a new batch is hidden until compiled
  await step('compile', () => Promise.all([renderer.compileAsync(proxies, camera, scene), ...fresh.map((b) => renderer.compileAsync(b, camera, scene))]));
  cells.ready(fresh);
  sections.set(sec.name, sec);
  scene.add(sec.root);
  shadowState.dirty = true;
  await step('boats', () => boats.add(sec, sections)); // their colliders, contacts and the shore walls they open
  await step('collider', () => rebuildCollider());
  regroundNear(sec); // neighbours' static people grounded before this section's colliders existed (P4)
  for (const w of sec.people.walkers || []) w.path = routePath(sec.layout.route, w.path);
  if (!defer) await finishSection(sec);
  await step('backdrop', () => rebuildBackdrop());
  applyShading();
}
// a section's trees and people (the first section's come in after you can walk: the loading screen waits only for
// the ground, its kit and your character)
async function finishSection(sec) {
  await step('trees', () => placeTrees(sec));
  await nextFrame();
  sec.persons = await step('people', () => populate(sec));
  await nextFrame();
  applyShading();
  if (s.crowd && !extraTraffic.length && sec.people.load_test_traffic) await setCrowd(s.crowd);
}

async function unloadSection(e) {
  const sec = e.sec;
  beginOp('unload', e.name);
  e.state = 'out';
  e.sec = null;
  e.idle = null;
  sections.delete(sec.name);
  scene.remove(sec.root);
  shadowState.dirty = true;
  boats.remove(sec);
  cells.leave(sec);
  if (trafficSec === sec.name) { forget(extraTraffic); extraTraffic = []; trafficSec = null; releaseModels('traffic'); }
  forget(sec.persons || []);
  releaseModels(sec.name);
  removeTrees(sec);
  for (const o of sec.meshes) { unshade(o); o.geometry.dispose(); }
  for (const m of sec.ownMaterials) m.dispose();
  for (const m of sec.batchMaterials) disposeStd(m); // the boats' batches' own materials and their shading variants
  for (const n of sec.materials) {
    const m = stdByName.get(n);
    if (--m.n > 0) continue;
    stdByName.delete(n);
    disposeStd(m.mat);
  }
  for (const url of sec.textures) texCache.release(url);
  sec.bvh?.geometry.dispose();
  for (const g of Object.values(sec.edges)) g.dispose();
  rebuildCollider();
  await rebuildBackdrop();
  endOp();
}

// wait until the window round where the player now stands is loaded (and what is too far is gone); the player is
// held still while its own section is missing, so it can't fall through the ground that isn't there yet; then (sharp)
// every small tree card swapped for its full one, so the tools see the full cards
function settle(sharp = true) {
  const p = new Promise((resolve) => { stream.waiters.push(resolve); stream.hurry = true; streamUpdate(true); });
  return sharp ? p.then(() => sharpenCards(Infinity, true)) : p;
}
// a teleport for the tools: stand at (X, D) (on the floor there, or at height H), with the window loaded round it
// Teleports can overlap (the page's own view() at load still waits for the full tree cards when a tool or the HUD
// asks for another): only the latest one gives the player back, or the earlier one would unfreeze it mid-stream and it
// fell through a section not yet in (batch 2, gen/perf/batch2/bisect/).
let gotoLatest = 0, gotoActive = 0, gotoWas = false;
async function goto(X, D, H) {
  if (X !== undefined) { player.pos.set(X, (H ?? 0) + 0.2, -D); player.vel.set(0, 0, 0); }
  const me = ++gotoLatest;
  if (gotoActive++ === 0) gotoWas = player.frozen;
  player.frozen = true;
  const done = settle();
  const hold = setInterval(() => {
    if (me !== gotoLatest) { clearInterval(hold); return; }
    const e = index[stream.cur];
    if (e?.state === 'in' || e?.state === 'failed') { clearInterval(hold); player.frozen = gotoWas; }
  }, 50);
  try { await done; } finally { clearInterval(hold); gotoActive--; }
  if (me !== gotoLatest) return; // a later teleport took over
  player.frozen = gotoWas;
  if (X !== undefined && H === undefined && player.bvh) {
    const hit = player.bvh.raycastFirst(new THREE.Ray(new THREE.Vector3(X, 40, -D), new THREE.Vector3(0, -1, 0)), THREE.DoubleSide);
    player.pos.set(X, (hit ? hit.point.y : 0) + 0.05, -D);
    player.vel.set(0, 0, 0);
  }
}
const streamStats = () => ({
  window: windowOf(), cur: index[stream.cur]?.name, loaded: index.filter((e) => e.state === 'in').map((e) => e.name),
  loading: index.filter((e) => e.state === 'loading').map((e) => e.name), failed: index.filter((e) => e.state === 'failed').map((e) => e.name),
  events: stream.events, textures: texCache.stats(), models: Object.keys(models).length, materials: stdByName.size, cards: cardKinds.size,
  baking: [...(people?.crowd?.sets?.values() || [])].reduce((a, x) => a + x.queue.length + (x.followers || []).reduce((b, f) => b + f.queue.length, 0), 0),
  // per-clip files: the characters loaded as a body (and the clips they hold), and clips someone started before they came
  split: Object.values(models).filter((m) => m.lazy).map((m) => `${m.name}:${m.clips.length}`), lateClips: [...LATE_CLIPS],
});

// ---------------------------------------------------------------- sound (sound.js; rules: sounds/rules.json)
// Built once the first section shows; it starts on the first click, touch or key (browsers want one). Anything it
// throws turns sound off, never the page.
let sound = null;
function startSound() {
  if (query.get('sound') === '0') return;
  try {
    const sd = new Sound({
      camera, player, people: () => people, boats: () => boats, hour: () => s.hour,
      sections: () => index.map((e) => ({ name: e.name, sec: e.state === 'in' ? e.sec : null, out: outside(e, player.pos.x, -player.pos.z) })), // beds follow where you stand, loaded or not
      current: () => index[stream.cur]?.name,
      floor: surfaceUnder,
      ceiling: (x, y, z) => { const h = player.bvh?.raycastFirst(new THREE.Ray(new THREE.Vector3(x, y, z), new THREE.Vector3(0, 1, 0)), THREE.DoubleSide); return h ? h.distance : null; },
    });
    sd.init().then(() => {
      sound = sd;
      const go = () => sound?.unlock();
      for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, go, { capture: true, passive: true });
      if (navigator.userActivation?.hasBeenActive) go();
    }).catch((err) => console.warn('sound off:', err.message));
  } catch (err) { console.warn('sound off:', err); }
}

// ---------------------------------------------------------------- main loop
const timer = new THREE.Timer();
let lastTickMs = 0; // the last drawn frame's own CPU time (tiers.js: CPU- or GPU-bound)
let measuring = null;

function tick(now) {
  sound?.hud(hud.open);
  if (hud.open) { stream.lastTick = 0; requestAnimationFrame(tick); return; } // the scroll HUD is up: nothing to draw
  const t0 = performance.now();
  if (stream.lastTick) {
    const gap = t0 - stream.lastTick;
    if (stream.op) stream.op.maxGap = Math.max(stream.op.maxGap, gap);
    if (stream.tail) stream.tail.maxGap = Math.max(stream.tail.maxGap, gap);
  }
  const fresh = !stream.lastTick; // the first frame after the scroll HUD closed (its gap isn't a slow frame)
  stream.lastTick = t0;
  timer.update(now);
  const rawDt = timer.getDelta(), dt = Math.min(rawDt, 0.1);
  // the tier's checks and adaptive resolution (tiers.js), paused while a section streams in
  if (!fresh && tiers.frame(rawDt, lastTickMs, stream.busy || !!stream.op || !!stream.tail)) resize();
  player.update(dt / 2);
  player.update(dt / 2);
  if (avatar) updateAvatar(dt);
  if (player.mode === 'third' && followCam) followCam.update(dt);
  placeSun();
  shadowPolicy(dt);
  streamUpdate();
  const ta = performance.now();
  people.update(dt);
  boats.update(dt, camera); // moving parts, ropes, detail level
  if (sound) try { sound.update(dt); } catch (err) { console.warn('sound stopped:', err); sound = null; }
  acc.anim += performance.now() - ta;
  const bk = people.crowd?.bakeMs || 0, ob = stream.op || stream.tail;
  if (ob && bk) { ob.bakeMs += bk; ob.maxBakeMs = Math.max(ob.maxBakeMs, bk); }
  faceCards();
  if (s.localTime) {
    const h = localHour(); // the light follows the clock in 10-second steps
    if (Math.abs(h - s.hour) > 1 / 360) { s.hour = h; timeDirty = true; }
  } else if (s.timeFlow > 0 && !scrubbing) { // time runs at its pace (ui/time_words.js PACES), held while you drag
    s.hour = (s.hour + (dt * s.timeFlow) / 60) % 24;
    timeDirty = true;
  }
  if (timeDirty) { // at most once a frame, however the hour was set
    const tl = performance.now();
    timeDirty = false;
    applyLight(scrubbing || (!s.localTime && s.timeFlow > 0));
    timeCost.ms += performance.now() - tl;
    timeCost.n++;
  }
  sky.mesh.position.copy(camera.position);
  ui.frame(dt); // place names, talk, bubbles following their heads (ui/index.js)
  renderer.info.reset();
  let q = null;
  if (tq) { q = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, q); }
  if (people.crowd && !post.opts.mrt) { crowdHide.length = 0; crowdHide.push(...people.farMeshes, ...people.crowd.meshes()); } // the separate normal pass only
  cells.update(camera, post.shadowUpdate && sun.castShadow ? sun : null); // which cell batches draw, and their cells (cells.js)
  post.render(scene, camera, s, noNormalPass, people.crowd ? crowdHide : people.farMeshes, crowdOverlay);
  if (q) { gl.endQuery(tq.TIME_ELAPSED_EXT); pendingQ.push(q); gpuPoll(); }
  lastTickMs = performance.now() - t0;
  acc.cpu += lastTickMs;
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

// The first frames of the world run under the loading paper, and the paper wipes away only once they come smoothly
// (gen/ui/r2_time.md, "The loading stall"). The first frame used to stall 0.65 s on a desktop (0.8 s at a 4x-throttled
// phone) after the wipe began: the shader programs compileAsync can't reach (shadow, normal and outline passes, the
// sky, people and the avatar), the crowd's first pose bake and the first uploads. Here the scene's materials compile
// in parallel first (the stroke keeps creeping meanwhile), then the loop starts; we go on after three frames in a row
// under 60 ms, or once frames are steady enough after 2.5 s, or after 6 s whatever happens.
async function warmUp() {
  try { await renderer.compileAsync(scene, camera); } catch { /* compiled on first use instead */ }
  requestAnimationFrame(tick);
  const t0 = performance.now();
  let last = t0, smooth = 0;
  for (;;) {
    await new Promise((r) => requestAnimationFrame(r));
    const now = performance.now(), gap = now - last;
    last = now;
    smooth = gap < 60 ? smooth + 1 : 0;
    if (smooth >= 3 || (now - t0 > 2500 && gap < 150) || now - t0 > 6000) return;
  }
}

// average over `seconds` of frames, starting at the next stats window (for tools/bench_page.mjs)
function measure(seconds = 3) {
  return new Promise((resolve) => {
    Object.assign(acc, { frames: 0, time: 0, cpu: 0, anim: 0, gpu: 0, gpuN: 0 });
    measuring = { seconds, resolve };
  });
}

// camera spots: every section's scene.json views (a name used by two sections gets its section's prefix), loaded or
// not: view() takes you there and resolves once the window round it is in
const views = {};
let spawnView = null;
// stand at a named view (facing_deg 0 = +X, 90 = north; the walker's yaw 0 looks down -z)
function view(name) {
  const v = views[name] || spawnView;
  player.pos.set(v.X, (v.H || 0) + 0.2, -v.D);
  player.vel.set(0, 0, 0);
  player.yaw = deg(v.facing_deg) - Math.PI / 2;
  player.pitch = deg(v.pitch_deg || 0);
  if (player.mode === 'third' && !v.pitch_deg) player.pitch = -0.2; // look down on yourself a little, as Messenger does
  avatarYaw = player.yaw + Math.PI;
  return people ? goto() : Promise.resolve();
}

// the walkable world's ground box and the backdrop, rebuilt when a section joins or leaves
async function rebuildBackdrop() {
  const old = backdrop;
  const box = new THREE.Box3();
  for (const sec of sections.values()) { const g = sec.root.getObjectByName('g_ground__col'); if (g) box.union(new THREE.Box3().setFromObject(g)); }
  const list = ordered().map((x) => ({ name: x.name, layout: x.layout, cfg: x.backdrop, base: x.base }));
  const next = list.length ? await setupBackdrop(scene, post, list, {
    seams: seams(), extent: box.isEmpty() ? null : { x0: box.min.x, x1: box.max.x, y0: -box.max.z, y1: -box.min.z },
    textures: { get: (url) => texCache.image(url), release: (url) => texCache.release(url) }, world: index.map((e) => e.corners),
    walkable: MIST_WALK ? [...sections.values()].flatMap((x) => x.walkable || []) : [],
  }) : null;
  // the old ring goes once the new one stands (its panels' textures are still held by the new one where kept)
  if (old) { old.dispose(); for (const m of old.meshes) without(noNormalPass, m); }
  backdrop = next;
  if (backdrop) noNormalPass.push(...backdrop.meshes);
  applyLight();
}

try {
  // the start screen (ui/start.js) waits for 入畫 while the first load runs behind it (the user, 2026-10-13: preload at
  // the start screen, then the progressive loading as before): the small JSONs, your section, its kit and your
  // character, its shaders compiled, then its cast. The press finds them in; the frames, the paper and the stream of the
  // rest of the window wait for it. A visitor who leaves without pressing has spent that download (the user's call).
  // Without the screen (?start=0, the headless tools) it resolves at once and the order is as before.
  let pressedNow = false;
  const pressed = waitForStart(query).then((glide) => { pressedNow = true; return { glide, at: performance.now() }; });
  applyLight();
  resize();
  // every section's painted area and camera spots, then the section you start in and only the characters it casts
  // (and yours); the rest of the window streams in after the world shows
  let ktx2;
  [reg, beastReg, ktx2, clipMeta, clipFiles] = await Promise.all([fetch('assets/chars/characters.json').then((r) => r.json()), json('assets/animals/animals.json').then((r) => r || {}),
    json('assets/ktx2.json'), query.get('clipmeta') === '0' ? null : json('assets/clip_meta.json'), query.get('clipfiles') === '0' ? null : json('assets/chars/clips.json'), buildIndex()]);
  ui.progress(0.25, 0.6);
  texCache.useKtx2(ktx2, renderer, query.get('ktx2')); // the GPU-compressed copies of the adopted kinds (assets.js)
  renderer.domElement.addEventListener('webglcontextrestored', () => texCache.restoreKtx());
  if (!index.length) throw new Error('no sections');
  const firstEntry = index.find((e) => e.name === NAMES[0]) || index[0];
  // the start: ?spawn=, else the page's data-spawn when it lists its own sections (world.html: the whole scroll, started
  // in the inner city as before), else the first section's spawn
  const spawnName = query.get('spawn') || (query.has('sections') ? null : document.body.dataset.spawn);
  spawnView = views[spawnName] || firstEntry.spawn || Object.values(firstEntry.views)[0] || Object.values(views)[0];
  player.pos.set(spawnView.X, (spawnView.H || 0) + 0.2, -spawnView.D);
  wanted(true); // your section
  const start = index[stream.cur];
  people = new People(models, hooks);
  people.player = player.pos;
  people.camera = camera;
  crowdOverlay = people.crowd?.normalPass() || null;
  if (people.crowd) people.crowd.shadowFar = tiers.cfg.shadow.peopleFar;
  if (people.crowd) people.crowd.lodFar = peopleLod(tiers.cfg);
  if (people.crowd) people.crowd.lodSplit = query.get('lodsplit') === '1'; // far people drawn apart (crowd.js; real-phone tests)
  player.pushOut = (pos, r) => { const moved = people.pushOut(pos, r); if (moved) sound?.bump(); return moved; };
  // ambient life (ambient.js): birds, sparrows, catkins, smoke and the cloth in the wind, placed from each loaded section's map
  try { createAmbient({ scene, camera, player, sections, people: () => people, hour: () => s.hour, query }); } catch (err) { console.warn('ambient off:', err); }
  const startAvatar = reg[s.avatar]?.file ? s.avatar : 'sightseer';
  const [first] = await Promise.all([fetchSection(start.name), ensureModels([startAvatar, ...PINNED.filter((n) => reg[n]?.file)], new Map([[startAvatar, AVATAR_CLIPS]]))]);
  ui.progress(0.65, 0.9);
  useModels('pin', PINNED.filter((n) => models[n]));
  start.state = 'in';
  start.sec = first;
  // you walk as soon as your section, its kit and your character are in (the perf batch); its cast and trees follow
  // as the first streaming operation, before any neighbour
  await addSection(first, { defer: true });
  stream.pending.push(async () => {
    beginOp('load', `${first.name}: people and trees`);
    const cast = modelsOf(first);
    await step('models', () => ensureModels(cast, clipsOf(first)));
    useModels(first.name, cast);
    if (sections.get(first.name) === first) await finishSection(first);
    endOp();
  });
  // still on the start screen: your section's cast comes next (that op above then finds it in)
  if (!pressedNow) ensureModels(modelsOf(first), clipsOf(first)).catch((err) => console.warn('cast preload:', err));
  const press = await pressed;
  ui.progress(0.92, 0.98);
  followCam = new FollowCam(camera, player, { distance: s.camDistance });
  if (!models[s.avatar]) s.avatar = 'sightseer';
  await setAvatar(s.avatar);
  view();
  await warmUp(); // the first frames run under the paper (gen/ui/r2_time.md, "The loading stall")
  const glideLeft = press.glide - (performance.now() - press.at); // the band lands where you start before the paper lifts
  if (glideLeft > 0) await new Promise((r) => setTimeout(r, glideLeft));
  ui.loaded(); // #loading loses its id at once, then its paper wipes away (ui/loading.js)
  startSound();
  you.add(s, 'avatar', Object.keys(reg).filter((n) => reg[n]?.file).sort()).name('your character').onChange(ch('avatar'));
  // the rest of the window streams in while you look round; the test hooks appear once it is in, so the tools
  // (shots, walks, people, bench) start from a settled world, and goto()/view() move the window with them
  await settle(false); // the window, and your own section's people and trees (they come after the loading screen; small cards may still be sharpening)
  window.__test = {
    THREE, scene, camera, player, people, s, renderer, measure, view, goto, views: Object.keys(views), hud, boats,
    trees3d, // the 3D trees (trees3d.js: stats(), applyTier(cfg)); null with ?trees=cards
    tiers, post, // the device tier (tiers.js: stats(), apply(name, why)) and the ink pass (post.js)
    details: detailStats, // the detail systems' draws, triangles, instances, CPU ms (detail.js)
    cells: { stats: () => cells.stats(camera), cells }, // the world in cells (cells.js)
    clipMeta: CLIP_META, loader, // what the page measured of each clip (tools/people_precompute.mjs)
    shadows: () => ({ ...shadowState, half: SHADOW_HALF, size: sun.shadow.mapSize.x, centre: shadowCenter.toArray() }), // the shadow policy
    shadowLayers, // the two layers: on (false: one layer, as ?shadowcache=0), world (due), worldDraws, moverDraws
    // every section of the world (loaded or not): a loaded one is its section, the others { name, state }
    get sections() { return new Map(index.map((e) => [e.name, e.sec || { name: e.name, state: e.state }])); },
    loaded: sections, stream: { stats: streamStats, settle, internals: { index, models, modelUsers, stdByName, cardKinds, texCache, shaded, variants } },
    followCam, get avatar() { return avatar; },
    set: (k, v) => { s[k] = v; if (k === 'hour' || k === 'timeFlow') s.localTime = false; return onSettingChange(k); },
    gpuTimer: !!tq,
    gpuMem: () => gpuMem?.report() ?? null, gpuTextures: () => gpuMem?.textures() ?? null,
    sound: { unlock: () => sound?.unlock(), stats: () => sound?.stats() ?? null, fire: (k, n) => sound?.fire(k, n) ?? null },
    ui: ui.test, // the ink UI's hooks (ui/index.js): banner, toast, talk, state
    time, // the hour as the UI sets it: get, setHour(h, { scrub }), setFlow(word), toLocal() (gen/ui/r2_time.md)
  };
} catch (err) {
  console.error(err);
  $('loading') && ($('loading').textContent = 'Failed to load: ' + err.message);
}
