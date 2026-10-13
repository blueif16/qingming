// Cross-tile fixes for S4 (part 1, u 9400-12600), from the agents' reports (merge_notes.md) and the lead's review.
// Edits the parts in place; idempotent.
// node gen/map/S4/merge_fixes.mjs && node tools/scroll_map.mjs S4 merge
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
const join = (gid, ids) => { const g = get(gid); if (!g) { console.log(`missing group ${gid}`); return; } for (const id of ids) { const e = get(id); if (!e) { console.log(`missing ${id}`); continue; } if (e.group && e.group !== gid) { const old = get(e.group); if (old) old.members = old.members.filter((m) => m !== id); } e.group = gid; if (!g.members.includes(id)) g.members.push(id); } };
const addNote = (id, text) => { const e = get(id); if (e && !(e.note || '').includes(text)) e.note = `${e.note ? e.note + ' ' : ''}${text}`; };

// ---- tiles: groups that cross tile edges (t1|t2, t2|t3, t3|t4)
join('S4.grp.pig_herd_10236', ['S4.ani.pig_10185']);
join('S4.grp.covered_ox_cart_10550', ['S4.fig.ox_leader_11017']);
// the soldiers, their box and their gear east of the gate are t4's; the white horse lies in the same post's yard
join('S4.grp.courier_post_soldiers', ['S4.fig.soldier_slumped_11885', 'S4.fig.soldier_asleep_on_box_12022', 'S4.prop.document_box_12041',
  'S4.prop.furled_dark_banner_11870', 'S4.prop.red_pole_and_spear_11935', 'S4.prop.dark_cone_on_gate_post_11821', 'S4.ani.white_horse_lying_11840']);
// the stall and its table are members of the pack-donkey group but had no group field
join('S4.grp.pack_donkeys_10487', ['S4.prop.stall_shed_10470', 'S4.prop.long_table_10525']);

// ---- t2|t3: the gnarled trunk mass at u 10895-11080 is one old willow with two stems from one foot (lead's
// review, gen/map/S4/look/lead_split_tree.jpg, lead_split_z4.jpg): the east "stem" is bark texture on a broad trunk
// whose outline closes at u ~11075, and the two stems join in one dark foot at v 650-690. t3's east stem is the same
// tree as t2's: drop it, and put the tree's base at the shared foot.
if (get('S4.tree.willow_stem_11020')) drop('S4.tree.willow_stem_11020');
const gn = get('S4.tree.gnarled_10950');
if (gn && !/twin/.test(gn.note || '')) {
  gn.pts.base = [10990, 690, 'est'];
  addNote('S4.tree.gnarled_10950', 'Merge (lead): one tree with twin stems from one foot, u 10895-11080; the east stem (t3\'s S4.tree.willow_stem_11020, dropped) is part of it. Base moved from the west stem\'s foot (10950, 685, est) to the shared foot (10990, 690, est) between the stems; the restyle paints the east stem as a man in a red robe, which the strokes do not show (bark texture, closed trunk outline at u ~11075).');
}

// ---- things the structures agent and the tile agents each left to the other (lead's check of every "left to" list,
// crops gen/map/S4/look/lead_c_*.jpg)
// the counter in house_9590's open front is built into the front: a part of the house (it is in its `what`), not a prop
const h9590 = get('S4.bld.house_9590');
if (h9590) h9590.note = h9590.note.replace('counter 9662-9720 (v 127-142, a prop inside the front)', 'counter 9662-9720 (v 127-142, built into the front: part of the house)');
// the plank board above the beam at the bottom of the silk (u 11310-11470, v 1650-1700): t3 left the whole thing to the
// structures agent, which recorded the beam and its verticals and left the board to the tile agents. One thing: the
// board lies on (or is the top of) the same low construction.
const fe = get('S4.str.forecourt_edge_11390');
if (fe && !/Merge \(lead\)/.test(fe.note || '')) {
  fe.what = 'A low construction at the bottom of the silk south of the tea-house tables: a plank board on top (u 11310-11470, v 1650-1700), a thick dark beam under it and short vertical members below the beam. A low railing or a long low bench; the restyle reads the ridge of a low roof.';
  fe.conf = 'low';
  addNote('S4.str.forecourt_edge_11390', 'Merge (lead): the plank board above the beam is part of this entity (t3 read the whole as "a low roof or a long bench" and left it to the structures agent). Identification low.');
}
// south_hall_12350's open front: the stair rail is part of the building; the table the child reaches to (t4: top
// u 12599-12683) and the barrel/drum stand east of u 12600 (part 2); the structures agent's "table 12480-12560" is
// the stair's railing (crop lead_c_child.jpg)
const sh = get('S4.bld.south_hall_12350');
if (sh && !/Merge \(lead\)/.test(sh.note || '')) {
  sh.what = sh.what.replace('a table where a child stands, a stair rail and a tall drum-like barrel', 'a stair with a railing; a child (S4.fig.child_at_table_12597) reaches onto a table just east of u 12600');
  addNote('S4.bld.south_hall_12350', 'Merge (lead): the stair rail (12420-12560, v 1620-1780) is part of this building; the table (t4: top u 12599-12683, v 1638-1642) and the barrel or drum (12650-12700) are east of u 12600 and belong to part 2; the "table 12480-12560" above is the stair\'s railing.');
}

// ---- the second pass (two agents, gen/map/S4/second_pass/*.json; lead's review crops gen/map/S4/look/lead_p2_*.jpg).
// Accepted entities are copied into parts/p2.json; the rest are declined with the reason here.
const p2 = (parts['p2.json'] ||= { section: 'S4', entities: [] });
const passDir = new URL('./second_pass/', import.meta.url);
const pass = Object.fromEntries(['west.json', 'east.json'].map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, passDir))).entities]));
const accept = (file, id, edit) => { if (get(id)) return; const e = structuredClone(pass[file].find((x) => x.id === id)); if (!e) { console.log(`second pass: no ${id}`); return; } if (edit) edit(e); p2.entities.push(e); };
// the child held at the shoulder was named only in its carrier's `what` (README rule 6; S6 maps carried children too)
accept('west.json', 'S4.fig.child_in_arms_10430', (e) => { e.support = 'carried in arms: S4.fig.person_with_child_10430'; });
accept('west.json', 'S4.grp.person_with_child_10430');
join('S4.grp.person_with_child_10430', ['S4.fig.person_with_child_10430']);
// pine-like needle fans above house_9590's roof: a crown no entity covered, its trunk behind the house (low)
accept('west.json', 'S4.tree.behind_house_9640');
// a robed figure at the back of the eating house's open front (low; t3 had noted "diagonal strokes")
accept('east.json', 'S4.fig.figure_under_eave_11382');
// the dark stepped block and double rail in front of the doorway: a stair or a low roof's end (low)
accept('east.json', 'S4.str.stair_or_roof_end_11755');
// a small black bird perched in the big willow's whips (named only in the willow's note; low)
accept('east.json', 'S4.ani.bird_12433', (e) => { e.support = 'perched: S4.tree.gnarled_willow_12390'; });
// DECLINED: S4.bld.roof_corner_top_11270 (the lead's crop lead_p2_roofcorner.jpg shows willow whips crossing at the
// top edge, no tile rows it can confirm); S4.prop.staff_or_rolled_mat_12588 (held against the seated man's knee: part
// of his figure, a carried prop, see the needs list); S4.tree.small_bush_10296 (a railing's capped end post, below).

// misreads the second pass found
const oxS = get('S4.ani.ox_shaft_9972'), oxF = get('S4.ani.ox_far_10045');
if (oxS && oxS.pts.head[0] !== 10013) { oxS.pts.head = [10013, 1350]; addNote('S4.ani.ox_shaft_9972', 'Second pass: head moved from (9975, 1355), which sat on the collar tangle, to its own head (eye 10005-10012, 1345-1352; muzzle 10027-10038, 1355-1365), ahead of its forelegs.'); }
if (oxF && oxF.pts.head[0] !== 10062) { oxF.pts.head = [10062, 1338]; addNote('S4.ani.ox_far_10045', 'Second pass: head moved from (10025, 1345), the shaft ox\'s head, to its own head behind and east of it (u 10033-10094, v 1297-1366, muzzle 10075-10090, 1360).'); }
const sh10330 = get('S4.bld.south_hall_10330');
if (sh10330) addNote('S4.bld.south_hall_10330', 'Second pass: the south railing continues east from the column at u ~10212 along v 1717-1721 to an end post with a round cap at (10296, 1715-1760), low dark tufts at its foot; the restyle paints a capped post with a curved rail. Part of this building.');
const rp = get('S4.prop.red_pole_and_spear_11935');
if (rp && rp.pts.base[0] !== 11933) { rp.pts.base = [11933, 714]; addNote('S4.prop.red_pole_and_spear_11935', 'Second pass: its foot is drawn: the dark upright at 11920-11946, v 646-714 between the slumped soldier and the tree lies on the shaft\'s line, so base (11933, 714) is measured (was 11938, 705, est); a small dark trapezoid at 11900-11940, v 339-355 above the spikes may be its head (a blade or pennant), low.'); }
const ss = get('S4.fig.soldier_slumped_11885');
if (ss) ss.note = ss.note.replace('A narrow dark upright shape at 11926-11950, v 642-710 between him and the tree trunk is NOT recorded: it reads as a fold of the tree\'s root (no head or cap), but could be a small figure in shadow (conf low).', 'The narrow dark upright at 11926-11950, v 642-710 between him and the tree trunk is the foot of S4.prop.red_pole_and_spear_11935 (second pass), not a figure.');
// the gate's west column is the thick double-outlined post at u 11577-11594 (v 413 to 547+), west of the framed side
// panel (11611-11647): the gate building and the wall meet there
const gh = get('S4.bld.post_gatehouse_11730'), ww = get('S4.str.post_wall_w_11470');
if (gh && gh.pts.base.sw[0] !== 11585) {
  gh.pts.base.sw = [11585, 600, 'est']; gh.pts.base.nw = [11610, 560, 'est']; gh.pts.bays = [[11585, 600, 'est'], ...gh.pts.bays];
  addNote('S4.bld.post_gatehouse_11730', 'Second pass: a thick double-outlined post stands at u 11577-11594 (v 413 to at least 547) west of the framed side panel (11611-11647): read as the gate building\'s west column, so sw/nw moved from 11610/11635 to 11585/11610 and a bay added at 11585; the side panel fills the bay between it and the jamb. (It could instead be a separate post of the wall.)');
  if (ww) { ww.pts.base.se = [11585, 600, 'est']; ww.pts.base.ne = [11602, 575, 'est']; }
}
const mbr = get('S4.fig.man_behind_roof_11165');
if (mbr && /roof ridge/.test(mbr.what)) { mbr.what = 'Man in a dark cap and a pale robe seen from behind, standing at the south edge of the road; only his head and shoulders show above the whips of the tall bare tree south of the road (no roof stands in front of him: the ridge of the tiled hall ends at about u 11050).'; mbr.vis = 'part: below the shoulders hidden by the whips of S4.tree.bare_tree_s_11075'; }
const st = get('S4.prop.small_stand_10900');
if (st && !/bundle on top/.test(st.what)) st.what += ' A hatched bundle lies on top of it (u 10880-10914, v 660-700).';
const gw = get('S4.tree.gnarled_willow_12390');
if (gw) gw.note = gw.note.replace('may be a bird (not recorded)', 'may be a bird (mapped in the second pass as S4.ani.bird_12433, low)');
const msbt = get('S4.fig.man_seated_by_tree_12512');
if (msbt) addNote('S4.fig.man_seated_by_tree_12512', 'Merge (lead): the long pale wedge from his right knee to the ground (12520, 943) -> (12593, 973) is held or propped against him (a staff or a rolled mat): part of his figure, a carried prop in the needs list.');

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log('fixes applied');
