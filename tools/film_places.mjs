#!/usr/bin/env node
// The places a shot can name (skill `film`): every built section's camera spots (sections/<s>/scene.json views) and
// every map thing of its layout (web/public/assets/<s>/layout.json: buildings, figures, animals, boats, trees, props,
// water, roads). No browser needed. Positions are the map frame: X along the scroll, D north (depth), H up, metres.
//   node tools/film_places.mjs                          the sections, their X span and their views
//   node tools/film_places.mjs rainbow_bridge           that section's views and things (all kinds)
//   node tools/film_places.mjs --kind veh,ani           only boats/carts and animals (view bld fig ani veh tree prop str water road grd)
//   node tools/film_places.mjs --near 134,20,25         within 25 m of X 134, D 20 (any section)
//   node tools/film_places.mjs --grep "grain|boat"      names matching (regex, case-insensitive)
//   node tools/film_places.mjs --painter S3.fig.deck_capped_shouter_19492
//                                                       the painter's view of a place: the camera bearing and angle that
//                                                       look along the scroll's own projection there (a "painting" camera)
//   --json                                              machine-readable
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const flagVals = new Set(['--kind', '--near', '--grep', '--painter'].map((n) => opt(n)).filter(Boolean));
const section = args.find((a) => !a.startsWith('--') && !flagVals.has(a));
const kinds = opt('--kind')?.split(',');
const near = opt('--near')?.split(',').map(Number);
const grep = opt('--grep') ? new RegExp(opt('--grep'), 'i') : null;
const json = args.includes('--json');
const read = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

const built = fs.readdirSync(path.join(ROOT, 'web/public/assets')).filter((n) => fs.existsSync(path.join(ROOT, 'web/public/assets', n, 'layout.json')) && fs.existsSync(path.join(ROOT, 'sections', n, 'scene.json')) && n !== 'boats_test');
const rows = [];
const seen = new Map(); // view name -> sections using it (world.js prefixes a clash with "<section>:")
for (const s of built) {
  const scene = read(path.join(ROOT, 'sections', s, 'scene.json')) || {};
  for (const n of Object.keys(scene.views || {})) seen.set(n, [...(seen.get(n) || []), s]);
}
for (const s of built) {
  const scene = read(path.join(ROOT, 'sections', s, 'scene.json')) || {}, L = read(path.join(ROOT, 'web/public/assets', s, 'layout.json')) || {};
  for (const [n, v] of Object.entries(scene.views || {})) {
    const id = seen.get(n).length > 1 && seen.get(n)[0] !== s ? `${s}:${n}` : n;
    rows.push({ id, kind: 'view', section: s, X: v.X, D: v.D, H: v.H || 0, facing: v.facing_deg, about: v.about || '' });
  }
  for (const [id, e] of Object.entries(L.entities || {})) if (e.pos) rows.push({ id, kind: e.kind ? id.split('.')[1] : 'map', section: s, X: e.pos[0], D: e.pos[1], H: e.H ?? null, facing: e.facing_deg ?? null, about: e.name || '' });
  for (const f of L.figures || []) rows.push({ id: f.map_id || f.id, kind: 'fig', section: s, X: f.X, D: f.D, H: f.H ?? null, facing: f.facing_deg ?? null, about: [f.pose, f.support].filter(Boolean).join(', ') });
  for (const t of L.trees || []) rows.push({ id: t.map_id || t.id, kind: 'tree', section: s, X: t.X, D: t.D, H: t.H ?? null, facing: null, about: `${t.height_m ?? '?'} m${t.what ? ': ' + t.what.slice(0, 60) : ''}` });
}

const painter = opt('--painter');
if (painter) {
  const r = rows.find((x) => x.id === painter || x.id.split('.').pop() === painter);
  if (!r) { console.error(`unknown place ${painter}`); process.exit(1); }
  const { painterView } = await import('../web/src/film.js'); // the page's own math (scroll_projection.js frames)
  const sc = read(path.join(ROOT, 'web/public/assets', r.section, 'scroll_index.json'));
  const v = painterView(sc.frames, r.X, r.D, r.H ?? 0);
  const res = { id: r.id, section: r.section, at: [r.X, r.D, r.H], ...v, camera: { kind: 'painting', at: r.id, up: 1.2, dist: 45, fov: 8.5 } };
  if (json) console.log(JSON.stringify(res, null, 1));
  else console.log(`${r.id} (${r.section}) at [${r.X}, ${r.D}, ${r.H ?? 'ground'}]\n  the painter looks along [${v.dir.join(', ')}] (X, D, H): the camera sits at bearing ${v.deg}, ${v.el_deg} deg up from it\n  the scan there: ${v.px_per_m.X} px per m along X, ${v.px_per_m.D} along D, ${v.px_per_m.H} up\n  camera: ${JSON.stringify(res.camera)}`);
  process.exit(0);
}
if (!section && !kinds && !near && !grep) {
  // the overview: the sections in scroll order with their extent, then the views
  const bySec = new Map();
  for (const r of rows) { const b = bySec.get(r.section) || { x0: Infinity, x1: -Infinity, d0: Infinity, d1: -Infinity, views: [] }; if (r.kind !== 'view') { b.x0 = Math.min(b.x0, r.X); b.x1 = Math.max(b.x1, r.X); b.d0 = Math.min(b.d0, r.D); b.d1 = Math.max(b.d1, r.D); } else b.views.push(r); bySec.set(r.section, b); }
  const list = [...bySec.entries()].sort((a, b) => a[1].x0 - b[1].x0);
  if (json) { console.log(JSON.stringify(list.map(([s, b]) => ({ section: s, X: [b.x0, b.x1], D: [b.d0, b.d1], views: b.views })), null, 1)); process.exit(0); }
  for (const [s, b] of list) {
    console.log(`${s}  X ${b.x0.toFixed(0)}..${b.x1.toFixed(0)}  D ${b.d0.toFixed(0)}..${b.d1.toFixed(0)}`);
    for (const v of b.views) console.log(`  view ${v.id.padEnd(22)} [${v.X}, ${v.D}, ${v.H}] facing ${v.facing}  ${v.about}`);
  }
  process.exit(0);
}
let list = rows.filter((r) => (!section || r.section === section) && (!kinds || kinds.includes(r.kind)) && (!grep || grep.test(r.id) || grep.test(r.about)));
if (near) {
  const [x, d, rad = 20] = near;
  list = list.map((r) => ({ ...r, dist: Math.hypot(r.X - x, r.D - d) })).filter((r) => r.dist <= rad).sort((a, b) => a.dist - b.dist);
}
if (json) { console.log(JSON.stringify(list, null, 1)); process.exit(0); }
for (const r of list) console.log(`${r.kind.padEnd(5)} ${r.id.padEnd(44)} [${r.X}, ${r.D}, ${r.H ?? 'ground'}]${r.dist !== undefined ? ` ${r.dist.toFixed(1)} m` : ''}  ${r.about.slice(0, 90)}`);
console.log(`${list.length} places`);
