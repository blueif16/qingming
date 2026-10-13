#!/usr/bin/env node
// The carried children: pose the real rigged child onto its carrier by IK and bake it as the carrier's prop geometry.
//
//   node tools/carry_pose.mjs <prop|all> [--search] [--preview <png>] [--no-write] [--force]
//   (a prop with "ship": false in the spec is solved and reported but not written unless --force)
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
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Document } from '@gltf-transform/core';
import { MeshoptSimplifier } from 'meshoptimizer';
import {
  io, loadRig, poseClip, poseLocals, skinMesh, inMetres, dominant, mul, invert, compose, xf, xd, add, sub, scl,
  dot, cross, len, norm, lerp3, dist, posOf, axisOf, frameOf, scaleM, rotAxis, rotBetween, quatOf, rot3, I4,
  carrierPose, sitesOf, siteAt, gapTo, penetration, floating, partTris, xfAll, TriGrid,
} from './carry_lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
await MeshoptSimplifier.ready;

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
  // a limb by its middle joint: the upper bone aimed at `mid`, twisted so the lower bone (as it rests) lies nearest
  // `dir`, then the lower bone aimed along `dir`
  chain(upper, lower, mid, dir) {
    const S = this.pos(upper);
    this.aim(upper, sub(mid, S));
    const up = norm(sub(mid, S));
    this.twistToward(upper, lower, up, norm(dir));
    this.aim(lower, dir);
    return { reach: dist(this.pos(lower), mid) };
  }
  // the deepest of some child vertices inside the carrier's body (C), skinned with the current pose
  depth(verts, C) {
    const m = this.c.mesh, S = m.jmap.map((j, i) => mul(this.W[j], m.IBM[i]));
    let worst = 0, n = 0;
    for (const i of verts) {
      let x = 0, y = 0, z = 0;
      const vx = m.pos[i * 3], vy = m.pos[i * 3 + 1], vz = m.pos[i * 3 + 2];
      for (let c = 0; c < 4; c++) {
        const w = m.W[i * 4 + c];
        if (!w) continue;
        const M = S[m.J[i * 4 + c]];
        x += w * (M[0] * vx + M[4] * vy + M[8] * vz + M[12]); y += w * (M[1] * vx + M[5] * vy + M[9] * vz + M[13]); z += w * (M[2] * vx + M[6] * vy + M[10] * vz + M[14]);
      }
      const p = [x, y, z];
      if (!C.grid.inside(p)) continue;
      // how deep, on every third vertex inside (capped at 3 cm), plus a little for each vertex inside
      if (n++ % 3 === 0) { const q = C.grid.closest(p, 0.03); worst = Math.max(worst, q ? q.d : 0.03); }
    }
    return worst + 0.0005 * n;
  }
  // the vertices of some child bones (by dominant joint), cached
  verts(bones) {
    const key = bones.join(',');
    this._v ||= {};
    if (!this._v[key]) {
      const dom = dominant(this.c.mesh), set = new Set(bones.map((b) => this.i(b)));
      this._v[key] = [];
      for (let i = 0; i < this.c.mesh.n; i++) if (set.has(dom[i])) this._v[key].push(i);
    }
    return this._v[key];
  }
  // two-bone IK that keeps the limb out of the carrier: the pole swung round the root-to-target axis (up to `swing`
  // radians either way, 13 tries) to the angle whose limb sinks least into him, preferring the given pole
  twoBoneClear(upper, lower, end, target, pole, C, swing = 1.2) {
    const S = this.pos(upper), ax = norm(sub(target, S));
    const saved = this.locals.map((l) => ({ t: l.t.slice(), r: l.r.slice(), s: l.s }));
    const limb = this.verts([upper, lower, end]);
    let best = null;
    for (let k = -6; k <= 6; k++) {
      const a = (k / 6) * swing;
      const pl = add(S, xd(rotAxis(ax, a), sub(pole, S)));
      this.locals = saved.map((l) => ({ t: l.t.slice(), r: l.r.slice(), s: l.s })); this.fk();
      const res = this.twoBone(upper, lower, end, target, pl);
      const cost = this.depth(limb, C) + 0.004 * Math.abs(a);
      if (!best || cost < best.cost) best = { cost, pl, res };
    }
    this.locals = saved; this.fk();
    return this.twoBone(upper, lower, end, target, best.pl);
  }
  // CCD: turn the joints of `chain` (nearest the effector first) to bring joint `eff` toward `target`, each joint by
  // at most maxTotal radians in all
  reach(chain, eff, target, maxTotal = 0.5, iters = 10) {
    const used = Object.fromEntries(chain.map((n) => [n, 0]));
    for (let it = 0; it < iters; it++) for (const n of chain) {
      const o = this.pos(n), e = this.pos(eff);
      const a = norm(sub(e, o)), b = norm(sub(target, o));
      const c = Math.max(-1, Math.min(1, dot(a, b)));
      let ang = Math.acos(c);
      if (ang < 1e-4) continue;
      ang = Math.min(ang, maxTotal - used[n]);
      if (ang <= 0) continue;
      used[n] += ang;
      this.turn(n, rotAxis(cross(a, b), ang));
    }
    return { reach: dist(this.pos(eff), target) };
  }
  // chain() with the lower bone's direction swung within a cone (0.5 rad) to keep the lower limb out of the carrier
  chainClear(upper, lower, end, mid, dir, C) {
    const saved = this.locals.map((l) => ({ t: l.t.slice(), r: l.r.slice(), s: l.s }));
    const limb = this.verts([upper, lower, end]);
    const d0 = norm(dir), u = norm(cross(d0, Math.abs(d0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), v = cross(d0, u);
    let best = null;
    for (const [r, n] of [[0, 1], [0.25, 6], [0.5, 8]]) for (let k = 0; k < n; k++) {
      const a = (k / n) * 2 * Math.PI, d = norm(add(d0, add(scl(u, Math.tan(r) * Math.cos(a)), scl(v, Math.tan(r) * Math.sin(a)))));
      this.locals = saved.map((l) => ({ t: l.t.slice(), r: l.r.slice(), s: l.s })); this.fk();
      this.chain(upper, lower, mid, d);
      const cost = this.depth(limb, C) + 0.01 * r;
      if (!best || cost < best.cost) best = { cost, d };
    }
    this.locals = saved; this.fk();
    return this.chain(upper, lower, mid, best.d);
  }
  // twist joint `upper` about its axis `u` so its child `lower`'s bone axis comes nearest to `want`
  twistToward(upper, lower, u, want) {
    const d = this.axis(lower);
    const dp = sub(d, scl(u, dot(d, u))), wp = sub(want, scl(u, dot(want, u)));
    if (len(dp) < 1e-6 || len(wp) < 1e-6) return;
    const a = norm(dp), b = norm(wp);
    const ang = Math.atan2(dot(cross(a, b), u), dot(a, b));
    this.setWorld(upper, mul(rotAxis(u, ang), this.R(upper)));
  }
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
    // twist the upper bone so the lower bone, as it rests, points nearest to the target (closed form: turn the lower
    // bone's direction about the upper bone's axis onto the wanted direction's component across it)
    const want = norm(sub(T, E));
    this.twistToward(upper, lower, norm(sub(E, S)), want);
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

// skin the child's decimated mesh with the poser's pose (positions in carrier metres)
export function childVerts(poser) {
  // skinMesh multiplies W . IBM . v and scales by 0.01 (cm -> m); the poser's W already maps to metres: undo it
  const P = skinMesh(poser.rig, poser.c.mesh, poser.W);
  for (let i = 0; i < P.length; i++) P[i] *= 100;
  return P;
}

// ---------------------------------------------------------------- recipes
// Each recipe poses the child (Poser P) from the carrier C at its bind time, its sites and the spec's numbers p.
// Offsets in a joint's axes: inAxes(C, joint, [x, y, z]).
const inAxes = (C, j, o) => { const F = C.Wm[C.rig.index(j)]; return add(scl(axisOf(F, 0), o[0]), add(scl(axisOf(F, 1), o[1]), scl(axisOf(F, 2), o[2]))); };
const S_has = (site, n) => { try { site(n); return true; } catch { return false; } };
const RECIPES = {
  // piggy-back: the child lies against the carrier's back, chest to his back, its seat in his hands behind his hips,
  // its arms over his shoulders with the hands on the front of them, its thighs round his flanks, its shins hanging
  // forward
  back(P, C, p, site) {
    const sp = C.Wm[C.rig.index('Spine')];
    const sx = axisOf(sp, 0), sy = axisOf(sp, 1), sz = axisOf(sp, 2);   // his back: left, up the spine, out of his chest
    // the child's frame: up along his spine (tilted back by p.lean), facing into his back, rolled by p.roll
    let R = frameUF(norm(add(sy, scl(sz, -p.lean))), sz);
    R = mul(rotAxis(axisOf(R, 2), p.roll), R);
    // pelvis: offset from his Hips joint in his spine's axes (m)
    P.pelvis(add(C.J('Hips'), inAxes(C, 'Spine', p.pelvis)), R);
    // a hunch over his back; the head brought beside his (p.head_at: from his Head joint, in his spine's axes) by the
    // spine and neck, then turned to look past his head
    P.spread(['Spine02', 'Spine01', 'Spine'], rotAxis(axisOf(R, 0), p.hunch));
    const res = {};
    if (p.head_at) res.Head = P.reach(['neck', 'Spine', 'Spine01', 'Spine02'], 'Head', add(C.J('Head'), inAxes(C, 'Spine', p.head_at)), 0.45);
    P.spread(['neck', 'Head'], mul(rotAxis(P.axis('Spine', 2), p.head_roll || 0), mul(rotAxis(P.axis('Spine', 1), p.head_yaw), rotAxis(P.axis('Spine', 0), p.head_pitch))));
    for (const [s, L] of [['Left', 1], ['Right', -1]]) {
      // hands on the top of his shoulders, the elbows out and back
      const sh = site(`${s} shoulder`);
      res[s + 'Hand'] = P.twoBoneClear(`${s}Arm`, `${s}ForeArm`, `${s}Hand`, add(sh.p, scl(sh.n, p.hand_r)), add(P.pos(`${s}Arm`), add(scl(sx, L * (p.elbow_out ?? 0.3)), add(scl(sz, -(p.elbow_back ?? 0.15)), scl(sy, -(p.elbow_down ?? 0))))), C);
      P.aim(`${s}Hand`, norm(sub(add(sh.p, scl(sy, 0.08)), P.pos(`${s}Hand`))));
      // thighs round his flanks: the knee on his side (thigh aimed at it), the shin hanging down and forward
      const fl = site(`${s} flank`);
      const knee = add(fl.p, scl(fl.n, p.knee_r));
      const shinDir = norm(add(add(scl([0, -1, 0], p.shin_drop), scl(C.fwd, Math.sqrt(Math.max(0, 1 - p.shin_drop ** 2)))), scl(C.left, L * (p.shin_out || 0))));
      res[s + 'Knee'] = P.chainClear(`${s}UpLeg`, `${s}Leg`, `${s}Foot`, knee, shinDir, C);
      // the feet relaxed: toes down and forward
      P.aim(`${s}Foot`, norm(add(scl(shinDir, 0.7), scl(C.fwd, 0.7))));
    }
    return res;
  },

  // astride the shoulders: the child sits on the carrier's shoulders behind his neck, facing his way; its thighs over
  // his shoulders with the knees in front of them, its shins down his chest where his hands hold them; its hands on
  // his head
  shoulders(P, C, p, site) {
    const R = frameUF(norm(add([0, 1, 0], scl(C.fwd, p.lean))), C.fwd);
    P.pelvis(add(C.J('neck'), add(scl(C.left, p.pelvis[0]), add(scl(C.up, p.pelvis[1]), scl(C.fwd, p.pelvis[2])))), mul(rotAxis(C.fwd, p.roll || 0), R));
    P.spread(['Spine02', 'Spine01', 'Spine'], rotAxis(axisOf(R, 0), p.hunch));
    P.spread(['neck', 'Head'], mul(rotAxis(P.axis('Spine', 1), p.head_yaw || 0), rotAxis(P.axis('Spine', 0), p.head_pitch || 0)));
    const res = {};
    for (const [s, L] of [['Left', 1], ['Right', -1]]) {
      // the ankle in his hand (two-bone IK), the knee bent up and forward over the front of his shoulder
      const kn = site(`${s} shoulder front`), palm = site(`${s} palm`);
      const ankle = add(palm.p, add(scl(palm.n, p.shin_r), scl(C.up, p.shin_up || 0)));
      res[s + 'Foot'] = P.twoBoneClear(`${s}UpLeg`, `${s}Leg`, `${s}Foot`, ankle, add(kn.p, add(scl(kn.n, 0.2), scl(C.up, p.knee_up ?? 0.1))), C, 0.6);
      P.aim(`${s}Foot`, norm(add(P.axis(`${s}Leg`), scl(C.fwd, 0.8))));
      // hands on the sides of his head (or hat), elbows out
      const hd = site(`head ${s === 'Left' ? 'left' : 'right'}`);
      res[s + 'Hand'] = P.twoBoneClear(`${s}Arm`, `${s}ForeArm`, `${s}Hand`, add(hd.p, scl(hd.n, p.hand_r)), add(P.pos(`${s}Arm`), add(scl(C.left, L * (p.elbow_out ?? 0.3)), add(scl(C.fwd, -(p.elbow_back ?? 0.1)), scl(C.up, -(p.elbow_down ?? 0.1))))), C);
    }
    return res;
  },

  // held in the arms: the child sits on the carrier's left forearm, chest to her chest, its head on her left shoulder,
  // its arms round her, its legs hanging; her right hand on its back
  arms(P, C, p, site) {
    const fwd = norm(add(scl(C.fwd, -Math.cos(p.yaw)), scl(C.left, Math.sin(p.yaw))));   // the child faces her
    const R = frameUF(norm(add([0, 1, 0], scl(fwd, p.lean))), fwd);
    // the pelvis from her chest in the crook of her left arm ('crook' site), or on her left forearm
    const seat = S_has(site, 'crook') ? site('crook') : site('L forearm');
    P.pelvis(add(seat.p, add(scl(C.left, p.pelvis[0]), add(scl(C.up, p.pelvis[1]), scl(C.fwd, p.pelvis[2])))), mul(rotAxis(fwd, p.roll || 0), R));
    P.spread(['Spine02', 'Spine01', 'Spine'], rotAxis(axisOf(R, 0), p.hunch));
    const res = {};
    // its head beside hers (p.head_near: from her Head joint, body frame)
    if (p.head_near) res.Head = P.reach(['neck', 'Spine', 'Spine01', 'Spine02'], 'Head', add(C.J('Head'), add(scl(C.left, p.head_near[0]), add(scl(C.up, p.head_near[1]), scl(C.fwd, p.head_near[2])))), 0.35);
    P.spread(['neck', 'Head'], mul(rotAxis(P.axis('Spine', 2), p.head_roll || 0), mul(rotAxis(P.axis('Spine', 1), p.head_yaw || 0), rotAxis(P.axis('Spine', 0), p.head_pitch || 0))));
    for (const [s, L] of [['Left', 1], ['Right', -1]]) {
      const h = site(`child ${s} hand`);
      res[s + 'Hand'] = P.twoBoneClear(`${s}Arm`, `${s}ForeArm`, `${s}Hand`, add(h.p, scl(h.n, p.hand_r)), add(P.pos(`${s}Arm`), add(scl(axisOf(R, 0), L * 0.3), scl(C.up, -0.2))), C);
      // legs: the feet hanging below the seat, a little apart, the knees toward her
      const foot = add(P.pos('Hips'), add(scl(axisOf(R, 0), L * p.feet_apart), add(scl(C.up, -p.feet_down), scl(fwd, p.feet_fwd))));
      res[s + 'Foot'] = P.twoBoneClear(`${s}UpLeg`, `${s}Leg`, `${s}Foot`, foot, add(P.pos(`${s}UpLeg`), add(scl(fwd, 0.3), scl(C.up, 0.1))), C, 0.8);
      P.aim(`${s}Foot`, norm(add(P.axis(`${s}Leg`), scl(fwd, 0.7))));
    }
    return res;
  },

  // on the lap: the child sits on the seated carrier's thighs facing her way, its back against her and her hands at its
  // waist, its legs forward over her knees with the shins hanging
  lap(P, C, p, site) {
    const R = frameUF(norm(add([0, 1, 0], scl(C.fwd, p.lean))), C.fwd);
    const mid = lerp3(site('L thigh').p, site('R thigh').p, 0.5);
    P.pelvis(add(mid, add(scl(C.left, p.pelvis[0]), add(scl(C.up, p.pelvis[1]), scl(C.fwd, p.pelvis[2])))), mul(rotAxis(C.fwd, p.roll || 0), R));
    P.spread(['Spine02', 'Spine01', 'Spine'], rotAxis(axisOf(R, 0), p.hunch));
    P.spread(['neck', 'Head'], mul(rotAxis(P.axis('Spine', 1), p.head_yaw || 0), rotAxis(P.axis('Spine', 0), p.head_pitch || 0)));
    const res = {};
    for (const [s, L] of [['Left', 1], ['Right', -1]]) {
      // thighs along hers, the knees past her knees, the shins hanging
      const kn = site(`${s[0]} knee`);
      const knee = add(kn.p, add(scl(C.up, p.knee_up), add(scl(C.fwd, p.knee_fwd), scl(C.left, L * p.knee_out))));
      res[s + 'Knee'] = P.chainClear(`${s}UpLeg`, `${s}Leg`, `${s}Foot`, knee, norm(add([0, -1, 0], scl(C.fwd, p.shin_fwd))), C);
      P.aim(`${s}Foot`, norm(add(P.axis(`${s}Leg`), scl(C.fwd, 0.8))));
      // arms: the hands on its own thighs, short of the knees (clear of her forearms, which lift)
      const hand = add(lerp3(P.pos(`${s}UpLeg`), P.pos(`${s}Leg`), p.hand_along ?? 0.7), add(scl(C.up, p.hand_up ?? 0.05), scl(C.left, L * (p.hand_out ?? 0.02))));
      res[s + 'Hand'] = P.twoBoneClear(`${s}Arm`, `${s}ForeArm`, `${s}Hand`, hand, add(P.pos(`${s}Arm`), add(scl(C.left, L * 0.25), scl(C.fwd, -0.2))), C);
    }
    return res;
  },
};

// ---------------------------------------------------------------- the solve: setup, pose, measure, search
export function loadSpec() { return JSON.parse(fs.readFileSync(r('gen/props/carry.json'), 'utf8')); }
export function saveSpec(spec) {
  // numeric arrays stay on one line
  const txt = JSON.stringify(spec, null, 1).replace(/\[\s+(-?[\d.e-]+(?:,\s+-?[\d.e-]+)*)\s+\]/g, (m, inner) => `[${inner.split(/,\s+/).join(', ')}]`);
  fs.writeFileSync(r('gen/props/carry.json'), txt + '\n');
}
export function bindOf(prop, carrier) {
  const props = JSON.parse(fs.readFileSync(r('characters/props.json'), 'utf8'));
  const own = props[carrier]?.[prop];
  if (!own) throw new Error(`characters/props.json has no ${carrier}.${prop}`);
  return { ...(props._defaults?.[own.geom || prop] || {}), ...own };
}
const getPath = (o, k) => k.split('.').reduce((a, x) => a[x], o);
const setPath = (o, k, v) => { const ks = k.split('.'); const last = ks.pop(); ks.reduce((a, x) => a[x], o)[last] = v; };

export async function setup(prop, spec, nSamples = 24) {
  // spec.clip: the carrier's clip the child is posed on (else the props.json entry's); spec.carrier_file: a trial GLB
  const bind = { ...bindOf(prop, spec.carrier), ...(spec.clip ? { clip: spec.clip } : {}) };
  const rig = await loadRig(spec.carrier_file ? path.resolve(spec.carrier_file) : r(`gen/characters/${spec.carrier}/${spec.carrier}_raw.glb`));
  const t0 = spec.t ?? bind.t;
  const C = carrierPose(rig, bind.clip, t0);
  const dur = rig.clips[bind.clip];
  const B = rig.index(spec.bone || bind.bone);
  // the carrier over the cycle, and the child's rigid motion with the bind bone: rel = W_B(t) . W_B(t0)^-1
  const samples = Array.from({ length: nSamples }, (_, k) => (k / nSamples) * dur).map((t) => {
    const Ct = carrierPose(rig, bind.clip, t);
    return { t, C: Ct, rel: mul(Ct.Wm[B], invert(C.Wm[B])), relOf: (j) => mul(Ct.Wm[j], invert(C.Wm[j])) };
  });
  const child = await childModel(spec.child, spec.tris || 2000);
  const label = dominant(child.mesh);
  const sites = sitesOf(C, spec.sites);
  const contacts = spec.contacts.map((ct) => ({ ...ct, s: sites[ct.site], tris: partTris(child.mesh.idx, label, ct.child.map((b) => child.rig.index(b))) }));
  for (const ct of contacts) if (!ct.s) throw new Error(`${prop}: no site ${ct.site}`);
  const S = { prop, spec, bind: { ...bind, t: t0 }, rig, C, samples, child, label, sites, contacts, boneName: rig.names[B], B };
  // the surfaces the child may follow (spec.follow_exclude: carrier bones whose skin it must not ride, e.g. hands that
  // slide over it)
  if (spec.follow_exclude) {
    const ex = new Set(spec.follow_exclude.map((b) => rig.index(b))), idx = C.body.idx;
    const keep = [];
    for (let t = 0; t < idx.length / 3; t++) if ([0, 1, 2].filter((c) => ex.has(C.dom[idx[t * 3 + c]])).length < 2) keep.push(t);
    S.followGrid = new TriGrid(C.P, idx, Uint32Array.from(keep));
  }
  return S;
}
export function poseWith(S, p, { follow = true } = {}) {
  const poser = new Poser(S.child, S.spec.height_m);
  const res = RECIPES[S.spec.recipe](poser, S.C, p, (n) => { if (!S.sites[n]) throw new Error(`no site ${n}`); return S.sites[n]; });
  let P = childVerts(poser);
  let flat = null;
  if (follow && S.spec.flatten !== false) { flat = flatten(S, P, S.spec.flatten_margin ?? 0.004); P = flat.P; }
  S.weights = follow ? followWeights(S, P) : null;
  return { poser, P, res, flat };
}
// Which carrier bones the child follows over the cycle. Rigid on the bind bone (spec.follow "rigid") cannot hold a
// child whose supports move against each other (the idler's hands sweep 3-5 cm against his spine). So each child
// bone follows what it rests on: the carrier's skin weights at the surface under its vertices (within r of it,
// weighted by nearness); a child bone touching nothing takes the mix of its nearest touching neighbour along the
// child's skeleton. Each child vertex then follows its own child bones' mixes (the child's skin weights), so every
// segment of the child moves almost rigidly and the contacts ride with the surfaces under them. Returns per vertex
// [[carrier joint, w], ...] (at most 4, normalised), and S.followOf (per child bone) for the record.
export function followWeights(S, P) {
  const C = S.C, child = S.child, m = child.mesh, nb = child.rig.names.length;
  if (S.spec.follow === 'rigid') { S.followOf = null; return Array.from({ length: m.n }, () => [[S.B, 1]]); }
  const r = S.spec.follow_r ?? 0.03, FG = S.followGrid || C.grid;
  const acc = Array.from({ length: nb }, () => new Map()), tot = new Float64Array(nb);
  const cw = (k) => { const o = []; for (let c = 0; c < 4; c++) if (C.body.W[k * 4 + c] > 0) o.push([C.body.jmap[C.body.J[k * 4 + c]], C.body.W[k * 4 + c]]); return o; };
  for (let i = 0; i < m.n; i++) {
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    const q = FG.closest(p, r);
    if (!q) continue;
    const w = C.grid.inside(p) ? 1 : 1 - q.d / r, lb = S.label[i];
    tot[lb] += w;
    for (let k = 0; k < 3; k++) for (const [j, ww] of cw(C.body.idx[q.tri * 3 + k])) acc[lb].set(j, (acc[lb].get(j) || 0) + w * ww * q.bary[k]);
  }
  const minTot = S.spec.follow_min ?? 3;
  let fol = Array.from({ length: nb }, (_, b) => (tot[b] >= minTot ? [...acc[b]].map(([j, w]) => [j, w / [...acc[b].values()].reduce((a, x) => a + x, 0)]) : null));
  // follow 'surface': no child bone follows as a whole, only the vertices lying on him (below), the rest is rigid on
  // the bind bone; a long child limb then can't swing with a carrier bone's rotation about a far joint
  if (S.spec.follow === 'surface') fol = fol.map(() => null);
  // untouched child bones: the nearest touched bone along the skeleton (breadth-first; ties averaged)
  const nbrs = Array.from({ length: nb }, () => []);
  child.rig.parent.forEach((pa, i) => { if (pa >= 0) { nbrs[i].push(pa); nbrs[pa].push(i); } });
  const base = fol.slice();
  for (let b = 0; b < nb; b++) {
    if (base[b]) continue;
    let front = [b], seen = new Set([b]), found = [];
    while (front.length && !found.length) {
      const next = [];
      for (const x of front) for (const y of nbrs[x]) if (!seen.has(y)) { seen.add(y); if (base[y]) found.push(base[y]); else next.push(y); }
      front = next;
    }
    if (!found.length) { fol[b] = [[S.B, 1]]; continue; }
    const mix = new Map();
    for (const f of found) for (const [j, w] of f) mix.set(j, (mix.get(j) || 0) + w / found.length);
    fol[b] = [...mix];
  }
  S.followOf = Object.fromEntries(fol.map((f, b) => [child.rig.names[b], f.map(([j, w]) => [S.rig.names[j], +w.toFixed(3)])]));
  // per vertex: its child bones' mixes by the child's own skin weights; a vertex lying on the carrier (closer than
  // `near` [inner, outer] metres) follows the surface under it instead, fading out by the outer distance, so the
  // contacts hold as the surfaces under them move; the four largest weights kept
  const [n0, n1] = S.spec.follow_near ?? [0.006, 0.025];
  const out = new Array(m.n);
  for (let i = 0; i < m.n; i++) {
    const mix = new Map();
    for (let c = 0; c < 4; c++) { const w = m.W[i * 4 + c]; if (!w) continue; for (const [j, x] of fol[m.jmap[m.J[i * 4 + c]]]) mix.set(j, (mix.get(j) || 0) + w * x); }
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], q = FG.closest(p, n1);
    if (q) {
      const x = Math.min(1, Math.max(0, (n1 - q.d) / (n1 - n0))), wl = x * x * (3 - 2 * x);
      for (const [j, v] of mix) mix.set(j, v * (1 - wl));
      for (let k = 0; k < 3; k++) for (const [j, ww] of cw(C.body.idx[q.tri * 3 + k])) mix.set(j, (mix.get(j) || 0) + wl * ww * q.bary[k]);
    }
    // blend only bones that move alike at the bind time (their skinning rotations within 25 degrees of the
    // dominant's): the page skins with the blended matrix, and a blend of unlike bones (both forearms) shrinks at
    // the bind time and swings the vertex far as the clip moves them
    let top = [...mix].sort((a, b) => b[1] - a[1]).filter(([, w]) => w > 0.01).slice(0, 4);
    let sum = top.reduce((a, [, w]) => a + w, 0);
    top = top.map(([j, w]) => [j, w / sum]);
    // keep the whole blend if the page's skinning of it stays within 1 cm of the intended blend of motions over the
    // cycle (tested on the samples); else only the bones alike the dominant one
    if (top.length > 1 && blendError(S, top, [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]) > (S.spec.blend_tol ?? 0.01)) {
      const R0 = rotOfSkin(S, top[0][0]);
      top = top.filter(([j]) => j === top[0][0] || angleBetween(R0, rotOfSkin(S, j)) < 25);
      sum = top.reduce((a, [, w]) => a + w, 0);
      top = top.map(([j, w]) => [j, w / sum]);
    }
    out[i] = top;
  }
  return out;
}
// how far the page's skinning of a blend (M(t) . M(t0)^-1 v) strays from the intended blend of the bones' motions
// (sum w_j W_j(t) W_j(t0)^-1 v) over the cycle samples, metres
function blendError(S, w, v) {
  const body = S.rig.meshes[S.rig.body];
  const K = (C, j) => mul(C.W[j], body.IBM[body.jmap.indexOf(j)]);
  const M0 = new Array(16).fill(0);
  for (const [j, x] of w) { const k = K(S.C, j); for (let e = 0; e < 16; e++) M0[e] += x * k[e]; }
  const vb = xf(invert(M0), scl(v, 100));
  let worst = 0;
  for (const sm of S.samples.filter((_, k) => k % 3 === 0)) {
    let a = [0, 0, 0], b = [0, 0, 0];
    for (const [j, x] of w) { a = add(a, scl(xf(K(sm.C, j), vb), x * 0.01)); b = add(b, scl(xf(sm.relOf(j), v), x)); }
    worst = Math.max(worst, dist(a, b));
  }
  return worst;
}
// the rotation of a carrier joint's skinning matrix W_j(t0) . IBM_j (bind -> posed), and the angle between two
function rotOfSkin(S, j) {
  S._skinRot ||= new Map();
  if (!S._skinRot.has(j)) S._skinRot.set(j, rot3(normalizeRot(mul(S.C.W[j], S.rig.meshes[S.rig.body].IBM[S.rig.meshes[S.rig.body].jmap.indexOf(j)]))));
  return S._skinRot.get(j);
}
function angleBetween(A, B) {
  const R = mul(invert(A), B), c = (R[0] + R[5] + R[10] - 1) / 2;
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}
// Contact flattening: where the posed child presses into the carrier (inside him, or closer than `margin`), its
// surface is pushed out onto his surface plus the margin, as soft flesh and cloth give at a contact; the push fades
// over the next `falloff` metres of the child's surface so no step shows. Seam copies of a vertex (same rest
// position, split UVs) move together. Returns the new positions and the largest push.
export function flatten(S, P, margin = 0.004, falloff = 0.03) {
  const m = S.child.mesh, n = m.n;
  // weld by rest position
  const key = (i) => `${m.pos[i * 3].toFixed(5)},${m.pos[i * 3 + 1].toFixed(5)},${m.pos[i * 3 + 2].toFixed(5)}`;
  const gid = new Int32Array(n), groups = new Map();
  for (let i = 0; i < n; i++) { const k = key(i); if (!groups.has(k)) groups.set(k, groups.size); gid[i] = groups.get(k); }
  const G = groups.size, gp = new Float64Array(G * 3), cnt = new Float64Array(G);
  for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) gp[gid[i] * 3 + c] += P[i * 3 + c]; cnt[gid[i]]++; }
  for (let g = 0; g < G; g++) for (let c = 0; c < 3; c++) gp[g * 3 + c] /= cnt[g];
  const nb = Array.from({ length: G }, () => new Set());
  for (let t = 0; t < m.idx.length; t += 3) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b) nb[gid[m.idx[t + a]]].add(gid[m.idx[t + b]]);
  // the pushes needed
  const need = new Float64Array(G * 3), fixed = new Uint8Array(G);
  let maxPush = 0;
  for (let g = 0; g < G; g++) {
    const p = [gp[g * 3], gp[g * 3 + 1], gp[g * 3 + 2]];
    const q = S.C.grid.closest(p, 0.12);
    if (!q) continue;
    const inside = S.C.grid.inside(p);
    if (!inside && q.d >= margin) continue;
    const out = inside ? norm(sub(q.point, p)) : norm(sub(p, q.point));
    const push = inside ? q.d + margin : margin - q.d;
    need.set(scl(out, push), g * 3); fixed[g] = 1; maxPush = Math.max(maxPush, push);
  }
  // contact closing: where a contact's site is up to `close` from the child part, the part's surface round its nearest
  // point (within 3 cm, fading out) is drawn onto the site (+ margin along his surface normal), as the child's weight
  // would settle it there; a site already touching needs nothing
  const close = S.spec.contact_close ?? 0.025;
  if (close > 0) for (const ct of S.contacts) {
    const g = gapTo(ct.s.p, P, m.idx, ct.tris);
    if (!g.q || g.d <= margin || g.d > close) continue;
    const goal = add(ct.s.p, scl(ct.s.n, margin));
    const pull = sub(goal, g.q);
    const inPart = new Set();
    for (const t of ct.tris) for (let c = 0; c < 3; c++) inPart.add(gid[m.idx[t * 3 + c]]);
    for (const gg of inPart) {
      if (fixed[gg]) continue;
      const p = [gp[gg * 3], gp[gg * 3 + 1], gp[gg * 3 + 2]];
      const f = Math.max(0, 1 - dist(p, g.q) / 0.03);
      if (f <= 0) continue;
      need.set(scl(pull, f * f * (3 - 2 * f)), gg * 3); fixed[gg] = 1; maxPush = Math.max(maxPush, len(pull) * f);
    }
  }
  // fade: unconstrained groups take a share of their neighbours' push, decaying with distance
  const disp = Float64Array.from(need);
  for (let it = 0; it < 12; it++) {
    const next = Float64Array.from(disp);
    for (let g = 0; g < G; g++) {
      if (fixed[g]) continue;
      let best = [0, 0, 0], bl = 0;
      for (const h of nb[g]) {
        const d = Math.hypot(gp[g * 3] - gp[h * 3], gp[g * 3 + 1] - gp[h * 3 + 1], gp[g * 3 + 2] - gp[h * 3 + 2]);
        const f = Math.max(0, 1 - d / falloff);
        const v = [disp[h * 3] * f, disp[h * 3 + 1] * f, disp[h * 3 + 2] * f], l = len(v);
        if (l > bl) { bl = l; best = v; }
      }
      const cur = Math.hypot(disp[g * 3], disp[g * 3 + 1], disp[g * 3 + 2]);
      if (bl > cur) next.set(best, g * 3);
    }
    disp.set(next);
  }
  const out = Float64Array.from(P);
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) out[i * 3 + c] += disp[gid[i] * 3 + c];
  return { P: out, maxPush };
}

// the child at a sample, as the page skins it: v(t) = M_v(t) . M_v(t0)^-1 . v(t0), M_v = sum_j w_j W_j . IBM_j
// (char_props.mjs binds the prop with v_bind = M_v(t0)^-1 v(t0)); exact for one bone, and a blend of unlike bones shows
// here as it will on the page
export function moved(S, sm, P0) {
  if (!S.weights || S.weights.every((w) => w.length === 1 && w[0][0] === S.B)) return xfAll(sm.rel, P0);
  const body = S.rig.meshes[S.rig.body];
  const skin = (C) => { const o = new Map(); return (j) => { if (!o.has(j)) o.set(j, mul(C.W[j], body.IBM[body.jmap.indexOf(j)])); return o.get(j); }; };
  if (!S._vbind || S._vbindFor !== P0) {
    const K0 = skin(S.C);
    S._vbind = S.weights.map((w, i) => {
      const M = new Array(16).fill(0);
      for (const [j, x] of w) { const k = K0(j); for (let e = 0; e < 16; e++) M[e] += x * k[e]; }
      return xf(invert(M), [P0[i * 3] * 100, P0[i * 3 + 1] * 100, P0[i * 3 + 2] * 100]);
    });
    S._vbindFor = P0;
  }
  const K = skin(sm.C);
  const out = new Float64Array(P0.length);
  for (let i = 0; i < P0.length / 3; i++) {
    const vb = S._vbind[i];
    let x = 0, y = 0, z = 0;
    for (const [j, w] of S.weights[i]) { const k = K(j); x += w * (k[0] * vb[0] + k[4] * vb[1] + k[8] * vb[2] + k[12]); y += w * (k[1] * vb[0] + k[5] * vb[1] + k[9] * vb[2] + k[13]); z += w * (k[2] * vb[0] + k[6] * vb[1] + k[10] * vb[2] + k[14]); }
    out[i * 3] = x * 0.01; out[i * 3 + 1] = y * 0.01; out[i * 3 + 2] = z * 0.01;
  }
  return out;
}
// contacts (gap from each carrier site to the child part), penetration and floating, at the bind time and over the
// samples; the child moves rigidly with the bind bone
export function measure(S, P0, { cycle = true, every = 1, fast = false } = {}) {
  const verts = fast ? (S._half ||= Array.from({ length: Math.ceil(S.child.mesh.n / 2) }, (_, i) => i * 2)) : null;
  const idx = S.child.mesh.idx;
  const out = { contacts: S.contacts.map((ct) => ({ name: ct.name, bind: 0, max: 0, mean: 0, float: 0 })), pen: 0, penBind: 0, penT: 0, depart: 0 };
  // the contact patches: part vertices within 2 cm of the bind contact point
  const patches = S.contacts.map((ct) => {
    const g = gapTo(ct.s.p, P0, idx, ct.tris);
    const vs = new Set();
    for (const t of ct.tris) for (let c = 0; c < 3; c++) { const i = idx[t * 3 + c]; if (dist([P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]], g.q) <= 0.02) vs.add(i); }
    return [...vs];
  });
  S.contacts.forEach((ct, k) => { out.contacts[k].bind = gapTo(ct.s.p, P0, idx, ct.tris).d; out.contacts[k].floatBind = floating(S.C, P0, patches[k]); });
  out.penBind = penetration(S.C, P0, verts).max;
  if (!cycle) return out;
  const samples = S.samples.filter((_, k) => k % every === 0);
  for (const sm of samples) {
    const P = moved(S, sm, P0);
    S.contacts.forEach((ct, k) => {
      const g = gapTo(siteAt(sm.C, ct.s).p, P, idx, ct.tris).d;
      const o = out.contacts[k];
      o.max = Math.max(o.max, g); o.mean += g / samples.length;
      o.float = Math.max(o.float, floating(sm.C, P, patches[k]));
    });
    const pen = penetration(sm.C, P, verts).max;
    if (pen > out.pen) { out.pen = pen; out.penT = sm.t; }
    const R = xfAll(sm.rel, P0);
    for (let i = 0; i < P.length; i += 3) out.depart = Math.max(out.depart, Math.hypot(P[i] - R[i], P[i + 1] - R[i + 1], P[i + 2] - R[i + 2]));
    // the child's own edges: how much the follow weights stretch it (edges over 4 mm)
    if (!S._edges) {
      const E = new Map();
      for (let t = 0; t < idx.length; t += 3) for (let a = 0; a < 3; a++) { const i = idx[t + a], j = idx[t + (a + 1) % 3]; E.set(Math.min(i, j) * 65536 + Math.max(i, j), [i, j]); }
      S._edges = [...E.values()];
    }
    for (const [i, j] of S._edges) {
      const l0 = Math.hypot(P0[i * 3] - P0[j * 3], P0[i * 3 + 1] - P0[j * 3 + 1], P0[i * 3 + 2] - P0[j * 3 + 2]);
      if (l0 < 0.004) continue;
      const l = Math.hypot(P[i * 3] - P[j * 3], P[i * 3 + 1] - P[j * 3 + 1], P[i * 3 + 2] - P[j * 3 + 2]);
      out.stretch = Math.max(out.stretch || 0, Math.abs(l / l0 - 1));
    }
  }
  return out;
}
// the search's objective: soft targets inside the hard limits (gaps 2 cm at the bind time and 4 cm over the cycle,
// penetration 1 cm, floating 3 cm), and steep walls at the limits themselves
function score(m, spec, push = 0) {
  const tb = spec.target_bind ?? 0.01, tc = spec.target_cycle ?? 0.025, tp = spec.target_pen ?? 0.004;
  const wall = (x, lim) => 60 * Math.max(0, x - lim) ** 2;
  let J = 0;
  for (const [k, c] of m.contacts.entries()) {
    const w = spec.contacts[k].weight ?? 1;
    J += w * (Math.max(0, c.bind - tb) ** 2 + 0.5 * Math.max(0, c.max - tc) ** 2 + 0.3 * Math.max(0, c.float - 0.02) ** 2
      + wall(c.bind, 0.018) + wall(c.max, 0.036) + wall(c.float, 0.028));
  }
  // penetration over the cycle (after the contact flattening) and the flattening itself (a deep push dents the child)
  const wp = spec.w_pen ?? 1;
  J += wp * (10 * Math.max(0, m.pen - tp) ** 2 + 4 * wall(m.pen, 0.008)) + 2 * Math.max(0, push - 0.01) ** 2 + (spec.w_push ?? 4) * wall(push, spec.push_ok ?? 0.025)
    + 0.5 * Math.max(0, m.depart - (spec.depart_ok ?? 0.06)) ** 2 + 0.002 * Math.max(0, (m.stretch || 0) - (spec.stretch_ok ?? 0.3)) ** 2;
  return J;
}
// search over the spec's free numbers (each in its range), from the current p: a (1+1) evolution strategy with the
// one-fifth rule on the numbers normalised to their ranges, then a pattern search to polish; seeded, so reruns agree
export function search(S, evals = S.spec.search_evals ?? 700) {
  const free = Object.entries(S.spec.free || {});
  const p = structuredClone(S.spec.p);
  let seed = S.spec.search_seed ?? 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const evalP = (q) => { const r = poseWith(S, q); return score(measure(S, r.P, { every: S.spec.search_every ?? 3, fast: !S.spec.search_full }), S.spec, r.flat?.maxPush || 0); };
  const x = free.map(([k, [lo, hi]]) => (Math.min(hi, Math.max(lo, getPath(p, k))) - lo) / (hi - lo));
  const toP = (xs) => { const q = structuredClone(p); free.forEach(([k, [lo, hi]], i) => setPath(q, k, lo + Math.min(1, Math.max(0, xs[i])) * (hi - lo))); return q; };
  let best = evalP(toP(x)), sigma = 0.12, n = 1;
  for (; n < evals * 0.7; n++) {
    const y = x.map((v) => Math.min(1, Math.max(0, v + sigma * gauss())));
    const J = evalP(toP(y));
    if (J < best) { best = J; x.splice(0, x.length, ...y); sigma *= Math.exp(1 / 3); } else sigma *= Math.exp(-1 / 12);
    sigma = Math.min(0.3, Math.max(0.004, sigma));
  }
  let step = 0.05;
  while (n < evals && step > 0.002) {
    let moved = false;
    for (let i = 0; i < x.length; i++) for (const sg of [1, -1]) {
      const y = x.slice(); y[i] = Math.min(1, Math.max(0, y[i] + sg * step));
      if (y[i] === x[i]) continue;
      const J = evalP(toP(y)); n++;
      if (J < best) { best = J; x[i] = y[i]; moved = true; }
    }
    if (!moved) step /= 2;
  }
  console.log(`  search: ${n} poses, score ${best.toExponential(2)}`);
  return toP(x);
}
export function report(S, m) {
  const cm = (x) => (x * 100).toFixed(1);
  console.log(`${S.prop}: ${S.spec.child} ${S.spec.height_m} m, ${S.child.mesh.idx.length / 3} tris (from ${S.child.full.idx.length / 3}); carrier ${S.spec.carrier} ${S.bind.clip} @ ${S.bind.t}s, rigid on ${S.boneName}`);
  console.log(`  ${'contact'.padEnd(36)} bind   max  mean float (cm)  follow: ${S.spec.follow === 'rigid' ? 'rigid' : 'by contact'}`);
  for (const c of m.contacts) console.log(`  ${c.name.padEnd(36)} ${cm(c.bind).padStart(4)} ${cm(c.max).padStart(5)} ${cm(c.mean).padStart(5)} ${cm(c.float).padStart(5)}`);
  console.log(`  penetration: bind ${cm(m.penBind)} cm, cycle max ${cm(m.pen)} cm (t ${m.penT.toFixed(1)} s); departure from rigid ${cm(m.depart)} cm; edge stretch ${((m.stretch || 0) * 100).toFixed(0)}%`);
}
// which child parts are inside the carrier at the bind time (count and deepest, per child joint)
export function penParts(S, P, C = S.C) {
  const by = {};
  const n = P.length / 3;
  for (let i = 0; i < n; i++) {
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    if (!C.grid.inside(p)) continue;
    const q = C.grid.closest(p, 0.12), d = q ? q.d : 0.12;
    const into = q ? C.rig.names[C.dom[C.body.idx[q.tri * 3]]] : '?';
    const k = `${S.child.rig.names[S.label[i]]}>${into}`;
    by[k] ||= { n: 0, max: 0 };
    by[k].n++; by[k].max = Math.max(by[k].max, d);
  }
  return Object.entries(by).sort((a, b) => b[1].max - a[1].max).map(([k, v]) => `${k} ${v.n}/${(v.max * 100).toFixed(1)}`).join(', ');
}
// the bind time that puts every carrier site nearest the middle of its own path (in the bind bone's frame), so the
// drift over the cycle is about half its range
function pickT(S) {
  const B = S.rig.index(S.boneName);
  const names = Object.keys(S.sites);
  const paths = S.samples.map((sm) => names.map((n) => xf(invert(sm.C.Wm[B]), siteAt(sm.C, S.sites[n]).p)));
  const centre = names.map((_, k) => { const lo = [0, 1, 2].map((c) => Math.min(...paths.map((p) => p[k][c]))), hi = [0, 1, 2].map((c) => Math.max(...paths.map((p) => p[k][c]))); return lo.map((x, c) => (x + hi[c]) / 2); });
  const range = names.map((_, k) => Math.max(...paths.map((p) => dist(p[k], centre[k]))));
  const cost = paths.map((p) => Math.max(...names.map((_, k) => dist(p[k], centre[k]))));
  const order = cost.map((c, i) => [c, S.samples[i].t]).sort((a, b) => a[0] - b[0]);
  console.log('  site half-ranges (cm):', names.map((n, k) => `${n} ${(range[k] * 100).toFixed(1)}`).join(', '));
  console.log('  best bind times:', order.slice(0, 5).map(([c, t]) => `${t.toFixed(2)}s (${(c * 100).toFixed(1)} cm)`).join(', '), `; now ${S.bind.t}s`);
}

// ---------------------------------------------------------------- writing the prop
async function writeProp(file, S, poser, P, image) {
  const doc = new Document();
  const buf = doc.createBuffer();
  const m = S.child.mesh;
  // normals: rest normals turned by each vertex's blended joint rotation
  const R = m.jmap.map((j, i) => rot3(normalizeRot(mul(poser.W[j], m.IBM[i]))));
  const nrm = new Float32Array(m.n * 3);
  for (let i = 0; i < m.n; i++) {
    let n = [0, 0, 0];
    const v = [m.nrm[i * 3], m.nrm[i * 3 + 1], m.nrm[i * 3 + 2]];
    for (let c = 0; c < 4; c++) { const w = m.W[i * 4 + c]; if (w) n = add(n, scl(xd(R[m.J[i * 4 + c]], v), w)); }
    nrm.set(norm(n), i * 3);
  }
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const prim = doc.createPrimitive().setAttribute('POSITION', acc('VEC3', Float32Array.from(P))).setAttribute('NORMAL', acc('VEC3', nrm))
    .setAttribute('TEXCOORD_0', acc('VEC2', Float32Array.from(m.uv)))
    .setAttribute('_PART', acc('SCALAR', Uint8Array.from(S.label)));   // each vertex's child joint (carry_check's parts)
  // the carrier bones each vertex follows (char_props.mjs binds them): indices into extras.carry.bones
  const bones = [...new Set(S.weights.flatMap((w) => w.map(([j]) => j)))].sort((a, b) => a - b);
  const JJ = new Uint8Array(m.n * 4), WW = new Float32Array(m.n * 4);
  S.weights.forEach((w, i) => w.forEach(([j, x], c) => { JJ[i * 4 + c] = bones.indexOf(j); WW[i * 4 + c] = x; }));
  prim.setAttribute('_CARRY_JOINTS', acc('VEC4', JJ)).setAttribute('_CARRY_WEIGHTS', acc('VEC4', WW))
    .setIndices(acc('SCALAR', m.n > 65535 ? Uint32Array.from(m.idx) : Uint16Array.from(m.idx)));
  if (image) {
    const tex = doc.createTexture(`prop_tex_${S.child.name}`).setImage(image.image).setMimeType(image.mime);
    prim.setMaterial(doc.createMaterial(`prop_tex_${S.child.name}`).setBaseColorTexture(tex).setRoughnessFactor(1).setMetallicFactor(0));
  }
  const node = doc.createNode(S.prop).setMesh(doc.createMesh(S.prop).addPrimitive(prim));
  doc.createScene().addChild(node);
  doc.getRoot().setExtras({ carry: { carrier: S.spec.carrier, clip: S.bind.clip, t: S.bind.t, child: S.child.name, height_m: S.spec.height_m, frame: 'root',
    bones: bones.map((j) => S.rig.names[j]), parts: S.child.rig.names, follow: S.followOf, tris: m.idx.length / 3 } });
  await io.write(file, doc);
}

// characters/props.json for this prop: its geometry is posed in the carrier's frame (at: root), on the bind bone,
// wearing the child's texture; the carrier's entry keeps its clip and gets the bind time the geometry was posed at.
// The file is shared with other agents: read fresh, change only this prop's entries, write at once.
function writeBinding(prop, sp, t) {
  // props.json is written by Python's json.dumps(indent=2) (floats keep their ".0"): edit it the same way, so the
  // diff is only these entries
  const py = `import json, sys
f, prop, carrier, bone, child, t, clip = sys.argv[1:8]
d = json.load(open(f))
geom = d[carrier][prop].get('geom', prop)
d['_defaults'][geom] = {'bone': bone, 'at': 'root', 'texture_from': child}
d[carrier][prop]['t'] = float(t)
if clip: d[carrier][prop]['clip'] = clip
open(f, 'w').write(json.dumps(d, indent=2) + '\\n')
print('  characters/props.json: _defaults.%s = %s, %s.%s = %s' % (geom, d['_defaults'][geom], carrier, prop, d[carrier][prop]))`;
  process.stdout.write(execFileSync('python3', ['-c', py, r('characters/props.json'), prop, sp.carrier, sp.bone, sp.child, String(t), sp.clip || ''], { encoding: 'utf8' }));
}

// ---------------------------------------------------------------- main
const args = process.argv.slice(2);
if (args.length && import.meta.url === `file://${process.argv[1]}`) {
  const spec = loadSpec();
  const which = args[0] === 'all' ? Object.keys(spec).filter((k) => !k.startsWith('_')) : args[0].split(',');
  const pv = args.indexOf('--preview');
  for (const prop of which) {
    const S = await setup(prop, spec[prop]);
    if (args.includes('--search')) {
      spec[prop].p = search(S);
      const fresh = loadSpec(); fresh[prop].p = spec[prop].p; saveSpec(fresh);
    }
    const { poser, P, res, flat } = poseWith(S, spec[prop].p);
    report(S, measure(S, P));
    if (flat) console.log(`  contact flattening: largest push ${(flat.maxPush * 100).toFixed(1)} cm`);
    console.log('  inside at bind (joint count/deepest cm):', penParts(S, P) || 'none');
    const m2 = measure(S, P);
    const w = S.samples.find((sm) => sm.t === m2.penT);
    if (w) console.log(`  inside at t ${w.t.toFixed(1)}:`, penParts(S, moved(S, w, P), w.C));
    if (args.includes('--pick-t')) pickT(S);
    for (const [k, v] of Object.entries(res)) if (v?.reach > 0.005) console.log(`  ${k} short of its target by ${(v.reach * 100).toFixed(1)} cm`);
    if (pv >= 0) {
      const { render } = await import('./carry_preview.mjs');
      await render(args[pv + 1].replace('{prop}', prop), [
        { P: S.C.P, idx: S.C.body.idx, color: [0.75, 0.75, 0.8] },
        { P, idx: S.child.mesh.idx, color: [0.95, 0.55, 0.25] },
      ], Object.values(S.sites).map((x) => ({ p: x.p, color: [0.9, 0.1, 0.1] })), { center: S.C.J(S.spec.preview_at || 'Spine01'), extent: S.spec.preview_extent || 0.85, size: 560, views: ['left', 'front', 'back', 'top', 'q3', 'q3b'] });
    }
    if (spec[prop].ship === false && !args.includes('--force')) console.log(`  not written: ${prop} has "ship": false in carry.json (its pose fails carry_check; --force writes it)`);
    else if (!args.includes('--no-write')) {
      // a small copy of the child's texture for viewing the prop on its own (the build takes the full-size one)
      const shipped = await loadRig(r(`web/public/assets/chars/${spec[prop].child}.glb`)).catch(() => null);
      await writeProp(r(`gen/props/${prop}.glb`), S, poser, P, shipped ? shipped.meshes[shipped.body] : null);
      console.log(`  wrote gen/props/${prop}.glb`);
      writeBinding(prop, spec[prop], S.bind.t);
    }
  }
}
