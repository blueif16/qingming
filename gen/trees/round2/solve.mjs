// Round 2 tree-card assignment: every tree of S7, S4b, S3, S2, S1 on a card of its painted form, under the check's rule
// (tools/tree_cards.mjs check: same card within 6 m never, within 15 m only mirrored; both radii x min(1, H/8 m)),
// with S4-S6 fixed as assigned. Greedy over random orders + local repair; best total kept.
// node solve.mjs [--write] [--iters 600]
import fs from 'node:fs';
import { P, KIT } from './prefs.mjs';
const Q = '/home/ran/3d_director/qingming';
const args = process.argv.slice(2);
const WRITE = args.includes('--write'), ITERS = +(args[args.indexOf('--iters') + 1] || 600);
const reg = JSON.parse(fs.readFileSync(`${Q}/web/public/assets/trees/trees.json`, 'utf8'));
const CFG = JSON.parse(fs.readFileSync(`${Q}/trees/cards.json`, 'utf8'));
const NEW = ['S7', 'S4b', 'S3', 'S2', 'S1'], OLD = ['S4', 'S5', 'S6'];
const NEAR = 15, CLOSE = 6, FULL = 8;
const MEAN = {
  willow_fan_1: 'a thick trunk leaning a little west with one long limb reaching west', willow_fan_2: 'tall and upright, three steep limbs, the crown lopsided east', willow_fan_3: 'twin trunks from one foot', willow_fan_4: 'a short stout trunk dividing low into a round crown',
  willow_burl_1: 'the bole leaning east, whips sweeping west', willow_burl_2: 'an upright hollow bole with three clubbed heads', willow_burl_3: 'the bole leaning west, a broad fan of whips', willow_burl_4: 'the colossal moss-dotted bole leaning west, roots running east, a dome of whips (16 m)', willow_burl_5: 'a huge low hollow bole, the trunk leaning hard up to the west (12 m)', willow_burl_6: 'the bole split into two legs like an inverted V under one knobbed head', willow_burl_7: 'a trunk leaning far up to the west to a pollard head lying almost level',
  elm_claw_1: 'a limb leaning west and an upright east limb', elm_claw_2: 'upright, with a hollow', elm_claw_3: 'forking, with wide level west limbs', elm_claw_4: 'a small young elm with a low spreading crown', elm_claw_5: 'two stems from one foot, the west one leaning out', elm_claw_6: 'a tall slender trunk with a small high claw crown',
  slender_1: 'dead straight, a few twigs at the top', slender_2: 'a long curve to the west', slender_3: 'a young willow with a small head of rising shoots', slender_4: 'a steep straight lean to the west', slender_5: 'a pale trunk leaning a little west to a small fan head of rising shoots', slender_6: 'two pale stems from one foot, each with a fan head', slender_7: 'a straight pale trunk with a wide fan head', slender_8: 'a grey trunk curving east near the top to a fan head lopsided east',
  shoot_tree_1: 'three or four stems, as wide as tall', shoot_tree_2: 'a coppice fan, much wider than tall', shoot_tree_3: 'a trunk leaning a little west, forking into two limbs, narrow', shoot_tree_4: 'a stubby pollard head with a wide sheaf of shoots',
  whip_clump_1: 'a wide even fan', whip_clump_2: 'a taller tuft, stems arching west',
  bamboo_1: 'tall and narrow', bamboo_2: 'broad and bushy', bamboo_3: 'a sparse young clump leaning west', bamboo_4: 'mixed heights', bamboo_5: 'a low young clump', bamboo_6: 'a narrow young clump on one straight culm',
  leafy_1: 'a low dark-leaved shrub', willow_weep_1: 'the bare hanging whips, a long limb arching east', hedge_1: 'a knee-high row of small leafy shrubs, 2.6 m',
};
for (let n = 1; n <= 7; n++) MEAN[`sapling_${n}`] = ['a single straight stem, a small round crown', 'a stem forking at half height into two limbs', 'a stem leaning west, the crown lopsided west', 'a very slender whip-like stem, a sparse narrow crown', 'two thin stems from one foot', 'a short stem forking low into a spreading crown', 'a stem with an S-bend, a small flat crown'][n - 1];

const trees = [];
for (const S of [...OLD, ...NEW]) {
  const ents = JSON.parse(fs.readFileSync(`${Q}/map/world/${S}.json`, 'utf8')).entities.filter((e) => e.kind === 'tree');
  const asg = OLD.includes(S) ? JSON.parse(fs.readFileSync(`${Q}/trees/assign/${S}.json`, 'utf8')) : null;
  for (const e of ents) {
    if (KIT[e.id]) continue;
    const t = { id: e.id, S, pos: e.pos, h: e.height_m || null };
    if (asg) { t.fixed = { card: asg[e.id].card, flip: !!asg[e.id].flip }; }
    else {
      const p = P[e.id];
      if (!p) throw new Error(`no reading for ${e.id}`);
      const cands = [];
      p.cards.forEach((c, i) => {
        if (c.endsWith(':*')) { const f = c.slice(0, -2); for (const n of Object.keys(CFG.forms[f].variants)) { const id = `${f}_${n}`; if (!cands.find((x) => x.card === id)) cands.push({ card: id, cost: 4 }); } }
        else if (!cands.find((x) => x.card === c)) cands.push({ card: c, cost: i === 0 ? 0 : 1.5 + 0.5 * i });
      });
      for (const c of cands) if (!reg[c.card]) throw new Error(`${e.id}: unknown card ${c.card}`);
      t.cands = cands; t.pflip = p.flip; t.what = p.what;
    }
    trees.push(t);
  }
}
for (const id of Object.keys(P)) if (!trees.find((t) => t.id === id)) throw new Error(`stale reading ${id}`);
const shown = (t, card) => (t.h ? reg[card].tree_m * Math.min(1.4, Math.max(0.7, t.h / reg[card].height_m)) : null);
const D = trees.map((a) => trees.map((b) => Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1])));
const nb = trees.map((_, i) => trees.map((_, j) => j).filter((j) => j !== i && D[i][j] <= 30));
const idx = Object.fromEntries(trees.map((t, i) => [t.id, i]));

// cost of tree i on (card, flip) given the current choice of every other tree; Infinity if the check fails
function cost(i, card, flip, ch) {
  const t = trees[i];
  let c = 0;
  const hi = shown(t, card);
  for (const j of nb[i]) {
    const o = ch[j];
    if (!o || o.card !== card) continue;
    const d = D[i][j], hj = shown(trees[j], card);
    const f = hi && hj ? Math.min(1, Math.max(hi, hj) / FULL) : 1;
    if (d <= CLOSE * f) return Infinity;
    if (d <= NEAR * f && o.flip === flip) return Infinity;
    if (d <= CLOSE) c += 3; // allowed only because the radii scale (small trees): still avoid
    if (d <= NEAR) c += 1; else c += 0.25; // variety where it is cheap; the fit to the painted shape comes first
  }
  return c;
}
function own(i, card, flip) {
  const t = trees[i];
  let c = t.cands.find((x) => x.card === card).cost;
  if (t.pflip !== null && flip !== t.pflip) c += 1.5;
  if (t.pflip === null && flip) c += 0.3;
  if (t.h) { const ratio = t.h / reg[card].height_m; if (ratio > 1.4) c += 8 * Math.log(ratio / 1.4); } // a card too small for a big tree
  return c;
}
function choose(i, ch) {
  let best = null;
  for (const { card } of trees[i].cands) for (const flip of [false, true]) {
    const v = own(i, card, flip) + cost(i, card, flip, ch);
    if (!best || v < best.v) best = { card, flip, v };
  }
  return best;
}
function total(ch) {
  let s = 0, fails = 0;
  trees.forEach((t, i) => { if (t.fixed) return; const v = own(i, ch[i].card, ch[i].flip) + cost(i, ch[i].card, ch[i].flip, ch) / 2; if (!isFinite(v)) fails++; else s += v; });
  return { s, fails };
}
// ejection chain: give tree i another option; neighbours it now clashes with choose again; keep if the total drops
function improve(ch) {
  const free = trees.map((t, i) => i).filter((i) => !trees[i].fixed);
  for (let pass = 0; pass < 8; pass++) {
    let better = false;
    for (const i of free) {
      const base = total(ch);
      for (const { card } of trees[i].cands) for (const flip of [false, true]) {
        if (ch[i].card === card && ch[i].flip === flip) continue;
        const save = new Map([[i, ch[i]]]);
        ch[i] = { card, flip };
        let ok = true;
        for (const j of nb[i]) {
          if (trees[j].fixed || !isFinite(cost(j, ch[j].card, ch[j].flip, ch)) === false) continue;
          save.set(j, ch[j]); ch[j] = null;
          const b = choose(j, ch);
          if (!b || !isFinite(b.v)) { ok = false; ch[j] = save.get(j); break; }
          ch[j] = { card: b.card, flip: b.flip };
        }
        const T = ok ? total(ch) : null;
        if (ok && (T.fails < base.fails || (T.fails === base.fails && T.s < base.s - 1e-9))) { better = true; base.fails = T.fails; base.s = T.s; continue; }
        for (const [k, v] of save) ch[k] = v;
      }
    }
    if (!better) break;
  }
}
let bestCh = null, bestT = null, seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let it = 0; it < ITERS; it++) {
  const ch = trees.map((t) => (t.fixed ? { ...t.fixed } : null));
  const order = trees.map((t, i) => i).filter((i) => !trees[i].fixed).sort((a, b) => (trees[a].cands.length + rnd() * 6) - (trees[b].cands.length + rnd() * 6));
  for (const i of order) { const b = choose(i, ch); ch[i] = b ? { card: b.card, flip: b.flip } : { card: trees[i].cands[0].card, flip: false }; }
  for (let pass = 0; pass < 6; pass++) { // local repair: each tree re-chooses given all others
    let moved = false;
    for (const i of order) { const cur = ch[i]; ch[i] = null; const b = choose(i, ch); ch[i] = b && isFinite(b.v) ? { card: b.card, flip: b.flip } : cur; if (ch[i].card !== cur.card || ch[i].flip !== cur.flip) moved = true; }
    if (!moved) break;
  }
  improve(ch);
  const T = total(ch);
  if (!bestT || T.fails < bestT.fails || (T.fails === bestT.fails && T.s < bestT.s)) { bestT = T; bestCh = ch.map((x) => ({ ...x })); }
}
console.log(`best: ${bestT.fails} trees failing the check, score ${bestT.s.toFixed(1)}`);
trees.forEach((t, i) => { if (!t.fixed && !isFinite(cost(i, bestCh[i].card, bestCh[i].flip, bestCh))) console.log('FAIL', t.id, bestCh[i].card, bestCh[i].flip); });

// report and why texts
const out = Object.fromEntries(NEW.map((S) => [S, {}]));
const notFirst = [], against = [];
trees.forEach((t, i) => {
  if (t.fixed) return;
  const c = bestCh[i], first = t.cands[0].card;
  const n = c.card.match(/_(\d+)$/)[1];
  let why = `${t.what.replace(/,? (mirrored so [^;]*|not mirrored[^;]*)$/, "")}; ${c.card.replace(/_\d+$/, '')} variant ${n} (${MEAN[c.card]})`;
  if (c.card !== first) {
    const near = nb[i].filter((j) => bestCh[j]?.card === first).sort((a, b) => D[i][a] - D[i][b])[0];
    why += near !== undefined ? `, not ${first}: ${trees[near].id} stands on it ${D[i][near].toFixed(1)} m away` : `, not ${first}: it was needed nearby`;
    notFirst.push(`${t.id}: ${c.card} (wanted ${first})`);
  }
  const twin = nb[i].filter((j) => bestCh[j]?.card === c.card && D[i][j] <= NEAR).sort((a, b) => D[i][a] - D[i][b])[0];
  if (c.flip) why += t.pflip === true ? '; mirrored for its lean, as painted' : twin !== undefined ? `; mirrored to differ from ${trees[twin].id} on the same card ${D[i][twin].toFixed(1)} m away` : '; mirrored';
  else if (t.pflip === true) { why += `; not mirrored, against its lean, to differ from ${twin !== undefined ? trees[twin].id : 'a neighbour'}`; against.push(t.id); }
  else if (t.pflip === false) why += '; not mirrored: it leans as drawn';
  out[t.S][t.id] = { card: c.card, flip: c.flip, why };
});
for (const [id, why] of Object.entries(KIT)) out[id.split('.')[0]][id] = { card: 'kit', flip: false, why };
for (const S of NEW) {
  const cards = new Set(Object.values(out[S]).map((a) => a.card).filter((c) => c !== 'kit'));
  console.log(`${S}: ${Object.keys(out[S]).length} trees on ${cards.size} cards`);
}
console.log('not on their first card:', notFirst.length ? '\n  ' + notFirst.join('\n  ') : 'none');
console.log('against the lean:', against.join(', ') || 'none');
if (WRITE) for (const S of NEW) {
  // map order (east to west as in the map's world file)
  const ents = JSON.parse(fs.readFileSync(`${Q}/map/world/${S}.json`, 'utf8')).entities.filter((e) => e.kind === 'tree').map((e) => e.id);
  const o = {}; for (const id of ents) o[id] = out[S][id];
  fs.writeFileSync(`${Q}/trees/assign/${S}.json`, JSON.stringify(o, null, 1) + '\n');
  console.log(`wrote trees/assign/${S}.json`);
}
// cluster print: node solve.mjs --show S1 330 360
if (args.includes('--show')) {
  const k = args.indexOf('--show'), S = args[k + 1], x0 = +args[k + 2], x1 = +args[k + 3];
  trees.forEach((t, i) => { if ((t.S === S || S === 'all') && t.pos[0] >= x0 && t.pos[0] <= x1) console.log(t.id.padEnd(40), t.pos.map((v) => v.toFixed(1)).join(','), 'h', t.h, '->', bestCh[i].card + (bestCh[i].flip ? ' m' : ''), t.cands ? `(want ${t.cands[0].card}${t.pflip === true ? ' m' : ''})` : '(fixed)'); });
}
if (args.includes('--why')) {
  const id = args[args.indexOf('--why') + 1], i = idx[id];
  for (const { card } of trees[i].cands) for (const flip of [false, true]) {
    const conf = nb[i].filter((j) => bestCh[j]?.card === card).map((j) => `${trees[j].id}${bestCh[j].flip ? ' m' : ''} ${D[i][j].toFixed(1)}m`);
    console.log(card, flip, 'own', own(i, card, flip).toFixed(2), 'nb', cost(i, card, flip, bestCh), conf.join('; '));
  }
}
