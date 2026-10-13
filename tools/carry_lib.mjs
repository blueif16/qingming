// Shared maths for the carried children (tools/carry_pose.mjs bakes them, tools/carry_check.mjs checks them): read a
// rigged character GLB (raw or shipped, meshopt), pose its skeleton at a clip time or from local rotations, and skin
// its meshes. Conventions as tools/char_props.mjs: joint matrices are column-major 4x4 in Armature space (the Meshy
// GLBs are in cm under a 0.01-scaled Armature); skinned vertices are posed as sum_j w_j . W_j(t) . IBM_j . v, which is
// in Armature cm; everything this library returns to callers is in metres, Armature axes (+Y up, +Z the character's
// forward at rest, +X its left).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
export const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

// ---------------------------------------------------------------- column-major mat4, vec3, quat
export const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
export function mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
export function compose(t, q, s = [1, 1, 1]) {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1];
}
export function invert(m) {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  return [(a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
    (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
    (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
    (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d];
}
export const xf = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
export const xd = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => scl(a, 1 / (len(a) || 1));
export const lerp3 = (a, b, f) => add(a, scl(sub(b, a), f));
export const dist = (a, b) => len(sub(a, b));
export const posOf = (m) => [m[12], m[13], m[14]];
export const axisOf = (m, i) => norm([m[i * 4], m[i * 4 + 1], m[i * 4 + 2]]);
export const frameOf = (x, y, z, o) => [...x, 0, ...y, 0, ...z, 0, ...o, 1];
export const scaleM = (s) => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1];
export const transM = (t) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
// rotation matrices (no translation)
export const rot3 = (m) => [m[0], m[1], m[2], 0, m[4], m[5], m[6], 0, m[8], m[9], m[10], 0, 0, 0, 0, 1];
export function rotAxis(axis, rad) {
  const [x, y, z] = norm(axis), s = Math.sin(rad / 2);
  return compose([0, 0, 0], [x * s, y * s, z * s, Math.cos(rad / 2)]);
}
// the smallest rotation taking unit vector a to unit vector b
export function rotBetween(a, b) {
  a = norm(a); b = norm(b);
  const c = dot(a, b);
  if (c > 1 - 1e-9) return I4();
  if (c < -1 + 1e-9) { const p = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; return rotAxis(norm(cross(a, p)), Math.PI); }
  return rotAxis(cross(a, b), Math.acos(c));
}
// quaternion of a pure rotation matrix
export function quatOf(m) {
  const [m00, m10, m20, , m01, m11, m21, , m02, m12, m22] = m;
  const tr = m00 + m11 + m22;
  let x, y, z, w;
  if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); w = 0.25 / s; x = (m21 - m12) * s; y = (m02 - m20) * s; z = (m10 - m01) * s; }
  else if (m00 > m11 && m00 > m22) { const s = 2 * Math.sqrt(1 + m00 - m11 - m22); w = (m21 - m12) / s; x = 0.25 * s; y = (m01 + m10) / s; z = (m02 + m20) / s; }
  else if (m11 > m22) { const s = 2 * Math.sqrt(1 + m11 - m00 - m22); w = (m02 - m20) / s; x = (m01 + m10) / s; y = 0.25 * s; z = (m12 + m21) / s; }
  else { const s = 2 * Math.sqrt(1 + m22 - m00 - m11); w = (m10 - m01) / s; x = (m02 + m20) / s; y = (m12 + m21) / s; z = 0.25 * s; }
  const n = Math.hypot(x, y, z, w);
  return [x / n, y / n, z / n, w / n];
}
function slerp(a, b, f) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) { b = b.map((x) => -x); d = -d; }
  if (d > 0.9995) { const o = a.map((x, i) => x + (b[i] - x) * f); const n = Math.hypot(...o); return o.map((x) => x / n); }
  const th = Math.acos(d), s = Math.sin(th);
  return a.map((x, i) => (Math.sin((1 - f) * th) * x + Math.sin(f * th) * b[i]) / s);
}
// an accessor's values as floats (normalised integers denormalised: a shipped GLB's quantised rotations), cached
const floatCache = new WeakMap();
function floatsOf(acc) {
  if (!acc.getNormalized()) return acc.getArray();
  let f = floatCache.get(acc);
  if (!f) {
    f = new Float64Array(acc.getCount() * acc.getElementSize());
    const el = [];
    for (let i = 0; i < acc.getCount(); i++) { acc.getElement(i, el); f.set(el, i * el.length); }
    floatCache.set(acc, f);
  }
  return f;
}
function sampleCh(sampler, t) {
  const inp = floatsOf(sampler.getInput()), out = floatsOf(sampler.getOutput());
  const n = inp.length, k = out.length / n;
  const get = (i) => Array.from(out.slice(i * k, i * k + k));
  if (t <= inp[0]) return get(0);
  if (t >= inp[n - 1]) return get(n - 1);
  let i = 0;
  while (inp[i + 1] < t) i++;
  const f = (t - inp[i]) / (inp[i + 1] - inp[i]);
  const a = get(i), b = get(i + 1);
  if (sampler.getInterpolation() === 'STEP') return a;
  return k === 4 ? slerp(a, b, f) : a.map((x, j) => x + (b[j] - x) * f);
}

// ---------------------------------------------------------------- a rigged character
// rig.names[i], rig.parent[i] (index or -1), rig.rest[i] = {t, r, s} local; rig.IBM[i]; rig.meshes[name] = skinned
// geometry (bind space: metres) with pos, nrm, uv, J, W (4 per vertex), idx, image/mime of its base colour texture.
export async function loadRig(file) {
  const doc = await io.read(file);
  const root = doc.getRoot();
  const scene = root.listScenes()[0];
  // the Armature: the node whose children include the skeleton root (raw GLBs also hold the meshes under it)
  const skin = root.listSkins()[0];
  const joints = skin.listJoints();
  const jointSet = new Set(joints);
  let armature = null;
  for (const n of root.listNodes()) if (n.listChildren().some((c) => jointSet.has(c)) && !jointSet.has(n)) armature = n;
  const names = joints.map((j) => j.getName());
  const parent = joints.map((j) => { const p = j.getParentNode(); return jointSet.has(p) ? joints.indexOf(p) : -1; });
  const rest = joints.map((j) => ({ t: j.getTranslation(), r: j.getRotation(), s: j.getScale() }));
  const ibm = skin.getInverseBindMatrices().getArray();
  const IBM = joints.map((_, i) => Array.from(ibm.slice(i * 16, i * 16 + 16)));
  const meshes = {};
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh || !node.getSkin()) continue;
    const prim = mesh.listPrimitives()[0];
    // attribute values as floats (a shipped GLB is quantised: normalised integers, denormalised by getElement)
    const a = (k) => {
      const acc = prim.getAttribute(k);
      if (!acc) return null;
      if (!acc.getNormalized() || k === 'JOINTS_0') return acc.getArray();
      const out = new Float64Array(acc.getCount() * acc.getElementSize()), el = [];
      for (let i = 0; i < acc.getCount(); i++) { acc.getElement(i, el); out.set(el, i * el.length); }
      return out;
    };
    const n = a('POSITION').length / 3;
    const tex = prim.getMaterial()?.getBaseColorTexture();
    meshes[node.getName()] = {
      pos: Float64Array.from(a('POSITION')), nrm: a('NORMAL') ? Float64Array.from(a('NORMAL')) : null,
      uv: a('TEXCOORD_0') ? Float32Array.from(a('TEXCOORD_0')) : null,
      J: Uint16Array.from(a('JOINTS_0')), W: Float32Array.from(a('WEIGHTS_0')),
      idx: prim.getIndices() ? Uint32Array.from(prim.getIndices().getArray()) : Uint32Array.from({ length: n }, (_, i) => i),
      material: prim.getMaterial()?.getName(), image: tex?.getImage() || null, mime: tex?.getMimeType() || null, n,
    };
    // its own skin (a shipped GLB gives each quantised mesh a copy of the skin, its IBMs carrying the dequantisation)
    const sk = node.getSkin(), sib = sk.getInverseBindMatrices().getArray();
    const m = meshes[node.getName()];
    m.jmap = sk.listJoints().map((j) => joints.indexOf(j));
    m.IBM = sk.listJoints().map((_, i) => Array.from(sib.slice(i * 16, i * 16 + 16)));
  }
  // normalise WEIGHTS_0 (quantised GLBs store them normalised to bytes)
  for (const m of Object.values(meshes)) for (let i = 0; i < m.n; i++) {
    const s = m.W[i * 4] + m.W[i * 4 + 1] + m.W[i * 4 + 2] + m.W[i * 4 + 3];
    if (s > 0) for (let c = 0; c < 4; c++) m.W[i * 4 + c] /= s;
  }
  const clips = Object.fromEntries(root.listAnimations().map((an) => [an.getName(), Math.max(...an.listSamplers().map((s) => s.getInput().getMax([])[0]))]));
  const body = Object.keys(meshes).find((k) => !/^(prop|tack)_/.test(k));
  return { file, doc, root, armature, skin, joints, names, parent, rest, IBM, meshes, body, clips, index: (n) => names.indexOf(n) };
}

// local TRS of every joint at time t of a clip (null: the rest pose)
export function localsAt(rig, clip, t) {
  const over = new Map();
  if (clip) {
    const an = rig.root.listAnimations().find((a) => a.getName() === clip);
    if (!an) throw new Error(`${rig.file}: no clip ${clip}`);
    for (const ch of an.listChannels()) {
      const n = ch.getTargetNode();
      if (!over.has(n)) over.set(n, {});
      over.get(n)[ch.getTargetPath()] = sampleCh(ch.getSampler(), t);
    }
  }
  return rig.joints.map((j, i) => {
    const o = over.get(j) || {};
    return { t: o.translation || rig.rest[i].t, r: o.rotation || rig.rest[i].r, s: o.scale || rig.rest[i].s };
  });
}
// two poses mixed as three.js's AnimationMixer cross-fades them: weight f on b (quaternions slerped, the rest lerped)
export function mixLocals(a, b, f) {
  return a.map((x, i) => ({ t: x.t.map((v, k) => v + (b[i].t[k] - v) * f), r: slerp(x.r, b[i].r, f), s: x.s.map((v, k) => v + (b[i].s[k] - v) * f) }));
}
// world (Armature space, cm) matrices of every joint at time t of a clip (null: the rest pose)
export function poseClip(rig, clip, t) {
  const over = new Map();
  if (clip) {
    const an = rig.root.listAnimations().find((a) => a.getName() === clip);
    if (!an) throw new Error(`${rig.file}: no clip ${clip}`);
    for (const ch of an.listChannels()) {
      const n = ch.getTargetNode();
      if (!over.has(n)) over.set(n, {});
      over.get(n)[ch.getTargetPath()] = sampleCh(ch.getSampler(), t);
    }
  }
  const locals = rig.joints.map((j, i) => {
    const o = over.get(j) || {};
    return { t: o.translation || rig.rest[i].t, r: o.rotation || rig.rest[i].r, s: o.scale || rig.rest[i].s };
  });
  return poseLocals(rig, locals);
}
// world matrices from local TRS per joint (the skeleton root's parent is the Armature: identity in Armature space)
export function poseLocals(rig, locals) {
  const W = new Array(rig.names.length);
  const done = new Array(rig.names.length).fill(false);
  const get = (i) => {
    if (done[i]) return W[i];
    const L = compose(locals[i].t, locals[i].r, locals[i].s || [1, 1, 1]);
    W[i] = rig.parent[i] < 0 ? L : mul(get(rig.parent[i]), L);
    done[i] = true;
    return W[i];
  };
  for (let i = 0; i < W.length; i++) get(i);
  return W;
}
// skinning matrices (Armature cm <- bind space) per joint of a mesh's own skin, and the posed positions in metres
export function skinMats(rig, mesh, W) { return mesh.jmap.map((j, i) => mul(W[j], mesh.IBM[i])); }
export function skinMesh(rig, mesh, W, out = null) {
  const S = skinMats(rig, mesh, W);
  const P = out || new Float64Array(mesh.n * 3);
  for (let i = 0; i < mesh.n; i++) {
    let x = 0, y = 0, z = 0;
    const vx = mesh.pos[i * 3], vy = mesh.pos[i * 3 + 1], vz = mesh.pos[i * 3 + 2];
    for (let c = 0; c < 4; c++) {
      const w = mesh.W[i * 4 + c];
      if (!w) continue;
      const m = S[mesh.J[i * 4 + c]];
      x += w * (m[0] * vx + m[4] * vy + m[8] * vz + m[12]);
      y += w * (m[1] * vx + m[5] * vy + m[9] * vz + m[13]);
      z += w * (m[2] * vx + m[6] * vy + m[10] * vz + m[14]);
    }
    P[i * 3] = x * 0.01; P[i * 3 + 1] = y * 0.01; P[i * 3 + 2] = z * 0.01;
  }
  return P;
}
// a joint's world matrix with its translation in metres (rotation unchanged)
export const inMetres = (m) => { const o = m.slice(); o[12] *= 0.01; o[13] *= 0.01; o[14] *= 0.01; return o; };
// the dominant joint of each vertex (rig joint index)
export function dominant(mesh) {
  const d = new Int16Array(mesh.n);
  for (let i = 0; i < mesh.n; i++) {
    let b = 0;
    for (let c = 1; c < 4; c++) if (mesh.W[i * 4 + c] > mesh.W[i * 4 + b]) b = c;
    d[i] = mesh.jmap[mesh.J[i * 4 + b]];
  }
  return d;
}

// ---------------------------------------------------------------- geometry queries
// closest point on triangle abc to p (Ericson), returns [point, u, v, w] barycentrics
export function closestOnTri(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return [a, 1, 0, 0];
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return [b, 0, 1, 0];
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [add(a, scl(ab, v)), 1 - v, v, 0]; }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return [c, 0, 0, 1];
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [add(a, scl(ac, w)), 1 - w, 0, w]; }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return [add(b, scl(sub(c, b), w)), 0, 1 - w, w]; }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return [add(a, add(scl(ab, v), scl(ac, w))), 1 - v - w, v, w];
}

// a triangle soup with a uniform grid: closest point within a radius, and inside/outside by ray parity
// (integer cell keys, flat arrays, no allocation in the inner loops)
const KEY = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
export class TriGrid {
  constructor(P, idx, tris = null, cell = 0.04) {
    this.P = P; this.idx = idx; this.cell = cell;
    this.tris = tris || Uint32Array.from({ length: idx.length / 3 }, (_, i) => i);
    this.map = new Map();
    this.cols = new Map();
    const inv = 1 / cell;
    for (const t of this.tris) {
      const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
      const lo = [0, 1, 2].map((k) => Math.floor(Math.min(P[a + k], P[b + k], P[c + k]) * inv));
      const hi = [0, 1, 2].map((k) => Math.floor(Math.max(P[a + k], P[b + k], P[c + k]) * inv));
      for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
        const k = KEY(x, y, z);
        let l = this.map.get(k);
        if (!l) this.map.set(k, (l = []));
        l.push(t);
      }
      for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
        const k = KEY(0, y, z);
        let l = this.cols.get(k);
        if (!l) this.cols.set(k, (l = []));
        l.push(t);
      }
    }
    this.stamp = new Uint32Array(idx.length / 3);
    this.gen = 0;
  }
  vert(i) { return [this.P[i * 3], this.P[i * 3 + 1], this.P[i * 3 + 2]]; }
  // closest point on the soup within r of p: {d, point, tri, bary} or null; cells searched in rings outward, stopping
  // once the best distance is inside the rings already searched
  closest(p, r = 0.1) {
    const c = this.cell, inv = 1 / c;
    const cx = Math.floor(p[0] * inv), cy = Math.floor(p[1] * inv), cz = Math.floor(p[2] * inv);
    const K = Math.ceil(r * inv) + 1;
    let best = null, bd = r;
    const gen = ++this.gen;
    for (let k = 0; k <= K; k++) {
      for (let x = cx - k; x <= cx + k; x++) for (let y = cy - k; y <= cy + k; y++) for (let z = cz - k; z <= cz + k; z++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy), Math.abs(z - cz)) !== k) continue;
        const l = this.map.get(KEY(x, y, z));
        if (!l) continue;
        for (const t of l) {
          if (this.stamp[t] === gen) continue;
          this.stamp[t] = gen;
          const [q, u, v, w] = closestOnTri(p, this.vert(this.idx[t * 3]), this.vert(this.idx[t * 3 + 1]), this.vert(this.idx[t * 3 + 2]));
          const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
          if (d <= bd) { bd = d; best = { d, point: q, tri: t, bary: [u, v, w] }; }
        }
      }
      // every point within k cells (Chebyshev) of p's cell is searched: anything nearer than k * cell is found
      if (best && best.d <= k * c) break;
    }
    return best;
  }
  // ray parity along +X and -X (a vote of two; a closed body mesh gives the same answer both ways)
  inside(p) {
    const inv = 1 / this.cell;
    const l = this.cols.get(KEY(0, Math.floor(p[1] * inv), Math.floor(p[2] * inv)));
    if (!l) return false;
    const P = this.P, idx = this.idx, py = p[1], pz = p[2];
    let pos = 0, neg = 0;
    for (const t of l) {
      const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
      const ay = P[a + 1], az = P[a + 2], by = P[b + 1], bz = P[b + 2], cy = P[c + 1], cz = P[c + 2];
      const d = (by - ay) * (cz - az) - (cy - ay) * (bz - az);
      if (Math.abs(d) < 1e-14) continue;
      const u = ((py - ay) * (cz - az) - (cy - ay) * (pz - az)) / d;
      if (u < 0 || u > 1) continue;
      const v = ((by - ay) * (pz - az) - (py - ay) * (bz - az)) / d;
      if (v < 0 || u + v > 1) continue;
      const x = P[a] + u * (P[b] - P[a]) + v * (P[c] - P[a]);
      if (x > p[0]) pos++; else neg++;
    }
    return (pos % 2 === 1) && (neg % 2 === 1);
  }
}

// ---------------------------------------------------------------- a carrier posed at a time, its surface sites
// C: the rig, joint matrices (W cm, Wm metres), the skinned body P (metres), each vertex's dominant joint, the body
// frame at that time (fwd: the Hips' facing on the ground, up, left) and a TriGrid for queries
export function carrierPose(rig, clip, t) {
  const W = poseClip(rig, clip, t);
  const Wm = W.map(inMetres);
  const body = rig.meshes[rig.body];
  const P = skinMesh(rig, body, W);
  const J = (n) => posOf(Wm[rig.index(n)]);
  const fwdRaw = xd(Wm[rig.index('Hips')], [0, 0, 1]);
  const fwd = norm([fwdRaw[0], 0, fwdRaw[2]]), up = [0, 1, 0], left = norm(cross(up, fwd));
  return { rig, clip, t, W, Wm, body, P, dom: rig._dom || (rig._dom = dominant(body)), J, fwd, up, left, grid: new TriGrid(P, body.idx) };
}
export async function carrierAt(file, clip, t) { return carrierPose(await loadRig(file), clip, t); }
export const bodyPoint = (C, joint, off = [0, 0, 0]) => add(C.J(joint), add(scl(C.left, off[0]), add(scl(C.up, off[1]), scl(C.fwd, off[2]))));
// barycentric closest point on a triangle: {p, bary}
export function closestTri(p, a, b, c) {
  const [q, u, v, w] = closestOnTri(p, a, b, c);
  return { p: q, bary: [u, v, w] };
}
const vtx = (P, i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
// a carrier surface site: the point nearest to `near` on the triangles with at least two corners dominated by
// `bones` (all triangles if none): {p, n (face normal, outward for an outward-wound mesh), tri, bary}
export function snapSite(C, near, bones = null) {
  const set = bones ? new Set(bones.map((b) => C.rig.index(b))) : null;
  const idx = C.body.idx;
  let best = null;
  for (let t = 0; t < idx.length / 3; t++) {
    const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
    if (set && [a, b, c].filter((k) => set.has(C.dom[k])).length < 2) continue;
    const pa = vtx(C.P, a), pb = vtx(C.P, b), pc = vtx(C.P, c);
    const q = closestTri(near, pa, pb, pc);
    const d = dist(near, q.p);
    if (!best || d < best.d) best = { d, p: q.p, tri: t, bary: q.bary, n: norm(cross(sub(pb, pa), sub(pc, pa))) };
  }
  return best;
}
// the same surface point on the carrier posed at another time (its triangle and barycentrics)
export function siteAt(C, s) {
  const i = C.body.idx, t = s.tri;
  const a = vtx(C.P, i[t * 3]), b = vtx(C.P, i[t * 3 + 1]), c = vtx(C.P, i[t * 3 + 2]);
  return { p: add(scl(a, s.bary[0]), add(scl(b, s.bary[1]), scl(c, s.bary[2]))), n: norm(cross(sub(b, a), sub(c, a))) };
}
// the spec's sites (gen/props/carry.json), snapped on the carrier as posed in C
export function sitesOf(C, sites) {
  const out = {};
  for (const [name, s] of Object.entries(sites)) {
    const o = s.off || [0, 0, 0];
    let near;
    if (s.axes) { const F = C.Wm[C.rig.index(s.axes)]; near = add(C.J(s.joint), add(scl(axisOf(F, 0), o[0]), add(scl(axisOf(F, 1), o[1]), scl(axisOf(F, 2), o[2])))); }
    else near = bodyPoint(C, s.joint, o);
    out[name] = { ...snapSite(C, near, s.bones || null), near };
  }
  return out;
}

// ---------------------------------------------------------------- measures (metres)
// distance from a point to a set of triangles of a posed mesh (P, idx), with the closest point
export function gapTo(p, P, idx, tris) {
  let best = { d: Infinity, q: null };
  for (const t of tris) {
    const q = closestTri(p, vtx(P, idx[t * 3]), vtx(P, idx[t * 3 + 1]), vtx(P, idx[t * 3 + 2]));
    const d = dist(p, q.p);
    if (d < best.d) best = { d, q: q.p };
  }
  return best;
}
// child vertices inside the carrier's body (ray parity both ways) and how deep: {max, n, at}
export function penetration(C, P, verts = null) {
  const out = { max: 0, n: 0, at: -1 };
  const n = P.length / 3;
  for (let k = 0; k < (verts ? verts.length : n); k++) {
    const i = verts ? verts[k] : k;
    const p = vtx(P, i);
    if (!C.grid.inside(p)) continue;
    const q = C.grid.closest(p, 0.12);
    const d = q ? q.d : 0.12;
    out.n++;
    if (d > out.max) { out.max = d; out.at = i; }
  }
  return out;
}
// the farthest of some child vertices from the carrier's surface (a contact patch that must lie on him)
export function floating(C, P, verts, r = 0.06) {
  let worst = 0;
  for (const i of verts) { const q = C.grid.closest(vtx(P, i), r); worst = Math.max(worst, q ? q.d : r); }
  return worst;
}
// the triangles of a part: at least two corners whose label (dominant child joint) is in `labels`
export function partTris(idx, label, labels) {
  const set = new Set(labels), tris = [];
  for (let t = 0; t < idx.length / 3; t++) if ([0, 1, 2].filter((c) => set.has(label[idx[t * 3 + c]])).length >= 2) tris.push(t);
  return tris;
}
// apply a 4x4 (metres) to every vertex
export function xfAll(M, P) {
  const o = new Float64Array(P.length);
  for (let i = 0; i < P.length; i += 3) { const v = xf(M, [P[i], P[i + 1], P[i + 2]]); o[i] = v[0]; o[i + 1] = v[1]; o[i + 2] = v[2]; }
  return o;
}
