#!/usr/bin/env node
// Far bodies for the crowd (perf batch 2, gen/perf/batch2/crowd.md; gen/perf/proposal.md rank 5): a second, simplified
// index over each character's and animal's body, made with meshoptimizer's simplifier and put into the same GLB. Only
// the index changes: the vertices (positions, UVs, normals, skin) stay as they are, so the crowd's bake drives the far
// body exactly as the full one, UV islands and seams untouched (no weld, no re-optimisation). The page (crowd.js) draws
// people past the tier's LOD distance with it (tiers.js peopleLod).
// What it adds to a GLB, and nothing else: one bufferView (meshopt-compressed like the file's own indices when the file
// uses EXT_meshopt_compression) and one accessor appended after the existing ones, and the mesh's extras
//   lod: { accessor, count, of, verts, tris, err }  (of: the full index count, verts: the vertex count; the page
//   uses the LOD only when both still match, so a file rewritten by another tool falls back to the full body)
// Every byte already in the file stays where it was. A rebuild (tools/character.mjs build, tools/animal.mjs) writes a
// GLB without it: run this again after. Run under the character build lock (flock /tmp/qingming_charbuild.lock).
//   node tools/char_lod.mjs all|<glb>... [--out <dir>] [--parts <min tris>] [--check]
//     all        web/public/assets/chars/*.glb and web/public/assets/animals/*.glb (the crowd's models)
//     --out      write the results into <dir> (same file names) instead of in place
//     --parts N  also carried props and tack (prop_*, tack_*) of N triangles or more (default: bodies only)
//     --check    list the files whose body has no LOD (exit 1 if any), write nothing
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const files = args.filter((a, i) => !a.startsWith('--') && !['--out', '--parts'].includes(args[i - 1]));
const out = opt('--out', null), partsMin = +opt('--parts', Infinity), check = args.includes('--check');
// the simplifier's targets: a quarter of the triangles, but never more error than 2% of the model's extent (about 3.4 cm
// on a 1.7 m figure, about a pixel at 20 m on a phone held upright); the border (open edges: sleeves, necks) locked
const RATIO = 0.25, MAX_ERR = 0.02, MIN_TRIS = 1000; // smaller meshes (a bird) are left as they are
const PART = /^(prop|tack)_/;

if (!files.length) { console.log('usage: node tools/char_lod.mjs all|<glb>... [--out <dir>] [--parts <min tris>] [--check]'); process.exit(0); }
const list = files[0] === 'all'
  ? ['chars', 'animals'].flatMap((d) => fs.readdirSync(path.join(ROOT, 'web/public/assets', d)).filter((f) => f.endsWith('.glb')).map((f) => path.join(ROOT, 'web/public/assets', d, f)))
  : files.map((f) => path.resolve(f));

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const a4 = (n) => (n + 3) & ~3;

function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  const jl = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  const bo = 20 + jl, bl = bo < b.length ? b.readUInt32LE(bo) : 0;
  return { json, bin: bo < b.length ? b.subarray(bo + 8, bo + 8 + bl) : Buffer.alloc(0) };
}

function writeGlb(file, json, bin) {
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  js = Buffer.concat([js, Buffer.alloc(a4(js.length) - js.length, 0x20)]);
  const bn = Buffer.concat([bin, Buffer.alloc(a4(bin.length) - bin.length)]);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bn.length, 8);
  const ch = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
  const tmp = `${file}.tmp${process.pid}`;
  fs.writeFileSync(tmp, Buffer.concat([head, ch(js.length, 0x4e4f534a), js, ch(bn.length, 0x004e4942), bn]));
  fs.renameSync(tmp, file); // a new file, never the old one's bytes rewritten (hard links elsewhere keep theirs)
}

let missing = 0;
const resplit = []; // characters' GLBs written in place
for (const file of list) {
  const name = path.relative(ROOT, file);
  const { json, bin } = readGlb(file);
  // the meshes to simplify: one triangle-list primitive on a skinned node; the body always, parts from --parts
  const skinned = new Set((json.nodes || []).filter((n) => n.mesh !== undefined && n.skin !== undefined).map((n) => n.mesh));
  const todo = (json.meshes || []).map((m, i) => ({ m, i })).filter(({ m, i }) => skinned.has(i) && m.primitives.length === 1 && (m.primitives[0].mode ?? 4) === 4
    && m.primitives[0].indices !== undefined && json.accessors[m.primitives[0].indices].count / 3 >= (PART.test(m.name || '') ? Math.max(partsMin, MIN_TRIS) : MIN_TRIS));
  const body = todo.find(({ m }) => !PART.test(m.name || ''));
  if (check) {
    if (body && !body.m.extras?.lod) { missing++; console.log(`${name}: no LOD`); } // a body too small for one (a bird) needs none
    continue;
  }
  const doc = await io.read(file);
  const meshes = doc.getRoot().listMeshes(); // in the file's order
  const comp = (json.extensionsUsed || []).includes('EXT_meshopt_compression');
  const fb = comp ? json.buffers.findIndex((b) => b.extensions?.EXT_meshopt_compression?.fallback) : -1;
  let tail = Buffer.from(bin.subarray(0, json.buffers[0].byteLength));
  const rows = [];
  for (const { m, i } of todo) {
    if (m.extras?.lod) { rows.push(`${m.name} has one`); continue; }
    const prim = meshes[i].listPrimitives()[0];
    const pos = prim.getAttribute('POSITION'), n = pos.getCount(), P = new Float32Array(n * 3), e = [];
    for (let k = 0; k < n; k++) { pos.getElement(k, e); P.set(e, k * 3); }
    const I = new Uint32Array(prim.getIndices().getArray());
    const [r, err] = MeshoptSimplifier.simplify(I, P, 3, Math.floor((I.length * RATIO) / 3) * 3, MAX_ERR, ['LockBorder']);
    if (r.length >= I.length * 0.8) { rows.push(`${m.name} kept (${I.length / 3} -> ${r.length / 3})`); continue; }
    const size = n > 65535 ? 4 : 2, raw = new Uint8Array(size === 2 ? new Uint16Array(r).buffer : r.buffer);
    const off = a4(tail.length), bv = { byteLength: raw.length, target: 34963 };
    if (comp && fb >= 0) {
      const enc = MeshoptEncoder.encodeGltfBuffer(raw, r.length, size, 'TRIANGLES');
      tail = Buffer.concat([tail, Buffer.alloc(off - tail.length), Buffer.from(enc)]);
      const fo = a4(json.buffers[fb].byteLength);
      Object.assign(bv, { buffer: fb, byteOffset: fo, extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: off, byteLength: enc.length, byteStride: size, mode: 'TRIANGLES', count: r.length } } });
      json.buffers[fb].byteLength = fo + raw.length;
    } else {
      tail = Buffer.concat([tail, Buffer.alloc(off - tail.length), Buffer.from(raw)]);
      Object.assign(bv, { buffer: 0, byteOffset: off });
    }
    json.buffers[0].byteLength = tail.length;
    json.bufferViews.push(bv);
    json.accessors.push({ bufferView: json.bufferViews.length - 1, componentType: size === 2 ? 5123 : 5125, count: r.length, type: 'SCALAR' });
    // err: the simplifier's error as a fraction of the model's largest extent (a figure's height: x 170 = cm on 1.7 m)
    const lod = { accessor: json.accessors.length - 1, count: r.length, of: I.length, verts: n, tris: r.length / 3, err: +err.toFixed(4) };
    m.extras = { ...(m.extras || {}), lod };
    rows.push(`${m.name} ${I.length / 3} -> ${lod.tris} (${(err * 170).toFixed(1)} cm on 1.7 m)`);
  }
  const dest = out ? path.join(out, path.basename(file)) : file;
  if (out) fs.mkdirSync(out, { recursive: true });
  if (rows.some((x) => !x.includes(' has one') && !x.includes(' kept '))) {
    writeGlb(dest, json, tail);
    if (!out && path.dirname(file) === path.join(ROOT, 'web/public/assets/chars')) resplit.push(path.basename(file, '.glb'));
  }
  else if (out) fs.copyFileSync(file, dest);
  console.log(`${name}: ${rows.join(', ') || 'nothing to simplify'}`);
}
if (check) { console.log(missing ? `${missing} without a LOD` : 'every body has a LOD'); process.exit(missing ? 1 : 0); }
// the page loads a character as a body and per-clip files cut from this GLB (tools/clip_split.mjs, perf batch 2): cut
// again from the new bytes, so the split never goes stale (a stale split makes the page load the full GLB)
if (resplit.length) execFileSync('node', [path.join(ROOT, 'tools/clip_split.mjs'), resplit.join(',')], { cwd: ROOT, stdio: 'inherit' });
