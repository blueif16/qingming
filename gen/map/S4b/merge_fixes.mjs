// Cross-unit fixes for S4b (S4 part 2, u 12600-15500), from the unit agents' reports (merge_notes.md says why) and
// the merge agent's crops (scratchpad S4b_merge/c_*.jpg). Edits the parts in place; idempotent.
// node gen/map/S4b/merge_fixes.mjs && node tools/scroll_map.mjs S4b merge && node tools/scroll_map.mjs S4b check
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
const join = (gid, ids) => { const g = get(gid); if (!g) { console.log(`missing group ${gid}`); return; } for (const id of ids) { const e = get(id); if (!e) { console.log(`missing ${id}`); continue; } if (e.group && e.group !== gid) { const old = get(e.group); if (old) old.members = old.members.filter((m) => m !== id); } e.group = gid; if (!g.members.includes(id)) g.members.push(id); } };
const add = (file, e) => { if (!get(e.id)) parts[file].entities.push(e); };
const addNote = (id, text) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (!(e.note || '').includes(text)) e.note = `${e.note ? e.note + ' ' : ''}${text}`; };
const CROPS = 'scratchpad S4b_merge';

// ---- 1. duplicates across units (retire one, fold its reading into the other) ----

// the thatched shade at the road's south edge between the two carts: t1 and t2 each recorded it (22 px apart). One
// canopy on one post. Keep t1's (t1 owns u < 13050; both readings of its pole put it on the t1|t2 line or in t1).
if (get('S4b.prop.thatched_canopy_13052')) {
  drop('S4b.prop.thatched_canopy_13052');
  addNote('S4b.prop.thatch_shade_13049', 'MERGE: t2 recorded the same canopy as S4b.prop.thatched_canopy_13052 (retired as a duplicate; its base (13052, 1278) was 22 px from this one). t2 read it as a large round canopy of palm thatch like a big umbrella, u 12900-13109 (v 1203-1250, centre ~(13005, 1225)), on a short boxy post with lattice sides under its east part (u 13043-13060, v 1247-1278); its other reading, a pole hidden under the centre at u ~13005, also makes it this unit\'s.');
}

// the signboard on the shop hall's front: t2 recorded a prop (on legs, or on the back wall); structures_w and t1 read
// it hung on the front between the posts at 13040 and 13077, just under the lintel (v 840-845). The merge agent's crop
// (c_signboard.jpg) shows the framed board right under the lintel between those posts, with two thin uprights below it
// that may be legs or a shelf's. Writing and boards on a building are the building's: keep it in the building.
if (get('S4b.prop.signboard_13060')) {
  drop('S4b.prop.signboard_13060');
  addNote('S4b.bld.shop_hall_13170', 'MERGE: t2 recorded the signboard as a prop, S4b.prop.signboard_13060 (retired as a duplicate of this building\'s board): a framed board u 13041-13080, v 845-888, three columns of illegible characters, a rail under it at v 888-896 and two thin uprights below it at u ~13054 and ~13068 down to v ~950. t2\'s other reading is a free-standing signboard on those two legs, inside the shop; structures_w and t1 read it hung on the front between the posts at 13040 and 13077 (kept). Built once, with the hall.');
}

// the big round domed canopy behind the tea house's east end: structures_e (S4b.prop.parasol_14872) and t5
// (S4b.prop.round_canopy_14905) recorded it. One thing. On the merge agent's crop (c_parasol.jpg) its lower rim meets
// the mat roof's top edge at v ~900, so it is drawn BEHIND that roof, which hides its foot; t5's base (under the apex,
// behind the roof) fits that, structures_e's (at the front post's foot, 14872, 1180) would put it in front. Keep t5's
// (t5 owns tile props at u >= 14850).
if (get('S4b.prop.parasol_14872')) {
  drop('S4b.prop.parasol_14872');
  const c = get('S4b.prop.round_canopy_14905');
  c.what = 'A big round, low-domed canopy with ribs radiating from its top, standing behind (north of) the tea house\'s east roof and the mat shed\'s west end, its lower rim hidden by their roofs: a large round mat parasol whose pole is hidden, or a rounded roof that is part of the tea house.';
  addNote('S4b.prop.round_canopy_14905', 'MERGE: structures_e recorded the same canopy as S4b.prop.parasol_14872 (retired as a duplicate): dome u 14787-15033, top v ~840, lower edge v ~900, ribs converging near (14903, 843); it saw a pole stroke below it at u 14870-14877 (v 903-937), in line with the tea house\'s post at 14864-14875 (v 1014-1180), and put its base at that post\'s foot (14872, 1180, est). The merge agent\'s crop (' + CROPS + '/c_parasol.jpg) shows the rim running along the mat roof\'s top edge, so the canopy stands behind that roof; the base is kept here, behind it. Readings, all low: (a) a big round mat parasol standing on the bank behind the roof, its pole hidden (structures_e; the man pointing at the boats stands just behind it); (b) a parasol fixed on the tea house\'s east post (structures_e\'s base); (c) a rounded roof of the tea house (t5\'s preference; the restyle paints a tiled dome). Built once either way.');
}

// the "white box" at the tea house's north-west corner: structures_e recorded it as a prop (a lamp-box or sign, or a
// doorway); t4 read it as a pale doorway with a lattice transom between two posts and left it to structures_e. On the
// merge agent's crop (c_whitebox.jpg) it is a pale panel with a small lattice and a cap above it, framed by the big
// elm's trunk on the west and a post on the east, at the west end of the hall's west eave: a doorway in the hall's west
// (back) wall, as the restyle also paints it. Part of the building.
if (get('S4b.prop.white_box_14147')) {
  drop('S4b.prop.white_box_14147');
  const t = get('S4b.bld.tea_house_14531');
  t.note = t.note.replace('The white box at the NW corner (S4b.prop.white_box_14147) may be a doorway in the back wall.', 'At the NW corner a pale doorway (MERGE, below).');
}
{
  const t = get('S4b.bld.tea_house_14531');
  if (!/pale doorway with a lattice transom/.test(t.what)) t.what += ' At its north-west corner a pale doorway with a lattice transom and a small cap opens in the west (back) wall beside the big elm\'s trunk; along the east bays\' front a low rail with capped end posts runs on the platform\'s edge.';
  addNote('S4b.bld.tea_house_14531', 'MERGE: (1) the doorway: structures_e had it as a prop, S4b.prop.white_box_14147 (retired): a pale panel u 14130-14168, v 905-1000 under a small lattice (v 885-905) and a dark cap (v 875-885), its east edge running on down as a post to v ~1030, 125 x 38 px; t4 read it as a doorway with a lattice transom between two posts (kept; the restyle paints a doorway too). (2) The front rail (t4 left it to structures_e, which did not name it; t5 called it a bench): a low rail at v 1195-1205 over u 14720-14862 with capped end posts at ~14722 and ~14857 running down to v ~1225, on the platform\'s front edge (crop c_rail.jpg); t5\'s reading, a long bench there, is the other. (3) t3\'s pale mottled shape between the big elm\'s stems (u 14045-14085, v 827-900) is not a figure (no head or outline, t3 and the merge agent): a light wall of this hall\'s west end or a cloth beyond the trunk; t3\'s "vertical board at (14180-14220, 860-940)" is this doorway\'s east post and the hall\'s west eave line, nothing separate. (4) t4 also saw a back opening at u 14497-14537, v 1013-1053 and a pale hanging curtain under the west lattice screen (u 14341-14392, v 1037-1150): part of this hall.');
}

// ---- 2. groups across unit edges ----
join('S4b.grp.saddled_horse_13378', ['S4b.fig.man_behind_donkey_13512', 'S4b.fig.man_bending_sack_13607']);
join('S4b.grp.tea_house_customers', ['S4b.fig.man_east_bay_14958', 'S4b.prop.long_table_15050', 'S4b.prop.slatted_box_15078', 'S4b.prop.small_box_14915']);
// the sedan (t1's, by the brief) and the attendant standing between its poles (t2's, by his foot)
add('t1.json', {
  id: 'S4b.grp.sedan_chair_13140', kind: 'group', name: 'the sedan chair set down, with its attendant',
  what: 'A dark-roofed sedan chair stands set down on the road just east of the first palm-covered cart, its poles running east; a young man in a long light robe stands between the poles at its east side, its bearer or attendant waiting. No passenger shows.',
  members: [], conf: 'med', src: '余辉: 豪车云集 (the sedan beside the palm-covered carts)',
  note: 'Made in the merge: t1 recorded the sedan (the brief gave it to t1), t2 the man between its poles (foot (13160, 1120)), and both asked for one group. It stands beside S4b.grp.palm_cart_13070 (the first cart) but is not part of it.',
});
join('S4b.grp.sedan_chair_13140', ['S4b.veh.sedan_chair_13140', 'S4b.fig.sedan_attendant_13160']);
// the horse at the second cart's rear stays its own group (not harnessed; the man holds the horse, not the cart)
addNote('S4b.grp.palm_cart_13455', 'MERGE: t1\'s horse and the man in the big hat at the cart\'s rear stay their own group, S4b.grp.horse_12900: the horse is not harnessed to the cart and the man holds its head; the restyle\'s "man in blue bending" at u 12945-13027 is the horse\'s lowered head (t1, conf med), and its "figure in white" at u 12900-12950 is the big-hat man\'s light robe.');
addNote('S4b.grp.horse_12900', 'MERGE: kept apart from S4b.grp.palm_cart_13455 (not harnessed; nobody in it works at the cart).');
addNote('S4b.veh.palm_cart_13455', 'MERGE (from t1): the cargo slung under the bed\'s rear half shows as a dark box at (12974-13042, 1525-1556) and a dark round thing at (13027-13053, 1570-1597): part of this cart\'s load.');

// ---- 3. boats: which end is the bow (the lead's rule, 2026-10-12) ----
// The end with the rudder or the sweep is the stern (`rear`). The river agent already read the bank (west) ends as
// bows and the outer (east) ends, which carry the rudder stock, the sweep, the tiller, as sterns. Nothing to swap.
const settled = 'MERGE (the lead\'s rule, 2026-10-12: the end with the rudder or the sweep is the stern): settled as recorded, front at the bank (west) end and rear at the outer (east) end with the stern gear; the "sterns to the bank" reading is retired, so front/rear and facing_deg stay as they are.';
for (const id of ['S4b.veh.boat_big_cabin_14928', 'S4b.veh.boat_arched_awning_14945', 'S4b.veh.boat_mat_cargo_14900', 'S4b.veh.boat_long_cabin_14850']) {
  const b = get(id);
  b.note = b.note.replace(' The lead\'s first look read sterns to the bank; if that is right, swap front/rear and bow_top/stern_top and turn facing_deg by 180.', ' The lead\'s first look read sterns to the bank (retired at the merge).');
  addNote(id, settled);
}
addNote('S4b.veh.boat_round_mat_15025', 'MERGE (the lead\'s rule, 2026-10-12: the end with the rudder is the stern): settled as recorded, rear at the transom with the rudder stock.');
addNote('S4b.veh.boat_small_cabin_15182', 'MERGE (the lead\'s rule, 2026-10-12: the end with the rudder is the stern): the tiller-like stick at the east end marks the stern, so the recorded bow (the up-swept west end) stands.');
addNote('S4b.veh.boat_big_cabin_14928', 'MERGE (the lead\'s note on this boat): the part already runs to the true stern, so nothing is extended: rear is the stern\'s foot (15745, 865, est) under the raked end (15760, 777), with the after cabin to u 15805 and the sweep blade to (15855, 897) as part of the boat (merge agent\'s overlay, ' + CROPS + '/ov_bigboat_east.jpg). S3\'s t1 agent read a "bow at about (15790, 670-755)": that is this after cabin\'s eave tip (15805, 685) over the stern. S3\'s river_w does not record this boat.');

// ---- 4. painted things both sides left to each other (added here) ----

// the stippled hooked trunk on the bank by the boats' bank ends: the river agent left it to t4, t4 to the river agent
add('t4.json', {
  id: 'S4b.tree.stump_14805', kind: 'tree', name: 'gnarled stump on the bank by the boats\' bank ends',
  what: 'A short, thick, gnarled trunk outlined in moss dots stands at the edge of the bank just west of the moored boats\' bank ends, rising and hooking over to the east with a dark knob at its top: an old stump or a small bent tree, bare.',
  pts: { base: [14805, 345, 'est'], top: [14832, 220] }, support: 'bank top', vis: 'full', conf: 'low',
  note: 'Added in the merge: the river agent left it to t4 ("a stippled small tree or heap u 14790-14840, v 222-345, base ~(14808, 345)") and t4 left it to the river agent ("a dark mottled curved upright at u 14790-14850, v 215-340, knob at (14825, 220): a rafted boat\'s sternpost, or a mossy stump on the bank"); nobody recorded it. On the merge agent\'s crops (' + CROPS + '/c_stump.jpg at zoom 2.5, c_stump_z4.jpg at zoom 4) it is a broad band outlined in stipple dots, the painter\'s mark for mossy bark or rock: from its foot at about (14800-14810, 335-345) up to (14800, 290), curving east to (14830, 255) and up to a dark knob at (14823-14840, 220-235). Its foot is on the river agent\'s bank_top line (about (14812, 345) there), so it stands on land. Other readings: a heap or a post wrapped in matting (the river agent), or the bank end of a rafted boat (t4). The restyle paints sacks with a seated man here; the scan has neither.',
});
// the two dark lens-shaped masses behind the long south hall's ridge: structures_e left them to t4 and t5 (in the
// hall's note); neither recorded them
const heapNote = (crop, ext) => `Added in the merge: structures_e named both masses in S4b.bld.south_hall_long_14680's note and left them to t4 and t5, who did not record them. On the merge agent's crop (${CROPS}/${crop}) this is a separate lens shape with long parallel hatching (${ext}) lying above the ridge's double line, not the ridge drawn heavy. Readings: (a) a heap or long bundle (straw, reeds or firewood) lying on the road's south edge behind the ridge, its foot hidden by the ridge (taken; the restyle paints straw bundles, and the two men on the road just east stand with their feet est at the same v); (b) a thatch or mat capping lying on the hall's ridge. Size about 3 m long and 0.5 m high at the road's scale.`;
add('t4.json', {
  id: 'S4b.prop.bundle_heap_14680', kind: 'prop', name: 'long low heap or bundle behind the long hall\'s ridge (west)',
  what: 'A long, low, lens-shaped dark mass drawn with long parallel hatching, lying just north of the long south hall\'s ridge at the road\'s south edge: a heap or long bundle of straw, reeds or firewood.',
  pts: { base: [14680, 1258, 'est'], end_w: [14555, 1257], end_e: [14800, 1262], top: [14680, 1218] }, support: 'ground', vis: 'part: its foot hidden behind the long hall\'s ridge', conf: 'low',
  note: heapNote('c_ridge_w.jpg', 'u 14555-14800, v 1215-1262'),
});
add('t5.json', {
  id: 'S4b.prop.bundle_heap_14970', kind: 'prop', name: 'long low heap or bundle behind the long hall\'s ridge (east)',
  what: 'A second long, low, lens-shaped dark mass with long parallel hatching just north of the long south hall\'s ridge, east of the first, below the tea house\'s east end: a heap or long bundle of straw, reeds or firewood.',
  pts: { base: [14970, 1265, 'est'], end_w: [14880, 1262], end_e: [15060, 1266], top: [14965, 1226] }, support: 'ground', vis: 'part: its foot hidden behind the long hall\'s ridge', conf: 'low',
  note: heapNote('c_ridge_e.jpg', 'u 14880-15060, v 1225-1266'),
});
addNote('S4b.bld.south_hall_long_14680', 'MERGE: the two lens-shaped masses along the ridge are now props, S4b.prop.bundle_heap_14680 and S4b.prop.bundle_heap_14970 (low).');
// a third willow head with a hidden trunk: t4 left it to t3 by its u; t3 did not record it
add('t3.json', {
  id: 'S4b.tree.willow_head_14090', kind: 'tree', name: 'willow (head and whips only) over the big elm\'s fork',
  what: 'Willow whose fine bare whips radiate upward from a knob above the big two-stemmed elm\'s fork, fanning over the big roof behind the trees; its trunk is unseen. Bare, early spring.',
  pts: { base: [14090, 700, 'est'], top: [14100, 245], crown_w: [14010, 300], crown_e: [14200, 320] }, support: 'ground',
  vis: 'part: only the head (knob and whips); the trunk is hidden behind the big elm\'s east stem and the tea house\'s roof', conf: 'low',
  note: 'Added in the merge: t4 saw a third willow fan converging at about (14090, 390) (u 14010-14200, v 250-480) and left it to t3 by its u; t3 did not record it. On the merge agent\'s crop (' + CROPS + '/c_fan.jpg, zoom 2) the knob is at about (14080-14095, 380-395) and fine straight whips fan up to v ~250 over u 14010-14200, unlike S4b.tree.forked_elm_14045\'s crooked, dark, budded twigs. Base est on the ground behind the tea house\'s back roof (v ~700, as t4 placed S4b.tree.willow_head_14300 and _14470); it could be anywhere at v 600-1000 behind the elm\'s east stem and the tea house\'s roof. Other reading: the upper whips of S4b.tree.willow_head_14300 (its knob is 215 px east and 100 px higher). The restyle paints a hipped tiled roof here, with the whips as twigs.',
});
addNote('S4b.grd.near_bank_14850', 'MERGE: the stippled small tree or heap on the bank is S4b.tree.stump_14805 (added in the merge).');
addNote('S4b.bld.roof_behind_trees_13980', 'MERGE: structures_e did not record this roof, so this entity stands alone. t4 saw its east part as a pale roof-like shape behind the trees at u 14020-14130, v 200-290 (the restyle paints a hip roof over u 14050-14300, v 190-450); the whips of S4b.tree.willow_head_14090 fan across it.');

// ---- 5. readings settled between units (notes only) ----
addNote('S4b.prop.big_jar_12707', 'MERGE: kept with the man (S4b.fig.man_dark_cap_by_stair_12700). On the merge agent\'s crop (' + CROPS + '/c_jar.jpg, zoom 3) the pale shape has a straight rim line on top and a closed, rounded dark outline round its bottom, like a vessel, with the man\'s torso showing above it (v 936-975): a jar is the likelier reading than his lap. Both stay low until the second pass.');
addNote('S4b.fig.man_dark_cap_by_stair_12700', 'MERGE: S4b.prop.big_jar_12707 is kept as a jar in front of him (straight rim, closed bottom outline), so he is likelier standing or seated behind it than holding it on his lap.');
addNote('S4b.fig.man_frame_or_hat_15125', 'MERGE: structures_e independently read the shape over him as "a stall with a slanted top under the mat shed, 15100-15180, v 1080-1165" (reading c). On the merge agent\'s crop (' + CROPS + '/c_frame.jpg) the long strokes hanging from its east edge end at about v 1220, some 40 px above the ground he stands on (feet est ~1260): legs of a frame carried on his back (reading a) rather than a stand on the ground, so no stall prop is added. Readings (a) and (b) stay.');
{
  const m = get('S4b.bld.mat_shed_15038');
  m.what = m.what.replace('with a stall with a slanted top under its east end and people under it (t5\'s)', 'with people under it (t5\'s)');
  addNote('S4b.bld.mat_shed_15038', 'MERGE: the "stall with a slanted top" under its east end is the roof-like frame (or hat) of S4b.fig.man_frame_or_hat_15125 (no stall prop: see his note).');
}
addNote('S4b.road.main', 'MERGE: edge_n\'s "stall under the willows (~15100)" is the frame carried by S4b.fig.man_frame_or_hat_15125, not a stall; the point stays the ground behind the road pair.');
addNote('S4b.str.bank_shed_14445', 'MERGE: t4 reads the same roof on posts as a small roofed gate (roof u 14450-14600, v 490-640; posts at u 14465 and 14525-14529, a diagonal brace at u 14500-14520, v 625-660) through which the path leads north onto the riverside ground; its two figures (S4b.fig.man_at_gate_post_14540, S4b.fig.figure_behind_roof_14583) stand at its east posts. One structure either way.');
addNote('S4b.bld.south_hall_13920', 'MERGE: structures_e\'s reading of the same north gable, peak (14146, 1115), is the finial\'s foot; this entity\'s (14145, 1080) is its top (t4: ridge finial at u 14140-14160, v 1075-1110). Not a conflict.');
addNote('S4b.fig.porter_baskets_14778', 'MERGE: his feet are at the bank end of S4b.veh.boat_mat_cargo_14900\'s gangplank (bank end (14760, 402), boat end (14895, 463)): he walks up from it, so he is a candidate for 余辉\'s 客家登船 (unloading or boarding), as is S4b.fig.man_on_bank_14928.');

// ---- 6. supports: one key per height the frame can give ----
// t4's `bank slope` (the two figures at the roofed gate behind the tea house) is the same open ground as the shed they
// stand at (structures_e: `bank top`) and lies west of the river agent's bank_top line, which takes the bank top at
// street level: one key, `bank top`.
for (const id of ['S4b.fig.man_at_gate_post_14540', 'S4b.fig.figure_behind_roof_14583']) {
  const e = get(id);
  if (e.support === 'bank slope') { e.support = 'bank top'; addNote(id, 'MERGE: support `bank slope` normalised to `bank top`: the ground at the roofed gate (S4b.str.bank_shed_14445, on `bank top`) lies west of the river agent\'s bank_top line, which takes the bank top at street level.'); }
}

// ---- 7. second pass (2026-10-12): the frame agent accepts or declines each proposal ----
// Proposals: gen/map/S4b/second_pass/west.json (u 12600-14000) and east.json (u 14000-15500); their crops are in the
// scratchpad (S4b_second_west/z2_*.jpg, S4b_second_east/z_*.jpg, ow_*.jpg). merge_notes.md, "Second pass", lists them.
const SP = (half) => `scratchpad S4b_second_${half}`;
const spEnt = (half, id) => JSON.parse(fs.readFileSync(new URL(`./second_pass/${half}.json`, import.meta.url))).entities.find((e) => e.id === id);
const setPts = (id, pts) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } Object.assign(e.pts, pts); };

// W1 ACCEPTED: the slatted crate at the bottom shop's front (no entity or note named it; crop z2_crate.jpg shows the
// slatted box over the horse's back, apart from the slatted rack west of the shop's post).
add('t1.json', spEnt('west', 'S4b.prop.slatted_crate_12819'));
join('S4b.grp.bottom_shop_12750', ['S4b.prop.slatted_crate_12819']);
// W2 ACCEPTED (low, both readings in its note): the funnel-shaped vessel at the official hall's front, named only as
// "the table" in the standing man's what (README rule 6). Crops z2_trough.jpg, z2_lintel.jpg.
add('t1.json', spEnt('west', 'S4b.prop.funnel_vessel_12884'));
join('S4b.grp.hall_people_12800', ['S4b.prop.funnel_vessel_12884']);
addNote('S4b.fig.man_seated_front_of_hall_12866', 'SECOND PASS: his right arm reaches toward S4b.prop.funnel_vessel_12884 (low), the deep vessel at the railing just east of him.');
addNote('S4b.fig.man_standing_by_hall_12942', 'SECOND PASS: "the table" in his what is the deep funnel-shaped vessel S4b.prop.funnel_vessel_12884 (low).');
// W3 ACCEPTED, raised to med: the long bench between the long table and the counter. On the second pass's crop
// (z2_benches.jpg, zoom 3) the slanted plank on its own legs is drawn apart from the counter's top with the bowls.
add('t2.json', { ...spEnt('west', 'S4b.prop.bench_13200'), conf: 'med' });
join('S4b.grp.open_shop_13205', ['S4b.prop.bench_13200']);
addNote('S4b.prop.bench_13200', 'FRAME AGENT: accepted and raised to med: on z2_benches.jpg the seat is a separate slanted plank with its own legs, between the long table and the counter, whose top carries the bowls.');
addNote('S4b.prop.table_bowls_13275', 'SECOND PASS: the double line (13152, 926) -> (13235, 970) and the legs under it at u 13188-13221 are a separate long bench, S4b.prop.bench_13200 (accepted); the reading of that line as this counter\'s west side is retired. The receding edge above may be the bench\'s seat.');
// W4 ACCEPTED: the fan of fine whips at u 13090-13260 is S4b.tree.gnarled_13318's west crown; no further willow.
setPts('S4b.tree.gnarled_13318', { crown_w: [13090, 30] });
addNote('S4b.tree.gnarled_13318', 'SECOND PASS: crown_w moved from (13245, 110) to (13090, 30): the fan of fine straight whip strokes at u 13090-13260, v 12-170 converges at about (13275, 165) on this tree\'s west limb (fork (13340, 280), west limb up to (13260, 100)), like the east limb\'s fan over the top-street stall; no trunk shows between 13085 and 13318 above the roofs, so no further willow stands here. Other reading: the twig tips of S4b.tree.gnarled_13085, whose crown is dark knotted clumps instead (crop ' + SP('west') + '/z2_whips.jpg).');
{
  const g = get('S4b.tree.gnarled_13085');
  g.note = g.note.replace('may be its twigs or the whips of a further willow whose trunk does not show (not recorded)', 'is S4b.tree.gnarled_13318\'s west crown (second pass)');
}
// W5 ACCEPTED: the "dark head" at 12871 is the blob structures_w called a possible hanging lamp: an inverted dome hung
// from the lintel, no face or body under it (z2_lintel.jpg). Part of S4.bld.official_hall_12530: a seam note for the lead.
drop('S4b.fig.head_deep_in_hall_12871');
// W6 ACCEPTED (low): the "head" at 12908 sits across the lintel's lower edge with no body below it; the restyle paints
// a hung pot just east (z2_head12908.jpg, z2_hallheads.jpg). A second thing hung from S4's hall (seam note).
drop('S4b.fig.head_deep_in_hall_12908');
{
  const g = get('S4b.grp.hall_people_12800');
  g.what = 'In and in front of the official hall: the official sits at work on the raised floor, a man in a light robe sits in front of the railing beside a deep funnel-shaped vessel, a man in a cap stands at the east end, a dark-robed figure (or a hung robe) stands between the posts, and a man in a dark cap sits by the stair\'s foot behind a big jar.';
  addNote('S4b.grp.hall_people_12800', 'SECOND PASS: the two dim heads deep in the hall (S4b.fig.head_deep_in_hall_12871 and _12908) are retired: both sit on the hall\'s lintel with no body below; they are things hung from S4.bld.official_hall_12530 (a lamp, a bag or a pot: seam notes for the lead). The other reading, two people seated deep inside, is in merge_notes.md.');
}

// E1 ACCEPTED (low, three readings in its note): the small object just above the long hall's ridge (t4 left it to
// structures_e as a ridge finial; nobody recorded it).
add('t4.json', spEnt('east', 'S4b.prop.small_box_or_stool_14384'));
// E2-E4 ACCEPTED (med): the man in white sits on a stool with his knee drawn up; the "round stand" was his knee over
// the stool's seat and the "chair" was the table's east leg and his shin (z_white.jpg, z_white_enh.jpg).
drop('S4b.prop.round_stand_14600');
drop('S4b.prop.chair_14556');
add('t4.json', spEnt('east', 'S4b.prop.stool_14595'));
join('S4b.grp.tea_house_customers', ['S4b.prop.stool_14595']);
{
  const c = get('S4b.fig.customer_white_14560');
  c.what = 'Stout man in a light (white) robe with dark hair, seated on a low stool at the east end of the tea table with his right knee drawn up on the seat, facing the man in the dark hat across the table and half turned toward the viewer. A customer, or the tea-house keeper sitting with a guest.';
  c.pts.foot = [14561, 1177];
  addNote('S4b.fig.customer_white_14560', 'SECOND PASS: he sits on S4b.prop.stool_14595 (legs u 14579 and 14609); the oval at u 14575-14620, v 1115-1137 is his drawn-up knee, and his left foot shows at (14553-14567, 1171-1176), so foot (14561, 1177) is measured (was (14560, 1175) est). The round tray-stand and the chair at 14556 are retired.');
  get('S4b.grp.tea_house_customers').what = 'In the open hall of the tea house beside the road, customers sit at tables on chairs, stools and benches: a man in a dark hat and a stout man in white on a low stool face each other across a table, a man in a dark robe bends forward over a table end at the hall\'s west post, and a man in a dark cap leans on a table in the east bay; several benches and tables stand empty.';
}
// E5 ACCEPTED (low, both readings in its note): the round hatched object in front of the crouching figure.
add('t4.json', spEnt('east', 'S4b.prop.round_basket_or_drum_14795'));
// E6 ACCEPTED (med): the porter faces east down the gangplank toward the mat-cargo boat (z_porter_soft.jpg: face and
// raised hand on his east side). 330 = the gangplank's direction with dx 31.6: (14760, 402) -> (14895, 463) is
// 2.24 m east for 1.19 m south.
{
  const p = get('S4b.fig.porter_baskets_14778');
  p.facing_deg = 330;
  p.what = 'Porter in a short jacket and a dark cap, bent forward under a carrying pole across his shoulders with a round basket hung on cords at each end, one hand raised to steady the pole in front of his face, stepping east down the gangplank from the bank toward the mat-cargo boat.';
  addNote('S4b.fig.porter_baskets_14778', 'SECOND PASS: facing changed from 180 to 330 (conf med). On an unsharpened zoom-6 crop his face is a dark profile under the cap on its EAST side (14783-14790, 355-363), his raised hand holds the pole in front of it at (14790-14798, 357-367), his head is east of his hips, and his east leg steps down-right to (14788, 405) along the gangplank ((14745, 388) to the boat end (14895, 463)). The river agent read him facing east; t4 read west from the stride. He is loading or boarding the mat-cargo boat (余辉\'s 客家登船?), not coming off it, so the MERGE note\'s "walks up from it" is superseded. Crops ' + SP('east') + '/z_porter_soft.jpg, z_porter.jpg.');
}
// E7 ACCEPTED (low): the figure at the front rail crouches on the road, reaching east under the rail.
{
  const f = get('S4b.fig.figure_at_front_rail_14752');
  f.pose = 'crouching';
  f.pts.foot = [14775, 1232, 'est'];
  f.name = 'figure crouching in front of the tea house\'s front rail (faint)';
  f.what = 'Faint figure crouching on the road just in front of the tea house\'s low front rail, head at the rail\'s west part and body and arms reaching east under the rail toward a small round object (S4b.prop.round_basket_or_drum_14795, low); perhaps a boy or a servant.';
  addNote('S4b.fig.figure_at_front_rail_14752', 'SECOND PASS: the strokes below the head run east, not down: back and arms from (14745, 1191) to about (14785, 1225), under the rail (v 1192-1198) and 20-35 px below the platform\'s front edge (v ~1200-1207), so the figure crouches on the road in front of the rail (structures_e\'s reading too); pose standing -> crouching, foot est moved under the hips (14775, 1232). Support ground stays; the reading "squatting on the floor behind the rail" is dropped (his lower body is below the floor\'s edge). Crops ' + SP('east') + '/z_drum_enh.jpg, z_frontrail_enh3.jpg.');
}
// E8 ACCEPTED (low): bank_timber's "post" is the top of the mat shed's east verge; reading (c), a rail on a post, goes.
{
  const t = get('S4b.prop.bank_timber_15162');
  Object.assign(t.pts, { base: [15205, 912], end_w: [15157, 906], end_e: [15265, 928] });
  delete t.pts.top_w;
  t.what = 'A long, slightly curved double-lined band lying along the river bank\'s lip east of the tea house roof, from the mat shed roof\'s top east corner east into the willow\'s whips: the bank\'s lip, a log or timber edging laid along the bank, or a branch of the willow.';
  addNote('S4b.prop.bank_timber_15162', 'SECOND PASS: the "west end turning down like a short post" (u 15158-15166, v 902-930) is the top of S4b.bld.mat_shed_15038\'s east verge ((15147, 897) -> (15197, 1000)), so reading (c), a low rail on a post, has no post and is dropped. The band (about 10 px thick, (15157, 906) -> (15200, 911) -> (15240, 918), fading into the willow\'s whips at about (15265, 928)) runs near the line of the shed\'s ridge. Remaining readings, all low: (a) the bank\'s lip behind the shed (the river agent\'s est bank_top passes 5-15 px north of it); (b) a log or timber on the bank; (d) a branch of S4b.tree.willow_15468. Base moved to the band\'s middle (was the verge\'s foot (15162, 930)); top_w removed. Crops ' + SP('east') + '/z_timber.jpg, ow_timber.jpg.');
}
// E9 ACCEPTED (med): the south eave of the hall at the silk's edge, a row of tile-end marks at v ~1760.
setPts('S4b.bld.south_hall_edge_14945', { eave_w: [14692, 1765], eave_e: [14900, 1764] });
addNote('S4b.bld.south_hall_edge_14945', 'SECOND PASS: its south eave is drawn just above the silk\'s bottom edge: a row of curled tile-end marks along v 1752-1768 from the west hip\'s foot (14692, 1765) east to about u 14900, where the diagonal hall\'s roof covers it (eave_w, eave_e). The south slope therefore runs from the ridge (v 1519-1535) down to an eave at v ~1760; the south wall\'s foot is below the silk (the base corners stay placeholders). Crops ' + SP('east') + '/z_eave.jpg, ow_eave.jpg.');
// E10 ACCEPTED (the east pass's "checked" list): the head in the big boat's cabin door is a clear round blob framed by
// the doorway's posts (z_cabindoor.jpg): raised to med.
{
  const h = get('S4b.fig.head_in_cabin_door_15097');
  h.conf = 'med';
  addNote('S4b.fig.head_in_cabin_door_15097', 'SECOND PASS: a clear round dark blob (15090-15102, 697-710) framed by the doorway\'s posts (' + SP('east') + '/z_cabindoor.jpg): conf raised to med.');
}
// FRAME: the banks' `shore` lines are the same strokes as S4b.water.bian_river's shores, so they stand on the water
// (H -0.7), not the street: without this a bank's shore maps 1.05 m south of the water's. The mooring post stands in the
// water's edge (its foot on the shore point (14738, 662)), so it stands on the water too.
for (const id of ['S4b.grd.near_bank_14850', 'S4b.grd.far_bank_15330']) {
  const g = get(id);
  g.support_by = { ...(g.support_by || {}), shore: 'water' };
  addNote(id, 'FRAME: its shore line stands on the support `water` (support_by), like S4b.water.bian_river\'s shores; its bank_top on the ground (street level).');
}
{
  const p = get('S4b.prop.mooring_post_14737');
  if (p.support !== 'water') { p.support = 'water'; addNote('S4b.prop.mooring_post_14737', 'FRAME: support `ground` -> `water`: its foot (14737, 665, est) is on the shore point (14738, 662), in the water\'s edge, so it stands at the water level.'); }
}
// DECLINED: the east pass's optional tweak of S4b.prop.bundle_heap_14970's end_w to (14795, 1262). The thin tail at
// u 14795-14890 runs along the ridge's own double line, and the heap's reading is low either way; its thick part
// (14890-15030) is what the builder needs.

// RUN 2 (the area agent, 2026-10-12): the scroll HUD shows names to the player, and its index refuses digits in them
// (tools/scroll_index.mjs); this name cited "the S3 riverside hall". Same thing, said without the section key.
{
  const e = get('S4b.bld.house_behind_willow_15414');
  if (e && /\d/.test(e.name)) e.name = 'low tiled house behind the big willow, west of the riverside hall at the east seam';
}

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log('fixes applied');
