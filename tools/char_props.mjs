#!/usr/bin/env node
// Carried props: add a character's optional prop_<name> parts to its merged GLB, skinned rigidly to one bone of the
// body's own skin, posed where the clip that holds them puts them.
//
//   node tools/char_props.mjs <in.glb> <out.glb> <character>      (props from characters/props.json)
//   node tools/char_props.mjs <in.glb> --probe <clip> <t>          (prints joint positions at time t, Armature space)
//
// characters/props.json: { "<character>": { "<prop>": { "geom": "<gen/props/ file stem>", "clip": "<clip>", "t": <s>,
//   "bone": "<joint>", "at": <placement>, ... } } } (see gen/expand/workshop_props_notes.md for the placements).
// Each prop's geometry is gen/props/<geom>.glb (blender/char_props.py), in metres, in a canonical frame: +Z the
// character's forward, +Y up, +X the character's left, the grip or contact point at the origin.
// The tool samples the clip's channels at time t, composes every node's matrix in Armature space (the Meshy GLBs are
// in cm under a 0.01-scaled Armature), puts the prop where it belongs at that frame, and maps each vertex to bind
// space: v_bind = IBM_j^-1 . W_j(t)^-1 . v_posed. The new node prop_<name> is a sibling of the body mesh under the
// Armature with an identity transform and the body's skin, so three.js binds it with the body's bind matrix and
// web/src/crowd.js shares the body's bake.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);

// ---------------------------------------------------------------- tiny column-major mat4 / quat helpers
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + rr] * b[c * 4 + k];
    o[c * 4 + rr] = s;
  }
  return o;
}
function compose(t, q, s) {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1];
}
function invert(m) {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  const d = 1 / det;
  return [(a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
    (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
    (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
    (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d];
}
const xf = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
const xd = (m, v) => [m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => scl(a, 1 / (len(a) || 1));
const lerp3 = (a, b, f) => add(a, scl(sub(b, a), f));
function slerp(a, b, f) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) { b = b.map((x) => -x); d = -d; }
  if (d > 0.9995) { const o = a.map((x, i) => x + (b[i] - x) * f); const n = Math.hypot(...o); return o.map((x) => x / n); }
  const th = Math.acos(d), s = Math.sin(th);
  return a.map((x, i) => (Math.sin((1 - f) * th) * x + Math.sin(f * th) * b[i]) / s);
}
// a frame from its axes (columns) and origin
const frameOf = (x, y, z, o) => [...x, 0, ...y, 0, ...z, 0, ...o, 1];
const rotAxis = (axis, deg) => {
  const a = (deg * Math.PI) / 180, [x, y, z] = norm(axis), s = Math.sin(a / 2);
  return compose([0, 0, 0], [x * s, y * s, z * s, Math.cos(a / 2)], [1, 1, 1]);
};

// ---------------------------------------------------------------- posing the skeleton at time t of a clip
function sample(sampler, t) {
  const inp = sampler.getInput().getArray(), out = sampler.getOutput().getArray();
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

// Armature-space matrices of every node under the Armature, at time t of `clip` (null: the bind/rest pose)
function pose(doc, armature, clip, t) {
  const over = new Map();
  if (clip) {
    const anim = doc.getRoot().listAnimations().find((a) => a.getName() === clip);
    if (!anim) throw new Error(`no clip ${clip}`);
    for (const ch of anim.listChannels()) {
      const n = ch.getTargetNode();
      if (!over.has(n)) over.set(n, {});
      over.get(n)[ch.getTargetPath()] = sample(ch.getSampler(), t);
    }
  }
  const W = new Map();
  const walk = (node, parent) => {
    const o = over.get(node) || {};
    const m = mul(parent, compose(o.translation || node.getTranslation(), o.rotation || node.getRotation(), o.scale || node.getScale()));
    W.set(node, m);
    node.listChildren().forEach((c) => walk(c, m));
  };
  armature.listChildren().forEach((c) => walk(c, I4()));
  return W;
}

// ---------------------------------------------------------------- placements: where a prop's frame goes, at time t
// Every placement returns a 4x4 (Armature space, cm) taking the prop's canonical frame (metres) to its posed place.
// The character's forward at time t is the Hips' facing projected on the ground (glTF/Armature +Z at rest).
function placement(spec, P, cm) {
  const pos = (n) => P[n].slice(12, 15);
  const axis = (n, i) => norm(P[n].slice(i * 4, i * 4 + 3));
  const up = [0, 1, 0];
  const fwdRaw = xd(P.Hips, [0, 0, 1]);
  let fwd = norm([fwdRaw[0], 0, fwdRaw[2]]);
  if (spec.yaw) fwd = xd(rotAxis(up, spec.yaw), fwd);
  const left = norm(cross(up, fwd));
  const S = scl([1, 1, 1], cm * (spec.scale || 1));   // metres -> Armature units (and a child-sized prop)
  const off = spec.offset || [0, 0, 0];   // metres in the placement's own frame (x left, y up, z forward)
  let F;
  switch (spec.at) {
    case 'shoulder': {
      // the pole rests on top of the shoulder between the neck and the shoulder joint, along the facing, level
      const side = spec.side === 'left' ? 'Left' : 'Right';
      const neck = pos('neck'), arm = pos(`${side}Arm`);
      const o = add(lerp3(neck, arm, spec.along ?? 0.55), [0, (spec.lift ?? 0.09) * cm, 0]);
      let f = fwd;
      if (spec.pitch) f = xd(rotAxis(left, -spec.pitch), f);
      const u = norm(cross(f, left));
      F = frameOf(left, u, f, o);
      break;
    }
    case 'back': {
      // against the upper back: the spine bone's own up, the facing's back
      const b = spec.bone_ref || 'Spine';
      const o = pos(b);
      // the load's up: between the spine bone's axis and the vertical (a frame rides more upright than a bent back)
      const u = norm(lerp3([0, 1, 0], axis(b, 1), spec.follow ?? 0.5));
      const f = norm(sub(fwd, scl(u, dot(fwd, u))));
      const l = norm(cross(u, f));
      F = frameOf(l, u, f, o);
      break;
    }
    case 'hand': {
      // in the hand: the hand bone's frame (y along the bone toward the fingers), turned by `rot` [x, y, z] degrees
      const side = spec.side === 'left' ? 'Left' : 'Right';
      F = P[`${side}Hand`].slice();
      // strip the bone's scale (Meshy bones carry none, but be safe)
      const ax = [0, 1, 2].map((i) => norm(F.slice(i * 4, i * 4 + 3)));
      F = frameOf(ax[0], ax[1], ax[2], pos(`${side}Hand`));
      // the grip: the fist's centre in the hand's frame (metres; y along the fingers, z toward the thumb, x the back
      // of the hand), then the prop turned by `rot` (degrees about the hand's x, y, z, applied in that order)
      F = mul(F, compose(scl(spec.grip || [0, 0.08, 0], cm), [0, 0, 0, 1], [1, 1, 1]));
      for (const [i, deg] of (spec.rot || []).entries()) if (deg) F = mul(F, rotAxis([[1, 0, 0], [0, 1, 0], [0, 0, 1]][i], deg));
      break;
    }
    case 'hand_world': {
      // at the fist (the hand bone plus `grip` metres along the fingers), oriented by the body: left, up, forward;
      // pitch > 0 tips the prop's up backward (a rod held up and forward: pitch < 0), yaw turns the facing
      const side = spec.side === 'left' ? 'Left' : 'Right';
      let f = fwd;
      if (spec.pitch) f = xd(rotAxis(left, -spec.pitch), f);
      const u = norm(cross(f, left));
      const fist = add(pos(`${side}Hand`), scl(axis(`${side}Hand`, 1), (spec.grip_y ?? 0.08) * cm));
      F = frameOf(left, u, f, fist);
      break;
    }
    case 'hands': {
      // between both fists (each hand bone plus `grip_y` metres along the fingers), oriented by the body: a tray or a
      // frame held out with both hands; pitch tips it as in hand_world
      let f = fwd;
      if (spec.pitch) f = xd(rotAxis(left, -spec.pitch), f);
      const u = norm(cross(f, left));
      const fist = (s) => add(pos(`${s}Hand`), scl(axis(`${s}Hand`, 1), (spec.grip_y ?? 0.08) * cm));
      F = frameOf(left, u, f, lerp3(fist('Left'), fist('Right'), 0.5));
      break;
    }
    case 'head': {
      // on the crown: the Head joint plus `lift` metres up the head's own axis, the load's up between the head's axis
      // and the vertical (follow), facing the body's way
      const hy = axis('Head', 1);
      const o = add(pos('Head'), scl(hy, (spec.lift ?? 0.19) * cm));
      const u = norm(lerp3([0, 1, 0], hy, spec.follow ?? 0.5));
      const f = norm(sub(fwd, scl(u, dot(fwd, u))));
      F = frameOf(norm(cross(u, f)), u, f, o);
      break;
    }
    default: throw new Error(`unknown placement ${spec.at}`);
  }
  return mul(mul(F, compose(scl(off, cm), [0, 0, 0, 1], [1, 1, 1])), compose([0, 0, 0], [0, 0, 0, 1], S));
}

// ---------------------------------------------------------------- reading a prop's geometry (gen/props/<geom>.glb)
async function readProp(io, file) {
  const doc = await io.read(file);
  const out = { pos: [], nrm: [], uv: [], idx: [], image: null, mime: null };
  const walk = (node, parent) => {
    const m = mul(parent, node.getMatrix());
    const mesh = node.getMesh();
    if (mesh) for (const prim of mesh.listPrimitives()) {
      const base = out.pos.length / 3;
      const P = prim.getAttribute('POSITION').getArray(), N = prim.getAttribute('NORMAL')?.getArray(), T = prim.getAttribute('TEXCOORD_0')?.getArray();
      for (let i = 0; i < P.length / 3; i++) {
        out.pos.push(...xf(m, [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]));
        out.nrm.push(...(N ? norm(xd(m, [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]])) : [0, 1, 0]));
        out.uv.push(T ? T[i * 2] : 0.5, T ? T[i * 2 + 1] : 0.5);
      }
      const ix = prim.getIndices()?.getArray() || Array.from({ length: P.length / 3 }, (_, i) => i);
      for (const i of ix) out.idx.push(base + i);
      const tex = prim.getMaterial()?.getBaseColorTexture();
      if (tex && !out.image) { out.image = tex.getImage(); out.mime = tex.getMimeType(); }
    }
    node.listChildren().forEach((c) => walk(c, m));
  };
  doc.getRoot().listScenes()[0].listChildren().forEach((n) => walk(n, I4()));
  return out;
}

// ---------------------------------------------------------------- main
const args = process.argv.slice(2);
const io = new NodeIO();
const [inFile, outFile, character] = args;
const doc = await io.read(inFile);
const root = doc.getRoot();
const armature = root.listScenes()[0].listChildren().find((n) => n.listChildren().some((c) => c.getSkin()));
const body = armature.listChildren().find((c) => c.getSkin() && c.getMesh());
const skin = body.getSkin();
const joints = skin.listJoints();
const ibm = skin.getInverseBindMatrices().getArray();
const IBM = (j) => Array.from(ibm.slice(j * 16, j * 16 + 16));
const posedByName = (W) => Object.fromEntries(joints.map((j) => [j.getName(), W.get(j)]));

if (outFile === '--probe') {
  const [clip, t] = [args[2], +args[3]];
  const rest = posedByName(pose(doc, armature, null, 0));
  const P = posedByName(pose(doc, armature, clip === 'rest' ? null : clip, t));
  // check the bind convention: rest joint matrix x IBM should be the identity
  const chk = mul(rest.Hips, IBM(joints.findIndex((j) => j.getName() === 'Hips')));
  console.log('rest Hips x IBM =', chk.map((x) => +x.toFixed(3)).join(' '));
  for (const n of ['Hips', 'Spine', 'neck', 'Head', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'LeftArm', 'LeftHand', 'LeftFoot', 'RightFoot'])
    console.log(n.padEnd(14), P[n].slice(12, 15).map((x) => x.toFixed(1)).join(' '), ' x', norm(P[n].slice(0, 3)).map((x) => x.toFixed(2)).join(' '), ' y', norm(P[n].slice(4, 7)).map((x) => x.toFixed(2)).join(' '), ' z', norm(P[n].slice(8, 11)).map((x) => x.toFixed(2)).join(' '));
  process.exit(0);
}

// idempotent: the raw GLB may already hold props from an earlier run; drop them (and their palette) first
for (const node of armature.listChildren().filter((c) => /^prop_/.test(c.getName()))) {
  const mesh = node.getMesh();
  node.dispose();
  if (mesh) { mesh.listPrimitives().forEach((p) => p.listAttributes().concat([p.getIndices()]).forEach((a) => a && a.dispose())); mesh.dispose(); }
}
for (const m of root.listMaterials().filter((m) => m.getName() === 'prop_palette')) { m.getBaseColorTexture()?.dispose(); m.dispose(); }

const all = JSON.parse(fs.readFileSync(r('characters/props.json'), 'utf8'));
const defaults = all._defaults || {};
const specs = all[character] || {};
let material = null;
for (const [name, own] of Object.entries(specs)) {
  const spec = { ...(defaults[own.geom || name] || {}), ...own };
  if (!root.listAnimations().some((a) => a.getName() === spec.clip)) {
    console.log(`${character}: prop_${name} skipped: no clip ${spec.clip} in this GLB yet`);
    continue;
  }
  const geom = await readProp(io, r(`gen/props/${spec.geom || name}.glb`));
  if (!material) {
    const tex = doc.createTexture('prop_palette').setImage(geom.image).setMimeType(geom.mime || 'image/png');
    material = doc.createMaterial('prop_palette').setBaseColorTexture(tex).setRoughnessFactor(1).setMetallicFactor(0).setDoubleSided(true);
    material.getBaseColorTextureInfo().setMagFilter(9729).setMinFilter(9987);
  }
  const W = pose(doc, armature, spec.clip, spec.t || 0);
  const P = posedByName(W);
  const cm = 1 / armature.getScale()[0];   // prop metres -> Armature units
  const place = placement(spec, P, cm);
  const ji = joints.findIndex((j) => j.getName() === spec.bone);
  if (ji < 0) throw new Error(`${character}: no joint ${spec.bone}`);
  const toBind = mul(invert(IBM(ji)), invert(P[spec.bone]));   // v_bind = IBM^-1 . W(t)^-1 . v_posed
  const M = mul(toBind, place);
  const n = geom.pos.length / 3;
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uv = new Float32Array(geom.uv);
  for (let i = 0; i < n; i++) {
    pos.set(xf(M, geom.pos.slice(i * 3, i * 3 + 3)), i * 3);
    nrm.set(norm(xd(M, geom.nrm.slice(i * 3, i * 3 + 3))), i * 3);
  }
  const J = new Uint8Array(n * 4), Wt = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { J[i * 4] = ji; Wt[i * 4] = 1; }
  const buffer = root.listBuffers()[0];
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc('VEC3', pos)).setAttribute('NORMAL', acc('VEC3', nrm)).setAttribute('TEXCOORD_0', acc('VEC2', uv))
    .setAttribute('JOINTS_0', acc('VEC4', J)).setAttribute('WEIGHTS_0', acc('VEC4', Wt))
    .setIndices(acc('SCALAR', n > 65535 ? new Uint32Array(geom.idx) : new Uint16Array(geom.idx))).setMaterial(material);
  const mesh = doc.createMesh(`prop_${name}`).addPrimitive(prim);
  const node = doc.createNode(`prop_${name}`).setMesh(mesh).setSkin(skin);
  armature.addChild(node);
  console.log(`${character}: prop_${name} (${geom.idx.length / 3} tris) on ${spec.bone}, posed by ${spec.clip} at ${spec.t || 0} s`);
}
await io.write(outFile, doc);
console.log('wrote', outFile);
