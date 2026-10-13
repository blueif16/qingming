#!/usr/bin/env node
// Loyalty check (map/BUILDING.md): one map entity, one model, and nothing else.
// Compares the scroll map (map/world/<S>.json) with what the build places:
//   - the builder's manifest sections/<folder>/placed.json (triangles per map ID, written by build());
//   - the page's tree cards (every tree in layout.json is a card, web/src/<page>.js placeTrees);
//   - the people (sections/<folder>/people.json: figures and walkers, by figure id; animals, by animal slug);
//   - the boats (vehicles with a boat_ slug): built when the section's boats GLB holds them (its manifest,
//     gen/sections/<folder>/web_build/<folder>_boats.json from blender/build_boats.py, or the shipped
//     web/public/assets/<folder>/boats.json); their crews (figures on `boat deck: <id>` / `boat roof: <id>`) are
//     people like any figure, and must stand on a built boat; people.json `boats` may name only mapped boats and figures.
// Each kind has a default way to be built; departures and things not built yet are recorded in
// sections/<folder>/build_choices.json ("how", "unbuilt"), each with a reason.
// FAIL on: geometry owned by anything that is not a map ID, an edge or the ground (an invention); a person who is not
// a mapped figure, or invented traffic; a mapped entity that is neither built nor recorded as unbuilt.
//   node tools/loyalty_check.mjs <S> [--json out.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const [S, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) opt[rest[i].slice(2)] = rest[++i];
const SEC = JSON.parse(fs.readFileSync(r('map/sections.json'), 'utf8'))[S];
if (!SEC?.folder) { console.error(`section ${S} has no build folder in map/sections.json`); process.exit(1); }
const read = (p, dflt) => (fs.existsSync(r(p)) ? JSON.parse(fs.readFileSync(r(p), 'utf8')) : dflt);
const world = read(`map/world/${S}.json`).entities.filter((e) => e.kind !== 'group');
const layout = read(`sections/${SEC.folder}/layout.json`);
const placed = read(`sections/${SEC.folder}/placed.json`, null);
const people = read(`sections/${SEC.folder}/people.json`, {});
const choices = read(`sections/${SEC.folder}/build_choices.json`, {});
const slug = (id) => id.split('.').slice(2).join('.');

// how each kind is built by default: a Blender model (in placed.json), a tree card, a person, or the ground surface
const DEFAULT = { building: 'model', structure: 'model', prop: 'model', animal: 'animal', vehicle: 'model', tree: 'card',
  figure: 'person', road: 'ground', water: 'ground', grd: 'ground' };
const isBoat = (e) => e.kind === 'vehicle' && slug(e.id).startsWith('boat_');
const how = (e) => choices.how?.[e.id]?.how || (isBoat(e) ? 'boat' : DEFAULT[e.kind]);
// the boats the section's boats GLB holds (blender/build_boats.py's manifest)
const boatsMan = read(`gen/sections/${SEC.folder}/web_build/${SEC.folder}_boats.json`, null) || read(`web/public/assets/${SEC.folder}/boats.json`, null);
const boatsBuilt = new Set(Object.entries(boatsMan?.boats || {}).filter(([, b]) => (b.tris?.lod0 || 0) > 0).map(([id]) => id));

const owners = placed?.owners || {};
const cards = new Set((layout.trees || []).map((t) => t.map_id));
const persons = new Set([...Object.keys(people.figures || {}), ...(people.walkers || []).map((w) => w.figure).filter(Boolean)]);
const figureSlugs = new Set(world.filter((e) => e.kind === 'figure').map((e) => slug(e.id)));
// animals: people.json animals (by slug), placed by the page (map/BUILDING.md)
const beasts = new Set(Object.keys(people.animals || {}));
const animalSlugs = new Set(world.filter((e) => e.kind === 'animal').map((e) => slug(e.id)));
const ids = new Set(world.map((e) => e.id));

const fails = [];
const rows = {};
for (const e of world) {
  const h = how(e);
  const row = (rows[e.kind] ||= { mapped: 0, built: 0, unbuilt: [], missing: [] });
  row.mapped++;
  let ok;
  if (h === 'model') ok = (owners[e.id] || 0) > 0;
  else if (h === 'card') ok = cards.has(e.id);
  else if (h === 'person') ok = persons.has(slug(e.id));
  else if (h === 'animal') ok = beasts.has(slug(e.id));
  else if (h === 'boat') ok = boatsBuilt.has(e.id);
  else if (h === 'ground') ok = true; // part of the painted ground surface (water planes may also own geometry)
  else if (h.startsWith('part of ')) ok = (owners[h.slice(8)] || 0) > 0;
  else { fails.push(`${e.id}: unknown "how" ${h}`); continue; }
  if (ok) row.built++;
  else if (choices.unbuilt?.[e.id]) row.unbuilt.push(e.id);
  else { row.missing.push(e.id); fails.push(`${e.id} (${e.kind}, ${h}): not built and not recorded as unbuilt`); }
  if (ok && choices.unbuilt?.[e.id]) fails.push(`${e.id}: built, but still listed under "unbuilt" in build_choices.json`);
}
// inventions: geometry or people with no map entity behind them
for (const [o, tris] of Object.entries(owners)) {
  if (o === 'ground' || o.startsWith('edge:')) continue;
  if (o === 'null') { fails.push(`${tris} triangles with no owner`); continue; }
  if (!ids.has(o)) fails.push(`geometry owned by ${o} (${tris} triangles), which is not in the map`);
}
for (const p of persons) if (!figureSlugs.has(p)) fails.push(`person ${p} is not a mapped figure`);
for (const a of beasts) if (!animalSlugs.has(a)) fails.push(`animal ${a} is not a mapped animal`);
for (const [id, f] of Object.entries(people.figures || {})) if (f.ride && !beasts.has(f.ride)) fails.push(`figure ${id} rides ${f.ride}, which is not in people.json animals`);
if (people.traffic?.count) fails.push(`people.json has ${people.traffic.count} traffic walkers, who are not painted`);
// boats and their crews
const crew = world.filter((e) => e.kind === 'figure' && /^boat (deck|roof): /.test(e.support || ''));
const crewOn = new Map();
for (const f of crew) {
  const boat = f.support.replace(/^boat (deck|roof): /, '');
  crewOn.set(boat, (crewOn.get(boat) || 0) + 1);
  if (!ids.has(boat)) fails.push(`${f.id} stands on ${boat}, which is not in the map`);
  else if (persons.has(slug(f.id)) && !boatsBuilt.has(boat) && !choices.unbuilt?.[boat]) fails.push(`${f.id} stands on ${boat}, which the boats GLB doesn't hold`);
}
for (const [key, b] of Object.entries(people.boats || {})) {
  const id = key.includes('.') ? key : `${S}.veh.${key}`;
  if (!ids.has(id)) fails.push(`people.json boats.${key} is not a mapped boat`);
  for (const f of [...Object.keys(b.crew || {}), ...Object.keys(b.haul || {}), ...(b.tow ? [b.tow] : [])]) if (!figureSlugs.has(f)) fails.push(`people.json boats.${key} names ${f}, which is not a mapped figure`);
}
for (const id of boatsBuilt) if (!ids.has(id)) fails.push(`the boats GLB holds ${id}, which is not in the map`);
if (!placed) fails.push(`no sections/${SEC.folder}/placed.json: run the builder first`);

const kinds = Object.keys(rows).sort((a, b) => rows[b].mapped - rows[a].mapped);
const lines = [`Loyalty check ${S} (${SEC.folder}): map/world/${S}.json vs placed.json, layout trees, people.json`, '',
  '| kind | built as | mapped | built | not built yet | missing |', '|---|---|---|---|---|---|'];
for (const k of kinds) {
  const x = rows[k];
  lines.push(`| ${k} | ${k === 'vehicle' && world.some(isBoat) ? 'model; boats GLB' : DEFAULT[k]} | ${x.mapped} | ${x.built} | ${x.unbuilt.length} | ${x.missing.length} |`);
}
const unb = Object.entries(choices.unbuilt || {});
if (unb.length) {
  lines.push('', 'Not built yet (build_choices.json "unbuilt"):');
  const byWhy = {};
  for (const [id, u] of unb) (byWhy[u.why] ||= []).push(slug(id));
  for (const [why, list] of Object.entries(byWhy)) lines.push(`- ${list.length}: ${why} (${list.join(', ')})`);
}
const boatRow = world.filter(isBoat);
if (boatRow.length) {
  const tri = (k) => Object.values(boatsMan?.boats || {}).reduce((a, b) => a + (b.tris?.[k] || 0), 0);
  lines.push('', `Boats: ${boatRow.length} mapped, ${boatRow.filter((e) => boatsBuilt.has(e.id)).length} in the boats GLB `
    + `(${(tri('lod0') / 1000).toFixed(1)}k triangles at full detail, ${(tri('lod1') / 1000).toFixed(1)}k far); `
    + `${crew.length} painted crew on ${crewOn.size} of them (people: ${crew.filter((f) => persons.has(slug(f.id))).length}).`);
}
const edges = Object.entries(owners).filter(([o]) => o.startsWith('edge:'));
if (edges.length) lines.push('', `Edges (invisible): ${edges.map(([o]) => o.slice(5)).join(', ')}.`);
lines.push('', fails.length ? `FAIL (${fails.length}):` : 'PASS', ...fails.map((f) => `- ${f}`));
console.log(lines.join('\n'));
if (opt.json) fs.writeFileSync(path.resolve(opt.json), JSON.stringify({ section: S, rows, fails }, null, 1));
process.exit(fails.length ? 1 : 0);
