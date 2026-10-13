// Cross-unit fixes for S2 (the canal wharves, u 20500-29050), round 2 (2026-10-12), from the 18 units' reports and the
// merge agent's crops (gen/map/S2/look/merge_*.jpg); why each fix: gen/map/S2/merge_notes.md.
// Edits the parts in place and is idempotent; entities the merge adds go to parts/merge.json.
// node gen/map/S2/merge_fixes.mjs && node tools/scroll_map.mjs S2 merge && node tools/scroll_map.mjs S2 check
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const mp = (parts['merge.json'] ||= { section: 'S2', entities: [] });
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
// drop one file's copy of an ID that two units recorded under the same ID (the other copy and its group stay)
const dropIn = (file, id) => { if (parts[file]) parts[file].entities = parts[file].entities.filter((e) => e.id !== id); };
const getIn = (file, id) => parts[file]?.entities.find((e) => e.id === id);
const join = (gid, ids) => { const g = get(gid); if (!g) { console.log(`missing group ${gid}`); return; } for (const id of ids) { const e = get(id); if (!e) { console.log(`missing ${id}`); continue; } if (e.group && e.group !== gid) { const old = get(e.group); if (old) old.members = old.members.filter((m) => m !== id); } e.group = gid; if (!g.members.includes(id)) g.members.push(id); } };
// move every member of group src into gid, then retire src
const absorb = (gid, src) => { const s = get(src); if (!s) return; join(gid, [...s.members]); drop(src); };
const addNote = (id, text) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (!(e.note || '').includes(text)) e.note = `${e.note ? e.note + ' ' : ''}${text}`; };
// replace text in every entity's what / note / name / support (a regex for IDs that are prefixes of others). The merge's
// own notes (from the first "Merge:" or "MERGE (" on) are left alone: they name retired IDs on purpose, and a rerun
// must not rewrite them
const swap = (from, to) => {
  const f = (s) => (typeof from === 'string' ? s.split(from).join(to) : s.replace(from, to));
  for (const e of all()) for (const k of ['what', 'note', 'name', 'support']) if (typeof e[k] === 'string') {
    const i = e[k].search(/Merge:|MERGE \(/);
    e[k] = i < 0 ? f(e[k]) : f(e[k].slice(0, i)) + e[k].slice(i);
  }
};
const add = (e) => { if (!get(e.id)) mp.entities.push(e); };
const setPt = (id, role, i, pt) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } const L = e.pts.lines[role]; L[i < 0 ? L.length + i : i] = pt; };

// ---- 1. seam duplicates and things recorded twice in disguise (retire one, keep the reading in the other's note)

// the rear tracker: t2 and t3 used the same ID (t3 recorded him so he could not be missed); t2's copy is kept
if (getIn('t3.json', 'S2.fig.tracker_rear_22172')) {
  dropIn('t3.json', 'S2.fig.tracker_rear_22172');
  addNote('S2.fig.tracker_rear_22172', 'Merge: t3 recorded the same man under this ID (foot (22173, 392), head (22151, 293), rear foot planted at (22193, 396), painted 99 px bent, about 105-110 px upright); t3\'s copy was dropped. t3 read the rope entering his hands at about (22165, 335) and on east (22180, 345), (22250, 375), (22350, 410), (22450, 432), (22520, 447), (22650, 460), (22800, 480), (22950, 500).');
}

// the donkey on the far street: t7 and t8 used the same ID; t7's copy is kept (its fore is 2 px inside t7's range)
if (getIn('t8.json', 'S2.ani.donkey_26098')) {
  dropIn('t8.json', 'S2.ani.donkey_26098');
  addNote('S2.ani.donkey_26098', 'Merge: t8 recorded the same animal under this ID (fore (26098, 136), hind (26119, 138), head (26088, 91); back line v 87-92 from u 26092 to 26122, legs at about u 26100, 26110, 26120 down to v 132-140; about 45 px to the back) and read it as a donkey or a horse facing the round-topped cart\'s horse head to head; t8\'s copy was dropped. Not joined to S2.grp.round_cart_26035: an animal facing the cart\'s horse head to head is not in its team.');
}

// the two heads above the big cabin boat's roofs: river_w's crew, t2's men on the bank (t2 recorded both readings)
if (get('S2.fig.man_behind_boat_roof_21503')) {
  drop('S2.fig.man_behind_boat_roof_21503');
  addNote('S2.fig.boatman_far_deck_21505', 'Merge: t2 recorded the same man on the bank behind the boat as S2.fig.man_behind_boat_roof_21503 (conf low, both readings; head u 21495-21512, v 128-142), retired: on the bank strip (edge v ~160-175) a man with his head at v 128 would be 30-45 px tall, far smaller than painted, so he is crew.');
}
if (get('S2.fig.man_behind_boat_stern_21673')) {
  drop('S2.fig.man_behind_boat_stern_21673');
  addNote('S2.fig.steersman_stern_21678', 'Merge: t2 recorded the same man on the bank as S2.fig.man_behind_boat_stern_21673 (conf low, both readings; cap u 21665-21685, v 130-147), retired for the reason given in S2.fig.boatman_far_deck_21505\'s note.');
}
addNote('S2.grp.boat_big_cabin_21120', 'Merge: river_w\'s two men are kept; t2\'s copies on the bank (S2.fig.man_behind_boat_roof_21503, S2.fig.man_behind_boat_stern_21673) were retired, and so was t2\'s post S2.prop.post_north_bank_21364 (this boat\'s deck post).');
// t2's post on the bank strip is the big cabin boat's deck post (river_w: custom point deck_post)
if (get('S2.prop.post_north_bank_21364')) {
  drop('S2.prop.post_north_bank_21364');
  addNote('S2.veh.boat_big_cabin_21120', 'Merge: t2\'s S2.prop.post_north_bank_21364 (a faint upright u 21362-21366 from the shop\'s sill v ~140 down to v ~188, read as a mooring post on the bank, conf low) was retired as this boat\'s deck post (pts.deck_post): it stands among the deck\'s gear (u 21353-21385, v 167-195), and the bank strip there is the shop\'s sill.');
}

// the elm-like tree behind the middle shed: t10 and t11 read the same trunk (16 px apart); t10's is kept (base in its range)
if (get('S2.tree.elm_top_28146')) {
  drop('S2.tree.elm_top_28146');
  const t = get('S2.tree.bare_28130');
  if (t) t.conf = 'high';
  addNote('S2.tree.bare_28130', 'Merge: t11 recorded the same tree as S2.tree.elm_top_28146 (conf high; retired as a duplicate): an elm-like tree just coming into leaf with small dabbed leaf clusters, trunk 28115-28142 at v 146, 28128-28151 at v 228, 28137-28155 at v 265, hidden by the roof at about v 285; fork at about (28120, 100-128); limbs to (28051, 74) and (28005, 28) west and (28100, 28) north; top (28070, 18); crown_w (27965, 90), crown_e (28220, 120). The leaf clusters at 28150-28250, v 115-265 hang from twigs of this tree and of S2.tree.elm_top_28292. Two agents read it, so conf high.');
}
swap('S2.tree.elm_top_28146', 'S2.tree.bare_28130');

// the great willow on the east bank: t8 and t9 read the same tree (13 px apart); by its base it is t9's
if (get('S2.tree.great_willow_27072')) {
  drop('S2.tree.great_willow_27072');
  addNote('S2.tree.willow_great_27068', 'Merge: t8 recorded the same tree as S2.tree.great_willow_27072 (retired as a duplicate; base (27072, 893), conf med, support bank slope): the trunk runs down the bank to roots at the water\'s edge; its other reading is a tree on the bank top at (26990, 655). The brief\'s trunk at 26700-26850 is the west end of the 250 px knobbed head. river_e puts the shore about 150 px lower than the roots (so the roots stand on the bank slope, not in the water). S2.str.wattle_fence_26890 (structures_e) is the hatched block under the head that t9 reads as a possible knob foot or second pollard.');
}
swap('S2.tree.great_willow_27072', 'S2.tree.willow_great_27068');

// the grain-sack heap east of the owner: t10's heap (6 sacks) and t11's east part (about 7) are the same sacks
if (get('S2.prop.sack_pile_28155')) {
  drop('S2.prop.sack_pile_28155');
  addNote('S2.prop.sack_heap_28144', 'Merge: t11 recorded the same heap as S2.prop.sack_pile_28155 (retired as a duplicate; base (28155, 920), west (28070, 895), east (28236, 905)) and counted about 7 sacks (+-1) at zoom 3.4: back long sack 28078-28131 v 840-867; sack 28113-28155 v 858-893; upright sack 28155-28196 v 840-882 (tied mouth at (28190, 840)); small sack 28175-28190 v 855-873; front long sack 28113-28202 v 893-950; sack 28193-28234 v 870-908; sack 28190-28225 v 896-935. The last two are the "more sacks under the porters\' feet at u 28200-28240" t10 left to t11, so the heap is 6-8 sacks from u 28065 to 28236 (builder: 7).');
}

// the south bank's mound: river_w and river_w2 both recorded it (crests within 5 px); river_w's is kept (its range)
if (get('S2.grd.south_bank_mound_21700')) {
  drop('S2.grd.south_bank_mound_21700');
  addNote('S2.grd.mound_south_bank_21420', 'Merge: river_w2 recorded the same mound as S2.grd.south_bank_mound_21700 (retired as a duplicate); its crest (21413, 1407), (21480, 1430), (21547, 1428), (21600, 1402), (21700, 1402), (21800, 1403), (21840, 1420), (21870, 1440), (21910, 1480), (21960, 1530), (21980, 1545) agrees with this one within 5 px and runs 20 px further east to (21980, 1545), where river_w2\'s S2.grd.south_bank_flat_21850 begins; the open boat\'s rope ends on its east face at (21905, 1490). structures_w\'s crest reading also agrees (it recorded none).');
}
swap('S2.grd.south_bank_mound_21700', 'S2.grd.mound_south_bank_21420');

// the steps at the terrace's west end: structures_w and river_w2 both recorded them; river_w2's landing stair is kept
// (landing stairs are the river agents', and it reads the treads)
if (get('S2.str.stone_steps_22950')) {
  drop('S2.str.stone_steps_22950');
  addNote('S2.str.landing_steps_22950', 'Merge: structures_w recorded the same steps as S2.str.stone_steps_22950 (conf low; retired as a duplicate): rounded stone marks stepping down to the right at u 22910-22995, v 407-475, top (22950, 410), foot (22955, 478, est), from the long house\'s east doors and the terrace\'s west end to the water\'s edge; its other reading is a rubble revetment under the terrace\'s west end.');
}
swap('S2.str.stone_steps_22950', 'S2.str.landing_steps_22950');

// the goods racks in the open shop by the halls: t6's racks and t7's stepped rack are the same strokes; t6's is kept
if (get('S2.prop.shop_goods_rack_25325')) {
  drop('S2.prop.shop_goods_rack_25325');
  addNote('S2.prop.goods_racks_25290', 'Merge: t7 recorded the same racks as S2.prop.shop_goods_rack_25325 (conf low; retired as a duplicate, merge crop gen/map/S2/look/merge_rack_25300.jpg): a stepped rack or shelves stacked with lattice-work wares rising from the front at the west (25255, 470) to the back at the east (25340, 390), extents u 25250-25400, v 390-480, with the shopkeeper S2.fig.shopkeeper_25360 behind it; t7\'s other reading is a stair rising toward a loft (then part of S2.bld.open_shop_25340).');
}

// t11's plank in the 望火楼's pavilion is the platform's front railing (structures_e: rail_w/rail_e, same strokes)
if (get('S2.prop.table_pavilion_28455')) {
  drop('S2.prop.table_pavilion_28455');
  addNote('S2.str.fire_tower_platform_28450', 'Merge: t11 recorded a long low plank table or bench in the pavilion, S2.prop.table_pavilion_28455 (conf low; plank 28400-28508, v 181-196), retired: the same strokes are this platform\'s front railing (rail_w (28400, 182) to rail_e (28513, 182), v 180-197), which t11 gave as its other reading. Nobody and nothing stands in the pavilion (余辉: a tower with no watchman).');
}

// t7's capped post under the warehouse is one of the plinth's posts, under the bay posts (structures_e, river_e)
if (get('S2.prop.mooring_post_26018')) {
  drop('S2.prop.mooring_post_26018');
  addNote('S2.bld.warehouse_26070', 'Merge: t7 recorded the capped post at u ~26018 as a mooring bollard, S2.prop.mooring_post_26018 (conf med; post 65 px tall, v 565-630, about 15 px thick, a band at v ~595 that may be a tied rope), and named its twin at u ~26128; retired as part of this building: on the merge crops gen/map/S2/look/merge_post_26018.jpg and merge_post_26128.jpg both are uprights on the plank face directly under the bay posts at u 26020-26025 and 26125-26135, i.e. the posts carried down through the platform (structures_e, river_e: "pillar feet"), and no boat\'s rope is drawn to either (river_e). Other reading (t7): free-standing mooring posts in front of the plinth; then three props (u ~25895, 26018, 26128).');
}
swap('mooring posts stand on it (t6\'s at (25207,548), t7\'s at (26018,630))', 'a mooring post stands on it (t6\'s at (25207,548)) and the warehouse plinth\'s capped posts face it (u ~26018 and 26128)');

// ---- 2. supports normalised to the frame's keys

for (const e of all()) {
  if (e.support === 'terrace floor: S2.bld.terrace') e.support = 'terrace floor: S2.bld.river_terrace_23250';
  if (e.support === 'upper floor: S2.bld.yanhe_yazuo_hall') e.support = 'upper floor: S2.bld.yanhe_yazuo_hall_25690';
}
swap(/support 'terrace floor: S2\.bld\.terrace' is a placeholder for its ID \(the merge completes it\)/, 'support \'terrace floor: S2.bld.river_terrace_23250\' (structures_w\'s terrace; the merge wrote the ID)');
swap(/S2\.bld\.terrace(?![_a-z0-9])/g, 'S2.bld.river_terrace_23250');
swap(/S2\.bld\.yanhe_yazuo_hall(?![_a-z0-9])/g, 'S2.bld.yanhe_yazuo_hall_25690');
// `boat ladder: S2.veh.boat_passenger_22545` stays: a new support key for the frame step (merge_notes.md)

// ---- 3. groups across units

// 逆水行舟: the five trackers haul the towed boat's rope; one scene, one group (as S3's merge did for its trackers)
const trk = get('S2.grp.trackers');
if (trk) {
  const ropeNote = trk.note;
  absorb('S2.grp.boat_towed_mast_23632', 'S2.grp.trackers');
  const g = get('S2.grp.boat_towed_mast_23632');
  g.name = '逆水行舟: the towed boat, its crew and its five trackers';
  g.what = 'The big boat with the mast is towed upstream (west) by five trackers walking in single file on the north bank about 2000 px west of it, bent forward on the one tow rope (pts.rope on S2.veh.boat_towed_mast_23632, from the masthead to the lead tracker\'s hands); its crew fend off the moored boats, mind the lines on the roof and look out, and a passenger sits at a window.';
  g.src = '名画记: 逆水行舟 (pin 15); Hansen plates 10-12 (the trackers); 张安治: the five trackers';
  addNote('S2.grp.boat_towed_mast_23632', `Merge: t2's group S2.grp.trackers (the five trackers, u 21867-22172) was absorbed into this group. Its note on the rope, kept: ${ropeNote.replace('river_m names the boat\'s ID (S2.veh.boat_..._<stem u>) and its rope\'s far end names this group', 'the boat is S2.veh.boat_towed_mast_23632 and its rope_end (21832, 197) is the lead tracker\'s hands')}`);
}
swap('S2.grp.trackers', 'S2.grp.boat_towed_mast_23632');

// the open-air eatery: t4's west end and t5's east half are one eatery under one shelter
add({ id: 'S2.grp.open_air_eatery_23760', kind: 'group', name: 'the open-air eatery under its shelter (west of the shop fronts)',
  what: 'The open-air eatery on the north bank between the terrace\'s pavilion and the shop fronts: tables and benches under and in front of a mat shelter on posts, nearly all empty; one man stands at its west end and one at the shelter\'s east post.',
  members: [], note: 'Merge: t4\'s S2.grp.eatery_west_23650 (west of u 23700) and t5\'s S2.grp.eatery_east_23820 (east of it) were folded into this group, as both asked; the shelter S2.bld.eatery_shelter_23750 (structures_w) joins it. t4\'s list of t5\'s furniture matches t5\'s props (t5\'s seam notes); t4\'s "stake on the tow rope" at (23940, 455) is the rope\'s toggle (river_m: rope_toggle), not an entity.' });
if (get('S2.grp.eatery_west_23650') || get('S2.grp.eatery_east_23820')) {
  absorb('S2.grp.open_air_eatery_23760', 'S2.grp.eatery_west_23650');
  absorb('S2.grp.open_air_eatery_23760', 'S2.grp.eatery_east_23820');
  join('S2.grp.open_air_eatery_23760', ['S2.bld.eatery_shelter_23750']);
}
swap('S2.grp.eatery_west_23650', 'S2.grp.open_air_eatery_23760');
swap('S2.grp.eatery_east_23820', 'S2.grp.open_air_eatery_23760');

// the grain unloading: t11's porters and the youth join t10's group (t11 wrote them as S2.grp.grain_porters, a placeholder)
for (const e of all()) if (e.group === 'S2.grp.grain_porters') delete e.group;
join('S2.grp.grain_unloading', ['S2.fig.youth_topknot_28222', 'S2.fig.sack_porter_back_28271', 'S2.fig.sack_porter_28343', 'S2.fig.sack_porter_bent_28432', 'S2.fig.bank_porter_28355']);
swap('S2.grp.grain_porters', 'S2.grp.grain_unloading');
addNote('S2.grp.grain_unloading', 'Merge: t11\'s members joined (they carried the placeholder group S2.grp.grain_porters): the young man bending over the heap S2.fig.youth_topknot_28222 (t10: head (28211, 773)), the porter with a sack on his shoulder S2.fig.sack_porter_back_28271, the porter walking east S2.fig.sack_porter_28343, a fourth porter bent under a sack further east S2.fig.sack_porter_bent_28432 (t11 only) and the porter climbing the bank S2.fig.bank_porter_28355 (from the second grain boat). t11\'s part of the heap was the same sacks as S2.prop.sack_heap_28144 (retired). The three men handing over tallies or clasping hands (t10\'s "tally men": S2.fig.handshake_youth_28163, S2.fig.bowing_man_28270, S2.fig.staff_man_28266) keep their own group S2.grp.handshake_28220, a vignette inside this scene.');
addNote('S2.grp.handshake_28220', 'Merge: t10 reads the same three men as the tally men of S2.grp.grain_unloading: the man with his back to the viewer handing something east (this group\'s S2.fig.handshake_youth_28163), the man in a hat receiving it (S2.fig.bowing_man_28270) and a man holding a tally stick upright (S2.fig.staff_man_28266).');
const staff = get('S2.fig.staff_man_28266');
if (staff && staff.conf === 'low') { staff.conf = 'med'; addNote('S2.fig.staff_man_28266', 'Merge: conf raised to med: t10 read him independently as a man holding a tally stick upright (u about 28245-28290, v 610-785).'); }

// river_w2 listed the mooring post among 豪华客船's group members without setting its group field
join('S2.grp.boat_passenger_crew', ['S2.prop.mooring_post_23126']);

// the cart scene: t6's horse and the man at its head join t5's cart group; the sack porters' file gets its third and fourth man
join('S2.grp.mule_cart_24305', ['S2.ani.horse_24565', 'S2.fig.man_at_horse_head_24506']);
join('S2.grp.sack_porters_24312', ['S2.fig.sack_porter_24537', 'S2.fig.sack_porter_bank_edge_24467']);
swap('pulled west by an ox at u ~24200-24275', 'pulled west by two mules at u ~24190-24275 (t5\'s S2.ani.cart_mule_lead_24192 and S2.ani.cart_mule_near_24215; t5 reads mules: no horns, slim bodies)');
swap('the ox cart stands across its front', 'the mule cart stands across its front');
swap('S2.fig.sack_porter_24453', 'S2.fig.sack_porter_24452');
addNote('S2.grp.sack_porters_24312', 'Merge: t6\'s S2.fig.sack_porter_24537 and river_m\'s S2.fig.sack_porter_bank_edge_24467 (the man bent under a sack at the bank\'s edge above the cargo boat\'s deckhouse, merge crop gen/map/S2/look/merge_bankedge_24450.jpg: a third figure, distinct from S2.fig.sack_porter_24452 whose feet are at v 432) joined the file.');
addNote('S2.fig.man_with_sticks_bank_24390', 'Merge: no tile recorded him (t5 and t6 left him to river_m), so river_m\'s entity stays.');
addNote('S2.fig.sack_porter_bank_edge_24467', 'Merge: no tile recorded him (t5 left the "sack-carrier above the roof" to river_m; t6 read a "sack mound or a porter"); kept, and joined to t5\'s porters S2.grp.sack_porters_24312.');
swap('they stand on land and are not members (they may be t5\'s, see their notes)', 'they stand on land and are not members (no tile recorded them; S2.fig.sack_porter_bank_edge_24467 is in t5\'s S2.grp.sack_porters_24312)');

// pin 16 聊天的伙计 is the pair in the cargo boat's deckhouse (t5 and river_m agree on the pair)
for (const id of ['S2.fig.man_seated_deckhouse_24393', 'S2.fig.man_leaning_deckhouse_24447']) {
  const e = get(id);
  if (e && !(e.src || '').includes('pin 16')) e.src = '名画记: 聊天的伙计 (pin 16, u 24280)';
  addNote(id, 'Merge: 名画记 pin 16 聊天的伙计 is this pair (t5: "the two men chatting in the small mat-roofed boat\'s cabin at u 24370-24480, v 530-590", which river_m reads as this boat\'s deckhouse); on the boat, not on land.');
}

// a wrong guessed ID in t8's group note
swap('S2.bld.wang_paper_horse_shop_26850', 'S2.bld.wang_paper_horse_shop_27100');

// ---- 4. painted things named only in a note (added at the merge, conf low, both readings)

add({
  id: 'S2.ani.bird_in_willow_21135', kind: 'animal', name: 'small dark bird (?) on a willow twig over the water',
  what: 'A small solid dark blot on a hanging willow twig high over the water west of the great willow\'s trunk, like a small bird perched on the twig (the twin of t2\'s S2.ani.bird_in_willow_21730 further east in the same crown).',
  pts: { fore: [21137, 651, 'est'], hind: [21130, 651, 'est'], head: [21135, 642] },
  support: 'perched: S2.tree.willow_great_21345', vis: 'full', conf: 'low',
  note: 'Added at the merge: named only in river_w\'s report and in S2.fig.man_in_river_20970\'s note ("a dark blob on a willow twig at about (21125, 640), probably a perched bird", left to t1, which did not record it). Merge crop gen/map/S2/look/merge_bird_21135.jpg (zoom 6): a blot about 14 x 11 px at u 21128-21142, v 641-652, darker and more solid than the whips\' line work. READINGS: a perched bird (taken), or a knot where whips cross. Whose twig: the great willow\'s crown reaches west to u ~20980 here (t2), so S2.tree.willow_great_21345. Facing unknown.',
});
add({
  id: 'S2.fig.crewman_beside_poler_23748', kind: 'figure', name: 'second figure behind the bow hood, beside the poler (uncertain)',
  what: 'A small figure standing on 逆水行舟\'s foredeck just east of the man fending off 豪华客船 with a pole: a round dark head and a narrow body between the converging lines of the two boats\' bows, feet hidden behind the bow hood.',
  pts: { foot: [23748, 893, 'est'], head: [23745, 778] }, support: 'boat deck: S2.veh.boat_towed_mast_23632', pose: 'standing',
  group: 'S2.grp.boat_towed_mast_23632', vis: 'part: below v ~840 hidden behind the bow hood; rigging lines cross him', conf: 'low',
  src: '名画记: 逆水行舟 (pin 15)',
  note: 'Added at the merge: named only in river_w2\'s left-to list ("a second figure at about (23750, 780-830)" beside the poler, left to river_m, which did not record or mention it). Merge crop gen/map/S2/look/merge_second_figure_23748.jpg (zoom 4): a round dark head u 23737-23755, v 775-797 and a body to v ~840 between converging lines. Foot est on the foredeck at the poler\'s deck level (S2.fig.boatman_fending_off_23688\'s foot est (23692, 893)): painted about 115 px against the poler\'s 133. READINGS: a second crewman behind the poler (taken), or a knot of the cargo boat\'s bow rigging and deck post (S2.veh.boat_cargo_hooded_bow_23715\'s bow, u 23700-23900). For the second pass.',
});
join('S2.grp.boat_towed_mast_23632', ['S2.fig.crewman_beside_poler_23748']);
// S3's units saw two things just east of the seam that S2 did not record (S3 reports t9 and structures_e)
add({
  id: 'S2.tree.bare_south_bank_20705', kind: 'tree', name: 'second bare tree on the south bank, behind the hall\'s west roof (uncertain)',
  what: 'A bare tree (a small pollard, or a bare deciduous tree) on the south bank east of the great dark-trunked tree: a fan of long, thin, straight bare stems rising from a point just above the south-bank hall\'s west hip and spreading up and east over the water among the dark tree\'s shoots.',
  pts: { base: [20705, 1458, 'est'], top: [20665, 900], crown_w: [20640, 940], crown_e: [20950, 1100] },
  support: 'ground', vis: 'part: its foot hidden behind S2.bld.south_bank_hall_21050\'s roof; its twigs mix with S2.tree.dark_trunk_willow_20530\'s shoots', conf: 'low',
  note: 'Added at the merge: S3\'s t9 saw "a second bare tree whose twigs fan over 20650-20950, v 930-1390, its trunk hidden behind that roof (~20680, 1330 est)" (seen east of the seam, for S2) and its twigs mixing with the dark tree\'s east of 20650; river_w read "uprights at u 20610-20690" as forked branches of the dark tree; t1 recorded one tree, whose shoots it gives out to crown_e (20830, 800). Merge crops gen/map/S2/look/merge_tree_20705.jpg (zoom 1.4) and merge_tree_20705_foot.jpg (zoom 3): a separate set of stems converges downward at u ~20650-20715, v 1300-1455, 60-100 px east of the dark tree\'s knobbed head (u 20515-20610, v 1230-1380), to a narrow foot just above the hall roof\'s hip line (v ~1470 here); base est there (the true foot is behind the roof, on the bank between the water, bank top v ~1265, and the hall). READINGS: its own tree (taken, conf low), or the east shoots of S2.tree.dark_trunk_willow_20530 (t1, river_w); then retire this one. For the second pass: the tree count matters to the user.',
});
add({
  id: 'S2.fig.figure_under_eave_20625', kind: 'figure', name: 'figure between the dark tree and the south-bank hall\'s west eave (uncertain)',
  what: 'A pale head in profile facing east, and perhaps a body below it, in the gap between the great dark-trunked tree\'s east side and the south-bank hall\'s west eave, at the silk\'s bottom edge.',
  pts: { foot: [20630, 1785, 'est'], head: [20625, 1632] }, support: 'ground', pose: 'standing', facing_deg: 0,
  vis: 'part: below the head crossed by the eave\'s brackets and the roof\'s hatching; foot at or below the silk\'s bottom edge', conf: 'low',
  note: 'Added at the merge: S3\'s t9 (head ~(20625, 1645), body to v ~1720) and S3\'s structures_e ("a figure stands at (20599-20656, 1628-1690)") read a figure here; S2\'s t1 named the same pale patch (u 20600-20645, v 1630-1700) and did not record it, because at 45 x 60 px it is twice a figure\'s head at this v ("the gap between trunk and eave brackets"). Merge crop gen/map/S2/look/merge_figure_20625.jpg (zoom 3): a light patch with a profile-like contour (brow, nose, chin facing east) at u 20600-20650, v 1630-1700 and diagonal strokes below it to v ~1760. READINGS: a person standing under the eave (taken, conf low; foot est at the silk\'s edge, painted ~155 px, as the south-bank figures, 145-196 px), or the pale gap between the trunk and the eave brackets (t1); then retire it. For the second pass.',
});

// things looked at and not added (each named in the entity nearest it, for the second pass)
addNote('S2.veh.boat_moored_mat_canopy_25145', 'Merge: the "tall figure at its stern" (t8, river_e: u ~26000-26020, v 720-800) reads on the merge crop gen/map/S2/look/merge_stern_26010.jpg as the rudder stock\'s ribbed, drum-shaped head with its ropes, not a man (no face; vertical ribs); not recorded. The second pass may look again.');
addNote('S2.bld.tiled_shed_27985', 'Merge: t11 left "a shape between the rear shed\'s two tables at 28112-28140, v 436-484 (posts or a standing figure)" to t10; on the merge crop gen/map/S2/look/merge_shape_28125.jpg (zoom 5) it is two shed posts (u ~28108-28115 and 28130-28137) and table legs, with no head: not recorded.');

// ---- 5. the water and the banks join at the river units' seams (the same point on both sides)

// u 20500 (S3): S3's shore is (20500, 310) est (the lead's note; map/strokes/S3.json); river_w had 330
setPt('S2.water.bian_river_w', 'shore_n', 0, [20500, 310, 'est']);
setPt('S2.grd.north_bank_20500', 'shore', 0, [20500, 310, 'est']);
// u 21850 (river_w | river_w2): shore 345 (river_w; on the merge crop the ripple lines start at v ~345-350; river_w2 had
// 425), bank top 274 (the mean of 248 and 300: the level ground under the lead tracker ends at v ~270-280, where the
// dark bank tufts begin); south shore on the mound's crest (21850, 1432) (river_w2 had 1418 behind it)
setPt('S2.water.bian_river_w', 'shore_n', -1, [21850, 345, 'est']);
setPt('S2.grd.north_bank_20500', 'shore', -1, [21850, 345, 'est']);
setPt('S2.grd.north_bank_20500', 'bank_top', -1, [21850, 274, 'est']);
setPt('S2.water.bian_river_w2', 'shore_n', 0, [21850, 345, 'est']);
setPt('S2.grd.north_bank_22550', 'shore', 0, [21850, 345, 'est']);
setPt('S2.grd.north_bank_22550', 'bank_top', 0, [21850, 274, 'est']);
setPt('S2.water.bian_river_w2', 'shore_s', 0, [21850, 1432, 'est']);
// u 23300 (river_w2 | river_m): both hidden under the terrace; the means of 500/492 and 435/470
setPt('S2.water.bian_river_w2', 'shore_n', -1, [23300, 496, 'est']);
setPt('S2.grd.north_bank_22550', 'shore', -1, [23300, 496, 'est']);
setPt('S2.grd.north_bank_22550', 'bank_top', -1, [23300, 452, 'est']);
setPt('S2.water.bian_river_m', 'shore_n', 0, [23300, 496, 'est']);
setPt('S2.grd.bank_n_23300', 'shore', 0, [23300, 496, 'est']);
setPt('S2.grd.bank_n_23300', 'bank_top', 0, [23300, 452, 'est']);
// u 26000 (river_m | river_e): river_e's, whose bank top is the warehouse plinth's measured foot
setPt('S2.water.bian_river_m', 'shore_n', -1, [26000, 665, 'est']);
setPt('S2.grd.bank_n_23300', 'shore', -1, [26000, 665, 'est']);
setPt('S2.grd.bank_n_23300', 'bank_top', -1, [26000, 632]);
for (const [id, t] of [
  ['S2.water.bian_river_w', 'Merge: seam points set so the reaches join: (20500, 310) est is S3\'s north shore (map/strokes/S3.json; this unit had 330); at u 21850 the north shore is (21850, 345) est on both sides (river_w2 had 425: on the merge crop gen/map/S2/look/merge_seam_21850.jpg the ripple lines start at v ~345-350) and the south shore is the mound\'s crest (21850, 1432).'],
  ['S2.water.bian_river_w2', 'Merge: seam points set so the reaches join: west (21850, 345) est and (21850, 1432) est (river_w\'s; this unit had 425 and 1418); east (23300, 496) est, the mean of this unit\'s 500 and river_m\'s 492 (hidden under the terrace).'],
  ['S2.water.bian_river_m', 'Merge: seam points set so the reaches join: west (23300, 496) est (the mean of river_w2\'s 500 and this unit\'s 492); east (26000, 665) est, river_e\'s (this unit had 650).'],
  ['S2.grd.north_bank_20500', 'Merge: seam points set: shore (20500, 310) est (S3\'s); at u 21850 bank_top (21850, 274) est, the mean of this unit\'s 248 and river_w2\'s 300 (on the merge crop the level ground under the lead tracker ends at v ~270-280 where the dark bank tufts begin), shore (21850, 345) est.'],
  ['S2.grd.north_bank_22550', 'Merge: seam points set: west bank_top (21850, 274) est and shore (21850, 345) est (this unit had 300 and 425); east bank_top (23300, 452) est and shore (23300, 496) est, the means with river_m\'s 470 and 492 (hidden under the terrace).'],
  ['S2.grd.bank_n_23300', 'Merge: seam points set: west bank_top (23300, 452) est and shore (23300, 496) est (the means with river_w2); east bank_top (26000, 632) and shore (26000, 665) est, river_e\'s (the warehouse plinth\'s foot; this unit had 615 and 650).'],
]) addNote(id, t);

// S2.road.main: edge_s takes river_w2's bank_top where structures_w had only its own estimate (its note's request),
// over 21950-22450; east of it river_w2's bank_top runs north of the road's centre (22600-23300), so the edges stay as
// they were and the conflict goes to the frame step (merge_notes.md)
const at = (line, u) => { for (let i = 0; i + 1 < line.length; i++) { const [a, b] = [line[i], line[i + 1]]; if (u >= a[0] && u <= b[0]) { const t = b[0] === a[0] ? 0 : (u - a[0]) / (b[0] - a[0]); const v = Math.round(a[1] + t * (b[1] - a[1])); return a[2] === 'est' || b[2] === 'est' ? [u, v, 'est'] : [u, v]; } } return null; };
const rd = get('S2.road.main'), nb = get('S2.grd.north_bank_22550');
if (rd && nb) {
  const es = rd.pts.lines.edge_s;
  for (let i = 0; i < es.length; i++) if (es[i][0] >= 21950 && es[i][0] <= 22450) { const q = at(nb.pts.lines.bank_top, es[i][0]); if (q) es[i] = q; }
  addNote('S2.road.main', 'MERGE (2026-10-12): edge_s at the stations u 21950, 22100, 22285 and 22450 now lies on river_w2\'s bank_top (S2.grd.north_bank_22550: 311 est, 380, 441, 430), replacing this agent\'s estimates (300, 400, 440, 450), as its note asked. From u 22600 to 23300 river_w2\'s bank_top (418, 418, 407, 420, 432) runs north of this road\'s centre (410, 445, 448, 422, 425): the level strip in front of the long house is 5-15 px deep in river_w2\'s reading and the centre here runs on the wash slope, so those edges are unchanged and the frame step or the lead settles it. The steps at the terrace\'s west end are S2.str.landing_steps_22950 (river_w2\'s; structures_w\'s copy retired).');
}

// ---- 6. second pass (2026-10-12): the frame agent accepts or declines each proposal
// Proposals: gen/map/S2/second_pass/west.json (u 20500-22900), middle.json (22900-25300), east_middle.json (25300-27600)
// and east.json (27600-29050): 36 in all (11, 14, 3, 8), every one accepted; plus three of the passes' "checked" items that
// they left to the lead (S2.fig.head_over_roof_w_24840 retired as the ridge-end ornament, S2.fig.figure_roof_coils_24508
// raised to med, the bare tree's crown_w moved). Crops: scratchpad S2_second_<id>/. The frame agent read the key crops
// again (west ov_newhall, c_awning; middle g_post2, c_poler, i_poler, c_bowwind, c_sternawn, n_window, c_eaterym, g_ridge;
// east z_stems, n_toptrees, i_stems, n_mat2, z_bitts, n_framefig). merge_notes.md, "Second pass and frame", lists every
// decision. New entities go to parts/second_pass.json.
const spDoc = (id) => JSON.parse(fs.readFileSync(new URL(`./second_pass/${id}.json`, import.meta.url)));
const SP = { west: spDoc('west'), middle: spDoc('middle'), east_middle: spDoc('east_middle'), east: spDoc('east') };
const sp2 = (parts['second_pass.json'] ||= { section: 'S2', entities: [] });
const spEnt = (doc, id) => structuredClone(SP[doc].entities.find((e) => e.id === id));
const addSP = (e) => { if (!get(e.id)) sp2.entities.push(e); };
const retire2 = (id) => { if (get(id)) drop(id); };
const repl = (id, k, from, to) => { const e = get(id); if (e && typeof e[k] === 'string' && e[k].includes(from)) e[k] = e[k].split(from).join(to); };
const RETIRED2 = ['S2.fig.figure_under_awning_21245', 'S2.fig.crewman_beside_poler_23748', 'S2.fig.windlass_man_w_23888', 'S2.fig.windlass_man_e_23952', 'S2.fig.man_stern_awning_24870', 'S2.fig.man_by_mat_27935', 'S2.fig.boatman_coils_28562', 'S2.fig.head_over_roof_w_24840'];
// a retired ID named in any entity's text reads as history ("<slug> (retired at the second pass)"), not as a missing entity
const histRe = (id) => new RegExp(id.replace(/\./g, '\\.') + '(?![_a-z0-9])', 'g');
const hist = (t) => (typeof t === 'string' ? RETIRED2.reduce((s, id) => s.replace(histRe(id), `${id.split('.').slice(2).join('.')} (retired at the second pass)`), t) : t);
const note2 = (id, text) => addNote(id, hist(text));
const FA = 'FRAME AGENT (second pass accepted):';
// one proposal's change: `set` (fields, or `pts.<name>` points), members_add, add_note (members_remove follows the retirements)
const apply = (doc, id) => {
  const ch = SP[doc].changes.find((c) => c.id === id), e = get(id);
  if (!ch || !e) { console.log(`second pass: missing ${doc} ${id}`); return; }
  for (const [k, v] of Object.entries(ch.set || {})) { if (k.startsWith('pts.')) e.pts[k.slice(4)] = structuredClone(v); else e[k] = hist(v); }
  if (ch.members_add) join(id, ch.members_add);
  if (ch.add_note) note2(id, ch.add_note);
};

// -- west (u 20500-22900)
// W1 ACCEPTED (low): the roof over u 22320-22650 had no footprint (README rule 6); on ov_newhall.jpg its tile rows cover the
// gateway's own small roof and stand 110-125 px of v behind the white wall's foot, and the long house's footprint starts at
// u 22650, so nothing would be built under 330 px of painted roof
addSP(spEnt('west', 'S2.bld.hall_behind_gate_22480'));
note2('S2.bld.hall_behind_gate_22480', `${FA} reading (a), conf low. If the lead takes reading (b), the footprint folds into S2.bld.long_house_22780 and this entity is retired.`);
// W2 ACCEPTED (med): the "pale head" under the awning is a white silk fleck with the awning's edge lines through it (c_awning.jpg)
retire2('S2.fig.figure_under_awning_21245');
// W3, W4 ACCEPTED: the big cabin boat and its group follow (three crew)
apply('west', 'S2.grp.boat_big_cabin_21120');
apply('west', 'S2.veh.boat_big_cabin_21120');
// W5 ACCEPTED (stays low): the face under the hall's west eave is a face's size this near the bottom edge
apply('west', 'S2.fig.figure_under_eave_20625');
// W6, W7 ACCEPTED: the dark tree's shoot at u ~20645 and the second bare tree's own stems at 20700-20720 (tree count 2)
apply('west', 'S2.tree.dark_trunk_willow_20530');
apply('west', 'S2.tree.bare_south_bank_20705');
// and the move the pass left to the lead: crown_w sat on the dark tree's shoot (20645), so it goes to the bare tree's own fan
{ const t = get('S2.tree.bare_south_bank_20705'); if (t && t.pts.crown_w[0] === 20640) { t.pts.crown_w = [20690, 1000]; note2(t.id, `${FA} crown_w moved from (20640, 940) to (20690, 1000), as the second pass offered: the long shoot at u ~20645 is S2.tree.dark_trunk_willow_20530's, so this tree's crown starts at its own stems' west edge.`); } }
// W8 ACCEPTED: the big-hat man is seen from behind (hat tie down his back): facing 135
apply('west', 'S2.fig.big_hat_man_south_bank_22045');
// W9, W10 ACCEPTED: notes pointing to the new hall
apply('west', 'S2.str.slat_screen_22375');
apply('west', 'S2.bld.long_house_22780');
// W11 ACCEPTED: the woven object and the small tub on the mat-roofed boat's deck are its gear (the river rule: cargo in `what`)
apply('west', 'S2.veh.boat_mat_roof_22290');

// -- middle (u 22900-25300)
// M1 ACCEPTED (low): a second, smaller light head at 逆水行舟's cabin window (n_window.jpg: a closed light oval with a shoulder
// line, 25-30 px east of the passenger's face); his raised hand is the other reading, in its note
addSP(spEnt('middle', 'S2.fig.second_passenger_window_24050'));
// M2-M5 ACCEPTED (med): four figures that are gear. M2 (g_post2.jpg, c_poler.jpg, i_poler.jpg): a 35 px scroll-tied top over
// a column of horizontal wrappings hung from a line, twice the poler's head width; M3, M4 (c_bowwind.jpg): the bow windlass's
// end disc, crank and spoke ends, no head; M5 (c_sternawn.jpg): a second light board drawn like the tall one beside it
retire2('S2.fig.crewman_beside_poler_23748');
retire2('S2.fig.windlass_man_w_23888');
retire2('S2.fig.windlass_man_e_23952');
retire2('S2.fig.man_stern_awning_24870');
// M6, M7 ACCEPTED: the eatery man sits (72 px at foot v 398, where standing men are 92-109 px at v 301-373; c_eaterym.jpg)
apply('middle', 'S2.fig.eatery_man_23642');
apply('middle', 'S2.grp.open_air_eatery_23760');
// M8-M11 ACCEPTED: the two boats and their groups follow the retirements (the fender and the second board in the boats' what;
// the cargo boat's crew 9, 逆水行舟's 10 or 11 with the new low passenger)
apply('middle', 'S2.veh.boat_cargo_hooded_bow_23715');
apply('middle', 'S2.grp.boat_cargo_hooded_bow_23715');
apply('middle', 'S2.veh.boat_towed_mast_23632');
apply('middle', 'S2.grp.boat_towed_mast_23632');
// M12-M14 ACCEPTED: text only (the mules, not an ox; what hangs in the shop and under the shelter's back eave)
apply('middle', 'S2.bld.open_shop_24300');
apply('middle', 'S2.bld.open_shop_25340');
apply('middle', 'S2.bld.eatery_shelter_23750');
// the pass's checked items left to the lead: (1) the west "head" over the scaffold house's roof stands exactly on the ridge's
// west end with two lobes on a neck running into the ridge (g_ridge.jpg): the ridge-end ornament (鸱尾) structures_e read too.
// Retired (README rule 7) and named in the house's what; the east one stays (low). (2) the second head among 逆水行舟's roof
// coils shows a face under its dark top like its neighbour's: conf med.
retire2('S2.fig.head_over_roof_w_24840');
{
  const h = get('S2.bld.scaffold_house_24975');
  if (h && !h.what.includes('ridge-end ornament')) h.what += ' A two-lobed ridge-end ornament (鸱尾) stands on the main ridge\'s west end (u 24829-24849, v 247-269).';
  note2('S2.bld.scaffold_house_24975', 'Second pass (middle) and FRAME AGENT: the west knob at the ridge\'s west end is the ridge-end ornament (the two lobes join a neck that runs straight into the ridge line at ridge_end_w; g_ridge.jpg, zoom 6), so t6\'s S2.fig.head_over_roof_w_24840 is retired; the east knob stays a low head (S2.fig.head_over_roof_e_24867), or a ridge beast.');
  note2('S2.fig.head_over_roof_e_24867', 'Second pass (middle): a spiky cap over a lighter round face, 27 px east along the ridge from the ridge-end ornament; a head or a ridge beast, undecided (g_ridge.jpg). Kept low.');
}
{ const f = get('S2.fig.figure_roof_coils_24508'); if (f && f.conf === 'low') { f.conf = 'med'; note2(f.id, `${FA} conf low -> med: a dark top over a lighter face (v 932-944) like the seated boatman's beside it; a rolled bundle would not show the face (second pass middle, n_coils.jpg).`); } }

// -- east-middle (u 25300-27600)
// EM1, EM2 ACCEPTED: notes (the capped head reads as a man in a straw cape; the barrow over a porter)
apply('east_middle', 'S2.fig.crewman_head_cabin_east_25810');
apply('east_middle', 'S2.veh.barrow_crates_25598');
// EM3 ACCEPTED: the round-topped cart's bed ends at u ~25998 on legs; its front moves there from under the horse's hind feet.
// The group stays (one parked scene), with a note that the horse is not in shafts
apply('east_middle', 'S2.veh.cart_round_top_26035');
note2('S2.grp.round_cart_26035', `${FA} the cart's front moved to where its bed ends (25998, 136, est); close posts stand between the bed and the horse and no shaft reaches it, so the horse stands at the cart's east end, not in its shafts. Kept in this group as one parked scene.`);

// -- east (u 27600-29050)
// E1 ACCEPTED (low): two straight stems 6-10 px thick behind the long top roof, 2-3 times a whip's width, with no branch to the
// willow's trunks (z_stems.jpg, n_toptrees.jpg); the restyle's whips are the other reading. The tree count matters to the user
addSP(spEnt('east', 'S2.tree.stems_behind_top_house_27790'));
addNote('S2.tree.willow_27925', 'Second pass (east): the two straight stems at u 27778-27800 (v 18-50) that this tree\'s crown_w took in are S2.tree.stems_behind_top_house_27790 (low), a small tree behind the roof; if the lead reads them as this willow\'s west whips, that entity is retired and this one keeps them.');
// E2, E3 ACCEPTED: no head where the man by the mat would be (the bench drawn whole; n_mat2.jpg), and a 14 x 17 px dark mark
// that is the first coil figure's shoulder or a second bitt, not a second person (z_bitts.jpg)
retire2('S2.fig.man_by_mat_27935');
retire2('S2.fig.boatman_coils_28562');
repl('S2.grp.boat_grain_28095', 'what', 'with one or two men (low confidence) among the coiled cables on its after deck', 'with one man (low confidence; or a bitt) among the coiled cables on its after deck');
repl('S2.veh.boat_grain_28095', 'what', 'two short dark uprights (bitts, or men: see the two low-confidence figures)', 'two short dark uprights (bitts, or one man and his raised arm: see the low-confidence figure S2.fig.boatman_coils_28543)');
// E4-E6 ACCEPTED: conf raised (a face under the cap brim at the rail; trunks that cross the far roof's eave line)
apply('east', 'S2.fig.man_at_railing_27650');
apply('east', 'S2.tree.far_tree_28603');
apply('east', 'S2.tree.far_tree_28655');
// E7, E8 ACCEPTED: notes, both stay low
apply('east', 'S2.fig.boatman_coils_28543');
apply('east', 'S2.fig.steersman_27890');
// the pass's open points, settled here: (1) no third tree between the elms (the leaf clusters hang in tiers from the elms'
// twigs and show no stem of their own above the roofs); (2) bench_27840 stays a bench; (3) the "head" among the pole frame's
// poles at 27540-27563 is unreadable on the scan (n_framefig.jpg), and the east-middle pass read no people in the yard
note2('S2.tree.bare_28130', 'Second pass (east) and FRAME AGENT: the restyle paints a third small leafy tree between the two elms (u 28145-28255); on the scan the leaf clusters lie in tiers 80-110 px below the elms\' lowest branches and no stem of their own shows above the roofs, so no third tree is recorded. If the lead counts one: base est (28200, 262), top (28175, 165), crown_w (28144, 205), crown_e (28252, 225).');
note2('S2.prop.bench_27840', 'Second pass (east): at zoom 6 a horizontal at v 760-775 runs from u ~27823 east to the big table, with two legs at u 27857-27873; it may be S2.prop.table_27918\'s west end reaching further west than recorded. Kept as a bench (FRAME AGENT): the strokes do not settle it.');
note2('S2.prop.pole_frame_27490', 'Second pass (east, left to east-middle): a head-like shape among the poles at the frame\'s east end (u 27540-27563, v 240-263) is unreadable on the scan (n_framefig.jpg; the restyle paints a man in a white cap), and the east-middle pass read no people in the yard (27240-27640, v 90-330). No figure recorded.');

// every second-pass retirement named in another entity's text reads as history
for (const e of all()) for (const k of ['what', 'note', 'name']) if (typeof e[k] === 'string') e[k] = hist(e[k]);

// ---- 7. the frame step (2026-10-12): the seam with S3 and the supports the frame gives heights to (map/frames/S2.json)
// (a) The datum: S2.road.main's centre point 0 is S3.road.main's last centre point at u 20500, read from map/strokes/S3.json
// on every run (S3's frame step may still move it); its edges likewise
{
  const s3p = new URL('../../../map/strokes/S3.json', import.meta.url);
  const s3 = fs.existsSync(s3p) ? JSON.parse(fs.readFileSync(s3p)).entities : [];
  const r3 = s3.find((e) => e.id === 'S3.road.main'), rd = get('S2.road.main');
  if (r3 && rd) for (const k of ['centre', 'edge_n', 'edge_s']) {
    const p = r3.pts.lines[k]?.at(-1), L = rd.pts.lines[k];
    if (p && p[0] === 20500 && L[0][0] === 20500 && JSON.stringify(L[0]) !== JSON.stringify(p)) { console.log(`frame: S2.road.main ${k} point 0 ${JSON.stringify(L[0])} -> S3's ${JSON.stringify(p)}`); L[0] = structuredClone(p); }
  }
}
// (b) a bank's shore line is the same strokes as its river's shore: it stands on the water (H -0.7), as S4b's and S3's frames
// set; its bank_top on the ground. Without this the same stroke maps 1.05 m apart
for (const e of all()) if (e.kind === 'grd' && e.pts?.lines?.shore && e.support_by?.shore !== 'water') {
  e.support_by = { ...(e.support_by || {}), shore: 'water' };
  addNote(e.id, 'FRAME: its shore line stands on the support `water` (support_by), like the river\'s shores; its bank_top on the ground.');
}
// (c) supports normalised to the frame's keys (one support per deck the frame can give a height to, from two stroke points)
const sup = (id, s, why) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (e.support !== s) { e.support = s; addNote(id, `FRAME: support -> \`${s}\`: ${why}`); } };
sup('S2.fig.man_with_sticks_bank_24390', 'bank slope', 'his feet (est, v ~532) are below river_m\'s bank top (v ~480-485 here), on the wash slope above the water, as the merge and the second pass (middle) read.');
sup('S2.fig.sack_porter_bank_edge_24467', 'bank slope', 'his feet (est, v ~535) are below river_m\'s bank top (v ~480-485 here), on the wash slope above the water, as the merge and the second pass (middle) read.');
sup('S2.fig.steersman_stern_21678', 'boat stern deck: S2.veh.boat_big_cabin_21120', 'he stands on the high stern (stern_top (21662, 255) over rear (21665, 387), 132 px), not on the cabin deck at the near gunwale (45 px over the water).');
sup('S2.fig.man_stern_hood_26750', 'boat stern deck: S2.veh.boat_mat_cabin_25980', 'he sits on the high after deck under the stern hood (river_e: (26750, ~702) over the waterline ~1000 est, 298 px), not on the main deck (155 px).');
sup('S2.fig.steersman_27890', 'boat stern deck: S2.veh.boat_grain_27285', 'the steersman reading stands on the stern deck by the tiller (river_e: ~v 1300 est over the waterline at rear (27882, 1505), 205 px), far above the deep-laden boat\'s gunwale amidships (53 px).');
sup('S2.fig.bowman_under_hood_23660', 'boat bow deck: S2.veh.boat_towed_mast_23632', 'he stands on the low bow deck under the hood (bow_top (23625, 1068) over front (23632, 1100, est), 32 px), below the wale amidships (70 px).');
sup('S2.fig.boatman_at_windlass_23465', 'boat after roof: S2.veh.boat_passenger_22545', 'he stands on the tall after cabin\'s roof deck (river_w2: v ~590 at u 23468 over the waterline ~905, 315 px; conf low), above the main cabin roof (eave 140 px over the walkway).');
// (d) the route through the dining terrace (structures_w's reading (a)) runs on its floor, which is level with the bank top
// (H 0): recorded so the builder knows the stretch is the terrace's floor
{
  const rd = get('S2.road.main');
  if (rd && !rd.support_ranges) {
    rd.support_ranges = [{ u: [22920, 23500], support: 'terrace floor: S2.bld.river_terrace_23250' }];
    addNote('S2.road.main', 'FRAME: support_ranges u 22920-23500 on `terrace floor: S2.bld.river_terrace_23250` (structures_w\'s reading (a): the route runs through the terrace\'s floor); the frame gives that floor H 0 (its sill v 438-456 is level with the bank top), so the heights do not change; the range records the reading for the builder.');
  }
}
// (e) edge_n where structures_w had only an estimate and structures_e (owner of the buildings east of 24600) or the wharf yard
// (S2.grd.wharf_yard_28100) measured the front: the merge left these to the frame step (merge_notes.md, "The road, still open")
{
  const rd = get('S2.road.main');
  const EN = [[25350, [25350, 503], 'the open shop\'s floor line v 503-505 (S2.bld.open_shop_25340 sw (25210, 503); structures_e)'],
    [26300, [26300, 590], 'the white-wall house\'s wall foot (S2.bld.white_wall_house_26330 sw (26233, 592); structures_e)'],
    [27650, [27650, 830, 'est'], 'the lower shed\'s front posts\' feet v 828-840 (S2.bld.lower_shed_27780; structures_e, S2.grd.wharf_yard_28100)'],
    [27850, [27850, 830, 'est'], 'the lower shed\'s front posts\' feet v 828-840 (S2.bld.lower_shed_27780; structures_e, S2.grd.wharf_yard_28100)'],
    [28050, [28050, 560, 'est'], 'the tiled shed\'s front, v 530-549 at its posts (S2.bld.tiled_shed_27985); the porters\' yard is open from there to the bank top (S2.grd.wharf_yard_28100 edge_n 560)'],
    [28250, [28250, 560, 'est'], 'the tiled shed\'s front, v 530-549 at its posts (S2.bld.tiled_shed_27985); the porters\' yard is open from there to the bank top (S2.grd.wharf_yard_28100 edge_n 560)']];
  const done = [];
  if (rd) for (const [u, p, why] of EN) { const L = rd.pts.lines.edge_n, i = L.findIndex((q) => q[0] === u); if (i >= 0 && JSON.stringify(L[i]) !== JSON.stringify(p)) { done.push(`u ${u}: (${L[i].slice(0, 2).join(', ')}${L[i][2] ? ', est' : ''}) -> (${p.slice(0, 2).join(', ')}${p[2] ? ', est' : ''}), ${why}`); L[i] = p; } }
  // the lower shed's east end: the open yard begins north of it, so edge_n turns north at its se corner (27995, 840)
  if (rd && !rd.pts.lines.edge_n.some((q) => q[0] === 28000)) { const L = rd.pts.lines.edge_n; L.splice(L.findIndex((q) => q[0] > 28000), 0, [28000, 828, 'est']); done.push('a point (28000, 828, est) added at the lower shed\'s east end, where the porters\' yard opens north to the tiled shed (S2.grd.wharf_yard_28100 edge_n (27950, 828) -> (28000, 560)), so edge_n no longer cuts across the shed'); }
  if (done.length) addNote('S2.road.main', `FRAME: edge_n set where structures_w had an estimate and the front is read: ${done.join('; ')}. Not changed: u 26100 (the warehouse plinth's foot, v 625-632, is the bank top itself, south of the centre's est v 615: the route runs on the plinth's front or the strip is nil; a question in the frame).`);
}

// ---- write the parts back

for (const [f, p] of Object.entries(parts)) {
  if (f === 'merge.json' && !p.entities.length) continue;
  fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
}
console.log(`merge_fixes: ${all().length} entities in ${Object.keys(parts).length} parts`);
