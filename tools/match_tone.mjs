#!/usr/bin/env node
// Scale a texture's per-channel mean to a reference texture's mean (times an optional gain), in place, so two
// swatches that the page blends (e.g. painted bricks and their plain wash) sit at the same tone.
// Usage: node tools/match_tone.mjs <ref.png> <target.png> [gain=1]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [ref, target, gainArg] = process.argv.slice(2);
if (!ref || !target) { console.error('usage: match_tone.mjs <ref.png> <target.png> [gain]'); process.exit(1); }
const gain = Number(gainArg || 1);
const mean = async (f) => (await sharp(f).removeAlpha().stats()).channels.slice(0, 3).map((c) => c.mean);
const [mr, mt] = [await mean(ref), await mean(target)];
const { data, info } = await sharp(target).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const k = mr.map((m, i) => (m / mt[i]) * gain);
for (let i = 0; i < data.length; i++) data[i] = Math.min(255, Math.round(data[i] * k[i % 3]));
await sharp(data, { raw: info }).png().toFile(target + '.tmp.png');
fs.renameSync(target + '.tmp.png', target);
console.log(`means ref ${mr.map(Math.round)} target ${mt.map(Math.round)} -> x ${k.map((x) => x.toFixed(2))}`);
