// People for the scene pages: load the characters (assets/chars/characters.json, built by tools/character.mjs) and
// run their routines. A routine is data (sections/<name>/people.json):
//   figures  a scroll figure stays at its spot (the scroll map's layout.json) and cycles through actions: do [[clip, s], ...]
//   walkers  someone follows a path back and forth at their own pace, pausing at the ends
//   traffic  a seeded crowd on lanes along a path: mixed characters and paces, stops to look around, pairs who
//            walk side by side and stop to talk
// Clips cross-fade. Clips that don't loop cleanly (text-to-motion ones, listed as `motion` in the registry) are
// looped by cross-fading into a second copy of themselves. Every clip is grounded at load (its lowest foot or leg
// bone is put where the bind pose has it), and locomotion clips lose their forward drift so paths own movement.
// Bodies and routing: everyone has a body; walkers look ahead and steer round whoever stands in their way (the
// player, figures, people who stopped), follow someone walking the same way, and when the way is shut on both sides
// they stop, face whoever blocks it, and soon turn round and go the other way (see "routing"). The player is pushed
// out of everyone (pushOut); anyone the camera ends up inside is hidden.
// Drawing (crowd.js): everyone run by a routine is drawn in one batch per character, with clips baked to a bone
// texture, so hundreds of people cost a few draws (?batch=0 on the page: one skinned mesh and mixer per person).
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Crowd, CrowdPerson } from './crowd.js';

const FADE = 0.45;
const BODY_R = 0.26; // a person's radius for collisions
const PLAYER_R = 0.3; // player.js RADIUS
// routing
const LOOK = 2.6, NEAR = 1.6; // metres ahead a walker plans round people / must get round them
const GAP = 0.16; // space kept between two bodies passing each other
const LAT_RATE = 0.8; // m/s a walker can move sideways (about 33 degrees off its line at walking pace)
const WAIT = [1.0, 2.0]; // seconds a walker whose way is shut waits before turning round
const PLAN_EVERY = 0.1;
const CSTEP = 0.5, CMAX = 2.4, CDL = 0.15; // corridor: samples along the path, how far and how finely to look sideways
const LOW_BONES = /(Foot|ToeBase|Leg|Hips)$/;
const ANIM_LOD = [22, 50]; // metres from the camera: pose every frame within the first, every 2nd within the second
const INK_FAR = 40; // metres: beyond this, people are left out of the ink pass's normal buffer (post.js)
const _fr = new THREE.Frustum(), _m4 = new THREE.Matrix4(), _sph = new THREE.Sphere(new THREE.Vector3(), 1.4), _q = new THREE.Vector3();

// ---------------------------------------------------------------- loading
// Each clip's grounding, stride and hips height are measured once offline (tools/people_precompute.mjs ->
// assets/clip_meta.json, per model file and clip) and only applied at load; a clip the file doesn't know (or whose
// keys changed) is measured here as before. What the page measured is kept in CLIP_META (the tool reads it).
export const CLIP_META = {};
// pause (optional): awaited before each model is prepared, so a streaming page spreads the work over frames
// meta (optional): assets/clip_meta.json
export async function loadCharacters(loader, url = 'assets/chars/characters.json', only = null, registry = null, pause = null, meta = null) {
  const reg = registry || await fetch(url).then((r) => r.json());
  const names = Object.keys(reg).filter((n) => reg[n]?.file && (!only || only.includes(n))); // skips 'about' and the like
  const models = {};
  let queue = Promise.resolve(); // one model prepared at a time, each after a pause
  await Promise.all(names.map(async (name) => {
    const gltf = await loader.loadAsync(reg[name].file);
    if (pause) { const turn = queue.then(pause); queue = turn; await turn; }
    const root = gltf.scene;
    // the body's height only: carried props and tack (prop_*, tack_*, hidden until a figure asks for them) are in
    // the same GLB, and a 4-6 m boat pole in the box shrank every porter, carter and boatman to about 0.6
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    root.traverse((o) => { if (o.isMesh && !/^(tack|prop)_/.test(o.name) && !/^(tack|prop)_/.test(o.parent?.name || '')) box.expandByObject(o); });
    if (box.isEmpty()) box.setFromObject(root);
    root.scale.multiplyScalar((reg[name].top_m || reg[name].height_m) / (box.max.y - box.min.y)); // animals: top_m is the full height (height_m is the withers)
    root.updateMatrixWorld(true);
    root.traverse((o) => { if (o.isBone) o.userData.rest = { p: o.position.clone(), q: o.quaternion.clone() }; });
    const clips = gltf.animations;
    const known = meta?.[reg[name].file] || {}, measured = (CLIP_META[reg[name].file] ||= {});
    for (const clip of clips) measured[clip.name] = prepareClip(root, clip, known[clip.name]);
    // an animal's walk is in place at its registry speed (animals.json walk.speed_mps at timeScale 1)
    const wc = reg[name].walk && clips.find((c) => c.name === (reg[name].walk.clip || 'walk'));
    if (wc) wc.userData = { ...(wc.userData || {}), stride: reg[name].walk.speed_mps };
    models[name] = { name, scene: root, clips, motion: new Set(reg[name].motion || []), info: reg[name] };
  }));
  return models;
}

function prepareClip(root, clip, known = null) {
  const hipsTrack = clip.tracks.find((t) => /Hips\.position$/.test(t.name));
  if (!hipsTrack) return null;
  const v = hipsTrack.values, n = v.length / 3;
  if (known && known.n === n && Math.abs(known.duration - clip.duration) < 1e-4) {
    // measured offline: drift removed and grounded the same way, without sampling the clip
    clip.userData = { speed: known.speed, locomotion: known.locomotion, stride: known.stride, hipsY: known.hipsY };
    if (known.locomotion) for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
    if (known.k) { for (let i = 1; i < v.length; i += 3) v[i] += known.k; clip.userData.grounded = known.grounded; }
    return known;
  }
  const hips = root.getObjectByName(hipsTrack.name.split('.')[0]);
  const ws = new THREE.Vector3();
  hips.parent.getWorldScale(ws);
  // horizontal travel of the root over the clip, in metres: locomotion if it moves more than 0.5 m
  const travel = Math.hypot(v[(n - 1) * 3] - v[0], v[(n - 1) * 3 + 2] - v[2]) * ws.x;
  clip.userData = { speed: travel / clip.duration, locomotion: travel > 0.5 };
  if (clip.userData.locomotion) for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
  // grounding: lowest foot/leg bone over the clip vs. in the bind pose
  const lowest = () => {
    root.updateMatrixWorld(true);
    let m = Infinity;
    root.traverse((o) => { if (o.isBone && LOW_BONES.test(o.name)) m = Math.min(m, o.getWorldPosition(ws).y); });
    return m;
  };
  const bind = lowest();
  const mixer = new THREE.AnimationMixer(root);
  const action = mixer.clipAction(clip).play();
  let low = Infinity;
  let hipsSum = 0;
  for (let i = 0; i < 12; i++) { action.time = (clip.duration * i) / 12; mixer.update(0); low = Math.min(low, lowest()); hipsSum += hips.getWorldPosition(ws).y; }
  // stride speed: the planted (lower) foot slides backward under the body at the walking speed
  const feet = ['LeftToeBase', 'RightToeBase'].map((n) => findBone(root, n)).filter(Boolean);
  if (feet.length === 2) {
    const N = 48, dt = clip.duration / N, fp = [new THREE.Vector3(), new THREE.Vector3()];
    let prev = null, dist = 0, time = 0;
    for (let i = 0; i <= N; i++) {
      action.time = Math.min(i * dt, clip.duration - 1e-4); mixer.update(0); root.updateMatrixWorld(true);
      feet.forEach((f, j) => f.getWorldPosition(fp[j]));
      const k = fp[0].y < fp[1].y ? 0 : 1;
      if (prev && prev.k === k) { dist += Math.hypot(fp[k].x - prev.x, fp[k].z - prev.z); time += dt; }
      prev = { k, x: fp[k].x, z: fp[k].z };
    }
    clip.userData.stride = time > 0 ? dist / time + (clip.userData.locomotion ? clip.userData.speed : 0) : 0;
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(root);
  root.traverse((o) => { if (o.isBone && o.userData.rest) { o.position.copy(o.userData.rest.p); o.quaternion.copy(o.userData.rest.q); } });
  const off = bind - low;
  clip.userData.hipsY = hipsSum / 12 + (Math.abs(off) > 0.03 ? off : 0); // the hips above the feet origin (a rider's seat)
  let k = 0;
  if (Math.abs(off) > 0.03) {
    k = off / ws.y;
    for (let i = 1; i < v.length; i += 3) v[i] += k;
    clip.userData.grounded = +off.toFixed(3);
  }
  const u = clip.userData;
  return { n, duration: clip.duration, speed: u.speed, locomotion: u.locomotion, stride: u.stride, hipsY: u.hipsY, k, grounded: u.grounded };
}

// ---------------------------------------------------------------- one person
class Person {
  constructor(model, hooks) {
    this.model = model;
    this.root = SkeletonUtils.clone(model.scene);
    this.root.traverse((o) => { if (o.isMesh) { hooks.onMesh(o); if (/^(tack|prop)_/.test(o.name)) o.visible = false; } }); // optional parts: off until asked for
    this.mixer = new THREE.AnimationMixer(this.root);
    this.twins = new Map(); // clip name -> [action, action] for seam-free looping
    this.action = null;
    this.clip = null;
    this.animDt = 0; // time the mixer still has to catch up (animation level of detail, People.update)
    this.phase = Math.floor(Math.random() * 8);
  }

  has(name) { return this.model.clips.some((c) => c.name === name); }

  actionsFor(name) {
    let t = this.twins.get(name);
    if (!t) {
      const clip = this.model.clips.find((c) => c.name === name) || this.model.clips.find((c) => c.name === 'idle');
      const b = clip.clone();
      t = [this.mixer.clipAction(clip), this.mixer.clipAction(b)];
      this.twins.set(name, t);
    }
    return t;
  }

  play(name, { fade = FADE, timeScale = 1, offset = 0 } = {}) {
    if (!this.has(name)) name = this.has('idle') ? 'idle' : this.model.clips[0].name;
    const [a, b] = this.actionsFor(name);
    const next = this.action === a ? b : a;
    next.reset();
    next.timeScale = timeScale;
    next.time = offset % next.getClip().duration;
    next.play();
    if (this.action && fade > 0) this.action.crossFadeTo(next, fade, false);
    else if (this.action) this.action.stop();
    this.action = next;
    this.clip = name;
  }

  // keep a clip going: clips that don't loop cleanly cross-fade into their twin just before the end
  keepLooping() {
    if (!this.action || !this.model.motion.has(this.clip)) return;
    const d = this.action.getClip().duration;
    if (this.action.time > d - FADE - 0.05) this.play(this.clip, { timeScale: this.action.timeScale });
  }
}

// ---------------------------------------------------------------- paths
class Path {
  constructor(points) { // [[X, D], ...] in the section frame -> world x = X, z = -D
    this.p = points.map(([x, d]) => new THREE.Vector2(x, -d));
    this.cum = [0];
    for (let i = 1; i < this.p.length; i++) this.cum.push(this.cum[i - 1] + this.p[i].distanceTo(this.p[i - 1]));
    this.length = this.cum[this.cum.length - 1];
  }

  // unit normal of the path at distance s (the direction a positive sideways offset moves)
  normalAt(s, out) {
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < s) i++;
    const a = this.p[i - 1], b = this.p[i], len = a.distanceTo(b) || 1;
    return out.set(-(b.y - a.y) / len, (b.x - a.x) / len);
  }

  // tangent T (the way s grows) and normal N (the way a positive sideways offset moves) at s, as (x, z) pairs
  frame(s, T, N) { this.normalAt(s, N); return T.set(N.y, -N.x); }

  // the corridor (set by People.corridorFor): the sideways offsets a body's centre can take, over [s0, s1]
  bounds(s0, s1, out) {
    if (!this.lo) return out.set(-1, 1);
    const i0 = Math.max(0, Math.floor(Math.min(s0, s1) / CSTEP)), i1 = Math.min(this.lo.length - 1, Math.ceil(Math.max(s0, s1) / CSTEP));
    let lo = -Infinity, hi = Infinity;
    for (let i = i0; i <= i1; i++) { lo = Math.max(lo, this.lo[i]); hi = Math.min(hi, this.hi[i]); }
    return lo > hi ? out.set((lo + hi) / 2, (lo + hi) / 2) : out.set(lo, hi);
  }

  // distance along the path of the point nearest to [X, D]
  nearest(X, D) {
    let best = 0, bd = Infinity;
    const q = new THREE.Vector3();
    for (let s = 0; s <= this.length; s += 0.25) { this.at(s, 0, q); const d = Math.hypot(q.x - X, q.z + D); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  // point at distance s with a sideways offset (metres, + = left of the direction of travel); returns heading
  at(s, lateral, out) {
    s = THREE.MathUtils.clamp(s, 0, this.length);
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < s) i++;
    const a = this.p[i - 1], b = this.p[i], t = (s - this.cum[i - 1]) / Math.max(1e-6, this.cum[i] - this.cum[i - 1]);
    const dx = b.x - a.x, dz = b.y - a.y, len = Math.hypot(dx, dz) || 1;
    out.set(a.x + dx * t - (dz / len) * lateral, 0, a.y + dz * t + (dx / len) * lateral);
    return Math.atan2(dx, dz);
  }
}

// ---------------------------------------------------------------- the routines
const rand = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = (r, list) => list[Math.floor(r() * list.length)];
const between = (r, [a, b]) => a + (b - a) * r();
const deg = THREE.MathUtils.degToRad;
const turnToward = (cur, target, maxStep) => {
  let d = ((target - cur + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return cur + THREE.MathUtils.clamp(d, -maxStep, maxStep);
};

export class People {
  // hooks: { scene, onMesh(mesh), ground(x, z, fromY) -> y }
  constructor(models, hooks) {
    this.models = models;
    this.hooks = hooks;
    this.all = [];
    this.agents = [];
    this.walkers = [];
    this.farMeshes = []; // people's meshes past INK_FAR this frame (left out of the normal pass)
    this.riders = []; // { p, beast }: placed on their animals every frame
    this.v = new THREE.Vector3();
    this.n = new THREE.Vector2();
    this.T = new THREE.Vector2();
    this.N = new THREE.Vector2();
    this.c = new THREE.Vector3();
    this.bounds = new THREE.Vector2();
    this.agentOf = new Map(); // person -> the walker running it (or the boat carrying it, when that one moves)
    this.attached = []; // { p, place(p, dt) }: people placed by someone else every frame (a boat's crew: boats.js)
    this.corridors = new Map(); // path points -> measured corridor (shared by everyone on that path)
    this.player = null; // the player's feet position (Vector3), set by the page
    this.camera = null; // to hide anyone the camera is inside
    // everyone run by a routine is drawn in batches, one draw per character (crowd.js); hooks.batch === false (the
    // page's ?batch=0) gives each person their own skinned mesh and mixer, as before, for A/B
    this.crowd = hooks.batch === false ? null : new Crowd(hooks, { inkFar: INK_FAR });
  }

  // a person who isn't run by a routine (the player's avatar)
  createPerson(character) {
    const p = new Person(this.models[character], this.hooks);
    this.hooks.scene.add(p.root);
    return p;
  }

  spawn(character) {
    const model = this.models[character];
    if (!model) throw new Error(`no character "${character}" in characters.json`);
    if (this.crowd) { const p = new CrowdPerson(model, this.crowd, FADE); this.all.push(p); return p; }
    const p = new Person(model, this.hooks);
    this.hooks.scene.add(p.root);
    this.all.push(p);
    return p;
  }

  // what a figure carries (people.json "props": the character's prop_<name> parts, e.g. a shoulder pole and baskets)
  carry(p, props) {
    const names = [].concat(props || []);
    if (!names.length) return;
    if (this.crowd) this.crowd.setLoads(p, names, 'prop_');
    else p.root.traverse((o) => { if (o.isMesh && /^prop_/.test(o.name)) o.visible = names.includes(o.name.slice(5)); });
  }

  // a scroll figure at its spot, cycling through actions
  addFigure(f, spec, offsetX = 0) {
    const p = this.spawn(spec.character);
    this.carry(p, spec.props);
    const [nx, nd] = spec.nudge || [0, 0];
    const x = f.X + nx + offsetX, z = -(f.D + nd);
    if (spec.scale) p.root.scale.multiplyScalar(spec.scale); // children (painted small): times the character's own size
    p.root.position.set(x, this.hooks.ground(x, z, (f.H || 0) + 1.2), z);
    p.root.rotation.y = deg(spec.facing_deg ?? f.facing_deg) + Math.PI / 2; // the rig faces +Z; facing 0 = +X
    p.id = f.id;
    // a figure on a boat (layout support "boat deck: <id>", or listed in people.json boats): the page's host places it
    // every frame, in the boat's frame (hooks.host: boats.js host)
    const host = this.hooks.host?.(f, spec, p, this);
    if (host) {
      this.attached.push({ p, place: host.place });
      host.place(p, 0);
      if (host.moving) this.agentOf.set(p, { p, boat: true });
      if (host.drivesClips) { const a = { p, update: () => {} }; this.agents.push(a); return p; }
    }
    // a rider sits on its painted animal (people.json animals; add the animals first): its hips at the animal's
    // saddle point (animals.json saddle.rest), turned with it, playing its ride clip; no body of its own
    if (spec.ride) {
      const beast = this.all.find((q) => q.id === spec.ride && q.body);
      // ride_turn_deg: a rider sitting sideways (the elder's ride_side) faces 90 degrees off the animal's heading
      const turn = deg(spec.ride_turn_deg ?? ((spec.do || []).some(([c]) => c === 'ride_side') ? 90 : 0));
      if (beast) { this.riders.push({ p, beast, turn }); p.body = { r: 0, along: [] }; }
    }
    const steps = spec.do || (spec.ride ? [['ride', 8]] : [['idle', 6]]);
    const r = rand(hash(f.id));
    const agent = { p, step: Math.floor(r() * steps.length), left: 0, update: null };
    const next = () => {
      agent.step = (agent.step + 1) % steps.length;
      const [clip, secs] = steps[agent.step];
      p.play(clip, { offset: r() * 3 });
      agent.left = secs * (0.8 + 0.4 * r());
    };
    agent.step--;
    next();
    p.expect?.(steps.map(([c]) => c)); // every clip of the cycle baked while the section loads (crowd.js)
    agent.update = (dt) => { agent.left -= dt; if (agent.left <= 0) next(); else p.keepLooping(); };
    this.agents.push(agent);
    return p;
  }

  // a painted animal at its spot (map/BUILDING.md): e = its layout.json entity (pos between the hooves, pts.fore and
  // pts.hind), spec = people.json animals[slug]: model (an animal type in assets/animals/animals.json), do [[clip, s]],
  // optional load, scale, nudge, facing_deg. It faces from its hind to its fore hooves as painted, cycles its actions,
  // and its body is a row of circles along its length (registry length_m, width_m).
  addAnimal(e, spec, id) {
    const info = this.models[spec.model].info || {};
    const [nx, nd] = spec.nudge || [0, 0];
    const x = e.pos[0] + nx, z = -(e.pos[1] + nd);
    // painted walking with nobody leading it away (a pig herd): it walks its short path back and forth
    const walker = spec.path ? this.addWalker({ id, character: spec.model, clip: 'walk', speed: info.walk?.speed_mps || 1,
      pause: ['idle', 4], path: spec.path, startAt: [x, -z] }) : null;
    const p = walker ? walker.p : this.spawn(spec.model);
    if (spec.scale) p.root.scale.multiplyScalar(spec.scale);
    // a perched animal (the bird in the willow) sits at its painted height, not on the ground below it
    if (!walker) p.root.position.set(x, info.perch ? (e.H || 0) + (info.perch.rest?.[1] || 0) : this.hooks.ground(x, z, (e.H || 0) + 1.2), z);
    const f = e.pts?.fore, h = e.pts?.hind;
    const facing = spec.facing_deg ?? (f && h && Math.hypot(f[0] - h[0], f[1] - h[1]) > 0.05
      ? THREE.MathUtils.radToDeg(Math.atan2(f[1] - h[1], f[0] - h[0])) : e.facing_deg ?? 0);
    if (!walker) p.root.rotation.y = deg(facing) + Math.PI / 2; // the model faces +Z, as the characters do; facing 0 = +X
    const k = spec.scale || 1, L = (info.length_m || 2) * k, r = ((info.width_m || 0.6) * k) / 2;
    const n = Math.max(1, Math.round(L / (2 * r)));
    p.body = { r, along: Array.from({ length: n }, (_, i) => (n === 1 ? 0 : -L / 2 + r + (i * (L - 2 * r)) / (n - 1))) };
    p.id = id;
    // its painted tack and load: the model's tack_<name> parts, switched on by people.json "load" (a name or a list)
    const loads = (p.loads = [].concat(spec.load || []));
    if (this.crowd) this.crowd.setLoads(p, loads);
    else p.root.traverse((o) => { if (o.isMesh && /^tack_/.test(o.name)) o.visible = loads.includes(o.name.slice(5)); });
    if (walker) return p;
    const steps = spec.do || [['idle', 8]];
    const rr = rand(hash(id));
    const agent = { p, step: Math.floor(rr() * steps.length), left: 0, update: null };
    const next = () => {
      agent.step = (agent.step + 1) % steps.length;
      const [clip, secs] = steps[agent.step];
      p.play(clip, { offset: rr() * 3 });
      agent.left = secs * (0.8 + 0.4 * rr());
    };
    agent.step--;
    next();
    p.expect?.(steps.map(([c]) => c));
    agent.update = (dt) => { agent.left -= dt; if (agent.left <= 0) next(); else p.keepLooping(); };
    this.agents.push(agent);
    return p;
  }

  // someone walking a path back and forth (e.g. the porter crossing the bridge into the city)
  addWalker(spec, offsetX = 0) {
    const path = new Path(spec.path.map(([x, d]) => [x + offsetX, d]));
    const p = this.spawn(spec.character);
    this.carry(p, spec.props);
    p.id = spec.id;
    if (spec.scale) p.root.scale.multiplyScalar(spec.scale);
    const r = rand(hash(spec.id || spec.character));
    const a = { p, path, s: spec.startAt ? path.nearest(spec.startAt[0] + offsetX, spec.startAt[1]) : (spec.start ?? r()) * path.length, dir: spec.dir || 1, lateral: spec.lateral || 0, speed: spec.speed || 1.2,
      walk: spec.clip || 'walk', pause: spec.pause || ['idle', 3], stops: spec.stops || [], stopEvery: spec.stop_every || [25, 60],
      stopFor: spec.stop_for || [3, 7], r, state: 'walk', left: 0, heading: 0 };
    a.nextStop = between(r, a.stopEvery);
    this.corridorFor(path);
    a.l = a.targetL = this.laneOf(a); // sideways offset from the path (along its normal), and where it steers to
    Object.assign(a, { brake: 1, brakeTarget: 1, blockedBy: null, planT: r() * PLAN_EVERY, sOff: 0, sOffTarget: 0 });
    this.startWalking(a);
    p.expect?.([a.walk, a.pause[0], 'idle', ...a.stops, ...(spec.talk || [])]); // its pauses, stops and halts (idle)
    a.update = (dt) => this.walkStep(a, dt);
    this.agents.push(a);
    this.walkers.push(a);
    this.agentOf.set(p, a);
    return a;
  }

  // corridors measured offline for a section's walkers (tools/people_precompute.mjs -> assets/<name>/corridors.json:
  // { key: { lo, hi } } by path key, as corridorFor measures them)
  seedCorridors(list) {
    let n = 0;
    for (const [key, c] of Object.entries(list || {})) if (!this.corridors.has(key)) { this.corridors.set(key, { lo: Float32Array.from(c.lo), hi: Float32Array.from(c.hi), seeded: true }); n++; }
    return n;
  }

  // the offset a walker keeps to when nothing is in its way: its lane on its side of the road, or beside its leader
  laneOf(a) { return a.follower ? a.leader.l + a.gap * a.dir : a.lateral * a.dir; }

  // measure a path's corridor once: from each point of the centre line, step sideways until a wall, railing or
  // trunk is in the way (hooks.blocked, at knee and chest height) or the ground steps by more than a curb (the moat
  // banks, the edge of the bridge); keep a body's radius from it
  corridorFor(path) {
    const key = path.p.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' ');
    let c = this.corridors.get(key);
    if (!c) {
      const h = this.hooks, n = Math.floor(path.length / CSTEP) + 1, q = new THREE.Vector3(), N = new THREE.Vector2();
      c = { lo: new Float32Array(n), hi: new Float32Array(n) };
      path.at(0, 0, q);
      let y = h.ground(q.x, q.z, 3);
      for (let i = 0; i < n; i++) {
        const s = Math.min(i * CSTEP, path.length);
        path.at(s, 0, q);
        path.normalAt(s, N);
        const g = h.ground(q.x, q.z, y + 1.5);
        if (Math.abs(g - y) < 0.5) y = g;
        for (const side of [1, -1]) {
          let free = 0, gy = y;
          for (let l = CDL; l <= CMAX + 1e-6; l += CDL) {
            const x0 = q.x + N.x * side * (l - CDL), z0 = q.z + N.y * side * (l - CDL), x1 = q.x + N.x * side * l, z1 = q.z + N.y * side * l;
            if (h.blocked && (h.blocked(x0, z0, x1, z1, gy + 0.45) || h.blocked(x0, z0, x1, z1, gy + 1.1))) break;
            const g1 = h.ground(x1, z1, gy + 1.0);
            if (Math.abs(g1 - gy) > 0.25 || Math.abs(g1 - y) > 0.4) break;
            gy = g1;
            free = l;
          }
          const lim = free >= CMAX - 1e-6 ? free : free - BODY_R + CDL / 2;
          if (side > 0) c.hi[i] = lim; else c.lo[i] = -lim;
        }
      }
      this.corridors.set(key, c);
    }
    path.key = key;
    path.lo = c.lo;
    path.hi = c.hi;
  }

  startWalking(a) {
    const clip = a.p.model.clips.find((c) => c.name === a.walk);
    const natural = clip?.userData?.stride > 0.3 ? clip.userData.stride : 1.25;
    a.baseTS = THREE.MathUtils.clamp(a.speed / natural, 0.5, 2.5);
    a.p.play(a.walk, { timeScale: a.baseTS, offset: a.r() });
    a.state = 'walk';
  }

  walkStep(a, dt) {
    const p = a.p;
    a.planT -= dt;
    if (a.planT <= 0 && a.state !== 'stop' && a.state !== 'end') { a.planT = PLAN_EVERY; this.plan(a); }
    a.brake += (a.brakeTarget - a.brake) * Math.min(1, dt * 8);
    if (a.follower) {
      // a pair walks abreast: the follower keeps its leader's place along the path (or drops in behind it where
      // there's no room beside), its pace and its turns; the leader starts and stops them both
      const L = a.leader;
      a.dir = L.dir;
      a.sOff += THREE.MathUtils.clamp(a.sOffTarget - a.sOff, -dt, dt);
      a.s = THREE.MathUtils.clamp(L.s + a.sOff * a.dir, 0, a.path.length);
      if (a.state === 'walk' && p.action && L.baseTS) p.action.timeScale = a.baseTS * Math.max(0.75, L.brake);
      else if (a.state !== 'walk') p.keepLooping();
    } else if (a.state === 'walk') {
      if (a.blockedBy) {
        this.halt(a, 'blocked');
        a.left = between(a.r, WAIT);
      } else if (a.brake < 0.35 && Math.abs(a.targetL - a.l) < 0.1) {
        this.halt(a, 'queue'); // close behind someone with nowhere to step aside: stand, don't shuffle in slow motion
        a.left = between(a.r, [3, 5]);
      } else {
        const step = a.speed * a.brake * dt;
        a.s += a.dir * step;
        a.nextStop -= step;
        if (p.action && a.baseTS) p.action.timeScale = a.baseTS * Math.max(0.75, a.brake);
        if (a.s >= a.path.length || a.s <= 0) {
          a.s = THREE.MathUtils.clamp(a.s, 0, a.path.length);
          a.state = 'end';
          a.left = between(a.r, [a.pause[1] * 0.7, a.pause[1] * 1.3]);
          p.play(a.pause[0]);
          if (a.partner) this.partnerStop(a, a.pause[0]);
        } else if (a.nextStop <= 0 && a.stops.length) {
          a.nextStop = between(a.r, a.stopEvery);
          a.state = 'stop';
          a.left = between(a.r, a.stopFor);
          // stop and look at the view (turn to one side), or face the partner and talk
          a.look = a.partner ? 0 : (a.r() < 0.5 ? 1 : -1) * deg(60 + 50 * a.r());
          const clip = a.partner ? pick(a.r, a.talk || ['idle']) : pick(a.r, a.stops);
          p.play(clip);
          if (a.partner) this.partnerStop(a, pick(a.r, a.partner.talk || ['idle']));
        }
      }
    } else if (a.state === 'queue') {
      a.left -= dt;
      if (a.blockedBy) { this.halt(a, 'blocked'); a.left = between(a.r, WAIT); } else if (a.brakeTarget > 0.7 || Math.abs(a.targetL - a.l) > 0.15) this.resume(a);
      else if (a.left <= 0) { a.dir *= -1; this.resume(a); } // whoever is ahead isn't moving on: go the other way
    } else if (a.state === 'blocked') {
      a.left -= dt;
      if (!a.blockedBy) this.resume(a); // a way round opened up
      else if (a.left <= 0) { a.dir *= -1; a.blockedBy = null; this.resume(a); } // still shut: turn round, go the other way
    } else {
      p.keepLooping();
      a.left -= dt;
      if (a.left <= 0) {
        if (a.state === 'end') a.dir *= -1;
        this.resume(a);
      }
    }
    // steer sideways towards the planned offset while walking
    const walking = a.state === 'walk' && (!a.follower || a.leader.state === 'walk');
    const dl = walking ? THREE.MathUtils.clamp(a.targetL - a.l, -LAT_RATE * dt, LAT_RATE * dt) : 0;
    a.l += dl;
    const pathHeading = a.path.at(a.s, a.l, this.v) + (a.dir < 0 ? Math.PI : 0);
    let target = pathHeading;
    if (walking) {
      // face the way the body actually moves (along the path plus sideways), not along the path
      const T = a.path.frame(a.s, this.T, this.N), N = this.N, f = a.speed * a.brake * a.dir, lv = dl / Math.max(dt, 1e-4);
      target = Math.atan2(T.x * f + N.x * lv, T.y * f + N.y * lv);
    }
    if (a.state === 'stop' && !a.partner && !a.follower) target = pathHeading + a.look;
    if (a.state === 'blocked' && a.blockedBy) target = Math.atan2(a.blockedBy.x - p.root.position.x, a.blockedBy.z - p.root.position.z);
    if (a.facePartner) target = Math.atan2(a.facePartner.root.position.x - p.root.position.x, a.facePartner.root.position.z - p.root.position.z);
    a.heading = turnToward(a.heading ?? pathHeading, target, dt * 4);
    if (a.state === 'walk') a.facePartner = null;
    // follow the ground (10 checks a second is plenty at walking pace), but step over nothing taller than a curb
    // and never drop into a hole
    let y = p.root.position.y;
    a.groundT = (a.groundT ?? a.r() * 0.1) - dt;
    if (a.groundT <= 0 || !a.placed) {
      a.groundT = 0.1;
      const g = this.hooks.ground(this.v.x, this.v.z, y + 1.5);
      if (!a.placed || Math.abs(g - y) <= 0.35) a.groundY = g;
      a.placed = true;
    }
    y += (a.groundY - y) * Math.min(1, dt * 12);
    p.root.position.set(this.v.x, y, this.v.z);
    p.root.rotation.y = a.heading;
  }

  // stand (calm idle) in a queue or where the way is shut; a pair stands together
  halt(a, state) {
    a.state = state;
    a.p.play('idle');
    if (a.partner) { a.partner.state = state; a.partner.p.play('idle'); }
  }

  resume(a) {
    this.startWalking(a);
    if (a.partner) { a.partner.dir = a.dir; this.startWalking(a.partner); }
  }

  // ---------------------------------------------------------------- routing
  // Every PLAN_EVERY seconds a walker looks LOOK metres ahead along its path. Each body there (the player, figures,
  // anyone standing or walking towards it) shuts a span of sideways offsets: its width plus the walker's plus a
  // gap. Inside the corridor (how far the road is free to each side, measured against the world when the path is
  // made), the walker steers to the free offset nearest to where it is, drifting back to its lane once clear, so it
  // keeps to its side of whoever it passes. Someone walking the same way at about its pace is followed, not
  // overtaken. A body it is heading into is met with a slowdown only if it can't get round in time. If no offset is
  // free and the nearest body is close, blockedBy is set: the walker stops, faces it, and turns round if it stays.
  plan(a) {
    const P = a.path, T = P.frame(a.s, this.T, this.N), N = this.N, c = this.c;
    P.at(a.s, 0, c);
    const me = a.p.root.position, partner = a.partner || a.leader;
    const spans = [];
    let follow = Infinity, nearest = null, nearD = Infinity;
    const body = (q, r, b) => {
      if (Math.abs(q.y - me.y) > 1.2) return;
      const rx = q.x - c.x, rz = q.z - c.z, along = (rx * T.x + rz * T.y) * a.dir, side = rx * N.x + rz * N.y;
      if (along < -0.6 || along > LOOK) return;
      const w = r + BODY_R + GAP;
      // walking the same way at about my pace, ahead of me on my line: follow it
      if (b && b.state === 'walk' && b.dir === a.dir && b.speed * b.brake >= 0.8 * a.speed && along > 0.2) {
        if (Math.abs(side - a.l) < w) follow = Math.min(follow, along);
        return;
      }
      spans.push({ lo: side - w, hi: side + w, along, q });
    };
    for (const p of this.all) {
      if (p === a.p || p === partner?.p) continue;
      if (!p.body) { body(p.root.position, BODY_R, this.agentOf.get(p)); continue; }
      for (const [x, z, r] of circlesOf(p)) body(_q.set(x, p.root.position.y, z), r, null);
    }
    if (this.player) body(this.player, PLAYER_R, null);
    const lane0 = this.laneOf(a);
    // the free offsets: the corridor minus every span. Plan round everyone within LOOK if there's a way; if not,
    // round those within NEAR only (people further on may have moved by then)
    const freeOf = (reach) => {
      const [lo, hi] = P.bounds(a.s - 0.3 * a.dir, a.s + reach * a.dir, this.bounds).toArray();
      let free = [[lo, hi]];
      for (const sp of spans) {
        if (sp.along > reach) continue;
        const next = [];
        for (const [f0, f1] of free) {
          if (sp.hi <= f0 || sp.lo >= f1) { next.push([f0, f1]); continue; }
          if (sp.lo > f0) next.push([f0, sp.lo]);
          if (sp.hi < f1) next.push([sp.hi, f1]);
        }
        free = next;
      }
      return { free, lo, hi };
    };
    let { free, lo, hi } = freeOf(LOOK);
    if (!free.length) ({ free, lo, hi } = freeOf(NEAR));
    const lane = THREE.MathUtils.clamp(lane0, lo, hi);
    const mine = free.find(([f0, f1]) => a.l >= f0 - 0.02 && a.l <= f1 + 0.02);
    let target;
    if (a.follower) {
      // beside the leader if there's room on this side of everyone; otherwise in single file behind it
      const ok = (mine && lane >= mine[0] && lane <= mine[1]) || (!mine && free.some(([f0, f1]) => lane >= f0 && lane <= f1));
      a.sOffTarget = ok ? 0 : -0.8;
      target = ok ? lane : a.leader.l;
    } else if (mine) target = THREE.MathUtils.clamp(lane, mine[0], mine[1]);
    else if (free.length) {
      let best = Infinity;
      for (const [f0, f1] of free) {
        const x = THREE.MathUtils.clamp(a.l, f0, f1), cost = Math.abs(x - a.l) + 0.25 * Math.abs(x - lane);
        if (cost < best) { best = cost; target = x; }
      }
    } else target = a.l;
    a.targetL = target;
    // slow down only for what it can't get round in time; follow at a comfortable distance
    let k = THREE.MathUtils.clamp((follow - 0.75) / 0.6, 0, 1);
    for (const sp of spans) {
      if (sp.along <= 0 || sp.along > NEAR || a.l <= sp.lo + 0.03 || a.l >= sp.hi - 0.03) continue;
      const clearIn = (Math.min(Math.abs(target - sp.lo), Math.abs(target - sp.hi)) + 0.05) / LAT_RATE;
      const reach = free.length ? clearIn * a.speed : 0;
      k = Math.min(k, THREE.MathUtils.clamp((sp.along - 0.6) / Math.max(0.3, reach), 0, 1));
      if (sp.along < nearD) { nearD = sp.along; nearest = sp.q; }
    }
    a.brakeTarget = k;
    a.blockedBy = !free.length && nearest && nearD < 1.5 ? nearest : null;
    if (this.debug) a.dbg = { free: free.map(([f0, f1]) => [+f0.toFixed(2), +f1.toFixed(2)]), spans: spans.map((sp) => [+sp.lo.toFixed(2), +sp.hi.toFixed(2), +sp.along.toFixed(2)]), lo: +lo.toFixed(2), hi: +hi.toFixed(2), follow: +follow.toFixed(2) };
  }

  partnerStop(a, clip) {
    const b = a.partner;
    b.state = a.state;
    b.p.play(clip);
    if (a.state === 'stop') { a.facePartner = b.p; b.facePartner = a.p; }
  }

  // a seeded crowd along a path: kinds = [{ character, clip, speed, weight, stops, talk }]
  addTraffic(spec, offsetX = 0) {
    const r = rand(spec.seed || 1);
    const kinds = spec.kinds.flatMap((k) => Array(k.weight || 1).fill(k));
    const made = [];
    let i = 0;
    while (made.length < spec.count) {
      const k = pick(r, kinds);
      const pair = r() < (spec.pairs || 0) && made.length < spec.count - 1;
      const base = {
        id: `traffic_${i++}`, character: k.character, clip: k.clip, speed: k.speed * (0.9 + 0.2 * r()), path: spec.path,
        start: r(), dir: r() < 0.5 ? 1 : -1, lateral: between(r, spec.lanes), stops: k.stops, pause: spec.pause,
        stop_every: spec.stop_every, stop_for: spec.stop_for,
      };
      const a = this.addWalker(base, offsetX);
      a.talk = k.talk;
      made.push(a);
      if (pair) {
        const k2 = pick(r, kinds.filter((q) => q.talk));
        const b = this.addWalker({ ...base, id: `traffic_${i++}`, character: k2.character, clip: k2.walkWith || 'walk', lateral: base.lateral + (spec.pair_gap || 0.7) }, offsetX);
        b.talk = k2.talk;
        b.speed = a.speed;
        Object.assign(b, { follower: true, leader: a, gap: spec.pair_gap || 0.7 });
        a.partner = b;
        a.stops = a.stops.length ? a.stops : ['idle'];
        this.startWalking(b);
        made.push(b);
      }
    }
    return made;
  }

  update(dt) {
    for (const a of this.agents) a.update(dt);
    for (const a of this.attached) a.place(a.p, dt);
    for (const { p, beast, turn } of this.riders) {
      // the seat on the saddle cloth or saddle it carries, else the bare back (animals.json); the hips 9 cm above it
      const info = beast.model.info || {};
      const s = (beast.loads || []).map((n) => info.tack?.[n]?.saddle_rest).find(Boolean) || info.saddle?.rest || [0, 1.0, 0];
      _q.set(s[0], s[1] + 0.09, s[2]).applyMatrix4(_m4.compose(beast.root.position, beast.root.quaternion, beast.root.scale));
      const hy = p.model.clips.find((c) => c.name === p.clip)?.userData?.hipsY ?? 0.9;
      p.root.position.set(_q.x, _q.y - hy * p.root.scale.y, _q.z);
      p.root.rotation.y = beast.root.rotation.y + turn;
    }
    // animation level of detail (the joined world has hundreds of people; Messenger switches detail by distance):
    // people near the camera pose every frame, further ones every 2nd or 4th frame with the time they missed, and
    // people off screen every 8th, so a skinned body is never more than a few frames stale when it comes into view
    this.frame = (this.frame || 0) + 1;
    const cam = this.camera;
    if (cam) { cam.updateMatrixWorld(); _fr.setFromProjectionMatrix(_m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)); }
    // past INK_FAR the ink pass draws only their silhouettes (from depth), so they skip the normal pass: one draw
    // instead of two for everyone far off (the shadow pass already covers only the 96 m round the player)
    this.farMeshes.length = 0;
    for (const p of this.all) {
      if (p.batch) { p.advance(dt); continue; } // the crowd: clip times only, drawn by crowd.js
      let every = 1;
      if (cam) {
        const q = p.root.position, d = Math.hypot(cam.position.x - q.x, cam.position.z - q.z);
        _sph.center.set(q.x, q.y + 0.9, q.z);
        every = !_fr.intersectsSphere(_sph) ? 8 : d < ANIM_LOD[0] ? 1 : d < ANIM_LOD[1] ? 2 : 4;
        if (d > INK_FAR) { if (!p.meshes) { p.meshes = []; p.root.traverse((o) => { if (o.isMesh) p.meshes.push(o); }); } this.farMeshes.push(...p.meshes); }
      }
      p.animDt += dt;
      if ((this.frame + p.phase) % every === 0) { p.mixer.update(p.animDt); p.animDt = 0; }
    }
    if (this.camera) {
      const c = this.camera.position;
      for (const p of this.all) {
        const q = p.root.position;
        p.root.visible = !(Math.hypot(c.x - q.x, c.z - q.z) < BODY_R + 0.12 && c.y > q.y - 0.2 && c.y < q.y + 1.9);
      }
    }
    this.crowd?.update(this.camera);
  }

  // move a body of radius r standing at feet position pos (Vector3) out of everyone; true if it moved
  pushOut(pos, r) {
    let moved = false;
    for (const p of this.all) {
      if (Math.abs(p.root.position.y - pos.y) > 1.2) continue;
      for (const [qx, qz, br] of circlesOf(p)) {
        const dx = pos.x - qx, dz = pos.z - qz, d = Math.hypot(dx, dz), min = r + br;
        if (d >= min) continue;
        const k = d > 1e-4 ? (min - d) / d : 0;
        pos.x += d > 1e-4 ? dx * k : min;
        pos.z += dz * k;
        moved = true;
      }
    }
    return moved;
  }

  remove(list) {
    const gone = new Set(list);
    for (const p of list) {
      this.hooks.scene.remove(p.root);
      this.crowd?.remove(p);
      p.mixer.stopAllAction();
      p.mixer.uncacheRoot(p.root);
      const k = this.all.indexOf(p);
      if (k >= 0) this.all.splice(k, 1);
      const i = this.agents.findIndex((a) => a.p === p);
      if (i >= 0) this.agents.splice(i, 1);
      const j = this.walkers.findIndex((a) => a.p === p);
      if (j >= 0) this.walkers.splice(j, 1);
      this.agentOf.delete(p);
    }
    // a section that unloads takes its riders and their animals with it, and the corridors only its walkers used
    this.riders = this.riders.filter((r) => !gone.has(r.p) && !gone.has(r.beast));
    this.attached = this.attached.filter((a) => !gone.has(a.p));
    const used = new Set(this.walkers.map((a) => a.path.key));
    for (const key of this.corridors.keys()) if (!used.has(key)) this.corridors.delete(key);
    this.crowd?.prune();
  }
}

// a body as circles on the ground: a person is one circle of BODY_R at the feet; an animal (addAnimal) a row of
// circles along its length, so you can't walk through an ox's head or rump. Returns [x, z, r] triples.
const _circles = [];
function circlesOf(p) {
  const q = p.root.position, b = p.body;
  _circles.length = 0;
  if (!b) { _circles.push([q.x, q.z, BODY_R]); return _circles; }
  const fx = Math.sin(p.root.rotation.y), fz = Math.cos(p.root.rotation.y); // the rig's +Z, turned with the body
  for (const s of b.along) _circles.push([q.x + fx * s, q.z + fz * s, b.r]);
  return _circles;
}

function findBone(root, suffix) {
  let hit = null;
  root.traverse((o) => { if (!hit && o.isBone && o.name.endsWith(suffix)) hit = o; });
  return hit;
}

function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
