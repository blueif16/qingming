#!/usr/bin/env node
// Pack textures side by side into one strip (all resized to the first one's size), e.g. the ground and road washes
// that the page's blend shader samples as two halves of one map.
// Usage: node tools/join_textures.mjs <out.png> <a.png> <b.png> [more.png ...]
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [out, ...ins] = process.argv.slice(2);
if (!out || ins.length < 2) { console.error('usage: join_textures.mjs <out.png> <a.png> <b.png> ...'); process.exit(1); }
const { width: w, height: h } = await sharp(ins[0]).metadata();
const parts = await Promise.all(ins.map((f) => sharp(f).removeAlpha().resize(w, h, { fit: 'fill' }).png().toBuffer()));
await sharp({ create: { width: w * ins.length, height: h, channels: 3, background: '#000' } })
  .composite(parts.map((input, i) => ({ input, left: i * w, top: 0 }))).png().toFile(out);
console.log(`${ins.length} x ${w}x${h} -> ${out}`);
