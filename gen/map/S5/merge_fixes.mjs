// Cross-tile fixes for S5, from the agents' reports (merge_notes.md). Edits the parts in place; idempotent.
// node gen/map/S5/merge_fixes.mjs && node tools/scroll_map.mjs S5 merge
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
const join = (gid, ids) => { const g = get(gid); for (const id of ids) { const e = get(id); if (!e) { console.log(`missing ${id}`); continue; } if (e.group && e.group !== gid) { const old = get(e.group); if (old) old.members = old.members.filter((m) => m !== id); } e.group = gid; if (!g.members.includes(id)) g.members.push(id); } };

// the far-railing man on the t4|t5 boundary was recorded by both: his foot (u 8698) is t4's
if (get('S5.fig.far_rail_light_robe_8702')) drop('S5.fig.far_rail_light_robe_8702');
join('S5.grp.far_rail_sightseers', ['S5.fig.far_rail_white_8698', 'S5.fig.far_rail_back_8615']);
join('S5.grp.camel_caravan', ['S5.ani.camel_lead_7492', 'S5.fig.caravan_leader_7388']);
join('S5.grp.tax_quarrel', ['S5.fig.carter_6418', 'S5.fig.hidden_man_6452']);
join('S5.grp.near_rail_watchers', ['S5.fig.bridge_sightseer', 'S5.fig.rail_leaner_8665']);
// one 串车, not two (t4 and t5 agree): t5's team joins t4's cart group
const team = get('S5.grp.screen_cart_team');
if (team) { join('S5.grp.screen_cart_8510', [...team.members]); get('S5.grp.screen_cart_8510').what += ' ' + team.what; drop('S5.grp.screen_cart_team'); }
// the big covered ox cart: rear on the bridge's east end, front in S4; kept here as a seam entity
const ox = get('S5.veh.covered_ox_cart_9800');
if (ox && !/Seam entity/.test(ox.note || '')) ox.note = `${ox.note ? ox.note + ' ' : ''}Seam entity: its front (u 9800) is in S4; kept in S5 because its rear stands at the bridge's east end.`;

// loyalty pass (2026-10-11, crops in gen/map/S5/loyalty/): the gate stands without walls. Below the block's east
// half the strokes show a mottled earth-and-rock mound with trees, not a coursed wall; north of the block they show
// only trees and bare ground. Both wings are retired; the mound replaces the south one.
drop('S5.str.wing_south');
drop('S5.str.wing_north');
if (!get('S5.grd.rock_mound_7200')) parts['structures.json'].entities.push({
  id: 'S5.grd.rock_mound_7200',
  kind: 'grd',
  name: 'earth-and-rock mound at the gate block\'s south-east foot',
  what: 'A mottled mound of earth and rock against the gate block\'s south face at its east end, running south past the silk\'s bottom edge: moss-dot texture, pale streaks and lumpy contours, with no brick courses, no crest line and no crenellations. Trees grow on it and round it: the knotted elm on its slope, the old multi-trunk tree at its east edge, the big bare elm at its west foot.',
  pts: {
    base: { sw: [7010, 1790, 'est'], se: [7400, 1790, 'est'], ne: [7355, 1591, 'est'], nw: [7050, 1591, 'est'] },
    nw_top: [7110, 1300], ne_top: [7260, 1300],
  },
  support: 'ground',
  vis: 'part: trunks and pine foliage cross it; its south end is beyond the silk',
  conf: 'med',
  src: '余辉: 土墙杂树',
  note: 'Re-read in the loyalty pass from gridded crops (gen/map/S5/loyalty/mound_grid.jpg, z2_b.jpg); replaces S5.str.wing_south. Scholars read this mass as the slumped earthen city wall with trees (余辉 土墙杂树; Hansen: an "unguarded earthen wall... trees and brush growing at its base"); in either reading the painted form is a low mound about 4-5 m across that ends at the silk\'s edge, not a coursed wall running north-south. Painted edges: W (7030,1700), (7010,1790); E (7380,1700), (7400,1790). Upward the mottling narrows to u 7110-7260 at v ~1300, where it meets the block\'s face: read as the mound\'s crest against the face (nw_top/ne_top, about 3.8 m), low confidence. Its foot along the block is hidden (est on the block\'s S-face foot, v 1591); sw/se are where the edges reach the silk\'s bottom edge, so its true south end is not painted. North of the block (u 7500-8300, v 150-1200, gen/map/S5/loyalty/north_of_block.jpg) the strokes show only the big willow and the old bole, bare ground and the far shed: no wall.',
});

// the stall canopy against house_6390's west end: the structures agent left it to the tile agents, and none recorded it
if (!get('S5.prop.canopy_6186')) parts['t2.json'].entities.push({
  id: 'S5.prop.canopy_6186',
  kind: 'prop',
  name: 'stall canopy on two poles',
  what: 'A flat mat-and-plank canopy, its high (north-east) edge against the west end of the bracketed house, its low front edge carried by a straight pole on the west and a slanting prop on the east. Two men talk under it and a third sits in the house\'s open front behind the prop.',
  pts: { base: [6186, 1778, 'est'] },
  support: 'ground',
  vis: 'part: pole feet below the silk\'s edge',
  conf: 'high',
  src: '',
  note: 'Measured in the loyalty pass (gen/map/S5/loyalty/canopy.jpg). Canopy corners: high edge (6140,1465)-(6315,1422) against the house; low edge (6082,1592)-(6270,1565). West pole straight at u 6100-6105 from the low edge down past the silk edge (foot est 6103,1785); east prop slants from (6240,1565) to about (6270,1770). base = between the two pole feet (est). Canopy low edge about 2.3 m above the pole feet (v 1592 -> 1770). The sack S5.prop.sack_6132 leans at the west pole.',
});

// elm_7118 stands on the mound's slope south of the gate block, not at street level
const elm = get('S5.tree.elm_7118');
if (elm) elm.support = 'mound slope';
const ramp = get('S5.str.inner_ramp');
if (ramp) ramp.note = ramp.note.replace("it climbs along the inner (west) side of the south wing (S5.str.wing_south) to the terrace", "it climbs to the terrace west of the earth-and-rock mound (S5.grd.rock_mound_7200)");

// the tax office's base points are its column feet, which stand on the office floor (base plates at v 918-922)
const office = get('S5.bld.tax_office');
if (office) office.support = 'office floor';

// S6 seam notes (the S6 mapping agent, 2026-10-11, gen/map/S6/merge_notes.md): what continues west of u 5600
// the five casks west of the seam complete the depot's eight: three in front, two behind (est)
if (!get('S5.prop.casks_west_5525')) parts['t1.json'].entities.push({
  id: 'S5.prop.casks_west_5525',
  kind: 'prop',
  name: 'the depot\'s five west casks',
  what: 'Five more of the wine depot\'s big hooped casks, west of the seam: three in a row at the front of the depot floor and two behind them; with S5.prop.casks_5665 they make the eight casks painted. A tall bucket stands on the east one and the long fire-swatter pole (麻搭) lies across them.',
  pts: { base: [5525, 868] },
  support: 'ground',
  vis: 'part: the back row is hidden behind the front',
  conf: 'high',
  src: '余辉: 军酒',
  note: 'Measured by the S6 tile agent t6: front casks at (5462,873), (5528,873), (5590,872); back row est at (5475,858) and (5547,858); bucket on the east cask (5590,800); the pole across them at v 800-805 from u ~5453 eastward past 5600. Owned by S5 (part of the depot that straddles the seam); built by the gate builder.',
});
// the pole man (S6.fig.pole_man_5578) set his load down beside the roof watcher
if (!get('S5.prop.pole_load_5645')) parts['t1.json'].entities.push({
  id: 'S5.prop.pole_load_5645',
  kind: 'prop',
  name: 'a carrier\'s load set down by the low roof',
  what: 'A load stood on the ground behind the low building\'s ridge: about five upright sticks and a round flat object leaning against them, the load of the man with the pole just west of the seam (S6.fig.pole_man_5578).',
  pts: { base: [5645, 1485, 'est'] },
  support: 'ground',
  vis: 'part: its foot is hidden behind the roof',
  conf: 'med',
  src: '',
  note: 'From the S6 seam notes: sticks at u 5623-5643, top v 1263; round flat object 5637-5670, v 1317-1380; base estimated at (5645, 1485).',
});
// the two south roofs run on west of the seam to their painted west ends
const h58 = get('S5.bld.house_5800');
if (h58 && h58.pts.base.sw[0] === 5600) {
  h58.pts.base.sw = [5140, 1700, 'est']; h58.pts.base.nw = [5140, 1440, 'est'];
  h58.note += ' West end (S6 seam notes): a hip-gable end at u ~5135-5165, its west verge (5136,1465)->(5180,1640), top line at v 1445-1455; the point read at (5600,1385) is the top of a dark band above that line. Built by the gate builder, west into S6\'s range.';
}
const h57 = get('S5.bld.house_5720');
if (h57 && h57.pts.base.sw[0] === 5600) {
  h57.pts.base.sw = [5216, 1790, 'est']; h57.pts.base.nw = [5216, 1600, 'est'];
  h57.note += ' West part (S6 seam notes): apex at (5476,1496), west verge down to about (5216,1620), tiles to u ~5200-5230 at the silk\'s edge. Built by the gate builder, west into S6\'s range.';
}
const depot = get('S5.bld.wine_depot');
if (depot && !/S6 seam notes/.test(depot.note)) depot.note += ' West end (S6 seam notes): corner post at u ~5395-5423, lattice 5410-5450, eave discs from ~5415 east, floor front ~v 885; a round object on a thin pole at (5540-5570, 683-717) and a small box on the roof verge at (5455, 570) belong to the depot. The third archer is S6.fig.archer_waistguard_5465; the west casks are S5.prop.casks_west_5525.';
const back = get('S5.bld.back_hall_5790');
if (back && !/S6 seam notes/.test(back.note)) back.note += ' S6 seam notes: its west end (u ~5700-5710) abuts the east post of 孙羊正店\'s upper storey (S6); probably part of that complex, not proven.';

// S4 seam notes (the S4 mapping agent, 2026-10-12, gen/map/S4/merge_notes.md)
if (ox) {
  // the old test was case-sensitive (/seam/) and appended its sentence on every run: keep it once
  const SEAM = "Seam entity: its front (u 9800) is in S4; kept in S5 because its rear stands at the bridge's east end.";
  ox.note = ox.note.split(SEAM).join('').replace(/\s+$/, '') + ' ' + SEAM;
  if (ox.pts.front[0] !== 9960) {
    ox.pts.front = [9960, 1455, 'est'];
    ox.pts.wheels = [[9545, 1415, 'est']];
    ox.what = 'Large two-wheeled cart with a woven-mat barrel roof over a panelled body, a big spoked wheel near its middle, a basket hung at the rear and a rolled blind or round hamper at its front; it faces east, a driver seated on its footboard, one shaft running forward to its team of three oxen (S4.ani.ox_shaft_9972, ox_far_10045, ox_lead_10235). The first of the ox carts that continue into S4.';
    ox.note += ' S4 seam notes: front = ground under the shafts\' front ends at the shaft ox\'s fore hooves (9960, 1455, est), not 9800; the body\'s front panel at u ~9688, a footboard to 9750 where the seated driver (S4.fig.ox_driver_seated_9815) rests his feet; one shaft shows, (9690,1313) -> (9880,1308); the yoke is not clearly drawn (a tangle of collars and ropes at u 9950-10010, v 1320-1390, tassels at (10022,1397) and (10081,1395); yoke est (9965,1330)); rope traces from (9690,1335) to the shaft ox\'s rump; no second wheel visible; a rolled blind or round hamper at u 9690-9760, v 1195-1310. Near wheel re-measured: rim 9464-9637, hub (9543,1328), contact est (9545,1415). Its team and drivers are S4\'s (S4.grp.cart_9800_team).';
  }
}
const clump = get('S5.tree.willow_clump_9392');
if (clump && clump.pts.crown_e[0] !== 9745) {
  clump.pts.crown_e = [9745, 1500];
  clump.note = clump.note.replace('the stems east of u ~9450 may be a second clump (S4).', 'S4 seam notes: there is no second clump; all the whips converge at u 9390-9470 and the crown reaches east to about (9745, 1500).');
}
const h93 = get('S5.bld.house_9300');
if (h93 && h93.pts.base.se[0] !== 9458) {
  h93.pts.base.se = [9458, 152, 'est'];
  h93.pts.base.ne = [9458, 60, 'est'];
  h93.note += ' S4 seam notes: its roof ends at about u 9462 and its last post is at 9455 (feet est v 152), perhaps shared with S4.bld.house_9590.';
}

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log('fixes applied');
