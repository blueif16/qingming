#!/usr/bin/env node
// Prop tracks (fix-boats, details pass): where a character's long carried props are, at 10 Hz over every clip, in the
// root frame the page draws (as tools/joint_tracks.mjs: x the figure's left, y up, z forward, metres at the page's size),
// from the SHIPPED GLB loaded and corrected by the page's own people.js (tools/lib/three_node.mjs). A prop is a rigid part
// prop_<name> skinned to one bone (tools/char_props.mjs): its two ends (the extreme vertices along its long axis at
// rest) and its radius. The boat crews' pole rules read them (characters/contacts.json sites pole_lo, pole_hi; the
// palms on the pole): pole_boat, fend_pole, stand_pole.
//   node tools/prop_tracks.mjs <character|all> [--props long_pole,long_pole_low,long_pole_mid] [--force]
//     -> gen/details/joints/props_<name>.json { props: { <prop>: { r, len, clips: { <clip>: { a: [x,y,z,...], b: [...] } } } } }
// Cached by the GLB's bytes, its clip_meta entry, people.js and this tool's version.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { QM, THREE, loadModels } from './lib/three_node.mjs';

const VERSION = 1, HZ = 10;
const OUT = path.join(QM, 'gen/details/joints');
const PUB = path.join(QM, 'web/public');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const force = args.includes('--force');
const WANT = new Set(opt('--props', 'long_pole,long_pole_low,long_pole_mid,staff').split(','));
const pos = args.filter((a, i) => !a.startsWith('--') && !['--props'].includes(args[i - 1]));
const reg = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/chars/characters.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/clip_meta.json'), 'utf8'));
const props = JSON.parse(fs.readFileSync(path.join(QM, 'characters/props.json'), 'utf8'));
const PEOPLE_JS = crypto.createHash('sha256').update(fs.readFileSync(path.join(QM, 'web/src/people.js'))).digest('hex');
const r3 = (x) => Math.round(x * 1000) / 1000;

async function character(name) {
  const info = reg[name];
  const has = Object.keys(props[name] || {}).filter((p) => WANT.has(p));
  if (!info?.file || !has.length) return { name, skipped: 'no wanted props' };
  const file = path.join(OUT, `props_${name}.json`);
  const k = crypto.createHash('sha256').update(fs.readFileSync(path.join(PUB, info.file))).update(JSON.stringify(meta[info.file] || {}))
    .update(JSON.stringify([info.height_m, VERSION, [...WANT].sort()])).update(PEOPLE_JS).digest('hex').slice(0, 16);
  if (!force && fs.existsSync(file)) { try { if (JSON.parse(fs.readFileSync(file, 'utf8')).key === k) return { name, cached: true }; } catch { /* redo */ } }
  const t0 = Date.now();
  const m = (await loadModels([name], reg, meta))[name];
  const scene = m.scene;
  scene.updateMatrixWorld(true);
  // the prop meshes (a prop may be one mesh or a group of primitives)
  const meshes = {};
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const nm = /^prop_/.test(o.name) ? o.name : /^prop_/.test(o.parent?.name || '') ? o.parent.name : null;
    if (nm && WANT.has(nm.slice(5))) (meshes[nm.slice(5)] ||= []).push(o);
  });
  const v = new THREE.Vector3();
  const ends = {};
  for (const [p, list] of Object.entries(meshes)) {
    // the long axis at rest: power iteration on the covariance of every vertex
    const pts = [];
    for (const o of list) for (let i = 0; i < o.geometry.attributes.position.count; i++) { o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld); pts.push([o, i, v.toArray()]); }
    const c = [0, 1, 2].map((k2) => pts.reduce((a, x) => a + x[2][k2], 0) / pts.length);
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const [, , q] of pts) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += (q[i] - c[i]) * (q[j] - c[j]);
    let ax = [0.3, 1, 0.2];
    for (let it = 0; it < 40; it++) { const w = C.map((row) => row[0] * ax[0] + row[1] * ax[1] + row[2] * ax[2]); const l = Math.hypot(...w) || 1; ax = w.map((x) => x / l); }
    let lo = null, hi = null, r = 0;
    for (const x of pts) { const s = (x[2][0] - c[0]) * ax[0] + (x[2][1] - c[1]) * ax[1] + (x[2][2] - c[2]) * ax[2]; if (!lo || s < lo.s) lo = { s, x }; if (!hi || s > hi.s) hi = { s, x }; }
    for (const [, , q] of pts) { const d = [q[0] - c[0], q[1] - c[1], q[2] - c[2]], s = d[0] * ax[0] + d[1] * ax[1] + d[2] * ax[2]; r = Math.max(r, Math.hypot(d[0] - ax[0] * s, d[1] - ax[1] * s, d[2] - ax[2] * s)); }
    ends[p] = { a: lo.x, b: hi.x, len: hi.s - lo.s, r };
  }
  const mixer = new THREE.AnimationMixer(scene);
  const out = { about: 'tools/prop_tracks.mjs: each long prop\'s two ends (a, b: flat [x, y, z, ...] per sample at 10 Hz) in the root frame the page draws (x the figure\'s left, y up, z forward; page metres), every clip; r its radius, len its length.', name, file: info.file, key: k, version: VERSION, hz: HZ, props: {} };
  for (const [p, e] of Object.entries(ends)) out.props[p] = { r: r3(e.r), len: r3(e.len), clips: {} };
  for (const clip of m.clips) {
    const action = mixer.clipAction(clip).play();
    const n = Math.max(1, Math.floor(clip.duration * HZ) + 1);
    const tr = Object.fromEntries(Object.keys(ends).map((p) => [p, { a: [], b: [] }]));
    for (let i = 0; i < n; i++) {
      action.time = Math.min(i / HZ, clip.duration - 1e-4);
      mixer.update(0);
      scene.updateMatrixWorld(true);
      for (const [p, e] of Object.entries(ends)) for (const which of ['a', 'b']) {
        const [o, vi] = e[which];
        o.getVertexPosition(vi, v).applyMatrix4(o.matrixWorld);
        tr[p][which].push(r3(v.x), r3(v.y), r3(v.z));
      }
    }
    action.stop(); mixer.uncacheAction(clip);
    for (const p of Object.keys(ends)) out.props[p].clips[clip.name] = tr[p];
  }
  mixer.uncacheRoot(scene);
  out.seconds = (Date.now() - t0) / 1000;
  fs.writeFileSync(file, JSON.stringify(out));
  return { name, props: Object.keys(ends), clips: m.clips.length, seconds: out.seconds };
}

const names = !pos[0] || pos[0] === 'all' ? Object.keys(props).filter((n) => reg[n]?.file) : pos;
for (const n of names) console.log(JSON.stringify(await character(n)));
