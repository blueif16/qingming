#!/usr/bin/env node
// Where each painted thing is on the original painting, for the scroll HUD (web/src/scroll_hud.js): per map ID, the
// painted figure's box and its foot and head points in scan pixels (reference/scroll/qingming_commons_38414x1800.jpg),
// with a short label from the map. Plus the section's painted range and frames, so the HUD projects the walker onto
// the painting with the map's own mapping (web/src/scroll_projection.js).
//   node tools/scroll_index.mjs <S> | all     map/strokes/<S>.json -> web/public/assets/<folder>/scroll_index.json
// Every run also rewrites web/public/assets/scroll/sections.json: each section of map/sections.json (keys with a
// folder; a key may carry a letter, S4b) whose index exists, with its name, painted range and frames. The HUD reads
// that list, so a new section shows on the painting as soon as its index is written.
// A step every built section runs (skill web-scene; tools/export_web_scene.mjs runs it after copying layout.json).
// Covers figures, animals, vehicles, buildings and structures. Boxes are derived from the measured points (a figure's
// foot and head, an animal's hooves and head, a cart's ends and wheels, a building's corners and heights); the
// labels never carry numbers or coordinates (the HUD shows none to the player).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toScan } from '../web/src/scroll_projection.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const SECS = JSON.parse(fs.readFileSync(r('map/sections.json'), 'utf8'));
const arg = process.argv[2];
// built = exported to the web (web/public/assets/<folder>/layout.json, tools/export_web_scene.mjs), not only mapped
const exported = (k) => SECS[k]?.folder && fs.existsSync(r(`web/public/assets/${SECS[k].folder}/layout.json`));
const list = arg === 'all' ? Object.keys(SECS).filter((k) => exported(k) && fs.existsSync(r(`map/strokes/${k}.json`))) : [arg];
if (!arg || list.some((S) => !SECS[S])) { console.error('usage: node tools/scroll_index.mjs <S>|all'); process.exit(1); }

// every section's names, for map IDs that one entity's text cites ("the shafts of S5.veh.covered_ox_cart_9800")
const NAMES = new Map();
for (const S of Object.keys(SECS)) {
  const f = r(`map/strokes/${S}.json`);
  if (fs.existsSync(f)) for (const e of JSON.parse(fs.readFileSync(f, 'utf8')).entities) NAMES.set(e.id, e.name);
}
const KEEP = { figure: 'fig', animal: 'ani', vehicle: 'veh', building: 'bld', structure: 'str' };
const P = (p) => Array.isArray(p) && typeof p[0] === 'number';
const R = (x) => Math.round(x);

// a label the player may read: no digits, no map IDs, no scan coordinates. A cited map ID ("S5.veh.ox_cart_9800") or
// slug ("S5's house_5800") becomes the thing's name.
const SLUGS = new Map([...NAMES].map(([id, n]) => [id.split('.').slice(2).join('.'), n]));
// letter-digit tags too (S1's charcoal donkeys "D1"-"D5"): the HUD shows no numbers
const plain = (s) => (s || '').replace(/\s*\([^()]*[\d_][^()]*\)/g, '').replace(/\s*\b[A-Z]\d+\b/g, '').replace(/\s*\b\d+\b/g, '').replace(/\s{2,}/g, ' ').trim();
const named = (s) => (s || '')
  .replace(/\bS\d[a-z]?\.[a-z]+\.[a-z0-9_]+/g, (id) => (NAMES.has(id) ? `the ${plain(NAMES.get(id))}` : 'it'))
  .replace(/\b(?:S\d[a-z]?'s\s+)?([a-z]+(?:_[a-z0-9]+)+)\b/g, (m, slug) => (SLUGS.has(slug) ? `the ${plain(SLUGS.get(slug))}` : m))
  .replace(/\bthe the\b/gi, 'the');
const cleanName = (s) => plain(named(s));
function cleanWhat(s, max = 120) {
  let t = named(s);
  t = t.replace(/\s*\([^()]*[\d_][^()]*\)/g, ''); // parentheticals with numbers (scan positions, sizes)
  // keep the leading clauses up to the first one that still has a number
  const parts = t.split(/(?<=[,;:.])\s+/);
  let out = '';
  for (const p of parts) { if (/\d/.test(p)) break; if ((out + ' ' + p).trim().length > max) { if (!out) out = p.slice(0, max); break; } out = (out + ' ' + p).trim(); }
  // the first clause itself has a number ("about 1 m long"): keep what comes before it, if that says something
  if (!out) out = (parts[0] || '').replace(/\s*\S*\d.*$/, '').replace(/\s+(about|at|of|some|nearly|around|roughly|by|with|and)$/i, '');
  if (out.length < 18) return '';
  if (out.lastIndexOf('(') > out.lastIndexOf(')')) out = out.slice(0, out.lastIndexOf('(')).trim(); // an unclosed bracket
  out = out.replace(/[,;:]$/, '').trim();
  if (out.length > max) out = out.slice(0, out.lastIndexOf(' ', max)) + '…';
  if (out && !/[.…!?]$/.test(out)) out += out.length < t.length ? '…' : '.';
  return out;
}

// the painted box of one entity, from its measured points, [u0, v0, u1, v1]
// how far an animal's rump stands out behind its hind hooves, in hoof spans, by its model (people.json animals):
// fitted on the QA's measurements (round 2, 2026-10-12): oxen 0.33-0.75, camels 0.39, donkeys 0.09-0.35; a horse seen
// from behind spreads its rump over its hooves (0.9)
const RUMP = { ox: 0.45, camel: 0.4, horse: 0.4, horse_white: 0.4, donkey: 0.2, mule: 0.2, pig: 0.25, dog: 0.25, bird: 0.1 };
const WIDE = { seated: 0.62, squatting: 0.62, kneeling: 0.62, crouching: 0.62, riding: 0.5, lying: 1.4, leaning: 0.55, carrying: 0.5 };
function boxOf(e, model) {
  const p = e.pts || {};
  // lying, but drawn more upright than flat (a man reclining on a ridge): the standing box, as wide as tall
  if (e.kind === 'figure' && P(p.foot) && P(p.head) && e.pose === 'lying' && Math.abs(p.foot[1] - p.head[1]) > Math.abs(p.foot[0] - p.head[0])) {
    const h = p.foot[1] - p.head[1];
    return [Math.min(p.foot[0], p.head[0]) - h / 2, p.head[1] - 0.08 * h, Math.max(p.foot[0], p.head[0]) + h / 2, p.foot[1] + 0.05 * h];
  }
  if (e.kind === 'figure' && P(p.foot) && P(p.head) && e.pose === 'lying') {
    // a lying figure's foot point is the middle of the body: the body runs from the head to as far past the foot
    const far = [2 * p.foot[0] - p.head[0], 2 * p.foot[1] - p.head[1]], len = Math.hypot(p.foot[0] - p.head[0], p.foot[1] - p.head[1]), pad = 0.12 * len;
    return [Math.min(p.head[0], far[0]) - pad, Math.min(p.head[1], p.foot[1]) - pad, Math.max(p.head[0], far[0]) + pad, Math.max(p.head[1], p.foot[1]) + 0.45 * Math.abs(p.foot[1] - p.head[1]) + pad];
  }
  if (e.kind === 'figure' && P(p.foot) && P(p.head)) {
    const h = Math.max(24, p.foot[1] - p.head[1]), w = Math.max(18, h * (WIDE[e.pose] ?? 0.42));
    return [Math.min(p.foot[0], p.head[0]) - w / 2, p.head[1] - 0.08 * h, Math.max(p.foot[0], p.head[0]) + w / 2, p.foot[1] + 0.05 * h];
  }
  if (e.kind === 'animal' && P(p.fore) && P(p.hind)) {
    // the hooves are ground points: the rump stands out behind the hind hooves (RUMP, by model) and the back or hump
    // rises to max(1.2 x the head's height above the ground, 1.65 hoof spans), capped at the head's height + 0.45 span
    // (a horse seen from behind holds its head as high as its back). Fitted on the QA's nine measured animals (two
    // rounds, 2026-10-12): the tops come within -15..+25 px.
    const head = P(p.head) ? p.head : null, g = Math.max(p.fore[1], p.hind[1]), span = Math.max(model === 'bird' ? 10 : 40, Math.abs(p.fore[0] - p.hind[0]));
    const behind = /seen from behind|from behind,|rear view|seen from the back/i.test(e.name || '') ? 0.9 : RUMP[model] ?? 0.3; // the name, not the what: "second camel from the rear" is its place in the caravan
    const back = Math.sign(p.hind[0] - p.fore[0]) || -1, rump = p.hind[0] + back * behind * span, pad = 0.1 * span;
    const hh = head ? g - head[1] : 0, rise = Math.min(Math.max(1.2 * hh, 1.65 * span), head ? hh + 0.45 * span : Infinity);
    const top = Math.min(head ? head[1] : g, g - rise);
    const front = Math.max(...[p.fore[0], ...(head ? [head[0]] : [])].map((u) => -back * u)) * -back; // the head end, beyond the fore hooves
    const ends = [rump + back * pad, front - back * 3 * pad];
    return [Math.min(...ends), top - pad, Math.max(...ends), g + 0.4 * pad];
  }
  const pts = [];
  for (const [k, v] of Object.entries(p)) {
    if (P(v)) pts.push(v);
    else if (k === 'base' && v && !Array.isArray(v)) pts.push(...Object.values(v).filter(P));
    else if (k === 'wheels' || k === 'bays' || k === 'line') pts.push(...(v || []).filter(P));
    else if (k === 'lines') for (const ln of Object.values(v || {})) pts.push(...ln.filter(P));
  }
  if (!pts.length) return null;
  const us = pts.map((q) => q[0]), vs = pts.map((q) => q[1]);
  const top = e.kind === 'vehicle' ? Math.min(...vs) - 140 : Math.min(...vs); // a cart: its ends are ground points; its load stands about 1.8 m above
  return [Math.min(...us) - 6, top - 6, Math.max(...us) + 6, Math.max(...vs) + 6];
}
const foot = (p) => (P(p.foot) ? p.foot : P(p.fore) && P(p.hind) ? [(p.fore[0] + p.hind[0]) / 2, (p.fore[1] + p.hind[1]) / 2]
  : P(p.front) && P(p.rear) ? [(p.front[0] + p.rear[0]) / 2, (p.front[1] + p.rear[1]) / 2] : null);

for (const S of list) {
  const sec = SECS[S];
  if (!sec.folder) { console.error(`${S}: no build folder in map/sections.json`); process.exitCode = 1; continue; }
  const layoutFile = r(`sections/${sec.folder}/layout.json`), worldFile = r(`map/world/${S}.json`), strokesFile = r(`map/strokes/${S}.json`);
  if (!fs.existsSync(strokesFile) || !(fs.existsSync(layoutFile) || fs.existsSync(worldFile))) {
    console.error(`${S}: no strokes or no frames yet (map/strokes, sections/${sec.folder}/layout.json or map/world): skipped`);
    process.exitCode = 1;
    continue;
  }
  const strokes = JSON.parse(fs.readFileSync(strokesFile, 'utf8')).entities;
  const peopleFile = r(`sections/${sec.folder}/people.json`);
  const models = fs.existsSync(peopleFile) ? Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(peopleFile, 'utf8')).animals || {}).map(([slug, a]) => [`${S}.ani.${slug}`, a.model])) : {};
  // the support heights the map uses here (map/frames/<S>.json supports): the HUD snaps your height to the nearest
  const framesFile = r(`map/frames/${S}.json`);
  const supports = fs.existsSync(framesFile) ? [...new Set(Object.values(JSON.parse(fs.readFileSync(framesFile, 'utf8')).supports || {}).map((x) => x.H).filter((h) => typeof h === 'number'))].sort((a, b) => a - b) : [0];
  const frames = JSON.parse(fs.readFileSync(fs.existsSync(layoutFile) ? layoutFile : worldFile, 'utf8')).frames;
  // the 繁體 names the HUD shows by default (map/names_zh/<S>.json, keyed by map ID); English stays in n and w
  const zhFile = r(`map/names_zh/${S}.json`);
  const zh = fs.existsSync(zhFile) ? JSON.parse(fs.readFileSync(zhFile, 'utf8')).names || {} : {};
  const items = {};
  const count = {};
  let noZh = 0;
  for (const e of strokes) {
    const k = KEEP[e.kind];
    if (!k) continue;
    const b = boxOf(e, models[e.id]);
    if (!b) continue;
    const it = { k, b: b.map(R) };
    const f = foot(e.pts || {});
    if (f) it.f = f.slice(0, 2).map(R);
    if (P(e.pts?.head)) it.h = e.pts.head.slice(0, 2).map(R);
    it.n = cleanName(e.name);
    if (zh[e.id]) it.n_zh = zh[e.id];
    else noZh++;
    const w = cleanWhat(e.what);
    if (w && w.toLowerCase() !== it.n.toLowerCase() + '.') it.w = w;
    items[e.id] = it;
    count[k] = (count[k] || 0) + 1;
  }
  const out = {
    about: `Generated by tools/scroll_index.mjs from map/strokes/${S}.json; never edit. Per map ID: k kind, b painted box [u0, v0, u1, v1], f foot (ground point), h head, in scan px of reference/scroll/qingming_commons_38414x1800.jpg; n name, w what (short), n_zh the 繁體 name (map/names_zh). area = the painted range built; frames = the map's frames (layout.json).`,
    section: S, folder: sec.folder, name: plain(sec.name), area: sec.area || sec.x, supports, frames: frames.map(({ id, covers, origin, x, d, h, dx_knots }) => ({ id, covers, origin, x, d, h, dx_knots })),
    items,
  };
  const dir = r(`web/public/assets/${sec.folder}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'scroll_index.json');
  fs.writeFileSync(file, JSON.stringify(out) + '\n');
  if (noZh) console.log(`${S}: ${noZh} items without a 繁體 name (map/names_zh/${S}.json)`);
  // the HUD's projection, checked: every figure's and animal's layout position projected back onto the scan with
  // web/src/scroll_projection.js must land on its stroke point (recorded moves in build_choices.json excepted)
  let worst = [0, ''], n = 0;
  if (fs.existsSync(layoutFile)) {
    const layout = JSON.parse(fs.readFileSync(layoutFile, 'utf8')), byId = new Map(strokes.map((e) => [e.id, e]));
    const test = (id, w, st) => { if (!w || !P(st) || layout.moved?.[id]) return; const [u, v] = toScan(layout.frames, w[0], w[1], w[2] ?? 0); const d = Math.hypot(u - st[0], v - st[1]); n++; if (d > worst[0]) worst = [d, id]; };
    for (const f of layout.figures) test(f.map_id, [f.X, f.D, f.H], byId.get(f.map_id)?.pts?.foot);
    for (const [id, e] of Object.entries(layout.entities)) if (e.kind === 'animal') test(id, e.pts?.fore, byId.get(id)?.pts?.fore);
    if (worst[0] > 2) { console.error(`${S}: projection check FAIL: ${worst[1]} lands ${worst[0].toFixed(1)} px from its stroke (frames changed since layout.json? rerun tools/map_layout.mjs ${S})`); process.exitCode = 1; }
  }
  const leaks = Object.entries(items).filter(([, it]) => /\d/.test(it.n + (it.w || '')));
  console.log(`${path.relative(ROOT, file)}: ${Object.keys(items).length} entries ${JSON.stringify(count)}, ${(fs.statSync(file).size / 1e3).toFixed(1)} kB; projection ${n} figures and animals, max ${worst[0].toFixed(2)} px${leaks.length ? `; ${leaks.length} labels with digits: ${leaks.slice(0, 3).map(([id]) => id)}` : ''}`);
}

// the list the HUD reads: every exported section of map/sections.json whose index is on disk
const built = [];
for (const [S, sec] of Object.entries(SECS)) {
  if (!sec?.folder || !exported(S)) continue;
  const f = r(`web/public/assets/${sec.folder}/scroll_index.json`);
  if (!fs.existsSync(f)) continue;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  built.push({ section: S, folder: sec.folder, name: plain(sec.name), area: sec.area || sec.x, supports: j.supports || [0], frames: j.frames });
}
built.sort((a, b) => a.area[0] - b.area[0]);
fs.mkdirSync(r('web/public/assets/scroll'), { recursive: true });
fs.writeFileSync(r('web/public/assets/scroll/sections.json'), JSON.stringify({ about: 'Generated by tools/scroll_index.mjs from map/sections.json: the built sections (an index on disk), west to east; never edit.', sections: built }) + '\n');
console.log(`web/public/assets/scroll/sections.json: ${built.map((b) => b.section).join(', ')}`);
