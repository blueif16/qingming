// Where a map entity sits on the scan (map/strokes/<S>.json, scan pixels u right, v down): the box round every stroke
// point it carries in `pts`, a group's box round its members'. Shared by tools/ui_data.mjs (the scroll HUD's marks)
// and tools/place_crops.mjs (the journal's crops of the painting).
//   import { scanBoxes } from './scan_box.mjs';  const box = scanBoxes(root)(['S6.grp.jie_ring', 'S6.prop.jie_signboard_2085']);
//   -> { u0, v0, u1, v1, foot: [u, v] | null, n } or null when no ID is found
import fs from 'node:fs';
import path from 'node:path';

export function scanBoxes(root) {
  const cache = new Map(); // section key -> Map(id -> entity)
  const load = (S) => {
    if (!cache.has(S)) {
      const p = path.join(root, 'map/strokes', `${S}.json`);
      const ents = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')).entities || [] : [];
      cache.set(S, new Map((Array.isArray(ents) ? ents : Object.values(ents)).map((e) => [e.id, e])));
    }
    return cache.get(S);
  };
  const points = (o, out) => {
    if (Array.isArray(o)) {
      if (typeof o[0] === 'number' && typeof o[1] === 'number') out.push([o[0], o[1]]);
      else for (const x of o) points(x, out);
    } else if (o && typeof o === 'object') for (const v of Object.values(o)) points(v, out);
    return out;
  };
  const collect = (id, out, seen = new Set()) => {
    if (seen.has(id)) return null;
    seen.add(id);
    const e = load(id.split('.')[0]).get(id);
    if (!e) return null;
    if (e.pts) points(e.pts, out);
    for (const m of e.members || []) collect(m, out, seen);
    return e;
  };
  return (ids) => {
    const out = [];
    let first = null;
    for (const id of [].concat(ids)) { const e = collect(id, out); first ??= e; }
    if (!out.length) return null;
    const us = out.map((p) => p[0]), vs = out.map((p) => p[1]);
    // a foot point for a mark: the entity's own foot/base centre when it names one, else the box's lower middle
    const f = first?.pts?.foot || null;
    const base = first?.pts?.base && points(first.pts.base, []);
    const foot = f ? [f[0], f[1]] : base?.length ? [base.reduce((a, p) => a + p[0], 0) / base.length, base.reduce((a, p) => a + p[1], 0) / base.length] : null;
    return { u0: Math.min(...us), v0: Math.min(...vs), u1: Math.max(...us), v1: Math.max(...vs), foot, n: out.length };
  };
}
