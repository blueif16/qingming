#!/usr/bin/env node
// Per-clip animation files (perf batch 2, round 2: gen/perf/batch2/clips.md; gen/perf/proposal.md rank 8, "First load"):
// a character's GLB carries every clip it has (IK variants included), but a section plays a few of them, so the page
// fetched whole casts it mostly never played. From each shipped character GLB (web/public/assets/chars/<name>.glb, which
// stays as it is: every tool and the review pages read it) this writes what world.html loads instead:
//   assets/chars/body/<name>.<hash>.glb          the body: meshes, skin, carried props, textures, the base clips (BASE)
//   assets/chars/clips/<name>/<clip>.<hash>.glb  each other clip alone: its animation and the nodes it moves (by name)
//   assets/chars/clips.json               per character: src (the first 8 hex of the full GLB's sha256, as the build's
//                                         content-hashed names: web/vite_asset_hashes.js), body, base, clips {clip: file}
// The bytes are carried, not re-encoded: the body keeps every buffer view of the meshes, skins, images and extras (a
// char_lod.mjs LOD index) as they are in the full GLB, and an animation's keys are cut out of the full GLB's meshopt
// streams in their stored (filtered) form and compressed again losslessly with the same filter, so every key decodes to
// the value the full GLB gives (checked for every array after writing; a mismatch fails the run). The page plays exactly
// what it played, and clip_meta.json's keys (per full GLB file and clip: n hips keys, duration) still hold.
// Run it last, after anything that writes the shipped character GLBs (tools/character.mjs build, tools/char_lod.mjs),
// under the character build lock:
//   flock /tmp/qingming_charbuild.lock node tools/clip_split.mjs [all|<name>,...] [--force] [--out <dir>]
//   node tools/clip_split.mjs --check     every character's split is current (exit 1 if not; writes nothing)
//   --pub <dir>: read characters.json and the full GLBs under <dir>/assets/chars instead of web/public (a test copy)
// A character whose full GLB is unchanged since its split (src) is skipped unless --force. The page loads the full GLB for
// a character the manifest doesn't list, lists stale (src differs from the build's hash of the full GLB), or whose
// characters.json clips it doesn't cover (world.js splitOf), so a forgotten run costs bytes, never a wrong clip.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const target = args.find((a, i) => !a.startsWith('--') && !['--out', '--pub'].includes(args[i - 1])) || 'all';
const force = args.includes('--force'), check = args.includes('--check');
const PUB = path.resolve(opt('--pub', path.join(ROOT, 'web/public'))); // where characters.json and the full GLBs are read
const OUT = path.resolve(opt('--out', PUB)); // the root the assets/... paths are written under
// the base clips, in every body: what a figure plays while a clip is on its way (people.js play)
const BASE = ['idle'];
const MANIFEST = 'assets/chars/clips.json';

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const a4 = (n) => (n + 3) & ~3;
const sha8 = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
const reg = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/chars/characters.json'), 'utf8'));
const names = Object.keys(reg).filter((n) => reg[n]?.file);
const want = target === 'all' ? names : target.split(',');
// a name not in characters.json (a character not built yet: character.mjs build lists it all the same) is skipped
for (const n of want.filter((x) => !reg[x]?.file)) console.log(`${n}: not in characters.json, skipped`);
const manFile = path.join(OUT, MANIFEST);
let man = {};
try { man = JSON.parse(fs.readFileSync(manFile, 'utf8')); } catch { /* none yet */ }
// a clip name as a file name (IK variants carry "~", which URLs and file systems take as it is)
// every file is named by its content (the first 8 hex of its sha256, as web/vite_asset_hashes.js names the files it
// hashes): the build leaves such names out of its page map (world.html stays small), the CDN serves them immutable
// (web/vercel.json), and a clip whose bytes didn't change keeps its name, so a visitor's cache keeps it across deploys
const fileOf = (name, clip, buf) => `assets/chars/clips/${name}/${clip.replace(/[^\w~-]/g, '_')}.${sha8(buf)}.glb`;
const bodyOf = (name, buf) => `assets/chars/body/${name}.${sha8(buf)}.glb`;
const nameOf = (f) => f.replace(/(\.[0-9a-f]{8})?\.glb$/, ''); // a body file's character

// is this character's split current: its src, body and every clip file there, and every clip characters.json lists
// either in the body or in a file
function current(name, full) {
  const e = man.chars?.[name];
  if (!e || e.src !== sha8(full)) return false;
  if (!fs.existsSync(path.join(OUT, e.body))) return false;
  for (const f of Object.values(e.clips)) if (!fs.existsSync(path.join(OUT, f))) return false;
  return (reg[name].clips || []).every((c) => e.base.includes(c) || e.clips[c]);
}

if (check) {
  const stale = names.filter((n) => !current(n, fs.readFileSync(path.join(PUB, reg[n].file))));
  for (const n of stale) console.log(`${n}: split ${man.chars?.[n] ? 'stale' : 'missing'}`);
  console.log(stale.length ? `clip split: FAIL (${stale.length} stale; run flock /tmp/qingming_charbuild.lock node tools/clip_split.mjs)` : `clip split: PASS (${names.length} characters)`);
  process.exit(stale.length ? 1 : 0);
}

// ---------------------------------------------------------------- GLB bytes
function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const jl = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + jl).toString('utf8'));
  const bo = 20 + jl, bin = bo < buf.length ? buf.subarray(bo + 8, bo + 8 + buf.readUInt32LE(bo)) : Buffer.alloc(0);
  return { json, bin };
}
function packGlb(json, bin) {
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  js = Buffer.concat([js, Buffer.alloc(a4(js.length) - js.length, 0x20)]);
  const bn = Buffer.concat([bin, Buffer.alloc(a4(bin.length) - bin.length)]);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bn.length, 8);
  const ch = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
  return Buffer.concat([head, ch(js.length, 0x4e4f534a), js, ch(bn.length, 0x004e4942), bn]);
}
const COMP = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

// the source GLB: its JSON, and each buffer view's bytes as stored before any meshopt filter is undone (decoded once)
function source(buf) {
  const { json, bin } = parseGlb(buf);
  const views = new Map();
  const view = (i) => {
    if (views.has(i)) return views.get(i);
    const bv = json.bufferViews[i], m = bv.extensions?.EXT_meshopt_compression;
    let out;
    if (m) {
      out = new Uint8Array(m.count * m.byteStride);
      // no filter given: the stored (filtered) elements, which the same filter in the new file turns into the same values
      MeshoptDecoder.decodeGltfBuffer(out, m.count, m.byteStride, bin.subarray(m.byteOffset, m.byteOffset + m.byteLength), m.mode);
    } else out = new Uint8Array(bin.buffer, bin.byteOffset + (bv.byteOffset || 0), bv.byteLength);
    views.set(i, out);
    return out;
  };
  // an accessor's stored elements: { bytes, stride, filter }
  const elements = (ai) => {
    const a = json.accessors[ai];
    if (a.sparse || a.bufferView === undefined) throw new Error(`accessor ${ai}: sparse or without a buffer view`);
    const bv = json.bufferViews[a.bufferView], m = bv.extensions?.EXT_meshopt_compression;
    const size = COMP[a.componentType] * NUM[a.type], stride = m ? m.byteStride : bv.byteStride || size;
    if (stride !== a4(size)) throw new Error(`accessor ${ai}: stride ${stride} for ${size}-byte elements`);
    const off = a.byteOffset || 0;
    return { bytes: view(a.bufferView).subarray(off, off + a.count * stride), stride, filter: m?.filter || 'NONE', meshopt: !!m };
  };
  return { json, bin, view, elements };
}

// a new GLB being written: buffer 0 holds the bytes, buffer 1 is meshopt's fallback (no bytes, only its length)
function writer() {
  const parts = [];
  let binLen = 0, fbLen = 0;
  const put = (bytes) => { const off = a4(binLen); if (off > binLen) parts.push(Buffer.alloc(off - binLen)); parts.push(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)); binLen = off + bytes.byteLength; return off; };
  const bufferViews = [];
  return {
    bufferViews,
    // a buffer view copied as it is (its compressed bytes when meshopt-compressed)
    copyView(src, i) {
      const bv = { ...src.json.bufferViews[i] }, m = bv.extensions?.EXT_meshopt_compression;
      if (m) {
        const off = put(src.bin.subarray(m.byteOffset, m.byteOffset + m.byteLength));
        const fo = a4(fbLen); fbLen = fo + bv.byteLength;
        bufferViews.push({ ...bv, buffer: 1, byteOffset: fo, extensions: { ...bv.extensions, EXT_meshopt_compression: { ...m, buffer: 0, byteOffset: off } } });
      } else {
        const off = put(src.bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength));
        bufferViews.push({ ...bv, buffer: 0, byteOffset: off });
      }
      return bufferViews.length - 1;
    },
    // stored elements of one stride and filter as one meshopt view (lossless; the filter is undone on decode)
    encodeView(bytes, stride, filter) {
      const count = bytes.length / stride;
      const enc = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, 'ATTRIBUTES', 0);
      const off = put(enc), fo = a4(fbLen); fbLen = fo + bytes.length;
      const ext = { buffer: 0, byteOffset: off, byteLength: enc.length, byteStride: stride, mode: 'ATTRIBUTES', count };
      if (filter !== 'NONE') ext.filter = filter;
      bufferViews.push({ buffer: 1, byteOffset: fo, byteLength: bytes.length, extensions: { EXT_meshopt_compression: ext } });
      return bufferViews.length - 1;
    },
    finish(json) {
      json.bufferViews = bufferViews;
      json.buffers = [{ byteLength: binLen }, { byteLength: fbLen, extensions: { EXT_meshopt_compression: { fallback: true } } }];
      return packGlb(json, Buffer.concat(parts));
    },
  };
}

// accessors (by source index) re-written into views grouped by stride and filter, as the source groups them; returns the
// new accessor JSON per source index
function writeAccessors(src, w, list, newIndex) {
  const groups = new Map();
  for (const ai of list) {
    const e = src.elements(ai);
    if (!e.meshopt) throw new Error(`accessor ${ai}: animation data outside meshopt`);
    const k = `${e.stride}|${e.filter}`;
    if (!groups.has(k)) groups.set(k, { stride: e.stride, filter: e.filter, items: [] });
    groups.get(k).items.push({ ai, bytes: e.bytes });
  }
  const out = new Map();
  for (const g of groups.values()) {
    const total = g.items.reduce((a, x) => a + x.bytes.length, 0), data = new Uint8Array(total);
    let off = 0;
    for (const x of g.items) { data.set(x.bytes, off); x.off = off; off += x.bytes.length; }
    const bv = w.encodeView(data, g.stride, g.filter);
    for (const x of g.items) {
      const a = { ...src.json.accessors[x.ai], bufferView: bv, byteOffset: x.off };
      if (!a.byteOffset) delete a.byteOffset;
      out.set(x.ai, a);
    }
  }
  return list.map((ai) => out.get(ai));
}

// ---------------------------------------------------------------- one clip alone
function clipGlb(src, ai) {
  const j = src.json, anim = j.animations[ai];
  // the nodes it moves and their ancestors, in the source's order (names, rest transforms and the hierarchy)
  const parent = new Map();
  j.nodes.forEach((n, i) => (n.children || []).forEach((c) => parent.set(c, i)));
  const keep = new Set();
  for (const ch of anim.channels) for (let n = ch.target.node; n !== undefined && !keep.has(n); n = parent.get(n)) keep.add(n);
  const order = [...keep].sort((a, b) => a - b), nodeIx = new Map(order.map((n, i) => [n, i]));
  const nodes = order.map((n) => {
    const s = j.nodes[n], o = { name: s.name };
    for (const k of ['translation', 'rotation', 'scale', 'matrix']) if (s[k]) o[k] = s[k];
    const kids = (s.children || []).filter((c) => keep.has(c)).map((c) => nodeIx.get(c));
    if (kids.length) o.children = kids;
    return o;
  });
  const accs = [...new Set(anim.samplers.flatMap((s) => [s.input, s.output]))];
  const w = writer(), accIx = new Map(accs.map((a, i) => [a, i]));
  const json = {
    asset: { version: '2.0', generator: 'qingming tools/clip_split.mjs' },
    extensionsUsed: ['EXT_meshopt_compression'], extensionsRequired: ['EXT_meshopt_compression'],
    scene: 0, scenes: [{ nodes: order.filter((n) => !keep.has(parent.get(n))).map((n) => nodeIx.get(n)) }], nodes,
    animations: [{ name: anim.name, samplers: anim.samplers.map((s) => ({ ...s, input: accIx.get(s.input), output: accIx.get(s.output) })),
      channels: anim.channels.map((c) => ({ ...c, target: { ...c.target, node: nodeIx.get(c.target.node) } })) }],
    accessors: writeAccessors(src, w, accs),
  };
  return w.finish(json);
}

// ---------------------------------------------------------------- the body
function bodyGlb(src, base) {
  const j = src.json;
  const keepAnims = (j.animations || []).filter((a) => base.includes(a.name));
  const animAcc = new Set(keepAnims.flatMap((a) => a.samplers.flatMap((s) => [s.input, s.output])));
  // what the body reads besides the clips: mesh attributes, indices and morph targets, skins' inverse bind matrices,
  // and mesh extras that point at an accessor ({ accessor: i }: char_lod.mjs's lod)
  const other = new Set();
  for (const m of j.meshes || []) {
    for (const p of m.primitives) {
      for (const a of Object.values(p.attributes)) other.add(a);
      if (p.indices !== undefined) other.add(p.indices);
      for (const t of p.targets || []) for (const a of Object.values(t)) other.add(a);
    }
    for (const v of Object.values(m.extras || {})) if (v && typeof v === 'object' && Number.isInteger(v.accessor)) other.add(v.accessor);
  }
  for (const s of j.skins || []) if (s.inverseBindMatrices !== undefined) other.add(s.inverseBindMatrices);
  for (const a of other) if (animAcc.has(a)) throw new Error(`accessor ${a} is read by a clip and by the body`);
  const w = writer();
  // the body's own buffer views, as they are (images too)
  const viewIx = new Map();
  const copy = (bv) => { if (!viewIx.has(bv)) viewIx.set(bv, w.copyView(src, bv)); return viewIx.get(bv); };
  const otherList = [...other].sort((a, b) => a - b);
  // (an accessor without a buffer view is all zeros, as glTF allows: kept so)
  const accessors = otherList.map((ai) => (j.accessors[ai].bufferView === undefined ? { ...j.accessors[ai] } : { ...j.accessors[ai], bufferView: copy(j.accessors[ai].bufferView) }));
  const images = (j.images || []).map((im) => (im.bufferView !== undefined ? { ...im, bufferView: copy(im.bufferView) } : im));
  const animList = [...animAcc].sort((a, b) => a - b);
  accessors.push(...writeAccessors(src, w, animList));
  const accIx = new Map([...otherList, ...animList].map((a, i) => [a, i]));
  const A = (a) => accIx.get(a);
  const json = JSON.parse(JSON.stringify(j));
  delete json.bufferViews; delete json.buffers;
  json.accessors = accessors;
  if (json.images) json.images = images;
  for (const m of json.meshes || []) {
    for (const p of m.primitives) {
      for (const k of Object.keys(p.attributes)) p.attributes[k] = A(p.attributes[k]);
      if (p.indices !== undefined) p.indices = A(p.indices);
      for (const t of p.targets || []) for (const k of Object.keys(t)) t[k] = A(t[k]);
    }
    for (const v of Object.values(m.extras || {})) if (v && typeof v === 'object' && Number.isInteger(v.accessor)) v.accessor = A(v.accessor);
  }
  for (const s of json.skins || []) if (s.inverseBindMatrices !== undefined) s.inverseBindMatrices = A(s.inverseBindMatrices);
  json.animations = keepAnims.map((a) => ({ ...a, samplers: a.samplers.map((s) => ({ ...s, input: A(s.input), output: A(s.output) })) }));
  if (!json.animations.length) delete json.animations;
  json.asset = { ...json.asset, generator: `${json.asset?.generator || ''} + qingming tools/clip_split.mjs`.trim() };
  return w.finish(json);
}

// ---------------------------------------------------------------- the read-back check (as gltf-transform decodes them)
const same = (a, b) => a === b || (a && b && a.length === b.length && a.constructor === b.constructor && Buffer.compare(Buffer.from(a.buffer, a.byteOffset, a.byteLength), Buffer.from(b.buffer, b.byteOffset, b.byteLength)) === 0);
const clipsOf = (doc) => doc.getRoot().listAnimations().map((a) => ({ name: a.getName(), channels: a.listChannels().map((c) => ({
  node: c.getTargetNode()?.getName(), path: c.getTargetPath(), interp: c.getSampler().getInterpolation(),
  input: c.getSampler().getInput().getArray(), output: c.getSampler().getOutput().getArray(), norm: c.getSampler().getOutput().getNormalized() })) }));
const sameClip = (a, b) => !!b && a.name === b.name && a.channels.length === b.channels.length && a.channels.every((c, i) => {
  const d = b.channels[i];
  return c.node === d.node && c.path === d.path && c.interp === d.interp && c.norm === d.norm && same(c.input, d.input) && same(c.output, d.output);
});
const bodyPrint = (doc, json) => {
  const root = doc.getRoot();
  return {
    meshes: root.listMeshes().map((m, i) => ({ name: m.getName(), extras: JSON.stringify(Object.fromEntries(Object.entries(m.getExtras() || {}).map(([k, v]) => [k, v?.accessor !== undefined ? { ...v, accessor: undefined } : v]))),
      lods: Object.values(json.meshes[i].extras || {}).filter((v) => v?.accessor !== undefined).map((v) => root.listAccessors()[v.accessor].getArray()),
      prims: m.listPrimitives().map((p) => ({ idx: p.getIndices()?.getArray(), mode: p.getMode(), mat: p.getMaterial()?.getName(),
        attrs: p.listSemantics().map((s) => [s, p.getAttribute(s).getArray(), p.getAttribute(s).getNormalized()]) })) })),
    skins: root.listSkins().map((s) => ({ ibm: s.getInverseBindMatrices()?.getArray(), joints: s.listJoints().map((x) => x.getName()).join() })),
    images: root.listTextures().map((t) => t.getImage()),
    nodes: root.listNodes().map((n) => [n.getName(), ...n.getTranslation(), ...n.getRotation(), ...n.getScale(), n.getMesh()?.getName() || '', n.getSkin() ? 1 : 0, n.listChildren().map((c) => c.getName()).join('/')].join(',')).join(';'),
  };
};
const sameBody = (a, b) => a.nodes === b.nodes && a.meshes.length === b.meshes.length && a.skins.length === b.skins.length && a.images.length === b.images.length
  && a.images.every((im, i) => same(im, b.images[i])) && a.skins.every((s, i) => same(s.ibm, b.skins[i].ibm) && s.joints === b.skins[i].joints)
  && a.meshes.every((m, i) => { const n = b.meshes[i];
    return m.name === n.name && m.extras === n.extras && m.lods.length === n.lods.length && m.lods.every((x, k) => same(x, n.lods[k])) && m.prims.length === n.prims.length
      && m.prims.every((p, k) => { const q = n.prims[k]; return same(p.idx, q.idx) && p.mode === q.mode && p.mat === q.mat && p.attrs.length === q.attrs.length
        && p.attrs.every(([s, arr, nm], x) => s === q.attrs[x][0] && nm === q.attrs[x][2] && same(arr, q.attrs[x][1])); }); });

// ---------------------------------------------------------------- one character
const write = (rel, buf) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = `${f}.tmp${process.pid}`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, f); // a new file (the build's hashed names are hard links to the old one)
};
async function split(name) {
  const full = fs.readFileSync(path.join(PUB, reg[name].file));
  const src = source(full);
  const doc = await io.readBinary(new Uint8Array(full));
  const want = clipsOf(doc);
  const anims = src.json.animations || [];
  const entry = { src: sha8(full), body: null, base: BASE.filter((c) => anims.some((a) => a.name === c)), clips: {} };
  let clipBytes = 0;
  for (let ai = 0; ai < anims.length; ai++) {
    const clip = anims[ai].name;
    if (entry.base.includes(clip)) continue;
    if (entry.clips[clip]) throw new Error(`${name}: two clips named ${clip}`);
    const buf = clipGlb(src, ai);
    const back = clipsOf(await io.readBinary(new Uint8Array(buf)));
    if (back.length !== 1 || !sameClip(want[ai], back[0])) throw new Error(`${name}: clip ${clip} reads back different`);
    const rel = fileOf(name, clip, buf);
    write(rel, buf);
    entry.clips[clip] = rel;
    clipBytes += buf.length;
  }
  const body = bodyGlb(src, entry.base);
  const bdoc = await io.readBinary(new Uint8Array(body));
  const okBody = sameBody(bodyPrint(doc, src.json), bodyPrint(bdoc, parseGlb(body).json));
  const baseWant = want.filter((c) => entry.base.includes(c.name)), baseBack = clipsOf(bdoc);
  if (!okBody || baseBack.length !== baseWant.length || !baseWant.every((c, i) => sameClip(c, baseBack[i]))) throw new Error(`${name}: the body reads back different`);
  entry.body = bodyOf(name, body);
  write(entry.body, body);
  return { name, entry, full: full.length, body: body.length, clipBytes, n: Object.keys(entry.clips).length };
}

man = { about: 'Per-clip animation files (tools/clip_split.mjs): per character, src (first 8 hex of the sha256 of its full GLB, characters.json file), body (meshes, skin, props, textures and the base clips), base (the clips in the body), clips (every other clip, a file each). world.js loads a body and the clips a section\'s routines play while the section loads; a character missing here, stale (src) or with a characters.json clip in neither the body nor a file is loaded from its full GLB.',
  base: BASE, chars: Object.fromEntries(Object.entries(man.chars || {}).filter(([n]) => reg[n]?.file)) };
// the manifest is replaced whole (a temp file renamed), after each character: a run that fails part way leaves every
// character it finished current and the one it failed on unlisted (the page loads that one's full GLB), and exits 1
const save = () => {
  man.chars = Object.fromEntries(Object.keys(man.chars).sort().map((n) => [n, man.chars[n]]));
  fs.mkdirSync(path.dirname(manFile), { recursive: true });
  const tmp = `${manFile}.tmp${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(man, null, 1) + '\n');
  fs.renameSync(tmp, manFile);
};
const sum = { full: 0, body: 0, clips: 0 };
try {
  for (const name of want.filter((x) => reg[x]?.file)) {
    if (!force && current(name, fs.readFileSync(path.join(PUB, reg[name].file)))) { console.log(`${name}: current`); continue; }
    // unlisted while its files are rewritten (the page loads its full GLB meanwhile)
    if (man.chars[name]) { delete man.chars[name]; save(); }
    const r = await split(name);
    man.chars[name] = r.entry;
    save();
    // its files the manifest no longer names (an older cut, a clip it no longer has)
    const keep = new Set([r.entry.body, ...Object.values(r.entry.clips)].map((f) => path.basename(f)));
    const dir = path.join(OUT, `assets/chars/clips/${name}`), bdir = path.join(OUT, 'assets/chars/body');
    if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (!keep.has(f)) fs.rmSync(path.join(dir, f));
    for (const f of fs.readdirSync(bdir)) if (nameOf(f) === name && !keep.has(f)) fs.rmSync(path.join(bdir, f));
    sum.full += r.full; sum.body += r.body; sum.clips += r.clipBytes;
    console.log(`${name.padEnd(19)} full ${(r.full / 1024).toFixed(0).padStart(5)} KB -> body ${(r.body / 1024).toFixed(0).padStart(4)} KB + ${String(r.n).padStart(2)} clips ${(r.clipBytes / 1024).toFixed(0).padStart(5)} KB`);
  }
} catch (err) {
  console.error(`clip_split: FAILED: ${err.stack || err}`);
  process.exit(1);
}
// characters no longer in the registry: their files go
for (const d of ['body', 'clips']) {
  const dir = path.join(OUT, 'assets/chars', d);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) if (!reg[nameOf(f)]?.file) fs.rmSync(path.join(dir, f), { recursive: true });
}
save();
if (sum.full) console.log(`written: full ${(sum.full / 1048576).toFixed(2)} MB -> bodies ${(sum.body / 1048576).toFixed(2)} MB + clips ${(sum.clips / 1048576).toFixed(2)} MB; ${path.relative(ROOT, manFile) || manFile}`);
