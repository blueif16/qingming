#!/usr/bin/env node
// The carried children: pose the real rigged child onto its carrier by IK and bake it as the carrier's prop geometry.
//
//   node tools/carry_pose.mjs <prop|all> [--preview <png>] [--no-write]
//
// Spec: gen/props/carry.json, one entry per carried-child prop (child_on_back, child_on_shoulders, child_in_arms,
// child_on_lap): the carrier, the child character, its height, the recipe (back | shoulders | arms | lap) with its
// numbers, and the contacts (the same list tools/carry_check.mjs measures). The carrier's clip and bind time come from
// characters/props.json (the carrier's entry for the prop), so the prop and its binding never disagree.
//
// What it does, per prop:
//  1. poses the carrier (gen/characters/<carrier>/<carrier>_raw.glb) at the bind time and skins its body;
//  2. takes the child's rigged body (gen/characters/<child>/<child>_raw.glb), decimated with meshoptimizer to the
//     spec's triangle budget, keeping its UVs and skin weights (the simplifier keeps a subset of the vertices);
//  3. solves the child's skeleton: the pelvis and chest frames from the carrier's body (recipe), then two-bone IK
//     for the arms and legs with each limb's contact point as the target (a site snapped onto the carrier's posed
//     surface, plus the child limb's own half-thickness along the surface normal), the elbow and knee poles from the
//     recipe; a short search over the recipe's free numbers removes interpenetration (child vertices inside the
//     carrier's body) while the contacts hold;
//  4. skins the decimated child with that pose and writes gen/props/<prop>.glb: the mesh in the carrier's Armature
//     frame at the bind time, in metres (char_props.mjs placement `at: "root"`), with the child's UVs, a small copy
//     of the child's texture for viewing, and extras {carrier, clip, t, child} that char_props.mjs checks.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document } from '@gltf-transform/core';
import { MeshoptSimplifier } from 'meshoptimizer';
import {
  io, loadRig, poseClip, poseLocals, skinMesh, inMetres, dominant, TriGrid, mul, invert, compose, xf, xd, add, sub, scl,
  dot, cross, len, norm, lerp3, dist, posOf, axisOf, frameOf, scaleM, rotAxis, rotBetween, quatOf, rot3, I4,
} from './carry_lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
await MeshoptSimplifier.ready;

// ---------------------------------------------------------------- the carrier at its bind time
export async function carrierAt(name, clip, t, file = null) {
  const rig = await loadRig(file || r(`gen/characters/${name}/${name}_raw.glb`));
  const W = poseClip(rig, clip, t);
  const Wm = W.map(inMetres);
  const body = rig.meshes[rig.body];
  const P = skinMesh(rig, body, W);
  const dom = dominant(body);
  const J = (n) => posOf(Wm[rig.index(n)]);
  const fwdRaw = xd(Wm[rig.index('Hips')], [0, 0, 1]);
  const fwd = norm([fwdRaw[0], 0, fwdRaw[2]]), up = [0, 1, 0], left = norm(cross(up, fwd));
  return { name, rig, clip, t, W, Wm, body, P, dom, J, fwd, up, left, grid: new TriGrid(P, body.idx) };
}
// a point in the carrier's body frame (x left, y up, z forward; metres) from a joint
export const bodyPoint = (C, joint, off = [0, 0, 0]) => add(C.J(joint), add(scl(C.left, off[0]), add(scl(C.up, off[1]), scl(C.fwd, off[2]))));
export const bodyDir = (C, d) => norm(add(scl(C.left, d[0]), add(scl(C.up, d[1]), scl(C.fwd, d[2]))));

// a carrier surface site: the point nearest to `near` on the triangles dominated by `bones` (all if none);
// returns {p, n (outward face normal), tri, bary}
export function snapSite(C, near, bones = null) {
  const set = bones ? new Set(bones.map((b) => C.rig.index(b))) : null;
  const idx = C.body.idx;
  let best = null;
  const v = (i) => [C.P[i * 3], C.P[i * 3 + 1], C.P[i * 3 + 2]];
  for (let t = 0; t < idx.length / 3; t++) {
    const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
    if (set && [a, b, c].filter((k) => set.has(C.dom[k])).length < 2) continue;
    const pa = v(a), pb = v(b), pc = v(c);
    const q = closestTri(near, pa, pb, pc);
    const d = dist(near, q.p);
    if (!best || d < best.d) best = { d, p: q.p, tri: t, bary: q.bary, n: norm(cross(sub(pb, pa), sub(pc, pa))) };
  }
  return best;
}
function closestTri(p, a, b, c) {
  // barycentric closest point (same as carry_lib closestOnTri, kept local for the bary order)
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return { p: a, bary: [1, 0, 0] };
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return { p: b, bary: [0, 1, 0] };
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const x = d1 / (d1 - d3); return { p: add(a, scl(ab, x)), bary: [1 - x, x, 0] }; }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return { p: c, bary: [0, 0, 1] };
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const x = d2 / (d2 - d6); return { p: add(a, scl(ac, x)), bary: [1 - x, 0, x] }; }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const x = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return { p: add(b, scl(sub(c, b), x)), bary: [0, 1 - x, x] }; }
  const den = 1 / (va + vb + vc), y = vb * den, z = vc * den;
  return { p: add(a, add(scl(ab, y), scl(ac, z))), bary: [1 - y - z, y, z] };
}

// ---------------------------------------------------------------- the child: decimated body and a poser
export async function childModel(name, tris) {
  const rig = await loadRig(r(`gen/characters/${name}/${name}_raw.glb`));
  const m = rig.meshes[rig.body];
  // rest height (metres) of the body mesh
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 1; i < m.pos.length; i += 3) { y0 = Math.min(y0, m.pos[i]); y1 = Math.max(y1, m.pos[i]); }
  const D = decimate(m, tris);
  return { name, rig, full: m, mesh: D, height: y1 - y0, footY: y0 };
}
function decimate(m, tris) {
  if (m.idx.length / 3 <= tris) return m;
  const pos32 = Float32Array.from(m.pos);
  let lo = 1e-4, hi = 0.2, best = null;
  for (let k = 0; k < 24; k++) {   // bisect the error bound until the count lands on the budget
    const err = Math.sqrt(lo * hi);
    const [ix] = MeshoptSimplifier.simplify(Uint32Array.from(m.idx), pos32, 3, tris * 3, err, []);
    const n = ix.length / 3;
    if (!best || Math.abs(n - tris) < Math.abs(best.length / 3 - tris)) best = ix;
    if (n > tris * 1.03) lo = err; else if (n < tris * 0.97) hi = err; else break;
  }
  // keep only the vertices the simplified triangles use (their UVs and skin weights unchanged)
  const used = new Map(), order = [];
  for (const i of best) if (!used.has(i)) { used.set(i, order.length); order.push(i); }
  const pick = (arr, k) => { if (!arr) return null; const o = new arr.constructor(order.length * k); order.forEach((i, j) => { for (let c = 0; c < k; c++) o[j * k + c] = arr[i * k + c]; }); return o; };
  return { ...m, n: order.length, pos: pick(m.pos, 3), nrm: pick(m.nrm, 3), uv: pick(m.uv, 2), J: pick(m.J, 4), W: pick(m.W, 4), idx: Uint32Array.from(best, (i) => used.get(i)), src: order };
}

// The poser: the child's joints in the carrier's Armature space (metres). G maps the child's Armature (cm) into it:
// a rotation, a translation and the scale height/rest height * 0.01. Joint rotations are set in carrier space and
// written back as local rotations.
export class Poser {
  constructor(child, height) {
    this.c = child;
    this.rig = child.rig;
    this.k = (height / child.height) * 0.01;   // child Armature cm -> metres at the wanted height
    this.locals = this.rig.rest.map((x) => ({ t: x.t.slice(), r: x.r.slice(), s: [1, 1, 1] }));
    this.G = mul(I4(), scaleM(this.k));
    this.fk();
    // rest bone lengths (metres at this height), along each joint's local +Y to its first child
    this.len = {};
    const Wr = poseLocals(this.rig, this.rig.rest.map((x) => ({ t: x.t, r: x.r, s: [1, 1, 1] })));
    for (let i = 0; i < this.rig.names.length; i++) {
      const p = this.rig.parent[i];
      if (p >= 0 && this.len[this.rig.names[p]] === undefined) this.len[this.rig.names[p]] = dist(posOf(Wr[p]), posOf(Wr[i])) * this.k;
    }
  }
  i(n) { const k = this.rig.index(n); if (k < 0) throw new Error(`no joint ${n}`); return k; }
  fk() { this.Wc = poseLocals(this.rig, this.locals); this.W = this.Wc.map((m) => mul(this.G, m)); }
  pos(n) { return posOf(this.W[this.i(n)]); }
  R(n) { return rot3(normalizeRot(this.W[this.i(n)])); }
  axis(n, k = 1) { return axisOf(this.W[this.i(n)], k); }
  // place the child's pelvis: Hips joint at p, the child's body frame (left, up, fwd) = columns of R (rotation)
  pelvis(p, R) {
    const h = this.i('Hips');
    this.locals[h].r = [0, 0, 0, 1];
    const hipT = this.locals[h].t;
    // G = T . R . S, with G . hipT = p
    const RS = mul(R, scaleM(this.k));
    const off = xd(RS, hipT);
    this.G = mul(compose(sub(p, off), [0, 0, 0, 1]), RS);
    this.fk();
  }
  // set joint n's world rotation (carrier space, orthonormal) and refresh
  setWorld(n, Rw) {
    const i = this.i(n), p = this.rig.parent[i];
    const Rp = p >= 0 ? rot3(normalizeRot(this.W[p])) : rot3(normalizeRot(this.G));
    this.locals[i].r = quatOf(mul(invert(Rp), Rw));
    this.fk();
  }
  // turn joint n so its bone axis (+Y) points along d, by the smallest swing from where it points now; then twist
  aim(n, d, twist = 0) {
    const R = this.R(n), y = axisOf(R, 1);
    let Rw = mul(rotBetween(y, d), R);
    if (twist) Rw = mul(rotAxis(norm(d), twist), Rw);
    this.setWorld(n, Rw);
  }
  // relative rotation applied in world space about the joint (keeps children attached)
  turn(n, Rrel) { this.setWorld(n, mul(Rrel, this.R(n))); }
  // spread a world rotation from frame A to frame B over a chain of joints (each gets an equal share)
  spread(chain, Rdelta) {
    const q = quatOf(Rdelta), ang = 2 * Math.acos(Math.min(1, Math.abs(q[3]))), s = Math.sin(ang / 2) || 1;
    const ax = q[3] < 0 ? [-q[0] / s, -q[1] / s, -q[2] / s] : [q[0] / s, q[1] / s, q[2] / s];
    for (const n of chain) this.turn(n, ang > 1e-6 ? rotAxis(ax, ang / chain.length) : I4());
  }
  // two-bone IK: upper/lower/end joints, the end joint to `target`, the middle joint bent toward `pole`; the upper
  // bone is twisted so the lower bone needs the least swing (keeps the elbow or knee on its own hinge)
  twoBone(upper, lower, end, target, pole) {
    const S = this.pos(upper), a = dist(S, this.pos(lower)), b = dist(this.pos(lower), this.pos(end));
    let D = sub(target, S), d = len(D);
    const dMax = (a + b) * 0.995, dMin = Math.abs(a - b) * 1.05 + 1e-4;
    d = Math.min(Math.max(d, dMin), dMax);
    const u = norm(D);
    let v = sub(sub(pole, S), scl(u, dot(sub(pole, S), u)));
    v = len(v) < 1e-6 ? norm(cross(u, [1, 0, 0])) : norm(v);
    const ca = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
    const E = add(S, add(scl(u, a * ca), scl(v, a * Math.sqrt(1 - ca * ca))));
    const T = add(S, scl(u, d));
    this.aim(upper, sub(E, S));
    // twist the upper bone (search) so the lower bone, as it rests, points nearest to the target
    const want = norm(sub(T, E));
    const base = this.R(upper), up = norm(sub(E, S));
    let bestA = 0, bestC = -2;
    for (let k = 0; k < 72; k++) {
      const ang = (k / 72) * 2 * Math.PI;
      this.setWorld(upper, mul(rotAxis(up, ang), base));
      const c = dot(this.axis(lower), want);
      if (c > bestC) { bestC = c; bestA = ang; }
    }
    this.setWorld(upper, mul(rotAxis(up, bestA), base));
    this.aim(lower, want);
    return { reach: dist(T, target) };
  }
}
function normalizeRot(m) {
  const x = norm([m[0], m[1], m[2]]), y = norm([m[4], m[5], m[6]]), z = norm([m[8], m[9], m[10]]);
  return [...x, 0, ...y, 0, ...z, 0, m[12], m[13], m[14], 1];
}
// an orthonormal rotation from a wanted up (y) and forward (z): columns left (x), up, forward
export function frameUF(up, fwd) {
  const y = norm(up), z = norm(sub(fwd, scl(y, dot(fwd, y)))), x = norm(cross(y, z));
  return frameOf(x, y, z, [0, 0, 0]);
}

// ---------------------------------------------------------------- child parts and contact helpers
// vertex sets of the child's (decimated) body by dominant joint
export function partOf(child, bones) {
  const dom = dominant(child.mesh), set = new Set(bones.map((b) => child.rig.index(b)));
  const out = [];
  for (let i = 0; i < child.mesh.n; i++) if (set.has(dom[i])) out.push(i);
  return out;
}
// skin the child's decimated mesh with the poser's pose (positions in carrier metres)
export function childVerts(poser) {
  const W = poser.W.map((m) => m);   // carrier-space joint matrices with the child's scale inside
  // skinMesh multiplies W . IBM . v and then scales by 0.01 (cm -> m); our W already maps to metres, so undo it
  const P = skinMesh(poser.rig, poser.c.mesh, W);
  for (let i = 0; i < P.length; i++) P[i] *= 100;
  return P;
}

// ---------------------------------------------------------------- evaluation at the bind time
// contacts: [{name, carrier: {near: [joint, [x,y,z]], bones: [...]}, child: [bones]}], evaluated as the distance from
// the carrier's site to the child part's surface; penetration: child vertices inside the carrier's body
export function evaluate(C, child, P, contacts, sites) {
  const out = { gaps: [], pen: 0, penAt: null, penN: 0 };
  for (const [k, ct] of contacts.entries()) {
    const s = sites[k];
    const part = ct._part;
    let best = Infinity;
    for (const t of part.tris) {
      const a = child.mesh.idx[t * 3], b = child.mesh.idx[t * 3 + 1], c = child.mesh.idx[t * 3 + 2];
      const q = closestTri(s.p, [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]], [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]]);
      best = Math.min(best, dist(s.p, q.p));
    }
    out.gaps.push(best);
  }
  for (let i = 0; i < child.mesh.n; i++) {
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    if (!C.grid.inside(p)) continue;
    const q = C.grid.closest(p, 0.2);
    const d = q ? q.d : 0.2;
    out.penN++;
    if (d > out.pen) { out.pen = d; out.penAt = i; }
  }
  return out;
}
// the triangles of a child part (every corner in the part)
export function partTris(child, bones) {
  const dom = dominant(child.mesh), set = new Set(bones.map((b) => child.rig.index(b)));
  const tris = [];
  for (let t = 0; t < child.mesh.idx.length / 3; t++) {
    const k = [0, 1, 2].filter((c) => set.has(dom[child.mesh.idx[t * 3 + c]])).length;
    if (k >= 2) tris.push(t);
  }
  return tris;
}

// ---------------------------------------------------------------- recipes
// Each recipe poses the child from the carrier's sites and the spec's numbers (p), returning the IK reach errors.
// Body frames: the carrier's (C.left, C.up, C.fwd) at the bind time; site(name) gives a snapped carrier site.
const RECIPES = {
  // piggy-back: the child lies against the carrier's back, chest to his back, its arms over his shoulders with the
  // hands on the front of his shoulders, its thighs round his flanks at the waist, its shins hanging forward; the
  // carrier's hands (behind his hips) under its thighs
  back(P, C, p, site) {
    const sp = C.Wm[C.rig.index('Spine')];
    const spUp = axisOf(sp, 1), spFwd = axisOf(sp, 2);   // the carrier's back: up along the spine, its normal
    // the child's frame: up along the carrier's spine (tilted by p.lean), facing into his back
    const up = norm(add(spUp, scl(spFwd, -p.lean)));
    const R = frameUF(up, spFwd);
    // pelvis: behind the carrier's back at the height of p.hip_at between Spine02 and Spine, p.out off the back
    const along = lerp3(C.J('Spine02'), C.J('neck'), p.hip_at);
    const back = snapSite(C, add(along, scl(spFwd, -0.3)), ['Spine02', 'Spine01', 'Spine', 'Hips']);
    const pelvis = add(add(back.p, scl(spFwd, -p.out)), scl(C.left, p.side));
    P.pelvis(pelvis, R);
    // a little hunch over his back, head beside his
    P.spread(['Spine02', 'Spine01', 'Spine'], rotAxis(axisOf(R, 0), p.hunch));
    P.spread(['neck', 'Head'], mul(rotAxis(axisOf(R, 1), p.head_yaw), rotAxis(axisOf(R, 0), p.head_pitch)));
    const res = {};
    for (const [s, L] of [['Left', 1], ['Right', -1]]) {
      // hands on the front-top of his shoulders
      const sh = site(`${s} shoulder`);
      const hand = add(sh.p, scl(sh.n, p.hand_r));
      res[s + 'Hand'] = P.twoBone(`${s}Arm`, `${s}ForeArm`, `${s}Hand`, hand, add(P.pos(`${s}Arm`), add(scl(C.left, L * 0.3), scl(C.up, -0.2))));
      P.aim(`${s}Hand`, norm(add(scl(C.fwd, 1), scl(C.up, -1))));
      // thighs round his flanks: the knee at his side, a little forward; the shin hangs
      const fl = site(`${s} flank`);
      const knee = add(fl.p, scl(fl.n, p.knee_r));
      const foot = add(knee, add(scl(C.up, -P.len[`${s}Leg`] * p.shin_drop), scl(C.fwd, P.len[`${s}Leg`] * Math.sqrt(1 - p.shin_drop ** 2))));
      res[s + 'Foot'] = P.twoBone(`${s}UpLeg`, `${s}Leg`, `${s}Foot`, foot, add(knee, add(scl(C.fwd, 0.5), scl(C.left, L * 0.3))));
      // re-aim the thigh at the knee point exactly (the IK put the foot first; the knee lands on its pole side)
    }
    return res;
  },
};

// ---------------------------------------------------------------- writing the prop
async function writeProp(file, child, P, meta) {
  const doc = new Document();
  const buf = doc.createBuffer();
  const m = child.mesh;
  // normals: rest normals turned by each vertex's blended rotation
  const nrm = new Float32Array(m.n * 3);
  const S = poserSkinRot(meta.poser);
  for (let i = 0; i < m.n; i++) {
    let nx = 0, ny = 0, nz = 0;
    const v = [m.nrm[i * 3], m.nrm[i * 3 + 1], m.nrm[i * 3 + 2]];
    for (let c = 0; c < 4; c++) { const w = m.W[i * 4 + c]; if (!w) continue; const d = xd(S[m.J[i * 4 + c]], v); nx += w * d[0]; ny += w * d[1]; nz += w * d[2]; }
    const l = Math.hypot(nx, ny, nz) || 1;
    nrm.set([nx / l, ny / l, nz / l], i * 3);
  }
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const prim = doc.createPrimitive().setAttribute('POSITION', acc('VEC3', Float32Array.from(P))).setAttribute('NORMAL', acc('VEC3', nrm))
    .setAttribute('TEXCOORD_0', acc('VEC2', Float32Array.from(m.uv))).setIndices(acc('SCALAR', m.n > 65535 ? Uint32Array.from(m.idx) : Uint16Array.from(m.idx)));
  if (meta.image) {
    const tex = doc.createTexture(`prop_tex_${child.name}`).setImage(meta.image).setMimeType(meta.mime);
    prim.setMaterial(doc.createMaterial(`prop_tex_${child.name}`).setBaseColorTexture(tex).setRoughnessFactor(1).setMetallicFactor(0));
  }
  const mesh = doc.createMesh(meta.prop).addPrimitive(prim);
  const node = doc.createNode(meta.prop).setMesh(mesh);
  doc.createScene().addChild(node);
  doc.getRoot().setExtras({ carry: { carrier: meta.carrier, clip: meta.clip, t: meta.t, child: child.name, height_m: meta.height, frame: 'root', tris: m.idx.length / 3 } });
  await io.write(file, doc);
}
function poserSkinRot(P) {
  return P.c.mesh.jmap.map((j, i) => rot3(normalizeRot(mul(P.W[j], P.c.mesh.IBM[i]))));
}

// ---------------------------------------------------------------- main
export function loadSpec() { return JSON.parse(fs.readFileSync(r('gen/props/carry.json'), 'utf8')); }
export function bindOf(prop, carrier) {
  const props = JSON.parse(fs.readFileSync(r('characters/props.json'), 'utf8'));
  const own = props[carrier]?.[prop];
  if (!own) throw new Error(`characters/props.json has no ${carrier}.${prop}`);
  return { ...(props._defaults?.[own.geom || prop] || {}), ...own };
}
// the carrier sites of a spec, snapped on the carrier at its bind time
export function sitesOf(C, spec) {
  const out = {};
  for (const [name, s] of Object.entries(spec.sites)) {
    const o = s.off || [0, 0, 0];
    // offsets in the body frame (x left, y up, z forward), or in a joint's own axes (`axes`: e.g. "Spine")
    const near = s.axes ? add(C.J(s.joint), [0, 1, 2].map((k) => o[0] * axisOf(C.Wm[C.rig.index(s.axes)], 0)[k] + o[1] * axisOf(C.Wm[C.rig.index(s.axes)], 1)[k] + o[2] * axisOf(C.Wm[C.rig.index(s.axes)], 2)[k]))
      : bodyPoint(C, s.joint, o);
    out[name] = { ...snapSite(C, near, s.bones || null), near };
  }
  return out;
}

async function solve(prop, spec, opts) {
  const bind = bindOf(prop, spec.carrier);
  const C = await carrierAt(spec.carrier, bind.clip, bind.t);
  const child = await childModel(spec.child, spec.tris || 2000);
  const sites = sitesOf(C, spec);
  const site = (n) => { if (!sites[n]) throw new Error(`${prop}: no site ${n}`); return sites[n]; };
  const contacts = spec.contacts.map((ct) => ({ ...ct, _part: { tris: partTris(child, ct.child) } }));
  const recipe = RECIPES[spec.recipe];
  const poser = new Poser(child, spec.height_m);
  const res = recipe(poser, C, spec.p, site);
  const P = childVerts(poser);
  const ev = evaluate(C, child, P, contacts, contacts.map((ct) => site(ct.site)));
  console.log(`${prop}: ${spec.child} ${spec.height_m} m, ${child.mesh.idx.length / 3} tris (from ${child.full.idx.length / 3}); carrier ${spec.carrier} ${bind.clip} @ ${bind.t}s`);
  for (const [k, ct] of contacts.entries()) console.log(`  ${ct.name.padEnd(34)} gap ${(ev.gaps[k] * 100).toFixed(1)} cm`);
  console.log(`  penetration ${(ev.pen * 100).toFixed(1)} cm (${ev.penN} vertices inside)`);
  for (const [k, v] of Object.entries(res)) if (v?.reach > 0.005) console.log(`  ${k} short of its target by ${(v.reach * 100).toFixed(1)} cm`);
  return { C, child, poser, P, ev, sites, contacts, bind };
}

const args = process.argv.slice(2);
if (args.length && import.meta.url === `file://${process.argv[1]}`) {
  const spec = loadSpec();
  const which = args[0] === 'all' ? Object.keys(spec).filter((k) => !k.startsWith('_')) : args[0].split(',');
  const pv = args.indexOf('--preview');
  for (const prop of which) {
    const s = await solve(prop, spec[prop], {});
    if (pv >= 0) {
      const { render } = await import(r('tools/carry_preview.mjs'));
      await render(args[pv + 1].replace('{prop}', prop), [
        { P: s.C.P, idx: s.C.body.idx, color: [0.75, 0.75, 0.8] },
        { P: s.P, idx: s.child.mesh.idx, color: [0.95, 0.55, 0.25] },
      ], Object.values(s.sites).map((x) => ({ p: x.p, color: [0.9, 0.1, 0.1] })), { center: add(s.C.J('Hips'), [0, 0.2, 0]), extent: 1.6, views: ['left', 'front', 'back', 'top', 'q3'] });
    }
    if (!args.includes('--no-write')) {
      const shipped = await loadRig(r(`web/public/assets/chars/${spec[prop].child}.glb`)).catch(() => null);
      const img = shipped?.meshes[shipped.body];
      await writeProp(r(`gen/props/${prop}.glb`), s.child, s.P, { prop, carrier: spec[prop].carrier, clip: s.bind.clip, t: s.bind.t, height: spec[prop].height_m, poser: s.poser, image: img?.image, mime: img?.mime });
      console.log(`  wrote gen/props/${prop}.glb`);
    }
  }
}
