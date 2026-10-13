#!/usr/bin/env node
// Joint tracks: where each contact site of a character's body is, at 10 Hz over every clip, in the root frame the page
// draws (metres at the size people.js gives the character; x = the figure's left, y up, z its forward; the root on the
// ground between the feet), from the SHIPPED GLB (web/public/assets/chars/<name>.glb, meshopt). The model is loaded
// and its clips corrected by the page's own code (web/src/people.js loadCharacters / prepareClip, with
// web/public/assets/clip_meta.json: locomotion drift removed, grounding k), so the numbers are what the page draws.
// gen/details/brief_contacts.md, plan.md "The method".
//   node tools/joint_tracks.mjs <character|all> [--force]     -> gen/details/joints/<name>.json
//   node tools/joint_tracks.mjs animals [type] [--force]      -> gen/details/joints/animal_<type>.json + .bin
// Cached by the GLB's bytes, its clip_meta entry, its registry size and this tool's version.
//
// Sites (a fixed point in a bone's frame, measured once on the rest-pose mesh, or measured on the skinned mesh at every
// sample):
//   palm_L/R      the middle of the hand's cross-section at 45% of its length from the wrist (in the hand bone's
//                 frame; 0.06-0.08 m from the joint)
//   shoulder_L/R  the top of the shoulder where a pole rests: the mesh top above lerp(neck, arm joint, 0.55) (in the
//                 shoulder bone's frame; char_props' 'shoulder' placement)
//   chest_front   the front of the chest at the top spine joint's height (in that bone's frame)
//   forearm_L/R   halfway between the forearm and hand joints; elbow_L/R the forearm joint
//   back          the rear of the chest at the top spine joint's height; belly the front at the hips joint's height
//   seat          the lowest skinned vertex of the hips and thighs within 0.2 m (3D) of the hips joint (the buttocks)
//   sole_L/R      the lowest skinned vertex of each foot and toe
//   head_top      the highest skinned vertex of the head
//   hips          the hips joint
// Animals: the posed body (and each tack part) at 2 Hz over every clip, as triangles in the animal's root frame
// (x its left, y up, z forward, origin between the hooves), for point-to-mesh distances (push_flank, bridle, lead).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { QM, THREE, loadModels } from './lib/three_node.mjs';
import { bodyMeshes, skinned, defineSites, sampleSites } from './lib/body_sites.mjs';

const VERSION = 7; // 6: each clip records the sole_m it was measured with and whether its hips track is shared; 7: and whether the page used its clip_meta entry at all (meta_stale)
const HZ = 10, ANIMAL_HZ = 2;
// --engine proposed: measured as the page would draw it with the details pass's engine patch (tools/lib/three_node.mjs
// applyProposed: clip_meta sole_m), into gen/details/joints_proposed/
const ENGINE = (() => { const i = process.argv.indexOf('--engine'); return i >= 0 ? process.argv[i + 1] : 'page'; })();
const OUT = path.join(QM, ENGINE === 'proposed' ? 'gen/details/joints_proposed' : 'gen/details/joints');
const PUB = path.join(QM, 'web/public');
const args = process.argv.slice(2);
const force = args.includes('--force');
const pos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--engine');
const reg = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/chars/characters.json'), 'utf8'));
const beastReg = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/animals/animals.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/clip_meta.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });
// the page's own people.js does the sizing and the clip corrections: a change there (P1, 2026-10-13) redoes every track
const PEOPLE_JS = crypto.createHash('sha256').update(fs.readFileSync(path.join(QM, 'web/src/people.js'))).digest('hex');

const r3 = (x) => Math.round(x * 1000) / 1000;
const key = (file, info) => crypto.createHash('sha256').update(fs.readFileSync(path.join(PUB, file)))
  .update(JSON.stringify(meta[file] || {})).update(JSON.stringify([info.height_m, info.top_m, VERSION, ENGINE])).update(PEOPLE_JS).update(ENGINE === 'proposed' ? JSON.stringify(groundOf(file)) : '').digest('hex').slice(0, 16);
function groundOf(file) {
  const gf = path.join(QM, 'gen/details/contacts/clip_ground.json');
  return fs.existsSync(gf) ? JSON.parse(fs.readFileSync(gf, 'utf8')).files[file] || null : null;
}

async function character(name) {
  const info = reg[name];
  const file = path.join(OUT, `${name}.json`);
  const k = key(info.file, info);
  if (!force && fs.existsSync(file)) {
    try { if (JSON.parse(fs.readFileSync(file, 'utf8')).key === k) return { name, cached: true }; } catch { /* redo */ }
  }
  const t0 = Date.now();
  const models = await loadModels([name], reg, meta, { engine: ENGINE });
  const m = models[name], scene = m.scene;
  scene.updateMatrixWorld(true);
  const S = defineSites(scene);
  const { B, defs, SITES } = S;
  const rest = { height_box: null };
  const mixer = new THREE.AnimationMixer(scene);
  const clips = {};
  const w = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  // people.js grounds a hips position array once (GROUNDED): a clip whose array is shared with another clip (the GLB
  // writer merges identical accessors) gets whichever clip's lift came first, so its own sole_m can't apply
  const hipsOwner = new Map();
  for (const clip of m.clips) {
    const hipsV = clip.tracks.find((t) => /Hips\.position$/.test(t.name))?.values;
    const sharedWith = hipsV && hipsOwner.has(hipsV) ? hipsOwner.get(hipsV) : null;
    if (hipsV && !sharedWith) hipsOwner.set(hipsV, clip.name);
    const action = mixer.clipAction(clip).play();
    const n = Math.max(1, Math.floor(clip.duration * HZ) + 1);
    const tr = Object.fromEntries(SITES.map((s) => [s, []]));
    const ts = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(i / HZ, clip.duration - 1e-4);
      action.time = t;
      mixer.update(0);
      scene.updateMatrixWorld(true);
      ts.push(r3(t));
      sampleSites(S, (s, p) => tr[s].push(r3(p.x), r3(p.y), r3(p.z)));
    }
    action.stop();
    mixer.uncacheAction(clip);
    const cm = meta[info.file]?.[clip.name] || {};
    // people.js prepareClip uses a clip_meta entry (and so its sole_m) only when its hips key count and duration match
    // the clip; a stale entry is ignored and the page measures the clip itself, so its sole_m never applies
    const metaUsed = !!hipsV && cm.n === hipsV.length / 3 && Math.abs((cm.duration ?? -1) - clip.duration) < 1e-4;
    clips[clip.name] = { duration: r3(clip.duration), n, k: cm.k ?? null, locomotion: !!clip.userData?.locomotion, hipsY: clip.userData?.hipsY ?? null, seatY: clip.userData?.seatY ?? null, sole_applied: clip.userData?.soleApplied ?? null, sole_m_tracked: metaUsed ? (cm.sole_m ?? 0) : null, meta_stale: !metaUsed, hips_shared_with: sharedWith, t: ts, sites: tr };
  }
  mixer.uncacheRoot(scene);
  const out = {
    about: 'tools/joint_tracks.mjs: contact sites per clip at 10 Hz in the root frame the page draws (x the figure\'s left, y up, z forward; metres at people.js size). sites.<site> is a flat [x, y, z, ...] per sample time t.',
    name, file: info.file, key: k, version: VERSION, engine: ENGINE, height_m: info.height_m, scale: r3(scene.scale.x * 1000) / 1000, hz: HZ, site_defs: defs, sites: SITES,
    motion: info.motion || [], clips, seconds: (Date.now() - t0) / 1000,
  };
  fs.writeFileSync(file, JSON.stringify(out));
  return { name, cached: false, clips: Object.keys(clips).length, seconds: out.seconds, palm: defs.palm_R.offset_m, shoulder: defs.shoulder_R.above_line_m };
}

async function animal(type) {
  const info = beastReg[type];
  const file = path.join(OUT, `animal_${type}.json`), binFile = path.join(OUT, `animal_${type}.bin`);
  const k = key(info.file, info);
  if (!force && fs.existsSync(file) && fs.existsSync(binFile)) {
    try { if (JSON.parse(fs.readFileSync(file, 'utf8')).key === k) return { name: `animal_${type}`, cached: true }; } catch { /* redo */ }
  }
  const t0 = Date.now();
  const models = await loadModels([type], beastReg, meta);
  const m = models[type], scene = m.scene;
  scene.updateMatrixWorld(true);
  const parts = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const nm = /^(tack)_/.test(o.name) ? o.name : /^(tack)_/.test(o.parent?.name || '') ? o.parent.name : 'body';
    const g = o.geometry, idx = g.index ? Array.from(g.index.array) : Array.from({ length: g.attributes.position.count }, (_, i) => i);
    parts.push({ name: nm, mesh: o, index: idx, verts: g.attributes.position.count });
  });
  const mixer = new THREE.AnimationMixer(scene);
  const chunks = [];
  let offset = 0;
  const clips = {};
  const p = new THREE.Vector3();
  for (const clip of m.clips) {
    const action = mixer.clipAction(clip).play();
    const n = Math.max(1, Math.floor(clip.duration * ANIMAL_HZ) + 1);
    const frames = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(i / ANIMAL_HZ, clip.duration - 1e-4);
      action.time = t; mixer.update(0); scene.updateMatrixWorld(true);
      const fr = { t: r3(t), parts: {} };
      for (const part of parts) {
        const arr = new Float32Array(part.verts * 3);
        for (let vi = 0; vi < part.verts; vi++) {
          if (part.mesh.isSkinnedMesh) skinned(part.mesh, vi, p); else p.fromBufferAttribute(part.mesh.geometry.attributes.position, vi).applyMatrix4(part.mesh.matrixWorld);
          arr[vi * 3] = p.x; arr[vi * 3 + 1] = p.y; arr[vi * 3 + 2] = p.z;
        }
        (fr.parts[part.name] ||= []).push(offset);
        chunks.push(Buffer.from(arr.buffer));
        offset += arr.length;
      }
      frames.push(fr);
    }
    action.stop(); mixer.uncacheAction(clip);
    clips[clip.name] = { duration: r3(clip.duration), frames };
  }
  fs.writeFileSync(binFile, Buffer.concat(chunks));
  const out = {
    about: 'tools/joint_tracks.mjs animals: the posed mesh at 2 Hz per clip in the animal\'s root frame (x its left, y up, z forward; metres at the page\'s size). animal_<type>.bin holds float32 vertex positions; frames[].parts[<part>] lists the float offsets of each mesh of that part (body or tack_<name>), in parts order; part_meshes[<part>] gives each mesh\'s triangle index list.',
    type, file: info.file, key: k, version: VERSION, scale: scene.scale.x, length_m: info.length_m, width_m: info.width_m,
    part_meshes: parts.reduce((o, pt) => { (o[pt.name] ||= []).push({ verts: pt.verts, index: pt.index }); return o; }, {}),
    clips, seconds: (Date.now() - t0) / 1000,
  };
  fs.writeFileSync(file, JSON.stringify(out));
  return { name: `animal_${type}`, cached: false, clips: Object.keys(clips).length, seconds: out.seconds, mb: +(offset * 4 / 1e6).toFixed(1) };
}

const t0 = Date.now();
const res = [];
if (pos[0] === 'animals') {
  const types = pos[1] ? [pos[1]] : Object.keys(beastReg).filter((t) => beastReg[t]?.file);
  for (const t of types) res.push(await animal(t));
} else {
  const names = !pos[0] || pos[0] === 'all' ? Object.keys(reg).filter((n) => reg[n]?.file) : pos;
  for (const n of names) res.push(await character(n));
}
for (const r of res) console.log(JSON.stringify(r));
console.log(`joint_tracks: ${res.length} done (${res.filter((r) => r.cached).length} cached) in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
