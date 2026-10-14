#!/usr/bin/env node
// The drum strike (interactions round, 2026-10-13; the lead's addition to gen/interact/brief_clips.md): where the
// drumstick's tip is over strike_drum, per playable character, from the SHIPPED GLB loaded and grounded by the page's own
// people.js (tools/lib/three_node.mjs, as tools/prop_tracks.mjs), sampled at 100 Hz in the root frame the page draws
// (x the figure's left, y up, z forward; page metres). The tip is the prop_drumstick vertex farthest along the stick
// from the grip (its rest long axis, power iteration on the covariance).
//   hit_s: the time the stick meets the skin: where the right hand's forward speed reverses (the palm's z at its
//          largest during the swing), refined to the 100 Hz sample.
//   node gen/interact/tools/drum_tip.mjs [character,...]   -> gen/interact/drum_tip.json
import fs from 'node:fs';
import path from 'node:path';
import { QM, THREE, loadModels } from '../../../tools/lib/three_node.mjs';

const PLAY = ['official', 'scholar', 'monk', 'woman', 'child', 'soldier', 'porter', 'sightseer'];
const names = process.argv[2] ? process.argv[2].split(',') : PLAY;
const PUB = path.join(QM, 'web/public');
const reg = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/chars/characters.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/clip_meta.json'), 'utf8'));
const HZ = 100, CLIP = 'strike_drum';
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const out = { about: 'gen/interact/tools/drum_tip.mjs: per character, the drumstick tip and the right palm over strike_drum at 100 Hz (root frame: x the figure\'s left, y up, z forward, page metres, as the page draws it); hit_s where the palm\'s forward speed reverses in the swing; tip_hit the tip there; tip_max_z the tip\'s farthest forward over the clip.', date: new Date().toISOString(), hz: HZ, characters: {} };
const v = new THREE.Vector3();
for (const name of names) {
  const m = (await loadModels([name], reg, meta))[name];
  const scene = m.scene;
  scene.updateMatrixWorld(true);
  const clip = m.clips.find((c) => c.name === CLIP);
  let stick = null, hand = null;
  scene.traverse((o) => {
    if (o.isMesh && (/^prop_drumstick/.test(o.name) || /^prop_drumstick/.test(o.parent?.name || ''))) stick = o;
    if (o.isBone && o.name === 'RightHand') hand = o;
  });
  if (!clip || !stick) { out.characters[name] = { missing: !clip ? CLIP : 'prop_drumstick' }; console.log(name, out.characters[name]); continue; }
  // the stick's long axis at rest and its two ends; the tip is the end farther from the hand bone
  const pts = [];
  for (let i = 0; i < stick.geometry.attributes.position.count; i++) { stick.getVertexPosition(i, v).applyMatrix4(stick.matrixWorld); pts.push(v.toArray()); }
  const c = [0, 1, 2].map((k) => pts.reduce((a, p) => a + p[k], 0) / pts.length);
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const q of pts) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += (q[i] - c[i]) * (q[j] - c[j]);
  let ax = [0.3, 1, 0.2];
  for (let it = 0; it < 40; it++) { const w = C.map((row) => row[0] * ax[0] + row[1] * ax[1] + row[2] * ax[2]); const l = Math.hypot(...w) || 1; ax = w.map((x) => x / l); }
  let lo = 0, hi = 0;
  pts.forEach((p, i) => { const s = (p[0] - c[0]) * ax[0] + (p[1] - c[1]) * ax[1] + (p[2] - c[2]) * ax[2]; const sl = (pts[lo][0] - c[0]) * ax[0] + (pts[lo][1] - c[1]) * ax[1] + (pts[lo][2] - c[2]) * ax[2]; const sh = (pts[hi][0] - c[0]) * ax[0] + (pts[hi][1] - c[1]) * ax[1] + (pts[hi][2] - c[2]) * ax[2]; if (s < sl) lo = i; if (s > sh) hi = i; });
  const hp = new THREE.Vector3(); hand.getWorldPosition(hp);
  const dist = (i) => Math.hypot(pts[i][0] - hp.x, pts[i][1] - hp.y, pts[i][2] - hp.z);
  const tipV = dist(hi) > dist(lo) ? hi : lo, gripV = tipV === hi ? lo : hi;
  const mixer = new THREE.AnimationMixer(scene);
  const action = mixer.clipAction(clip).play();
  const n = Math.floor(clip.duration * HZ) + 1;
  const tip = [], palm = [], butt = [];
  const P = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    action.time = Math.min(i / HZ, clip.duration - 1e-4);
    mixer.update(0);
    scene.updateMatrixWorld(true);
    stick.getVertexPosition(tipV, v).applyMatrix4(stick.matrixWorld); tip.push(v.toArray().map(r4));
    stick.getVertexPosition(gripV, v).applyMatrix4(stick.matrixWorld); butt.push(v.toArray().map(r4));
    hand.getWorldPosition(P); palm.push(P.toArray().map(r4));
  }
  action.stop(); mixer.uncacheRoot(scene);
  // the swing: the palm's largest z between its highest point (the wind-up) and the end
  let top = 0; palm.forEach((p, i) => { if (p[1] > palm[top][1]) top = i; });
  let hit = top; for (let i = top; i < n; i++) if (palm[i][2] > palm[hit][2]) hit = i;
  let tmax = 0; tip.forEach((p, i) => { if (p[2] > tip[tmax][2]) tmax = i; });
  out.characters[name] = {
    duration: r4(clip.duration), height_m: reg[name].height_m, hit_s: r4(hit / HZ), windup_s: r4(top / HZ),
    tip_hit: tip[hit], palm_hit: palm[hit], butt_hit: butt[hit], tip_max_z: tip[tmax][2], tip_max_z_s: r4(tmax / HZ),
    stick_len: r4(Math.hypot(...[0, 1, 2].map((k) => pts[tipV][k] - pts[gripV][k]))), tip, palm,
  };
  console.log(`${name}: hit_s ${r4(hit / HZ)} (wind-up ${r4(top / HZ)}), tip ${JSON.stringify(tip[hit])}, palm ${JSON.stringify(palm[hit])}, tip's farthest z ${tip[tmax][2]} at ${r4(tmax / HZ)}`);
}
fs.writeFileSync(path.join(QM, 'gen/interact/drum_tip.json'), JSON.stringify(out));
console.log('gen/interact/drum_tip.json');
