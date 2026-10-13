#!/usr/bin/env node
// Put one image of another build into a GLB, byte for byte, and leave everything else exactly as it is: only that
// image's bufferView changes length and the bufferViews after it move (plain and EXT_meshopt_compression offsets).
//   node tools/glb_swap_image.mjs <into.glb> <from.glb> <out.glb> [image index, default 0]
// Used by the eye fix where a full rebuild would also bring in other changes (a prop rebuilt since the character's
// last build): the shipped GLB keeps its props and clips, and takes only the new body texture.
import fs from 'node:fs';

function parse(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  const jl = b.readUInt32LE(12), json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  const bl = b.readUInt32LE(20 + jl), bin = b.subarray(28 + jl, 28 + jl + bl);
  return { json, bin };
}
const imageBytes = (g, i) => {
  const bv = g.json.bufferViews[g.json.images[i].bufferView];
  return g.bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
};
const [into, from, out, idxArg] = process.argv.slice(2);
const idx = +(idxArg || 0);
const A = parse(into), B = parse(from);
const img = imageBytes(B, idx);
const bvi = A.json.images[idx].bufferView, bv = A.json.bufferViews[bvi];
if (bv.buffer !== 0) throw new Error('the image is not in the GLB buffer');
const off = bv.byteOffset || 0, oldLen = bv.byteLength, pad = (n) => (n + 3) & ~3;
const delta = pad(img.length) - pad(oldLen);
// the images' mime must match
if (A.json.images[idx].mimeType !== B.json.images[idx].mimeType) throw new Error('image mime types differ');
const bin = Buffer.concat([A.bin.subarray(0, off), img, Buffer.alloc(pad(img.length) - img.length), A.bin.subarray(off + pad(oldLen))]);
bv.byteLength = img.length;
A.json.bufferViews.forEach((v, i) => {
  if (i !== bvi && v.buffer === 0 && (v.byteOffset || 0) > off) v.byteOffset += delta;
  const m = v.extensions?.EXT_meshopt_compression;
  if (m && m.buffer === 0 && (m.byteOffset || 0) > off) m.byteOffset += delta;
});
A.json.buffers[0].byteLength = bin.length;
let js = Buffer.from(JSON.stringify(A.json), 'utf8');
js = Buffer.concat([js, Buffer.alloc(pad(js.length) - js.length, 0x20)]);
const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(out, Buffer.concat([head, jh, js, bh, bin]));
console.log(`${out}: image ${idx} ${oldLen} -> ${img.length} bytes from ${from}`);
