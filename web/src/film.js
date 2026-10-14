// Filmed shots (the user, 2026-10-13: short videos, "a slow painting" orbit and quick pushes into the scene, made by
// another agent through CLIs, for video editing tools). The page side of tools/film_shot.mjs: a shot is data (skill
// `film`, gen/shots/*.json), evaluated here into a camera pose for any time t, and the page can be stepped one frame
// at a time on a film clock, so every frame is rendered whole however slow the capture is.
//
// The film clock: hold() parks the page's rAF loop (world.js tick returns while held) and replaces performance.now
// with a virtual time that only step() advances, the way CCapture.js makes canvas captures deterministic. Everything
// that reads the clock (people, boats, water, sky, wind, birds, cloth, the crowd's bake budget) then runs on film
// time with no change of its own; the crowd's budget loop finishes its bakes inside the frame because the clock
// doesn't move while it works. release() puts the real clock and the loop back.
//
// Coordinates: shots speak the scroll map's frame, X along the scroll, D into depth (north), H up, metres; the page
// frame is x = X, y = H, z = -D. Bearings (deg) as the views' facing_deg: 0 = +X, 90 = +D.
// A place is any of:
//   "crown"                         a camera spot (any section's scene.json views; "<section>:<view>" for a clash)
//   "S3.ani.horse_19055"            a map ID from a layout.json (entities, figures, trees); a figure's bare id works
//   [X, D] | [X, D, H]              map coordinates (without H: the ground under it)
//   { at: place, up: m, offset: [dX, dD, dH], follow: true }
//                                   shifted; follow: the live person, animal or boat of that ID, every frame
//   { around: place, dist: m, deg: bearing, el_deg: angle above level, up: m }
//                                   a point seen from `around` at that bearing, distance and angle
//   { painter: place, dist: m, up: m }
//                                   the painter's eye for that place: `dist` back along the scroll's own oblique
//                                   projection (its null direction there, from the section's frames), `up` over it
// A shot's camera is one of:
//   { kind: "orbit", around: place, look_up: 1.2, dist: m | [from, to], el_deg: deg | [from, to], from_deg, turn_deg,
//     fov: deg | [from, to], ease }
//   { kind: "move", keys: [{ t, pos: place, look: place, fov, roll_deg }, ...], ease }
//     (positions, look points, lens and roll on time-keyed Catmull-Rom curves; ease warps the whole move's time)
//   { kind: "painting", at: place, up: 1.2, dist: m | [from, to], fov: deg | [from, to], ease }
//     (the painter's view of a figure: the camera looks along the scroll's projection, so a long lens frames the
//     render the way the scan draws it and one 2D affine maps render pixels onto scan pixels; every frame's camera
//     then carries `scan`: that affine, its fit residual and, for a painted figure, the shift that lays the live body's
//     head and feet on the painted ones)
// ease: linear | in | out | inout (smootherstep) | sine (a gentle in-and-out)
// Shot extras (the trailer's capture needs, 2026-10-13):
//   poses: { "<figure id>": "clip" | { clip, offset: s, speed: 1 (0 holds the pose at offset), facing_deg } }
//     the figure plays that clip for the whole shot, its routine paused (a walker stands where it is)
//   scan: place      the scan affine on any shot (a painting camera sets it to its own subject)
//   track: true      each frame's camera lists the people in frame: head, top of head and feet in frame pixels
//   passes (tools/film_shot.mjs): pass('depth') and pass('line') draw the frame just rendered again as a depth or a
//     lines-only image (from the ink pass's own buffers), for compositing
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { toScan } from './scroll_projection.js';

const EASE = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - Math.pow(1 - u, 3),
  inout: (u) => u * u * u * (u * (u * 6 - 15) + 10),
  sine: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
};
const deg = THREE.MathUtils.degToRad;
const lerp = THREE.MathUtils.lerp;
const span = (v, u) => (Array.isArray(v) ? lerp(v[0], v[v.length - 1], u) : v);
const toPage = (X, D, H, out = new THREE.Vector3()) => out.set(X, H, -D);
const toMap = (v) => [+v.x.toFixed(3), +(-v.z).toFixed(3), +v.y.toFixed(3)];
const CSS = 'html.qm-film body > :not(canvas) { display: none !important; } html.qm-film canvas { cursor: none; }';

// The painter's view at a map point: the scroll is an oblique parallel projection (map/frames/<S>.json; scroll_projection.js),
// so one direction in the world collapses to a single scan pixel. Looking along it, a camera sees the world as the
// painter drew it. frames: a section's frames (scroll_index.json); X, D, H map metres. Returns the direction into the
// scene (map frame [dX, dD, dH], unit), the camera's bearing and elevation from the point (the views' convention: 0 = +X,
// 90 = +D) and the scan's pixels per metre there. Plain math: tools/film_places.mjs --painter uses it without a browser.
export function painterView(frames, X, D, H = 0, e = 0.25) {
  const f = (x, d, h) => toScan(frames, x, d, h);
  const dif = (a, b) => [(a[0] - b[0]) / (2 * e), (a[1] - b[1]) / (2 * e)];
  const jX = dif(f(X + e, D, H), f(X - e, D, H)), jD = dif(f(X, D + e, H), f(X, D - e, H)), jH = dif(f(X, D, H + e), f(X, D, H - e));
  const ru = [jX[0], jD[0], jH[0]], rv = [jX[1], jD[1], jH[1]]; // du and dv by X, D, H
  let n = [ru[1] * rv[2] - ru[2] * rv[1], ru[2] * rv[0] - ru[0] * rv[2], ru[0] * rv[1] - ru[1] * rv[0]]; // the null direction
  const len = Math.hypot(...n) || 1;
  n = n.map((v) => v / len);
  if (n[1] < 0) n = n.map((v) => -v); // into the scene: north (the painter stands south of the river)
  const r2d = THREE.MathUtils.radToDeg;
  return {
    dir: n.map((v) => +v.toFixed(6)),
    deg: +((r2d(Math.atan2(-n[1], -n[0])) + 360) % 360).toFixed(3),
    el_deg: +r2d(Math.atan2(-n[2], Math.hypot(n[0], n[1]))).toFixed(3),
    px_per_m: { X: +Math.hypot(...jX).toFixed(3), D: +Math.hypot(...jD).toFixed(3), H: +Math.hypot(...jH).toFixed(3) },
  };
}

// least squares 2D affine: src [[x, y]...] -> dst [[u, v]...]; M = [[a, b, c], [d, e, f]], u = a x + b y + c
function fitAffine(src, dst) {
  const N = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bu = [0, 0, 0], bv = [0, 0, 0];
  for (let i = 0; i < src.length; i++) {
    const r = [src[i][0], src[i][1], 1];
    for (let a = 0; a < 3; a++) { for (let b = 0; b < 3; b++) N[a][b] += r[a] * r[b]; bu[a] += r[a] * dst[i][0]; bv[a] += r[a] * dst[i][1]; }
  }
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const det = det3(N);
  const solve = (b) => [0, 1, 2].map((k) => det3(N.map((row, i) => row.map((v, j) => (j === k ? b[i] : v)))) / det);
  const M = [solve(bu), solve(bv)];
  let sum = 0, max = 0;
  for (let i = 0; i < src.length; i++) {
    const [x, y] = src[i], r = Math.hypot(M[0][0] * x + M[0][1] * y + M[0][2] - dst[i][0], M[1][0] * x + M[1][1] * y + M[1][2] - dst[i][1]);
    sum += r; max = Math.max(max, r);
  }
  return { M, mean: sum / src.length, max };
}
const applyM = (M, p) => [M[0][0] * p[0] + M[0][1] * p[1] + M[0][2], M[1][0] * p[0] + M[1][1] * p[1] + M[1][2]];
const r1 = (v) => Math.round(v * 10) / 10;

// ctx (world.js): { renderer, scene, camera, player, post, sun, tiers, s, set(k, v), views, sectionNames(), people(),
//   boats(), avatar(), birdseye, goto(X, D, H), settle(), colliders(), tick(now), clock: { held, stepping, parked } }
export function createFilm(ctx) {
  const realNow = performance.now.bind(performance);
  const clock = ctx.clock;
  let virt = 0; // the film clock (ms), while held
  let layouts = null; // map ID -> { X, D, H, kind, name, section }
  let shot = null; // { spec, T, pose(t, out) }
  let at = 0; // shot time (s)
  let live = false; // play(): the shot runs in real time in the live page
  let saved = null; // what prepare() changed, for release()
  const _o = new THREE.Object3D(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _ray = new THREE.Ray();
  const _c = new THREE.Vector3(), _px = new THREE.Vector3(), _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _fr = new THREE.Frustum(), _sph = new THREE.Sphere();
  let track = true, trackFar = 150; // prepare(): the people listed in each frame's camera (true | false | [ids]), out to trackFar metres
  let poseSaved = []; // what poses changed (routines, facings), for end()

  // the painting of a section: its frames, painted range and items (assets/<folder>/scroll_index.json), read once
  const scrolls = new Map();
  const scrollOf = (folder) => {
    if (!scrolls.has(folder)) scrolls.set(folder, fetch(`assets/${folder}/scroll_index.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
    return scrolls.get(folder);
  };
  // the painting a place belongs to: a map ID's own section, else the section whose painted range its projection is in
  async function scrollAt(id, X, D, H) {
    const L = typeof id === 'string' ? (await loadLayouts()).get(id) : null;
    if (L) return scrollOf(L.section);
    let best = null;
    for (const name of ctx.sectionNames()) {
      const sc = await scrollOf(name);
      if (!sc?.frames) continue;
      const [u] = toScan(sc.frames, X, D, H), [a, b] = sc.area || [-Infinity, Infinity];
      const off = u < a ? a - u : u > b ? u - b : 0;
      if (!best || off < best.off) best = { sc, off };
      if (off === 0) break;
    }
    return best?.sc ?? null;
  }
  const idOf = (p) => (typeof p === 'string' ? p : typeof p?.at === 'string' ? p.at : typeof p?.painter === 'string' ? p.painter : null);
  // the painter's direction at a place (painterView), plus the page-frame vector into the scene
  async function painterOf(p) {
    const q = toMap((await place(p)).get(new THREE.Vector3())); // a throwaway copy: its ground isn't cached in the shot's
    const sc = await scrollAt(idOf(p), ...q);
    if (!sc?.frames) throw new Error(`no painting frames for ${JSON.stringify(p)} (assets/<section>/scroll_index.json)`);
    const pv = painterView(sc.frames, q[0], q[1], q[2]);
    return { ...pv, page: new THREE.Vector3(pv.dir[0], pv.dir[2], -pv.dir[1]), scroll: sc };
  }
  const personOf = (id) => { const bare = String(id).split('.').pop(); return ctx.people()?.all.find((q) => q.id === id || q.id === bare) || null; };

  function loadLayouts() { return (layouts ??= readLayouts()); } // one read, however many places ask at once
  async function readLayouts() {
    const map = new Map();
    await Promise.all(ctx.sectionNames().map(async (name) => {
      const L = await fetch(`assets/${name}/layout.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (!L) return;
      const put = (id, X, D, H, kind, label, mapId = id) => { if (id && !map.has(id)) map.set(id, { X, D, H, kind, name: label, section: name, map_id: mapId }); };
      for (const [id, e] of Object.entries(L.entities || {})) if (e.pos) put(id, e.pos[0], e.pos[1], e.H ?? null, e.kind, e.name);
      for (const f of [...(L.figures || []), ...(L.trees || [])]) {
        put(f.map_id, f.X, f.D, f.H ?? null, f.map_id?.split('.')[1], f.what || f.pose || f.id);
        put(f.id, f.X, f.D, f.H ?? null, f.map_id?.split('.')[1], f.what || f.pose || f.id, f.map_id || f.id);
      }
    }));
    return map;
  }

  // the ground (or deck, roof, bridge) under X, D: the colliders' first surface from above
  function ground(X, D, fallback = 0) {
    const bvh = ctx.player.bvh;
    if (!bvh) return fallback;
    _ray.origin.set(X, 400, -D); _ray.direction.set(0, -1, 0);
    const hit = bvh.raycastFirst(_ray, THREE.DoubleSide);
    return hit ? hit.point.y : fallback;
  }

  // the live thing of an ID: a person or animal (people.js p.id) or a boat (boats.js b.id)
  function liveOf(id) {
    const bare = String(id).split('.').pop();
    const p = ctx.people()?.all.find((q) => q.id === id || q.id === bare);
    if (p) return (out) => out.copy(p.root.position);
    const b = ctx.boats()?.list.find((q) => q.id === id || q.id === bare || q.slug === bare);
    if (b?.mover) return (out) => out.setFromMatrixPosition(b.mover.matrix);
    return null;
  }

  // a place -> { get(out): Vector3 in the page frame, live, about }
  async function place(p) {
    if (p == null) throw new Error('a place is missing');
    if (typeof p === 'string') {
      const v = ctx.views[p];
      if (v) { const P = toPage(v.X, v.D, v.H || 0); return { get: (o) => o.copy(P), about: `view ${p}` }; }
      const L = (await loadLayouts()).get(p);
      if (!L) throw new Error(`unknown place "${p}" (a view name, a map ID, [X, D] or [X, D, H]; tools/film_places.mjs lists them)`);
      let P = null;
      return { get: (o) => o.copy(P ||= toPage(L.X, L.D, L.H ?? ground(L.X, L.D))), about: `${L.kind || 'map'} ${p} (${L.section})` };
    }
    if (Array.isArray(p)) {
      const [X, D, H] = p;
      let P = null;
      return { get: (o) => o.copy(P ||= toPage(X, D, H ?? ground(X, D))), about: `[${p.join(', ')}]` };
    }
    if (p.painter !== undefined) {
      const c = await place(p.painter), pv = await painterOf(p.painter), d = p.dist ?? 45, up = p.up ?? 0;
      return { get: (o) => c.get(o).setY(o.y + up).addScaledVector(pv.page, -d), live: c.live, about: `the painter's eye ${d} m from ${c.about} (bearing ${pv.deg}, ${pv.el_deg} deg down)` };
    }
    if (p.around !== undefined) {
      const c = await place(p.around), d = p.dist ?? 20, b = deg(p.deg ?? 0), e = deg(p.el_deg ?? 30), up = p.up ?? 0;
      const off = new THREE.Vector3(Math.cos(b) * Math.cos(e), Math.sin(e), -Math.sin(b) * Math.cos(e)).multiplyScalar(d);
      return { get: (o) => c.get(o).add(off).setY(o.y + up), live: c.live, about: `${d} m from ${c.about} at ${p.deg ?? 0} deg, ${p.el_deg ?? 30} deg up` };
    }
    if (p.at !== undefined) {
      const [dX, dD, dH] = p.offset || [0, 0, 0], up = (p.up ?? 0) + (dH || 0);
      // follow: the live body first (walkers of people.json have ids no map lists), else the thing's map spot
      const f = p.follow && typeof p.at === 'string' ? liveOf(p.at) : null;
      if (p.follow && !f) console.warn(`film: ${p.at} has no live body loaded; its map spot is used`);
      const base = f ? { get: f, live: true, about: `${p.at} (followed)` } : await place(p.at);
      return { get: (o) => { base.get(o); o.x += dX || 0; o.z -= dD || 0; o.y += up; return o; }, live: base.live, about: base.about };
    }
    throw new Error(`a place I can't read: ${JSON.stringify(p)}`);
  }

  // a value curve over time-keyed samples: cubic Hermite with Catmull-Rom tangents on uneven times
  function hermite(ts, vals, t, dim, out) {
    const n = ts.length;
    if (n === 1 || t <= ts[0]) return copy(vals[0], dim, out);
    if (t >= ts[n - 1]) return copy(vals[n - 1], dim, out);
    let i = 0;
    while (t > ts[i + 1]) i++;
    const t0 = ts[i], t1 = ts[i + 1], h = t1 - t0, s = (t - t0) / h;
    const s2 = s * s, s3 = s2 * s, h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    const tan = (k, c) => {
      const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1);
      return (get(vals[b], c) - get(vals[a], c)) / (ts[b] - ts[a]);
    };
    const res = [];
    for (let c = 0; c < dim; c++) res.push(h00 * get(vals[i], c) + h10 * h * tan(i, c) + h01 * get(vals[i + 1], c) + h11 * h * tan(i + 1, c));
    return dim === 1 ? res[0] : out.set(res[0], res[1], res[2]);
  }
  const get = (v, c) => (typeof v === 'number' ? v : c === 0 ? v.x : c === 1 ? v.y : v.z);
  const copy = (v, dim, out) => (dim === 1 ? v : out.copy(v));

  // compile a shot spec into pose(t, out) -> { pos, look, fov, roll }
  async function compile(spec) {
    const cam = spec.camera;
    if (!cam) throw new Error('the shot has no camera');
    const ease = EASE[cam.ease || (cam.kind === 'orbit' ? 'linear' : 'inout')];
    if (!ease) throw new Error(`unknown ease "${cam.ease}" (${Object.keys(EASE).join(', ')})`);
    if (cam.kind === 'orbit') {
      const c = await place(cam.around);
      const T = spec.seconds ?? cam.seconds ?? 20;
      const lookUp = cam.look_up ?? 1.2;
      const pose = (t, o) => {
        const u = ease(THREE.MathUtils.clamp(t / T, 0, 1));
        c.get(o.look); o.look.y += lookUp;
        const b = deg((cam.from_deg ?? 0) + (cam.turn_deg ?? 60) * u), e = deg(span(cam.el_deg ?? 35, u)), d = span(cam.dist ?? 30, u);
        o.pos.set(Math.cos(b) * Math.cos(e), Math.sin(e), -Math.sin(b) * Math.cos(e)).multiplyScalar(d).add(o.look);
        o.fov = span(cam.fov ?? 40, u); o.roll = 0;
        return o;
      };
      return { T, pose, live: !!c.live, about: `orbit round ${c.about}`, stand: (o) => c.get(o) };
    }
    if (cam.kind === 'move') {
      const keys = [...(cam.keys || [])].sort((a, b) => a.t - b.t);
      if (keys.length < 1) throw new Error('a move needs keys');
      const pos = await Promise.all(keys.map((k) => place(k.pos))), look = await Promise.all(keys.map((k) => place(k.look ?? k.pos)));
      const ts = keys.map((k) => k.t);
      let f = 45;
      const fovs = keys.map((k) => (f = k.fov ?? f)), rolls = keys.map((k) => k.roll_deg ?? 0);
      const T = spec.seconds ?? ts[ts.length - 1];
      const P = pos.map(() => new THREE.Vector3()), L = look.map(() => new THREE.Vector3());
      const isLive = pos.some((x) => x.live) || look.some((x) => x.live);
      let fixed = false;
      const pose = (t, o) => {
        if (!fixed || isLive) { pos.forEach((x, i) => x.get(P[i])); look.forEach((x, i) => x.get(L[i])); fixed = true; }
        const tt = ts[0] + (ts[ts.length - 1] - ts[0]) * ease(THREE.MathUtils.clamp((t - ts[0]) / Math.max(1e-6, ts[ts.length - 1] - ts[0]), 0, 1));
        hermite(ts, P, tt, 3, o.pos);
        hermite(ts, L, tt, 3, o.look);
        o.fov = hermite(ts, fovs, tt, 1); o.roll = hermite(ts, rolls, tt, 1);
        return o;
      };
      const last = look[look.length - 1];
      return { T, pose, live: isLive, about: `move through ${keys.length} keys, ${T} s`, stand: (o) => last.get(o) };
    }
    if (cam.kind === 'painting') {
      const at = cam.at ?? cam.around;
      const c = await place(at), pv = await painterOf(at);
      const T = spec.seconds ?? cam.seconds ?? 4, up = cam.up ?? 1.2;
      const pose = (t, o) => {
        const u = ease(THREE.MathUtils.clamp(t / T, 0, 1));
        c.get(o.look); o.look.y += up;
        o.pos.copy(o.look).addScaledVector(pv.page, -span(cam.dist ?? 45, u));
        o.fov = span(cam.fov ?? 8.5, u); o.roll = 0;
        return o;
      };
      return { T, pose, live: !!c.live, about: `the painter's view of ${c.about} (bearing ${pv.deg}, ${pv.el_deg} deg down)`, stand: (o) => c.get(o), painter: pv };
    }
    throw new Error(`unknown camera kind "${cam.kind}" (orbit | move | painting)`);
  }

  const P = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, roll: 0 };
  function place3(camera, o) {
    camera.position.copy(o.pos);
    // straight down has no "up": nudge the look point a hair along +X
    _v.copy(o.look).sub(o.pos);
    if (_v.x * _v.x + _v.z * _v.z < 1e-8) o.look.x += 1e-3;
    camera.up.set(0, 1, 0);
    camera.lookAt(o.look);
    if (o.roll) camera.rotateZ(deg(o.roll));
    if (Math.abs(camera.fov - o.fov) > 1e-6) { camera.fov = o.fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
  }

  // world.js tick, after the walking view and 鳥瞰 placed the camera: the shot's camera instead
  function apply(dt) {
    if (!shot || !(live || clock.held)) return; // a shot only loaded (planning, checks) leaves the camera alone
    if (live) at = Math.min(at + dt, shot.T);
    shot.pose(at, P);
    place3(ctx.camera, P);
    if (live && at >= shot.T && !shot.loop) stop();
  }

  // the camera as the editing tools read it, per frame; full: also the people in frame and the scan affine
  function info(t, full = true) {
    const c = ctx.camera;
    _w.copy(P.look).project(c);
    const o = {
      t: +t.toFixed(4), pos: toMap(c.position), look: toMap(P.look), fov: +c.fov.toFixed(3), roll: +(P.roll || 0).toFixed(3), aspect: +c.aspect.toFixed(4),
      quat: c.quaternion.toArray().map((v) => +v.toFixed(6)), // the page frame (x = X, y = H, z = -D); the camera looks down its -z
      look_px: [+((_w.x + 1) / 2).toFixed(4), +((1 - _w.y) / 2).toFixed(4)], // where the look point lands in the frame (0..1, from top left)
    };
    if (!full) return o;
    const W = innerWidth, H = innerHeight; // the delivered frame (film_shot's viewport; the drawn buffer is ss times it)
    const tr = track ? tracked(W, H) : null;
    if (tr) o.people = tr.list;
    if (shot?.scan) o.scan = scanInfo(W, H, tr);
    return o;
  }

  // a page-frame point -> [x, y] pixels of the delivered frame (from the top left), or null behind the camera
  function toPx(v, W, H) {
    const c = ctx.camera;
    if (_px.copy(v).applyMatrix4(c.matrixWorldInverse).z > -1e-3) return null;
    _px.copy(v).project(c);
    return [((_px.x + 1) / 2) * W, ((1 - _px.y) / 2) * H];
  }

  // People's heads and feet. The crowd poses bodies in the shader (crowd.js), so there is no skeleton per person to read:
  // each character gets one private copy of its rig here, posed at the person's clip and clip time, and its points are
  // carried to the person's spot exactly as the crowd's bake carries vertices (root^-1 . bone, then the person's root).
  const rigs = new Map(); // model -> { root, mixer, head, feet, topLocal, rootInv } | null (no head bone)
  function rigOf(model) {
    if (rigs.has(model)) return rigs.get(model);
    let r = null;
    try {
      const root = SkeletonUtils.clone(model.scene);
      root.updateMatrixWorld(true);
      const body = [];
      root.traverse((o) => { if (o.isSkinnedMesh) body.push(o); });
      const mesh = body.find((m) => !/^(tack|prop)_/.test(m.name)) || body[0];
      const bones = mesh?.skeleton.bones || [];
      const head = bones.find((b) => /head$/i.test(b.name)), feet = bones.filter((b) => /foot$/i.test(b.name)).slice(0, 2);
      if (head) {
        // the top of the head in the head bone's own frame, from the bind pose (whatever pose the model was left in)
        const hi = bones.indexOf(head), inv = mesh.skeleton.boneInverses[hi];
        const hp = new THREE.Vector3().setFromMatrixPosition(_m1.copy(inv).invert());
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        const top = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.bindMatrix).max.y;
        r = { root, mixer: new THREE.AnimationMixer(root), act: null, head, feet, topLocal: new THREE.Vector3(hp.x, top, hp.z).applyMatrix4(inv), rootInv: root.matrixWorld.clone().invert() };
      }
    } catch (e) { console.warn(`film: no rig for ${model.name}: ${e.message}`); }
    rigs.set(model, r);
    return r;
  }
  // a person's head (the middle of the head), top of the head and feet (between the ankles, on the ground under them),
  // in the page frame, as drawn now
  function personPoints(p) {
    const r = rigOf(p.model);
    if (!r) return null;
    const clip = p.cur?.clip || p.model.clips.find((c) => c.name === p.clip), time = p.cur ? p.cur.time : p.action?.time ?? 0;
    if (clip) {
      const a = r.mixer.clipAction(clip);
      if (r.act !== a) { r.act?.stop(); a.play(); r.act = a; }
      a.time = time % clip.duration;
      r.mixer.update(0);
    }
    r.root.updateMatrixWorld(true);
    p.root.updateMatrixWorld();
    _m2.multiplyMatrices(p.root.matrixWorld, r.rootInv);
    const joint = new THREE.Vector3().setFromMatrixPosition(r.head.matrixWorld).applyMatrix4(_m2);
    const top = r.topLocal.clone().applyMatrix4(r.head.matrixWorld).applyMatrix4(_m2);
    const foot = new THREE.Vector3();
    if (r.feet.length) { for (const f of r.feet) foot.add(_c.setFromMatrixPosition(f.matrixWorld).applyMatrix4(_m2)); foot.divideScalar(r.feet.length); } else foot.copy(p.root.position);
    foot.y = p.root.position.y; // the clips are grounded: the root stands on the ground
    return { head: joint.lerp(top, 0.5), top, foot };
  }
  // the camera's line to a point is cut by a solid surface (walls, ground, decks, hulls, trunks): 1, else 0
  function blocked(v, cols) {
    const c = ctx.camera.position, len = c.distanceTo(v);
    _ray.origin.copy(c); _ray.direction.copy(v).sub(c).divideScalar(len);
    for (const bvh of cols) { const h = bvh.raycastFirst(_ray, THREE.DoubleSide); if (h && h.distance < len - 0.25) return 1; }
    return 0;
  }
  // everyone in frame: { list: [{ id, clip, head, top, foot, d, occ }], byP: person -> points }
  function tracked(W, H) {
    const ppl = ctx.people();
    if (!ppl) return null;
    const cam = ctx.camera;
    _fr.setFromProjectionMatrix(_m1.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const only = Array.isArray(track) ? new Set(track.map((id) => String(id).split('.').pop())) : null;
    const cols = ctx.colliders(), list = [], byP = new Map();
    const inside = (a) => a[0] >= -0.05 * W && a[0] <= 1.05 * W && a[1] >= -0.05 * H && a[1] <= 1.05 * H;
    ppl.all.forEach((p, i) => {
      if (only && !only.has(String(p.id))) return;
      const q = p.root.position, d = cam.position.distanceTo(q);
      if (d > trackFar) return;
      _sph.center.set(q.x, q.y + 0.9, q.z); _sph.radius = 1.4 * Math.max(1, p.root.scale.y);
      if (!_fr.intersectsSphere(_sph)) return;
      const w = personPoints(p);
      if (!w) return;
      const head = toPx(w.head, W, H), top = toPx(w.top, W, H), foot = toPx(w.foot, W, H);
      if (!head || !top || !foot || (!inside(top) && !inside(foot))) return;
      byP.set(p, { head, top, foot });
      list.push({ id: p.id ?? `#${i}`, clip: p.clip, head: head.map(r1), top: top.map(r1), foot: foot.map(r1), d: +d.toFixed(2), occ: [blocked(w.head, cols), blocked(w.foot, cols)] });
    });
    return { list, byP };
  }

  // the render-to-scan affine of this frame: render pixels (the delivered frame) -> scan pixels of
  // reference/scroll/qingming_commons_38414x1800.jpg, fitted on a 7 x 5 x 5 grid (6 x 4 x 3 m) round the scan subject;
  // exact for an orthographic view along the painter's direction, residual (scan px) from the lens's perspective otherwise.
  // For a painted figure: its painted head, feet and box (scroll_index.json items), its live head and feet carried
  // onto the scan, and the shift that lays the live ones on the painted ones (M then + shift = the alignment).
  function scanInfo(W, H, tr) {
    const sc = shot.scan;
    sc.c.get(_c); _c.y += sc.up;
    const src = [], dst = [];
    for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) for (let k = -1.5; k <= 1.5; k += 0.75) {
      _v.set(_c.x + i, _c.y + k, _c.z - j);
      const px = toPx(_v, W, H);
      if (px) { src.push(px); dst.push(toScan(sc.frames, _v.x, -_v.z, _v.y)); }
    }
    if (src.length < 4) return { section: sc.section, M: null, why: 'the subject is behind the camera' };
    const { M, mean, max } = fitAffine(src, dst);
    const out = { section: sc.section, M: M.map((r) => r.map((v) => +v.toFixed(6))), res_px: [+mean.toFixed(2), +max.toFixed(2)] };
    if (sc.item) {
      const it = sc.item, sub = (out.subject = { id: sc.id, painted: { head: it.h ?? null, foot: it.f ?? null, box: it.b ?? null } });
      const p = personOf(sc.id);
      let px = p && tr?.byP.get(p);
      if (p && !px) { const w = personPoints(p); px = w && { head: toPx(w.head, W, H), foot: toPx(w.foot, W, H) }; }
      if (px?.head && px?.foot) {
        const head = applyM(M, px.head), foot = applyM(M, px.foot);
        sub.live = { head: head.map(r1), foot: foot.map(r1) };
        sub.shift_px = { head: it.h ? [r1(it.h[0] - head[0]), r1(it.h[1] - head[1])] : null, foot: it.f ? [r1(it.f[0] - foot[0]), r1(it.f[1] - foot[1])] : null };
      }
    }
    return out;
  }
  async function scanSetup(sub, up) {
    const c = await place(sub), id = idOf(sub);
    const q = toMap((await place(sub)).get(new THREE.Vector3()));
    const sc = await scrollAt(id, ...q);
    if (!sc?.frames) throw new Error(`scan: no painting frames for ${JSON.stringify(sub)}`);
    const L = id ? (await loadLayouts()).get(id) : null, mapId = L?.map_id || id;
    return { c, up, frames: sc.frames, section: sc.section, id: mapId, item: (mapId && sc.items?.[mapId]) || null };
  }

  // Passes for compositing, drawn over the canvas from the buffers the ink pass (post.js) just used for this frame:
  //   depth  the view depth (metres along the camera's axis) as 16 bits in red (high byte) and green (low byte), 0 at the
  //          lens to 65535 at `far` (sky and anything past it); film_shot.mjs decodes it to a 16-bit grey PNG
  //   line   the ink lines alone, exactly as the frame draws them (same weight, break-up, distance fade and mist),
  //          black on white
  // The pass shader is the ink pass's own (its helpers and uniforms), with a different main(), so it can't drift from it.
  let passQuad = null;
  function pass(kind, opts = {}) {
    const pm = ctx.post.material;
    if (!passQuad) {
      const head = pm.fragmentShader.slice(0, pm.fragmentShader.indexOf('void main()'));
      const main = /* glsl */ `
uniform float depthFar;
uniform int passKind;
void main() {
  if (passKind == 1) {
    float z = texture2D(tDepth, vUv).x >= 1.0 ? depthFar : viewZ(vUv);
    float q = floor(clamp(z / depthFar, 0.0, 1.0) * 65535.0 + 0.5);
    float hi = floor(q / 256.0);
    gl_FragColor = vec4(hi / 255.0, (q - hi * 256.0) / 255.0, 0.0, 1.0);
    return;
  }
  float dc = viewZ(vUv);
  float mist = mistOn > 0.5 && texture2D(tDepth, vUv).x < 1.0 ? mistAt(vUv, dc) : 0.0;
  float edge = 0.0;
  if (inkOn > 0.5) {
    vec2 px = thickness / resolution;
    float lap = 0.0;
    vec3 gx = vec3(0.0), gy = vec3(0.0);
    float ic = 1.0 / dc;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        if (x == 0 && y == 0) continue;
        vec2 uv = vUv + vec2(float(x), float(y)) * px;
        lap += 1.0 / viewZ(uv) - ic;
        vec3 n = nrm(uv);
        float wx = float(x) * (y == 0 ? 2.0 : 1.0);
        float wy = float(y) * (x == 0 ? 2.0 : 1.0);
        gx += n * wx;
        gy += n * wy;
      }
    }
    float de = abs(lap) / ic * depthSens * 0.5;
    float ne = sqrt(dot(gx, gx) + dot(gy, gy)) * normalSens * 0.25;
    edge = smoothstep(threshold, threshold * 1.6 + 0.05, max(de, ne));
    edge *= mix(1.0, smoothstep(0.2, 0.65, noise(vUv * resolution / 6.0)), 0.3);
    edge *= (1.0 - smoothstep(fadeStart, fadeEnd, dc)) * strength * (1.0 - mist);
  }
  gl_FragColor = vec4(vec3(1.0 - edge), 1.0);
}`;
      passQuad = new FullScreenQuad(new THREE.ShaderMaterial({
        uniforms: { ...pm.uniforms, depthFar: { value: 300 }, passKind: { value: 1 } }, // the ink pass's uniform objects themselves
        vertexShader: pm.vertexShader, fragmentShader: head + main, defines: { ...pm.defines }, depthTest: false, depthWrite: false,
      }));
    }
    const u = passQuad.material.uniforms;
    if (!{ depth: 1, line: 2 }[kind]) throw new Error(`unknown pass "${kind}" (depth | line)`);
    u.passKind.value = { depth: 1, line: 2 }[kind];
    u.depthFar.value = opts.far ?? 300;
    const r = ctx.renderer;
    r.setRenderTarget(null);
    passQuad.render(r);
    return { kind, far: u.depthFar.value, near: ctx.camera.near };
  }

  // poses: a figure plays one clip for the whole shot (the trailer's swap: the living pose matches the painted one)
  async function applyPoses(poses) {
    const out = [];
    for (const [id, v] of Object.entries(poses || {})) {
      const o = typeof v === 'string' ? { clip: v } : v;
      const p = personOf(id);
      if (!p) throw new Error(`poses: nobody live is "${id}" in the loaded window (people.json figures and walkers)`);
      const m = p.model, names = () => [...new Set([...m.clips.map((c) => c.name), ...(m.lazy?.keys() || [])])].sort().join(', ');
      if (!p.has(o.clip) && !m.lazy?.has(o.clip)) throw new Error(`poses: ${id} (${m.name}) has no clip "${o.clip}"; its clips: ${names()}`);
      if (!p.has(o.clip)) await m.fetchClip(o.clip);
      const ag = ctx.people().agents?.find((a) => a.p === p);
      const hold = o.speed === 0;
      if (ag) { poseSaved.push({ ag, update: ag.update }); ag.update = hold ? () => {} : () => p.keepLooping(); }
      if (o.facing_deg !== undefined) { poseSaved.push({ p, rot: p.root.rotation.y }); p.root.rotation.y = deg(o.facing_deg) + Math.PI / 2; }
      p.expect?.([o.clip]);
      p.play(o.clip, { fade: 0, offset: o.offset ?? 0, timeScale: o.speed ?? 1 });
      out.push({ id, character: m.name, clip: o.clip, offset: o.offset ?? 0, speed: o.speed ?? 1, routine_paused: !!ag });
    }
    return out;
  }

  function hold() {
    if (clock.held) return;
    virt = realNow();
    performance.now = () => virt; // every clock reader in the page runs on film time (CCapture.js's trick)
    clock.held = true;
  }
  function release() {
    if (!clock.held) return;
    clock.held = false;
    delete performance.now; // the prototype's again
    clock.resync?.(); // the page's frame timer from the real clock (film time may have run ahead of it)
    if (clock.parked) { clock.parked = false; requestAnimationFrame(ctx.tick); }
  }
  // one frame of film: the world by dt (s), the shot at time t (s), rendered
  // quick: the camera alone (warm-ups and pre-rolls skip the people and the scan)
  function step(t, dt, quick = false) {
    if (!clock.held) hold();
    at = t;
    virt += dt * 1000;
    clock.stepping = true;
    try { ctx.tick(virt); } finally { clock.stepping = false; }
    return info(t, !quick);
  }

  // the shot's path against the world: the camera's way through walls, ground, decks and trunks (errors); roofs, crowns,
  // awnings and other drawn things it passes through, the subject hidden, the lens too near a surface (warnings)
  function check(samplesPerSecond = 10) {
    if (!shot) throw new Error('no shot loaded');
    const n = Math.max(2, Math.ceil(shot.T * samplesPerSecond) + 1);
    const cols = ctx.colliders();
    const solid = (a, b) => {
      const d = b.clone().sub(a), len = d.length();
      if (len < 1e-6) return null;
      _ray.origin.copy(a); _ray.direction.copy(d).divideScalar(len);
      let best = null;
      for (const bvh of cols) { const h = bvh.raycastFirst(_ray, THREE.DoubleSide); if (h && h.distance < len && (!best || h.distance < best.distance)) best = h; }
      return best;
    };
    // the drawn world, for what the colliders don't hold (roofs, crowns, awnings): skinned people and the sky left out
    const meshes = [], crowd = ctx.people()?.crowd?.group;
    const walk = (o) => {
      if (!o.visible || o === crowd || o === ctx.sky) return; // the crowd's bodies are posed in the shader: their rest pose would mislead
      if (o.isMesh && !o.isSkinnedMesh && o.geometry?.attributes?.position) meshes.push(o);
      for (const c of o.children) walk(c);
    };
    walk(ctx.scene);
    const rc = new THREE.Raycaster();
    const drawn = (a, b) => {
      const d = b.clone().sub(a), len = d.length();
      if (len < 1e-6) return null;
      rc.set(a, d.divideScalar(len)); rc.near = 0; rc.far = len;
      const h = rc.intersectObjects(meshes, false)[0];
      return h ? { point: h.point, name: h.object.name || h.object.parent?.name || '?' } : null;
    };
    const errors = [], warnings = [];
    const o = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
    let prev = null;
    const t0 = realNow();
    for (let i = 0; i < n; i++) {
      const t = (shot.T * i) / (n - 1);
      shot.pose(t, o);
      const p = o.pos.clone();
      if (prev) {
        const h = solid(prev, p);
        if (h) errors.push({ t: +t.toFixed(2), kind: 'solid', what: 'the camera passes through a solid surface (wall, ground, deck, hull, trunk)', at: toMap(h.point) });
        else { const g = drawn(prev, p); if (g) warnings.push({ t: +t.toFixed(2), kind: `drawn:${g.name}`, what: `the camera passes through ${g.name}`, at: toMap(g.point) }); }
      }
      const s = solid(p, o.look);
      if (s && s.distance < p.distanceTo(o.look) - 0.6) warnings.push({ t: +t.toFixed(2), kind: 'hidden', what: 'the look point is hidden behind a solid surface', at: toMap(s.point) });
      for (const bvh of cols) {
        const near = bvh.closestPointToPoint(p, {}, 0, 0.3);
        if (near && near.distance < 0.3) { warnings.push({ t: +t.toFixed(2), kind: 'near', what: 'the lens is within 0.3 m of a surface', d: near.distance, at: toMap(p) }); break; }
      }
      prev = p;
    }
    // one line per kind and run of times, not one per sample (the nearest the lens came, for 'near')
    const squash = (list) => {
      const runs = new Map(), out = [];
      for (const x of list) {
        const l = runs.get(x.kind);
        if (l && x.t - l.to <= 1.5 / samplesPerSecond + 1e-6) { l.to = x.t; if (x.d < l.d) l.d = x.d; } else { const r = { from: x.t, to: x.t, what: x.what, at: x.at, d: x.d }; runs.set(x.kind, r); out.push(r); }
      }
      return out.sort((a, b) => a.from - b.from).map(({ d, ...r }) => (d === undefined ? r : { ...r, what: `${r.what} (nearest ${d.toFixed(2)} m)` }));
    };
    return { ok: errors.length === 0, samples: n, errors: squash(errors), warnings: squash(warnings), ms: Math.round(realNow() - t0), meshes: meshes.length };
  }

  let styled = false;
  // ready the world for filming: settings, hour, where it is centred, the film-only overrides; then the clock held
  // opts: { ss (the pixel ratio drawn at: 2 = supersampled), ink (line weight factor; default ss), stand: place,
  //   everyFrame (people pose every frame; default true), shadow: { half, size },
  //   track (people in each frame's camera: true | false | [ids]; default the spec's, else true), trackFar (m, 150) }
  async function prepare(opts = {}) {
    if (!shot) throw new Error('no shot loaded');
    release(); // streaming to the stand needs the real loop and clock
    const spec = shot.spec, s = ctx.s;
    if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.append(st); styled = true; }
    ctx.birdseye?.set(false);
    saved = saved || { ink: s.inkThickness, player: ctx.people()?.player, frozen: ctx.player.frozen, half: ctx.tiers.cfg.shadow.half, pr: ctx.renderer.getPixelRatio() };
    for (const [k, v] of Object.entries(spec.settings || {})) await ctx.set(k, v);
    await ctx.set('hour', spec.hour ?? 10);
    await ctx.set('timeFlow', spec.flow ?? 0);
    document.documentElement.classList.add('qm-film');
    const av = ctx.avatar(); if (av) av.root.visible = !!spec.show_avatar;
    // where the world is centred (the streaming window, the shadow box, people's detail): the shot's stand
    const st = opts.stand ?? spec.stand;
    const S = st ? (await place(st)).get(new THREE.Vector3()) : shot.stand(new THREE.Vector3());
    await ctx.goto(S.x, -S.z);
    // the page's own first teleport (its spawn view, still waiting for tree cards when the film API appears) can land
    // after ours and take the window back: go again until the stand's section is loaded and the player is still there
    const want = (await scrollAt(idOf(st ?? shot.spec.camera?.at ?? shot.spec.camera?.around), ...toMap(S)))?.folder;
    const t0 = realNow(), isIn = () => { const e = window.__test?.sections?.get(want); return !!e && (!e.state || e.state === 'in'); }; // world.js __test: a loaded section is its section
    if (want && !isIn()) {
      for (let i = 1; !isIn() && realNow() - t0 < 120000; i++) {
        // a teleport again when the player was moved, and every 2 s anyway (a settled goto can leave the window behind)
        if (i % 8 === 0 || Math.hypot(ctx.player.pos.x - S.x, ctx.player.pos.z - S.z) > 1) await ctx.goto(S.x, -S.z);
        await new Promise((r) => setTimeout(r, 250));
      }
      await ctx.goto(S.x, -S.z); // settled with the section in (cards sharpened, the window round it)
    }
    if (want && !ctx.loaded().includes(want)) console.warn(`film: the stand's section ${want} is not loaded (${ctx.loaded().join(' ')})`);
    ctx.player.frozen = true;
    const ppl = ctx.people(); if (ppl) { ppl.player = null; ppl.everyFrame = opts.everyFrame ?? true; } // no unseen walker to step round
    const poses = await applyPoses(spec.poses);
    track = opts.track ?? spec.track ?? true;
    trackFar = opts.trackFar ?? spec.track_far ?? 150;
    if (opts.shadow?.half) ctx.tiers.cfg.shadow.half = opts.shadow.half;
    if (opts.shadow?.size && ctx.sun.shadow.mapSize.x !== opts.shadow.size) { ctx.sun.shadow.mapSize.setScalar(opts.shadow.size); ctx.sun.shadow.map?.dispose(); ctx.sun.shadow.map = null; }
    const ss = opts.ss ?? 1;
    s.inkThickness = saved.ink * (opts.ink ?? ss); // the ink's line weight is in drawn pixels: as thick in the delivered frame as in the game
    if (Math.abs(ctx.renderer.getPixelRatio() - ss) > 1e-6) {
      ctx.renderer.setPixelRatio(ss);
      ctx.renderer.setSize(innerWidth, innerHeight);
      const size = ctx.renderer.getDrawingBufferSize(new THREE.Vector2());
      ctx.post.setSize(size.x, size.y);
    }
    at = 0;
    hold();
    return { stand: toMap(S), pixelRatio: ctx.renderer.getPixelRatio(), buffer: ctx.renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(), tier: ctx.tiers.name, loaded: ctx.loaded(), poses };
  }

  // the world runs on at shot time 0 (people settle into their routines, the crowd bakes, shaders compile)
  function warm(seconds = 2, fps = 30) {
    for (let i = 0; i < Math.round(seconds * fps); i++) step(0, 1 / fps, true);
    return info(0, false);
  }

  async function load(spec) {
    stop();
    const c = await compile(spec);
    shot = { spec, ...c, loop: !!spec.loop };
    const sub = spec.scan ?? (spec.camera.kind === 'painting' ? spec.camera.at ?? spec.camera.around : null);
    shot.scan = sub != null ? await scanSetup(sub, spec.camera.kind === 'painting' && spec.scan == null ? spec.camera.up ?? 1.2 : 1.0) : null;
    at = 0;
    return { T: c.T, about: c.about, live: c.live, painter: c.painter && { deg: c.painter.deg, el_deg: c.painter.el_deg, dir: c.painter.dir, px_per_m: c.painter.px_per_m },
      scan: shot.scan && { section: shot.scan.section, id: shot.scan.id, painted: !!shot.scan.item } };
  }

  // a live preview in the running page (real time, the UI as it is): the agent's or the user's look before a render
  async function play(spec) {
    await load(spec);
    live = true;
    if (ctx.player) ctx.player.frozen = true;
    return { T: shot.T };
  }
  function stop() {
    if (live && ctx.player) ctx.player.frozen = false;
    live = false;
    if (!clock.held) shot = null;
  }

  // everything back as it was (the CLI closes the page anyway)
  function end() {
    release();
    shot = null; live = false;
    document.documentElement.classList.remove('qm-film');
    if (saved) {
      const s = ctx.s;
      s.inkThickness = saved.ink;
      const ppl = ctx.people(); if (ppl) { ppl.player = saved.player; ppl.everyFrame = false; }
      ctx.player.frozen = saved.frozen;
      ctx.tiers.cfg.shadow.half = saved.half;
      const av = ctx.avatar(); if (av) av.root.visible = true;
      saved = null;
    }
    for (const x of poseSaved.reverse()) { if (x.ag) x.ag.update = x.update; else x.p.root.rotation.y = x.rot; }
    poseSaved = [];
    track = true;
  }

  return {
    clock, apply, load, play, stop, prepare, warm, step, check, end, hold, release, info, pass,
    // evaluate the shot at t without stepping the world (for checks and planning)
    pose: (t) => { shot.pose(t, P); return { pos: toMap(P.pos), look: toMap(P.look), fov: P.fov, roll: P.roll }; },
    place: async (p) => toMap((await place(p)).get(new THREE.Vector3())),
    get shot() { return shot && { T: shot.T, about: shot.about, live: shot.live }; },
    get active() { return !!shot; },
  };
}
