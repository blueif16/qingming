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
if (ox && !/seam/.test(ox.note || '')) ox.note = `${ox.note ? ox.note + ' ' : ''}Seam entity: its front (u 9800) is in S4; kept in S5 because its rear stands at the bridge's east end.`;

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

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log('fixes applied');
