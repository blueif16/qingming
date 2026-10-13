#!/usr/bin/env node
// Ship a section's walkable scene to the web page, the same way the street B1 slice was shipped:
//   gen/sections/<name>/web_build/<name>_raw.glb (written by blender/<name>_scene.py export)
//     -> gltf-transform optimize (meshopt, webp capped at 1024 px: the swatches are 512, the face atlases 1024; no join/instance/palette/flatten/simplify, so the
//        "<material>__col" mesh names the page reads for collision survive; attributes are not pruned, so the
//        ground keeps its blend weight in TEXCOORD_1)
//     -> web/public/assets/<name>.glb
//     -> textures out to web/public/assets/tex/<name>.<hash>.webp, shared by every section (the GLB keeps geometry)
//   plus the section's placement data -> web/public/assets/<name>/ (layout.json from the scroll map, scene.json) and
//   its scroll_index.json (tools/scroll_index.mjs: where its painted figures are on the original painting, for the HUD).
// Boats (map/BUILDING.md "Boats and water"): when the section's layout lists boats (vehicles with a boat_ slug), their
// movable roots go to a GLB of their own, web/public/assets/<name>_boats.glb, built from the layout through the boat kit
// (blender/build_boats.py, headless in a Blender slot, rerun when the layout, build_choices.json or the kit is newer than
// its raw GLB) and shipped with the same optimize step. The step keeps every boat's root (boat:<map id>, both detail
// levels), its nodes (body, deck__col, roof__col, rim__col, board__edge, wet__ring, moving parts with their pivots,
// line_* ropes) and their extras; the tool checks that against the raw GLB and fails if anything was lost. The boats'
// manifest (kind, motion, sizes, triangles, kit options) goes to web/public/assets/<name>/boats.json.
// Usage (from qingming/): node tools/export_web_scene.mjs <name> [options]
//   --src <dir>       the section's data (layout.json, scene.json, people.json, build_choices.json, backdrop.json);
//                     default sections/<name>
//   --raw <glb>       the raw scene GLB; default gen/sections/<name>/web_build/<name>_raw.glb
//   --out <glb>       where the shipped GLB goes (a set piece measured outside the page: nothing is written into web/
//                     unless the path is under web/public/assets/); its textures go to <dir of out>/tex/ and the data
//                     copy and the scroll index are skipped unless --data is given
//   --data <dir>      where the section's data files go; default web/public/assets/<name>/ (with the default --out)
//   --no-boats        skip the boats GLB; --boats-only ships only the boats (the scene GLB is left as it is)
//   --rebuild-boats   rebuild the boats' raw GLB even when it looks current
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const name = args[0];
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
if (!name || name.startsWith('--')) { console.error('usage: node tools/export_web_scene.mjs <name> [--src dir] [--raw glb] [--out glb] [--data dir] [--no-boats|--boats-only] [--rebuild-boats]'); process.exit(1); }
const abs = (p) => path.resolve(process.cwd(), p);
const src = opt('--src') ? abs(opt('--src')) : path.join(ROOT, `sections/${name}`);
const raw = opt('--raw') ? abs(opt('--raw')) : path.join(ROOT, `gen/sections/${name}/web_build/${name}_raw.glb`);
const assets = path.join(ROOT, 'web/public/assets');
const out = opt('--out') ? abs(opt('--out')) : path.join(assets, `${name}.glb`);
const inWeb = path.resolve(path.dirname(out)) === assets;
const texDir = inWeb ? path.join(assets, 'tex') : path.join(path.dirname(out), 'tex');
const dataDir = opt('--data') ? abs(opt('--data')) : (opt('--out') ? null : path.join(assets, name));
const boatsOnly = flag('--boats-only');
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(1) + ' KB';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
await MeshoptDecoder.ready; await MeshoptEncoder.ready;

// optimize a raw GLB into `dst`, its textures moved out to texDir (shared by content hash; the GLB keeps geometry)
async function ship(rawGlb, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  execFileSync(path.join(ROOT, 'tools/node_modules/.bin/gltf-transform'), [
    'optimize', rawGlb, dst, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024',
    '--prune-attributes', 'false', '--join', 'false', '--instance', 'false', '--palette', 'false', '--flatten', 'false', '--simplify', 'false',
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  // shared textures (the user, 2026-10-11: "mind the sizings"): every section is built from the same kit swatches, so
  // the textures leave the GLB and live once in web/public/assets/tex/, named by content (<name>.<hash>.webp); the GLB
  // points at them by URI, every section that uses a swatch fetches the same file, and the page shares one material per
  // name (web/src/world.js). The GLB keeps only its geometry.
  const doc = await io.read(dst);
  fs.mkdirSync(texDir, { recursive: true });
  const shared = [];
  for (const t of doc.getRoot().listTextures()) {
    const img = t.getImage();
    const file = `${t.getName() || 'tex'}.${crypto.createHash('sha256').update(img).digest('hex').slice(0, 8)}.webp`;
    if (!fs.existsSync(path.join(texDir, file))) fs.writeFileSync(path.join(texDir, file), img);
    t.setURI(`tex/${file}`);
    shared.push(file);
  }
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
  return shared;
}

if (!boatsOnly) {
  if (!fs.existsSync(raw)) { console.error(`missing ${raw}: run blender/${name}_scene.py build + export first`); process.exit(1); }
  const shared = await ship(raw, out);
  console.log(`${path.relative(ROOT, raw)} ${kb(raw)} -> ${path.relative(ROOT, out)} ${kb(out)} (geometry), ${shared.length} shared textures in ${path.relative(ROOT, texDir)}/`);
}

// ---------------------------------------------------------------- boats
const layoutPath = path.join(src, 'layout.json');
const layout = fs.existsSync(layoutPath) ? JSON.parse(fs.readFileSync(layoutPath, 'utf8')) : null;
const boatIds = Object.entries(layout?.entities || {}).filter(([id, e]) => e.kind === 'vehicle' && id.split('.').pop().startsWith('boat_')).map(([id]) => id);
let boatsManifest = null;
if (boatIds.length && !flag('--no-boats')) {
  const buildDir = path.dirname(raw);
  const boatsRaw = path.join(buildDir, `${name}_boats_raw.glb`);
  const boatsJson = path.join(buildDir, `${name}_boats.json`);
  const boatsOut = path.join(path.dirname(out), `${name}_boats.glb`);
  const inputs = [layoutPath, path.join(src, 'build_choices.json'), path.join(ROOT, 'blender/kit_boats.py'), path.join(ROOT, 'blender/build_boats.py')].filter((f) => fs.existsSync(f));
  const stale = flag('--rebuild-boats') || !fs.existsSync(boatsRaw) || !fs.existsSync(boatsJson)
    || inputs.some((f) => fs.statSync(f).mtimeMs > fs.statSync(boatsRaw).mtimeMs);
  if (stale) {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log(`boats: building ${boatIds.length} from ${path.relative(ROOT, layoutPath)} through the kit (blender/build_boats.py) ...`);
    const log = execFileSync(path.join(ROOT, 'tools/blender_slot.sh'), ['-b', '--factory-startup', '--python', path.join(ROOT, 'blender/build_boats.py'), '--', src, boatsRaw],
      { encoding: 'utf8', maxBuffer: 64 << 20 });
    const line = log.split('\n').find((l) => l.startsWith('BOATS_STATS'));
    if (!line || !fs.existsSync(boatsRaw)) { console.error(log.split('\n').filter((l) => /Error|Traceback|File "/.test(l)).slice(-12).join('\n')); console.error('boats: the build failed'); process.exit(1); }
    console.log(`  ${line}`);
  }
  await ship(boatsRaw, boatsOut);
  // the optimize step must keep each boat whole: every node that holds extras or children in the raw GLB is still there
  // by name, with the same extras (a moving part's pivot and range, a line's ends, the root's points)
  const nodesOf = async (f) => { const doc = await io.read(f); return new Map(doc.getRoot().listNodes().map((n) => [n.getName(), n])); };
  const [a, b] = [await nodesOf(boatsRaw), await nodesOf(boatsOut)];
  const lost = [];
  let roots = 0, kept = 0;
  for (const [n, node] of a) {
    const ex = node.getExtras(), kids = node.listChildren().length;
    if (n.startsWith('boat:')) roots++;
    if (!kids && !Object.keys(ex).length) continue;
    const m = b.get(n);
    if (!m) { lost.push(`${n} (node)`); continue; }
    if (JSON.stringify(m.getExtras()) !== JSON.stringify(ex)) { lost.push(`${n} (extras)`); continue; }
    if (n.startsWith('line_') || /^(sweep|oar_|mast)/.test(n)) {
      const [t0, t1] = [node.getTranslation(), m.getTranslation()];
      if (Math.hypot(t0[0] - t1[0], t0[1] - t1[1], t0[2] - t1[2]) > 1e-3) { lost.push(`${n} (pivot moved)`); continue; }
    }
    kept++;
  }
  boatsManifest = JSON.parse(fs.readFileSync(boatsJson, 'utf8'));
  boatsManifest.glb = path.basename(boatsOut);
  console.log(`boats: ${path.relative(ROOT, boatsRaw)} ${kb(boatsRaw)} -> ${path.relative(ROOT, boatsOut)} ${kb(boatsOut)}; ${Object.keys(boatsManifest.boats).length} boats, ${roots} roots (both detail levels), ${kept} nodes with extras or children kept${lost.length ? `; LOST ${lost.length}: ${lost.slice(0, 12).join(', ')}` : ', none lost'}`);
  if (lost.length) process.exit(1);
}

// ---------------------------------------------------------------- data
if (dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const copies = [['layout.json', 'layout.json'], ['scene.json', 'scene.json']];
  for (const f of ['people.json', 'backdrop.json']) if (opt('--src') && fs.existsSync(path.join(src, f))) copies.push([f, f]);
  if (!opt('--src') && fs.existsSync(path.join(src, 'people.json'))) copies.push(['people.json', 'people.json']);
  for (const [s, d] of copies) fs.copyFileSync(path.join(src, s), path.join(dataDir, d));
  if (boatsManifest) fs.writeFileSync(path.join(dataDir, 'boats.json'), JSON.stringify(boatsManifest, null, 1));
  // the scroll HUD's index of the section's painted figures on the original painting (tools/scroll_index.mjs, by the
  // section key whose folder this is in map/sections.json; it also rewrites assets/scroll/sections.json)
  const secKey = Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'map/sections.json'), 'utf8'))).find(([, v]) => v?.folder === name)?.[0];
  if (secKey && !opt('--src') && inWeb) execFileSync(process.execPath, [path.join(ROOT, 'tools/scroll_index.mjs'), secKey], { stdio: 'inherit' });
  console.log(`data -> ${path.relative(ROOT, dataDir)}/ (${copies.map((c) => c[1]).join(', ')}${boatsManifest ? ', boats.json' : ''})`);
}
