// Verify an IK clip variant against its base, in the page's frame: the rig with both clips merged (build_character.mjs),
// loaded by people.js loadCharacters (tools/lib/three_node.mjs absLoader), every site sampled at 10 Hz in both clips.
//   node gen/details/contacts/fix_s4/tools/ik_verify.mjs <character> <rig.glb> <base>=<base.glb> <variant>=<variant.glb> [sites...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { QM, THREE, loadCharacters, absLoader } from '../../../../../tools/lib/three_node.mjs';
import { defineSites, sampleSites } from '../../../../../tools/lib/body_sites.mjs';
const [name, rig, a, b, ...sites] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(path.join(QM, `characters/${name}.json`), 'utf8'));
const tmp = path.join(os.tmpdir(), `ikv_${process.pid}.glb`);
execFileSync('node', [path.join(QM, 'tools/build_character.mjs'), tmp, path.resolve(QM, rig), a.replace('=', '=' + QM + '/'), b.replace('=', '=' + QM + '/')], { cwd: QM, stdio: ['ignore', 'ignore', 'inherit'] });
const ms = await loadCharacters(absLoader, null, [name], { [name]: { file: tmp, height_m: cfg.height_m } }, null, null);
fs.rmSync(tmp);
const m = ms[name], scene = m.scene;
scene.updateMatrixWorld(true);
const S = defineSites(scene);
const mixer = new THREE.AnimationMixer(scene);
const out = {};
for (const clip of m.clips) {
  const act = mixer.clipAction(clip).play();
  const tr = {};
  for (let t = 0; t <= clip.duration; t += 0.1) {
    act.time = Math.min(t, clip.duration - 1e-4); mixer.update(0); scene.updateMatrixWorld(true);
    sampleSites(S, (s, p) => (tr[s] ||= []).push(p.toArray()));
  }
  act.stop();
  out[clip.name] = tr;
}
const [ca, cb] = m.clips.map((c) => c.name);
const st = (arr, k) => { const v = arr.map((p) => p[k]).sort((x, y) => x - y); return `${v[0].toFixed(3)}/${v[v.length >> 1].toFixed(3)}/${v[v.length - 1].toFixed(3)}`; };
for (const s of sites.length ? sites : Object.keys(out[ca])) {
  const A = out[ca][s], Bv = out[cb][s];
  const dmax = Math.max(...A.map((p, i) => Math.hypot(p[0] - Bv[i][0], p[1] - Bv[i][1], p[2] - Bv[i][2])));
  console.log(`${s.padEnd(11)} ${ca}: x ${st(A, 0)} y ${st(A, 1)} z ${st(A, 2)} | ${cb}: x ${st(Bv, 0)} y ${st(Bv, 1)} z ${st(Bv, 2)} | moved max ${dmax.toFixed(3)}`);
}
