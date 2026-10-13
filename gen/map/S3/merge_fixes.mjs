// Cross-unit fixes for S3 (the Rainbow Bridge, u 15500-20500), round 2 (2026-10-12), from the 14 units' reports and the
// merge agent's crops (gen/map/S3/look/merge_*.jpg); why each fix: gen/map/S3/merge_notes.md.
// Edits the parts in place and is idempotent; entities the merge adds go to parts/merge.json.
// node gen/map/S3/merge_fixes.mjs && node tools/scroll_map.mjs S3 merge && node tools/scroll_map.mjs S3 check
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const mp = (parts['merge.json'] ||= { section: 'S3', entities: [] });
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
const join = (gid, ids) => { const g = get(gid); if (!g) { console.log(`missing group ${gid}`); return; } for (const id of ids) { const e = get(id); if (!e) { console.log(`missing ${id}`); continue; } if (e.group && e.group !== gid) { const old = get(e.group); if (old) old.members = old.members.filter((m) => m !== id); } e.group = gid; if (!g.members.includes(id)) g.members.push(id); } };
// move every member of group src into gid, then retire src
const absorb = (gid, src) => { const s = get(src); if (!s) return; join(gid, [...s.members]); drop(src); };
let histFn = (t) => t; // set in section 8: retired IDs in note texts read as history
const addNote = (id, text) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } text = histFn(text); if (!(e.note || '').includes(text)) e.note = `${e.note ? e.note + ' ' : ''}${text}`; };
// replace text in every entity's what / note / name (a regex for IDs that are prefixes of others)
const swap = (from, to) => { for (const e of all()) for (const k of ['what', 'note', 'name']) if (typeof e[k] === 'string') e[k] = typeof from === 'string' ? e[k].split(from).join(to) : e[k].replace(from, to); };
const add = (e) => { if (!get(e.id)) mp.entities.push(e); };

// ---- 1. seam duplicates and things recorded twice in disguise (retire one, keep the reading in the other's note)

// the 十千脚店 lamp-box: structures_w and t3 both recorded it; it stands on its own behind the fence: t3's tile prop
if (get('S3.prop.shiqian_jiaodian_lampbox_17034')) {
  drop('S3.prop.shiqian_jiaodian_lampbox_17034');
  addNote('S3.prop.lamp_box_jiaodian_17035', 'Merge: structures_w recorded the same board as S3.prop.shiqian_jiaodian_lampbox_17034 (retired as a duplicate) with the same writing (脚店 large on the front, 十千 small and faint on the right, med) and the board at u 17000-17068, v 1548-1690; it read the foot at the silk\'s edge (17034, 1792, est), standing at the west part of the gate\'s bar fence (S3.str.gate_fence_16955). Kept here as the tile prop; it is a member of the tavern group S3.grp.shiqian_jiaodian_16800.');
}
join('S3.grp.shiqian_jiaodian_16800', ['S3.prop.lamp_box_jiaodian_17035']);

// the flat mat roof on posts by the 新酒 pole: structures_w's shed and t4's canopy are one thing; a flat mat roof on
// posts, open on all sides, over stalls is an awning on its own poles: a tile prop (as S4.prop.mat_awning_12066)
if (get('S3.bld.mat_shed_17590')) {
  drop('S3.bld.mat_shed_17590');
  addNote('S3.prop.mat_canopy_17600', 'Merge: structures_w recorded the same mat roof as a building, S3.bld.mat_shed_17590 (retired: a flat mat roof on posts, open on all sides, over stalls is an awning on its own poles, a tile prop). Its reading adds posts at u 17838 (v 1081-1131) and 17880 (v 1060-1150), a roof about 2.5 m up at the front (192 px) sloping up to the back, and a west edge sloping -2.9 (a mat edge in the air, skewed in plan against the ground edges nearby at -1.0 to -1.1).');
}

// t2's row of small marks along the far-bank house's platform is that house's terrace rail on short legs (t2: drop it
// if structures_w has it as the platform's edging)
if (get('S3.prop.far_bank_row_16770')) {
  drop('S3.prop.far_bank_row_16770');
  addNote('S3.bld.far_house_16560', 'Merge: the terrace rail on short legs (v 200-215, legs to ~224, u 16680-16890) is the low row of small dark marks t2 read along the bank (u 16660-16880, v 200-228) as a fence of short posts or a row of stones or jars; t2\'s S3.prop.far_bank_row_16770 was retired as this rail (t2\'s own instruction). The jars-and-stones reading stays possible (the restyle paints round jars there; merge crop gen/map/S3/look/merge_farbank_row.jpg): then they are props in front of the rail. The two faint taller marks in the row are t2\'s low figures S3.fig.far_bank_figure_16722 and S3.fig.far_bank_figure_16823.');
}
swap('one of the stones or posts of S3.prop.far_bank_row_16770', 'one of the posts of the far house\'s terrace rail (S3.bld.far_house_16560; t2\'s row prop was retired as that rail at the merge)');

// the far-bank wall's "two-post frame like a small gate" is the same strokes as t3's slatted stand (crop
// merge_farwall_stand.jpg): the stand is kept as the prop, the wall ends against it
const fw = get('S3.str.far_wall_16895');
if (fw && fw.pts.gate_post_w) {
  delete fw.pts.gate_post_w; delete fw.pts.gate_post_e;
  fw.what = 'A faint low wall (or fence) on the far bank\'s slope east of the far-bank house: a coping line with a few small marks and a plain face below, running to u ~17062, where t3\'s slatted stand S3.prop.far_bank_slatted_stand_17080 stands against its east end.';
  addNote('S3.str.far_wall_16895', 'Merge: the "two-post frame like a small gate" at its east end (posts 17066-17068 and ~17090, v 104-160; custom points gate_post_w and gate_post_e, removed) is the same strokes as t3\'s S3.prop.far_bank_slatted_stand_17080 (a stand with slatted sides on legs; t2 read "a small booth or shed with posts"), kept as the prop (merge crop gen/map/S3/look/merge_farwall_stand.jpg). The gate reading stays possible: then the stand is the wall\'s gate.');
}

// the dark-trunked bare tree at the bottom by the S2 seam: by its main point S2's (the lead's note); S2's t1 has it as
// S2.tree.dark_trunk_willow_20530 (8 px from t9's base). Retired here; t9's reading is a seam note in merge_notes.md
drop('S3.tree.dark_trunk_bare_20525');

// ---- 2. supports normalised to the frame's keys

for (const e of all()) if (e.support === 'upper floor: riverside hall') e.support = 'upper floor: S3.bld.tavern_river_hall_15540';
for (const id of ['S3.prop.far_hall_chairs_18393', 'S3.prop.far_hall_long_table_18410', 'S3.prop.far_hall_table_18478', 'S3.prop.far_hall_bench_18447']) {
  const e = get(id);
  if (e && e.support === 'ground') { e.support = 'upper floor: S3.bld.far_bank_hall_18520'; addNote(id, 'Merge: support normalised from ground to the hall\'s raised plank deck on stilts, as t6\'s S3.prop.hall_table_18508 and S3.prop.hall_bench_18550 (the deck stands about 25-40 px above the stilts\' feet, structures_e).'); }
}

// ---- 3. the bridge (the lead's notes and the frame's needs, gen/set_pieces/rainbow_bridge/study.md)

const br = get('S3.str.rainbow_bridge');
if (br) {
  // world() keeps lines and drops custom point lists: the arch's near-face intrados becomes the line rib_e, whose
  // first and last points the bridge kit takes as the springings at the water
  if (br.pts.arch_intrados_e) {
    br.pts.lines.rib_e = br.pts.arch_intrados_e; delete br.pts.arch_intrados_e;
    addNote('S3.str.rainbow_bridge', 'Merge (the lead\'s note): the custom point list arch_intrados_e is now the line rib_e (same 16 points), because world() keeps lines and drops custom lists; the bridge kit takes its first and last points as the near-face springings at the water (support_by rib_e: water). Those two points are the ends of the traced intrados (18897, 1021) and (19977, 424); the springings themselves are hidden (behind the south-bank crowd, behind the mast lines), and the lead\'s study read them at about (18880, 1080) and (19960, 470).');
  }
  // one deck support for every deck line: the frame gives `bridge deck` an H_profile_X (the lead's note), so the bridge
  // agent's extra supports "bridge west edge" and "bridge centre line" are not needed
  br.support_by = { deck_e: 'bridge deck', deck_w: 'bridge deck', deck_c: 'bridge deck', rib_e: 'water' };
  addNote('S3.str.rainbow_bridge', 'Merge: support_by normalised to the frame\'s keys: deck_e, deck_w and deck_c on "bridge deck" (one support with an H_profile_X, the lead\'s note; the bridge agent had proposed separate u-keyed supports "bridge west edge" and "bridge centre line"), rib_e on "water".');
  // a short railing piece at the deck's west edge, read by t5 and t6 and left to the bridge (crop merge_west_rail.jpg)
  if (!br.pts.rail_w_piece_s) {
    br.pts.rail_w_piece_s = [18600, 432];
    br.pts.rail_w_piece_n = [18640, 384];
    addNote('S3.str.rainbow_bridge', 'Merge: a short balustered railing piece IS painted at the deck\'s west edge, just west of t6\'s youth S3.fig.youth_round_face_18643: two diagonal rails with balusters rising east from rail_w_piece_s (18600, 432) to rail_w_piece_n (18640, 384) (t5: 18603-18639, v 374-426; t6: (18597, 393) to (18637, 443); merge crop gen/map/S3/look/merge_west_rail.jpg). Read as the last visible panel of the west (far) railing, conf low: it runs parallel to the near railing about 60-100 px east of the estimated deck_w at the same v, which supports deck_w to within that.');
  }
}
// the far-side end post at the south end: t7 and structures_e both saw it, the bridge part has only the two near ones
add({
  id: 'S3.prop.bridge_end_post_far_19176', kind: 'prop', name: 'far-side end post (表木) at the bridge\'s south end',
  what: 'A tall plain timber pole rising behind the crowd at the crown\'s south side, with two bars crossed like an X at its top just under the silk\'s top edge: the twin of the south-east end post S3.prop.bridge_end_post_19026 on the deck\'s far side (a 表木). Its foot is hidden behind the deck crowd.',
  pts: { base: [19176, 300, 'est'], top: [19173, 18], cross: [19176, 35] },
  support: 'ground', vis: 'part: below v ~165 hidden behind the deck crowd\'s heads; it is drawn over t7\'s parasol canopy (S3.prop.parasol_19150)', conf: 'med',
  note: 'Added at the merge from t7\'s left-to list (pole at u ~19167-19180, an X crossbar at 19162-19190, v 20-50, foot hidden behind the deck crowd) and structures_e\'s (a tall pole at 19169-19179, v 21-157); the bridge part records only the two near-side posts and says the far ones would be hidden. Merge crops gen/map/S3/look/merge_far_post*.jpg: the pole (edges u ~19170-19180) runs from a knob at (19173, 18) through the X (bars spanning u ~19160-19192, v 20-50, centre (19176, 35), ±6 px) down to v ~165, drawn over the parasol\'s canopy, so it stands in front of (south of) that parasol. BASE est at the deck crowd\'s foot level at this u (v ~300; the rider\'s and the man behind the rump\'s feet are est at v 305-332): a placeholder. READINGS: (a) the far-side twin of S3.prop.bridge_end_post_19026 at the bridge\'s south end (the 表木 stand in pairs at a bridge\'s ends), conf med; (b) a pole on the far bank behind the deck (its foot at v ~165-200). Under the bridge agent\'s geometry the deck\'s far side lies 750 px west, not up the silk, so where its foot stands relative to the deck is for the lead and the bridge kit; the second pass should look again. SCALE: X ~30 px across against ~45 px for the north-east post and ~90 px for the south-east one.',
});
join('S3.grp.rainbow_bridge', ['S3.prop.bridge_end_post_far_19176']);
swap('The arched timber bridge with its two painted end posts (表木) at its east corners', 'The arched timber bridge with its three painted end posts (表木): two at its east corners and one on the far side of its south end');
addNote('S3.prop.bridge_end_post_19026', 'Merge: a third post is painted, the far-side twin at the bridge\'s south end: S3.prop.bridge_end_post_far_19176 (pole at u ~19176 with an X at v 20-50, foot hidden behind the deck crowd).');

// ---- 4. S3.road.main: the seam point from S4b, the deck stretch from the bridge agent, the north bank and S2's datum

const at = (line, u) => { // the point of a polyline at scan u (linear between vertices); est if either vertex is est
  for (let i = 0; i + 1 < line.length; i++) { const [a, b] = [line[i], line[i + 1]]; if (u >= Math.min(a[0], b[0]) && u <= Math.max(a[0], b[0])) { const t = b[0] === a[0] ? 0 : (u - a[0]) / (b[0] - a[0]); const v = Math.round(a[1] + t * (b[1] - a[1])); return a[2] === 'est' || b[2] === 'est' ? [u, v, 'est'] : [u, v]; } }
  return null;
};
const rd = get('S3.road.main');
const s4bPath = new URL('../../../map/strokes/S4b.json', import.meta.url);
const s4bRoad = fs.existsSync(s4bPath) ? JSON.parse(fs.readFileSync(s4bPath)).entities.find((e) => e.id === 'S4b.road.main') : null;
if (rd && br) {
  const L = rd.pts.lines, D = structuredClone(br.pts.lines);
  // point 0 of each line = S4b's road at u 15500 (read from map/strokes/S4b.json each run, so it follows S4b's edits)
  if (s4bRoad) for (const role of ['centre', 'edge_n', 'edge_s']) { const q = at(s4bRoad.pts.lines[role], 15500); if (q && L[role][0][0] === 15500) L[role][0] = q; }
  // the deck stretch: the bridge agent's centre line, with the deck's edges as the road's edges (edge_n = deck_w, the
  // left side going west to east, edge_s = deck_e); structures_w's placeholder points over the deck are replaced. The
  // centre's point (18200, 1090) lay on the deck's foot line and is dropped: the approach meets the deck at deck_c's foot
  L.centre = [...L.centre.filter((p) => p[0] < 18100), ...D.deck_c, [19900, 262, 'est'], [20200, 265, 'est'], [20350, 265, 'est'], [20500, 258, 'est']];
  L.edge_n = [...L.edge_n.filter((p) => p[0] < 18060), ...D.deck_w, [19750, 160, 'est'], [20030, 232, 'est'], [20200, 235, 'est'], [20350, 225, 'est'], [20500, 215, 'est']];
  L.edge_s = [...L.edge_s.filter((p) => p[0] < 18810), ...D.deck_e, [20200, 288, 'est'], [20350, 288, 'est'], [20500, 280, 'est']];
  rd.support_ranges = [{ u: [18435, 19650], support: 'bridge deck' }];
  addNote('S3.road.main', 'MERGE (2026-10-12): (1) point 0 of the centre and both edges is S4b\'s road at u 15500 (map/strokes/S4b.json, S4b.road.main), read again on every run of merge_fixes.mjs: centre (15500, 1530, est), edge_n (15500, 1470, est), edge_s (15500, 1605, est) against this agent\'s reading (15500, 1240), (15500, 1060), (15500, 1300): S4b\'s route reaches the seam along the front of its house behind the willow (S4b.bld.house_behind_willow_15414), 290 px of v (about 5.7 m of depth) south of the riverside ground this road takes behind the hall, so the hidden stretch now turns north round the hall\'s north-west corner (all est) between u 15500 and 15840: for the lead and the frame step. (2) The deck stretch is the bridge agent\'s lines: centre = S3.str.rainbow_bridge deck_c from (18435, 1090) to (19650, 396), edge_n = deck_w (18060-19275), edge_s = deck_e (18810-20025); the placeholder points (18200..20030) are gone. support_ranges puts u 18435-19650 on "bridge deck": that is the centre\'s whole deck stretch, but the edges\' deck points outside it (deck_w at u 18060-18435, deck_e at u 19650-20025) still take the road\'s own support (ground), and the ground points near the bridge (none of the centre\'s; edge_s (18420, 1480) and (18600, 1100) south of the foot line) must stay on the ground: the frame agent or the lead settles it (per-line ranges, or the H_profile_X\'s flat ends). (3) North bank, after the bridge agent and the lead: from the deck\'s north foot the centre climbs north past the cart\'s south side to (19900, 262) and runs east at v 262-265 through the tavern\'s open front (its tables at v 205-280, its front and the water\'s edge at v ~288-300) to S2\'s datum, exactly (20500, 258) est; edge_s follows the bank\'s edge at the tavern\'s front (v 288, the old 315-335 lay on the water), edge_n runs north of the cart (19750, 160) into the tavern (as before). Along the tavern the edges are 53-65 px of v apart (1.0-1.3 m at 51.25 px/m; the land strip to the shop fronts is 1.6-2.3 m): the lead\'s note keeps the one-scale frame and settles room to walk at build time.');
}

// ---- 5. groups across units (each asked for in the units' reports)

join('S3.grp.chuanche_17775', ['S3.fig.topknot_man_at_cart_17458', 'S3.fig.cap_man_at_cart_17545']); // t3's men at the 串车's handles
join('S3.grp.robed_man_and_porter_17680', ['S3.fig.child_holding_robe_17520']); // t3's child holds the robed man's robe
join('S3.grp.barrow_18100', ['S3.ani.donkey_18048']); // t4's donkey, hauled on a rope by t5's bearded man
join('S3.grp.parasol_stall_18160', ['S3.prop.lattice_mat_awning_17840']); // t4's lattice awning over t5's display
join('S3.grp.west_stall_18330', ['S3.fig.mat_stall_keeper_18435', 'S3.fig.mat_stall_leaner_18375']); // t5's keepers under t6's awning
join('S3.grp.sack_donkeys_18600', ['S3.fig.donkey_walker_18481']); // t5's driver striding behind the first donkey
join('S3.grp.stall_under_arch', ['S3.bld.mat_shed_19160']); // structures_e's shed over t7's table and sitters
join('S3.grp.bank_watchers_under_arch', ['S3.fig.robe_man_east_18893']); // t6's tall man, west end of t7's watchers
join('S3.grp.south_rail_watchers', ['S3.fig.man_behind_awning_18898']); // t6's man, west end of t7's railing crowd
join('S3.grp.handcart_19862', ['S3.ani.dog_or_donkey_19825']); // t8's animal beside t9's cart puller (t9 and the bridge agent)
addNote('S3.ani.dog_or_donkey_19825', 'Merge: joined to t9\'s S3.grp.handcart_19862 by place (it stands just west of the cart\'s puller; t9 and the bridge agent read the two together); no tack is painted, so it walks with the cart rather than drawing it (t9: no animal draws the cart). The bridge agent\'s "a man and a small dark animal" there are this animal and t9\'s puller S3.fig.cart_puller_19870 (merge crop gen/map/S3/look/merge_north_dog.jpg).');

// the trackers belong to the towed boat's scene: one group
absorb('S3.grp.boat_towed_16228', 'S3.grp.trackers_16380');
const bt = get('S3.grp.boat_towed_16228');
if (bt && !/trackers/.test(bt.name)) {
  bt.name = 'the towed boat, its crew and its five trackers';
  bt.what = 'The masted boat towed east by five trackers walking in single file on the far-bank path, bent forward on one line that runs from its masthead to the rear tracker (S3.fig.tracker_16333); its bowman poles, and perhaps two men sit on the cargo.';
  bt.note = 'Merge: t2\'s S3.grp.trackers_16380 (the five trackers) joined here and retired: one towing scene (名画记 pin 25 河边泊船 (纤夫) is pinned at u 15690, on the boat under way; the trackers stand at u 16325-16432).';
}

// 车轿相争: t6's sedan side and t7's horseman side, one group
add({ id: 'S3.grp.sedan_vs_horseman', kind: 'group', name: 'the sedan and the horseman on the south ramp (车轿相争)', members: [], src: '余辉: 车轿相争',
  what: 'On the bridge\'s south ramp a sedan chair carried up by two bearers, with a man at its front pointing east up the bridge and two men in wide hats pointing back at it, meets a rider in white on a brown horse coming down westward from the crown: his groom hugs the horse\'s lowered neck to hold it, a man in front flings his arms wide, two men stand behind the horse, and a second horse\'s head shows behind the first.',
  note: 'Joined at the merge from t6\'s S3.grp.sedan_party_18760 (the sedan\'s side) and t7\'s S3.grp.horseman_party (the horseman\'s side), both retired. Sedan side: S3.veh.sedan_18842 (no passenger painted), the bearers S3.fig.sedan_bearer_front_18838 and S3.fig.sedan_bearer_rear_18688, S3.fig.pointer_east_18830, and S3.fig.wide_hat_pointer_18855 and S3.fig.wide_hat_pointer_18890 (they point back at the sedan and may be the horseman\'s men, t6). Horseman side: S3.ani.horse_19055, S3.fig.rider_white_robe_19110 (seated, med), S3.fig.groom_holding_horse_19095, S3.fig.man_arms_flung_wide_18990 (low; may be one of the sedan\'s men), S3.fig.man_white_headcloth_19050, S3.fig.man_behind_rump_19165, S3.ani.second_horse_19230 (low: a second horse or a man in a dark head-cloth bent forward). Possibly in it but not joined: S3.fig.man_folded_arms_tall_cap_19270 (may ride the second horse, t7) and t7\'s S3.fig.man_dark_jacket_pointing_18915 and S3.fig.man_light_robe_reaching_18958 (in S3.grp.south_rail_watchers; may be on the sedan\'s side).' });
absorb('S3.grp.sedan_vs_horseman', 'S3.grp.sedan_party_18760');
absorb('S3.grp.sedan_vs_horseman', 'S3.grp.horseman_party');

// 上下呼救: one railing crowd from the south flank over the crown to the north ramp
const hadRail = !!get('S3.grp.north_railing_watchers_19350');
absorb('S3.grp.shouting_down_to_boat', 'S3.grp.north_railing_watchers_19350');
absorb('S3.grp.shouting_down_to_boat', 'S3.grp.north_ramp_watchers_19890');
const sd = get('S3.grp.shouting_down_to_boat');
if (sd && hadRail) {
  sd.name = 'the crowd at the near railing calling down to the big boat (上下呼救)';
  sd.what = 'The people along the bridge\'s near railing from the south flank over the crown to the top of the north ramp (u ~19020-19930), leaning out over the rail to look, shout and signal down to the big boat lowering its mast under the arch: one at the crown hangs far over with his arms down as if lowering a rope, a youth throws a rope (S3.fig.deck_youth_rope_19445), a man holds a pole level (S3.fig.deck_pole_holder_19625), a bundle hangs over the rail (low), and three men lean over side by side at the north ramp.';
  addNote('S3.grp.shouting_down_to_boat', 'Merge: joined with t8\'s S3.grp.north_railing_watchers_19350 (u 19350-19765: eleven men and the bundle) and t9\'s S3.grp.north_ramp_watchers_19890 (three men at the north ramp\'s railing), both retired: one railing crowd (余辉 上下呼救; 名画记 pin 20 拥挤的桥面 at 19240). The boat, its ropes and their far ends are river_e\'s (S3.grp.boat_mast_lowering_crew).');
}

// the open shop on the south bank east of the arch: t8's west part and t9's east part, one group with the building
absorb('S3.grp.south_shop_19920', 'S3.grp.shop_table_19776');
join('S3.grp.south_shop_19920', ['S3.prop.shop_low_table_19797', 'S3.prop.shop_long_board_19601', 'S3.prop.shop_wall_bench_19582', 'S3.bld.open_shop_20000']);
addNote('S3.grp.south_shop_19920', 'Merge: joined with t8\'s S3.grp.shop_table_19776 (the seated man, his chair, the table and the bowl; retired) and t8\'s loose shop props (the low table, the long board, the wall bench); the building is structures_e\'s S3.bld.open_shop_20000.');

// ---- 6. references to IDs that were dropped before the merge or renamed (so every ID in a note exists)

swap(/S3\.prop\.xinjiu_flagpole(?![_a-z0-9])/g, 'S3.prop.xinjiu_flagpole_17630');
swap('S3.fig.man_at_railing_face_west_19318, S3.fig.man_at_railing_facing_us_19347;', 'S3.fig.man_at_railing_face_west_19318 (t7\'s man facing us at the rail is t8\'s S3.fig.deck_rail_face_19350);');
swap('as S3.fig.moustached_man_18045', 'as moustached_man_18045 (in no part now)');
swap('(S3.grd.south_bank_18390)', '(river_e\'s first-draft bank south_bank_18390, dropped before the merge: that edge is the bridge deck\'s west edge)');
swap('S3.grp.west_stall_18480', 'S3.grp.west_stall_18330');
swap('S3.prop.mat_awning_stall_18480', 'S3.prop.mat_awning_stall_18330');
swap('as S3.prop.lattice_mat_awning_18060', 'as lattice_mat_awning_18060');
swap('t5 recorded it as S3.prop.mat_awning_stall_18443', 't5\'s first draft recorded it as mat_awning_stall_18443');
swap('in its S3.prop.mat_awning_stall_18443', 'in its first-draft mat_awning_stall_18443');
swap('t5\'s S3.prop.parasol_over_mat_stall_18495', 't5\'s first-draft parasol_over_mat_stall_18495');
addNote('S3.prop.mat_awning_stall_18330', 'Merge: t5 retired its copy before the merge; this one is kept.');
swap('(S4b.tree.willow_15470)', '(S4b.tree.willow_15468)'); // S4b's ID as merged
addNote('S3.prop.parasol_stall_18585', 'Merge: t5 retired its copy before the merge; this one is kept, the hub reading open (t5: ribs meeting at (18495, 482)).');

// ---- 7. near-duplicates checked on crops and kept, other readings named where the strokes left them

addNote('S3.fig.head_behind_porter_18893', 'Merge: not a duplicate of t7\'s S3.fig.sack_porter_18915 (the tool flags them at 23 px): two heads about 39 px apart on the merge crop gen/map/S3/look/merge_t6t7_heads.jpg.');
addNote('S3.fig.sack_porter_18915', 'Merge: not a duplicate of t6\'s S3.fig.head_behind_porter_18893 (two heads about 39 px apart, merge crop gen/map/S3/look/merge_t6t7_heads.jpg).');
addNote('S3.fig.bank_watcher_dark_hair_18905', 'Merge: not a duplicate of t6\'s S3.fig.robe_man_east_18893 (the tool flags them at 12 px, foot to foot): the crop gen/map/S3/look/merge_bank_watchers.jpg shows three heads, the tall man\'s, this dark-haired one between and below, and the dark-vest man\'s.');
addNote('S3.fig.man_dark_cap_back_row_19325', 'Merge: t8\'s back-row man S3.fig.deck_hat_stick_19353 (head (19350, 189)) stands 25 px east; t7 and t8 each read a separate man after seeing the other\'s part, and at zoom 3-4 the strokes here are grain (merge crops gen/map/S3/look/merge_crown_backrow*.jpg: one broad hat over 19312-19370 or two heads). Both kept; the second pass should settle one man or two.');
addNote('S3.fig.deck_hat_stick_19353', 'Merge: t7\'s back-row man S3.fig.man_dark_cap_back_row_19325 (head (19325, 193)) stands 25 px west; both kept, one man or two for the second pass (merge crops gen/map/S3/look/merge_crown_backrow*.jpg).');
if (get('S3.fig.light_robed_at_bow_19745')) addNote('S3.fig.light_robed_at_bow_19745', 'Merge: t9 also saw a head at the moored boat\'s west end, at about (19690, 1125); river_e did not record a figure there. All three readings kept open (on the bank, on the boat\'s bow as crew of S3.veh.boat_moored_south_bank_19745, or the parasol\'s rim): for the second pass.');
if (get('S3.prop.floating_timber_19090')) addNote('S3.prop.floating_timber_19090', 'Merge: t7 reads it as a narrow skiff: its east end curls up at about (19255-19270, 945) and short uprights stand at u 19108-19213, v 974-997; the bridge agent: a pole, a beam or a narrow skiff with an upturned hooked east end. If it is a boat, it becomes a vehicle entity with the boat points: for the second pass.');
addNote('S3.bld.tavern_gate_16870', 'Merge: t2 and t3 read the hanging post at the west front as a column standing on a drum-shaped stone base, foot (16916, 1543), carrying the porch eave at v ~1446; this entity reads a 垂柱 ending in a knob in mid-air above bare ground. Same strokes, two readings. t3 also names a slatted lattice panel with a curved top between the curtain and the east post (u 17257-17325, v 1430-1600), part of this gate (a t3 prop only if it stands on its own), and its east-post figure S3.fig.gate_post_figure_17332 stands half behind it.');
addNote('S3.str.chazi_barrier_16800', 'Merge: t2 reads the same strokes as a diagonal railed stair or ramp up to the gate, with zigzag treads between two rails, (16740, 1780) -> (16990, 1560), its near rail\'s foot (16810, 1753) -> (16983, 1563) sloping -1.10.');
addNote('S3.bld.open_shop_20000', 'Merge: t8 names two objects hung inside its west part at u 19620-19647, v 1453-1484 (hanging goods: part of this building), and plank or ladder lines at 19615-19685, v 1275-1441 west of its west hip, between it and S3.bld.mat_shed_19530 (unassigned: for the second pass). t9 reads its door posts at u 20014-20025, 20037-20060 and 20080-20095, the slatted panel at 20383-20458 (v 1497-1576) and the corner post at 20375-20383, as this note does.');

// ---- 8. second pass (2026-10-12): the frame agent accepts or declines each proposal
// Proposals: gen/map/S3/second_pass/west.json (u 15500-17800), middle.json (17800-19100) and east.json (19100-20500); their
// crops are in the scratchpad (S3_second_west/, S3_second_middle/) and gen/map/S3/look/p2e_*.jpg. The frame agent read the
// key crops again (c_heap, c_sweep6, i_timber, f_dark_raw, p2e_c_loops_col, p2e_c_bowfig_col, p2e_c_parasols_col).
// merge_notes.md, "Second pass and frame", lists every decision. New entities go to parts/second_pass.json.
const spDoc = (half) => JSON.parse(fs.readFileSync(new URL(`./second_pass/${half}.json`, import.meta.url)));
const SPW = spDoc('west'), SPM = spDoc('middle'), SPE = spDoc('east');
const spEnt = (sp, id) => structuredClone(sp.entities.find((e) => e.id === id));
const sp2 = (parts['second_pass.json'] ||= { section: 'S3', entities: [] });
const addSP = (e) => { if (!get(e.id)) sp2.entities.push(e); };
const setPts = (id, pts) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } Object.assign(e.pts, pts); };
const retire = (id) => { if (get(id)) drop(id); };
const repl = (id, k, from, to) => { const e = get(id); if (e && typeof e[k] === 'string' && e[k].includes(from)) e[k] = e[k].split(from).join(to); };
const FA = 'FRAME AGENT (second pass accepted):';
const RETIRED2 = ['S3.fig.diner_back_16180', 'S3.prop.floating_timber_19090', 'S3.ani.dark_donkey_18625', 'S3.fig.figure_under_awning_18015', 'S3.fig.light_robed_at_bow_19745', 'S3.fig.head_in_rigging_19990', 'S3.fig.boatman_stern_rail_20400', 'S3.prop.hanging_sack_and_staff_20412'];
const histRe = (id) => new RegExp(id.replace(/\./g, '\\.') + '(?![_a-z0-9])', 'g');
histFn = (t) => RETIRED2.reduce((s, id) => s.replace(histRe(id), `${id.split('.').slice(2).join('.')} (retired at the second pass)`), t);

// -- west (u 15500-17800)
// W1 ACCEPTED (low): the willow crown hanging in at the silk's top edge by the S4b seam; recorded by nobody, and S4b's far
// bank names a willow foot at (15520, 70) est with no entity. By its main point (base est 20 px east of the seam) S3's;
// the cross-key seam check finds no S4b tree within 30 px (S4b.tree.far_bank_15308 is 212 px west). It stands on the far
// bank strip that joins S4b's far bank at the seam (S3.grd.far_bank_seam_15500, section 9).
addSP(spEnt(SPW, 'S3.tree.willow_crown_top_15520'));
addNote('S3.tree.willow_crown_top_15520', `${FA} kept as S3's by its main point; it stands on S3.grd.far_bank_seam_15500, the strip that joins S4b's far bank (S4b.grd.far_bank_15330) to the silk's top edge (frame step). If the lead gives it to S4b, it becomes a seam note here.`);
// W2 ACCEPTED (low, cargo reading in its note): the boatman named only in the awning boat's what (README rule 6)
addSP(spEnt(SPW, 'S3.fig.awning_boatman_17435'));
join('S3.grp.boat_awning_17442', ['S3.fig.awning_boatman_17435']);
repl('S3.veh.boat_awning_17442', 'what', 'cargo (or a crouching man, unread) under the awning at 17420-17470', 'a crouching boatman under the awning at 17420-17470 (S3.fig.awning_boatman_17435; low, or cargo)');
{ const g = get('S3.grp.boat_awning_17442'); if (g) g.what = 'The boat with the fore awning, the boatman crouching under it (low) and the man seated in its cabin.'; }
// W3 ACCEPTED (low): a sixth head at the sweep, between the dark-capped man and the crouching man (the restyle paints six too)
addSP(spEnt(SPW, 'S3.fig.sweep_man_15888'));
join('S3.grp.boat_under_way_15595', ['S3.fig.sweep_man_15888']);
{ const g = get('S3.grp.boat_under_way_15595'); if (g) g.what = 'Three men at the bow and five or six working the stern sweep of the boat under way (摇橹向前; the sixth, S3.fig.sweep_man_15888, is low).'; }
// W4 ACCEPTED (low, three readings in its note): something no entity covered is painted behind the lamp-box
addSP(spEnt(SPW, 'S3.fig.behind_lampbox_17090'));
join('S3.grp.shiqian_jiaodian_16800', ['S3.fig.behind_lampbox_17090']);
// W5 ACCEPTED (low): the pot on the hall's wall rack, named only in t1's report
addSP(spEnt(SPW, 'S3.prop.pot_on_rack_16140'));
join('S3.grp.hall_diners_16120', ['S3.prop.pot_on_rack_16140']);
// W6 ACCEPTED: the "diner seen from behind" is a bowl-shaped basin under the heap (crop c_heap.jpg: widest at its belly,
// hatched, no collar or neck); retired (README rule 7) and replaced by the basin
retire('S3.fig.diner_back_16180');
addSP(spEnt(SPW, 'S3.prop.basin_16180'));
join('S3.grp.hall_diners_16120', ['S3.prop.basin_16180']);
{
  const h = get('S3.prop.food_heap_16170');
  if (h && h.support !== 'table top: S3.prop.basin_16180') {
    h.support = 'table top: S3.prop.basin_16180';
    h.what = 'A big heap of lumpy round things touched with pink and red, piled high in the round basin (S3.prop.basin_16180) that stands in front of the dining table\'s east end: fruit, buns or flowers.';
    h.note = h.note.replace('(S3.fig.diner_back_16180)', '(diner_back_16180, retired at the second pass)');
    addNote('S3.prop.food_heap_16170', 'Second pass: the heap sits on the basin\'s rim (v ~1380), not on the table; its support follows the basin (diner_back_16180 retired). Readings (a) and (b) of the note above are settled as (b).');
  }
  const t = get('S3.prop.table_16145');
  if (t) t.what = 'A long low table across the balcony\'s middle bay, set with dishes, with the diners around it: one behind its west end, one at its east end and one hunched west of it; a round basin heaped with fruit or flowers stands in front of its east end (S3.prop.basin_16180).';
  const g = get('S3.grp.hall_diners_16120');
  if (g) g.what = 'Three men eating and drinking at a long table in the middle bay of the riverside hall\'s railed balcony over the river road: one bearded in a dark cap behind the table, one hunched over the rail and a light-robed one standing at the back (host or waiter); a round basin heaped with fruit or flowers stands in front of the table, and a pot stands on the wall rack behind it.';
}
{
  const b = get('S3.bld.tavern_river_hall_15540');
  const extra = ' At the back of the middle bay an open rack of shelves (u 16122-16160, v 1295-1337) stands beside the hanging cloth, a pot on it (S3.prop.pot_on_rack_16140); in the west doorway a plain partition panel (u 15837-15860, v 1320-1390) stands east of the doorway figure.';
  if (b && !b.what.includes('open rack of shelves')) b.what += extra;
}
addNote('S3.bld.tavern_river_hall_15540', 'Second pass: (1) the rack and the partition were left to this entity by t1 (fixed to the hall) and were in no `what`. (2) t1\'s \'small object on the gallery railing at about (16358, 1400)\' is the railing\'s corner post cap where the balcony\'s front railing turns into the side gallery\'s, a small looped knob at u 16318-16334, v 1398-1412: part of this building; nothing loose stands on the railing (crops c_gallery.jpg, c_railobj.jpg). (3) The east part of the side gallery (u 16400-16540, v 1260-1440) shows only railings and balusters, no further figure (insp_gallery_e.jpg).');
for (const ed of SPW.edits.filter((x) => x.action === 'note' && x.id !== 'S3.bld.tavern_river_hall_15540')) addNote(ed.id, ed.add_note);

// -- middle (u 17800-19100)
// M1 ACCEPTED: the "floating timber" is a narrow empty skiff (crop i_timber.jpg: the hull deepens, rises to an upturned stem
// with a knob, four frames); retired and replaced
retire('S3.prop.floating_timber_19090');
addSP(spEnt(SPM, 'S3.veh.boat_skiff_19255'));
// M2 ACCEPTED (low): the round head straight under the big parasol's hub
addSP(spEnt(SPM, 'S3.fig.head_under_parasol_hub_18780'));
// M3 ACCEPTED (low): the second dark head at the ramp's foot, named only in its neighbour's note (README rule 6)
addSP(spEnt(SPM, 'S3.fig.second_head_ramp_foot_18740'));
addNote('S3.fig.dark_head_ramp_foot_18720', 'Second pass: the second dark blob at (18727-18747, 847-867) is S3.fig.second_head_ramp_foot_18740 (low).');
// M4 ACCEPTED with the bridge edit: the "west railing piece" is a slatted panel inside the deck (it falls to the east while
// the railings rise to the east, and a seated man sits between it and the water)
addSP(spEnt(SPM, 'S3.prop.slatted_panel_18615'));
join('S3.grp.west_stall_18330', ['S3.prop.slatted_panel_18615']);
if (br && br.pts.rail_w_piece_s) { delete br.pts.rail_w_piece_s; delete br.pts.rail_w_piece_n; }
addNote('S3.str.rainbow_bridge', 'Second pass: the \'west railing piece\' (18593-18640, 384-462; the custom points rail_w_piece_s/_n added at the merge, now removed) is not the deck\'s west railing but S3.prop.slatted_panel_18615: it stands 590-670 px west of deck_e, 50-130 px inside the water\'s edge, with a seated man between it and the water, and it falls to the east while the railings rise to the east. It is no evidence for deck_w. The water\'s edge on the upstream side of the south ramp is 696-776 px west of deck_e at every v from 400 to 965 (mean ~725), which supports deck_w = deck_e - 750 to within ~25-50 px.');
// M5 ACCEPTED (med): the third "donkey" is the calling man's two wide dark sleeves (crop f_dark_raw.jpg)
retire('S3.ani.dark_donkey_18625');
addNote('S3.fig.calling_man_18690', 'Second pass: the dark curved mass at u 18607-18686, v 1073-1153 west of him is his two wide dark sleeves stretched west, cuffs hanging at (18617-18632, 1118-1145), not a third donkey (dark_donkey_18625 retired).');
{ const g = get('S3.grp.sack_donkeys_18600'); if (g) g.note = (g.note || '').replace(' The third, dark donkey is conf low (see its note).', ' The third, dark donkey t6 recorded was the calling man\'s sleeves (retired at the second pass).'); }
// M6 ACCEPTED (med): the figure under the unloading boat's awning is the awning's west pole and its brace
retire('S3.fig.figure_under_awning_18015');
repl('S3.grp.boat_unloading_17705', 'what', ', perhaps one more under the mat awning', '');
// M7 ACCEPTED: the west stall's parasol hub where its ribs meet; the base est under it
setPts('S3.prop.parasol_stall_18585', { hub: [18492, 480], base: [18492, 640, 'est'] });
{ const p = get('S3.prop.parasol_stall_18585'); if (p) p.what = SPM.edits.find((x) => x.id === 'S3.prop.parasol_stall_18585').what; }
addNote('S3.prop.parasol_stall_18585', SPM.edits.find((x) => x.id === 'S3.prop.parasol_stall_18585').note_add);
repl('S3.fig.stall_man_parasol_18612', 'what', 'both hands at the hub of the stall\'s parasol, which he holds tilted over the stall\'s mat roof', 'both hands up at the east rim of the stall\'s parasol (S3.prop.parasol_stall_18585), tilting or steadying it over the stall\'s mat roof');
// M8 ACCEPTED: the big parasol's hub and base
setPts('S3.prop.parasol_big_18748', { hub: [18781, 908], base: [18781, 1150, 'est'] });
addNote('S3.prop.parasol_big_18748', SPM.edits.find((x) => x.id === 'S3.prop.parasol_big_18748').note_add);
// M9 ACCEPTED: the unloading boat's stern under its hood's east end
setPts('S3.veh.boat_unloading_17705', { rear: [18210, 958, 'est'] });
repl('S3.veh.boat_unloading_17705', 'what', 'an arched mat hood (18040-18130, v 735-800) and flat lattice mat awnings on poles (17960-18250, v 740-880; poles at ~18010 and ~18170)', 'an arched mat hood (18095-18200, v 735-800) and flat lattice mat awnings on poles (17960-18330, v 740-880; poles at ~18010 and ~18170)');
addNote('S3.veh.boat_unloading_17705', SPM.edits.find((x) => x.id === 'S3.veh.boat_unloading_17705').note_add);
// M10 ACCEPTED (low): the far-side end post's hidden foot estimated from its own size; reading (b) now likelier
setPts('S3.prop.bridge_end_post_far_19176', { base: [19176, 240, 'est'] });
{ const p = get('S3.prop.bridge_end_post_far_19176'); if (p) { p.what = 'A tall plain timber pole rising behind the crowd at the crown\'s south side, with two bars crossed like an X at its top just under the silk\'s top edge: a 表木 like the bridge\'s near end posts, standing behind the deck\'s far edge or on the far bank (its X is painted smaller than either near post\'s). Its foot is hidden behind the deck crowd.'; p.conf = 'low'; } }
addNote('S3.prop.bridge_end_post_far_19176', SPM.edits.find((x) => x.id === 'S3.prop.bridge_end_post_far_19176').note_add);
// the middle pass's settled items: notes only
for (const r of SPM.reviewed.filter((x) => x.note_add && x.ids === undefined)) {
  const id = { 't5\'s S3.fig.mat_leaner_white_18220: the unloading boat\'s crew, the ramp or the bank': 'S3.fig.mat_leaner_white_18220', 'the second sack donkey\'s facing (S3.ani.donkey_sack_18690; t5 and t6 disagree)': 'S3.ani.donkey_sack_18690', 'the sheaf of reeds above S3.fig.wide_hat_pointer_18890 (carried or standing)': 'S3.fig.wide_hat_pointer_18890' }[r.item];
  if (id) addNote(id, r.note_add);
}
repl('S3.fig.wide_hat_pointer_18890', 'what', '(carried on his back, or standing behind him)', '(carried on his back)');
addNote('S3.str.rainbow_bridge', 'Second pass (middle): the 35 `bridge deck` entities west of u 18810 stay on the deck: the line where the south ramp\'s crowd meets the water runs 696-776 px west of deck_e from v 400 to v 965 and follows the arch\'s curve, so it is the deck\'s far edge, not a bank.');

// -- east (u 19100-20500)
// E1 ACCEPTED (low, jar reading in its note): the dark head at the mat shed's corner post (t8 left it to t7, nobody recorded it)
addSP(spEnt(SPE, 'S3.fig.head_by_shed_post_19334'));
// E2 ACCEPTED (low): the table with the oval tray inside the open shop
addSP(spEnt(SPE, 'S3.prop.shop_table_tray_20140'));
join('S3.grp.south_shop_19920', ['S3.prop.shop_table_tray_20140']);
// E3 ACCEPTED: one tilted parasol, hub at the knob (19112, 97), its pole at u 19101-19106 (crop p2e_c_parasols_col.jpg)
{
  const ed = SPE.edits.find((x) => x.id === 'S3.prop.parasol_19150');
  setPts('S3.prop.parasol_19150', ed.set.pts);
  const p = get('S3.prop.parasol_19150'); if (p) p.what = ed.set.what;
  addNote('S3.prop.parasol_19150', ed.add_note);
  addNote('S3.prop.frame_awning_19070', 'Second pass (east): its "east post" at u ~19103 (v 100-140) is the same stroke as S3.prop.parasol_19150\'s pole, which drops from the parasol\'s hub knob (19112, 97), and its long diagonal from (19010, 60) ends at that hub. FRAME AGENT: kept (low): its west post at u ~19017, its ridge and slanting rafters are its own on the crop (p2e_c_parasols_col.jpg); if the frame is the parasol\'s stays and a rack, it goes at a later pass.');
}
// E4 ACCEPTED: the far-bank tables run on to u 19395 (left between t7 and t8)
{
  const ed = SPE.edits.find((x) => x.id === 'S3.prop.far_bank_tables_19210');
  setPts('S3.prop.far_bank_tables_19210', ed.set.pts);
  const p = get('S3.prop.far_bank_tables_19210'); if (p) p.what = ed.set.what;
  addNote('S3.prop.far_bank_tables_19210', ed.add_note);
}
// E5-E8, E10-E12 ACCEPTED: notes (and the cabin boat's conf)
for (const id of ['S3.bld.open_shop_20000', 'S3.bld.front_roof_19800', 'S3.veh.boat_mast_lowering_19518', 'S3.veh.boat_cabin_under_arch_19225', 'S3.tree.shrub_or_heap_20025', 'S3.fig.deck_hat_stick_19353', 'S3.fig.man_dark_cap_back_row_19325'])
  addNote(id, SPE.edits.find((x) => x.id === id).add_note);
{ const c = get('S3.veh.boat_cabin_under_arch_19225'); if (c) c.conf = 'high'; }
// E9 ACCEPTED: the porter carries the pole, the sack and the staff (his note rewritten by the second pass)
{ const p = get('S3.fig.porter_with_pole_20450'); const n = SPE.edits.find((x) => x.id === 'S3.fig.porter_with_pole_20450').set.note; if (p) p.note = n; }
// R1-R4 ACCEPTED (med): four retirements (README rule 7)
retire('S3.fig.light_robed_at_bow_19745'); // the tilted parasol's far rim; t9's head is S3.fig.bank_watcher_19672's
addNote('S3.prop.round_ribbed_object_19765', 'Second pass: the doubtful light-clad figure t8 recorded below it (light_robed_at_bow_19745) was the far rim of S3.prop.tilted_parasol_19790 and is retired; the moored boat keeps its 4 crew.');
addNote('S3.grp.bank_watchers_under_arch_19600', 'Second pass (east): light_robed_at_bow_19745 retired (the tilted parasol\'s far rim).');
retire('S3.fig.head_in_rigging_19990'); // a third rope hook under the arch's rib (crop p2e_c_loops_col.jpg)
retire('S3.fig.boatman_stern_rail_20400'); // the arms of S3.fig.boatman_stern_bending_20365
addNote('S3.grp.boat_mast_lowering_crew', 'Second pass (east): head_in_rigging_19990 (a rope hook under the rib) and boatman_stern_rail_20400 (the arms of S3.fig.boatman_stern_bending_20365) retired; 19 crew.');
repl('S3.grp.boat_mast_lowering_crew', 'what', 'its 21 crew recorded here (2 of them conf low)', 'its 19 crew recorded here');
retire('S3.prop.hanging_sack_and_staff_20412'); // carried on S3.fig.porter_with_pole_20450's shoulder

// every second-pass retirement named in another entity's text reads as history, not as a missing entity
for (const id of RETIRED2) if (!get(id)) swap(histRe(id), `${id.split('.').slice(2).join('.')} (retired at the second pass)`);
swap('record a prop `S3.prop.jar_by_shed_post_19334`', 'record a prop (jar_by_shed_post_19334)');
swap('record a prop S3.prop.jar_by_shed_post_19334', 'record a prop (jar_by_shed_post_19334)');

// ---- 9. the frame step (2026-10-12): the seam with S4b and the supports the frame gives heights to
// (a) The river at the S4b seam meets S4b's: S3's near shore and near bank top start exactly at S4b's points at u 15500
// (read from map/strokes/S4b.json on every run, like the road's point 0), 19 and 15 px from S3's own est readings.
const s4b = fs.existsSync(s4bPath) ? JSON.parse(fs.readFileSync(s4bPath)).entities : [];
const s4bLine = (id, role) => { const e = s4b.find((x) => x.id === id); return e ? at(e.pts.lines[role], 15500) : null; };
{
  const w = get('S3.water.bian_west_15500'), q = s4bLine('S4b.water.bian_river', 'shore_s');
  if (w && q && w.pts.lines.shore_s[0][0] === 15500) {
    w.pts.lines.shore_s[0] = q;
    addNote('S3.water.bian_west_15500', 'FRAME: shore_s point 0 is S4b.water.bian_river\'s shore_s at u 15500 (read from map/strokes/S4b.json each run; was this agent\'s (15500, 915, est), 19 px south). The north shore at the seam: S4b\'s far bank (S4b.grd.far_bank_15330: bank_top (15500, 75), shore (15500, 112), est) meets S3.grd.far_bank_seam_15500, which turns it off the silk\'s top edge by u ~15650; between there and u 16150 the water runs to the silk\'s top edge as this note says.');
  }
  const b = get('S3.grd.bank_s_15500'), qb = s4bLine('S4b.grd.near_bank_14850', 'bank_top');
  if (b && qb && b.pts.line[0][0] === 15500) {
    b.pts.line[0] = qb;
    addNote('S3.grd.bank_s_15500', 'FRAME: point 0 is S4b.grd.near_bank_14850\'s bank_top at u 15500 (read from map/strokes/S4b.json each run; was (15500, 930, est), 15 px south).');
  }
}
// (b) S4b ends a strip of far bank at the seam (bank_top (15500, 75), shore (15500, 112), est), while S3's water had no
// north shore west of u 16150. The strokes at 15480-16150, v 0-150 are plain silk (second pass west), so the join is an
// estimate: the shortest one that turns S4b's strip off the silk's top edge, and the willow crown stands on it.
{
  const top = s4bLine('S4b.grd.far_bank_15330', 'bank_top'), sh = s4bLine('S4b.grd.far_bank_15330', 'shore');
  if (top && sh) add({
    id: 'S3.grd.far_bank_seam_15500', kind: 'grd', name: 'far bank at the S4b seam, running off the silk\'s top edge',
    what: 'The east end of the far (north) bank\'s strip that S4b paints along the silk\'s top edge: it continues S4b\'s far bank past the seam and leaves the silk at its top edge within about 150 px; a willow\'s whips hang over it from beyond the edge.',
    pts: { lines: { bank_top: [top, [15540, 66, 'est'], [15600, 0, 'est']], shore: [sh, [15560, 85, 'est'], [15650, 0, 'est']] } },
    support: 'ground', support_by: { shore: 'water' }, vis: 'part: under the willow\'s whips; plain silk east of them', conf: 'low',
    note: 'FRAME (the cross-key seam check, asked for by the second pass west): S4b.grd.far_bank_15330 ends its bank_top and shore at u 15500 (est, hidden behind S4b\'s small cabin boat), and S3.water.bian_west_15500 had no shore_n west of (16150, 150): the water ran to the silk\'s top edge. On the scan, 15480-16150, v 0-150 is plain silk except the whips of S3.tree.willow_crown_top_15520 (no bank ink, no ripples), so the strokes cannot settle where the far bank leaves the silk. This entity is the shortest join: point 0 of each line is S4b\'s point at u 15500 (read from map/strokes/S4b.json each run), and both lines turn up off the silk\'s top edge by u 15600-15650, so the willow\'s est foot (15520, 70) stands on the bank. Other reading: the far bank runs on along the top edge to u ~16150 (then S3 would build a strip of far bank 650 px long). A question in map/frames/S3.json.',
  });
}
// (c) a bank's shore line is the same strokes as its river's shore: it stands on the water (H -0.7), not the street, as
// S4b's frame set for its banks; without this the same stroke maps 1.05 m apart
for (const e of all()) if (e.kind === 'grd' && e.pts?.lines?.shore && e.support_by?.shore !== 'water') {
  e.support_by = { ...(e.support_by || {}), shore: 'water' };
  addNote(e.id, 'FRAME: its shore line stands on the support `water` (support_by), like the river\'s shores; its bank_top on the ground.');
}
// (d) the boat under way: its three bowmen stand on the raised bow deck (river_w: floor v ~298, level with the bow top
// (15597, 300)), far above the stern deck where the sweep men stand; one support per deck, so the bow gets its own key
for (const e of all()) if (e.support === 'boat deck: S3.veh.boat_under_way_15595' && /^S3\.fig\.boatman_bow_/.test(e.id)) {
  e.support = 'boat bow deck: S3.veh.boat_under_way_15595';
  addNote(e.id, 'FRAME: support normalised to `boat bow deck: S3.veh.boat_under_way_15595`, the raised bow deck (river_w: floor v ~298, level with the bow top), which the frame gives its own height; the sweep men stand on the stern deck.');
}

// (e) The bridge deck's heights, point by point (map/frames/S3.json, supports, "bridge deck"; merge_notes.md, "Second pass
// and frame"). The deck's width lies east-west in the picture and its heights are level across it (the bridge agent), so a
// point on the deck has the height of the painted near edge deck_e at u* = max(u, u_s(v)), where u_s(v) is deck_e's u on
// the south flank at the point's own v. world() reads a u-keyed H_profile at the point's own u, so the frame gives one
// profile per offset from the near edge (deck_e's [u, H] shifted west by the offset), and each line or thing on the deck
// names the offset it stands at, measured on the strokes: `bridge deck` (at the near edge, u* = u), `bridge deck: <N> px
// west of the near edge` for N in 50-px steps, 375 the centre line deck_c and 750 the far edge deck_w. (An H_profile_X,
// keyed by world X, cannot give these heights: with S3's knots the bridge's axis runs ~49 deg from east, so X does not fix
// the place along the deck; the frame agent's comparison is in merge_notes.md.)
const BAND = 50;
const deckSup = (n) => (n <= 0 ? 'bridge deck' : `bridge deck: ${n} px west of the near edge`);
if (br) {
  const dE = br.pts.lines.deck_e;
  const south = dE.filter((p) => p[0] <= 19610).map((p) => [p[1], p[0]]).sort((a, b) => a[0] - b[0]); // [v, u] on the south flank
  const uS = (v) => { if (v <= 280) return 19610; for (let i = 0; i + 1 < south.length; i++) { const [v0, u0] = south[i], [v1, u1] = south[i + 1]; if (v >= v0 && v <= v1) return u0 + ((u1 - u0) * (v - v0)) / (v1 - v0); } return v > south.at(-1)[0] ? south.at(-1)[1] : 19610; };
  const band = (p) => Math.min(750, Math.max(0, Math.round((Math.max(p[0], uS(p[1])) - p[0]) / BAND) * BAND));
  br.support_by = { deck_e: deckSup(0), deck_c: deckSup(375), deck_w: deckSup(750), rib_e: 'water' };
  addNote('S3.str.rainbow_bridge', 'FRAME: support_by deck_e on `bridge deck` (its own painted heights), deck_c on `bridge deck: 375 px west of the near edge` and deck_w on `bridge deck: 750 px west of the near edge`: each line point gets the height of the deck_e point at its own v, as the bridge agent derived (the supports are deck_e\'s [u, H] shifted west); rib_e on the water.');
  if (rd) {
    rd.support_by = { centre: deckSup(375), edge_n: deckSup(750), edge_s: deckSup(0) };
    delete rd.support_ranges;
    addNote('S3.road.main', 'FRAME: each line on its own deck profile (support_by: centre = deck_c on `bridge deck: 375 px west of the near edge`, edge_n = deck_w on `bridge deck: 750 px west of the near edge`, edge_s = deck_e on `bridge deck`), replacing the merge\'s support_ranges (which applied one support to all three lines by u): each profile is 0 beyond the deck\'s feet, so the ground points before and after the bridge stay at H 0 and every deck point gets the painted height (the merge\'s tool-limit note, settled).');
  }
  for (const e of all()) {
    if (!(e.support || '').startsWith('bridge deck')) continue;
    const gp = ['foot', 'fore', 'hind', 'front', 'rear', 'base'].filter((k) => Array.isArray(e.pts?.[k]) && typeof e.pts[k][0] === 'number');
    if (!gp.length) continue;
    const b0 = band(e.pts[gp[0]]);
    e.support = deckSup(b0);
    const by = {};
    for (const k of gp.slice(1)) { const b = band(e.pts[k]); if (b !== b0) by[k] = deckSup(b); }
    if (Object.keys(by).length) e.support_by = { ...(e.support_by || {}), ...by }; else if (e.support_by) { for (const k of gp) delete e.support_by[k]; if (!Object.keys(e.support_by).length) delete e.support_by; }
  }
}

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log('fixes applied');
