#!/usr/bin/env node
// A size budget per section, so the world stays loadable on a phone however long it grows (web/src/world.js streams
// a window of sections: yours and one either side). For each section it reports, against tools/budgets.json:
//   download   what loading it fetches (MB): its GLB, its layout/people/scene/backdrop JSON, its panels, the tree
//              cards it plants, and (shared, reported apart) the kit swatches its GLB uses and the characters and
//              animals it casts. KTX2 copies count where tools/ktx2.mjs's manifest adopts their kind.
//   triangles  drawn (visible meshes) and collider-only
//   textures   decoded MB on the GPU, from image sizes: as RGBA8 with mipmaps, or the KTX2 copy's block size
//   draw calls the most over its camera spots, all passes (colour, ink normals, shadow), from a headless load of the
//              section alone (world.html?sections=<name>&window=0) in the bench Chrome (tools/win_chrome.sh start)
//   GPU MB     measured in that load (?gpumem=1: web/src/gpumem.js counts every allocation) once the crowd's bakes
//              are done, minus the page's fixed render targets (post pass, shadow map), which don't grow with the world
// and for `all` the window: the most any three neighbouring sections take together (what a phone holds at once).
// Usage: node tools/budget_check.mjs <section|all> [--no-load] [--url http://127.0.0.1:5180/world.html] [--json out.json]
//        [--cdp 9223] (another headless Chrome's debugging port, when the bench Chrome is busy with others' pages)
// PASS/FAIL per number; exit 1 on a FAIL. Budgets and why: tools/budgets.json.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const Q = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const A = path.join(Q, 'web/public/assets');
const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const target = args[0];
if (!target || target.startsWith('--')) { console.log('usage: node tools/budget_check.mjs <section|all> [--no-load] [--url ...] [--json out.json]'); process.exit(2); }
const budgets = JSON.parse(fs.readFileSync(path.join(Q, 'tools/budgets.json'), 'utf8'));
const MB = 1 / 1048576;
const size = (rel) => { try { return fs.statSync(path.join(A, rel)).size; } catch { return 0; } };
const readJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(A, rel), 'utf8')); } catch { return null; } };

// every built section: a GLB and a layout in assets/ (world.html's default list first, then any other)
const worldHtml = fs.readFileSync(path.join(Q, 'web/world.html'), 'utf8');
const defaults = (worldHtml.match(/data-sections="([^"]+)"/)?.[1] || '').split(',').filter(Boolean);
const built = fs.readdirSync(A).filter((d) => fs.existsSync(path.join(A, d, 'layout.json')) && fs.existsSync(path.join(A, `${d}.glb`)));
const names = target === 'all' ? [...new Set([...defaults, ...built])].filter((n) => built.includes(n)) : [target];
for (const n of names) if (!built.includes(n)) { console.error(`no built section "${n}" (assets/${n}.glb + assets/${n}/layout.json)`); process.exit(2); }

const ktx = readJson('ktx2.json') || { kinds: {}, files: {} };
const adopted = (rel) => { const e = ktx.files[rel]; return e && ktx.kinds[e.kind]?.adopt ? e : null; };
// GPU bytes of an image: RGBA8 + mips, or its KTX2 copy (UASTC, or ETC1S with alpha: 1 byte a pixel; ETC1S opaque: half)
const embKey = (b) => { let h = 0x811c9dc5; for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193); } return `emb:${b.length}:${(h >>> 0).toString(16).padStart(8, '0')}`; };
async function texBytes(rel, buf = null) {
  const e = adopted(buf ? embKey(buf) : rel); // an image inside a GLB: its copy is keyed by its bytes (web/src/assets.js)
  const meta = await sharp(buf || path.join(A, rel)).metadata();
  const px = meta.width * meta.height * 4 / 3;
  if (!e) return { px: [meta.width, meta.height], bytes: px * 4, download: buf ? 0 : size(rel) };
  return { px: [meta.width, meta.height], bytes: px * (e.mode === 'etc1s' && !e.alpha ? 0.5 : 1), download: size(e.ktx2), ktx2: e.mode };
}

function glbJson(file) {
  const b = fs.readFileSync(file);
  const len = b.readUInt32LE(12);
  return { json: JSON.parse(b.slice(20, 20 + len).toString()), bin: b.slice(20 + len + 8) };
}
const COMP = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
// triangles and GPU geometry bytes of a GLB's meshes; hidden__ meshes are collider-only (never drawn, never uploaded)
function geometry(json) {
  const out = { drawn: 0, collider: 0, bytes: 0 };
  const accBytes = (i) => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView] || {};
    const stride = bv.byteStride || bv.extensions?.EXT_meshopt_compression?.byteStride || 0;
    return a.count * Math.max(stride, COMP[a.componentType] * NUM[a.type]);
  };
  for (const node of json.nodes || []) {
    if (node.mesh === undefined) continue;
    const mesh = json.meshes[node.mesh], hidden = /hidden__/.test(node.name || mesh.name || '');
    for (const p of mesh.primitives) {
      const tris = (p.indices !== undefined ? json.accessors[p.indices].count : json.accessors[p.attributes.POSITION].count) / 3;
      if (hidden) { out.collider += tris; continue; }
      out.drawn += tris;
      if (p.indices !== undefined) out.bytes += accBytes(p.indices);
      for (const k of Object.values(p.attributes)) out.bytes += accBytes(k);
    }
  }
  return out;
}

// a model (character, animal): its download, geometry and textures (embedded webp)
const regC = readJson('chars/characters.json') || {}, regA = readJson('animals/animals.json') || {};
const models = {};
async function model(name) {
  if (models[name]) return models[name];
  const file = regC[name]?.file || regA[name]?.file;
  if (!file) return null;
  const rel = file.replace(/^assets\//, ''), { json, bin } = glbJson(path.join(A, rel));
  let tex = 0, extra = 0; // extra: KTX2 copies of its images, fetched besides the GLB
  for (const im of json.images || []) {
    const bv = json.bufferViews[im.bufferView];
    if (!bv) continue;
    const t = await texBytes(null, bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength));
    tex += t.bytes; extra += t.download;
  }
  return (models[name] = { name, download: size(rel) + extra, geometry: geometry(json).bytes, tex });
}

async function offline(name) {
  const layout = readJson(`${name}/layout.json`), people = readJson(`${name}/people.json`) || {}, backdrop = readJson(`${name}/backdrop.json`);
  const { json } = glbJson(path.join(A, `${name}.glb`));
  const geo = geometry(json);
  // the section's own download: its GLB, its boats GLB and manifest when it has boats (export_web_scene.mjs), its JSON
  const own = { glb: size(`${name}.glb`) + size(`${name}_boats.glb`), json: ['layout', 'people', 'scene', 'backdrop', 'boats', 'scroll_index'].reduce((a, f) => a + size(`${name}/${f}.json`), 0), panels: 0, cards: 0 };
  let texOwn = 0, texKit = 0, kitDownload = 0;
  // panels it stands (not held back for review)
  for (const p of backdrop?.panels || []) {
    if (p.hold) continue;
    const rel = `${name}/backdrop_${p.side}.webp`;
    if (!size(rel)) continue;
    const t = await texBytes(rel); own.panels += t.download; texOwn += t.bytes;
  }
  // the tree cards it plants (each card once)
  const cardReg = readJson('trees/trees.json') || {};
  // a tree assigned `card: "kit"` is built as a model by its section (S4b's stump), not drawn as a card
  for (const card of new Set((layout.trees || []).filter((t) => t.card !== 'kit').map((t) => t.card || 'willow_card'))) {
    const rel = (cardReg[card]?.file || 'assets/willow_card.webp').replace(/^assets\//, '');
    const t = await texBytes(rel); own.cards += t.download; texOwn += t.bytes;
  }
  // the kit swatches its GLB points at (shared with every section that uses them)
  const kit = [...new Set((json.images || []).map((im) => im.uri).filter(Boolean))];
  for (const uri of kit) { const t = await texBytes(uri); texKit += t.bytes; kitDownload += t.download; }
  // its cast, as the page casts it (people.js / world.js modelsOf): own character, else stand-in, else townsman
  const castAs = (f) => (regC[f.character]?.file ? f.character : regC[f.stand_in]?.file ? f.stand_in : 'townsman');
  const cast = new Set();
  for (const f of Object.values(people.figures || {})) if (!f.carried_by) cast.add(castAs(f));
  for (const w of people.walkers || []) cast.add(castAs(w));
  for (const a of Object.values(people.animals || {})) if (regA[a.model]?.file) cast.add(a.model);
  const castModels = (await Promise.all([...cast].map(model))).filter(Boolean);
  const people_n = Object.values(people.figures || {}).filter((f) => !f.carried_by).length + (people.walkers || []).length + Object.keys(people.animals || {}).length;
  return {
    name, people: people_n,
    download: { own: (own.glb + own.json + own.panels + own.cards) * MB, glb: own.glb * MB, json: own.json * MB, panels: own.panels * MB, cards: own.cards * MB,
      kit: kitDownload * MB, cast: castModels.reduce((a, m) => a + m.download, 0) * MB },
    triangles: { drawn: geo.drawn, collider: geo.collider },
    textures: { own: texOwn * MB, kit: texKit * MB, cast: castModels.reduce((a, m) => a + m.tex, 0) * MB },
    geometryMB: geo.bytes * MB, castN: castModels.length, cast: castModels.map((m) => m.name),
  };
}

// the headless load: draw calls over the section's camera spots, and measured GPU MB
async function measured(names) {
  if (args.includes('--no-load')) return {};
  let browser;
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${opt('--cdp', '9223')}`); } catch { console.error('No bench Chrome on 9223 (tools/win_chrome.sh start); use --no-load for the offline numbers only.'); process.exit(1); }
  const out = {}, url = opt('--url', 'http://127.0.0.1:5180/world.html');
  for (const name of names) {
    const page = await browser.contexts()[0].newPage();
    await page.routeWebSocket(/:5180/, () => {}); // dev-server reloads (other agents' edits) must not hit a measurement
    const W = 1280, H = 720;
    await page.setViewportSize({ width: W, height: H });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${url}?sections=${name}&window=0&gpumem=1&hour=10`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
    const views = await page.evaluate(() => window.__test.views);
    let calls = 0, callsAt = '', tris = 0;
    for (const v of views) {
      const r = await page.evaluate(async (v) => { await window.__test.view(v); return window.__test.measure(0.6); }, v);
      if (r.calls > calls) { calls = r.calls; callsAt = v; tris = r.tris; }
    }
    await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000, polling: 250 });
    await page.waitForTimeout(1000);
    const g = await page.evaluate(([W, H]) => {
      const t = window.__test, mem = t.gpuMem(), list = t.gpuTextures(), shadow = t.scene.children.find((o) => o.isDirectionalLight)?.shadow.mapSize.x || 0;
      // fixed: the post pass's render targets (canvas size), the shadow map, and the multisampled renderbuffers
      const fixed = list.filter(([w, h]) => (w === W && h === H) || (w === shadow && h === shadow)).reduce((a, x) => a + x[3], 0) + mem.renderbuffers;
      return { total: mem.total, fixed, people: t.people.all.length };
    }, [W, H]);
    out[name] = { calls, callsAt, tris, gpuMB: g.total - g.fixed, fixedMB: g.fixed, peopleLoaded: g.people, errors };
    await page.close();
  }
  await browser.close();
  return out;
}

const rows = [];
for (const n of names) rows.push(await offline(n));
const meas = await measured(names);
const B = budgets.section;
let fails = 0;
const check = (label, v, max, unit = '', digits = 2) => {
  const ok = max == null || v <= max;
  if (!ok) fails++;
  return `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(30)} ${(typeof v === 'number' ? v.toFixed(digits) : v).toString().padStart(9)} ${unit.padEnd(3)} (budget ${max ?? '-'})`;
};
for (const r of rows) {
  const m = meas[r.name];
  // a section's exceptions (tools/budgets.json "exceptions", each with its reason) replace single numbers
  const B = { ...budgets.section, ...((budgets.exceptions || {})[r.name] || {}) };
  if ((budgets.exceptions || {})[r.name]) console.log(`      exceptions: ${Object.keys(budgets.exceptions[r.name]).filter((k) => !k.endsWith('_why')).join(', ')} (tools/budgets.json)`);
  console.log(`\n== ${r.name}: ${r.people} people and animals, cast ${r.castN} models`);
  console.log(check('download, the section', r.download.own, B.download_mb, 'MB'));
  console.log(`      GLB ${r.download.glb.toFixed(2)}, JSON ${r.download.json.toFixed(2)}, panels ${r.download.panels.toFixed(2)}, cards ${r.download.cards.toFixed(2)}; shared: kit ${r.download.kit.toFixed(2)}, cast ${r.download.cast.toFixed(2)} MB`);
  console.log(check('download, with kit and cast', r.download.own + r.download.kit + r.download.cast, B.download_with_shared_mb, 'MB'));
  console.log(check('triangles drawn', r.triangles.drawn / 1000, B.triangles_k, 'k', 1));
  console.log(check('triangles, colliders', r.triangles.collider / 1000, B.collider_triangles_k, 'k', 1));
  console.log(check('textures, own (panels, cards)', r.textures.own, B.texture_own_mb, 'MB'));
  console.log(`      shared: kit ${r.textures.kit.toFixed(2)} MB, cast ${r.textures.cast.toFixed(2)} MB; geometry ${r.geometryMB.toFixed(2)} MB`);
  console.log(check('people and animals', r.people, B.people, '', 0));
  if (m) {
    console.log(check(`draw calls (most, at ${m.callsAt})`, m.calls, B.draw_calls, '', 0));
    console.log(check('GPU MB measured, section alone', m.gpuMB, B.gpu_mb, 'MB'));
    console.log(`      (plus ${m.fixedMB.toFixed(1)} MB of fixed render targets at 1280x720; ${m.peopleLoaded} people loaded${m.errors.length ? '; page errors: ' + m.errors.slice(0, 3).join(' | ') : ''})`);
  }
}
// the window: three neighbours at once (the page's default), sections in scroll order
if (names.length > 1 && Object.keys(meas).length) {
  const order = names.map((n) => [n, readJson(`${n}/layout.json`).painted_area.corners[0][0]]).sort((a, b) => a[1] - b[1]).map(([n]) => n);
  let worst = 0, at = '';
  for (let i = 0; i < order.length; i++) {
    const trio = order.slice(Math.max(0, i - 1), i + 2), mb = trio.reduce((a, n) => a + meas[n].gpuMB, 0);
    if (mb > worst) { worst = mb; at = trio.join(' + '); }
  }
  console.log(`\n== window (yours and each neighbour)`);
  console.log(check(`GPU MB, ${at}`, worst, budgets.window.gpu_mb, 'MB'));
  console.log(`      sections only, summed alone (shared characters and kit counted in each, so this overstates); plus the fixed render targets`);
}
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify({ budgets, rows, measured: meas }, null, 1));
console.log(`\n${fails ? `FAIL (${fails})` : 'PASS'}`);
process.exit(fails ? 1 : 0);
