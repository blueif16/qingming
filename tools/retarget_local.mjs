#!/usr/bin/env node
// Retarget one clip onto one of our Meshy-rigged characters, locally and free: no Meshy task, so it works across Meshy
// accounts (a Meshy retarget can only use a rig made in the same account).
//
//   node tools/retarget_local.mjs <target_rigged.glb> <source_anim.glb> <out.glb> [--clip name]
//
// The source is either another character's clip (Meshy's 24-bone humanoid, same bone names) or a Text to Motion
// result converted from its FBX (Meshy's SMPL-H skeleton, T-pose rest; tools/motion_fbx2glb.py), mapped by name.
// Per bone: the change of its world orientation from the source's rest, delta = W_src(t) * R_src^-1, is applied to the
// target's rest, W_tgt(t) = delta * C^-1... where C turns the source rest bone direction onto the target's (so an
// A-pose rig takes a T-pose rig's motion with the arms where they belong), then written back as local rotations. The
// hips' travel is scaled by the ratio of the two hip heights. Contacts between body parts (joined hands, a hand at
// the chin) shift a little with proportions: read the frame sheet. The output is the target rig with one animation,
// read by tools/build_character.mjs like a Meshy one.
import { NodeIO } from '@gltf-transform/core';

const args = process.argv.slice(2);
const ci = args.indexOf('--clip'), fi = args.indexOf('--fps'), ai = args.indexOf('--align');
const clipName = ci >= 0 ? args[ci + 1] : 'clip';
// --fps: output key rate (default 20; a clip copied from a video keeps the video's rate, e.g. 30, frame for frame)
const outFps = fi >= 0 ? Number(args[fi + 1]) : 20;
// --align limbs: match rest directions only on arms and legs (T-pose source onto an A-pose rig) and copy plain rotation
// changes on the spine, neck, head and feet. Needed for video-extracted SMPL motion (skill `motion-copy`): SMPL's head
// joint sits forward of the neck, so aligning that direction bows the head about 38 degrees at rest. Default `all`.
const alignMode = ai >= 0 ? args[ai + 1] : 'all';
const LIMBS = new Set(['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm',
  'RightHand', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']);
const [targetFile, sourceFile, outFile] = args.filter((a, i) => !a.startsWith('--') && !['--clip', '--fps', '--align'].includes(args[i - 1]));
if (!outFile) { console.log('usage: retarget_local.mjs <target_rigged.glb> <source_anim.glb> <out.glb> [--clip name] [--fps 20] [--align all|limbs]'); process.exit(1); }

// ---- math: quaternions [x, y, z, w], vectors [x, y, z], 4x4 matrices column-major (glTF)
const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qinv = (a) => [-a[0], -a[1], -a[2], a[3]];
const qnorm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
const qrot = (q, v) => { const p = qmul(qmul(q, [...v, 0]), qinv(q)); return [p[0], p[1], p[2]]; };
const vnorm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
function qbetween(a, b) { // shortest-arc rotation taking direction a onto b
  a = vnorm(a); b = vnorm(b);
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  if (d < -0.9999) { const ax = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; const c = vnorm([a[1] * ax[2] - a[2] * ax[1], a[2] * ax[0] - a[0] * ax[2], a[0] * ax[1] - a[1] * ax[0]]); return [...c, 0]; }
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return qnorm([...c, 1 + d]);
}
function slerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) { b = b.map((x) => -x); d = -d; }
  if (d > 0.9995) return qnorm(a.map((x, i) => x + (b[i] - x) * t));
  const th = Math.acos(d), s = Math.sin(th);
  return a.map((x, i) => (x * Math.sin((1 - t) * th) + b[i] * Math.sin(t * th)) / s);
}
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
function sampler(s, n) {
  const times = Array.from(s.getInput().getArray());
  const vals = s.getOutput().getArray();
  const cubic = s.getInterpolation() === 'CUBICSPLINE';
  const get = (i) => { const o = cubic ? (i * 3 + 1) * n : i * n; return Array.from(vals.slice(o, o + n)); };
  const t0 = times[0];
  return (t) => {
    t += t0; // clips that start late (Blender's frame 1) are read from their first key
    if (t <= times[0]) return get(0);
    if (t >= times[times.length - 1]) return get(times.length - 1);
    let i = 1;
    while (times[i] < t) i++;
    const u = (t - times[i - 1]) / (times[i] - times[i - 1]);
    if (s.getInterpolation() === 'STEP') return get(i - 1);
    return n === 4 ? slerp(get(i - 1), get(i), u) : lerp(get(i - 1), get(i), u);
  };
}

// Meshy humanoid names <- SMPL-H names (Text to Motion's skeleton)
const SMPL = { Pelvis: 'Hips', Spine1: 'Spine02', Spine2: 'Spine01', Spine3: 'Spine', Neck: 'neck', Head: 'Head',
  L_Collar: 'LeftShoulder', L_Shoulder: 'LeftArm', L_Elbow: 'LeftForeArm', L_Wrist: 'LeftHand',
  R_Collar: 'RightShoulder', R_Shoulder: 'RightArm', R_Elbow: 'RightForeArm', R_Wrist: 'RightHand',
  L_Hip: 'LeftUpLeg', L_Knee: 'LeftLeg', L_Ankle: 'LeftFoot', L_Foot: 'LeftToeBase',
  R_Hip: 'RightUpLeg', R_Knee: 'RightLeg', R_Ankle: 'RightFoot', R_Foot: 'RightToeBase' };
// the next bone down each chain (its head gives the bone's direction); leaves borrow their parent's alignment
const CHILD = { Hips: 'Spine02', Spine02: 'Spine01', Spine01: 'Spine', Spine: 'neck', neck: 'Head',
  LeftShoulder: 'LeftArm', LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand', RightShoulder: 'RightArm', RightArm: 'RightForeArm',
  RightForeArm: 'RightHand', LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', LeftFoot: 'LeftToeBase', RightUpLeg: 'RightLeg',
  RightLeg: 'RightFoot', RightFoot: 'RightToeBase' };

const io = new NodeIO();
const tgt = await io.read(targetFile);
const src = await io.read(sourceFile);

function rig(doc, rename) {
  const root = doc.getRoot();
  const joints = new Set(root.listSkins().flatMap((s) => s.listJoints()));
  const parent = new Map();
  for (const n of root.listNodes()) for (const c of n.listChildren()) parent.set(c, n);
  const chain = (n) => { const out = []; for (let p = n; p; p = parent.get(p)) out.unshift(p); return out; };
  // world rotation and position of a node at rest (or with local rotations from `rot`)
  // rot(m) / pos(m): animated local rotation / translation of node m, or null for its rest
  const world = (n, rot, pos) => {
    let q = [0, 0, 0, 1], p = [0, 0, 0], s = [1, 1, 1];
    for (const m of chain(n)) {
      const lt = (pos && pos(m)) || m.getTranslation(), lr = (rot && rot(m)) || m.getRotation(), ls = m.getScale();
      p = p.map((x, i) => x + qrot(q, lt.map((y, j) => y * s[j]))[i]);
      q = qnorm(qmul(q, lr));
      s = s.map((x, i) => x * ls[i]);
    }
    return { q, p, s };
  };
  const byName = new Map();
  for (const j of joints) {
    const name = rename ? rename[j.getName()] : j.getName();
    if (!name) continue;
    const w = world(j);
    byName.set(name, { node: j, parent: parent.get(j), rest: j.getRotation(), R: w.q, P: w.p, pos: j.getTranslation() });
  }
  const order = [...byName.keys()].sort((a, b) => chain(byName.get(a).node).length - chain(byName.get(b).node).length);
  return { root, byName, order, parent, world };
}
const T = rig(tgt);
const isSmpl = src.getRoot().listNodes().some((n) => n.getName() === 'Pelvis');
const S = rig(src, isSmpl ? SMPL : null);
const nameOfSrc = new Map([...S.byName].map(([name, b]) => [b.node, name]));

// rest alignment: C turns the source bone's rest direction onto the target's (identity when the rigs agree)
const C = new Map();
for (const name of T.order) {
  const ch = CHILD[name];
  if (alignMode === 'limbs' && !LIMBS.has(name)) { C.set(name, [0, 0, 0, 1]); continue; }
  if (ch && S.byName.has(name) && S.byName.has(ch) && T.byName.has(ch)) {
    const ds = S.byName.get(ch).P.map((x, i) => x - S.byName.get(name).P[i]);
    const dt = T.byName.get(ch).P.map((x, i) => x - T.byName.get(name).P[i]);
    C.set(name, qbetween(ds, dt));
  } else {
    const pn = T.byName.get(name).parent && [...T.byName].find(([, b]) => b.node === T.byName.get(name).parent)?.[0];
    C.set(name, (pn && C.get(pn)) || [0, 0, 0, 1]);
  }
}

const anim = src.getRoot().listAnimations()[0];
if (!anim) throw new Error(`${sourceFile}: no animation`);
const rotOf = new Map(), posOf = new Map();
let dur = 0, start = Infinity;
for (const ch of anim.listChannels()) {
  const node = ch.getTargetNode(), s = ch.getSampler();
  start = Math.min(start, s.getInput().getMin([])[0]);
  dur = Math.max(dur, s.getInput().getMax([])[0]);
  if (ch.getTargetPath() === 'rotation') rotOf.set(node, sampler(s, 4));
  if (ch.getTargetPath() === 'translation') posOf.set(node, sampler(s, 3));
}
dur -= start;
const fps = outFps, frames = Math.max(2, Math.round(dur * fps) + 1);
const times = Array.from({ length: frames }, (_, i) => Math.min(dur, i / fps));
const hipsS = S.byName.get('Hips'), hipsT = T.byName.get('Hips');
// hip heights above the feet at rest (world, Y up): the scale for the hips' travel
const hipH = (R) => R.byName.get('Hips').P[1] - Math.min(R.byName.get('LeftFoot').P[1], R.byName.get('RightFoot').P[1]);
const k = hipH(T) / hipH(S);
const tParent = T.world(hipsT.parent);

// vertical: the hips' height above the ankles, which stay near the ground through any clip (a sit on the ground
// lowers the hips to just above them); measured on the source over the whole clip, scaled, set over the target's ankles
const srcRot = (t) => (m) => (rotOf.has(m) ? rotOf.get(m)(t) : null);
const srcHipsY = (t) => {
  const sp = posOf.has(hipsS.node) ? posOf.get(hipsS.node)(t) : hipsS.pos;
  const par = S.world(hipsS.parent, srcRot(t));
  return par.p[1] + qrot(par.q, sp.map((x, i) => x * par.s[i]))[1];
};
const srcPos = (t) => (m) => (posOf.has(m) && m === hipsS.node ? posOf.get(m)(t) : null);
const ankleY = (R, rot, pos) => Math.min(R.world(R.byName.get('LeftFoot').node, rot, pos).p[1], R.world(R.byName.get('RightFoot').node, rot, pos).p[1]);
let srcAnkleMin = Infinity;
for (const t of times) srcAnkleMin = Math.min(srcAnkleMin, ankleY(S, srcRot(t), srcPos(t)));
const tgtAnkle = Math.min(T.byName.get('LeftFoot').P[1], T.byName.get('RightFoot').P[1]);
if (process.env.RT_DEBUG) console.log("DBG", { hips0: srcHipsY(0), srcAnkleMin, tgtAnkle, hipsT: hipsT.P[1], hipsSrest: hipsS.P[1], k, ankleS0: ankleY(S, srcRot(0), srcPos(0)) });

const outRot = new Map(T.order.map((n) => [n, []]));
const outPos = [];
const prev = new Map();
for (const t of times) {
  const rot = (m) => (rotOf.has(m) ? rotOf.get(m)(t) : null);
  // source world rotations of the mapped bones at t (every animated ancestor included)
  const W = new Map();
  for (const name of S.order) W.set(name, S.world(S.byName.get(name).node, rot).q);
  const delta = (name) => (W.has(name) ? qmul(qmul(W.get(name), qinv(S.byName.get(name).R)), qinv(C.get(name))) : null);
  const WT = new Map();
  for (const name of T.order) {
    const b = T.byName.get(name);
    const pn = [...T.byName].find(([, x]) => x.node === b.parent)?.[0];
    const Pw = pn ? WT.get(pn) : T.world(b.parent).q;
    const d = delta(name);
    const w = d ? qnorm(qmul(d, b.R)) : qnorm(qmul(Pw, b.rest));
    WT.set(name, w);
    let q = qnorm(qmul(qinv(Pw), w));
    const p = prev.get(name);
    if (p && p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3] < 0) q = q.map((x) => -x);
    prev.set(name, q);
    outRot.get(name).push(...q);
  }
  // hips travel: the source's world displacement from rest, scaled, in the target hips' parent space
  const sw = S.world(hipsS.node, (m) => (rotOf.has(m) ? rotOf.get(m)(t) : null));
  // travel from the clip's first frame (a T2M clip's absolute pelvis height differs from its rest): people.js grounds
  // every clip at load, so only the motion matters
  const sp0 = posOf.has(hipsS.node) ? posOf.get(hipsS.node)(0) : hipsS.pos;
  const sp = posOf.has(hipsS.node) ? posOf.get(hipsS.node)(t) : hipsS.pos;
  const sParent = S.world(hipsS.parent, (m) => (rotOf.has(m) ? rotOf.get(m)(t) : null));
  const dLocal = sp.map((x, i) => (x - sp0[i]) * sParent.s[i]);
  const dWorld = qrot(sParent.q, dLocal).map((x) => x * k);
  // the height is absolute (above the ankles), not relative to the first frame
  dWorld[1] = tgtAnkle + (srcHipsY(t) - srcAnkleMin) * k - hipsT.P[1];
  const back = qrot(qinv(tParent.q), dWorld).map((x, i) => x / tParent.s[i]);
  outPos.push(...hipsT.pos.map((x, i) => x + back[i]));
  void sw;
}

const buf = T.root.listBuffers()[0];
T.root.listAnimations().forEach((a) => a.dispose());
const out = tgt.createAnimation(clipName);
const input = tgt.createAccessor().setType('SCALAR').setArray(new Float32Array(times)).setBuffer(buf);
const add = (node, path, arr, type) => {
  const s = tgt.createAnimationSampler().setInput(input).setOutput(tgt.createAccessor().setType(type).setArray(new Float32Array(arr)).setBuffer(buf)).setInterpolation('LINEAR');
  out.addSampler(s).addChannel(tgt.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(s));
};
for (const [name, arr] of outRot) add(T.byName.get(name).node, 'rotation', arr, 'VEC4');
add(hipsT.node, 'translation', outPos, 'VEC3');
await io.write(outFile, tgt);
console.log(`retargeted ${sourceFile}${isSmpl ? ' (SMPL-H)' : ''} -> ${outFile}: ${frames} frames, ${dur.toFixed(2)} s, hips scale ${k.toFixed(3)}`);
void nameOfSrc;
