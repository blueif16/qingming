// Cross-tile fixes for S6, from the agents' reports (merge_notes.md). Edits the parts in place; idempotent.
// node gen/map/S6/merge_fixes.mjs && node tools/scroll_map.mjs S6 merge
import fs from 'node:fs';
const dir = new URL('./parts/', import.meta.url);
const parts = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(new URL(f, dir)))]));
const all = () => Object.values(parts).flatMap((p) => p.entities);
const get = (id) => all().find((e) => e.id === id);
const drop = (id) => { for (const p of Object.values(parts)) p.entities = p.entities.filter((e) => e.id !== id); for (const e of all()) if (e.members) e.members = e.members.filter((m) => m !== id); };
const join = (gid, ids) => { const g = get(gid); if (!g) { console.log(`missing group ${gid}`); return; } for (const id of ids) { const e = get(id); if (!e) { console.log(`missing ${id}`); continue; } if (e.group && e.group !== gid) { const old = get(e.group); if (old) old.members = old.members.filter((m) => m !== id); } e.group = gid; if (!g.members.includes(id)) g.members.push(id); } };
const add = (file, e) => { if (!get(e.id)) parts[file].entities.push(e); };

// --- duplicates across tile seams (lead's check, gen/map/S6/look/lead_*.jpg) ---

// t2's donkey_wine_cart_3191 and t3's cart_donkey_east_3203 are the same near donkey of the wine cart (19 px apart);
// keep t2's, which is in the cart's group
drop('S6.ani.cart_donkey_east_3203');

// the cart at the incense shop's corner was recorded by t2 (handcart_3100, front at the west shaft tips) and t3
// (barrow_casks_3300, front at the east end). One vehicle: its man stands between the handles at the WEST end, striding
// north-east, so he pushes it east and its front is the east end (t3's reading). Only one wheel shows (under the
// middle, drawn round), so 串车 barrow or two-wheeled handcart is open. Keep t3's entity; retire t2's.
if (get('S6.veh.handcart_3100')) {
  const b = get('S6.veh.barrow_casks_3300');
  b.note += ' MERGE: t2 recorded the same cart as S6.veh.handcart_3100 (front at the west shaft tips (3100,712), body with lattice sides heaped with dark sacks and bundles, a hook hanging at its north-east end, wheel 80 x 87 px, hub (3215,645)); retired as a duplicate. Whether it has one wheel (串车) or two (only the near one shows) is open.';
  b.conf = 'med';
  drop('S6.veh.handcart_3100');
  drop('S6.grp.handcart_3100');
  const m = get('S6.fig.handcart_man_3130');
  delete m.group;
  m.note = `${m.note} His cart is S6.veh.barrow_casks_3300: he pushes it from between its handles.`;
  add('t3.json', { id: 'S6.grp.barrow_3300', kind: 'group', name: 'barrow pushed past the incense shop', what: 'A man in a broad hat stands between the handles of a barrow heaped with roped dark bundles at the incense shop\'s corner and pushes it east toward the crossroads.', members: [] });
  join('S6.grp.barrow_3300', ['S6.veh.barrow_casks_3300', 'S6.fig.handcart_man_3130']);
}

// the woman in the west sedan was recorded by t4 (sedan_passenger_4362) and t5 (sedan_passenger_4357), 7 px apart;
// her foot is in t4's range: keep t4's with t5's support, in t5's sedan group, with the sedan's other people from t4
drop('S6.fig.sedan_passenger_4357');
{
  const p = get('S6.fig.sedan_passenger_4362');
  p.support = 'sedan: S6.veh.sedan_4575';
  join('S6.grp.sedan_4575', ['S6.fig.sedan_passenger_4362', 'S6.fig.sedan_rear_bearer_4195', 'S6.fig.sedan_attendant_4255', 'S6.fig.man_below_sedan_4343']);
}

// --- groups across seams ---

// the storyteller's ring: t4 made the group (storyteller and the east half), t3 recorded the west half with the
// group's ID but without the entity
join('S6.grp.storyteller_ring', ['S6.fig.ring_bearded_robe_3630', 'S6.fig.ring_fan_cap_3688', 'S6.fig.ring_bending_3668', 'S6.fig.ring_dark_robe_3692', 'S6.fig.ring_bun_3712', 'S6.fig.ring_standing_post_3745', 'S6.fig.ring_bending_hat_3748', 'S6.fig.ring_listener_3788']);

// --- missed figures (second pass) ---

// a face between the fan holder and the standing man in the ring's west half: seen by t4 independently and painted
// as a figure by the restyle too; t3 did not record it (gen/map/S6/look/lead_insp_ringface.jpg)
add('t3.json', {
  id: 'S6.fig.ring_face_3735', kind: 'figure', name: 'half-hidden listener in the ring (face only)',
  what: 'A small face with dark hair shows between the man holding the dark fan and the tall man standing at the back of the ring; the rest of the body is hidden by the listeners in front. A youth or a short man.',
  pts: { foot: [3735, 960, 'est'], head: [3732, 778] }, support: 'ground', pose: 'standing', facing_deg: 0,
  group: 'S6.grp.storyteller_ring', vis: 'part: face only, between the listeners', conf: 'low', src: '余辉: 街头说书',
  note: 'Face at about (3722-3745, 775-800) on the scroll (lead\'s second pass; t4 noted "a face (3725,789)"). Foot est under the face at the ring\'s depth (v ~960, like the neighbours\'); painted height unknown.',
});
join('S6.grp.storyteller_ring', ['S6.fig.ring_face_3735']);

// two porters at the t1|t2 seam: t1 recorded the front one (dark cap, two big baskets, walking west); the top-knot
// porter just behind him (pole on his right shoulder, cylindrical basket at its west end, facing east) has his feet
// hidden in t2's range and neither tile recorded him (gen/map/S6/look/lead_insp_porters.jpg)
add('t2.json', {
  id: 'S6.fig.porter_topknot_2605', kind: 'figure', name: 'porter with a top-knot and a tall cylindrical basket',
  what: 'Young porter with his hair in a top-knot, in a short jacket, walking just behind (north of) the porter with the two big baskets and facing east; a shoulder pole on his right shoulder carries a tall cylindrical woven basket at its west end, its east end pointing ahead.',
  pts: { foot: [2605, 1335, 'est'], head: [2600, 1145] }, support: 'ground', pose: 'carrying', facing_deg: 0,
  vis: 'part: legs hidden behind the porter in front', conf: 'med', src: '',
  note: 'Pole at v ~1170-1180 from u ~2510 to ~2690; cylindrical basket u 2515-2549, v 1227-1279. Feet hidden; est ~190 px below the head. Recorded in the merge (t1 saw him; t2 took him for the front porter).',
});
add('t1.json', { id: 'S6.grp.porters_2588', kind: 'group', name: 'two porters passing', what: 'Two porters with shoulder poles pass each other in the open street: one in a dark cap walks west under two big round baskets, the other, with a top-knot, walks east just behind him with a tall cylindrical basket on his pole.', members: [] });
join('S6.grp.porters_2588', ['S6.fig.porter_baskets_2588', 'S6.fig.porter_topknot_2605']);

// --- tile props vs the structures pass ---

// the tall red board on the cross street was recorded by t4 (prop red_board_3936) and the structures agent
// (S6.str.red_panel_3898). It stands free, about 3.5 m west of the corner shop's west wall, so by the brief it is a
// prop: keep t4's, with the structures agent's reading in its note
if (get('S6.str.red_panel_3898')) {
  const p = get('S6.prop.red_board_3936');
  p.note += ' MERGE: the structures pass recorded the same board as S6.str.red_panel_3898 (retired as a duplicate): panel u 3895-3978, v 130-365, red-lacquered with a dark border and a rounded top, its lower part hidden behind the corner shop\'s west eave; foot est at v ~400 (a ~3.5 m board), in the cross street about 3.5 m west of the corner shop\'s west wall; no characters visible.';
  drop('S6.str.red_panel_3898');
}

// 楊家應症 hangs on the clinic's east corner post (structures pass: post 4100-4110 carrying the sign 4100-4145), so it
// is part of S6.bld.clinic_yang (its what names it), not a free-standing prop
drop('S6.prop.signboard_yangjia_4118');

// the butcher's flag hangs from its own slanting pole (structures pass), so it stays a prop: the pole is part of it
{
  const b = get('S6.prop.banner_sunyangdian_4152');
  if (!/slanting pole/.test(b.note)) b.note += ' MERGE: the structures pass reads the flag as hung from a pole of its own, running straight from (4085,545) at the butcher\'s roof\'s west end down to (4445,835) at the 正店\'s west column, where its foot probably stands; the pole is part of this entity.';
}

// the pale lozenge over the shed is a cloth awning on a post (structures pass: 2650-2920, v 548-705, post 2648-2656);
// the structures agent did not make it a building, so it stays t2's prop
{
  const m = get('S6.prop.mat_roof_2800');
  if (m.conf === 'low') {
    m.conf = 'med';
    m.what = 'A large pale flat canopy (cloth or mat awning) drawn as a lozenge over a shed front with a slatted railing and a lattice under it, carried on a post at its west corner; behind the umbrellas south of the incense shop.';
    m.note += ' MERGE: the structures pass sees the same awning on a post at u 2648-2656 (awning 2650-2920, v 548-705) and did not record a building under it; it may be the incense shop\'s south porch.';
  }
}

// the west 栀子灯: a reddish gourd-shaped lamp at the 正店's west door (u 4400-4445, v 760-870), the twin of t6's
// gardenia_lamp_5055; t5 left it to the structures agent and the structures agent to the tile agents, so nobody
// recorded it (gen/map/S6/look/lead_insp_gourdW.jpg)
add('t5.json', {
  id: 'S6.prop.gardenia_lamp_4422', kind: 'prop', name: '栀子灯 (gourd-shaped lamp) at the 正店\'s west door',
  what: 'Tall reddish gourd-shaped lamp (栀子灯) with a narrow neck and a round belly, standing at the west end of 孙羊正店\'s street front by its west column, beside the parasol stall; the twin of the lamp at the east door.',
  pts: { base: [4422, 880, 'est'] }, support: 'ground', vis: 'part: its stand hidden behind the crowd', conf: 'med', src: '名画记: 栀子灯 (pin 38)',
  note: 'Lamp u 4400-4445, v 760-870 (outline of neck and belly; the restyle paints it as a red gourd too). Stand est below it at v ~880, like S6.prop.gardenia_lamp_5055 (lamp 5030-5073, v 747-873; stand to v 900). Added in the merge: t5 and the structures agent each left it to the other.',
});

// the incense shop's pole scaffold: tall thin poles with spear-like finials and a lattice of cross-bars hung with small
// ornaments rise above its east eave at u 2895-3117. t2 left them to the structures agent ("the incense shop's 彩楼
// poles"), the structures agent named them only in the shop's note ("tall poles with hanging goods ... (props)"), so
// nobody recorded them; the restyle leaves them out (gen/map/S6/look/lead_incense_poles_z2.jpg)
add('structures.json', {
  id: 'S6.str.cailou_incense_2895', kind: 'structure', name: 'pole scaffold (small 彩楼) on the incense shop\'s east front',
  what: 'A decorated scaffold of tall thin poles with spear-like finials along the incense shop\'s east front at its south-east corner, on the cross street: the poles rise past the shop\'s east eave and are tied by a lattice of cross-bars running back along the eave, hung with small ornaments (tassels or goods); a small 彩楼 like the 正店\'s, the 劉家 signboard standing just north-east of it.',
  pts: { base: { sw: [2895, 803, 'est'], se: [2915, 803, 'est'], ne: [3137, 573, 'est'], nw: [3117, 573, 'est'] }, sw_top: [2895, 340], nw_top: [3117, 220] },
  support: 'ground', facing_deg: 0, vis: 'part: the poles\' lower parts are hidden behind the lean-to and the shop front; their feet are estimated', conf: 'med', src: '',
  note: 'Poles at u ~2895 (top v ~340), ~2930-2960, ~2985-2990 (top ~260), ~3045 (top ~220), ~3100 (top ~220), ~3117 (top ~260); lattice cross-bars along the east eave from about (2880,560) up to (3110,300). Feet est on the shop\'s east wall-foot line (S6.bld.incense_shop_liu: (2908,790) -> (3245,440), slope -1.04): at u 2895 v ~803, at u 3117 v ~573, so the scaffold stands along the east front, about 4.5 m of it from the south-east corner. Heights about 6.0 m (west) and 4.1 m (east) on the frame. Added in the merge (lead\'s second pass): t2 left the poles to the structures agent, which named them in the shop\'s note as props. Whether they carry goods (a display rack) or are a small 彩楼欢门 is open; built as one structure either way.',
});

// the 正店's front: two painted things t5 handed to the structures agent and that its what does not name
{
  const z = get('S6.bld.sunyang_zhengdian');
  if (!/MERGE/.test(z.note)) z.note += ' MERGE (from t5): also painted on its ground-floor front, as parts of this building: a dark cloth banner hung at u 4971-5006, v 756-804, and a shop counter inside at u 4730-4810, v 805-840.';
}

// where the pork is sold: t4's meat counter, chopping block, hanging pork and pot stand under the CORNER shop's eave
// (u 3788-3980), with the bald butcher behind them; the 孫羊店 flag hangs in front of the next building east
// (S6.bld.butcher_shop_sun), whose front shows pale cloth panels, not meat (gen/map/S6/look/lead_insp_butcher.jpg).
// The structures pass named that building the butcher's and gave it "the meat counter"; correct its description
{
  const b = get('S6.bld.butcher_shop_sun');
  if (!/MERGE/.test(b.note)) {
    b.what = b.what.replace(' and an open front with the meat counter', ' and an open front hung with pale cloth panels');
    b.note += ' MERGE: the meat counter, chopping block, hanging pork and the butcher himself (t4: S6.prop.meat_counter_3856, S6.prop.chopping_block_3963, S6.prop.hanging_meat_3857, S6.fig.butcher_3920) stand under the corner shop\'s eave at u 3788-3980, so the pork is sold from S6.bld.corner_shop_3725; this building carries the 孫羊店 flag before it. The two may be one shop (孙羊店), this its east lean-to (as the structures pass suspected); the name is kept.';
    const c = get('S6.bld.corner_shop_3725');
    c.note += ' MERGE: its counter (3780-4000) is the 孫羊店 meat counter of the tile maps (S6.prop.meat_counter_3856 with the chopping block, hanging pork and the butcher), and the storyteller stands just in front of it; the 孫羊店 flag hangs before the next building east (S6.bld.butcher_shop_sun), which may be this shop\'s east lean-to.';
  }
}

// --- supports: one key per height the frame can give (map/frames/S6.json supports) ---
const setSup = (id, s) => { const e = get(id); if (e) e.support = s; };
// goods whose base point is the ground under them (stand, tub, block and counter feet)
for (const [id, on] of [['S6.prop.goods_tray_4385', 'S6.prop.tray_stand_4385'], ['S6.prop.goods_tray_4258', 'S6.prop.tray_stand_4258'], ['S6.prop.goods_tray_4108', 'S6.prop.tray_stand_4110'],
  ['S6.prop.sticks_in_tub_4325', 'S6.prop.tub_4320'], ['S6.prop.meat_pieces_3978', 'S6.prop.chopping_block_3963'], ['S6.prop.pot_on_counter_3832', 'S6.prop.meat_counter_3856']])
  setSup(id, `ground: on ${on}`);
setSup('S6.prop.box_2075', 'ground: on a hidden table or stand');
// goods whose base point is on the table top
for (const id of ['S6.prop.paper_goods_tray_2548', 'S6.prop.paper_figure_hat_2516', 'S6.prop.paper_figure_2487', 'S6.prop.paper_tower_2442', 'S6.prop.paper_figure_2415']) setSup(id, 'table top: S6.prop.paper_stall_table_2395');
for (const id of ['S6.prop.ewer_upper_5507', 'S6.prop.dishes_upper_5475']) setSup(id, 'zhengdian table top: S6.prop.table_upper_5497');
setSup('S6.fig.child_on_back_2795', 'carried on back: S6.fig.man_carrying_child_2790');
setSup('S6.fig.well_rope_drawer_2097', 'well cover: S6.str.square_well_2000 (its back beam)');
setSup('S6.fig.well_bucket_lifter_2032', 'well cover: S6.str.square_well_2000 (its back beam)');

// Q8 (2026-10-13, gen/life/q8_figures.md): 名画记 40's fat owner at the meat shop's door is the man on the high seat: his reading added (what, src, note), not a new entity
{
  const e = get("S6.fig.seated_man_highseat_4070");
  if (e && !/ Q8 \(2026-10-13/.test(e.note || '')) {
    Object.assign(e, {"what":"Man in a broad-brimmed dark hat and dark jacket, broad in the body, sitting high on a tall chair at the meat shop's door behind the oval tray of goods, facing the viewer. The stall keeper, or (名画记 40) the meat shop's fat owner, sitting at his door while his hired hand works the chopping block.","src":"名画记 40 (城里的商铺: 店内有一人在操刀，大概是伙计；另一人则坐在门首板凳上，身体肥胖，应是老板)"});
    e.note = (e.note || '') + " Q8 (2026-10-13, gen/life/q8_figures.md): 名画记 40's fat owner, who sits on a bench at the meat shop's door while a hired hand works the knife, is this figure, not a new one. He is the only seated figure at the shop's front: just east of the chopping block (S6.prop.chopping_block_3963) and the butcher (S6.fig.butcher_3920), in front of the junction of the corner shop's counter and the 孫羊店 building, about 1.9 m out from the shop floor's line (v ~790). He is broad in the body with a round face, and the restyle paints him fat too. Crops gen/life/q8/s6_meatshop_wide.jpg, s6_highseat_z2.jpg.";
  }
}

for (const [f, p] of Object.entries(parts)) fs.writeFileSync(new URL(f, dir), JSON.stringify(p, null, 1) + '\n');
console.log('fixes applied');
