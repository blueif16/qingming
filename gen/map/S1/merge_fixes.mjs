// Cross-unit fixes for S1 (the countryside, u 29050-37610), from the ten units' reports (merge_notes.md) and the
// merge agent's own crops (scratchpad/S1_merge/crops/*.jpg: zoom 0.7-4 scan crops, per-channel normalised or grey).
// Edits the parts in place; idempotent.
// node gen/map/S1/merge_fixes.mjs && node tools/scroll_map.mjs S1 merge
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
const add = (file, e) => { if (!get(e.id)) parts[file].entities.push(e); };
const join = (gid, ids) => { const g = get(gid); if (!g) { console.log(`missing group ${gid}`); return; } for (const id of ids) { const e = get(id); if (!e) { console.log(`missing ${id}`); continue; } if (e.group && e.group !== gid) { const old = get(e.group); if (old) old.members = old.members.filter((m) => m !== id); } e.group = gid; if (!g.members.includes(id)) g.members.push(id); } };
// the second pass's proposals (section 8). A MERGE note that a proposal's replace_in_note has since rewritten is not added
// again on a rerun (so the file stays idempotent)
const spDoc = (id) => JSON.parse(fs.readFileSync(new URL(`./second_pass/${id}.json`, import.meta.url)));
const SP = { west: spDoc('west'), willows: spDoc('willows'), farms: spDoc('farms'), start: spDoc('start') };
const superseded = (id, text, note) => Object.values(SP).some((d) => d.changes.some((c) => c.id === id && c.replace_in_note && text.includes(c.replace_in_note.old) && note.includes(c.replace_in_note.new)));
const noteOnce = (id, text) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (!(e.note || '').includes(text.slice(0, 50)) && !superseded(id, text, e.note || '')) e.note = `${e.note || ''} ${text}`.trim(); };
// replace an ID named in any what/note/vis text (after a retirement). The target itself is skipped: its own MERGE note
// names the retired ID as history (FRAME AGENT fix, from the second pass `farms`: without the skip the rename made
// S1.str.hedge_yard_34265 and S1.str.fence_brush_34660 say they were retired and name themselves)
const renameRefs = (from, to) => { for (const e of all()) { if (e.id === to) continue; for (const k of ['what', 'note', 'vis', 'name']) if (typeof e[k] === 'string' && e[k].includes(from)) e[k] = e[k].split(from).join(to); } };

// ============================================================ 1. the road: splice the join piece at u 33000
// structures_w recorded S1.road.main from the datum (29050, 730) [S2.road.main's last point] to 33150; structures_e the
// rest as the join piece S1.road.main_east from 32850. Both copied the points at 32850/33000/33150 exactly, so the
// splice keeps structures_w's points up to and including u 33000 and the east piece's from u > 33000. The piece is
// never a map entity: it is dropped after the splice.
{
  const rw = get('S1.road.main'), re = get('S1.road.main_east');
  if (rw && re) {
    for (const k of ['centre', 'edge_n', 'edge_s']) {
      const w = rw.pts.lines[k].filter((p) => p[0] <= 33000), e = re.pts.lines[k].filter((p) => p[0] > 33000);
      const a = w.at(-1), b = re.pts.lines[k].find((p) => p[0] === 33000);
      if (!b || a[0] !== 33000 || a[1] !== b[1]) console.log(`road splice: ${k} points at u 33000 differ (${JSON.stringify(a)} vs ${JSON.stringify(b)})`);
      rw.pts.lines[k] = [...w, ...e];
    }
    rw.name = 'the country road from the market through the village, under the great willows and past the farmsteads to the charcoal train\'s path';
    rw.what = `${rw.what} East of u 33000 (structures_e's join piece, spliced in the merge): ${re.what.replace(/^JOIN PIECE, not a map entity: the merge splices it into S1\.road\.main at u 33000\. /, '')}`;
    rw.vis = 'part: the ground is ink wash and no edge is drawn anywhere; under the big willows\' crowns at u 32300-33300; behind the big bare trees at u 35800-36150; under a seal from u ~37250';
    rw.note = `${rw.note} MERGE: spliced at u 33000 with structures_e's join piece S1.road.main_east (dropped): points up to and including u 33000 are structures_w's, points east of it the piece's (identical at 32850/33000/33150, so the splice is clean). The east piece's own reading follows. ${re.note}`;
    drop('S1.road.main_east');
  }
  noteOnce('S1.road.main', 'MERGE (for the frame and the builder): between u 35030 and 35420 the route\'s centre (v 905-895) and edge_n (v 860-845) run inside the south part of S1.grd.threshing_floor_35225 (v 800-930): the road skirts the floor along its south edge, and the two share that strip of open ground; nothing is painted to separate them. The two unpainted bends (30400-30720 south, 32300-32850 north) and the est stretch 35250-36190 are recorded choices of reading, not strokes.');
}

// ============================================================ 2. duplicates in disguise across units

// the pale rounded mass at the 菜地's north-west corner: structures_w's S1.grd.rock_29745 and t1's prop
// S1.prop.rock_or_heap_29745 are the same strokes (outline u 29704-29788, v 1039-1147). Merge crops rock_raw.jpg,
// rock_norm.jpg (zoom 2.5) and rock_grey.jpg (zoom 4): a pointed pale mass whose shaded west face is laid in with
// diagonal hatched texture strokes (cun), no head, face or hands; the inner curve structures_w read as a hood's opening
// is one of the texture strokes. Kept as the ground feature (structures_w's, with base corners and tops); t1's prop
// retired. The hooded-figure reading stays open for the second pass.
if (get('S1.prop.rock_or_heap_29745')) {
  drop('S1.prop.rock_or_heap_29745');
  const r = get('S1.grd.rock_29745');
  r.name = 'pale pointed rock at the field\'s north-west corner (or a hooded figure)';
  noteOnce('S1.grd.rock_29745', 'MERGE: t1 recorded the same mass as the prop S1.prop.rock_or_heap_29745 (rock, earth mound or straw heap; its west face\'s hatching "like rock texture more than straw"); that prop is retired and this entity kept. On the merge\'s zoom 2.5-4 crops it reads as an upright pointed rock: the shaded west face is laid in with diagonal texture strokes, and no head, face, hands or feet are drawn. The hooded-figure reading (b) is kept open for the second pass (if it is a figure, retire this and add a figure; it would change the cast).');
}

// the domed shape behind the big farmhouse's east end: structures_e's S1.bld.small_round_roof_34080 (dome u 34064-34097,
// v 700-725, a vertical stroke at ~34066 to v ~745) and t5's S1.prop.haystack_34080 (west side 34062, v 705-765, top
// 34078-34095 at v 697) are the same strokes. Merge crop yard_norm.jpg (zoom 2): a smooth dark dome with a straight
// west side and no eave, fringe or wall under it: kept as t5's straw stack (a free-standing thing is a tile's prop);
// structures_e's roof retired. Both readings stay in the prop's note.
if (get('S1.bld.small_round_roof_34080')) {
  drop('S1.bld.small_round_roof_34080');
  const h = get('S1.prop.haystack_34080');
  if (!h.pts.top) h.pts.top = [34080, 698];
  noteOnce('S1.prop.haystack_34080', 'MERGE: structures_e recorded the same dome as the building S1.bld.small_round_roof_34080 (dark hatched dome u 34064-34097, v 700-725; a thin vertical stroke at u ~34066 down to v ~745 that may be a post; readings: a small round thatched shelter on a post, or the top of a straw stack); that building is retired and this prop kept. On the merge\'s zoom-2 crop the dome has a smooth top, a straight west side and no eave fringe or wall under it, which reads as a stack. If the second pass finds the post and an eave, it becomes a small shelter again (a building).');
}

// the bush belt along the front of the farmsteads at u 34290-34830: t6 recorded it as two hedge-shrub "trees"
// (S1.tree.shrubs_34385, 34292-34530; S1.tree.shrubs_34735, 34585-34830), structures_e as the yard's hedge
// (S1.str.hedge_yard_34265, its east clump 34284-34410) and a brushwood fence (S1.str.fence_brush_34660, 34499-34821).
// Same strokes (merge crop hedges_norm.jpg): low dense clusters of small dark strokes, foot at v 912-925, no stakes or
// rails at zoom 3 (t6). A linear belt is built from its foot line, so the structures are kept and t6's two shrub
// entities retired; t6's reading (bushes) goes into their notes, and the hedge's line is extended east to t6's crown_e
// (34530) where the belt runs on behind the farmer.
if (get('S1.tree.shrubs_34385')) {
  const hy = get('S1.str.hedge_yard_34265');
  if (!hy.pts.line.some((p) => p[0] === 34530)) hy.pts.line.push([34470, 918], [34530, 920]);
  drop('S1.tree.shrubs_34385');
  noteOnce('S1.str.hedge_yard_34265', 'MERGE: t6 recorded the east part of this belt as hedge shrubs, S1.tree.shrubs_34385 (bushes from u ~34290 to ~34530, top v 785-830, foot on the ground line at v ~915-925; small dark leaf or twig clusters, no stakes or rails at zoom 3; the farmer S1.fig.farmer_by_hedge_34472 stands behind its east end), retired as the same strokes; the line now runs on east to (34530, 920) from t6\'s reading. BOTH READINGS for the builder: a hedge of low bushes (t6; a new tree form, "hedge shrubs", for the needs list) or a brushwood fence (structures_e).');
}
if (get('S1.tree.shrubs_34735')) {
  drop('S1.tree.shrubs_34735');
  noteOnce('S1.str.fence_brush_34660', 'MERGE: t6 recorded the same belt as hedge shrubs, S1.tree.shrubs_34735 (bushes in small dark leaf or twig clusters at u ~34585-34830, v 783-910, foot est on the ground line v ~910-930), retired as the same strokes. BOTH READINGS for the builder: low bushes (t6: no stakes or rails at zoom 3) or a brushwood fence (structures_e). Its west end meets S1.str.hedge_yard_34265 at the twin elm S1.tree.bare_elm_twin_34552.');
}
renameRefs('S1.tree.shrubs_34385', 'S1.str.hedge_yard_34265');
renameRefs('S1.tree.shrubs_34735', 'S1.str.fence_brush_34660');

// ============================================================ 3. groups across unit edges

// 惊马闯市: t1's old man at the post and the child he calls (u 29674-29862) belong to t2's runaway-horse group (the
// brief: the merge joins them). t2 checked u 29900-31250 only, so its "not painted" note is about its own range.
if (get('S1.grp.old_man_child')) {
  join('S1.grp.runaway_horse', ['S1.fig.child_29674', 'S1.fig.man_at_post_29812', 'S1.prop.post_crossbar_29862']);
  drop('S1.grp.old_man_child');
  const g = get('S1.grp.runaway_horse');
  g.what = `${g.what} West of the farmhouse, on the open ground by the vegetable field, a man leaning on the bar of a tall post stretches his arm toward a small child, calling it out of the horse's way (t1's reading of the old man and the child the scholarship names).`;
  g.note = g.note.replace('sections.md adds an old man calling a child away: no such pair is painted within u 29900-31250 (checked at zoom 1.6-3 over v 540-960 and the farmhouse front). If t1 records them west of 29900, the merge joins them to this group.',
    'sections.md adds an old man calling a child away: t2 found no such pair within u 29900-31250 (its range); t1 found them west of it, the child at (29674, 1064) and the man at the post at (29812, 1114), about 300 px of v nearer the viewer than the horse and 260-400 px west of it. MERGE: t1\'s group S1.grp.old_man_child (the child, the man and the post he leans on) is folded into this group; that they react to the horse is the scholars\' reading (conf med).');
}
// the tomb-sweeping party's rear porter has his feet at u >= 31100 (t3's); t2's group takes him
join('S1.grp.tomb_sweeping_party', ['S1.fig.party_porter_staff_31131']);
{
  const g = get('S1.grp.tomb_sweeping_party');
  g.note = g.note.replace('The merge adds him to this group.', 'MERGE: added as S1.fig.party_porter_staff_31131 (t3: foot (31131, 448), head (31132, 351); a long thin pole or staff slants over his shoulder).');
}

// ============================================================ 4. what each side left to the other

// the hut's great leaning willow: t3's S1.tree.willow_leaning_hut_31240 (reading (a), one tree rooted in the hollow
// bole) is the tree t2 described as "the great willow, t3's" and t1 as "a willow crown over the farmhouse's east end
// (trunk east of 30300)". Merge crop hutwillow_norm.jpg (zoom 0.7): the pollard head sits at about (30860-30990,
// 990-1120), the trunk runs on unbroken down-right in front of the fence to the hollow bole (31150-31310, 1330-1480),
// and the head's whips fan west over the farmhouse to u ~30290 and up to v ~560: t2's crown points are taken.
{
  const t = get('S1.tree.willow_leaning_hut_31240');
  if (t.pts.crown_w[0] !== 30290) {
    t.pts.crown_w = [30290, 1050, 'est'];
    t.pts.top = [30780, 560, 'est'];
    t.conf = 'med';
    noteOnce('S1.tree.willow_leaning_hut_31240', 'MERGE: crown_w and top moved to t2\'s reading (crown_w (30290, 1050), top (30780, 560), both est; were (30900, 950) and (31100, 600)): on a zoom-0.7 crop of u 30200-31400 the pollard head is at about (30860-30990, 990-1120), the trunk runs unbroken from it down-right in front of the hut\'s fence into the hollow bole, and its whips fan west over the farmhouse to u ~30290 and up to v ~560. t1\'s "willow crown over the farmhouse\'s east end, trunk east of 30300" (u 30290-30460, v 800-1190) is this crown. Reading (a) looks right at this zoom: conf raised to med; the second pass confirms at zoom 3.');
  }
}

// the pale lump at the great willow G1's west foot (u 31545-31600, v 1255-1345): t3 left it to structures_w, which did
// not record it. Merge crop g1foot_norm.jpg (zoom 2): a pale outlined root flare joined to the trunk's foot: part of
// the tree.
noteOnce('S1.tree.willow_great_31620', 'MERGE: the pale rounded lump at its west foot (31545-31600, 1255-1345) is read on a zoom-2 crop as this tree\'s exposed root flare, joined to the trunk\'s outline: part of the tree, not a rock (no entity).');

// the hut fence's gateway: t2 left "a thin upright at 30887-30903, v 1227-1277 and loose fence strokes on the ground
// at 30880-30920, v 1283-1297" to structures_w; structures_w left the gateway's contents to t2 (the trestle). The
// upright is drawn (merge crop gate_norm.jpg): a gate post standing in the gap, part of the fence.
{
  const f = get('S1.str.wattle_fence_31100');
  if (!f.pts.gate_post_foot) {
    f.pts.gate_post_foot = [30895, 1277];
    f.pts.gate_post_top = [30895, 1227];
    noteOnce('S1.str.wattle_fence_31100', 'MERGE (from t2): a thin post stands in the gateway (30887-30903, v 1227-1277; points gate_post_foot and gate_post_top), about 60 px of v behind the fence\'s foot line, with a few loose fence strokes lying on the ground beside it (30880-30920, v 1283-1297): part of this fence (a gate post and a loose hurdle). The A-frame trestle in the gap is t2\'s S1.prop.trestle_hut_gate_30841.');
    noteOnce('S1.prop.trestle_hut_gate_30841', 'MERGE: the thin upright and the loose strokes beside it are recorded as the gate post of S1.str.wattle_fence_31100 (points gate_post_foot, gate_post_top).');
  }
}

// the threshing floor's open shed: t6 left "a thatched lean-to roof u ~35000-35185, v 700-770, posts at u ~35040,
// 35085, 35100-35112 and 35150" to structures_e; structures_e recorded the two west posts as S1.str.posts_35075 (no roof
// read) and left "the forked pole at u ~35150" to t6, who took it for the shed's east post. Merge crop shed_norm.jpg
// (zoom 1.8): a vertical with a forked top at u ~35150 runs from v ~755 to ~868, just behind the bench's east leg, and a
// beam-like line at v ~780-790 joins the posts' tops under the willow's head. Folded into S1.str.posts_35075 as its east
// post, with t6's lean-to reading.
{
  const p = get('S1.str.posts_35075');
  if (!p.pts.post_fork_foot) {
    p.pts.post_fork_foot = [35155, 868];
    p.pts.post_fork_top = [35150, 755];
    p.name = 'posts (and perhaps an open lean-to) at the threshing floor\'s north edge';
    p.what = `${p.what} A fourth, taller post with a forked top stands at u ~35150 (v 755-868), just behind the bench's east leg.`;
    noteOnce('S1.str.posts_35075', 'MERGE: the forked pole at u ~35150 (structures_e left it to t6 as a prop; t6 left it back as the open shed\'s east post) is folded in here as this structure\'s east post: post_fork_foot (35155, 868), post_fork_top (35150, 755); on the merge\'s zoom-1.8 crop a beam-like line at v ~780-790 runs between the posts\' tops under the willow\'s head. t6 reads an open lean-to with a thatched roof at u ~35000-35185, v 700-770 over these posts (its shoots-or-thatch strokes hang there); structures_e reads no roof between the farmhouse\'s eave (v ~692) and the posts. BOTH READINGS stay: the builder settles posts-and-beam (a frame) or a lean-to as a choice. t6\'s props under it: S1.prop.long_plank_shed_35060, S1.prop.jar_shed_35058, S1.fig.figure_in_shed_35108.');
  }
}

// crow's nests: t5 recorded its nest as a prop (S1.prop.nest_33900, perched); t6 put three nests only in its trees'
// notes and asked the merge to decide. One rule for the section: every painted nest is a perched prop.
add('t6.json', { id: 'S1.prop.nest_34445', kind: 'prop', name: 'crow\'s nest in the west crown of the twin elm',
  what: 'A dark tangled clump of twigs in a fork of the bare elm\'s west stem: a crow\'s nest. No bird is painted on it.',
  pts: { base: [34445, 405] }, support: 'perched: S1.tree.bare_elm_twin_34552', vis: 'full', conf: 'med', src: '余辉: 寂静的谷场',
  note: 'MERGE: from t6\'s S1.tree.bare_elm_twin_34552 note (nest at (34435-34455, 380-405)); base = its bottom. t5 saw the same nest from its side ("a nest at (34440, 390)"). Recorded as a perched prop like t5\'s S1.prop.nest_33900.' });
add('t6.json', { id: 'S1.prop.nest_34680', kind: 'prop', name: 'crow\'s nest at the top of the tall elm',
  what: 'A dark tangled clump of twigs at the top of the tall bare elm: a crow\'s nest. No bird is painted on it.',
  pts: { base: [34680, 300] }, support: 'perched: S1.tree.bare_elm_tall_34703', vis: 'full', conf: 'med', src: '余辉: 寂静的谷场',
  note: 'MERGE: from t6\'s S1.tree.bare_elm_tall_34703 note (nest at (34670-34690, 280-300)); base = its bottom. Recorded as a perched prop like t5\'s S1.prop.nest_33900.' });
add('t6.json', { id: 'S1.prop.nest_34757', kind: 'prop', name: 'crow\'s nest on the tall elm\'s east branch',
  what: 'A second dark tangled clump of twigs on the tall bare elm\'s long east branch over the farmhouse roof: a crow\'s nest. No bird is painted on it.',
  pts: { base: [34757, 360] }, support: 'perched: S1.tree.bare_elm_tall_34703', vis: 'full', conf: 'med', src: '余辉: 寂静的谷场',
  note: 'MERGE: from t6\'s S1.tree.bare_elm_tall_34703 note (nest at (34750-34765, 343-360)); base = its bottom. Recorded as a perched prop like t5\'s S1.prop.nest_33900.' });
noteOnce('S1.tree.bare_elm_twin_34552', 'MERGE: its nest is the prop S1.prop.nest_34445.');
noteOnce('S1.tree.bare_elm_tall_34703', 'MERGE: its two nests are the props S1.prop.nest_34680 and S1.prop.nest_34757.');

// the dark diagonal wash band in front of the grove (t7 left it to structures_e, not in its part): a slope with the
// grove's feet on its top. Points from the merge's darkness profiles (prof.mjs, 8 px columns, 10 px bins) at u
// 35460-35640: its lower edge is sharp (light from v 815 at 35460, 860 at 35490-35520, 850 at 35550, 840 at 35580, 830
// at 35610-35640); its top is the grove's foot line (t7: feet v 745-775).
add('structures_e.json', { id: 'S1.grd.bank_35530', kind: 'grd', name: 'dark slope in front of the pale grove',
  what: 'A dark diagonal ink-wash band running from the grove\'s foot down to the east in front of the pale grove trees, with a sharp lower edge: the face of a low slope or bank, the grove standing on its top.',
  pts: { lines: { bank_top: [[35440, 765, 'est'], [35500, 770], [35560, 772], [35630, 778, 'est']], bank_foot: [[35460, 815], [35490, 855], [35520, 857], [35550, 846], [35580, 838], [35640, 828]] } },
  support: 'ground', vis: 'faded', conf: 'low', src: '',
  note: 'MERGE (t7 left it to structures_e, which had not recorded it): the band runs from about (35450, 770) to (35530, 855) (t7) and its lower edge is a sharp line, read on darkness profiles at u 35460-35640 (light ground from v 815 at 35460, 855-860 at 35490-35520, 846 at 35550, 838 at 35580, 828 at 35610-35640). Higher side north (the grove\'s feet, v 745-775, stand on its top); height judged under 1 m, depth mixed in. BOTH READINGS: a slope in front of the grove (t7, taken) or the grove trunks\' lower parts (t6 read the west trunks\' feet at v 890-915 here); the merge\'s grey crop shows no trunk outline crossing the band. S1.road.main crosses it (edge_n v ~815-840 there).' });
noteOnce('S1.tree.grove_fan_35485', 'MERGE: t7\'s foot line is kept: on the merge\'s grey zoom-2 crop (grove_feet_grey.jpg) the trunks thicken and end at v ~730-770 on the top of a dark diagonal wash band, now S1.grd.bank_35530, and no trunk outline crosses the band; t6\'s lower feet (v 890-915) are declined.');
noteOnce('S1.tree.grove_fan_35535', 'MERGE: foot kept at t7\'s reading (see S1.tree.grove_fan_35485 and S1.grd.bank_35530).');

// ============================================================ 5. notes linking one place read by two units

// structures_w's banks end at u 33000, structures_e's start there: the pairs meet within 3-8 px (one 30 px step)
const pairs = [
  ['S1.grd.bank_32445', 'S1.grd.bank_33300', 'top 1295/1298, foot 1338/1330'],
  ['S1.grd.bank_32905', 'S1.grd.bank_33650', 'top 1394/1395, foot 1486/1490'],
  ['S1.grd.bank_32900', 'S1.grd.terrace_lines_33800', 'top 1090 at 33000 against bank_top_c 1120 at 33100 (a 30 px step: both low)'],
  ['S1.grd.bank_32700', 'S1.grd.bank_south_34400', 'top 1580/1610, foot 1612/1640: structures_e reads the band about 30 px lower, so its top meets this bank\'s foot (both low)'],
  ['S1.grd.bank_32705', 'S1.grd.bank_south_34400', 'top 1662 = the latter\'s lower_band_top 1662'],
];
for (const [w, e, how] of pairs) {
  noteOnce(w, `MERGE: continues east of u 33000 as structures_e's ${e} (at u 33000: ${how}).`);
  noteOnce(e, `MERGE: continues west of u 33000 as structures_w's ${w} (at u 33000: ${how}).`);
}
// the band structures_e reads as water (pale) or ground starts at u 33000; west of it structures_w reads the same v
// as ground between S1.grd.bank_32905's foot (1486) and S1.grd.bank_32700's top (1580)
noteOnce('S1.water.wash_band_34400', 'MERGE: west of u 33000 nothing continues this band: structures_w recorded the ground there as banks (S1.grd.bank_32905, foot v 1486, and S1.grd.bank_32700, v 1580-1612, which runs inside this band\'s v range), and it reads the DARK band (v 1450-1600 from 32850 east) as the possible water, where this entity takes the PALE band. Water against ground is the ground pilot\'s open question for the user; the builder must not settle it silently.');

// the hump at the west end of the west farmstead's brushwood belt, and t4's "bush at 33375-33450, v 813-905"
noteOnce('S1.str.fence_brush_33760', 'MERGE: t4\'s "bush at 33375-33450, v 813-905" (left to t5) is this belt\'s west end; t5 reads the hatched front slopes above it as the thatch of S1.bld.farmhouse_back_33450 and S1.bld.farmhouse_gable_33670, and recorded no straw stack, so the hump (top (33491, 793)) stays part of this belt or of those roofs; the restyle\'s golden haystack is not recorded. Second pass: settle hump against thatch at zoom 2.');
// the compact dark blob on the terrace's bank line (33439-33472, v 1034-1062): structures_e left it to t5, t5 left it
// back as a moss dot at (33460, 1040). Moss dots (点苔) are not entities (t4, t5).
{
  const t = get('S1.grd.terrace_lines_33800');
  t.note = t.note.replace('(a small rock, a bush or a crouching animal: left to t5)', '(a small rock, a bush or a crouching animal; t5 read it as a moss dot at (33460, 1040), so MERGE: no entity)');
}
// t5's "low pollard willow, base about (33055, 1050)" (left to t4) is the east head of t4's leaning willow
noteOnce('S1.tree.willow_burl_leaning_east_32805', 'MERGE: t5\'s "low pollard willow, stubby gnarled bole at 33010-33095, v 990-1052, base about (33055, 1050)" with shoots fanning north-east over 33100-33420 is this tree\'s east head (heads at 32940-33085, v 978-1060), not another tree (merge crop at zoom 1 over 32850-33550).');
// small marks on the chase field's bank (30090-30113, v 590-627): t1 left them to structures_w as small rocks or a stump,
// t2 called them stones or moss dots; the merge's zoom-3 crop shows a few faint dots: no entity
noteOnce('S1.grd.bank_30300', 'MERGE: the small marks below its foot at (30090-30113, v 590-627) that t1 left as "small rocks or a stump" and t2 as "stones or moss dots" are a few faint dots on a zoom-3 crop: moss dots, no entity.');
noteOnce('S1.grd.bank_31390', 'MERGE: its "stumps or tree knees" are t3\'s S1.tree.sapling_far_31328 (31326) and the foot of S1.tree.willow_far_31505 (31474-31526).');
// the boat's mooring rope: the bridge's real ID
for (const k of ['what', 'note']) { const b = get('S1.veh.boat_sampan_36440'); b[k] = b[k].split('structures_e\'s S1.str.small_bridge_*').join('S1.str.small_bridge_36365'); }
noteOnce('S1.veh.boat_sampan_36440', 'MERGE: the rope\'s far end is the foot of a post of S1.str.small_bridge_36365 (its bays, at about (36445, 1100)). No rudder, sweep or side sweeps are painted, so the lead\'s bow rule (rudder or sweep = rear) cannot be applied: front stays the pointed east end tied to the bridge, conf low.');
noteOnce('S1.str.small_bridge_36365', 'MERGE: t8\'s boat S1.veh.boat_sampan_36440 is moored by a rope from its east end to the foot of the post at about (36445, 1100).');

// t2's far crown at the silk's top edge and t3's far willow's long west limb overlap (t3: the limb reaches about
// (30950, 40); t2's blotches are at 30955-31015, v 23-43). Merge crop top31000_grey.jpg (zoom 3.5): the willow's whips
// reach to about u 31000 near the top edge; the knotted blotch at 30985-31010 sits at their ends and the slanting stroke
// (30940,45)->(30965,75) runs west of them. Not settled: both kept, each naming the other.
noteOnce('S1.tree.far_tree_30985', 'MERGE: possible duplicate in disguise: t3\'s S1.tree.willow_far_31190 has its long west limb reaching about (30950, 40), and on the merge\'s zoom-3.5 crop that willow\'s whips run up-left to about u 31000 at the top edge, where this tree\'s knotted blotches sit. If the second pass reads the blotches as the whips\' twig ends, retire this tree.');
noteOnce('S1.tree.willow_far_31190', 'MERGE: t2\'s S1.tree.far_tree_30985 (blotches 30955-31015, v 23-43) lies at the end of this tree\'s west limb: one of them may be the other (second pass).');

// ============================================================ 6. seam notes on S1's side of u 29050 (S2's side: merge_notes.md)
noteOnce('S1.grd.terraced_fields_29450', 'MERGE (cross-key seam check against map/strokes/S2.json, u 28750-29350): edge_v155 starts at (29050, 152), 2 px from S2.grd.bank_lines_top_28900\'s edge_n end (29050, 150): the same stroke, already trimmed at the seam on both sides. S2\'s lower line (edge_s, ending (29050, 192) est; its note says it runs to (29073, 192)) has no S1 line east of the seam. edge_v57 runs on west of the seam to about (28960, 58), where S2 has no line: a seam note for S2.');
noteOnce('S1.tree.willow_burl_29090', 'MERGE (seam): S1\'s by its base (S2 t12 reads the base at (29070, 1785) and did not record it); its crown runs west over S2 to u ~28585 and its knobbed limb (28720-28880, v 1283-1450) reaches over S2.veh.boat_bottom_28395.');

// ============================================================ 7. for the second pass (flags in the notes)
noteOnce('S1.grd.field_vegetable_29790', 'MERGE: the plants are counted two ways: t1 records 13 young bare trees with trunks 90-180 px tall (S1.tree.young_bare_29558 ... _29948, count good to about +-2); this entity\'s what describes 25-35 small twiggy plants 30-70 px tall in 3-4 loose bands. On the merge\'s zoom-1.6 crop the plot is a dense mass of small bare crab-claw crowns over thin trunks (v 1150-1350), the trunks clearer in its east half. Second pass: count trunk feet at zoom 2 (red channel); what is not a tree entity is this field\'s planting, built as part of it.');
noteOnce('S1.fig.man_at_post_29812', 'MERGE: a small upright shape with a pointed top in front of him (u 29813-29840, v 1027-1100) and a dark rounded mass on the post\'s east side (29840-29880, v 1043-1067) are named only here and in the post\'s note: the second pass reads them at zoom 3 (a second, smaller figure held or standing at the bar, a bucket, or his own bundle and legs).');

// ============================================================ 8. second pass (2026-10-12): the frame agent accepts or declines each proposal
// Proposals: gen/map/S1/second_pass/west.json (u 29050-31100: 4 new, 13 changes), willows.json (31100-33200: 4 changes),
// farms.json (33200-35400: 2 new, 11 changes) and start.json (35400-37610: 1 new, 15 changes); 50 in all, every one
// accepted (two in a corrected form: the farms pass's two rename repairs, below). Every `was` value and every replaced
// note string was checked against the merged map first (scratchpad S1_frame/vet.py). The frame agent read the key crops
// again (scratchpad S1_frame/v_*.jpg: the indigo inverted V at the threshing-floor shed, the line at the boat's east end,
// the fans at the top edge over 30150-30350, the fourteenth stem, the pale far willow's fan, D1's lowered head).
// merge_notes.md, "Second pass and frame", lists every decision. New entities go to parts/second_pass.json.
// (SP, the four proposal files, is loaded at the top of this file)
parts['second_pass.json'] ||= { section: 'S1', entities: [] };
const addSP = (doc, id) => { const e = structuredClone(SP[doc].entities.find((x) => x.id === id)); delete e.crops; add('second_pass.json', e); };
const noteFull = (id, text) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (!(e.note || '').includes(text)) e.note = `${e.note || ''} ${text}`.trim(); };
const setPath = (o, path, v) => { const ks = path.split('.'); for (const k of ks.slice(0, -1)) o = (o[k] ||= {}); if (v === null) delete o[ks.at(-1)]; else o[ks.at(-1)] = structuredClone(v); };
const replIn = (id, k, from, to) => { const e = get(id); if (e && typeof e[k] === 'string' && e[k].includes(from)) e[k] = e[k].split(from).join(to); };
// one proposal's change: `set` (a field, a `pts.<path>` point or line, null deletes; `pts.lines.<role> (append)` adds
// the points past the line's end), `replace_in_note`, `add_note`, `also_add_note_to`
const apply = (doc, id, { skipReplace = false } = {}) => {
  const ch = SP[doc].changes.find((c) => c.id === id), e = get(id);
  if (!ch || !e) { console.log(`second pass: missing ${doc} ${id}`); return; }
  for (const [k, v] of Object.entries(ch.set || {})) {
    const m = k.match(/^pts\.lines\.(\w+) \(append\)$/);
    if (m) { const L = e.pts.lines[m[1]]; for (const p of v) if (!L.some((q) => q[0] === p[0])) L.push(structuredClone(p)); continue; }
    setPath(e, k, v);
  }
  if (ch.replace_in_note && !skipReplace) replIn(id, 'note', ch.replace_in_note.old, ch.replace_in_note.new);
  if (ch.add_note) noteFull(id, ch.add_note);
  if (ch.also_add_note_to) noteFull(ch.also_add_note_to.id, ch.also_add_note_to.text);
};

// -- west (u 29050-31100)
// W1 ACCEPTED (low): a fourteenth young tree in the 菜地's grove; the stem t1 named only in young_bare_29948's note, found
// by its paired outlines on column profiles (v_stem14.jpg shows the faint stem by the traveller's head). The tree count
// matters to the user ("even to the amount of trees"), so it is recorded low with the two-stem reading in its note
addSP('west', 'S1.tree.young_bare_29968');
apply('west', 'S1.tree.young_bare_29948');
// W2 ACCEPTED (low): the small far tree cut by the top edge that t1 and t2 each left to the other (v_fartop.jpg: a dark
// slanting stem (30230, 42)->(30297, 80) with fine fans up to the edge); W3 the twin willow's note follows
addSP('west', 'S1.tree.far_tree_top_30297');
apply('west', 'S1.tree.willow_twin_29970');
// W4 ACCEPTED (low): the banked far fields above the chase field (edge lines at v 303, 334, 364 and the measured diagonal
// to the ridge), named before only in two notes, one of whose straight diagonals has no stroke under it (line profile);
// W5 field_30430's ridge drops 8-14 px east of 30370 onto the clump row; W6 the far willow's note follows
addSP('west', 'S1.grd.banked_fields_30400');
apply('west', 'S1.grd.field_30430');
apply('west', 'S1.tree.willow_far_30500');
// W7 ACCEPTED (low): the far slope's slanting stroke under the far shrubs, named only in far_tree_30985's note; W8 that
// tree is a far shrub, not the far willow's twig ends (knotted dots like far_shrubs_30860's; the willow's shoots are
// fine lines that thin out at u 31000-31020): the merge's open duplicate is closed, both kept
addSP('west', 'S1.grd.far_slope_30950');
apply('west', 'S1.tree.far_tree_30985');
noteFull('S1.tree.willow_far_31190', 'FRAME AGENT (second pass west accepted): S1.tree.far_tree_30985 is a far shrub, not this willow\'s twig ends (its blotches are knotted dots like S1.tree.far_shrubs_30860\'s clumps; this tree\'s west shoots are fine lines that thin out at about u 31000-31020, v 40-60): both are kept.');
// W9 ACCEPTED (med): the far terraces: five missing field lines added (three near the seam, where nothing was recorded
// between v 57 and 152), two extended east past the silk crease and two moved 8-17 px onto their strokes (line profiles
// in 40 px segments); the far figures now have the strips they stand on
apply('west', 'S1.grd.terraced_fields_29450');
// W10 ACCEPTED (med): young_bare_29655's foot moves 60 px down to where its trunk is drawn below the willow's whips
apply('west', 'S1.tree.young_bare_29655');
// W11 ACCEPTED: the 菜地 is 13 trunk feet (plus the faint 14th); the "25-35 plants" are these trees' low crowns
apply('west', 'S1.grd.field_vegetable_29790');
// W12 ACCEPTED: the hut willow is one leaning tree (reading a), and the willows pass's base is right (see V1)
apply('west', 'S1.tree.willow_leaning_hut_31240');
// W13, W14 ACCEPTED (med): no second figure at the post: the pointed shape is the man's sleeve and hand, the dark mass his
// forearm on the bar; nothing hangs from the bar
apply('west', 'S1.fig.man_at_post_29812');
apply('west', 'S1.prop.post_crossbar_29862');
// W15 ACCEPTED (med): the pale mass is a rock (texture strokes, 104 px summit to foot beside a 146 px man at the same
// foot level): the hooded-figure reading is dropped, and the name loses it
apply('west', 'S1.grd.rock_29745');
{ const r = get('S1.grd.rock_29745'); if (r) r.name = 'pale pointed rock at the field\'s north-west corner'; }
// W16 ACCEPTED (low): the slats over the counter are the stall shed's lattice front (no entity, as the merge decided)
apply('west', 'S1.bld.stall_shed_29600');

// the `what` texts the text map reads follow W11 and W15 (frame agent)
replIn('S1.grd.field_vegetable_29790', 'what', 'planted with small twiggy bare plants or bushes (about 25-35, 30-70 px tall) standing in three or four loose rows; a rock-like mass stands at its north-west corner and a few taller saplings at its east end.', 'planted with young bare trees: 13 trunk feet and a faint fourteenth, each its own tree entity (S1.tree.young_bare_29558 to S1.tree.young_bare_29968), whose low crab-claw crowns fill the plot (the second pass counted the feet; "25-35 small plants" was a reading of these crowns); a pale pointed rock (S1.grd.rock_29745) stands at its north-west corner.');

// -- willows (u 31100-33200)
// V1 ACCEPTED (med): the hut willow's base moves to the bole's drawn lower edge, (31215, 1492, est) (row profiles; the
// west pass reads the same edge). Its knock-on on S1.road.main's edge_n is section 9 (b)
apply('willows', 'S1.tree.willow_leaning_hut_31240');
// V2 ACCEPTED (stays low): a third reading for the far sapling, a cut stump or low pollard (note only)
apply('willows', 'S1.tree.sapling_far_31328');
// V3 ACCEPTED (med): the rear porter carries a plain staff (a 5 x 9 px knob at its top, no blade or tines at zoom 8); the
// group's "hoe or rake?" goes, and the porter gets the note
apply('willows', 'S1.grp.tomb_sweeping_party');
// V4 ACCEPTED (low): the lobe beside willow B is B's exposed roots, read like the burled willow's root lobes one tree west
apply('willows', 'S1.tree.willow_burl_great_32620');

// -- farms (u 33200-35400)
// F1 ACCEPTED (low): a pale far willow behind the long farmhouse (v_farwillow.jpg: the pale fan at 34900-35000 converges
// on its own point at about (34995, 598), 130-160 px west of the near willow's knob); F2 the near willow's note follows
addSP('farms', 'S1.tree.far_willow_34995');
apply('farms', 'S1.tree.willow_pollard_35128');
// F3 ACCEPTED (low): the open floor behind the yard rail, where the roller stands (each side left it to the other; pin 2
// falls on it); a second threshing floor or plain ground, both in its note. F4 the farmyard group's note follows
addSP('farms', 'S1.grd.floor_behind_yard_34285');
apply('farms', 'S1.grp.farmyard_34200');
// F5 ACCEPTED (med): a duplicate in disguise across kinds: S1.str.posts_35075's east post and S1.fig.figure_in_shed_35108
// are the same inverted V. On v_shedfig.jpg (zoom 4, colour) its strokes are indigo like the painter's garments, the
// west post and the forked pole plain grey ink, and no shaft runs on to the ground: the figure is kept and the post
// dropped from the structure (the structure keeps the west post and the forked pole; its line runs foot to foot)
apply('farms', 'S1.str.posts_35075');
apply('farms', 'S1.fig.figure_in_shed_35108');
{
  const p = get('S1.str.posts_35075');
  if (p && !p.what.startsWith('A thin upright post')) {
    p.what = 'A thin upright post at the north edge of the threshing floor (u 35050-35065, v 750-830), under the east part of the long farmhouse\'s eave and west of the big willow, and a taller post with a forked top at u ~35150 (v 755-868), just behind the bench\'s east leg; a beam-like line may join their tops (a frame, or an open lean-to).';
    p.name = 'two posts (a frame, or an open lean-to) at the threshing floor\'s north edge';
  }
}
// F6 ACCEPTED (med): the post named only in the farmyard group's note is the SE corner post of the big thatched
// farmhouse, and t5's "small thatched shed" is that house's east hip end: se corner onto the post's foot, a bay there
apply('farms', 'S1.bld.farmhouse_thatched_33955');
replIn('S1.grp.farmyard_34200', 'what', 'two low objects by the small shed;', 'two low objects under the big farmhouse\'s east hip end;');
replIn('S1.prop.yard_object_34170', 'what', 'at the foot of the small shed by the farmyard,', 'under the east hip end of S1.bld.farmhouse_thatched_33955, by its corner post,');
// F7 ACCEPTED (med): the smaller farmhouse's ridge_w sat on an elm stem 45 px west of the roof
apply('farms', 'S1.bld.farmhouse_thatched_34600');
// F8, F9 ACCEPTED IN A CORRECTED FORM: the two notes that named themselves as retired. The cause was renameRefs (now
// skips the target itself, top of this file); here the mangled text from the earlier runs is restored to the merge's
// own words, so a rebuild from the units' parts and a run on the current parts give the same note. The passes' reading
// (bushes; possible rails at the barn's west bay) goes in as their add_note
replIn('S1.str.hedge_yard_34265', 'note', 'as hedge shrubs, S1.str.hedge_yard_34265 (', 'as hedge shrubs, S1.tree.shrubs_34385 (');
replIn('S1.str.fence_brush_34660', 'note', 'as hedge shrubs, S1.str.fence_brush_34660 (', 'as hedge shrubs, S1.tree.shrubs_34735 (');
apply('farms', 'S1.str.hedge_yard_34265', { skipReplace: true });
apply('farms', 'S1.str.fence_brush_34660', { skipReplace: true });
// F10-F12 ACCEPTED: notes with measured evidence, nothing settled that the strokes can't settle: the hump is not a stack
// (fence or roof stays open: the lead's question), the dome has no post (a stack), the long farmhouse's roof leans to
// tile (thatch or tile stays open: a kit question)
apply('farms', 'S1.str.fence_brush_33760');
apply('farms', 'S1.prop.haystack_34080');
apply('farms', 'S1.bld.farmhouse_long_34950');

// -- start (u 35400-37610)
// S1 ACCEPTED (med): D1 is a side view with its head lowered at its east end (v_d1.jpg): head (36340, 792), facing 330
apply('start', 'S1.ani.donkey_charcoal_36323');
// S2 ACCEPTED (med): the faint west driver is a figure (jacket, belt, two legs) holding a stick out east over D1
apply('start', 'S1.fig.charcoal_driver_36250');
// S3 ACCEPTED: the train's direction as painted is east-south-east (every readable head at the east end, the rear
// driver's stick); the routine is the lead's (questions)
apply('start', 'S1.grp.charcoal_train');
// S4-S6 ACCEPTED (low): the line at the boat's east end is vertical, 60 px long, and stops 40-60 px under the nearest
// bridge post foot (v_pole.jpg); no bay stands at (36445, 1100). A mooring pole in the stream bed, its own prop; the
// boat's what, the boat's note and the bridge's note follow. The boat floats; its bow stays unreadable (front = east, low)
addSP('start', 'S1.prop.mooring_pole_36444');
apply('start', 'S1.veh.boat_sampan_36440');
apply('start', 'S1.str.small_bridge_36365');
replIn('S1.veh.boat_sampan_36440', 'what', 'A thin line runs from its east end up to the foot of a bridge post: its mooring rope (or a pole stuck in the stream bed).', 'A thin upright pole stands in the stream at its pointed east end (S1.prop.mooring_pole_36444): the boat is tied to it.');
// S7-S13 ACCEPTED (med or low, as proposed): the extents the merge asked for, each from column darkness profiles: the
// near bank and the stream's south shore run on east to about 37250; spit_36225 to its tip at (36815, 1433); the shoal
// from about 35790; the pale band's north shore at 35500-35780 drops to the lowest wash stroke (v ~1390); the north
// bank's foot runs between the seals to about 37560; the east spit to the seal at 37355; bank_37050's foot is its
// lowest wash layer (918-978), not its top layer's edge (868-870). The seals were measured (R-G > 45), not assumed
apply('start', 'S1.grd.bank_south_34400');
apply('start', 'S1.water.stream_36500');
apply('start', 'S1.grd.spit_36225');
apply('start', 'S1.grd.shoal_36380');
apply('start', 'S1.water.wash_band_34400');
apply('start', 'S1.grd.bank_36900');
apply('start', 'S1.grd.spit_east_37060');
apply('start', 'S1.grd.bank_37050');
// the pale band's south shore is the near bank's top: its last two points (est) move onto the near bank's new top, so it
// meets the stream's south shore at u 36000 (frame agent; the start pass replaced the near bank's top from 35900)
{
  const w = get('S1.water.wash_band_34400'), L = w?.pts.lines.shore_s;
  if (L) {
    const i9 = L.findIndex((p) => p[0] === 35900), i0 = L.findIndex((p) => p[0] === 36000);
    if (i9 >= 0 && L[i9][1] !== 1590) { L[i9] = [35900, 1590]; L[i0] = [36000, 1582]; noteFull(w.id, 'FRAME AGENT: shore_s\'s last two points move onto the near bank\'s top as the second pass (start) measured it, (35900, 1590) and (36000, 1582) (were 1592 est at both), so this band\'s south shore meets S1.water.stream_36500\'s shore_s at u 36000.'); }
  }
}
// declined in part: bank_37050's note offers `bank slope` for the two east trees on its face. `bank slope` in this frame
// is half way down to the stream (H -0.35), and this bank rises ABOVE the road, so the trees stay on `ground`
noteFull('S1.grd.bank_37050', 'FRAME AGENT: the two trees on this face (S1.tree.slender_bare_37018, S1.tree.elm_bare_37140) stay on `ground`: the frame\'s `bank slope` (H -0.35) is the stream bank\'s face half way down to the water, and this bank rises above the road, so it would put them too far north. The face\'s rise is the ground pilot\'s terrain (questions).');
// S14 ACCEPTED (low, optional): the road's est east end runs on over the painted open strip to the seal's west edge at
// u 37390 (the seal at the road's height starts at 37396; the one at 37248 is the top seal)
apply('start', 'S1.road.main');
// S15 ACCEPTED (med): the slender tree's base moves 18 px to its trunk's centre
apply('start', 'S1.tree.slender_bare_37018');

// ============================================================ 9. the frame step (2026-10-12): the S2 seam and the frame's keys
// (a) The datum: S1.road.main's point 0 on each line is S2.road.main's last point at u 29050, read from
// map/strokes/S2.json on every run (S2's merge may still move it); S2 measured the centre, so S1's copy drops its est
{
  const s2p = new URL('../../../map/strokes/S2.json', import.meta.url);
  const s2 = fs.existsSync(s2p) ? JSON.parse(fs.readFileSync(s2p)).entities : [];
  const r2 = s2.find((e) => e.id === 'S2.road.main'), rd = get('S1.road.main');
  if (r2 && rd) for (const k of ['centre', 'edge_n', 'edge_s']) {
    const p = r2.pts.lines[k]?.at(-1), L = rd.pts.lines[k];
    if (p && p[0] === 29050 && L[0][0] === 29050 && JSON.stringify(L[0]) !== JSON.stringify(p)) { console.log(`frame: S1.road.main ${k} point 0 ${JSON.stringify(L[0])} -> S2's ${JSON.stringify(p)}`); L[0] = structuredClone(p); }
  }
  noteFull('S1.road.main', 'FRAME: point 0 of each line is S2.road.main\'s last point at u 29050, copied from map/strokes/S2.json on every run of merge_fixes.mjs (centre (29050, 730) measured by S2, edges (29050, 695) and (29050, 1000) est): the datum of map/frames/S1.json, station +314.87.');
  // the far field line that crosses the seam (the cross-key seam check: S2.grd.bank_lines_top_28900's edge_n ends at
  // (29050, 150), S1's edge_v155 starts at (29050, 152), the same stroke, no overlap in u): S1's first point takes S2's
  const b2 = s2.find((e) => e.id === 'S2.grd.bank_lines_top_28900')?.pts.lines?.edge_n?.at(-1), tf = get('S1.grd.terraced_fields_29450')?.pts.lines.edge_v155;
  if (b2 && tf && b2[0] === 29050 && tf[0][0] === 29050 && JSON.stringify(tf[0]) !== JSON.stringify(b2)) {
    noteFull('S1.grd.terraced_fields_29450', `FRAME (cross-key seam check): edge_v155's first point takes S2.grd.bank_lines_top_28900 edge_n's last point exactly, (${b2.slice(0, 2).join(', ')}) (was (${tf[0].slice(0, 2).join(', ')})), so the line joins across the seam; copied from map/strokes/S2.json on every run.`);
    tf[0] = structuredClone(b2);
  }
}
// (b) the hut willow's base moved down to the bole's lower edge (31215, 1492, est; V1): edge_n ran about 20 px inside the
// bole at u 31150-31280, so it drops to the bole's foot there (the willows pass's numbers: pale silk from v 1500 east of
// u 31240, from 1480-1490 east of 31280)
{
  const L = get('S1.road.main')?.pts.lines.edge_n;
  if (L && !L.some((p) => p[0] === 31150)) {
    const i = L.findIndex((p) => p[0] > 31100);
    L.splice(i, 0, [31150, 1500, 'est'], [31250, 1500, 'est']);
    noteFull('S1.road.main', 'FRAME: edge_n gets two points at the hut willow\'s bole, (31150, 1500, est) and (31250, 1500, est), between (31100, 1484) and (31300, 1470, est): with the bole\'s base moved to its drawn lower edge (31215, 1492, est; second pass willows) the old line ran about 20 px inside the bole. The centre (31150, 1530, est) is unchanged.');
  }
}
// (c) for the lead and the builder: the route's strip in front of the farmsteads is the trees' strip (second pass farms)
noteFull('S1.road.main', 'FRAME (from the second pass farms, for the lead): from u 33400 to 34750 nine tree bases stand between edge_n and edge_s, five on or south of the centre (S1.tree.elm_forked_33433, elm_forked_33785, elm_tall_33865, elm_slender_33906, elm_twin_33936, elm_spreading_34030, bare_elm_twin_34552, bare_elm_twin_34640, bare_elm_tall_34703): the light strip between the fences\' feet (v ~895-918) and the yard bank\'s top (v ~943-950) is the only level ground there, and the trees stand on it. The lines are kept as read (the strokes don\'t settle it): the walkable line weaves between the trunks (a build choice), or the lead moves the centre onto the bank top just south of the feet (v ~945-950).');

// (d) a ground line drawn on the water's edge stands on the water's support, as S2's frame set its banks' shore lines:
// the stream's surface is H -0.7 (map/frames/S1.json), and 1 m of H moves a point 1.5 m in depth, so without this the
// same stroke maps 1.05 m apart (a bank's foot at H 0, the water's shore 1.05 m north of it under the bank's face).
// Bank feet that are the water's shore lines (same points, checked with S1_frame/coincide.py), and the land tongues and
// the shoal, whose units read both edges as waterlines. The near bank's top (= the shores' shore_s) stays on the ground:
// its dark face is the near shore's crest, and the water at -0.7 lies 1.05 m north of it, the bank's slope between
const supBy = (id, role, s, why) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (e.support_by?.[role] !== s) { e.support_by = { ...(e.support_by || {}), [role]: s }; noteFull(id, `FRAME: its ${role} stands on the support \`${s}\` (support_by), the water's level: ${why}`); } };
const supAll = (id, s, why) => { const e = get(id); if (!e) { console.log(`missing ${id}`); return; } if (e.support !== s) { e.support = s; noteFull(id, `FRAME: support -> \`${s}\`: ${why}`); } };
supBy('S1.grd.bank_36900', 'bank_foot', 'stream', 'its foot is the same strokes as S1.water.stream_36500\'s shore_n from u 36615 east (the waterline); its bank_top stays on the ground, so the face falls 0.7 m to the water.');
supBy('S1.grd.bank_36060', 'bank_foot', 'stream', 'its foot is S1.water.stream_36500\'s shore_n at u 36030-36125 (the west bank\'s waterline at the big elms\' roots); its bank_top stays on the ground.');
supBy('S1.grd.dyke_36380', 'bank_foot', 'stream', 'its foot (the thin dark line at v 962-981 just north of the bridge) is where S1.water.stream_36500\'s est shore_n runs under the deck; its bank_top (the donkey path\'s edge) stays on the ground.');
supBy('S1.grd.bank_33650', 'bank_foot', 'stream', 'its foot is S1.water.wash_band_34400\'s shore_n at u 33000-34450 (the same points). This follows the band\'s WATER reading (conf low): if the lead or the user takes the band as ground, this goes back to the ground with it.');
supBy('S1.grd.bank_35200', 'bank_foot', 'stream', 'its foot is S1.water.wash_band_34400\'s shore_n at u 34650-35420 (the same points; east of 35420 the shore drops to the land tongue\'s lower edge, into which this foot runs). This follows the band\'s WATER reading (conf low): if the band is ground, this goes back to the ground with it.');
for (const id of ['S1.grd.spit_under_boat_36140', 'S1.grd.spit_36150', 'S1.grd.spit_36225', 'S1.grd.spit_east_37060'])
  supAll(id, 'stream', 'a low land tongue in the stream whose two edges are waterlines (its unit\'s reading), so both edges stand at the water\'s level; the builder raises its back a little above the water as a choice.');
supAll('S1.grd.shoal_36380', 'stream', 'streaks in the open water (shoals, reeds or ripple wash), at the water\'s level.');

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log(`fixes applied: ${all().length} entities in ${Object.keys(parts).length} parts`);
