// Where the ambient life goes (gen/details/ambient/plan.md, map/BUILDING.md "Ambient life"): a pure function of a
// section's layout.json (and its people.json for the walkers' paths), so every bird, catkin and wisp of smoke is placed
// from the map's own things and carries the map ID it came from. No three.js here: node imports it for the records
// (gen/details/ambient/tools/sites.mjs) and the page (ambient.js) for the scene. Positions are map metres (X east,
// D north, H up from the ground); the page turns them into the world frame (x = X, z = -D) and finds the ground.
//   sitesOf(layout, people) -> { flocks, swallows, egrets, sparrows, bats, butterflies, catkins, seeds, leaves, smoke,
//                                steam, banners }
// Every list is ordered most telling first, so a tier that takes fewer takes the best.

const TALL = 7; // m: a tree that tall draws a flock and bats
const hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const centroid = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
const area = (fp) => { let s = 0; for (let i = 0; i < fp.length; i++) { const a = fp[i], b = fp[(i + 1) % fp.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
// is (X, D) inside the polygon (map metres)
function inside(fp, X, D) {
  let c = false;
  for (let i = 0, j = fp.length - 1; i < fp.length; j = i++) {
    const [xi, yi] = fp[i], [xj, yj] = fp[j];
    if ((yi > D) !== (yj > D) && X < ((xj - xi) * (D - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// distance from a point to a polyline
function toLine(p, line) {
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
  }
  return best;
}
// the nearest point on a polyline
function nearestOn(p, line) {
  let best = Infinity, out = line[0];
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
    const q = [a[0] + t * dx, a[1] + t * dy], d = hyp(p, q);
    if (d < best) { best = d; out = q; }
  }
  return out;
}
// a deterministic random number per string (so a site's details never change between visits)
export function hashOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

// a tree's form from its card (trees/assign) or, failing that, its words
export function treeForm(t) {
  const card = String(t.card || ''), form = card.replace(/_\d+$/, ''), what = String(t.what || '');
  if (/^willow/.test(form) || (/^slender/.test(form) && /willow/i.test(what))) return 'willow';
  if (/^elm/.test(form) || (!form && /\belm\b/i.test(what))) return 'elm';
  if (/^bamboo/.test(form) || /bamboo/i.test(what)) return 'bamboo';
  return form || 'tree';
}

// straight runs along a polyline: chords [a, b] of about `len` m whose polyline strays under `dev` m from them
function runs(line, len, dev, keep) {
  const out = [];
  let i = 0;
  while (i < line.length - 1) {
    let best = null;
    for (let j = i + 1; j < line.length; j++) {
      const L = hyp(line[i], line[j]);
      if (L > len * 1.4) break;
      const mid = line.slice(i, j + 1);
      if (Math.max(...mid.map((p) => toLine(p, [line[i], line[j]]))) > dev) break;
      if (L >= len * 0.6) best = j;
    }
    if (best !== null) {
      // pull an end that lies outside the painted area back along the chord
      let a = line[i], b = line[best];
      const pull = (p, q) => { for (let k = 0; k <= 20 && !keep(p); k++) p = [p[0] + (q[0] - p[0]) * 0.05 * k, p[1] + (q[1] - p[1]) * 0.05 * k]; return keep(p) ? p : null; };
      a = pull(a, line[best]); b = a && pull(b, a);
      if (a && b && hyp(a, b) >= len * 0.5) out.push([a, b]);
      i = best;
    } else i++;
  }
  return out;
}

// the walkers' paths in map metres (people.json walkers: [[X, D], ...] or { route: [s0, s1] } on the road's stations)
function walkerPaths(layout, people) {
  const route = layout.route, out = [];
  for (const w of people?.walkers || []) {
    if (Array.isArray(w.path)) { out.push(w.path); continue; }
    if (!w.path?.route || !route?.centre) continue;
    const [s0, s1] = w.path.route, c = route.centre, st = route.stations;
    const at = (s) => { let i = 0; while (i < st.length - 2 && s > st[i + 1]) i++; const t = (s - st[i]) / (st[i + 1] - st[i]); return [c[i][0] + t * (c[i + 1][0] - c[i][0]), c[i][1] + t * (c[i + 1][1] - c[i][1])]; };
    const lo = Math.min(s0, s1), hi = Math.max(s0, s1);
    out.push([at(lo), ...c.filter((_, i) => st[i] > lo && st[i] < hi), at(hi)]);
  }
  return out;
}

const SPARROW_FOOD = [
  [/grain|sack|rice|seed|basket|heap|goods|bundle/i, 3],
  [/eatery|tea table|table|tray|counter|stall|food|bowl/i, 2],
  [/bench|crate|box|stand/i, 1],
];
const EATING = /eating|eatery|tea ?house|tavern|饭铺|酒馆|正店|restaurant|饭/i;
const STEAM = /steamer|stove|cauldron|griddle|eatery_rack|\boven\b/i;
const BANNER = /banner|flag|pennant|curtain|酒旗|flagpole/i;
const HEDGE = /hedge|wattle|brush ?fence|field|garden|vegetable/i;

export function sitesOf(layout, people = null) {
  const S = layout.section, E = layout.entities || {}, pa = layout.painted_area?.corners || null;
  const inPainted = (p, grow = 0) => !pa || inside(grow ? pa.map(([x, d]) => { const c = centroid(pa); const k = 1 + grow / Math.max(1, hyp([x, d], c)); return [c[0] + (x - c[0]) * k, c[1] + (d - c[1]) * k]; }) : pa, p[0], p[1]);
  const ents = Object.entries(E).map(([id, e]) => ({ id, ...e }));
  const trees = (layout.trees || []).filter((t) => Number.isFinite(t.height_m)).map((t) => ({ ...t, form: treeForm(t), id: t.map_id || `${S}.tree.${t.id}` }));
  const blds = ents.filter((e) => e.kind === 'building' && e.footprint?.length >= 3).map((e) => {
    const hs = Object.values(e.heights || {}).filter(Number.isFinite);
    const ridge = Object.entries(e.heights || {}).some(([k]) => /ridge|top/.test(k));
    // with only the eaves measured, the ridge stands about 0.36 x the narrower side above them (a roof of ~35 degrees)
    const sides = e.footprint.map((p, i) => hyp(p, e.footprint[(i + 1) % e.footprint.length])), narrow = Math.min(...sides);
    return { ...e, top: hs.length ? Math.max(...hs) + (ridge ? 0 : Math.min(3, 0.36 * narrow)) : 4.5, area: area(e.footprint) };
  });
  const figures = (layout.figures || []).map((f) => [f.X, f.D]);
  const paths = walkerPaths(layout, people);
  const out = { section: S, flocks: [], swallows: [], egrets: [], sparrows: [], bats: [], butterflies: [], catkins: [], seeds: [], leaves: [], smoke: [], steam: [], banners: [] };

  // ---- the sky: crows wheel round the tallest trees, pigeons over the roofs of a built-up section
  const tall = trees.filter((t) => t.height_m >= TALL && inPainted([t.X, t.D], 6)).sort((a, b) => b.height_m - a.height_m);
  const roofs = blds.filter((b) => b.area >= 12).sort((a, b) => b.area - a.area);
  const crowFlock = () => {
    const top = tall.slice(0, 3), c = centroid(top.map((t) => [t.X, t.D]));
    const spread = Math.max(...top.map((t) => hyp([t.X, t.D], c)));
    return { kind: 'crow', from: top.map((t) => t.id), X: c[0], D: c[1], alt: top[0].height_m + 9, R: Math.min(30, Math.max(14, spread + 12)) };
  };
  const pigeonFlock = () => {
    const top = roofs.slice(0, 4), c = centroid(top.map((b) => centroid(b.footprint)));
    const spread = Math.max(...top.map((b) => hyp(centroid(b.footprint), c)));
    return { kind: 'pigeon', from: top.map((b) => b.id), X: c[0], D: c[1], alt: Math.max(...top.map((b) => b.top)) + 9, R: Math.min(30, Math.max(16, spread + 10)) };
  };
  const cityish = roofs.length >= 6 && roofs.length >= 2 * tall.length;
  if (cityish && roofs.length) out.flocks.push(pigeonFlock());
  if (tall.length) out.flocks.push(crowFlock());
  if (!cityish && roofs.length >= 6) out.flocks.push(pigeonFlock());
  // crows at the painted nests: a pair round each, low over its tree
  for (const n of ents.filter((e) => /nest/i.test(e.name || '') && e.pos)) {
    const tree = trees.slice().sort((a, b) => hyp([a.X, a.D], n.pos) - hyp([b.X, b.D], n.pos))[0];
    out.flocks.push({ kind: 'crow', nest: true, from: [n.id], X: n.pos[0], D: n.pos[1], alt: (tree ? tree.height_m * 0.85 : 8) + 4, R: 7 });
  }

  // ---- swallows: straight runs of the road's centre line and the side roads, and over the water
  const roadLines = [];
  if (layout.route?.centre) roadLines.push([layout.route.id || `${S}.road.main`, layout.route.centre]);
  for (const e of ents) if (e.kind === 'road' && e.lines?.centre && e.id !== layout.route?.id) roadLines.push([e.id, e.lines.centre]);
  for (const [id, line] of roadLines) {
    for (const [a, b] of runs(line, 30, 1.6, (p) => inPainted(p))) out.swallows.push({ over: 'road', from: id, a, b, h: 1.6, halfW: 2.2 });
  }
  const waters = ents.filter((e) => e.kind === 'water' && e.lines);
  for (const w of waters) {
    for (const [side, line] of Object.entries(w.lines)) {
      if (!/shore/.test(side) || line.length < 2) continue;
      const sgn = /_n/.test(side) ? -1 : 1; // the water lies south of a north shore
      const off = line.map((p) => [p[0], p[1] + sgn * 5]);
      for (const [a, b] of runs(off, 32, 2.0, (p) => inPainted(p, 8))) {
        out.swallows.push({ over: 'water', from: w.id, a, b, h: (w.H ?? -0.7) + 0.9, halfW: 3, water: w.H ?? -0.7 });
        if (hyp(a, b) >= 20) out.egrets.push({ from: w.id, a, b, alt: (w.H ?? -0.7) + 2.6 });
      }
    }
  }
  // the road's runs first nearest the painted area's middle, then water, alternating, so a few swallows cover both
  const mid = pa ? centroid(pa) : [0, 0];
  const road = out.swallows.filter((s) => s.over === 'road').sort((p, q) => hyp(centroid([p.a, p.b]), mid) - hyp(centroid([q.a, q.b]), mid));
  const water = out.swallows.filter((s) => s.over === 'water').sort((p, q) => hyp(q.a, q.b) - hyp(p.a, p.b));
  out.swallows = [];
  for (let i = 0; i < Math.max(road.length, water.length); i++) { if (water[i]) out.swallows.push(water[i]); if (road[i]) out.swallows.push(road[i]); }
  out.egrets.sort((p, q) => hyp(q.a, q.b) - hyp(p.a, p.b));

  // ---- sparrows: in the open by grain, baskets, the eating places' tables and the stalls, clear of the painted people
  // and the walkers' paths; when flushed they go to the nearest tree crown or eave
  const cands = [];
  for (const e of ents) {
    if (e.kind !== 'prop' || !e.pos || (e.H ?? 0) > 0.3 || !inPainted(e.pos)) continue;
    const words = `${e.name || ''} ${e.id}`;
    const score = SPARROW_FOOD.reduce((a, [re, s]) => (re.test(words) ? Math.max(a, s) : a), 0);
    if (score) cands.push({ e, score });
  }
  cands.sort((a, b) => b.score - a.score || hashOf(a.e.id) - hashOf(b.e.id));
  const roadLine = layout.route?.centre || null;
  for (const { e, score } of cands) {
    // a spot a metre out from the thing, toward the road (where the dust and the spilled grain are)
    const toward = roadLine ? nearestOn(e.pos, roadLine) : [e.pos[0], e.pos[1] - 1];
    const d = hyp(toward, e.pos) || 1, step = Math.min(1.1, d * 0.5);
    let spot = [e.pos[0] + ((toward[0] - e.pos[0]) / d) * step, e.pos[1] + ((toward[1] - e.pos[1]) / d) * step];
    const ok = (p) => figures.every((f) => hyp(f, p) >= 0.9) && paths.every((l) => toLine(p, l) >= 1.2)
      && blds.every((b) => !inside(b.footprint, p[0], p[1]) || inside(b.footprint, e.pos[0], e.pos[1]));
    if (!ok(spot)) {
      // try round the thing
      const tries = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [e.pos[0] + Math.cos(k * Math.PI / 4) * 1.0, e.pos[1] + Math.sin(k * Math.PI / 4) * 1.0]);
      spot = tries.find(ok);
      if (!spot) continue;
    }
    if (out.sparrows.some((s) => hyp([s.X, s.D], spot) < 6)) continue;
    // where they go when flushed: the nearest tree crown, else the nearest eave
    const tree = trees.filter((t) => t.height_m >= 3).map((t) => [t, hyp([t.X, t.D], spot)]).filter(([, dd]) => dd < 18).sort((a, b) => a[1] - b[1])[0];
    let perch;
    if (tree) perch = { from: tree[0].id, X: tree[0].X, D: tree[0].D, H: (tree[0].H || 0) + tree[0].height_m * 0.62, r: Math.min(1.6, (tree[0].crown_m || 3) * 0.3) };
    else {
      const b = blds.map((x) => [x, hyp(centroid(x.footprint), spot)]).filter(([, dd]) => dd < 20).sort((p, q) => p[1] - q[1])[0];
      if (b) { const q = nearestOn(spot, [...b[0].footprint, b[0].footprint[0]]); perch = { from: b[0].id, X: q[0], D: q[1], H: (b[0].H || 0) + b[0].top - 0.6, r: 0.8 }; }
    }
    out.sparrows.push({ from: e.id, score, X: spot[0], D: spot[1], H: e.H || 0, perch: perch || null, r: 0.9 });
  }

  // ---- falling things from the trees: catkins from the willows, seeds from the elms, old leaves from the bamboo
  for (const t of trees.filter((x) => x.height_m >= 3.5).sort((a, b) => b.height_m - a.height_m)) {
    const crownR = Math.max(1.2, Math.min(4.5, (t.crown_m || t.height_m * 0.45) * 0.5));
    const e = { from: t.id, X: t.X, D: t.D, H: t.H || 0, top: t.height_m, crownR };
    if (t.form === 'willow' && t.height_m >= 4) out.catkins.push(e);
    else if (t.form === 'elm') out.seeds.push(e);
    else if (t.form === 'bamboo') out.leaves.push(e);
  }

  // ---- kitchen smoke over the painted eating places, steam at a painted steamer
  const eats = blds.filter((b) => EATING.test(b.name || '')).sort((a, b) => b.area - a.area);
  for (const b of eats) {
    const c = centroid(b.footprint), f = ((b.facing_deg ?? 270) * Math.PI) / 180;
    const depth = Math.sqrt(b.area) * 0.3; // toward the back, away from the open front
    const p = [c[0] - Math.cos(f) * depth, c[1] - Math.sin(f) * depth];
    if (out.smoke.some((s) => hyp([s.X, s.D], p) < 10)) continue;
    out.smoke.push({ from: b.id, X: p[0], D: p[1], H: (b.H || 0) + b.top + 0.3 });
  }
  for (const e of ents.filter((x) => x.pos && STEAM.test(`${x.id} ${x.name || ''}`))) out.steam.push({ from: e.id, X: e.pos[0], D: e.pos[1], H: (e.H || 0) + 1.3 });

  // ---- dusk: bats round the tallest trees and the biggest roof
  for (const t of tall.slice(0, 2)) out.bats.push({ from: t.id, X: t.X, D: t.D, alt: (t.H || 0) + t.height_m * 0.75, R: 5 });
  if (roofs[0]) { const c = centroid(roofs[0].footprint); out.bats.push({ from: roofs[0].id, X: c[0], D: c[1], alt: (roofs[0].H || 0) + roofs[0].top + 1.5, R: 6 }); }

  // ---- butterflies along the countryside's hedges and fences
  for (const e of ents.filter((x) => x.pos && HEDGE.test(x.name || '') && inPainted(x.pos))) out.butterflies.push({ from: e.id, X: e.pos[0], D: e.pos[1], alt: (e.H || 0) + 0.8, R: 1.6 });
  out.butterflies.sort((a, b) => hashOf(a.from) - hashOf(b.from));

  // ---- the painted banners and flags: their cloth sways a little more (ambient.js)
  for (const e of ents.filter((x) => x.pos && BANNER.test(`${x.id} ${x.name || ''}`) && !/furled/i.test(x.name || ''))) out.banners.push({ from: e.id, X: e.pos[0], D: e.pos[1] });
  return out;
}
