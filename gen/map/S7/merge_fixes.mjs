// Cross-tile fixes for S7, from the agents' reports (merge_notes.md). Edits the parts in place; idempotent.
// node gen/map/S7/merge_fixes.mjs && node tools/scroll_map.mjs S7 merge
// Crops the decisions were read on: scratchpad/S7_merge/*.jpg (zoom 2-8 scan crops beside the restyle mosaic).
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
const add = (file, e) => { if (!get(e.id)) parts[file].entities.push(e); };
const noteOnce = (id, text) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (!(e.note || '').includes(text.slice(0, 40))) e.note = `${e.note || ''} ${text}`.trim(); };

// --- duplicates across units (a prop of one, a building part of the other) ---

// the railed piece at the back of the gate passage: t1 recorded it as a prop (S7.prop.bench_in_gate_hall_1293: bench,
// table or the foot of a screen); the structures pass as part of the gate hall (the back partition, u 1262-1326,
// v 707-759, under a post). On the zoom-3 crop a post runs from the lintel (v 652) straight into its top rail, which
// loose furniture would not have, and the restyle paints a fixed screen: it is the gate hall's partition. Retire t1's.
if (get('S7.prop.bench_in_gate_hall_1293')) {
  drop('S7.prop.bench_in_gate_hall_1293');
  noteOnce('S7.bld.gatehouse_1240', 'MERGE: t1 recorded the back partition as a prop (S7.prop.bench_in_gate_hall_1293: outline u 1260-1327, v 705-757, top v 705, rails v 712 and 727, foot line v 755-757, its post u 1293-1298 up to the lintel); retired as a duplicate, since the post running from the lintel into its top rail makes it fixed (a low screen or the lower half of a back door), part of this building. Its foot line v ~757 is the passage floor\'s back, at street level.');
}

// the small dark-topped shape at the open door leaf's edge, (1245-1257, 673-692): t1 recorded it as a low-conf figure
// (S7.fig.face_at_gate_door_1251, a peeking head, or a lamp); the structures pass as a lamp hanging from the lintel
// (pts lamp_w on the gate hall). One thing, built once: on a zoom-8 crop no cord or hook runs from the lintel (v 650)
// down to it (the vertical line beside it is the door leaf's edge), so the head reading stays open. t1's entity keeps
// both readings; the gate hall's point is renamed and its description points to the figure.
{
  const g = get('S7.bld.gatehouse_1240');
  if (g.pts.lamp_w) { g.pts.head_or_lamp_w = g.pts.lamp_w; delete g.pts.lamp_w; }
  g.what = g.what.replace('Two small objects hang from the lintel inside (a lamp at u ~1248 and a second lamp or hook at ~1337)',
    'Inside, a lamp or hook hangs from the lintel in the east part of the passage (u ~1337), and a small dark-topped shape shows at the edge of the open door leaf (u ~1248: S7.fig.face_at_gate_door_1251, a peeking head or a small lamp, one thing); the west half of the passage holds a light door leaf standing open against the west jamb, with a ring-knocker dot');
  noteOnce('S7.bld.gatehouse_1240', 'MERGE (from t1): the open door leaf spans u ~1207-1260 (v ~655-797), light, with its knocker dot at (1228,727): part of this building. The shape at (1245-1257, 673-692) that this pass read as a lamp is the same thing as t1\'s S7.fig.face_at_gate_door_1251 (pts head_or_lamp_w); no cord from the lintel is drawn.');
  noteOnce('S7.fig.face_at_gate_door_1251', 'MERGE: the structures pass read the same shape as a small lamp hanging inside the gate (S7.bld.gatehouse_1240, point head_or_lamp_w (1248,682)); it is one thing, to be built once, as this head or as that lamp. On a zoom-8 crop no cord or hook runs from the lintel (v 650) to it; the vertical line just east of it (u ~1257) is the door leaf\'s edge. The structures pass found no raised floor or step in the gate hall, so the support stays ground.');
}

// --- things each side left to the other ---

// the two long poles leaning on the 解 building's east eave: the structures pass left them to t2 ("props that lean on the
// building"), t2 left them to the structures pass ("slanted props and struts under the south eave"); nobody recorded them.
// Points from the structures pass, checked on a zoom-3 crop (scratchpad/S7_merge/poles_z3.jpg). One entity, as S6 did
// for S6.prop.leaning_poles_5045.
add('t2.json', {
  id: 'S7.prop.leaning_poles_1888', kind: 'prop', name: 'two long poles leaning on the 解 building\'s east eave',
  what: 'Two long poles (double-line strokes) leaning against the east eave of the 解 building, their tops on the eave and their feet on the ground to the south-east of it: the longer one from the eave\'s straight part down past the bench under the eave to the silk\'s bottom edge, the shorter one further south-west. Props for the eave, or poles stood against the building.',
  pts: { base: [1888, 1771, 'est'], top: [1815, 1598], foot_b: [1782, 1750], top_b: [1748, 1669] },
  support: 'ground', vis: 'part: the longer pole\'s foot at the silk\'s bottom edge (v ~1770)', conf: 'med', src: '',
  note: 'Pole A (1815,1598)->(1888,1771), about 188 px long, its foot est at the silk\'s bottom edge; pole B (1748,1669)->(1782,1750), its foot est at v ~1750. Both lean the same way, tops to the north-west. The restyle paints a pale board between them; the scan has plain silk there. Added in the merge: the structures pass and t2 each left them to the other. Whether they are the building\'s eave props (then part of S7.bld.jie_building_1800) is not painted: they stand on their own feet, so they are a prop.',
});

// the dark low mass at the railing's foot: the structures pass left it to t1 ("grass, a stone or a small animal"), t1
// left it to the structures pass ("ground or root strokes"); nobody recorded it. Zoom 4 (scratchpad/S7_merge/
// fence_foot_z4.jpg): a dark wash with a small peak, no head, no legs. S5 records such a lump as a prop
// (S5.prop.stone_5894).
add('t1.json', {
  id: 'S7.prop.stones_fence_foot_945', kind: 'prop', name: 'low dark stones at the railing\'s foot (low)',
  what: 'A low, dark, irregular mass on the ground at the foot of the railing west of the gate, just east of its west post: a few low stones (the restyle paints rocks), or the edge willow\'s root flare running east from its trunk under the seal.',
  pts: { base: [945, 897] },
  support: 'ground', vis: 'full', conf: 'low', src: '',
  note: 'Dark wash with a small peak at about (945,883), u ~915-970, v 880-897 (merge, zoom 4): about 55 x 15 px (0.7 x 0.2 m). No head or legs are drawn, so it is not an animal. Readings: (a) low stones at the railing\'s foot; (b) the root flare of S7.tree.willow_edge_855 (base est (855,888), under the seal): then retire this and add it to the willow\'s note. Added in the merge: the structures pass and t1 each left it to the other.',
});
noteOnce('S7.str.fence_960', 'MERGE: the dark low shape at its foot is S7.prop.stones_fence_foot_945 (low).');

// the shop's back counter: t2's prop has its base at v 740 (est) on the line it took for the counter's foot; the
// structures pass reads a counter or low platform with its top at v 733 and its foot at v 793-797, a rack of boxes or
// drawers above it (v 693-723), and t2 itself sees the back wall's foot at v 795-802. On the zoom-2 crop the long foot
// line at v ~795-800 runs u ~1540-1745 with the counter's east end post (u 1742-1747) from 733 down to it: base at 797.
// Both units gave it to t2 as furniture, so it stays a prop.
{
  const c = get('S7.prop.counter_back_1675');
  if (c.pts.base[1] !== 797) {
    c.pts.base = [1675, 797, 'est'];
    c.conf = 'med';
    c.name = 'counter along the back wall, with a rack of boxes or drawers on it';
    c.what = 'Long counter or low platform along the shop\'s back wall, its east end on a post, with a rack of small boxes or drawers (a medicine rack) and small objects set on it, behind the doctor\'s armchair.';
    c.note += ' MERGE: base moved from v 740 (est) to the counter\'s foot line, v ~797 (the structures pass: top v 733, foot v 793-797, box u 1634-1747 with its east end post at 1742-1747; rack u 1597-1735, v 693-723); at v 740 it would stand about 1.1 m behind the shop\'s back wall. The rack and the objects on it are part of this entity. Seen by both units, so conf med; whether it is built in is the builder\'s choice (it stays one thing).';
  }
}

// the rail under the 解 building's east eave (u 1855-1923, v 1604-1630): the structures pass left it to t2 as "a rail or
// counter top", t2 named it in its bench's note as "its back, or the building's". It sits up under the eave, above
// the bench's own top (v 1665-1673) and not joined to its legs: part of the building (a sill or shelf under the eave).
noteOnce('S7.bld.jie_building_1800', 'MERGE: the rail under the east eave at v 1604-1630 (u 1855-1923) is part of this building (a sill, a shelf or the top of a low wall under the eave; t2 read it as the bench\'s back or the building\'s). The things under the eave are, by ID: the stand with legs S7.prop.bench_jie_eave_1885, the two leaning poles S7.prop.leaning_poles_1888 (added in the merge) and the tub S7.prop.tub_slatted_1973.');
noteOnce('S7.prop.bench_jie_eave_1885', 'MERGE: the rail above it at v 1604-1630 is part of S7.bld.jie_building_1800 (a sill or shelf under the eave), not this bench\'s back; this entity is the stand with its legs only.');

// the street's south edge west of the small gate roof: t1 left the drawn ledge to the structures pass. On the zoom-2 crop
// a short double line runs at v ~1285-1290 from u 1043 to ~1095; the dashes east of it to u ~1204 are the bare tree's
// twig tips. edge_s takes its two ends as measured points.
{
  const rd = get('S7.road.main');
  const es = rd.pts.lines.edge_s;
  if (!es.some((p) => p[0] === 1043)) {
    es.splice(1, 0, [1043, 1287], [1095, 1287]);
    rd.note += ' MERGE (from t1): a short ledge is drawn at the street\'s south edge, a double line at v ~1285-1290 from u 1043 to ~1095 (a kerb, or the lip where the ground drops to the bottom trees); edge_s takes its ends as measured points. The dashes running on east to u ~1204 are twig tips of S7.tree.bare_bottom_1117, not the ledge.';
  }
}

// the street's north edge east of the shop: the structures pass's note says it runs "north round the box-like structure
// east of the shop (its front hidden ..., est v ~860)", but its points (1800,860)->(1930,800) cut diagonally through that
// structure's own footprint (S7.str.box_shed_1855: sw (1793,870), se (1919,870), ne (1958,830)), putting the shed half in
// the street. edge_n now follows the shed's est front and east side to S6's wall foot at the seam (all est, as before).
{
  const en = get('S7.road.main').pts.lines.edge_n;
  const i = en.findIndex((p) => p[0] === 1800 && p[1] === 860);
  if (i >= 0) {
    en.splice(i, 2, [1793, 870, 'est'], [1919, 870, 'est'], [1958, 830, 'est']);
    noteOnce('S7.road.main', 'MERGE: edge_n east of the shop now runs along the est front and east side of S7.str.box_shed_1855 ((1793,870), (1919,870), (1958,830)) to (2000,800), instead of (1800,860)->(1930,800), which cut through the shed\'s footprint.');
  }
}

// --- notes linking the two readings of one place ---

// t2's leaning hatched panel and the structures pass's box-like shed: not the same strokes. The shed's top is at v 726-749
// and its west side runs (1813,726)->(1793,766); the panel runs from (1838,797) down to its own foot block at v 922-945,
// in front of the shed's slatted front (v 808-823). Both stay; each names the other.
noteOnce('S7.prop.leaning_panel_1812', 'MERGE: kept. The shed\'s west side as the structures pass drew it, (1813,726)->(1793,766), lies above this panel\'s top (1838,797), and the panel has its own foot block: it leans in front of S7.str.box_shed_1855\'s slatted front (v 808-823) rather than being its side. If the second pass reads it as the shed\'s lower west wall, retire it into that entity.');
noteOnce('S7.str.box_shed_1855', 'MERGE: t2\'s S7.prop.leaning_panel_1812 (hatched panel from (1838,797) to a foot block at v 922-945) leans in front of its west end, and t2\'s S7.ani.pale_shape_1905 lies east of it in front of the house behind the well.');

// 赵太丞家's name board: t2 counted 6-7 character marks across it at zoom 2; the structures pass read four tablets with
// bracket clusters between them at zoom 5-8 (gen/map/S7/look/structures_board_*). The closer reading stands.
noteOnce('S7.bld.zhao_taicheng', 'MERGE: t2 counted about 6-7 character marks across the name board at zoom 2; this pass\'s zoom 5-8 reading (four tablets 趙 · 太 · 丞 · 家, bracket clusters between them) stands. The free-standing boards are S7.prop.board_zhao_west_a_1392, S7.prop.board_zhao_west_b_1433 and S7.prop.board_zhao_east_1775 (characters below the scan\'s resolution, copied as □); the back counter and rack are S7.prop.counter_back_1675.');

// --- supports: one key per height the frame can give ---

// the crow sits on the broad east slope of the north-south hall (the structures pass: ridge (1506,320)->(1748,18), its
// ridge-end ornament (1740-1750, 5-30) is t2's "gable apex ~(1745, 35)")
{
  const b = get('S7.ani.bird_roof_1735');
  if (b.support !== 'roof: S7.bld.hall_ns_1620') {
    b.support = 'roof: S7.bld.hall_ns_1620';
    b.note += ' MERGE: the roof is S7.bld.hall_ns_1620 (the long north-south hall): the bird is on its broad east slope (ridge (1506,320)->(1748,18), ridge-end ornament at (1740-1750, 5-30), east eave (1771,345)->(1857,241)). Its H goes in the frame as the support "roof: S7.bld.hall_ns_1620".';
  }
}

// ---- the second pass (one fresh agent over u 815-2000, looked to 2150: gen/map/S7/second_pass/all.json; its crops
// are in scratchpad/S7_second_pass/). The frame agent's decisions, each with its reason, read on the pass's crops
// (z_box8, i_gate_e, z_childknee, i_women, z_tubtop, i_jie_eave). Every item is accepted; the pass's texts are applied
// as written (`replace` only where its `from` is still there, so a rerun changes nothing).
{
  const pass = JSON.parse(fs.readFileSync(new URL('./second_pass/all.json', import.meta.url)));
  const DECISIONS = {
    // retirements
    'S7.prop.peaked_box_1346': 'accept: retired into S7.str.gate_block_east_1345. On the zoom-8 crop the front\'s west edge is vertical at u 1333-1334 down to the foot (v 901-904) and the front top is level at v 859; the "peak" is the top\'s west edge receding up-right at about -0.82 with no falling second slope, so it is a squared block\'s front-west corner, not a gabled lid. It stands below the passage\'s east jamb as the west block stands below the west jamb, and the restyle paints a block there (i_gate_e.jpg). The box reading stays in the block\'s note.',
    'S7.fig.child_at_knee_1547': 'accept: retired. At zoom 6 in grey, u 1530-1570 holds only long parallel fold strokes running unbroken from v ~790 to the hem (v ~880) over the women\'s feet; no closed head, hair wash or face shows anywhere in v 790-860. The restyle paints one child (the held one, its legs to v ~865). sections.md\'s "children" is a summary.',
    // changes
    'S7.str.gate_block_east_1345': 'accept: it takes over the retired box\'s strokes; sw (1334,902) and sw_top (1334,859) are measured, conf low -> med, the other corners est from the west block\'s size.',
    'S7.grp.gatehouse_1240': 'accept: follows from the box\'s retirement.',
    'S7.fig.pointing_man_1370': 'accept: follows from the box\'s retirement.',
    'S7.grp.zhao_taicheng_patients': 'accept: follows from the child\'s retirement.',
    'S7.fig.standing_woman_1567': 'accept: follows from the child\'s retirement.',
    'S7.prop.tub_slatted_1973': 'accept: the slats above the lattice band are painted (z_tubtop.jpg: fine verticals from the bar at v ~1522 down to the band at v ~1590); two readings, the tub\'s built height is the builder\'s recorded choice.',
    'S7.bld.jie_building_1800': 'accept: the other side of the tub\'s reading (b), and the east eave\'s double band running on to the silk\'s bottom edge.',
    'S7.prop.bench_jie_eave_1885': 'accept: on the zoom-3 crop (i_jie_eave.jpg) it stands on its own legs with diagonal braces, clear of the building\'s rail and post: conf low -> med.',
  };
  const decided = (id) => { if (!DECISIONS[id]) throw new Error(`second pass: no decision for ${id}`); return DECISIONS[id].startsWith('accept'); };
  for (const r of pass.retire) if (decided(r.id) && get(r.id)) drop(r.id); // the reason stays in `into`'s note (its add_note below)
  for (const c of pass.changes) {
    if (!decided(c.id)) continue;
    const e = get(c.id);
    if (!e) { console.log(`second pass: missing ${c.id}`); continue; }
    if (c.set) Object.assign(e, structuredClone(c.set));
    if (c.remove_members && e.members) e.members = e.members.filter((m) => !c.remove_members.includes(m));
    for (const rp of c.replace || []) {
      const s = e[rp.field] || '';
      if (s.includes(rp.from)) e[rp.field] = s.replace(rp.from, rp.to);
      else if (rp.to && !s.includes(rp.to)) console.log(`second pass: ${c.id}.${rp.field}: "${rp.from.slice(0, 50)}" not found`);
    }
    if (c.add_note) noteOnce(c.id, c.add_note);
  }
}

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log('fixes applied');
