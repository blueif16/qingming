#!/usr/bin/env node
// The carried children, checked by numbers: for each carried-child prop (gen/props/carry.json) on its carrier's
// SHIPPED GLB (web/public/assets/chars/<carrier>.glb, meshopt; and every recolour variant that inherits the prop), at
// 10 Hz over the clip that holds it (characters/props.json), with the prop skinned exactly as the GLB says:
//   contact gap    the distance from each carrier site (a point on his posed surface: shoulder top, flank, palm, ...;
//                  carry.json `sites`, tracked on its triangle over the cycle) to the surface of the child part that
//                  must touch it (carry.json `contacts`), at the bind time and over the cycle (max, mean);
//   floating       the farthest vertex of each contact patch (the child part within 2 cm of the contact point at the
//                  bind time) from the carrier's surface, over the cycle;
//   penetration    the deepest child vertex inside the carrier's skinned body (ray parity, depth to the surface), over
//                  the cycle;
//   deform         how far the child moves away from rigid motion with the bind bone (0 for a rigid prop; the
//                  carried children follow the bones under their contacts, carry_pose.mjs followWeights), and the
//                  largest stretch of one of its edges over the cycle (how much it bends where it follows two bones).
// Limits: gap 2 cm at the bind time and 4 cm over the cycle, floating 3 cm, penetration 1 cm. PASS/FAIL per prop.
// Child parts come from gen/props/<prop>.glb (_PART, matched by position at the bind time); a prop without them (the
// old primitive children) counts its whole mesh as every part.
//   node tools/carry_check.mjs [prop,...|all] [--chars <dir>] [--json <out.json>] [--hz 10] [--page] [--play <clip>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  io, loadRig, carrierPose, sitesOf, siteAt, gapTo, penetration, floating, skinMesh, poseClip, dist, mul, invert, xf, inMetres,
  localsAt, mixLocals, poseLocals, posOf, xd, norm, cross,
} from './carry_lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const LIM = { bind: 0.02, cycle: 0.04, float: 0.03, pen: 0.01 };
const spec = JSON.parse(fs.readFileSync(r('gen/props/carry.json'), 'utf8'));
const props = JSON.parse(fs.readFileSync(r('characters/props.json'), 'utf8'));
const which = !args[0] || args[0].startsWith('--') || args[0] === 'all' ? Object.keys(spec).filter((k) => !k.startsWith('_')) : args[0].split(',');
const charsDir = opt('--chars', 'web/public/assets/chars');
const hz = +opt('--hz', 10);
// --page: sample as the page plays a clip that doesn't loop cleanly (people.js keepLooping: 0.45 s before its end it
// cross-fades into a fresh copy from 0), so the clip's last 0.5 s and first 0.45 s are only seen mixed
const PAGE = args.includes('--page'), FADE = 0.45;

// the characters that draw a carrier's props: itself and its variants without props of their own
function carriersOf(name) {
  const out = [name];
  for (const f of fs.readdirSync(r('characters'))) {
    if (!f.endsWith('.json') || ['motions.json', 'props.json'].includes(f)) continue;
    const c = JSON.parse(fs.readFileSync(r(`characters/${f}`), 'utf8'));
    if (c.body_from === name && !props[f.slice(0, -5)]) out.push(f.slice(0, -5));
  }
  return out;
}
// each prop vertex's child part, by nearest position to the baked geometry (bind time, metres, Armature axes)
async function labelsFor(prop, P) {
  const file = r(`gen/props/${prop}.glb`);
  if (!fs.existsSync(file)) return null;
  const d = await io.read(file);
  const prim = d.getRoot().listMeshes()[0].listPrimitives()[0];
  const part = prim.getAttribute('_PART'), pos = prim.getAttribute('POSITION');
  if (!part) return null;
  const names = d.getRoot().getExtras()?.carry?.parts;
  const G = pos.getArray(), L = part.getArray(), n = P.length / 3;
  const cell = 0.01, grid = new Map(), key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  for (let i = 0; i < G.length / 3; i++) { const k = key(G[i * 3], G[i * 3 + 1], G[i * 3 + 2]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
  const out = new Array(n);
  let worst = 0;
  for (let i = 0; i < n; i++) {
    const p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    let best = -1, bd = Infinity;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      for (const j of grid.get(key(p[0] + dx * cell, p[1] + dy * cell, p[2] + dz * cell)) || []) {
        const d2 = dist(p, [G[j * 3], G[j * 3 + 1], G[j * 3 + 2]]);
        if (d2 < bd) { bd = d2; best = j; }
      }
    }
    if (best < 0) return null;   // the shipped prop isn't this geometry
    worst = Math.max(worst, bd);
    out[i] = names[L[best]];
  }
  return worst < 0.015 ? out : null;   // shipped weights are quantised: a multi-bone vertex lands within ~1 cm
}

// the carrier as the page shows him mid cross-fade: clip time t mixed with time t2 by weight f
function carrierMixed(rig, clip, t, t2, f) {
  const C = carrierPose(rig, clip, t);
  const W = poseLocals(rig, mixLocals(localsAt(rig, clip, t), localsAt(rig, clip, t2), f));
  const body = rig.meshes[rig.body];
  const P = skinMesh(rig, body, W);
  return { ...carrierPose(rig, clip, t), W, Wm: W.map(inMetres), P, grid: new (C.grid.constructor)(P, body.idx), J: (n) => posOf(inMetres(W[rig.index(n)])) };
}

async function check(prop, carrier) {
  const sp = spec[prop];
  const own = props[sp.carrier]?.[prop];
  const bind = { ...(props._defaults?.[own?.geom || prop] || {}), ...own };
  // --play <clip>: measure the prop while the carrier plays another clip than the one it is bound to (the bind time
  // is kept): what the page shows while a people.json still asks for that clip
  const play = opt('--play');
  if (play) bind.clip = play;
  const file = path.isAbsolute(charsDir) ? path.join(charsDir, `${carrier}.glb`) : r(`${charsDir}/${carrier}.glb`);
  const rig = await loadRig(file);
  const mesh = rig.meshes[`prop_${prop}`];
  if (!mesh) return { prop, carrier, error: `no prop_${prop} in ${file}` };
  const dur = rig.clips[bind.clip];
  const C0 = carrierPose(rig, bind.clip, bind.t);
  const W0 = poseClip(rig, bind.clip, bind.t);
  const P0 = skinMesh(rig, mesh, W0);
  const labels = await labelsFor(prop, P0);
  const sites = sitesOf(C0, sp.sites);
  const parts = sp.contacts.map((ct) => {
    const tris = [];
    for (let t = 0; t < mesh.idx.length / 3; t++) if (!labels || [0, 1, 2].filter((c) => ct.child.includes(labels[mesh.idx[t * 3 + c]])).length >= 2) tris.push(t);
    return tris;
  });
  const res = sp.contacts.map((ct, k) => {
    const g = gapTo(sites[ct.site].p, P0, mesh.idx, parts[k]);
    const patch = [];
    for (const t of parts[k]) for (let c = 0; c < 3; c++) { const i = mesh.idx[t * 3 + c]; if (dist([P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]], g.q) <= 0.02) patch.push(i); }
    return { name: ct.name, bind: g.d, max: 0, mean: 0, float: 0, patch: [...new Set(patch)] };
  });
  const B = rig.index(bind.bone);
  let pen = { max: 0, t: 0 }, penBind = penetration(C0, P0).max, deform = 0, n = 0;
  // the child's own edges, to see how much it stretches where it follows several bones
  const edges = new Set();
  for (let t = 0; t < mesh.idx.length; t += 3) for (let a = 0; a < 3; a++) { const i = mesh.idx[t + a], j = mesh.idx[t + (a + 1) % 3]; edges.add(i < j ? i * 65536 + j : j * 65536 + i); }
  const E = [...edges].map((k) => [Math.floor(k / 65536), k % 65536]);
  const L0 = E.map(([i, j]) => dist([P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]], [P0[j * 3], P0[j * 3 + 1], P0[j * 3 + 2]]));
  let stretch = 0;
  const times = [];
  if (!PAGE) for (let t = 0; t < dur - 1e-6; t += 1 / hz) times.push({ t });
  else {
    for (let t = FADE; t < dur - FADE - 0.05; t += 1 / hz) times.push({ t });
    for (let u = 0; u <= FADE + 1e-6; u += 1 / hz) times.push({ t: dur - FADE - 0.05 + u, mix: { t2: u, f: u / FADE } });
  }
  for (const { t, mix } of times) {
    const C = mix ? carrierMixed(rig, bind.clip, t, mix.t2, mix.f) : carrierPose(rig, bind.clip, t);
    const P = skinMesh(rig, mesh, C.W);
    sp.contacts.forEach((ct, k) => {
      const g = gapTo(siteAt(C, sites[ct.site]).p, P, mesh.idx, parts[k]).d;
      res[k].max = Math.max(res[k].max, g); res[k].mean += g; res[k].float = Math.max(res[k].float, floating(C, P, res[k].patch));
    });
    const pe = penetration(C, P).max;
    if (pe > pen.max) pen = { max: pe, t };
    // departure from rigid motion with the bind bone
    const rel = mul(C.Wm[B], invert(C0.Wm[B]));
    for (let i = 0; i < P.length / 3; i++) deform = Math.max(deform, dist(xf(rel, [P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]]), [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]));
    E.forEach(([i, j], k) => { if (L0[k] > 0.004) stretch = Math.max(stretch, Math.abs(dist([P[i * 3], P[i * 3 + 1], P[i * 3 + 2]], [P[j * 3], P[j * 3 + 1], P[j * 3 + 2]]) / L0[k] - 1)); });
    n++;
  }
  for (const c of res) { c.mean /= n; delete c.patch; c.pass = c.bind <= LIM.bind && c.max <= LIM.cycle && c.float <= LIM.float; }
  const pass = res.every((c) => c.pass) && pen.max <= LIM.pen;
  return { prop, carrier, clip: bind.clip, t: bind.t, dur, samples: n, tris: mesh.idx.length / 3, parts: !!labels, bone: bind.bone, contacts: res, penBind, pen: pen.max, penT: pen.t, deform, stretch, pass };
}

const cm = (x) => (x * 100).toFixed(1);
const out = [];
for (const prop of which) for (const carrier of carriersOf(spec[prop].carrier)) {
  const R = await check(prop, carrier);
  out.push(R);
  if (R.error) { console.log(`${prop} on ${carrier}: ${R.error}`); continue; }
  console.log(`\n${R.pass ? 'PASS' : 'FAIL'}  ${prop} on ${carrier} (${R.clip} @ ${R.t}s bind, ${R.samples} samples over ${R.dur.toFixed(2)} s${PAGE ? ' as the page loops it' : ''}; ${R.tris} tris; parts ${R.parts ? 'from the child skeleton' : 'whole mesh'})`);
  console.log(`  ${'contact'.padEnd(36)} bind   max  mean float   (cm; limits 2 / 4 / - / 3)`);
  for (const c of R.contacts) console.log(`  ${c.name.padEnd(36)} ${cm(c.bind).padStart(4)} ${cm(c.max).padStart(5)} ${cm(c.mean).padStart(5)} ${cm(c.float).padStart(5)}  ${c.pass ? 'ok' : 'FAIL'}`);
  console.log(`  penetration: bind ${cm(R.penBind)} cm, cycle max ${cm(R.pen)} cm at ${R.penT.toFixed(1)} s (limit 1)  ${R.pen <= LIM.pen ? 'ok' : 'FAIL'}`);
  console.log(`  departure from rigid on ${R.bone}: ${cm(R.deform)} cm; largest stretch of a child edge over the cycle ${(R.stretch * 100).toFixed(0)}%`);
}
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(out, null, 1) + '\n');
const fails = out.filter((x) => !x.pass).length;
console.log(`\n${out.length - fails}/${out.length} PASS`);
process.exitCode = fails ? 1 : 0;
