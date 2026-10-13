// The river's boat flow, behind a URL switch (default off: map/BUILDING.md keeps painted boats to a short run along
// their heading and back, and shows no traffic that isn't painted; record gen/boats/flow/notes.md).
//   ?boatflow=painted  the painted boats under way that have a river to sail leave their painted spot, travel their
//                      lane in their painted direction, pass their spot regularly (and pause there, as painted), slip
//                      out of sight (into the mist where the river leaves the silk, or out of view at a closed end)
//                      and come back in at the start. Moored boats stay moored; the boat painted lowering its mast at
//                      the bridge, and the two in S3's closed west basin (a reach under 40 m), keep their painted run.
//   ?boatflow=waves    the above, plus copies of the loaded boats (their geometry, no download) coming in in waves at
//                      the ends of each reach and leaving out of sight: up the river (west, against the current, the
//                      north side) and down it (east, the south side), with spacing, a stop at the moorings at a
//                      closed end, masts lowered under the arch. ?boatflowcap=N sets the most at once per section (by
//                      default by device: 2 on a small phone, 3 on a touch screen, 6 on a desktop).
// The lanes are data (assets/boatflow.json, tools/boat_lanes.mjs): one per painted boat that flows, two per reach for
// the waves, each inside one section, so a section's flow loads and goes with it; zones where two lanes of opposite
// direction are too close to pass (one direction at a time). A boat sits on its lane with its stern waterline at
// s - lw/2 and its bow waterline at s + lw/2 (the chord), so long hulls follow the curve.
// Rules kept: spawning and hiding happen only where nobody sees it (fully in the mist, outside the camera's view, or
// past the fog); a boat you stand on is never hidden; boats keep apart (each looks ahead along its lane for any hull it
// would touch, and waits); decks, crew, sweeps, oars, tow lines and bow waves work as before (boats.js).
import * as THREE from 'three';

export function flowMode() {
  try { const m = new URLSearchParams(location.search).get('boatflow'); return m === 'painted' || m === 'waves' ? m : null; } catch { return null; }
}
// the most waves boats at once per section, by device (choice): phones matter
export function flowCap() {
  try {
    const q = new URLSearchParams(location.search).get('boatflowcap');
    if (q !== null && q !== '' && !Number.isNaN(+q)) return Math.max(0, Math.floor(+q));
    const touch = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
    return touch ? (mem <= 4 || cores <= 4 ? 2 : 3) : 6;
  } catch { return 3; }
}

const ACC = 0.12, DEC = 0.18; // m/s2: a laden hull gathers and loses way slowly (choice)
const GAP = 0.6; // m between two hulls that wait for each other
const SEEN_FAR = 210; // m: past this the fog has them (world.js fog 45-230 m)
const NEAR_SPAWN = 26; // m: nothing appears or goes this near you, seen or not (a turn of the head)
const MAST_RATE = 9; // degrees a second a mast goes down or up
const WALK = 1.2; // m/s a tracker walks back to meet the next boat
const THINK = 0.1; // s between two looks round for who is in whose way
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _s1 = new THREE.Vector3(1, 1, 1);
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere();
// its own random numbers (mulberry32), so the flow never shifts the page's Math.random (the walkers' choices)
let seed = 0x9e3779b9;
const random = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rand = (a, b) => a + random() * (b - a);
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; }; // boats.js's
const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- lanes
function prepLane(id, L) {
  const n = L.pts.length, P = new Float32Array(n * 2), S = new Float32Array(n);
  for (let i = 0; i < n; i++) { P[2 * i] = L.pts[i][0]; P[2 * i + 1] = L.pts[i][1]; if (i) S[i] = S[i - 1] + Math.hypot(P[2 * i] - P[2 * i - 2], P[2 * i + 1] - P[2 * i - 1]); }
  return { ...L, id, P, S, len: S[n - 1] };
}
function laneAt(L, s, out = [0, 0]) {
  const S = L.S, n = S.length;
  if (s <= 0) { out[0] = L.P[0]; out[1] = L.P[1]; return out; }
  if (s >= S[n - 1]) { out[0] = L.P[2 * n - 2]; out[1] = L.P[2 * n - 1]; return out; }
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
  const t = (s - S[lo]) / (S[hi] - S[lo] || 1);
  out[0] = L.P[2 * lo] + (L.P[2 * hi] - L.P[2 * lo]) * t; out[1] = L.P[2 * lo + 1] + (L.P[2 * hi + 1] - L.P[2 * lo + 1]) * t;
  return out;
}
const _a = [0, 0], _b = [0, 0];
// the boat's pose with its stern and bow waterline ends on the lane: centre X, D and heading (radians, + toward north)
function chord(L, s, a, out = {}) {
  laneAt(L, s - a, _a); laneAt(L, s + a, _b);
  out.X = (_a[0] + _b[0]) / 2; out.D = (_a[1] + _b[1]) / 2; out.hd = Math.atan2(_b[1] - _a[1], _b[0] - _a[0]);
  return out;
}

// an oriented box in plan: centre, heading, extents fore/aft along the heading and half width w
function obb(X, D, hd, fore, aft, w, grow = 0, out = {}) {
  const c = Math.cos(hd), s = Math.sin(hd), m = (fore - aft) / 2;
  out.X = X + c * m; out.D = D + s * m; out.c = c; out.s = s; out.h = (fore + aft) / 2 + grow; out.w = w + grow;
  return out;
}
// a hull's outline in plan (assets/boatflow.json: convex, its own frame, x forward, z to starboard) at a pose, grown
function poly(f, X, D, hd, grow = 0, out = []) {
  const c = Math.cos(hd), s = Math.sin(hd), o = f.outline;
  out.length = o.length;
  for (let i = 0; i < o.length; i++) {
    let [x, z] = o[i];
    if (grow) { const L = Math.hypot(x - f.ocx, z) || 1; x += ((x - f.ocx) / L) * grow; z += (z / L) * grow; }
    out[i] = [X + x * c + z * s, D + x * s - z * c];
  }
  return out;
}
function separated(P, Q) { // separating axes of two convex polygons in plan
  for (const R of [P, Q]) for (let i = 0; i < R.length; i++) {
    const [ax, ad] = R[i], [bx, bd] = R[(i + 1) % R.length], nx = bd - ad, nd = -(bx - ax);
    let p0 = Infinity, p1 = -Infinity, q0 = Infinity, q1 = -Infinity;
    for (const [x, d] of P) { const v = x * nx + d * nd; if (v < p0) p0 = v; if (v > p1) p1 = v; }
    for (const [x, d] of Q) { const v = x * nx + d * nd; if (v < q0) q0 = v; if (v > q1) q1 = v; }
    if (p1 < q0 || q1 < p0) return true;
  }
  return false;
}
function overlap(A, B) { // separating axes of two boxes in plan
  const dx = B.X - A.X, dd = B.D - A.D;
  for (const [ax, ad] of [[A.c, A.s], [-A.s, A.c], [B.c, B.s], [-B.s, B.c]]) {
    const ra = A.h * Math.abs(A.c * ax + A.s * ad) + A.w * Math.abs(-A.s * ax + A.c * ad);
    const rb = B.h * Math.abs(B.c * ax + B.s * ad) + B.w * Math.abs(-B.s * ax + B.c * ad);
    if (Math.abs(dx * ax + dd * ad) > ra + rb) return false;
  }
  return true;
}

export class BoatFlow {
  constructor(boats, mode) {
    this.boats = boats;
    this.mode = mode;
    this.cap = mode === 'waves' ? flowCap() : 0;
    this.data = null;
    this.lanes = new Map();
    this.sets = new Map(); // section name -> { name, sec, flows: [], pool: [], zones: [], waves: [] }
    this.t = 0;
    this.n = 0; // copies made (their ids stay unique for the page's life)
    this.stats = { spawned: 0, hidden: 0, waits: 0, stepMs: 0, steps: 0 };
    this.mist = { key: '', edges: [], boxes: [], start: 0.6, full: 9 };
    this.ready = fetch('assets/boatflow.json').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      this.data = d;
      for (const [id, L] of Object.entries(d.lanes)) this.lanes.set(id, prepLane(id, L));
    }).catch((e) => console.warn('boat flow: no lanes', e));
  }

  // ------------------------------------------------------------ a section joins (boats.add) or goes (boats.remove)
  async attach(sec) {
    await this.ready;
    if (!this.data || this.sets.has(sec.name)) return;
    const lanes = [...this.lanes.values()].filter((L) => L.owner === sec.name);
    if (!lanes.length) return;
    const set = { name: sec.name, sec, flows: [], pool: [], waves: [], zones: [] };
    const ids = new Set(lanes.map((L) => L.id));
    for (const z of this.data.zones || []) {
      const [[la, ra], [lb, rb]] = Object.entries(z);
      if (ids.has(la) && ids.has(lb)) set.zones.push({ lanes: [la, lb], range: { [la]: ra, [lb]: rb }, side: null, users: new Set() });
    }
    // the painted boats that flow: each starts at its painted spot, pausing there as the section shows it
    for (const b of sec.boats?.boats || []) {
      const fb = this.data.boats[b.id];
      const L = fb && this.lanes.get(fb.lane);
      if (!L || L.owner !== sec.name) continue;
      const f = this.flowOf(b, L, { speed: fb.speed, half: fb.half, len: fb.len, outline: fb.outline, spot: fb.spot, pause: fb.pause_s, hold: fb.stop_at_spot ? fb.spot : fb.hold, mast: fb.mast, painted: true });
      f.s = fb.spot; f.st = 'pause'; f.t = fb.pause_s * rand(0.4, 1.1); f.paused = true;
      set.flows.push(f);
    }
    // the waves: per waves lane, the boats of this section that fit it (they pass everything overhead)
    if (this.mode === 'waves' && this.cap > 0) {
      const own = new Map((sec.boats?.boats || []).map((b) => [b.id, b]));
      const big = lanes.some((L) => L.use === 'waves' && L.cls === 'big'); // where the big boats' lanes run, everyone takes them
      for (const L of lanes) {
        if (L.use !== 'waves' || (big && L.cls !== 'big')) continue;
        const fits = Object.entries(this.data.templates || {}).filter(([id, t]) => t.sec === sec.name && own.has(id) && t.lanes[L.id]?.pass).map(([id]) => own.get(id));
        if (fits.length) set.waves.push({ lane: L, fits, next: this.t + rand(2, 14), burst: 0 });
      }
    }
    for (const f of set.flows) f.set = set;
    this.sets.set(sec.name, set);
  }

  detach(sec) {
    const set = this.sets.get(sec.name);
    if (!set) return;
    const people = this.boats.hooks.getPeople?.();
    for (const f of set.pool) {
      if (f.crew.length && people) people.remove(f.crew.map((c) => c.p));
      this.boats.uncopy(f.b);
    }
    for (const f of set.flows) { if (f.trackers) f.trackers.length = 0; f.b.flow = null; f.b.base = null; }
    this.sets.delete(sec.name);
  }

  // a boat's flow record (painted or a copy)
  flowOf(b, L, o) {
    const a = (b.info.lw || 10) / 2;
    const f = { b, lane: L, s: 0, v: 0, a, speed: o.speed, fore: o.len ? o.len[1] : a + 1, aft: o.len ? -o.len[0] : a + 1, w: o.half ?? 1.5,
      spot: o.spot ?? null, pause: o.pause ?? 0, hold: o.hold ?? null, mast: o.mast || null, painted: !!o.painted, st: 'gone', t: 0, paused: false,
      blockedBy: null, claims: new Set(), trackers: [], towOn: false, misted: false, box: {}, top: Math.max(b.info.roof_z || 3, 3),
      outline: o.outline || null, ocx: o.outline ? o.outline.reduce((a, q) => a + q[0], 0) / o.outline.length : 0, hull: [] };
    if (!f.outline) { const fo = f.fore, af = f.aft, w = f.w; f.outline = [[fo, 0], [fo * 0.7, w], [-af, w], [-af, -w], [fo * 0.7, -w]]; f.ocx = (fo - af) / 2; }
    const S = L.len;
    // where it comes in (deep in the mist, or its stern just inside a closed end) and where it stops
    f.startS = L.ends[0] === 'mist' ? a + 1 : a + 0.5;
    f.endS = L.ends[1] === 'mist' ? S - a : S - a - 0.5;
    if (f.hold !== null) f.endS = Math.min(f.endS, f.hold);
    if (f.spot !== null) f.endS = Math.max(f.endS, f.spot);
    f.exitMist = L.ends[1] === 'mist' && f.hold === null;
    b.flow = f;
    b.base = new THREE.Matrix4().copy(b.rest);
    b.s = 0; b.run = 0;
    if (f.mast) b.mastDeg = this.mastAt(f, f.s);
    return f;
  }

  // ------------------------------------------------------------ copies for the waves
  makeCopy(set, t, L) {
    const id = `${t.id}~flow${++this.n}`; // stable and unique while it lives (sound.js keys its timers by id)
    const b = this.boats.copy(t, id);
    const tp = this.data.templates[t.id];
    const f = this.flowOf(b, L, { speed: 0.6, half: tp.half, len: tp.len, outline: tp.outline });
    f.set = set; f.template = t; f.copy = true; f.crew = [];
    this.crewFor(f);
    set.pool.push(f);
    return f;
  }

  // its crew: the template's (working hands first, at most five), each standing where the template's stands; a boat
  // painted without a working hand gets a poler at the stern (choice: someone has to move it)
  crewFor(f) {
    const people = this.boats.hooks.getPeople?.(), b = f.b;
    if (!people) return;
    const spots = [...(b.crewSpots || [])].sort((p, q) => (q.work ? 1 : 0) - (p.work ? 1 : 0)).slice(0, 5);
    const add = (character, clip, place, props, scale) => {
      if (!people.models?.[character]) return;
      const p = people.spawn(character);
      if (props) people.carry(p, props);
      if (scale) p.root.scale.multiplyScalar(scale);
      p.play(clip, { offset: random() * 3 });
      const a = { p, place: (q) => { place(q); q.keepLooping?.(); } };
      people.attached.push(a);
      f.crew.push(a);
    };
    for (const c of spots) {
      const clip = c.spec.do?.[0]?.[0] || 'idle';
      add(c.spec.character, clip, (q) => {
        _v.copy(c.local);
        if (c.node) _v.applyMatrix4(c.node.matrix);
        _v.applyMatrix4(b.roots[0].matrixWorld);
        q.root.position.copy(_v);
        q.root.rotation.y = this.boats.yawOf(b.roots[0].quaternion) + c.yaw + (c.node ? this.boats.nodeYaw(c.node) : 0);
      }, c.spec.props, c.spec.scale);
    }
    if (!f.crew.some((a) => a.p) || !spots.some((c) => c.work || /pole|sweep|oar|tiller/.test(c.spec.do?.[0]?.[0] || ''))) {
      const at = new THREE.Vector3(-(f.aft - 1.0), 0, 0), y = this.boats.floorLocal(b.template || b, at, 'deck');
      if (y) {
        const local = new THREE.Vector3(at.x, y.y, at.z);
        if (y.moved) local.set(y.moved.x, y.y, y.moved.z);
        add('boatman', 'pole_boat', (q) => { _v.copy(local).applyMatrix4(b.roots[0].matrixWorld); q.root.position.copy(_v); q.root.rotation.y = this.boats.yawOf(b.roots[0].quaternion) + Math.PI / 2; }); // facing the bow
      }
    }
  }

  // ------------------------------------------------------------ what you can see
  refreshMist() {
    let key = '';
    for (const s of this.boats.sections?.values() || []) key += s.name + ',';
    if (key === this.mist.key) return;
    const secs = [...(this.boats.sections?.values() || [])].filter((s) => s.layout?.painted_area);
    this.mist.key = key;
    secs.sort((p, q) => p.layout.painted_area.corners[0][0] - q.layout.painted_area.corners[0][0]);
    if (!secs.length) { this.mist.edges = []; return; }
    const w = secs[0].layout.painted_area.corners, e = secs[secs.length - 1].layout.painted_area.corners;
    const ring = [w[0], e[1], e[2], w[3]];
    this.mist.edges = ring.map(([ax, ad], i) => { const [bx, bd] = ring[(i + 1) % 4], L = Math.hypot(bx - ax, bd - ad); return [(bd - ad) / L, -(bx - ax) / L, ax, ad]; });
    this.mist.boxes = secs.flatMap((s) => s.walkable || []);
    const m = secs.find((s) => s.backdrop?.mist)?.backdrop.mist;
    if (m) { this.mist.start = m.start; this.mist.full = m.full; }
  }
  // how much of a point the mist covers (post.js mistAt, without the ring)
  mistAt(X, D, cam) {
    const M = this.mist;
    if (!M.edges.length) return 0;
    let o = -Infinity;
    for (const [nx, nd, ax, ad] of M.edges) o = Math.max(o, nx * (X - ax) + nd * (D - ad));
    for (const [x0, x1, d0, d1] of M.boxes) o = Math.min(o, Math.max(x0 - X, X - x1, d0 - D, D - d1));
    const near = cam ? smooth(3, 14, Math.hypot(cam.x - X, cam.z + D)) : 1;
    return smooth(M.start, M.full, o) * near;
  }
  // would someone see a hull at this pose? (in the camera's view, not lost in the mist, not past the fog)
  seenAt(f, X, D, hd) {
    const cam = this.boats.camera;
    if (!cam) return true;
    const cp = cam.position, y = this.boats.hooks.player?.pos?.y ?? 0;
    const r = Math.max(f.fore, f.aft) + 1, top = f.b.flow?.mast ? 10 : f.top;
    if (Math.hypot(cp.x - X, cp.z + D) - r > SEEN_FAR) return false;
    _sph.center.set(X, (this.data?.water_H ?? y) + top / 2, -D); _sph.radius = Math.hypot(r, top / 2) + 1;
    if (!_fr.intersectsSphere(_sph)) return false;
    const c = Math.cos(hd), s = Math.sin(hd);
    for (const [u, v] of [[f.fore, 0], [-f.aft, 0], [0, f.w], [0, -f.w], [f.fore * 0.5, f.w], [-f.aft * 0.5, -f.w]]) {
      if (this.mistAt(X + u * c - v * s, D + u * s + v * c, cp) < 0.97) return true;
    }
    return false;
  }
  nearPlayer(X, D, m) { const p = this.boats.hooks.player?.pos; return p ? Math.hypot(p.x - X, -p.z - D) < m : false; }
  ridden(b) { const r = this.boats.hooks.player?.ride; return !!r && r.mover === b.mover; }

  // ------------------------------------------------------------ each walker step (boats.step, before the poses)
  step(dt) {
    if (!this.data || !this.sets.size) return;
    const t0 = performance.now();
    this.t += dt;
    const pp = this.boats.hooks.player?.pos;
    // a jump of more than 3 m in one step is a teleport (walking, running or riding moves under 0.1 m a step)
    if (pp) { if (this.lastPos && this.lastPos.distanceTo(pp) > 3 && this.snap !== false) this.landed(pp); (this.lastPos ||= new THREE.Vector3()).copy(pp); }
    const cam = this.boats.camera;
    if (cam) { cam.updateMatrixWorld(); _fr.setFromProjectionMatrix(_pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)); }
    this.refreshMist();
    for (const set of this.sets.values()) { for (const f of set.flows) if (f.haul) this.stepHaul(f.haul, dt); this.stepSet(set, dt); }
    this.stats.stepMs += performance.now() - t0;
    this.stats.steps++;
  }

  active(set) { return [...set.flows, ...set.pool].filter((f) => f.st !== 'gone'); }

  stepSet(set, dt) {
    // who waits for whom is worked out ten times a second (THINK); every step moves the boats by it
    set.think = (set.think || 0) - dt;
    if (set.think <= 0 || !set.want) { set.think = THINK; set.want = this.think(set); }
    // move
    for (const f of [...set.flows, ...set.pool]) this.advance(f, dt, set.want.get(f) ?? 0);
    // the waves
    if (set.waves.length) this.schedule(set);
  }

  think(set) {
    const live = this.active(set);
    const cam = this.boats.camera?.position;
    for (const f of live) {
      chord(f.lane, f.s, f.a, f.pose ||= {});
      obb(f.pose.X, f.pose.D, f.pose.hd, f.fore, f.aft, f.w, 0, f.box);
      poly(f, f.pose.X, f.pose.D, f.pose.hd, GAP / 2, f.hull);
      f.misted = !!cam && [[f.fore, 0], [-f.aft, 0]].every(([u]) => this.mistAt(f.pose.X + u * Math.cos(f.pose.hd), f.pose.D + u * Math.sin(f.pose.hd), cam) > 0.97);
    }
    // zones: who is in each (a direction holds it until its last hull is out)
    for (const z of set.zones) {
      for (const f of [...z.users]) if ((f.st !== 'run' && f.st !== 'pause') || !this.inRange(f, z.range[f.lane.id])) z.users.delete(f);
      if (!z.users.size) z.side = null;
      // a boat paused inside (at its painted spot) holds it: the other direction waits until it has gone through
      for (const f of live) if (f.st === 'pause' && !z.users.has(f) && this.inRange(f, z.range[f.lane.id]) && (!z.side || z.side === f.lane.id)) { z.side = f.lane.id; z.users.add(f); }
    }
    // what each moving boat would run into
    const want = new Map();
    for (const f of live) {
      if (f.st !== 'run') continue;
      let v = f.speed;
      // ease into its spot (it pauses there) and its stop
      if (f.spot !== null && !f.paused && f.s < f.spot) v = Math.min(v, Math.sqrt(2 * DEC * Math.max(0, f.spot - f.s)) + 0.03);
      if (!f.exitMist) v = Math.min(v, Math.sqrt(2 * DEC * Math.max(0, f.endS - f.s)) + 0.03);
      const look = Math.max(2.5, (f.v * f.v) / (2 * DEC) + 1.5);
      f.blockedBy = null;
      for (const g of live) {
        if (g === f || g.misted) continue; // a hull lost in the mist is in nobody's way (nobody sees them pass)
        if (Math.hypot(g.box.X - f.box.X, g.box.D - f.box.D) > g.box.h + f.box.h + look + 3) continue;
        for (const k of [0.35, 0.7, 1]) {
          const p = chord(f.lane, f.s + look * k, f.a, {});
          if (!separated(poly(f, p.X, p.D, p.hd, GAP / 2, []), g.hull)) { f.blockedBy = g; break; }
        }
        if (f.blockedBy) break;
      }
      // a zone held by the other direction: wait short of it
      for (const z of set.zones) {
        const r = z.range[f.lane.id];
        if (!r || z.users.has(f) || f.misted) continue;
        if (f.s + f.fore + look >= r[0] && f.s - f.aft < r[1]) {
          if (z.side && z.side !== f.lane.id && z.users.size && !f.misted) { f.blockedBy ||= [...z.users][0]; }
          else { z.side = f.lane.id; z.users.add(f); }
        }
      }
      want.set(f, f.blockedBy ? 0 : v);
    }
    // two that wait for each other: the one further along goes, if its next step is clear
    for (const f of live) {
      const g = f.blockedBy;
      if (!g || g.blockedBy !== f || f.st !== 'run' || g.st !== 'run') continue;
      const first = f.s / f.lane.len > g.s / g.lane.len || (f.s / f.lane.len === g.s / g.lane.len && f.b.id < g.b.id) ? f : g;
      if (first !== f) continue;
      const p = chord(f.lane, f.s + 2, f.a, {});
      if (separated(poly(f, p.X, p.D, p.hd, 0.1, []), g.hull)) want.set(f, Math.min(0.3, f.speed));
    }
    return want;
  }


  // trackers that keep their painted haul: rest, out along the heading, a pause, back (boats.js pose for a boat under way)
  stepHaul(H, dt) {
    const T = (H.run / Math.max(0.05, H.speed)) * 1.25, [p0, p1] = H.pauses;
    H.clock += dt;
    if (H.st === 'rest' && H.clock > p0) { H.st = 'out'; H.clock = 0; } else if (H.st === 'out' && H.clock > T) { H.st = 'far'; H.clock = 0; } else if (H.st === 'far' && H.clock > p1) { H.st = 'back'; H.clock = 0; } else if (H.st === 'back' && H.clock > T) { H.st = 'rest'; H.clock = 0; }
    const k = Math.min(1, H.clock / T);
    H.d = H.st === 'rest' ? 0 : H.st === 'far' ? H.run : (H.st === 'out' ? 0.5 - 0.5 * Math.cos(Math.PI * k) : 0.5 + 0.5 * Math.cos(Math.PI * k)) * H.run;
  }

  inRange(f, r) { return !!r && f.s + f.fore >= r[0] && f.s - f.aft <= r[1]; }

  advance(f, dt, target) {
    const b = f.b;
    if (f.st === 'run') {
      const dv = target - f.v;
      f.v += clamp(dv, -DEC * dt * 2.5, ACC * dt);
      if (f.v < 0) f.v = 0;
      f.s += f.v * dt;
      if (f.blockedBy && target === 0 && f.v < 0.02) {
        this.stats.waits += dt;
        // a painted boat has right of way: a waves boat parked in its way goes as soon as nobody sees it
        const g = f.blockedBy;
        if (f.painted && g.copy && g.st === 'wait' && !this.ridden(g.b) && !this.seenAt(g, g.pose.X, g.pose.D, g.pose.hd)) this.hide(g);
        f.stuck = (f.stuck || 0) + dt;
        // held up a long while where nobody sees it (two lanes' boats that wait on each other): it goes, to come again
        if (f.stuck > 25 && !this.ridden(b) && !this.seenAt(f, f.pose.X, f.pose.D, f.pose.hd)) { f.stuck = 0; this.stats.unstuck = (this.stats.unstuck || 0) + 1; this.hide(f); return; }
      } else f.stuck = 0;
      if (f.spot !== null && !f.paused && f.s >= f.spot - 0.02) { f.s = f.spot; f.v = 0; f.st = 'pause'; f.t = f.pause; f.paused = true; }
      else if (f.s >= f.endS - 0.02) {
        f.s = Math.min(f.s, f.endS); f.v = 0;
        if (f.exitMist && !this.ridden(b)) this.hide(f); else { f.st = 'wait'; f.t = 0; }
      }
    } else if (f.st === 'pause') {
      f.t -= dt;
      if (f.t <= 0 && !this.boats.someoneBoarding(b)) f.st = f.s >= f.endS - 0.02 ? 'wait' : 'run';
    } else if (f.st === 'wait') {
      f.t += dt;
      // out of sight (and nobody aboard, nobody near): it goes, to come in again at the start
      if (f.t > 4 && (f.look = (f.look || 0) - dt) <= 0) { // looked at four times a second
        f.look = 0.25;
        if (!this.ridden(b) && !this.nearPlayer(f.pose?.X ?? 0, f.pose?.D ?? 0, NEAR_SPAWN) && !this.seenAt(f, f.pose.X, f.pose.D, f.pose.hd)) this.hide(f);
      }
    } else if (f.st === 'gone' && !f.copy) {
      f.t -= dt;
      if (f.t <= 0) this.enter(f);
    }
    if (f.mast) b.mastDeg = this.mastTo(b.mastDeg, this.mastAt(f, f.s), dt);
  }

  hide(f) {
    f.st = 'gone'; f.v = 0; f.paused = false;
    f.t = f.copy ? 0 : rand(10, 35); // a painted boat comes back after a while
    this.boats.show(f.b, false);
    this.stats.hidden++;
  }

  // come in at the start, where nobody sees it and there is room
  enter(f) {
    const p = chord(f.lane, f.startS, f.a, {});
    if (f.lane.ends[0] !== 'mist' && (this.nearPlayer(p.X, p.D, NEAR_SPAWN) || this.seenAt(f, p.X, p.D, p.hd))) { f.t = 1; return false; }
    const hull = poly(f, p.X, p.D, p.hd, 2, []);
    for (const g of this.active(f.set)) if (g !== f && !separated(hull, g.hull)) { f.t = 2; return false; }
    for (const z of f.set.zones) { const r = z.range[f.lane.id]; if (r && f.startS + f.fore >= r[0] && f.startS - f.aft <= r[1] && z.side && z.side !== f.lane.id && z.users.size) { f.t = 2; return false; } }
    f.s = f.startS; f.v = f.speed * 0.7; f.st = 'run'; f.paused = false; f.t = 0;
    if (f.mast) f.b.mastDeg = this.mastAt(f, f.s);
    chord(f.lane, f.s, f.a, f.pose ||= {});
    obb(f.pose.X, f.pose.D, f.pose.hd, f.fore, f.aft, f.w, 0, f.box);
    poly(f, f.pose.X, f.pose.D, f.pose.hd, GAP / 2, f.hull);
    this.boats.show(f.b, true);
    this.stats.spawned++;
    return true;
  }

  // waves: per lane a lull, then two or three boats a little apart (choice: 40-110 s of quiet, 14-30 s between boats)
  schedule(set) {
    for (const w of set.waves) {
      if (this.t < w.next) continue;
      const on = set.pool.filter((f) => f.lane === w.lane && f.st !== 'gone');
      // spacing: none while one on this lane waits at its end or is held up, or the last is still near the start
      if (on.some((f) => f.st === 'wait' || (f.st === 'run' && f.v < 0.05 && f.blockedBy)) || on.some((f) => f.s - f.startS < 2 * (f.fore + f.aft))) { w.next = this.t + 4; continue; }
      if (w.burst <= 0) { w.burst = 2 + (random() < 0.4 ? 1 : 0); }
      const f = this.pick(set, w);
      if (f && this.enter(f)) {
        w.burst--;
        w.next = this.t + (w.burst > 0 ? rand(14, 30) : rand(40, 110));
      } else w.next = this.t + 3;
    }
  }

  // a waves boat for a lane: one out of sight that fits it, or a new copy while the section has room for one
  pick(set, w) {
    const L = w.lane;
    const idle = set.pool.filter((f) => f.st === 'gone' && f.template && this.data.templates[f.template.id]?.lanes[L.id]?.pass);
    let f = idle.length ? idle[Math.floor(random() * idle.length)] : null;
    if (!f && set.pool.length < this.cap) {
      const count = (t) => set.pool.filter((g) => g.template === t).length;
      const t = [...w.fits].sort((p, q) => count(p) - count(q) || random() - 0.5)[0];
      f = this.makeCopy(set, t, L);
    }
    if (!f) return null;
    this.onto(f, L);
    return f;
  }

  // onto a lane, at a pace of its own: with the current a little quicker than against it
  onto(f, L) {
    const tl = this.data.templates[f.template.id].lanes[L.id];
    f.lane = L; f.mast = tl.mast?.lower ? tl.mast : tl.mast ? { ...tl.mast, lower: null } : null;
    f.hold = tl.hold;
    f.speed = (L.dir === 'east' ? rand(0.6, 0.85) : rand(0.45, 0.65)) * (f.w < 1.25 ? 1.1 : 1);
    f.startS = L.ends[0] === 'mist' ? f.a + 1 : f.a + 0.5;
    f.endS = L.ends[1] === 'mist' ? L.len - f.a : L.len - f.a - 0.5;
    if (f.hold !== null) f.endS = Math.min(f.endS, f.hold);
    f.exitMist = L.ends[1] === 'mist' && f.hold === null;
    f.b.mastDeg = f.mast ? this.mastAt(f, f.startS) : null;
  }

  // ------------------------------------------------------------ the pose (boats.pose)
  move(b, dt) {
    const f = b.flow;
    const wasRest = b.atRest;
    if (f.st === 'gone') {
      // out of sight: under the water at its start, so nothing of it (crew, collider, sounds) is anywhere near you
      const p = chord(f.lane, f.startS, f.a, {});
      b.base.compose(_v.set(p.X, b.restPos.y - 100, -p.D), _q.setFromAxisAngle(_up, p.hd), _s1);
      b.state = 'far'; b.atRest = false; b.effort = 0; b.wave = 0;
    } else {
      const atSpot = f.spot !== null && Math.abs(f.s - f.spot) < 0.01 && f.st !== 'run';
      if (atSpot) b.base.copy(b.rest);
      else { const p = chord(f.lane, f.s, f.a, f.pose ||= {}); b.base.compose(_v.set(p.X, b.restPos.y, -p.D), _q.setFromAxisAngle(_up, p.hd), _s1); }
      const going = f.st === 'run' && f.v > 0.03;
      b.state = atSpot ? 'rest' : going ? 'out' : 'far';
      b.atRest = atSpot && !f.copy;
      b.effort += ((going ? Math.min(1, 0.4 + f.v / Math.max(0.2, f.speed)) : 0) - b.effort) * Math.min(1, dt * 1.2);
      b.wave = going ? clamp(f.v / 0.55, 0, 1) * Math.min(1, (b.info.lw || 8) / 6) : 0;
    }
    b.s = 0;
    if (wasRest !== b.atRest && !f.copy) {
      this.boats.applyOpen(b);
      for (const o of this.boats.list) if (o !== b && o.contacts?.some((c) => c.other === b)) this.boats.applyOpen(o);
    }
  }

  // the mast: up in open water, down (MAST_DOWN) over the stretch the lane says the arch needs it down
  mastAt(f, s) {
    const m = f.mast;
    if (!m) return null;
    if (!m.lower) return m.up_deg;
    const [l0, l1] = m.lower, [r0, r1] = m.raise;
    if (s <= l0 || s >= r1) return m.up_deg;
    if (s < l1) return m.up_deg + (m.down_deg - m.up_deg) * smooth(l0, l1, s);
    if (s <= r0) return m.down_deg;
    return m.down_deg + (m.up_deg - m.down_deg) * smooth(r0, r1, s);
  }
  mastTo(cur, want, dt) { if (cur == null || want == null) return want; return cur + clamp(want - cur, -MAST_RATE * dt, MAST_RATE * dt); }

  // ------------------------------------------------------------ ropes (boats.aim): which are stowed now
  stowed(b, ln) {
    const f = b.flow;
    if (!f) return false;
    const worldFixed = b.worldPoints?.has(ln.a) || b.worldPoints?.has(ln.b);
    if (ln.b === 'pt_tow_b' || ln.a === 'pt_tow_b') return !f.towOn;
    if (b.extra) return worldFixed || ln.collide;
    return worldFixed && !(f.spot !== null && Math.abs(f.s - f.spot) < 0.01 && f.st !== 'run' && f.st !== 'gone');
  }

  // ------------------------------------------------------------ trackers (boats.hauler, for a flowing towed boat)
  // Each walks the bank beside the boat's lane, its painted spot moved as the lane moves the boat, over the stretch the
  // bank allows ([back, ahead] m from its painted spot, assets/boatflow.json tow.range): there it hauls (the tow line
  // up); past it the boat goes on its own way (the line stowed) and the trackers wait at the stretch's end; when the
  // boat has gone they walk back to meet the next one.
  hauler(b, fig, spec, haul, people) {
    const f = b.flow;
    const tw = this.data?.tow?.[b.id] || {};
    const range = tw.range || [-24, Math.max(0, (f.endS ?? f.spot) - f.spot)];
    const base = [fig.X + (spec.nudge?.[0] || 0), fig.D + (spec.nudge?.[1] || 0)];
    const P0 = laneAt(f.lane, f.spot, [0, 0]);
    // (their clock starts as boats.js starts a boat's under way: hash(id) * 4 s into its pause, so the bank's walkers
    // meet them as they do with the switch off)
    const T = { d: 0, last: null, gy: null, gT: 0, face: THREE.MathUtils.degToRad(spec.facing_deg ?? fig.facing_deg ?? 0) + Math.PI / 2, clock: hash(b.id) * 4, st: 'rest' };
    f.trackers.push(T);
    const P = [0, 0];
    // where the bank gives them less than 4 m to walk with the boat, they keep their painted haul: a short way along
    // the boat's heading and back on their own clock (boats.js's run for a boat under way), the tow line up while the
    // boat lies at its spot
    const own = range[1] - range[0] < 4;
    T.own = own;
    if (own && !f.haul) f.haul = { clock: hash(b.id) * 4, st: 'rest', d: 0, run: b.spec?.run_m ?? 4, speed: b.spec?.speed_mps ?? 0.5, pauses: b.spec?.pause_s ?? [8, 3] };
    const speed = b.spec?.speed_mps ?? 0.5;
    const fwd = [Math.cos(b.heading), Math.sin(b.heading)];
    const place = (q, dt = 0) => {
      let attached, moved, X, D;
      if (own) {
        // the haul's clock runs with the boats' steps (stepHaul), as boats.js's run for a boat under way does
        const H = f.haul;
        moved = H.st === 'out' ? 1 : H.st === 'back' ? -1 : 0;
        T.d = H.d;
        attached = f.spot !== null && Math.abs(f.s - f.spot) < 0.01 && f.st !== 'run' && f.st !== 'gone';
        X = base[0] + fwd[0] * T.d; D = base[1] + fwd[1] * T.d;
      } else {
        const boatD = f.st === 'gone' ? -Infinity : f.s - f.spot;
        const want = clamp(boatD, range[0], range[1]);
        attached = f.st !== 'gone' && boatD >= range[0] - 0.05 && boatD <= range[1] + 0.05 && Math.abs(T.d - boatD) < 0.3;
        const was = T.d;
        if (attached) T.d = boatD;
        else T.d += clamp(want - T.d, -WALK * dt, WALK * dt);
        moved = Math.abs(T.d - was) > 0.004 * Math.max(dt * 60, 1) ? Math.sign(T.d - was) : 0;
        laneAt(f.lane, f.spot + T.d, P);
        X = base[0] + P[0] - P0[0]; D = base[1] + P[1] - P0[1];
      }
      if (T === f.trackers[0]) f.towOn = attached;
      const x = X, z = -D;
      T.gT -= dt;
      if (T.gy === null || T.gT <= 0) { T.gy = people.hooks.ground(x, z, (fig.H || 0) + 1.5); T.gT = 0.1; }
      q.root.position.set(x, T.gy, z);
      const walking = moved !== 0;
      const clip = walking ? (attached || own ? haul.walk || 'walk' : 'walk') : haul.stand || 'idle';
      if (clip !== T.last) { q.play(clip, { timeScale: walking ? clamp((own ? speed : f.v || speed) / 1.25, 0.5, 1.5) : 1 }); T.last = clip; }
      if (walking) {
        if (own) q.root.rotation.y = Math.atan2(fwd[0] * moved, -fwd[1] * moved);
        else { laneAt(f.lane, f.spot + T.d + moved, _b); q.root.rotation.y = Math.atan2(_b[0] - P[0], -(_b[1] - P[1])); }
      } else if (Math.abs(T.d) < 0.05) q.root.rotation.y = T.face;
      if (!walking) q.keepLooping?.();
    };
    b.crew.push(fig.id);
    return { place, moving: true, drivesClips: true };
  }

  // a teleport (the tools, the scroll HUD): where you land the painted boats lie at their painted spots, as a section
  // shows them when it loads (nobody sees a jump: the whole view changes); a waves boat in the way goes
  landed(pos) {
    for (const set of this.sets.values()) for (const f of set.flows) {
      if (f.spot === null) continue;
      const P = laneAt(f.lane, f.spot, [0, 0]);
      if (Math.hypot(P[0] - pos.x, P[1] + pos.z) > 70) continue;
      if (f.st !== 'gone' && Math.abs(f.s - f.spot) < 0.01) continue;
      const home = chord(f.lane, f.spot, f.a, {}), hull = poly(f, home.X, home.D, home.hd, 1, []);
      for (const g of set.pool) if (g.st !== 'gone' && !separated(hull, g.hull)) this.hide(g);
      f.s = f.spot; f.v = 0; f.st = 'pause'; f.t = f.pause; f.paused = true;
      if (f.mast) f.b.mastDeg = this.mastAt(f, f.s);
      for (const T of f.trackers) if (!T.own) T.d = 0; // trackers on their own clock keep it
      this.boats.show(f.b, true);
    }
  }

  // ------------------------------------------------------------ for the tools
  // a waves boat of a template sent onto a lane now, at s (tests only: nobody is asked whether they see it)
  spawnNow(templateId, laneId, s = null) {
    const L = this.lanes.get(laneId), set = L && this.sets.get(L.owner), t = this.boats.byId.get(templateId);
    if (!set || !t || !this.data.templates[templateId]?.lanes[laneId]) return null;
    const f = set.pool.find((g) => g.template === t && g.st === 'gone') || this.makeCopy(set, t, L);
    this.onto(f, L);
    if (s !== null) f.startS = s;
    f.s = f.startS; f.v = f.speed * 0.7; f.st = 'run'; f.paused = false;
    if (f.mast) f.b.mastDeg = this.mastAt(f, f.s);
    chord(f.lane, f.s, f.a, f.pose ||= {});
    obb(f.pose.X, f.pose.D, f.pose.hd, f.fore, f.aft, f.w, 0, f.box);
    poly(f, f.pose.X, f.pose.D, f.pose.hd, GAP / 2, f.hull);
    this.boats.show(f.b, true);
    return f.b;
  }

  report() {
    return [...this.sets.values()].map((set) => ({ section: set.name, zones: set.zones.map((z) => ({ lanes: z.lanes, side: z.side, users: [...z.users].map((f) => f.b.id) })),
      waves: set.waves.map((w) => ({ lane: w.lane.id, fits: w.fits.length, next: +(w.next - this.t).toFixed(1), burst: w.burst })),
      boats: [...set.flows, ...set.pool].map((f) => ({ id: f.b.id, lane: f.lane.id, st: f.st, s: +f.s.toFixed(2), v: +f.v.toFixed(2), end: +f.endS.toFixed(1), spot: f.spot, blocked: f.blockedBy?.b.id || null,
        misted: f.misted, mast: f.b.mastDeg == null ? null : +f.b.mastDeg.toFixed(1), tow: f.trackers.length ? f.towOn : undefined, crew: f.crew?.length })) }));
  }
}
