// Boats on the page (map/BUILDING.md "Boats and water"; the boat kit blender/kit_boats.py, gen/boats/types.md).
// A section whose layout lists boats ships assets/<name>_boats.glb (tools/export_web_scene.mjs, blender/build_boats.py):
// one movable root per boat and detail level, `boat:<map id>` and `boat:<map id>@lod1`, at its rest pose (its painted
// waterline, turned to its painted heading), with the nodes body, deck__col, roof__col, rim__col, board__edge,
// wet__ring, the moving parts (sweep, oar_*, mast: pivot at the node, extras anim/axis/amp/period/range) and the
// ropes line_* (extras a, b: their end points, named in their nodes' extras `points`; the root's `world_points`
// stay where they are in the world while the boat moves). assets/<name>/boats.json is the build's manifest.
//   - Motion. A moored boat rides the water gently (a slow bob, roll and pitch). A boat painted under way (rowed,
//     poled, towed, sailing, drifting, lowering its mast) moves a short way along its painted heading and back, like a
//     painted walker, pausing at its painted spot and at the far end (people.json boats.<slug>: run_m, speed_mps,
//     pause_s [at its spot, at the far end]; defaults by pose). Its sweep sculls, its oars stroke while it moves; a
//     mast being lowered goes down and up again (mast_cycle_s). Its bow wave (the kit's bow_wave node) shows only
//     while it goes ahead, as big as its speed (b.wave): never while it waits, nor going back astern, nor on a boat
//     whose run is too short to raise one. Boats step in lockstep with the walker (player.js
//     calls step(), so the walk tools, which call player.update themselves, move the boats too).
//   - Ropes are re-aimed every frame (line_*: from a to b, the tow line to its tracker's shoulder).
//   - Decks carry the player: each boat's deck, roof, rim, gangplank and boarding bridges are one BVH in the boat's own
//     frame (MovingBVH: the page's collider list takes it like a section's; triangles can be switched off). Standing
//     on it, the walker moves with it (player.js). Rims stand everywhere except where the boat touches something
//     walkable: at load each rim piece looks outward for a bank, stair, jetty or another boat's deck within 1.35 m at
//     about its deck's height; there the piece is dropped, a boarding bridge spans the gap, and the section's shore
//     walls (edge:shore, kit_boats.water_strip) open in front of it. A boat under way touches anything only at its
//     painted spot: there, while it pauses, its contacts open (and the pause waits for you while you stand in one).
//   - Crew: a figure whose layout support is `boat deck: <id>` or `boat roof: <id>` stands on that boat (its painted
//     spot carried into the boat's frame, on the deck or roof below it) and moves with it; people.json
//     boats.<slug>.crew.<figure>.work = 'sweep' | 'oar' puts it at the sweep's bar or an oar's grip (at: the point),
//     swinging with it; boats.<slug>.haul lists trackers on the bank, who walk with the boat's travel; boats.<slug>.tow
//     names the figure the tow line ends at. Crew of a boat under way show a dot in the scroll HUD (people.agentOf).
//   - Detail: boats further than LOD_FAR from the camera show the kit's lod 1.
//   - Flow (?boatflow=painted|waves; off by default, map/BUILDING.md holds today's motion): boatflow.js moves the boats
//     it takes along the river's lanes (assets/boatflow.json, tools/boat_lanes.mjs) instead: b.flow, b.base (the pose
//     on the lane, which the bob rides on), b.mastDeg; in 'waves' it adds copies of loaded boats (b.extra: their own
//     batch instances, roots and parts, the template's collider and crew spots) to this.list.
import * as THREE from 'three';
import { MeshBVH, ExtendedTriangle } from 'three-mesh-bvh';
import { BoatFlow, flowMode } from './boatflow.js';

const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
export const isBoat = (id, e) => e?.kind === 'vehicle' && id.split('.').pop().startsWith('boat_');
const slugOf = (id) => id.split('.').slice(2).join('.');
const deg = THREE.MathUtils.degToRad;

// how far and how fast a boat painted under way goes (metres, m/s), by its map pose (choice: a few boat lengths'
// worth of painted motion that reads as work, never a voyage)
const RUN = { rowed: [8, 0.6], poled: [6, 0.5], towed: [8, 0.5], sailing: [12, 0.9], drifting: [4, 0.25], 'lowering mast': [2, 0.2] };
const PAUSE = [8, 3]; // seconds at its painted spot, at the far end
const LOD_FAR = 36, LOD_NEAR = 32; // metres from the camera to the hull: lod 1 beyond, lod 0 again inside
const LINES_FAR = 90; // ropes are re-aimed only on boats nearer than this
const PROBE = [0.35, 0.6, 0.85, 1.1, 1.35, 1.7]; // metres out from a rim piece where a walkable surface is looked for
const CAT = { deck: 0, roof: 1, rim: 2, plank: 3, bridge: 4, cap: 5 };

// ---------------------------------------------------------------- a BVH that moves with an object
// The collider of a boat (or a set of switchable walls) in its own frame; the page's collider list (player.js
// MultiBVH) uses it like a section's BVH. Triangles flagged in `skip` don't collide (open rim pieces, bridges while
// closed, opened shore walls). Rigid transforms only (no scale): distances carry over.
const _box = new THREE.Box3(), _tri = new ExtendedTriangle(), _lray = new THREE.Ray(), _linv = new THREE.Matrix4(), _v = new THREE.Vector3(), _n3 = new THREE.Matrix3();
const _ray = new THREE.Ray(), _inv = new THREE.Matrix4();
export class MovingBVH {
  constructor(bvh, object, origOf = null) {
    this.bvh = bvh;
    this.object = object; // its matrixWorld places the BVH
    this.origOf = origOf; // BVH triangle -> the triangle as built (the BVH reorders them)
    this.skip = null; // Uint8Array per BVH triangle, or null
    this.moving = true;
  }
  get matrix() { return this.object.matrixWorld; }
  shapecast({ intersectsBounds, intersectsTriangle }) {
    const M = this.matrix, skip = this.skip;
    return this.bvh.shapecast({
      intersectsBounds: (box, ...rest) => intersectsBounds(_box.copy(box).applyMatrix4(M), ...rest),
      intersectsTriangle: (tri, i, ...rest) => {
        if (skip && skip[i]) return false;
        _tri.a.copy(tri.a).applyMatrix4(M); _tri.b.copy(tri.b).applyMatrix4(M); _tri.c.copy(tri.c).applyMatrix4(M);
        _tri.needsUpdate = true;
        return intersectsTriangle(_tri, i, ...rest);
      },
    });
  }
  raycast(ray, side = THREE.DoubleSide, near = 0, far = Infinity) {
    const M = this.matrix;
    _linv.copy(M).invert();
    _lray.copy(ray).applyMatrix4(_linv);
    const out = [];
    for (const h of this.bvh.raycast(_lray, side, near, far)) {
      if (this.skip && this.skip[h.faceIndex]) continue;
      h.point.applyMatrix4(M);
      h.distance = h.point.distanceTo(ray.origin);
      if (h.face) h.face.normal.applyMatrix3(_n3.getNormalMatrix(M)).normalize();
      h.mover = this;
      out.push(h);
    }
    return out.sort((a, b) => a.distance - b.distance);
  }
  raycastFirst(ray, side, near, far) { return this.raycast(ray, side, near, far)[0] || null; }
  closestPointToPoint(point, target = {}, min = 0, max = Infinity) {
    const M = this.matrix;
    _v.copy(point).applyMatrix4(_linv.copy(M).invert());
    const r = this.bvh.closestPointToPoint(_v, target, min, max);
    if (r) r.point.applyMatrix4(M);
    return r;
  }
}

// the colliders of a section's flow copies (boatflow.js) as one entry of the page's collider list, so copies made and
// dropped later need no rebuild of it
export class MoverSet {
  constructor() { this.list = []; this.moving = true; }
  shapecast(callbacks) { for (const m of this.list) if (m.shapecast(callbacks)) return true; return false; }
  raycastFirst(ray, side, near, far) { let best = null; for (const m of this.list) { const h = m.raycastFirst(ray, side, near, far); if (h && (!best || h.distance < best.distance)) best = h; } return best; }
  raycast(ray, side, near, far) { return this.list.flatMap((m) => m.raycast(ray, side, near, far)).sort((a, b) => a.distance - b.distance); }
  closestPointToPoint(point, target = {}, min = 0, max = Infinity) {
    let found = null;
    for (const m of this.list) { const r = m.closestPointToPoint(point, {}, min, max); if (r && r.distance < max) { max = r.distance; found = r; } }
    if (!found) return null;
    (target.point ||= new THREE.Vector3()).copy(found.point); target.distance = found.distance; target.faceIndex = found.faceIndex;
    return target;
  }
}

// ---------------------------------------------------------------- the boats of the loaded sections
const _m3 = new THREE.Matrix4();
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _down = new THREE.Vector3(0, -1, 0);
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

export class Boats {
  // hooks: { scene, loader, player, noNormalPass: [] (meshes the ink pass's normal buffer leaves out), getPeople() }
  constructor(hooks) {
    this.hooks = hooks;
    this.list = []; // every boat of the loaded sections
    this.byId = new Map();
    this.t = 0;
    this.stats = { stepMs: 0, updateMs: 0, steps: 0, frames: 0 };
    this._line = new THREE.Line3();
    this.camera = null; // the last camera update() saw (boatflow.js: what is in view)
    this.sections = null; // the page's loaded sections (boatflow.js: where the mist is)
    const mode = flowMode();
    this.flow = mode ? new BoatFlow(this, mode) : null;
  }

  // ------------------------------------------------------------ loading (world.js fetchSection)
  // the section's boats GLB, when its layout lists boats: a group of roots (added under the section's root, so the
  // page's materials, shading, shader warm-up and disposal cover them), the colliders taken out of it
  async fetch(name, layout) {
    const ids = Object.entries(layout?.entities || {}).filter(([id, e]) => isBoat(id, e)).map(([id]) => id);
    if (!ids.length) return null;
    // a missing or broken boats GLB costs the boats, never the section (check_deploy reports the failed request)
    const [gltf, manifest] = await Promise.all([this.hooks.loader.loadAsync(`assets/${name}_boats.glb`).catch((e) => { console.warn(`${name}: no boats (${e.message || e})`); return null; }),
      json(`assets/${name}/boats.json`)]);
    if (!gltf) return null;
    const set = { name, group: new THREE.Group(), boats: [], textures: gltf.parser.sharedTextures || [], manifest };
    set.group.name = `boats_${name}`;
    const nodeName = (o) => { const a = gltf.parser.associations.get(o); return a?.nodes !== undefined ? gltf.parser.json.nodes[a.nodes].name : null; };
    gltf.scene.updateMatrixWorld(true);
    const roots = new Map();
    for (const root of [...gltf.scene.children]) {
      const raw = nodeName(root) || '';
      const m = /^boat:(.+?)(@lod1)?$/.exec(raw);
      if (!m) continue;
      const e = roots.get(m[1]) || { id: m[1] };
      e[m[2] ? 'lod1' : 'lod0'] = root;
      roots.set(m[1], e);
    }
    for (const { id, lod0, lod1 } of roots.values()) {
      if (!lod0) continue;
      const b = { id, slug: slugOf(id), section: name, set, info: { ...lod0.userData }, entry: manifest?.boats?.[id] || {}, roots: [lod0, lod1].filter(Boolean),
        rest: lod0.matrixWorld.clone(), lods: [], colliders: {}, lod: 0, s: 0, effort: 0, state: 'rest', atRest: true, clock: 0, contacts: [], crew: [] };
      b.restInv = b.rest.clone().invert();
      b.restPos = new THREE.Vector3(); b.restQ = new THREE.Quaternion();
      b.rest.decompose(b.restPos, b.restQ, _s);
      b.heading = Math.atan2(-(new THREE.Vector3(1, 0, 0).applyQuaternion(b.restQ).z), new THREE.Vector3(1, 0, 0).applyQuaternion(b.restQ).x); // map heading, + toward north
      b.under = b.info.motion === 'under_way';
      b.worldPoints = new Map();
      for (const [li, root] of b.roots.entries()) {
        const lod = { root, parts: [], lines: [], points: new Map() };
        for (const [n, p] of Object.entries(root.userData.points || {})) lod.points.set(n, { node: null, p: new THREE.Vector3(...p) });
        for (const holder of [...root.children]) {
          const raw = nodeName(holder) || '';
          const part = raw.split(':')[0];
          const ud = holder.userData || {};
          for (const [n, p] of Object.entries(ud.points || {})) lod.points.set(n, { node: holder, p: new THREE.Vector3(...p) });
          if (/__col$|__edge$/.test(part)) {
            // colliders leave the scene graph: lod 0's become the boat's BVH (each mesh keeps its place in the root's
            // frame), lod 1's are not needed
            _m.copy(root.matrixWorld).invert();
            holder.traverse((o) => { if (o.isMesh) o.userData.toRoot = new THREE.Matrix4().multiplyMatrices(_m, o.matrixWorld); });
            root.remove(holder);
            if (li === 0) (b.colliders[part] ||= []).push(holder);
            else holder.traverse((o) => o.geometry?.dispose());
            continue;
          }
          if (part === 'wet__ring') continue;
          if (part.startsWith('line_')) {
            lod.lines.push({ node: holder, a: ud.a, b: ud.b, name: part, collide: !!ud.collide, q0: holder.quaternion.clone(), p0: holder.position.clone(), s0: holder.scale.clone() });
            continue;
          }
          if (ud.anim && ud.anim !== 'ripple') {
            const axis = new THREE.Vector3(...(ud.axis_gltf || [0, 1, 0])).normalize();
            const q0 = holder.quaternion.clone();
            let sign = 1;
            if (ud.anim === 'mast' && ud.angle_deg) { // the node's rest rotation is the painted angle about its axis
              const th = 2 * Math.atan2(q0.x * axis.x + q0.y * axis.y + q0.z * axis.z, q0.w);
              sign = Math.sign(th) || 1;
            }
            lod.parts.push({ node: holder, kind: ud.anim, axis, roll: ud.roll_axis_gltf ? new THREE.Vector3(...ud.roll_axis_gltf).normalize() : null,
              amp: deg(ud.amp_deg || 0), period: ud.period_s || 3, q0, sign, rest: ud.angle_deg || 0, range: ud.range_deg || null,
              side: Math.sign(holder.position.z) || 1, phase: hash(id + part) * Math.PI * 2 });
          }
        }
        b.lods.push(lod);
        root.removeFromParent();
        set.group.add(root);
      }
      for (const n of b.roots[0].userData.world_points || []) {
        const pt = b.lods[0].points.get(n);
        if (pt) b.worldPoints.set(n, pt.p.clone().applyMatrix4(b.rest));
      }
      set.boats.push(b);
    }
    this.batch(set);
    return set;
  }

  // every visible mesh of the section's boats (bodies, moving parts, ropes, wet rings, both detail levels) goes into one
  // BatchedMesh per material: one draw per material for all the boats, each piece an instance whose matrix follows its
  // boat and node (update). Geometry is baked into its node's frame as plain floats (the shipped GLB's quantization
  // differs from mesh to mesh, a batch needs one layout).
  batch(set) {
    const byMat = new Map(), shared = new Map();
    const M = new THREE.Matrix4(), N3 = new THREE.Matrix3(), v = new THREE.Vector3();
    for (const b of set.boats) {
      b.items = b.roots.map(() => []);
      b.roots.forEach((root, li) => {
        root.updateMatrixWorld(true);
        for (const holder of root.children) holder.traverse((o) => {
          if (!o.isMesh) return;
          M.copy(holder.matrixWorld).invert().multiply(o.matrixWorld);
          const gkey = o.geometry.uuid + '|' + M.elements.map((x) => x.toFixed(5)).join(','); // ropes share one unit line
          let geo = shared.get(gkey);
          if (!geo) {
            const g = o.geometry, pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, n = pos.count;
            const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), U = new Float32Array(n * 2);
            N3.getNormalMatrix(M);
            for (let i = 0; i < n; i++) {
              v.fromBufferAttribute(pos, i).applyMatrix4(M).toArray(P, i * 3);
              if (nor) v.fromBufferAttribute(nor, i).applyMatrix3(N3).normalize().toArray(Nn, i * 3); else Nn[i * 3 + 1] = 1;
              if (uv) { U[i * 2] = uv.getX(i); U[i * 2 + 1] = uv.getY(i); }
            }
            geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
            geo.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(U, 2));
            geo.setIndex(g.index ? Array.from(g.index.array) : [...Array(n).keys()]);
            shared.set(gkey, geo);
          }
          const name = o.material.name || 'boat';
          if (!byMat.has(name)) byMat.set(name, { material: o.material, items: [] });
          const item = { geo, holder, root, b, li };
          if (holder.userData?.anim === 'bow_wave') { // it shrinks into the stem as the boat slows (place)
            geo.computeBoundingBox();
            item.stem = geo.boundingBox.max.x;
          }
          byMat.get(name).items.push(item);
          b.items[li].push(item);
        });
        for (const holder of root.children) for (const c of [...holder.children]) { c.removeFromParent(); c.traverse((o) => o.geometry?.dispose()); }
      });
    }
    set.batches = [];
    for (const [name, { material, items }] of byMat) {
      const geos = [...new Set(items.map((it) => it.geo))];
      const nv = geos.reduce((a, g) => a + g.attributes.position.count, 0), ni = geos.reduce((a, g) => a + g.index.count, 0);
      const bm = new THREE.BatchedMesh(items.length, nv, ni, material);
      bm.name = `boats_${set.name}_${name}`;
      bm.frustumCulled = false; // each instance is culled by itself (perObjectFrustumCulled)
      const ids = new Map(geos.map((g) => [g, bm.addGeometry(g)]));
      for (const it of items) { it.bm = bm; it.gid = ids.get(it.geo); it.inst = bm.addInstance(it.gid); bm.setVisibleAt(it.inst, it.li === 0); }
      geos.forEach((g) => g.dispose()); // copied into the batch
      if (name === 'water_ring') { bm.renderOrder = 1; set.ring = bm; }
      set.group.add(bm);
      set.batches.push(bm);
    }
    for (const b of set.boats) this.place(b);
  }

  // the batch instances of a boat's shown detail level follow its root and their nodes
  place(b) {
    for (const it of b.items[b.lod]) {
      _m.multiplyMatrices(it.root.matrixWorld, it.holder.matrix);
      if (it.stem != null) { // the bow wave, scaled about the stem by the boat's way (0: gone)
        const w = Math.max(b.wave || 0, 1e-4);
        _m.multiply(_m2.makeTranslation(it.stem, 0, 0)).multiply(_m3.makeScale(w, 1, w)).multiply(_m2.makeTranslation(-it.stem, 0, 0));
      }
      it.bm.setMatrixAt(it.inst, _m);
    }
  }

  // ------------------------------------------------------------ joining (world.js addSection, before its colliders)
  // colliders, contacts with the bank and the other boats, shore walls opened, the section's movers
  add(sec, sections) {
    this.sections = sections;
    const set = sec.boats;
    if (!set) return;
    const spec = sec.people?.boats || {};
    for (const b of set.boats) {
      b.spec = spec[b.slug] || spec[b.id] || {};
      const [run, speed] = RUN[b.info.pose] || [6, 0.5];
      b.run = Math.max(0.05, b.spec.run_m ?? run); // run_m 0 made travel 0 and k = 0/0: NaN hull, crew and walkers
      b.speed = b.spec.speed_mps ?? speed;
      b.pauses = b.spec.pause_s ?? PAUSE;
      b.travel = (b.run / Math.max(0.05, b.speed)) * 1.25;
      b.clock = hash(b.id) * 4; // boats don't start in step
      b.phase = hash(b.id + 'bob') * Math.PI * 2;
      b.mastCycle = b.spec.mast_cycle_s ?? 24;
      this.local(b);
    }
    // each boat's deck, roof and gangplank, at rest, for the contact probes of its neighbours
    if (set.ring) { set.ring.castShadow = false; this.hooks.noNormalPass.push(set.ring); } // the wet rings: no shadow, no ink
    const statics = [...new Set([...[...sections.values()].map((x) => x.bvh), sec.bvh])].filter(Boolean);
    for (const b of set.boats) this.contacts(b, statics, set.boats.filter((o) => o !== b));
    this.reciprocal(set.boats);
    for (const b of set.boats) this.build(b);
    this.gates(sec, set);
    if (this.flow) set.flowMovers = new MoverSet(); // its flow copies' decks (boatflow.js)
    sec.movers = [...set.boats.map((b) => b.mover), set.gateMover, set.flowMovers].filter(Boolean);
    for (const b of set.boats) { this.list.push(b); this.byId.set(b.id, b); }
    for (const b of set.boats) this.applyOpen(b);
    if (this.flow) return this.flow.attach(sec); // the section's lanes and the boats that take them (a promise)
  }

  remove(sec) {
    const set = sec.boats;
    if (!set) return;
    this.flow?.detach(sec); // its flow boats go with it (their copies leave this.list, their crew the page)
    for (const b of set.boats) {
      this.list.splice(this.list.indexOf(b), 1);
      this.byId.delete(b.id);
      b.geom?.dispose(); b.probeGeom?.dispose();
      for (const hs of Object.values(b.colliders)) for (const h of hs) h.traverse((o) => o.geometry?.dispose());
    }
    if (set.ring) { const i = this.hooks.noNormalPass.indexOf(set.ring); if (i >= 0) this.hooks.noNormalPass.splice(i, 1); }
    for (const bm of set.batches || []) bm.dispose(); // its matrix and index textures (world.js disposes its geometry)
    set.gateGeom?.dispose();
    sec.movers = [];
  }

  // the boat's colliders in its own frame (lod 0 root at rest): deck, roof, rim pieces, the gangplank with side rails
  local(b) {
    const tris = []; // [cat, piece, ax, ay, az, bx, by, bz, cx, cy, cz]
    const add = (cat, piece, a, bb, c) => tris.push([cat, piece, a.x, a.y, a.z, bb.x, bb.y, bb.z, c.x, c.y, c.z]);
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
    const rimTris = [];
    for (const [part, cat] of [['deck__col', CAT.deck], ['roof__col', CAT.roof], ['rim__col', CAT.rim]]) {
      for (const h of b.colliders[part] || []) h.traverse((o) => {
        if (!o.isMesh) return;
        _m.copy(o.userData.toRoot);
        const pos = o.geometry.getAttribute('position'), idx = o.geometry.index;
        const n = idx ? idx.count / 3 : pos.count / 3;
        for (let t = 0; t < n; t++) {
          const i0 = idx ? idx.getX(3 * t) : 3 * t, i1 = idx ? idx.getX(3 * t + 1) : 3 * t + 1, i2 = idx ? idx.getX(3 * t + 2) : 3 * t + 2;
          va.fromBufferAttribute(pos, i0).applyMatrix4(_m); vb.fromBufferAttribute(pos, i1).applyMatrix4(_m); vc.fromBufferAttribute(pos, i2).applyMatrix4(_m);
          if (cat === CAT.rim) rimTris.push([va.clone(), vb.clone(), vc.clone()]);
          else add(cat, -1, va, vb, vc);
        }
      });
    }
    // rim pieces: the kit makes each a vertical quad (two triangles over the same stretch of the deck edge)
    const pieces = new Map();
    for (const [p, q, r] of rimTris) {
      const pts = [p, q, r];
      let best = [0, 1], bd = -1;
      for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) { const d = Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z); if (d > bd) { bd = d; best = [i, j]; } }
      const ends = best.map((i) => pts[i]).sort((u, v) => u.x - v.x || u.z - v.z);
      const key = ends.map((e) => `${e.x.toFixed(2)},${e.z.toFixed(2)}`).join('|');
      if (!pieces.has(key)) pieces.set(key, { tris: [], ends, y: Math.min(p.y, q.y, r.y) });
      const pc = pieces.get(key);
      pc.tris.push([p, q, r]);
      pc.y = Math.min(pc.y, p.y, q.y, r.y);
    }
    b.pieces = [...pieces.values()];
    const L = b.info.lw || 20;
    for (const [k, pc] of b.pieces.entries()) {
      // each end on the deck there (the rim stands from 0.1 m below the deck; the deck rises with the sheer)
      const foot = (e) => Math.min(...pc.tris.flat().filter((v) => Math.hypot(v.x - e.x, v.z - e.z) < 0.02).map((v) => v.y)) + 0.1;
      const [e0, e1] = pc.ends;
      pc.a = new THREE.Vector3(e0.x, foot(e0), e0.z); pc.b = new THREE.Vector3(e1.x, foot(e1), e1.z);
      pc.mid = pc.a.clone().add(pc.b).multiplyScalar(0.5);
      const t = pc.b.clone().sub(pc.a).setY(0).normalize();
      pc.n = new THREE.Vector3(t.z, 0, -t.x);
      const c = new THREE.Vector3(THREE.MathUtils.clamp(pc.mid.x, -L / 2 + 3, L / 2 - 3), pc.mid.y, 0);
      if (pc.n.dot(pc.mid.clone().sub(c)) < 0) pc.n.negate();
      pc.len = pc.a.distanceTo(pc.b);
      for (const [p, q, r] of pc.tris) add(CAT.rim, k, p, q, r);
    }
    // the gangplank: a walkable plank from the deck to the bank, with invisible rails along both edges
    for (const lod of b.lods.slice(0, 1)) for (const ln of lod.lines) {
      if (!ln.collide) continue;
      const A = this.pointRest(b, ln.a), B = this.pointRest(b, ln.b);
      if (!A || !B) continue;
      // the walkable corridor is wider than the painted plank (0.42 m): the walker is 0.6 m across
      const d = B.clone().sub(A), w = new THREE.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(0.42);
      const up = new THREE.Vector3(0, 0.04, 0);
      const a0 = A.clone().sub(w).add(up), a1 = A.clone().add(w).add(up), b0 = B.clone().sub(w).add(up), b1 = B.clone().add(w).add(up);
      add(CAT.plank, -1, a0, b0, b1); add(CAT.plank, -1, a0, b1, a1);
      const h = new THREE.Vector3(0, 1.0, 0);
      for (const [p, q] of [[a0, b0], [a1, b1]]) { add(CAT.plank, -1, p, q, q.clone().add(h)); add(CAT.plank, -1, p, q.clone().add(h), p.clone().add(h)); }
      b.plank = { A, B, rails: [a0, a1] };
    }
    b.tris = tris;
    // the probe: deck, roof and plank only, for the neighbours' contact tests
    b.probeGeom = this.geometry(tris.filter((t) => t[0] !== CAT.rim));
    b.probe = new MovingBVH(new MeshBVH(b.probeGeom), { matrixWorld: b.rest });
  }

  geometry(tris) {
    const arr = new Float32Array(tris.length * 9);
    tris.forEach((t, i) => arr.set(t.slice(2), i * 9));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }

  // a named point of the boat at rest, in the root's frame (a world-fixed one too)
  pointRest(b, name) {
    const pt = b.lods[0].points.get(name);
    if (!pt) return null;
    if (!pt.node) return pt.p.clone();
    pt.node.updateMatrix();
    return pt.p.clone().applyMatrix4(pt.node.matrix);
  }

  // where each rim piece touches something walkable: the bank, a stair or jetty (the loaded sections' colliders) or a
  // neighbour's deck, looked for at three points along the piece. A gangplank's foot is a contact too (its rim piece
  // opens; the shore wall at its foot opens).
  contacts(b, statics, others) {
    const water = b.restPos.y;
    const P = new THREE.Vector3(), N = new THREE.Vector3(), Q = new THREE.Vector3(), O = new THREE.Vector3();
    for (const [k, pc] of b.pieces.entries()) {
      N.copy(pc.n).transformDirection(b.rest);
      let far = 0, other = null;
      const ys = [];
      for (const f of [0.2, 0.5, 0.8]) {
        P.copy(pc.a).lerp(pc.b, f).applyMatrix4(b.rest);
        const deckY = P.y;
        for (const d of PROBE) {
          Q.copy(P).addScaledVector(N, d);
          _ray.set(O.set(Q.x, deckY + 1.2, Q.z), _down);
          let best = null;
          for (const bvh of statics) { const h = bvh.raycastFirst(_ray, THREE.DoubleSide); if (h && (!best || h.distance < best.h.distance)) best = { h, other: null }; }
          for (const o of others) { const h = o.probe.raycastFirst(_ray, THREE.DoubleSide); if (h && (!best || h.distance < best.h.distance)) best = { h, other: o }; }
          if (!best) continue;
          const y = best.h.point.y, ny = best.h.face ? Math.abs(best.h.face.normal.y) : 1;
          if (ny > 0.6 && y > deckY - 1.2 && y < deckY + 0.7 && y > water + 0.15) { far = Math.max(far, d); ys.push(y); other ||= best.other; break; }
          if (y > deckY + 0.7) break; // a wall or a roof in the way
        }
      }
      if (ys.length) this.addContact(b, k, far, ys.reduce((a, y) => a + y, 0) / ys.length, other);
    }
    if (b.plank) {
      const k = b.pieces.reduce((best, pc, i) => (best < 0 || pc.mid.distanceTo(b.plank.A) < b.pieces[best].mid.distanceTo(b.plank.A) ? i : best), -1);
      // a piece that already touches a neighbour boat keeps that contact: the plank's own then only opens the shore
      // walls at its foot (no rim caps beside it: they would stand across the bridge to the neighbour)
      const shared = b.contacts.some((c) => c.piece === k);
      if (k >= 0) {
        const A = b.plank.A.clone().applyMatrix4(b.rest), B = b.plank.B.clone().applyMatrix4(b.rest);
        // its footprint: the shore walls within 0.6 m of the plank open (the plank's own rails close its sides)
        const w = new THREE.Vector3(-(B.z - A.z), 0, B.x - A.x).normalize().multiplyScalar(0.6), e = B.clone().sub(A).setY(0).normalize().multiplyScalar(0.3);
        b.contacts.push({ piece: k, other: null, d: 0, quad: null, plank: true, shared, from: b.pieces[k].mid.clone().applyMatrix4(b.rest), to: B, len: 1.0,
          foot: [A.clone().sub(w), A.clone().add(w), B.clone().add(w).add(e), B.clone().sub(w).add(e)] });
      }
    }
  }

  // a contact of piece k: a bridge from the rim's foot out d (+0.25) to the surface found at height y, and its
  // footprint on the ground (rim to d + 0.3: the shore walls inside it open with it)
  addContact(b, k, d, y, other) {
    const pc = b.pieces[k];
    const P = pc.mid.clone().applyMatrix4(b.rest), N = pc.n.clone().transformDirection(b.rest);
    const outW = P.clone().addScaledVector(N, d + 0.25).setY(y + 0.02);
    const outL = outW.clone().applyMatrix4(b.restInv);
    const off = outL.clone().sub(pc.mid).setY(0);
    const a1 = pc.a.clone().add(off).setY(outL.y), b1 = pc.b.clone().add(off).setY(outL.y);
    const fa = pc.a.clone().applyMatrix4(b.rest), fb = pc.b.clone().applyMatrix4(b.rest);
    b.contacts.push({ piece: k, other, d, quad: [pc.a.clone(), pc.b.clone(), b1, a1], from: P, to: outW, len: pc.len,
      foot: [fa, fb, fb.clone().addScaledVector(N, d + 0.3), fa.clone().addScaledVector(N, d + 0.3)] });
  }

  // rafted boats open each other: a piece of the neighbour facing an open piece of this boat, within 1.9 m of it,
  // opens too, its bridge reaching this boat's rim
  reciprocal(boats) {
    const seg = new THREE.Line3(), cp = new THREE.Vector3();
    for (const b of boats) for (const ct of [...b.contacts]) {
      const o = ct.other;
      if (!o) continue;
      const pc = b.pieces[ct.piece];
      seg.set(pc.a.clone().applyMatrix4(b.rest), pc.b.clone().applyMatrix4(b.rest));
      for (const [j, pj] of o.pieces.entries()) {
        if (o.contacts.some((c) => c.piece === j)) continue;
        const M = pj.mid.clone().applyMatrix4(o.rest), Nj = pj.n.clone().transformDirection(o.rest);
        const t = seg.closestPointToPointParameter(M, false);
        if (t < -0.25 || t > 1.25) continue;
        seg.at(THREE.MathUtils.clamp(t, 0, 1), cp);
        const to = cp.clone().sub(M).setY(0), along = Nj.dot(to);
        if (along <= 0.05 || to.length() > 1.9) continue;
        this.addContact(o, j, along, cp.y, b);
      }
    }
  }

  // the boat's BVH: its colliders, a bridge per contact, and invisible end walls where a run of open pieces stops
  // (so nobody walks along the bridges past the contact's end into the water); per triangle what it is, so pieces
  // can be switched
  build(b) {
    const tris = b.tris.slice();
    const key = (v) => `${v.x.toFixed(2)},${v.z.toFixed(2)}`;
    const at = new Map();
    b.pieces.forEach((pc, k) => { for (const e of [pc.a, pc.b]) { const kk = key(e); if (!at.has(kk)) at.set(kk, []); at.get(kk).push(k); } });
    b.caps = 0;
    for (const [i, c] of b.contacts.entries()) {
      const pc = b.pieces[c.piece];
      if (c.quad) {
        const [a0, b0, b1, a1] = c.quad;
        tris.push([CAT.bridge, i, a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, b1.x, b1.y, b1.z]);
        tris.push([CAT.bridge, i, a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, a1.x, a1.y, a1.z]);
      }
      if (c.plank && c.shared) continue;
      if (c.plank) {
        // the gangplank's foot on deck: the rim stays on either side of it (its own rails close the plank)
        const ab = pc.b.clone().sub(pc.a), L2 = ab.lengthSq();
        const ts = b.plank.rails.map((r) => THREE.MathUtils.clamp(r.clone().sub(pc.a).dot(ab) / L2, 0, 1)).sort((x, y) => x - y);
        for (const [t0, t1] of [[0, ts[0]], [ts[1], 1]]) {
          if (t1 - t0 < 0.02) continue;
          const p0 = pc.a.clone().lerp(pc.b, t0), p1 = pc.a.clone().lerp(pc.b, t1), h = new THREE.Vector3(0, 1.1, 0), lo = new THREE.Vector3(0, -0.1, 0);
          const q = [p0.clone().add(lo), p1.clone().add(lo), p1.clone().add(h), p0.clone().add(h)];
          tris.push([CAT.cap, i, ...q[0].toArray(), ...q[1].toArray(), ...q[2].toArray()]);
          tris.push([CAT.cap, i, ...q[0].toArray(), ...q[2].toArray(), ...q[3].toArray()]);
        }
        continue;
      }
      for (const [e, outer] of [[pc.a, c.quad?.[3]], [pc.b, c.quad?.[2]]]) {
        const shared = at.get(key(e)).some((j) => j !== c.piece && b.contacts.some((x) => x.piece === j && x.other === c.other));
        if (shared) continue;
        const o = outer ? outer.clone().addScaledVector(pc.n, -0.2) : e.clone().addScaledVector(pc.n, 1.2);
        if (this.acrossPlank(b, e, o)) continue; // an end wall across the gangplank would shut it (its rails close it)
        const y0 = Math.min(e.y, o.y) - 0.2, y1 = Math.max(e.y, o.y) + 1.1;
        const p0 = new THREE.Vector3(e.x, y0, e.z), p1 = new THREE.Vector3(o.x, y0, o.z), p2 = new THREE.Vector3(o.x, y1, o.z), p3 = new THREE.Vector3(e.x, y1, e.z);
        tris.push([CAT.cap, i, p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]);
        tris.push([CAT.cap, i, p0.x, p0.y, p0.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z]);
        b.caps++;
      }
    }
    b.geom = this.geometry(tris);
    const bvh = new MeshBVH(b.geom);
    const idx = b.geom.index.array, n = idx.length / 3;
    const origOf = new Uint32Array(n);
    for (let i = 0; i < n; i++) origOf[i] = Math.floor(idx[3 * i] / 3);
    b.cats = Uint8Array.from(tris, (t) => t[0]);
    b.which = Int16Array.from(tris, (t) => t[1]);
    b.mover = new MovingBVH(bvh, b.roots[0], origOf);
    b.mover.boat = b;
    b.mover.skip = new Uint8Array(n);
    b.tris = null;
  }

  // does the level segment e -> o (the boat's frame at rest) cross its gangplank's walkable corridor (0.42 m either
  // side of the plank, plus a walker's half width)?
  acrossPlank(b, e, o) {
    if (!b.plank) return false;
    const { A, B } = b.plank, ab = new THREE.Vector2(B.x - A.x, B.z - A.z), L = ab.length();
    if (L < 1e-3) return false;
    ab.divideScalar(L);
    for (let i = 0; i <= 20; i++) {
      const x = e.x + ((o.x - e.x) * i) / 20 - A.x, z = e.z + ((o.z - e.z) * i) / 20 - A.z;
      const along = x * ab.x + z * ab.y, side = Math.abs(-x * ab.y + z * ab.x);
      if (along > -0.3 && along < L + 0.3 && side < 0.42 + 0.3) return true;
    }
    return false;
  }

  // the shore walls (edge:shore, 0.5 m pieces) inside a contact's footprint leave the section's walls for a switchable
  // set: they open with their contact. What stays beyond a footprint's end is under 0.5 m, too narrow to pass.
  gates(sec, set) {
    const shore = sec.edges?.shore;
    if (!shore) return;
    const pos = shore.getAttribute('position'), idx = shore.index;
    const n = idx ? idx.count / 3 : pos.count / 3;
    const keep = [], moved = [];
    const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], c = new THREE.Vector3();
    const inside = (q, p) => { let sgn = 0; for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4], cr = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x); if (Math.abs(cr) < 1e-9) continue; const s = Math.sign(cr); if (sgn && s !== sgn) return false; sgn = s; } return true; };
    for (let t = 0; t < n; t++) {
      for (let j = 0; j < 3; j++) v[j].fromBufferAttribute(pos, idx ? idx.getX(3 * t + j) : 3 * t + j);
      c.copy(v[0]).add(v[1]).add(v[2]).multiplyScalar(1 / 3);
      let owner = null;
      for (const b of set.boats) { for (const ct of b.contacts) if (!ct.other && inside(ct.foot, c)) { owner = { b, ct }; break; } if (owner) break; }
      const tri = v.flatMap((p) => [p.x, p.y, p.z]);
      if (owner) { moved.push({ tri, ...owner }); owner.ct.gates = (owner.ct.gates || 0) + 1; } else keep.push(tri);
    }
    if (!moved.length) return;
    // the walls left (indexed, as the page's other walls: they are merged into one collider)
    const g = new THREE.BufferGeometry(), flat = keep.length ? keep.flat() : new Array(9).fill(0);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flat), 3));
    if (shore.index) g.setIndex([...Array(flat.length / 3).keys()]);
    sec.edges.shore = g;
    shore.dispose();
    set.gateGeom = new THREE.BufferGeometry();
    set.gateGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(moved.flatMap((m) => m.tri)), 3));
    const bvh = new MeshBVH(set.gateGeom), idx2 = set.gateGeom.index.array;
    set.gateOwner = Array.from({ length: idx2.length / 3 }, (_, i) => moved[Math.floor(idx2[3 * i] / 3)]);
    set.gateMover = new MovingBVH(bvh, new THREE.Object3D());
    set.gateMover.moving = false;
    set.gateMover.skip = new Uint8Array(idx2.length / 3);
  }

  // is this contact open now? A boat under way touches anything only while it pauses at its painted spot; a contact
  // with another boat needs that one there too
  contactOpen(b, ct) {
    const here = (x) => !x.under || x.atRest;
    return here(b) && (!ct.other || here(ct.other));
  }

  applyOpen(b) {
    const open = new Uint8Array(b.pieces.length), bridgeOn = new Uint8Array(b.contacts.length);
    b.contacts.forEach((ct, i) => { if (this.contactOpen(b, ct)) { open[ct.piece] = 1; bridgeOn[i] = 1; } });
    const skip = b.mover.skip, origOf = b.mover.origOf;
    for (let i = 0; i < skip.length; i++) {
      const o = origOf[i], cat = b.cats[o], w = b.which[o];
      skip[i] = cat === CAT.rim ? open[w] : cat === CAT.bridge || cat === CAT.cap ? 1 - bridgeOn[w] : 0;
    }
    b.openPieces = open.reduce((a, x) => a + x, 0);
    // the shore walls in front of its contacts
    const gm = b.set.gateMover;
    if (gm) b.set.gateOwner.forEach((o, i) => { if (o.b === b) gm.skip[i] = this.contactOpen(b, o.ct) ? 1 : 0; });
  }

  // ------------------------------------------------------------ motion (player.js calls it each walker step)
  step(dt) {
    const t0 = performance.now();
    this.t += dt;
    this.flow?.step(dt);
    for (const b of this.list) this.pose(b, dt);
    this.stats.stepMs += performance.now() - t0;
    this.stats.steps++;
  }

  pose(b, dt) {
    if (b.flow) this.flow.move(b, dt); // along its lane: b.base, b.state, b.atRest, b.effort, b.wave (boatflow.js)
    else if (b.under) {
      b.clock += dt;
      const [p0, p1] = b.pauses, T = b.travel;
      let wasRest = b.atRest;
      // the cycle: at its spot (p0) -> out (T) -> at the far end (p1) -> back (T)
      if (b.state === 'rest' && b.clock > p0 && !this.someoneBoarding(b)) { b.state = 'out'; b.clock = 0; }
      else if (b.state === 'out' && b.clock > T) { b.state = 'far'; b.clock = 0; }
      else if (b.state === 'far' && b.clock > p1) { b.state = 'back'; b.clock = 0; }
      else if (b.state === 'back' && b.clock > T) { b.state = 'rest'; b.clock = 0; }
      const k = Math.min(1, b.clock / T);
      b.s = b.state === 'rest' ? 0 : b.state === 'far' ? b.run : (b.state === 'out' ? 0.5 - 0.5 * Math.cos(Math.PI * k) : 0.5 + 0.5 * Math.cos(Math.PI * k)) * b.run;
      b.effort += ((b.state === 'out' || b.state === 'back' ? 1 : 0) - b.effort) * Math.min(1, dt * 1.2);
      b.atRest = b.state === 'rest';
      // the bow wave: going ahead only, with the speed (sin of the eased run), and only on a run long enough to raise it
      b.wave = b.state === 'out' ? Math.min(1, 1.5 * Math.sin(Math.PI * k)) * Math.min(1, b.run / 4) : 0;
      if (wasRest !== b.atRest) { this.applyOpen(b); for (const o of this.list) if (o !== b && o.contacts.some((c) => c.other === b)) this.applyOpen(o); }
    }
    // riding the water: a slow bob, roll and pitch (smaller for a boat under way, which also lifts a little with
    // each stroke); within the hull's wet band (+-3 cm, kit_boats._wet_band)
    const t = this.t + b.phase, mo = !b.under;
    const bob = (mo ? 0.022 : 0.012) * Math.sin(t * 1.33) + 0.006 * Math.sin(t * 2.9 + 1.7) + (mo ? 0 : 0.01 * b.effort * Math.sin(this.t * 4.4));
    const roll = deg(mo ? 0.6 : 0.35) * Math.sin(t * 0.91 + 0.4), pitch = deg(mo ? 0.25 : 0.2) * Math.sin(t * 0.67 + 2.1);
    _q.setFromEuler(new THREE.Euler(roll, 0, pitch, 'XZY'));
    _m.compose(_p.set(b.s, bob, 0), _q, _s.set(1, 1, 1));
    _m2.multiplyMatrices(b.base || b.rest, _m);
    for (const r of b.roots) { // the boats' group and the section's root stand at the origin
      _m2.decompose(r.position, r.quaternion, r.scale);
      r.matrix.copy(_m2);
      r.matrixWorld.copy(_m2);
    }
  }

  // someone is standing on one of this boat's open contacts (or a neighbour's contact to it): it waits
  someoneBoarding(b) {
    const P = this.hooks.player?.pos;
    if (!P) return false;
    const seg = new THREE.Line3(), cp = new THREE.Vector3();
    const near = (x, ct) => { seg.set(ct.from, ct.to); seg.closestPointToPoint(P, true, cp); return Math.hypot(cp.x - P.x, cp.z - P.z) < ct.len / 2 + 0.5 && Math.abs(cp.y - P.y) < 1.5; };
    if (b.contacts.some((ct) => near(b, ct))) return true;
    return this.list.some((o) => o !== b && o.contacts.some((ct) => ct.other === b && near(o, ct)));
  }

  // which boat's deck is under the walker (player.js: it is carried by that one)
  supportOf(pos) {
    _ray.set(_a.set(pos.x, pos.y + 0.4, pos.z), _down);
    let best = null;
    for (const b of this.list) {
      if (b.hidden || Math.hypot(pos.x - b.roots[0].position.x, pos.z - b.roots[0].position.z) > (b.info.loa || 25) / 2 + 3) continue;
      const h = b.mover.raycastFirst(_ray, THREE.DoubleSide, 0, 1.0);
      if (h && (!best || h.distance < best.distance)) best = h;
    }
    return best ? best.mover : null;
  }

  // ------------------------------------------------------------ drawing (world.js tick, after people.update)
  update(dt, camera) {
    const t0 = performance.now();
    this.camera = camera;
    const cam = camera.position;
    for (const b of this.list) {
      if (b.hidden) continue; // a flow boat out of sight (boatflow.js): its instances are off
      const r0 = b.roots[0];
      // detail level by distance from the camera to the hull's line
      const half = (b.info.lw || 20) / 2;
      _a.set(half, 0, 0).applyMatrix4(r0.matrixWorld); _b.set(-half, 0, 0).applyMatrix4(r0.matrixWorld);
      const d = this._line.set(_a, _b).closestPointToPoint(cam, true, _x).distanceTo(cam);
      const want = b.lod === 0 ? (d > LOD_FAR ? 1 : 0) : (d < LOD_NEAR ? 0 : 1);
      if (want !== b.lod && b.roots[want]) {
        b.lod = want;
        b.items.forEach((list, li) => { for (const it of list) it.bm.setVisibleAt(it.inst, li === want); });
      }
      // the moving parts (both detail levels: crew stand by lod 0's)
      for (const lod of b.lods) for (const part of lod.parts) this.animate(b, part);
      // ropes on the boat you can see
      if (d < LINES_FAR) for (const ln of b.lods[b.lod].lines) this.aim(b, b.lods[b.lod], ln);
      this.place(b);
    }
    this.stats.updateMs += performance.now() - t0;
    this.stats.frames++;
  }

  animate(b, part) {
    const n = part.node;
    if (part.kind === 'sweep') {
      _q2.setFromAxisAngle(part.axis, part.amp * b.effort * Math.sin((2 * Math.PI * this.t) / part.period + part.phase));
      n.quaternion.copy(part.q0).multiply(_q2);
    } else if (part.kind === 'oar') {
      const ph = (2 * Math.PI * this.t) / part.period + part.phase * 0.2; // the oars of a boat pull together
      _q2.setFromAxisAngle(part.axis, part.amp * b.effort * Math.sin(ph));
      n.quaternion.copy(part.q0).multiply(_q2);
      if (part.roll) n.quaternion.multiply(_q.setFromAxisAngle(part.roll, part.side * deg(9) * b.effort * Math.max(0, Math.cos(ph))));
    } else if (part.kind === 'mast' && b.mastDeg != null) { // a flow boat's mast, lowered for an arch (boatflow.js)
      n.quaternion.copy(part.q0).multiply(_q2.setFromAxisAngle(part.axis, part.sign * deg(b.mastDeg - part.rest)));
    } else if (part.kind === 'mast' && b.info.pose === 'lowering mast' && part.range) {
      const [lo, hi] = part.range;
      const a = lo + (hi - lo) * (0.5 - 0.5 * Math.cos((2 * Math.PI * this.t) / b.mastCycle + part.phase));
      n.quaternion.copy(part.q0).multiply(_q2.setFromAxisAngle(part.axis, part.sign * deg(a - part.rest)));
    } else return;
    n.updateMatrix();
  }

  // a point's position in the root's frame now (a world-fixed one held where it is; the tow line's end on its tracker)
  pointNow(b, lod, name, out) {
    if (name === 'pt_tow_b' && b.spec?.tow) { // the tracker's shoulder
      const p = this.person(b.spec.tow);
      if (p) { out.copy(p.root.position); out.y += 1.3; return out.applyMatrix4(_inv.copy(lod.root.matrixWorld).invert()); }
    }
    const w = b.worldPoints.get(name);
    if (w) return out.copy(w).applyMatrix4(_inv.copy(lod.root.matrixWorld).invert());
    const pt = lod.points.get(name);
    if (!pt) return null;
    out.copy(pt.p);
    if (pt.node) out.applyMatrix4(pt.node.matrix);
    return out;
  }

  aim(b, lod, ln) {
    // a flow boat away from its painted spot is moored to nothing: ropes to world-fixed ends (and its tow line while
    // no tracker holds it) are stowed (boatflow.js)
    if (b.flow && this.flow.stowed(b, ln)) { if (ln.node.scale.z !== 0) { ln.node.scale.set(1, 1, 0); ln.node.updateMatrix(); } return; }
    const A = this.pointNow(b, lod, ln.a, _a), B = this.pointNow(b, lod, ln.b, _b);
    if (!A || !B) return;
    _z.copy(B).sub(A);
    const len = _z.length();
    if (len < 1e-4) return;
    _z.divideScalar(len);
    _x.crossVectors(_up, _z);
    if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0);
    _x.normalize();
    _y.crossVectors(_z, _x);
    ln.node.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
    ln.node.position.copy(A);
    ln.node.scale.set(1, 1, len);
    ln.node.updateMatrix();
  }

  person(slug) {
    const people = this.hooks.getPeople?.();
    return people?.all.find((p) => p.id === slug) || null;
  }

  // ------------------------------------------------------------ crew (people.js addFigure asks)
  // f: the layout figure, spec: its people.json entry. Returns { place(p, dt), moving, drivesClips } or null.
  host(f, spec, p, people) {
    for (const b of this.list) {
      const haul = !b.extra && b.spec?.haul?.[f.id];
      if (haul) return this.hauler(b, f, spec, haul, people);
    }
    // the support names the level: "boat deck|roof: <id>", and the parts the maps name: "boat stern deck", "boat bow
    // deck", "boat after roof", "boat ladder"
    const m = /^boat ((?:[a-z]+ )*?)(deck|roof|ladder): (.+)$/.exec(f.support || '');
    let b = m && this.byId.get(m[3]);
    if (!b) b = this.list.find((x) => !x.extra && x.spec?.crew?.[f.id]);
    if (!b) { if (m) console.warn(`${f.id}: on ${m[3]}, which is not loaded`); return null; }
    const job = b.spec?.crew?.[f.id] || {};
    const level = m?.[2] === 'deck' && /stern/.test(m[1]) ? 'stern' : m?.[2] || 'deck';
    const lod = b.lods[0];
    const local = new THREE.Vector3();
    let node = null, yaw = 0;
    if (job.work === 'sweep' || job.work === 'oar') {
      const parts = lod.parts.filter((q) => q.kind === job.work);
      const crew = Object.entries(b.spec.crew).filter(([, j]) => j.work === job.work).map(([id]) => id);
      const k = crew.indexOf(f.id);
      let pt = job.at && lod.points.get(job.at);
      if (!pt) {
        const names = [...lod.points.keys()].filter((n) => n.startsWith(job.work === 'sweep' ? 'pt_sweep_bar' : 'pt_oar_'));
        pt = lod.points.get(names[job.work === 'sweep' ? 0 : k % Math.max(1, names.length)]);
      }
      if (pt) {
        node = pt.node || parts[0]?.node;
        const d = pt.p.clone().setY(0).normalize(); // from the pivot toward the bar or grip: inboard
        local.copy(pt.p).addScaledVector(d, job.work === 'sweep' ? 0.55 : 0.5);
        if (job.work === 'sweep') { const bar = new THREE.Vector3(-d.z, 0, d.x); local.addScaledVector(bar, crew.length > 1 ? -0.6 + (1.2 * k) / (crew.length - 1) : 0); }
        yaw = Math.atan2(-d.x, -d.z);
      }
    }
    if (!node) {
      // the painted spot, carried into the boat's frame at rest
      local.set(f.X + (spec.nudge?.[0] || 0), (f.H || 0), -(f.D + (spec.nudge?.[1] || 0))).applyMatrix4(b.restInv);
      // people.js turns a figure to facing + 90 degrees (the rig faces +Z); on the boat, relative to its heading
      yaw = deg(spec.facing_deg ?? f.facing_deg ?? 0) + Math.PI / 2 - this.yawOf(b.restQ);
    }
    // stand on the deck (or roof) below that spot; a spot off the built hull comes in toward the centre line
    const at = node ? local.clone().applyMatrix4(node.matrix) : local;
    const tall = /seated|crouch|lying|kneel|squat/.test(f.pose || '') ? 0.9 : 1.5; // headroom the figure needs
    const y = node ? this.floorLocal(b, at, level === 'roof' ? 'roof' : 'deck') : this.standLocal(b, at, level, tall);
    if (y === null) { console.warn(`${f.id}: no ${level} of ${b.id} under its spot`); }
    else if (y.moved) at.copy(y.moved);
    const fy = y?.y ?? at.y;
    if (node) local.y += fy - at.y; else local.set(at.x, fy, at.z);
    const moving = b.under;
    const P = new THREE.Vector3();
    const place = (q) => {
      P.copy(local);
      if (node) P.applyMatrix4(node.matrix);
      P.applyMatrix4(b.roots[0].matrixWorld);
      q.root.position.copy(P);
      q.root.rotation.y = this.yawOf(b.roots[0].quaternion) + yaw + (node ? this.nodeYaw(node) : 0);
    };
    b.crew.push(f.id);
    (b.crewSpots ||= []).push({ id: f.id, spec, local: local.clone(), node, yaw, work: job.work || null }); // for its copies (boatflow.js)
    return { place, moving, drivesClips: false };
  }

  // a tracker on the bank: walks along with the boat's travel (its displacement from rest), on the ground there
  hauler(b, f, spec, haul, people) {
    if (b.flow) return this.flow.hauler(b, f, spec, haul, people); // a flowing towed boat's trackers (boatflow.js)
    const base = new THREE.Vector3(f.X + (spec.nudge?.[0] || 0), 0, -(f.D + (spec.nudge?.[1] || 0)));
    const fwd = new THREE.Vector3(1, 0, 0).applyQuaternion(b.restQ).setY(0).normalize();
    const face0 = deg(spec.facing_deg ?? f.facing_deg ?? 0) + Math.PI / 2;
    let last = null, gy = null, gT = 0;
    const place = (q, dt) => {
      const x = base.x + fwd.x * b.s, z = base.z + fwd.z * b.s;
      gT -= dt || 0;
      if (gy === null || gT <= 0) { gy = people.hooks.ground(x, z, (f.H || 0) + 1.5); gT = 0.1; }
      q.root.position.set(x, gy, z);
      const dir = b.state === 'out' ? 1 : b.state === 'back' ? -1 : 0;
      const walking = dir !== 0 && b.effort > 0.25;
      const clip = walking ? haul.walk || 'walk' : haul.stand || 'idle';
      if (clip !== last) { q.play(clip, { timeScale: walking ? THREE.MathUtils.clamp(b.speed / 1.25, 0.5, 1.5) : 1 }); last = clip; }
      if (walking) q.root.rotation.y = Math.atan2(fwd.x * dir, fwd.z * dir);
      else if (b.state === 'rest') q.root.rotation.y = face0;
      if (!walking) q.keepLooping?.();
    };
    b.crew.push(f.id);
    return { place, moving: b.under, drivesClips: true };
  }

  yawOf(q) { const v = new THREE.Vector3(0, 0, 1).applyQuaternion(q); return Math.atan2(v.x, v.z); }
  nodeYaw(node) { const v = new THREE.Vector3(0, 0, 1).applyQuaternion(node.quaternion); const v0 = new THREE.Vector3(0, 0, 1); return Math.atan2(v.x, v.z) - Math.atan2(v0.x, v0.z); }

  // where a figure on a boat stands, by its level (host): { y, moved } or null. At rest, in the boat's frame.
  //  - deck: the deck under its spot (floorLocal); if a cabin, an awning or a laden boat's cargo mound comes down
  //    within its headroom there (it would stand inside the cabin, through the awning, in the cargo), the nearest deck
  //    within 4.5 m that is open overhead, else the top of what covers it.
  //  - stern: the deck, or a raised stern deck (gallery) within 2.5 m when the hull has one.
  //  - roof: the roof under its spot or the nearest roof within 3 m; the deck only when the boat has no roof there.
  //  - ladder: its painted height, between the deck and the roof at its spot (the rungs).
  standLocal(b, at, level, tall = 1.5) {
    const deck = this.floorLocal(b, at, 'deck');
    const near = (test, c = at, R = 3) => { // the nearest point round c (rings of 0.3 m, out to R) where test(x, z, r) gives a height
      for (let r = 0.3; r <= R + 0.01; r += 0.3) {
        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI) / 8, x = c.x + r * Math.cos(a), z = c.z + r * Math.sin(a), y = test(x, z, r);
          if (y !== null) return { y, moved: new THREE.Vector3(x, at.y, z) };
        }
      }
      return null;
    };
    if (level === 'roof') {
      const here = this.surfaces(b, at.x, at.z).roof[0];
      if (here !== undefined) return { y: here, moved: null };
      return near((x, z) => this.surfaces(b, x, z).roof[0] ?? null) || deck;
    }
    if (!deck) return null;
    const p0 = deck.moved || at;
    if (level === 'ladder') {
      const top = this.surfaces(b, p0.x, p0.z).roof[0] ?? near((x, z) => this.surfaces(b, x, z).roof[0] ?? null, p0)?.y;
      return { y: THREE.MathUtils.clamp(at.y, deck.y, top ?? deck.y), moved: null };
    }
    if (level === 'stern') {
      const raised = near((x, z, r) => { const d = this.surfaces(b, x, z).deck[0]; return r <= 2.5 && d !== undefined && d > deck.y + 0.3 ? d : null; }, p0);
      if (raised) return raised;
    }
    const open = (x, z, y) => !this.surfaces(b, x, z).all.some((h) => h > y + 0.05 && h < y + tall);
    if (open(p0.x, p0.z, deck.y)) return deck;
    // the deck at the spot that has room overhead (the open deck under an awning's eaves), else round about
    const here = this.surfaces(b, p0.x, p0.z).deck.find((d) => d <= deck.y + 0.6 && open(p0.x, p0.z, d));
    if (here !== undefined) return { y: here, moved: deck.moved };
    const room = near((x, z) => this.surfaces(b, x, z).deck.find((d) => Math.abs(d - deck.y) < 0.6 && open(x, z, d)) ?? null, p0, 4.5);
    if (room) return room;
    const top = this.surfaces(b, p0.x, p0.z);
    return { y: Math.max(top.deck[0] ?? deck.y, top.roof[0] ?? -Infinity), moved: deck.moved };
  }

  // what a vertical line through (x, z) of the boat's frame crosses, at rest: deck and roof tops (facing up, highest
  // first) and every deck and roof surface either way up (a cabin's or a cargo mound's underside too)
  surfaces(b, x, z) {
    _ray.set(_a.set(x, 8, z), _down);
    const out = { deck: [], roof: [], all: [] };
    for (const h of b.mover.bvh.raycast(_ray, THREE.DoubleSide)) {
      const c = b.cats[b.mover.origOf[h.faceIndex]];
      if (c === CAT.roof || c === CAT.deck) out.all.push(h.point.y);
      if (h.face.normal.y <= 0.3) continue;
      if (c === CAT.deck) out.deck.push(h.point.y);
      else if (c === CAT.roof) out.roof.push(h.point.y);
    }
    out.deck.sort((p, q) => q - p); out.roof.sort((p, q) => q - p);
    return out;
  }

  // the deck (or roof) height under a point of the boat's frame, at rest; { y, moved } (moved: the spot brought in
  // onto the hull when it lay off it)
  floorLocal(b, at, level) {
    const tries = [at.clone()];
    for (let k = 1; k <= 8; k++) tries.push(at.clone().lerp(new THREE.Vector3(THREE.MathUtils.clamp(at.x, -(b.info.lw || 20) / 2 + 2, (b.info.lw || 20) / 2 - 2), at.y, 0), k / 8));
    for (const [i, p] of tries.entries()) {
      _ray.set(_a.set(p.x, 8, p.z), _down);
      const hits = b.mover.bvh.raycast(_ray, THREE.DoubleSide).filter((h) => {
        const c = b.cats[b.mover.origOf[h.faceIndex]];
        return (c === CAT.deck || c === CAT.roof) && h.face.normal.y > 0.3;
      });
      if (!hits.length) continue;
      const roof = hits.filter((h) => b.cats[b.mover.origOf[h.faceIndex]] === CAT.roof), deck = hits.filter((h) => b.cats[b.mover.origOf[h.faceIndex]] === CAT.deck);
      const pick = level === 'roof' ? (roof[0] || deck[0]) : (deck[0] || null);
      if (!pick) continue;
      return { y: pick.point.y, moved: i ? p : null };
    }
    return null;
  }

  // ------------------------------------------------------------ copies (boatflow.js, ?boatflow=waves)
  // a copy of a loaded boat: its own roots, moving parts and ropes (cloned holders), its own batch instances of the
  // template's geometry (no new download), the template's collider in its own frame (rims all standing: it touches
  // nothing). It joins this.list hidden; boatflow.js places, shows and hides it. Ropes to world-fixed ends stay stowed.
  copy(t, id) {
    const map = new Map();
    const holderOf = (h) => {
      if (!h) return h;
      if (!map.has(h)) { const c = new THREE.Object3D(); c.position.copy(h.position); c.quaternion.copy(h.quaternion); c.scale.copy(h.scale); c.userData = h.userData; c.updateMatrix(); map.set(h, c); }
      return map.get(h);
    };
    const b = { id, slug: id.split('.').slice(2).join('.'), section: t.section, set: t.set, info: { ...t.info, motion: 'under_way' }, entry: t.entry, extra: true, template: t,
      roots: t.roots.map((r) => { const o = new THREE.Object3D(); o.matrixAutoUpdate = false; o.matrix.copy(r.matrix); o.matrixWorld.copy(r.matrixWorld); o.position.copy(r.position); o.quaternion.copy(r.quaternion); return o; }),
      rest: t.rest.clone(), restInv: t.restInv.clone(), restPos: t.restPos.clone(), restQ: t.restQ.clone(), heading: t.heading, under: true, spec: {},
      lods: [], colliders: t.colliders, lod: 0, s: 0, effort: 0, state: 'far', atRest: false, clock: 0, contacts: [], crew: [], worldPoints: t.worldPoints,
      pieces: t.pieces, cats: t.cats, which: t.which, phase: hash(id + 'bob') * Math.PI * 2, run: 0, speed: 0, pauses: [0, 0], travel: 1, mastCycle: 24, wave: 0, openPieces: 0, hidden: true };
    b.lods = t.lods.map((lod, li) => ({ root: b.roots[li],
      parts: lod.parts.map((q) => ({ ...q, node: holderOf(q.node), q0: q.q0.clone(), phase: hash(id + q.node.name + q.kind) * Math.PI * 2 })),
      lines: lod.lines.map((ln) => ({ ...ln, node: holderOf(ln.node) })),
      points: new Map([...lod.points].map(([n, pt]) => [n, { node: holderOf(pt.node), p: pt.p }])) }));
    b.items = t.items.map((list, li) => list.map((it) => {
      if (it.bm._instanceInfo.length >= it.bm.maxInstanceCount && !it.bm._availableInstanceIds.length) it.bm.setInstanceCount(Math.ceil(it.bm.maxInstanceCount * 1.5) + 8);
      const inst = it.bm.addInstance(it.gid);
      it.bm.setVisibleAt(inst, false);
      return { ...it, holder: holderOf(it.holder), root: b.roots[li], b, inst };
    }));
    b.crewSpots = (t.crewSpots || []).map((c) => ({ ...c, node: holderOf(c.node) }));
    b.mover = new MovingBVH(t.mover.bvh, b.roots[0], t.mover.origOf);
    b.mover.boat = b;
    b.mover.skip = new Uint8Array(t.mover.skip.length);
    for (let i = 0; i < b.mover.skip.length; i++) { const c = t.cats[t.mover.origOf[i]]; b.mover.skip[i] = c === CAT.bridge || c === CAT.cap || c === CAT.plank ? 1 : 0; }
    t.set.flowMovers?.list.push(b.mover);
    this.list.push(b);
    this.byId.set(b.id, b);
    return b;
  }

  uncopy(b) {
    const i = this.list.indexOf(b);
    if (i >= 0) this.list.splice(i, 1);
    const ms = b.set.flowMovers?.list, k = ms ? ms.indexOf(b.mover) : -1;
    if (k >= 0) ms.splice(k, 1);
    this.byId.delete(b.id);
    for (const list of b.items || []) for (const it of list) { try { it.bm.deleteInstance(it.inst); } catch { /* its batch is gone with its section */ } }
  }

  // shown or not (a flow boat out of sight): its instances of the detail level it shows
  show(b, on) {
    b.hidden = !on;
    b.items.forEach((list, li) => { for (const it of list) it.bm.setVisibleAt(it.inst, on && li === b.lod); });
  }

  // ------------------------------------------------------------ for the HUD and the tools
  moving(sec) { return (sec?.boats?.boats || []).filter((b) => b.under); }
  report() {
    return this.list.map((b) => ({ id: b.id, kind: b.info.kind, motion: b.info.motion, state: b.state, s: +b.s.toFixed(2), lod: b.lod,
      ...(b.flow ? { flow: { lane: b.flow.lane.id, s: +b.flow.s.toFixed(2), v: +b.flow.v.toFixed(2), st: b.flow.st, extra: !!b.extra } } : {}),
      contacts: b.contacts.length, open: b.openPieces, pieces: b.pieces.length, crew: b.crew.length,
      pos: [+b.roots[0].position.x.toFixed(2), +(-b.roots[0].position.z).toFixed(2), +b.roots[0].position.y.toFixed(3)] }));
  }
}
