#!/usr/bin/env node
// The world in cells, the middle version (perf batch 2, gen/perf/batch2/cells.md): a shipped section GLB's render
// meshes sorted into ground cells, so the page draws each material as one BatchedMesh and culls it cell by cell
// (web/src/cells.js). Run on the GLB tools/export_web_scene.mjs wrote (it also runs inside that tool), in place:
//   node tools/cells.mjs web/public/assets/<name>.glb [--size 8] [--out other.glb] [--check-only]
// What changes, and only that:
//   - each visible g_<material>__col / __nocol mesh keeps its node, name, material, vertices and triangles; its
//     triangles are re-ordered so each cell's are contiguous (cells on a square grid of `size` metres on the ground,
//     a triangle in the cell of its centroid, kept whole: a building's pieces may land in neighbouring cells), and
//     the node's extras get `cells: [cell, first triangle, triangles, ...]`;
//   - a __nocol mesh's vertices are re-ordered by first use (so each cell's vertices sit together); a __col mesh's
//     vertices stay exactly as they were (the page builds its collider from them: web/src/world.js fetchSection);
//   - the scene's extras get `cells: { v, size, boxes: [minX, minY, minZ, maxX, maxY, maxZ, ...] }` (page frame).
// Left whole and untouched: the hidden colliders (*hidden*), the water (g_water*), the cloth (g_cloth_*: an ambient
// module may sway it in the wind and finds it by name) and anything that isn't a single indexed triangle primitive.
// Every triangle stays once, so the triangles per material (tools/owners_verify.mjs, the contacts check) don't change;
// the tool checks that each mesh holds the same triangles (every vertex attribute, the winding) before and after, and
// fails without writing otherwise.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const SKIP = /hidden|^g_water|^g_cloth_/;
const RENDER = /^g_.+__(no)?col$/;

// a mesh's triangles as a sorted list of their vertices' values (rotated to start at the smallest, so the winding is
// kept), hashed: equal before and after means the same triangles, whatever their order or the vertices' order
function triangleHash(prim) {
  const idx = prim.getIndices().getArray();
  const attrs = prim.listSemantics().sort().map((s) => prim.getAttribute(s));
  const vkey = (i) => attrs.map((a) => { const n = a.getElementSize(), arr = a.getArray(); let s = ''; for (let k = 0; k < n; k++) s += arr[i * n + k] + ','; return s; }).join('|');
  const keys = new Map();
  const vk = (i) => { let k = keys.get(i); if (k === undefined) keys.set(i, (k = vkey(i))); return k; };
  const tris = [];
  for (let t = 0; t < idx.length; t += 3) {
    const v = [vk(idx[t]), vk(idx[t + 1]), vk(idx[t + 2])];
    const r = v[0] <= v[1] && v[0] <= v[2] ? 0 : v[1] <= v[2] ? 1 : 2;
    tris.push(v[r] + '/' + v[(r + 1) % 3] + '/' + v[(r + 2) % 3]);
  }
  tris.sort();
  return crypto.createHash('sha256').update(tris.join('\n')).digest('hex');
}

export function cellify(doc, { size = 8, log = () => {} } = {}) {
  const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const meshes = [];
  for (const node of scene.listChildren()) {
    const mesh = node.getMesh(), name = node.getName() || '';
    if (!mesh || !RENDER.test(name) || SKIP.test(name) || node.listChildren().length) continue;
    const prims = mesh.listPrimitives();
    if (prims.length !== 1 || prims[0].getMode() !== 4 || !prims[0].getIndices() || mesh.listParents().filter((p) => p.propertyType === 'Node').length !== 1) continue;
    meshes.push({ node, name, prim: prims[0], col: name.endsWith('__col') });
  }
  // every render triangle's cell (by its centroid, page frame) and the cells' boxes
  const cellOf = new Map(); // "kx,kz" -> { kx, kz, box }
  const p = [0, 0, 0], w = [0, 0, 0];
  for (const m of meshes) {
    const M = m.node.getWorldMatrix(), pos = m.prim.getAttribute('POSITION'), idx = m.prim.getIndices().getArray();
    const n = pos.getCount(), W = new Float64Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos.getElement(i, p);
      W[i * 3] = M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12];
      W[i * 3 + 1] = M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13];
      W[i * 3 + 2] = M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14];
    }
    m.keys = new Array(idx.length / 3);
    for (let t = 0; t < idx.length / 3; t++) {
      w[0] = w[2] = 0;
      for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k]; w[0] += W[v * 3]; w[2] += W[v * 3 + 2]; }
      const kx = Math.floor(w[0] / 3 / size), kz = Math.floor(w[2] / 3 / size), key = kx + ',' + kz;
      let c = cellOf.get(key);
      if (!c) cellOf.set(key, (c = { kx, kz, box: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity] }));
      for (let k = 0; k < 3; k++) {
        const v = idx[t * 3 + k];
        for (let a = 0; a < 3; a++) { c.box[a] = Math.min(c.box[a], W[v * 3 + a]); c.box[a + 3] = Math.max(c.box[a + 3], W[v * 3 + a]); }
      }
      m.keys[t] = c;
    }
  }
  // cells in rows (z, then x): a row of cells is one run of each mesh's index, so a page without multi-draw can join
  // neighbouring cells into one range
  const cells = [...cellOf.values()].sort((a, b) => a.kz - b.kz || a.kx - b.kx);
  cells.forEach((c, i) => { c.i = i; });
  let tris = 0;
  for (const m of meshes) {
    const ia = m.prim.getIndices(), idx = ia.getArray(), nt = idx.length / 3;
    const before = triangleHash(m.prim);
    // stable counting sort of the triangles by cell
    const count = new Int32Array(cells.length + 1);
    for (let t = 0; t < nt; t++) count[m.keys[t].i + 1]++;
    for (let c = 0; c < cells.length; c++) count[c + 1] += count[c];
    const first = count.slice(0, cells.length), order = new Int32Array(nt), fill = first.slice();
    for (let t = 0; t < nt; t++) order[fill[m.keys[t].i]++] = t;
    const out = new idx.constructor(idx.length);
    for (let j = 0; j < nt; j++) { const t = order[j]; out[j * 3] = idx[t * 3]; out[j * 3 + 1] = idx[t * 3 + 1]; out[j * 3 + 2] = idx[t * 3 + 2]; }
    // a render-only mesh's vertices by first use in the new order (each cell's vertices together)
    const shared = m.prim.listSemantics().some((s) => m.prim.getAttribute(s).listParents().filter((x) => x.propertyType === 'Primitive').length > 1);
    if (!m.col && !shared) {
      const n = m.prim.getAttribute('POSITION').getCount(), remap = new Int32Array(n).fill(-1), inverse = [];
      for (let j = 0; j < out.length; j++) { let r = remap[out[j]]; if (r < 0) { r = remap[out[j]] = inverse.length; inverse.push(out[j]); } out[j] = r; }
      for (let v = 0; v < n; v++) if (remap[v] < 0) { remap[v] = inverse.length; inverse.push(v); } // unused vertices keep a place at the end
      for (const s of m.prim.listSemantics()) {
        const a = m.prim.getAttribute(s), es = a.getElementSize(), src = a.getArray(), dst = new src.constructor(src.length);
        for (let v = 0; v < n; v++) for (let k = 0; k < es; k++) dst[v * es + k] = src[inverse[v] * es + k];
        a.setArray(dst);
      }
    }
    ia.setArray(out);
    if (triangleHash(m.prim) !== before) throw new Error(`cells: ${m.name} lost or changed triangles`);
    const ranges = [];
    for (let c = 0; c < cells.length; c++) { const n = count[c + 1] - count[c]; if (n) ranges.push(c, first[c], n); }
    m.node.setExtras({ ...m.node.getExtras(), cells: ranges });
    tris += nt;
  }
  const r3 = (x) => Math.round(x * 1000) / 1000;
  scene.setExtras({ ...scene.getExtras(), cells: { v: 1, size, boxes: cells.flatMap((c) => c.box.map(r3)) } });
  log(`cells: ${meshes.length} meshes, ${tris} triangles in ${cells.length} cells of ${size} m`);
  return { meshes: meshes.length, tris, cells: cells.length };
}

// the GLB packed as tools/export_web_scene.mjs packs it: textures stay external (tex/<name>.<hash>.webp)
export async function writeGlb(io, doc, dst) {
  const { json, resources } = await io.writeJSON(doc, { format: 'glb' });
  const binName = json.buffers[0].uri;
  delete json.buffers[0].uri;
  const pad = (buf, fill) => Buffer.concat([buf, Buffer.alloc((4 - (buf.length % 4)) % 4, fill)]);
  const jsonChunk = pad(Buffer.from(JSON.stringify(json)), 0x20), binChunk = pad(Buffer.from(resources[binName]), 0);
  const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  jh.writeUInt32LE(jsonChunk.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  bh.writeUInt32LE(binChunk.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(dst, Buffer.concat([head, jh, jsonChunk, bh, binChunk]));
}

export async function makeIO() {
  await MeshoptDecoder.ready; await MeshoptEncoder.ready;
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const src = args[0];
  if (!src || src.startsWith('--')) { console.error('usage: node tools/cells.mjs <section.glb> [--size 8] [--out other.glb] [--check-only]'); process.exit(1); }
  const io = await makeIO();
  const doc = await io.read(src);
  const r = cellify(doc, { size: +opt('--size', 8), log: console.log });
  if (args.includes('--check-only')) process.exit(0);
  const dst = opt('--out', src);
  const kb0 = fs.statSync(src).size;
  await writeGlb(io, doc, dst);
  console.log(`${path.basename(src)} ${(kb0 / 1024).toFixed(1)} KB -> ${path.basename(dst)} ${(fs.statSync(dst).size / 1024).toFixed(1)} KB (${r.cells} cells)`);
}
