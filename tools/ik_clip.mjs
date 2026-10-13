#!/usr/bin/env node
// IK clip variants: a character's clip with some of its contact sites pinned onto targets, per frame, locally and free
// (gen/details/brief_contacts_fix.md fix step 4; the standard: gen/details/contacts/fix_standard.md). Where a clip
// can't reach what the figure touches (a bearer's hands 0.1-0.3 m off the pole, a pusher's palms in the air beside the
// ox), the variant moves only the limbs that touch, and writes the result as a new clip of the same rig,
// "<base>~<variant>" (sedan_carry~pole, push_flank~ox), built into the character's GLB like any clip.
//
//   node tools/ik_clip.mjs <character> <base clip> <out.glb> --spec <name> --rigged <rig.glb> --base-file <clip.glb>
//        [--clip <variant clip name>] [--report <json>]
//   (tools/character.mjs runs it for a clip source "ik:<base clip>@<spec name>" in characters/<name>.json)
//
// The spec is characters/ik_variants.json[<name>]: {why, ops: [...]}, the targets in the figure's root frame as the
// page draws it (x the figure's left, y up, z forward, metres at the character's page size, the root on the ground
// between the feet): the frame tools/joint_tracks.mjs and tools/contact_check.mjs measure in. The model is loaded by
// the page's own code (people.js loadCharacters: its size, the clip's grounding), so a target means the same there.
// Each op pins one site (tools/lib/body_sites.mjs) every frame:
//   {site: palm_L|palm_R, via: "arm", to, hand: "keep_world"|"follow"}
//       analytic two-bone IK on the arm (Arm, ForeArm): the palm reaches the target, the elbow stays on the side the
//       clip has it, and the hand keeps the clip's world orientation (keep_world, the default: the wrist is aimed so
//       the palm lands) or its local one (follow);
//   {site: forearm_L|forearm_R|elbow_L|elbow_R, via: "arm", to}    the same with that point of the forearm;
//       an arm op's fade: [d0, d1]: pinned fully while the clip's own site is within d0 m of the target, not at all
//       beyond d1, blended between (a hand the take lets go of keeps its gesture);
//       an arm op's elbow: "clip" (the default: the side the clip has it, carried onto the new line) or "down" (below and outside the line from
//       the shoulder to the target: a hand sent far from where the clip has it reaches with a natural elbow);
//   {site: palm_L|palm_R, via: "hand", to}    the hand alone turned about the wrist towards the target (after an arm
//       op on the forearm: the hand laid flat on what the forearm rests on)
//   {site: <any site>, via: "hips", to, keep_soles: true|false}
//       moves the whole body (the hips' translation) so the site reaches the target (only the axes the target names);
//       keep_soles: two-bone IK on each leg (UpLeg, Leg) puts each foot back where the clip had it, turned as it was
//       (a bearer's shoulder held under the pole while his feet stay planted).
//   {site: sole_L|sole_R, via: "leg", to, foot: "keep_world"|"follow"}
//       analytic two-bone IK on the leg (UpLeg, Leg) pinning a sole (fix-inner, 2026-10-13): the sole reaches the
//       target, the knee stays on the side the clip has it, the hips stay put, and the foot keeps the clip's world
//       orientation (keep_world, the default: the foot is carried, not tilted, so the same sole vertex stays lowest) or
//       its local one (follow). A chair clip whose feet rest at two heights (the official's sit: one sole 6 cm up, the
//       other 6 cm into the floor once their middle is on the ground) gets both soles onto the floor: to {y: 0}.
// Any op with a `to` may take `frame: "<bone>"` (fix-inner, 2026-10-13, for the carried children): its target is then
// fixed in that bone's frame (origin at the bone, its world turn, page metres), not the root's, so it rides with the
// bone (a palm held on the chest while the spine sways). With a frame, `to: {hold_t: s}` holds the site where the base
// clip has it at time s in that frame (without a frame, in the root frame); an arm op holding a palm so also holds the
// elbow and the hand's turn as they are at hold_t in that frame.
//   {freeze: "<bone>" | ["<bone>", ...], t}   (no via) those bones' local turns held as the base clip has them at t,
//       every frame: a limb carried rigidly by its parent (["LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand"]: an
//       arm held as it is at t on the spine). Applied first, with damp.
// An arm op on elbow_L / elbow_R aims the upper arm (shoulder -> elbow) at the target and keeps the forearm's own turn.
//   {damp: "<bone>" | ["<bone>", ...], k}   (no via) each frame, those bones' rotations scaled toward their rest:
//       slerp(rest, clip, k): k 0.3 keeps a third of a head turn. Applied first, before the hips and the limbs.
// Spec-level `trim: [t0, t1]`: only the base clip's keys from t0 to t1 (seconds), shifted to start at 0 (a loop that
// should end before the take's last arm fall).
// Targets `to`:
//   {point: [x, y, z]}
//   {line: {p: [x, y, z], dir: [dx, dy, dz], s0?, s1?}, off: r}  the nearest point of the line (or of its segment s0..s1
//                                                        along dir from p: a pole's end), `off` towards the site (a
//                                                        pole: its axis, off = its radius + the hand's half thickness)
//   {plane: {p: [x, y, z], n: [nx, ny, nz]}, off: r}     the site's projection on the plane, `off` along n (a flank)
//   {x?, y?, z?}                                         only those coordinates (a height, a line across)
// Frame: spec "frame" "proposed" (the default) puts the targets where the page draws them once the base clip's ground
// offset (clip_meta.json sole_m, tools/clip_ground.mjs) is applied (the details pass's engine patch P1, on the page since
// 2026-10-13); "page" is the page without sole_m. The variant keeps its base's feet, so its own sole_m comes out the
// same (a leg op that pins both soles of a chair clip at y 0 keeps their middle there, so it too).
// The model here is loaded without clip_meta (the merged GLB is a temp file the meta doesn't list), so prepareClip
// never applies sole_m to it: this tool lifts the base clip by its sole_m itself, whether or not the page applies it
// (three_node.mjs applyProposed skips the lift once people.js applies sole_m, which here would leave the targets
// sole_m off: a variant rebuilt after P1 landed would stand 3-9 cm off).
// The rest of the clip is untouched: every other bone's track is copied as it is, so the variant moves as the base does.
// Output: the base clip's GLB with the touched bones' tracks replaced (rotations of the IK'd bones, the hips'
// translation for a hips op) at the base's own key times; the report gives each op's residual (site to target, metres,
// max and mean over the frames) and the largest turn of each bone, so a variant that bends a limb too far shows up.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { QM, THREE, loadCharacters, absLoader, applyProposed, PAGE_APPLIES_SOLE } from './lib/three_node.mjs';
import { defineSites, sampleSites } from './lib/body_sites.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [name, baseClip, outFile] = pos;
const specName = opt('--spec');
if (!name || !baseClip || !outFile || !specName || !opt('--rigged') || !opt('--base-file')) {
  console.log('usage: ik_clip.mjs <character> <base clip> <out.glb> --spec <name> --rigged <rig.glb> --base-file <clip.glb> [--clip <name>] [--report <json>]');
  process.exit(1);
}
const abs = (p) => path.resolve(QM, p);
// --spec-file <json>: specs from another file (a trial, before it goes into the shared characters/ik_variants.json)
const SPECS = JSON.parse(fs.readFileSync(opt('--spec-file') ? abs(opt('--spec-file')) : path.join(QM, 'characters/ik_variants.json'), 'utf8'));
const spec = SPECS[specName];
if (!spec) throw new Error(`characters/ik_variants.json has no "${specName}"`);
const cfg = JSON.parse(fs.readFileSync(path.join(QM, `characters/${name}.json`), 'utf8'));
const heightM = cfg.height_m || (cfg.body_from ? JSON.parse(fs.readFileSync(path.join(QM, `characters/${cfg.body_from}.json`), 'utf8')).height_m : null);
const V3 = THREE.Vector3, Q = THREE.Quaternion;
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---- the model, sized and grounded by the page's code: the rig with the base clip merged in (build_character.mjs)
const tmp = path.join(os.tmpdir(), `ik_clip_${process.pid}_${crypto.randomBytes(4).toString('hex')}.glb`);
execFileSync('node', [path.join(QM, 'tools/build_character.mjs'), tmp, abs(opt('--rigged')), `${baseClip}=${abs(opt('--base-file'))}`], { cwd: QM, stdio: ['ignore', 'ignore', 'inherit'] });
const models = await loadCharacters(absLoader, null, [name], { [name]: { file: tmp, height_m: heightM } }, null, null);
fs.rmSync(tmp, { force: true });
const m = models[name], scene = m.scene, clip = m.clips.find((c) => c.name === baseClip);
// the frame: targets are where the page draws them once a clip's ground offset is applied (clip_meta.json sole_m, the
// details pass's engine patch; spec "frame": "proposed", the default), or as people.js draws it today ("page")
const frame = spec.frame || 'proposed';
let soleShift = 0;
if (frame === 'proposed') {
  const reg = JSON.parse(fs.readFileSync(path.join(QM, 'web/public/assets/chars/characters.json'), 'utf8'));
  const file = reg[name]?.file || reg[cfg.body_from]?.file;
  const meta = JSON.parse(fs.readFileSync(path.join(QM, 'web/public/assets/clip_meta.json'), 'utf8'));
  const gf = path.join(QM, 'gen/details/contacts/clip_ground.json');
  const ground = fs.existsSync(gf) ? JSON.parse(fs.readFileSync(gf, 'utf8')).files[file]?.clips || {} : {};
  const known = meta[file]?.[baseClip]?.sole_m !== undefined ? meta[file] : ground;
  const e = known[baseClip] || {};
  if (PAGE_APPLIES_SOLE) {
    // the page applies sole_m in prepareClip from clip_meta, which this load doesn't pass: lift here (as applyProposed
    // did before P1 landed: the hips track's values, by sole_m over the hips' parent's world scale)
    const tr = clip.tracks.find((t) => /Hips\.position$/.test(t.name));
    if (e.sole_m && tr) {
      const ws = new THREE.Vector3();
      scene.getObjectByName(tr.name.split('.')[0]).parent.getWorldScale(ws);
      for (let i = 1; i < tr.values.length; i += 3) tr.values[i] += e.sole_m / ws.y;
      soleShift = e.sole_m;
    }
  } else {
    applyProposed(m, { [baseClip]: e });
    soleShift = clip.userData?.soleApplied || 0;
  }
}
scene.updateMatrixWorld(true);
const S = defineSites(scene);
const B = S.B;
const bones = [];
scene.traverse((o) => { if (o.isBone) bones.push(o); });
const resetPose = () => { for (const b of bones) if (b.userData.rest) { b.position.copy(b.userData.rest.p); b.quaternion.copy(b.userData.rest.q); } };

// ---- the base clip's key times and its raw hips track (the page adds its grounding to the hips; the output keeps the
// raw values plus the variant's own move, and the page grounds the variant the same way at load)
const io = new NodeIO();
const doc = await io.read(abs(opt('--base-file')));
const anim = doc.getRoot().listAnimations()[0];
const hipsCh = anim.listChannels().find((c) => c.getTargetNode()?.getName() === 'Hips' && c.getTargetPath() === 'translation');
const grid = hipsCh || anim.listChannels()[0];
const allTimes = Array.from(grid.getSampler().getInput().getArray());
const TRIM = spec.trim || null;
const inTrim = (t) => !TRIM || (t >= TRIM[0] - 1e-6 && t <= TRIM[1] + 1e-6);
const keyIdx = allTimes.map((t, i) => i).filter((i) => inTrim(allTimes[i]));
const times = keyIdx.map((i) => allTimes[i]);
if (!times.length) throw new Error(`trim ${JSON.stringify(TRIM)} leaves no keys`);
const rawHips = hipsCh ? hipsCh.getSampler().getOutput().getArray() : null;
if (hipsCh && hipsCh.getSampler().getInterpolation() === 'CUBICSPLINE') throw new Error('cubic hips track: not handled');
if (clip.userData?.locomotion && spec.ops.some((o) => o.via === 'hips')) throw new Error(`${baseClip} is locomotion: the page freezes its hips travel, a hips op would be lost`);

// ---- geometry helpers
const setWorldRot = (bone, wq) => { const pq = bone.parent.getWorldQuaternion(new Q()); bone.quaternion.copy(pq.invert().multiply(wq)); bone.updateMatrixWorld(true); };
const rotateWorld = (bone, R) => setWorldRot(bone, R.clone().multiply(bone.getWorldQuaternion(new Q())));
const wpos = (o) => o.getWorldPosition(new V3());
// the knee's (elbow's) side carried to a new limb axis: its offset from the old hip-ankle line, turned with the line
// onto the new one, as a pole beside the new line's middle. A pole taken as the old knee point (moved with the hips)
// and projected on the new axis' plane was dominated by the axis' own tilt when the leg is nearly straight (the knee
// 1-2 cm off the line), and the twist swung the knees 30-67 degrees sideways (fix-inner, 2026-10-13)
function sidePole(A0, E0, K0, A1, E1) {
  const ax0 = E0.clone().sub(A0).normalize(), ax1 = E1.clone().sub(A1).normalize();
  let perp = K0.clone().sub(A0).projectOnPlane(ax0);
  if (perp.lengthSq() < 1e-10) return K0.clone();
  perp = perp.normalize().applyQuaternion(new Q().setFromUnitVectors(ax0, ax1));
  return A1.clone().lerp(E1, 0.5).addScaledVector(perp, 0.5);
}
function twoBone(upper, lower, eff, target, pole) {
  const A = wpos(upper), Bp = wpos(lower), E = eff();
  const a = A.distanceTo(Bp), b = Bp.distanceTo(E);
  const dT = clamp(A.distanceTo(target), Math.abs(a - b) + 1e-4, a + b - 1e-4);
  const BA = A.clone().sub(Bp).normalize(), BE = E.clone().sub(Bp).normalize();
  const cur = Math.acos(clamp(BA.dot(BE), -1, 1));
  const want = Math.acos(clamp((a * a + b * b - dT * dT) / (2 * a * b), -1, 1));
  let n = BA.clone().cross(BE);
  if (n.lengthSq() < 1e-10) n = BA.clone().cross(pole.clone().sub(Bp));
  if (n.lengthSq() < 1e-10) n = new V3(1, 0, 0);
  rotateWorld(lower, new Q().setFromAxisAngle(n.normalize(), want - cur));
  const E2 = eff();
  rotateWorld(upper, new Q().setFromUnitVectors(E2.clone().sub(A).normalize(), target.clone().sub(A).normalize()));
  // twist about the shoulder-target line so the elbow (knee) comes back towards where the clip had it
  const axis = target.clone().sub(A).normalize();
  const u = wpos(lower).sub(A).projectOnPlane(axis), v = pole.clone().sub(A).projectOnPlane(axis);
  if (u.lengthSq() > 1e-8 && v.lengthSq() > 1e-8) {
    let ang = u.angleTo(v);
    if (u.clone().cross(v).dot(axis) < 0) ang = -ang;
    rotateWorld(upper, new Q().setFromAxisAngle(axis, ang));
  }
}
function targetOf(to, site) {
  if (to.point) return new V3(...to.point);
  if (to.line) {
    const p = new V3(...to.line.p), d = new V3(...to.line.dir).normalize();
    // the nearest point of the line (of the segment from s0 to s1 along dir from p, where given: a pole's end)
    const q = p.clone().addScaledVector(d, clamp(site.clone().sub(p).dot(d), to.line.s0 ?? -Infinity, to.line.s1 ?? Infinity));
    const off = site.clone().sub(q);
    return off.lengthSq() > 1e-10 ? q.addScaledVector(off.normalize(), to.off || 0) : q;
  }
  if (to.plane) {
    const p = new V3(...to.plane.p), n = new V3(...to.plane.n).normalize();
    return site.clone().addScaledVector(n, -site.clone().sub(p).dot(n)).addScaledVector(n, to.off || 0);
  }
  return new V3(to.x ?? site.x, to.y ?? site.y, to.z ?? site.z);
}
// a target in a bone's frame (op.frame): origin at the bone, its world turn, page metres; hold_t: the site's place at that
// time of the base clip in that frame (HELD, filled before the frames)
const HELD = new Map();
const oKey = (op) => spec.ops.indexOf(op);
const freezeBones = (op) => (Array.isArray(op.freeze) ? op.freeze : [op.freeze]).map((n) => { const b = B(n); if (!b) throw new Error(`freeze: no bone ${n}`); return b; });
function boneFrame(name) {
  const b = B(name);
  if (!b) throw new Error(`no bone ${name}`);
  const p = wpos(b), q = b.getWorldQuaternion(new Q());
  return { toW: (v) => v.clone().applyQuaternion(q).add(p), toL: (v) => v.clone().sub(p).applyQuaternion(q.clone().invert()) };
}
function targetFor(op, site) {
  if (op.to?.hold_t !== undefined) return op.frame ? boneFrame(op.frame).toW(HELD.get(op)) : HELD.get(op).clone();
  if (!op.frame) return targetOf(op.to, site);
  const F = boneFrame(op.frame);
  return F.toW(targetOf(op.to, F.toL(site)));
}
const SIDE = (site) => (/_L$/.test(site) ? 'Left' : 'Right');
function siteNow(site) {
  let out = null;
  scene.updateMatrixWorld(true);
  sampleSites(S, (s, p) => { if (s === site) out = p.clone(); });
  return out;
}

// ---- the ops, frame by frame
const touched = new Map(); // bone name -> { bone, rot: [], pos?: [] }
const touch = (bone, withPos = false) => { if (!touched.has(bone.name)) touched.set(bone.name, { bone, rot: [], pos: withPos ? [] : null, maxTurn: 0 }); else if (withPos && !touched.get(bone.name).pos) touched.get(bone.name).pos = []; };
const dampBones = (op) => (Array.isArray(op.damp) ? op.damp : [op.damp]).map((n) => { const b = B(n); if (!b) throw new Error(`damp: no bone ${n}`); return b; });
for (const op of spec.ops) {
  if (op.damp) dampBones(op).forEach((b) => touch(b));
  else if (op.freeze) freezeBones(op).forEach((b) => touch(b));
  else if (op.via === 'arm') { const s = SIDE(op.site); touch(B(`${s}Arm`)); touch(B(`${s}ForeArm`)); touch(B(`${s}Hand`)); }
  else if (op.via === 'hand') touch(B(`${SIDE(op.site)}Hand`));
  else if (op.via === 'hips') { touch(B('Hips'), true); if (op.keep_soles) for (const s of ['Left', 'Right']) { touch(B(`${s}UpLeg`)); touch(B(`${s}Leg`)); touch(B(`${s}Foot`)); } }
  else if (op.via === 'leg') {
    if (!/^sole_[LR]$/.test(op.site)) throw new Error(`a leg op pins a sole (sole_L, sole_R), not ${op.site}`);
    const s = SIDE(op.site); touch(B(`${s}UpLeg`)); touch(B(`${s}Leg`)); touch(B(`${s}Foot`));
  }
  else throw new Error(`op via ${op.via}: arm, hand, leg or hips`);
}
// whole-body moves first, then the limbs
const order = (o) => (o.damp || o.freeze ? 0 : o.via === 'hips' ? 1 : 2);
spec.ops.sort((a, b) => order(a) - order(b));
// the variant's hips track is always its own: gltf-transform's dedup merges an identical accessor with the base clip's,
// and people.js grounds each clip by adding to its hips array in place, so a shared array was lifted twice (the base
// clip moved with its variant's correction); the copy is signed by the variant's name (below, after the frames)
touch(B('Hips'), true);
const resid = spec.ops.map(() => []);
const elbowMiss = {};
const prevQ = new Map();
// a clip's pose at time t, each track's interpolant evaluated and written onto its bone. Not an AnimationMixer: its
// PropertyMixer writes a bone only when the mixed value differs from the last one it wrote, so after resetPose() a
// track whose value repeats (a constant track, or a second pose at the same t: two holds at one hold_t, a freeze at a
// hold's t) left its bone at rest, and the IK ran on that wrong pose with residual 0 (fix-boats, 2026-10-13)
const tracksOf = (c) => c.tracks.map((tr) => {
  const pn = THREE.PropertyBinding.parseTrackName(tr.name);
  const node = THREE.PropertyBinding.findNode(scene, pn.nodeName);
  return node && ['quaternion', 'position', 'scale'].includes(pn.propertyName) ? { node, prop: pn.propertyName, it: tr.createInterpolant() } : null;
}).filter(Boolean);
const TRACKS = tracksOf(clip);
const applyTracks = (trs, t, dur) => {
  resetPose();
  const tt = Math.min(t, dur - 1e-5);
  for (const k of trs) k.node[k.prop].fromArray(k.it.evaluate(tt));
  scene.updateMatrixWorld(true);
};
const poseAt = (t) => applyTracks(TRACKS, t, clip.duration);
const applyDamp = () => {
  for (const op of spec.ops.filter((o) => o.damp)) for (const b of dampBones(op)) b.quaternion.copy(b.userData.rest.q.clone().slerp(b.quaternion.clone(), op.k ?? 0.3));
  scene.updateMatrixWorld(true);
};
// the held places (to.hold_t): the site at that time of the base clip (damped), in its frame
for (const op of spec.ops.filter((o) => o.to?.hold_t !== undefined)) {
  poseAt(op.to.hold_t);
  applyDamp();
  const p = siteNow(op.site);
  HELD.set(op, op.frame ? boneFrame(op.frame).toL(p) : p);
  // an arm op holding a place in a bone's frame holds the elbow and the hand's turn there too (the limb rides the
  // bone as the clip has it at hold_t, not just the one point)
  if (op.via === 'arm' && op.frame) {
    const sd = SIDE(op.site), F = B(op.frame), fq = F.getWorldQuaternion(new Q());
    HELD.set(`${oKey(op)}:elbow`, boneFrame(op.frame).toL(wpos(B(`${sd}ForeArm`))));
    HELD.set(`${oKey(op)}:hand`, fq.clone().invert().multiply(B(`${sd}Hand`).getWorldQuaternion(new Q())));
  }
}
// {freeze: [bones], t}: those bones' local turns as the base clip has them at time t, every frame (a limb carried
// rigidly by its parent: the arm a child sits in, held as it is at t on the spine)
const FROZEN = new Map();
for (const op of spec.ops.filter((o) => o.freeze)) {
  poseAt(op.t ?? 0);
  applyDamp();
  for (const b of freezeBones(op)) FROZEN.set(b.name, b.quaternion.clone());
}
for (const [fi, t] of times.entries()) {
  poseAt(t);
  const baseQ = new Map([...touched.values()].map((e) => [e.bone.name, e.bone.quaternion.clone()]));
  applyDamp();
  for (const [n, q] of FROZEN) B(n).quaternion.copy(q);
  scene.updateMatrixWorld(true);
  const hipsLocal0 = B('Hips').position.clone();
  spec.ops.forEach((op, oi) => {
    if (op.damp || op.freeze) { resid[oi].push(0); return; }
    const site = siteNow(op.site);
    let target = targetFor(op, site);
    // fade [d0, d1] (arm ops): pinned fully while the clip's own site is within d0 of the target, not at all beyond
    // d1, blended between: a hand the take lets go of (the steer take's right hand whips the team) keeps its gesture
    // fade_from [x, y, z] (root frame): the distance is the clip's site from that place (its usual place, where the
    // target was taken from), not from the target: a hand placed far from its target still holds it until the take
    // swings it away from where it usually is
    if (op.fade) { const d = site.distanceTo(op.fade_from ? new V3(...op.fade_from) : target), w = clamp((op.fade[1] - d) / (op.fade[1] - op.fade[0]), 0, 1); target = site.clone().lerp(target, w); }
    if (op.via === 'hips') {
      const feet = op.keep_soles ? ['Left', 'Right'].map((s) => ({ s, p: wpos(B(`${s}Foot`)), q: B(`${s}Foot`).getWorldQuaternion(new Q()), knee: wpos(B(`${s}Leg`)), hip: wpos(B(`${s}UpLeg`)) })) : [];
      const d = target.clone().sub(site);
      const hips = B('Hips');
      hips.position.copy(hips.parent.worldToLocal(wpos(hips).add(d)));
      hips.updateMatrixWorld(true);
      for (const f of feet) {
        twoBone(B(`${f.s}UpLeg`), B(`${f.s}Leg`), () => wpos(B(`${f.s}Foot`)), f.p, sidePole(f.hip, f.p, f.knee, wpos(B(`${f.s}UpLeg`)), f.p));
        setWorldRot(B(`${f.s}Foot`), f.q);
      }
    } else if (op.via === 'leg') {
      // the ankle sent by the sole's miss, the foot turned back as the clip has it in the world: the sole vertex rides
      // the foot rigidly, so a few passes take up what the skin's blend round the ankle leaves (residual < 1 mm)
      const s = SIDE(op.site), upLeg = B(`${s}UpLeg`), leg = B(`${s}Leg`), foot = B(`${s}Foot`);
      const fq = foot.getWorldQuaternion(new Q()), knee = wpos(leg), hip0 = wpos(upLeg), ankle0 = wpos(foot);
      const keep = (op.foot || 'keep_world') === 'keep_world';
      const local = keep ? null : foot.worldToLocal(site.clone());
      for (let it = 0; it < 4; it++) {
        const now = keep ? siteNow(op.site) : foot.localToWorld(local.clone());
        const miss = target.clone().sub(now);
        if (miss.length() < 2e-4) break;
        if (keep) {
          const aT = wpos(foot).add(miss);
          twoBone(upLeg, leg, () => wpos(foot), aT, sidePole(hip0, ankle0, knee, hip0, aT));
          setWorldRot(foot, fq);
        } else twoBone(upLeg, leg, () => foot.localToWorld(local.clone()), target, sidePole(hip0, ankle0, knee, hip0, target));
        scene.updateMatrixWorld(true);
      }
    } else if (op.via === 'hand') {
      // turn the hand about the wrist (the shortest turn) so the palm reaches the target as near as the hand's
      // length allows: a hand laid flat on the table its forearm rests on
      const hand = B(`${SIDE(op.site)}Hand`), W = wpos(hand), r = site.distanceTo(W);
      let d = target.clone().sub(W);
      if (d.length() > r) {
        // the reachable point nearest the target: keep the target's height where it can, the rest along the way
        const dy = clamp(d.y, -r, r), h = Math.sqrt(Math.max(0, r * r - dy * dy)), hz = new V3(d.x, 0, d.z);
        d = (hz.lengthSq() > 1e-10 ? hz.normalize().multiplyScalar(h) : new V3()).add(new V3(0, dy, 0));
      }
      rotateWorld(hand, new Q().setFromUnitVectors(site.clone().sub(W).normalize(), d.normalize()));
    } else {
      const s = SIDE(op.site), hand = B(`${s}Hand`), fore = B(`${s}ForeArm`), upper = B(`${s}Arm`);
      // the elbow's side: where the clip has it, or (elbow "down") below and outside the shoulder-target line, as a
      // reaching arm carries it
      // the clip's elbow side carried onto the new shoulder-target line (sidePole: a pole at the clip's elbow point,
      // projected on a line that moved 0.3 m, flipped the elbow 95-150 degrees: S6's wagon carter, fix-inner)
      const effNow = /^palm_/.test(op.site) ? wpos(hand) : site.clone();
      const effTo = /^palm_/.test(op.site) ? target.clone().sub(site.clone().sub(wpos(hand))) : target;
      let pole = sidePole(wpos(upper), effNow, wpos(fore), wpos(upper), effTo);
      if (op.elbow === 'down') {
        const sh = wpos(upper);
        pole = sh.clone().lerp(target, 0.5).add(new V3(s === 'Left' ? 0.25 : -0.25, -0.35, 0));
      }
      const held = op.frame && op.to?.hold_t !== undefined;
      if (held) pole = boneFrame(op.frame).toW(HELD.get(`${oKey(op)}:elbow`));
      if (/^elbow_/.test(op.site)) {
        // the elbow is the forearm's own origin, so there is no lower bone to bend: aim the upper arm (shoulder ->
        // elbow) at the target and keep the forearm's local turn (a two-bone solve with a zero-length lower bone
        // turned the forearm 90-163 degrees about world X: fix-bridge / fix-gate, 2026-10-13)
        const A = wpos(upper);
        rotateWorld(upper, new Q().setFromUnitVectors(site.clone().sub(A).normalize(), target.clone().sub(A).normalize()));
      } else if (/^palm_/.test(op.site) && (held || (op.hand || 'keep_world') === 'keep_world')) {
        // the hand keeps the clip's world turn (keep_world), or its held turn in the bone's frame
        const hq = held ? B(op.frame).getWorldQuaternion(new Q()).multiply(HELD.get(`${oKey(op)}:hand`)) : hand.getWorldQuaternion(new Q());
        const wristT = target.clone().sub(site.clone().sub(wpos(hand)));
        if (held) { setWorldRot(hand, hq); }
        const wristT2 = held ? target.clone().sub(siteNow(op.site).sub(wpos(hand))) : wristT;
        twoBone(upper, fore, () => wpos(hand), wristT2, pole);
        setWorldRot(hand, hq);
      } else {
        // a point fixed in the forearm (or the palm, following the forearm): its local place in the forearm's frame
        const local = fore.worldToLocal(site.clone());
        twoBone(upper, fore, () => fore.localToWorld(local.clone()), target, pole);
      }
    }
    scene.updateMatrixWorld(true);
    resid[oi].push(siteNow(op.site).distanceTo(targetFor(op, siteNow(op.site))));
    if (op.via === 'arm' && op.frame && op.to?.hold_t !== undefined) (elbowMiss[oi] ||= []).push(wpos(B(`${SIDE(op.site)}ForeArm`)).distanceTo(boneFrame(op.frame).toW(HELD.get(`${oKey(op)}:elbow`))));
  });
  for (const e of touched.values()) {
    let q = e.bone.quaternion.clone();
    const p = prevQ.get(e.bone.name);
    if (p && p.dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
    prevQ.set(e.bone.name, q);
    e.rot.push(q.x, q.y, q.z, q.w);
    e.maxTurn = Math.max(e.maxTurn, 2 * Math.acos(clamp(Math.abs(q.dot(baseQ.get(e.bone.name))), 0, 1)));
    if (e.pos) {
      const i = keyIdx[fi];
      const dl = e.bone.position.clone().sub(hipsLocal0);
      const raw = rawHips ? [rawHips[i * 3], rawHips[i * 3 + 1], rawHips[i * 3 + 2]] : e.bone.userData.rest.p.toArray();
      const y = raw[1] + dl.y;
      e.pos.push(raw[0] + dl.x, y, raw[2] + dl.z);
    }
  }
}
// every variant's hips translation is its own array, never one byte-identical to its base's or to a sibling variant's:
// gltf-transform's dedup (character build) merges identical accessors, and people.js grounds a shared hips array once,
// by whichever clip is prepared first, so a shared variant's own sole_m never applied (two variants of one base with
// arm ops only had equal hips tracks: lead, 2026-10-13). The clip's name signs its first and last keys (always kept by
// the build's resample): x of the first key and z of the last moved by 1-4096 steps of 4 float32 ulps of the hips
// height (at most 1.8 mm on one frame, sideways, so the grounding is untouched)
{
  const hp = touched.get('Hips').pos, nk = hp.length / 3;
  const h = crypto.createHash('sha1').update(opt('--clip') || `${baseClip}~${specName}`).digest();
  const unit = Math.max(Math.abs(hp[1]), 1e-3) * 2 ** -21;
  hp[0] += (1 + (h.readUInt32BE(0) % 4096)) * unit;
  hp[(nk - 1) * 3 + 2] += (1 + (h.readUInt32BE(4) % 4096)) * unit;
}

// ---- write: the base clip's GLB with the touched bones' tracks replaced
const root = doc.getRoot(), buf = root.listBuffers()[0];
const nodeOf = new Map(root.listNodes().map((n) => [n.getName(), n]));
const t0 = TRIM ? times[0] : 0;
const input = doc.createAccessor().setType('SCALAR').setArray(new Float32Array(times.map((t) => t - t0))).setBuffer(buf);
if (TRIM) {
  for (const sm of anim.listSamplers()) {
    if (sm.getInterpolation() === 'CUBICSPLINE') throw new Error('trim: cubic tracks not handled');
    const ti = Array.from(sm.getInput().getArray()), out = sm.getOutput().getArray(), w = out.length / ti.length;
    const keep = ti.map((t, i) => i).filter((i) => inTrim(ti[i]));
    sm.setInput(doc.createAccessor().setType('SCALAR').setArray(new Float32Array(keep.map((i) => ti[i] - t0))).setBuffer(buf));
    sm.setOutput(doc.createAccessor().setType(sm.getOutput().getType()).setArray(new Float32Array(keep.flatMap((i) => Array.from(out.slice(i * w, i * w + w))))).setBuffer(buf));
  }
}
for (const e of touched.values()) {
  const node = nodeOf.get(e.bone.name);
  if (!node) throw new Error(`the base clip's GLB has no node ${e.bone.name}`);
  for (const [pathName, arr, type] of [['rotation', e.rot, 'VEC4'], ...(e.pos ? [['translation', e.pos, 'VEC3']] : [])]) {
    for (const ch of anim.listChannels()) {
      if (ch.getTargetNode() !== node || ch.getTargetPath() !== pathName) continue;
      const old = ch.getSampler();
      ch.dispose();
      if (!anim.listChannels().some((c) => c.getSampler() === old)) old.dispose();
    }
    const s = doc.createAnimationSampler().setInput(input).setOutput(doc.createAccessor().setType(type).setArray(new Float32Array(arr)).setBuffer(buf)).setInterpolation('LINEAR');
    anim.addSampler(s).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(pathName).setSampler(s));
  }
}
if (opt('--clip')) anim.setName(opt('--clip'));
fs.mkdirSync(path.dirname(abs(outFile)), { recursive: true });
await io.write(abs(outFile), doc);
// the independent check: the written GLB's clip read back by three's GLTFLoader and posed on the same model (its hips
// lifted as the base was: the page's grounding of the base plus the base's sole_m), each op's site measured against
// its target again; it must agree with the solve's own residual to 1 cm, else the variant is wrong and the tool fails
{
  const gl = await absLoader.loadAsync(abs(outFile));
  const vc = gl.animations[0];
  const vh = vc.tracks.find((tr) => /Hips\.position$/.test(tr.name));
  const bh = clip.tracks.find((tr) => /Hips\.position$/.test(tr.name));
  const lift = bh && rawHips ? bh.values[1] - rawHips[1] : 0;   // the base's lift in the hips' local units
  if (vh) for (let i = 1; i < vh.values.length; i += 3) vh.values[i] += lift;
  // a walking base clip had its travel held by the page's prepareClip (x, z at the first key's): the same here
  if (vh && clip.userData?.locomotion) for (let i = 0; i < vh.values.length; i += 3) { vh.values[i] = vh.values[0]; vh.values[i + 2] = vh.values[2]; }
  const VT = tracksOf(vc);
  const vt = vh ? Array.from(vh.times) : times.map((t) => t - (TRIM ? times[0] : 0));
  const worst = spec.ops.map(() => 0);
  vt.forEach((t, fi) => {
    applyTracks(VT, t, vc.duration + 1e-5);
    spec.ops.forEach((op, oi) => {
      if (op.damp || op.freeze) return;
      const p = siteNow(op.site);
      worst[oi] = Math.max(worst[oi], Math.abs(p.distanceTo(targetFor(op, p)) - resid[oi][fi]));
    });
  });
  const bad = spec.ops.map((op, i) => [op, worst[i]]).filter(([, w]) => w > 0.01);
  if (bad.length) { fs.rmSync(abs(outFile), { force: true }); throw new Error(`ik_clip ${name} ${opt('--clip') || specName}: the written clip misses its targets by more than the solve's residual + 1 cm: ${bad.map(([op, w]) => `${op.site} ${r3(w)} m`).join(', ')} (the file is removed)`); }
  var verifyWorst = r3(Math.max(0, ...worst));
}
const report = {
  character: name, base: baseClip, spec: specName, frame, sole_shift_m: soleShift, clip: opt('--clip') || `${baseClip}~${specName}`, frames: times.length, duration: r3(times[times.length - 1] - times[0]),
  verify_max_m: verifyWorst,
  // a walking base: the variant keeps its travel in the hips track, and clip_ground gives it the base's locomotion
  locomotion: !!clip.userData?.locomotion,
  ops: spec.ops.map((op, i) => ({ site: op.site || (op.damp ? `damp ${op.damp}` : `freeze ${op.freeze}`), via: op.via, frame: op.frame, residual_max_m: r3(Math.max(...resid[i])), residual_mean_m: r3(resid[i].reduce((a, b) => a + b, 0) / resid[i].length), ...(elbowMiss[i] ? { elbow_miss_max_m: r3(Math.max(...elbowMiss[i])) } : {}) })),
  max_turn_deg: Object.fromEntries([...touched.values()].map((e) => [e.bone.name, Math.round((e.maxTurn * 180) / Math.PI)])),
};
if (opt('--report')) fs.writeFileSync(abs(opt('--report')), JSON.stringify(report, null, 1) + '\n');
console.log(`ik_clip ${name} ${report.clip}: ${report.frames} frames; ${report.ops.map((o) => `${o.site} residual max ${o.residual_max_m} mean ${o.residual_mean_m}`).join('; ')}; turns ${JSON.stringify(report.max_turn_deg)} -> ${path.relative(QM, abs(outFile))}`);
