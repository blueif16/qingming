// Round 2 tree readings: for each mapped tree, the cards it may take (first = its shape as painted), its lean
// (flip: true = mirrored as painted, false = as drawn, null = free) and what is painted (the start of its `why`).
// A card list entry 'form:*' adds every other variant of that form at a higher cost.
export const P = {};
const t = (id, cards, flip, what) => { P[id] = { cards, flip, what }; };
const WF = 'willow_fan:*', WB = 'willow_burl:*', EC = 'elm_claw:*', SL = 'slender:*', ST = 'shoot_tree:*', SA = 'sapling:*';

// ---------------------------------------------------------------- S7
t('S7.tree.willow_edge_855', ['willow_weep_1'], false, "the scroll's one weeping willow: an old gnarled, knotted trunk whose bare whips hang in curtains, a long limb arching east over the gatehouse roofs; the willow_weep form drawn for it, its limb reaching east as painted");
t('S7.tree.needle_tree_1910', ['bamboo_3', 'bamboo_5', 'bamboo_2', 'bamboo_4', 'bamboo_6', 'bamboo_1'], false, "the west end of the courtyard grove (the map's 'needle-leaved'; 个 sprays on the scan, like S6's), its sprays spreading west over the roof: bamboo, a sparse clump leaning west");
t('S7.tree.needle_tree_1955', ['bamboo_6', 'bamboo_3', 'bamboo_1'], null, "one straight culm with 个 sprays between the grove and the 1910 clump: bamboo, the narrow young clump drawn for it");
t('S7.tree.bare_knobbed_905', ['elm_claw_3', 'elm_claw_1', EC], false, "bare gnarled tree, its dark speckled trunk leaning a little west, crooked limbs with knobbed crab-claw tips spreading over the street's west end: elm, wide level west limbs");
t('S7.tree.gnarled_low_edge_875', ['elm_claw_4', EC], null, "low knotted mossy trunk with crooked budded limbs along the cut edge (conf low, read as a small tree): elm, the small young one");
t('S7.tree.shoots_bottom_west_960', ['shoot_tree_2', 'shoot_tree_4', ST], null, "a dome of fine upright bare shoots rising from below the silk's edge, wider than tall, no trunk drawn: shoot tree, the coppice fan");
t('S7.tree.bare_bottom_1117', ['shoot_tree_1', 'shoot_tree_4', ST], null, "big bare tree from below the silk's edge: one straight trunk forking at once into many limbs whose fine twig tips make a broad dome: shoot tree, three or four stems (at the page's largest scale)");
t('S7.tree.twig_bush_bottom_1468', ['whip_clump_1', 'whip_clump_2'], null, "a fan of long thin unbranched shoots rising from below the silk's bottom edge: low stem clump");
t('S7.tree.twig_bush_bottom_1648', ['whip_clump_2', 'whip_clump_1'], null, "a smaller fan of bare shoots from below the edge under the 解 building's roof: low stem clump");

// ---------------------------------------------------------------- S4b
t('S4b.tree.willow_15468', ['willow_fan_1', 'willow_burl_1', WF], false, "big old bare willow forking into two leaders, a long nearly level west limb over the road to the tea house, whips fanning from the crown: willow, the great willow with a long west limb");
t('S4b.tree.willow_head_14470', ['willow_fan_4', 'willow_fan_2', WF], null, "bare whips springing from a knob in a round crown behind the tea house, trunk unseen (conf low): willow, the round crown");
t('S4b.tree.willow_head_14300', ['willow_fan_2', 'willow_fan_4', WF], null, "bare whips fanning upward above the big elm's crown, head and trunk hidden (conf low): willow, tall and upright");
t('S4b.tree.willow_head_14090', ['willow_fan_3', 'willow_fan_4', WF], null, "fine bare whips radiating upward from a knob over the big elm's fork, trunk unseen (conf low): willow");
t('S4b.tree.gnarled_13318', ['willow_fan_1', 'willow_fan_4', WF], true, "leaning knotted trunk from the crowd's back forking into two limbs that each throw a fan of fine whips, the east one spreading wide over the top-street stall: willow");
t('S4b.tree.far_bank_15308', ['willow_fan_1', 'willow_fan_2', WF], true, "faint far-bank tree at the silk's top, a thick trunk leaning north-east (conf low; a far crown): willow");
t('S4b.tree.far_bank_15230', ['willow_fan_3', WF], null, "faint far-bank tree of two short stems cut by the silk's top (conf low; a far crown): willow, twin trunks");
t('S4b.tree.forked_elm_14045', ['elm_claw_5', 'elm_claw_1', EC], false, "big bare elm whose two stems part from one root base: the west stem leans far north-west over the wheelwright's shed, the east one rises: elm, two stems from one foot");
t('S4b.tree.gnarled_13085', ['elm_claw_2', 'elm_claw_3', EC], null, "old bare tree with a thick knotted dark trunk and crooked branches hung with dark twig clumps: elm");
t('S4b.tree.elm_twin_12921', ['elm_claw_6', 'slender_1', SL], null, "tall straight bare trunk to the top of the silk, dark dotted bud clusters on its upper branches (elm-like): the tall slender elm with a small high crown");
t('S4b.tree.elm_twin_12976', ['slender_1', 'elm_claw_6', SL], null, "the eastern of a pair of tall straight bare trunks 0.7 m apart, rising to the top of the silk: slender, dead straight");
t('S4b.tree.young_tree_15275', ['shoot_tree_3', 'shoot_tree_1', ST], true, "young bare tree with upright budding twigs, its slender stem leaning and arching north-east (conf low): shoot tree, the narrow forking one");
// S4b.tree.stump_14805 is a kit model (written apart)

// ---------------------------------------------------------------- S3
t('S3.tree.willow_crown_top_15520', ['willow_fan_1', WF], null, "only the lower whips of a far-bank willow whose head is beyond the silk's top edge (conf low): willow, a far crown");
t('S3.tree.small_bare_15715', ['whip_clump_1', 'whip_clump_2'], null, "small bare bush of short forked shoots just above the hall's ridge (conf low): low stem clump");
t('S3.tree.far_willow_16582', ['willow_fan_1', WF], false, "far-bank willow, its trunk leaning west to a knobby pollard head, leafless whips fanning in every direction: willow leaning west");
t('S3.tree.far_willow_16662', ['willow_fan_3', WF], null, "second far-bank willow, its trunk leaning west near the top to a pollard head, whips fanning between its neighbours: willow");
t('S3.tree.willow_head_16010', ['willow_fan_2', 'willow_fan_4', WF], null, "a crown of long straight bare shoots fanning up from behind the hall's ridge, trunk unseen: willow");
t('S3.tree.willow_head_16130', ['willow_fan_4', 'willow_fan_2', WF], null, "a second fan of bare shoots behind the hall's ridge, under the big bare tree (conf low): willow");
t('S3.tree.shrub_16917', ['bamboo_5', 'bamboo_6'], null, "low clump of long pointed leaves or stiff stems at the walled building's foot, 0.4 m: bamboo, the low young clump");
t('S3.tree.bare_15728', ['shoot_tree_1', 'shoot_tree_3', ST], null, "medium bare tree whose leaning trunk enters the silk's bottom edge and forks into a broad crown of fine straight upward twigs: shoot tree");
t('S3.tree.bare_15805', ['shoot_tree_3', 'shoot_tree_1', ST], null, "short trunk from the silk's bottom edge splitting into two stems in a V, fine upward twigs: shoot tree, the forking one");
t('S3.tree.willow_far_17205', ['willow_fan_2', WF], false, "upright pollarded willow on the far bank, a straight slender trunk to a knobby head, whips spreading east: willow, tall and upright, its crown leaning east");
t('S3.tree.willow_far_17185', ['willow_burl_3', 'willow_burl_1', WB], false, "old pollarded willow, a thick trunk leaning north-west from the bank top to a knobby head with a wide fan of whips: burled willow leaning west, a broad fan");
t('S3.tree.bare_tree_16460', ['elm_claw_3', 'elm_claw_1', EC], false, "large bare tree with stiff crooked forking branches, its crown spreading west over the water and the hall roof: elm, wide level west limbs");
t('S3.tree.low_shoots_15995', ['shoot_tree_4', 'shoot_tree_2', ST], null, "low fan of long straight bare shoots from below the silk's bottom edge (conf low): shoot tree");
t('S3.tree.low_shoots_16145', ['shoot_tree_2', 'shoot_tree_4', ST], null, "a second low fan of bare shoots from below the edge, leaning the other way (conf low): shoot tree");
t('S3.tree.bare_tree_16520', ['willow_fan_2', WF], null, "large bare tree: a straight trunk dividing at a dark knot into long thin upright twigs, fine strands before leafing (a pollard willow): willow, tall and upright");
t('S3.tree.bare_tree_16342', ['shoot_tree_3', 'shoot_tree_1', ST], null, "bare tree at the silk's bottom edge, two leaders from one foot forking into stiff spreading twigs: shoot tree, the forking one");
t('S3.tree.stem_thicket_16410', ['whip_clump_2', 'whip_clump_1'], null, "a few thin straight stems rising from the silk's bottom edge (conf low): low stem clump");
t('S3.tree.willow_hidden_trunk_18893', ['willow_fan_1', WF], false, "willow crown of long thin whips fanning up and west from a trunk hidden behind the deck's crowd (conf low): willow reaching west");
t('S3.tree.bare_twiggy_18972', ['shoot_tree_2', 'shoot_tree_1', ST], null, "bare tree with long thin straight twigs fanning up from a short hidden trunk: shoot tree, the coppice fan");
t('S3.tree.shrub_or_heap_20025', ['leafy_1'], null, "a dark mottled lumpy mass stippled like massed leaves on the north bank (conf low, the shrub reading): the dotted-leaf evergreen shrub");

// ---------------------------------------------------------------- S2
t('S2.tree.willow_top_20552', ['willow_fan_4', 'willow_fan_2', WF], null, "old pollarded willow at the silk's top, a dark gnarled trunk to a knobbed head, bare whips radiating every way (a far crown): willow");
t('S2.tree.willow_top_20668', ['willow_fan_3', WF], null, "pollarded willow, a twisted trunk leaning north-east that forks into two knobbed heads with whips to the silk's top: willow, two stems");
t('S2.tree.bare_south_bank_20705', ['shoot_tree_2', 'shoot_tree_4', ST], null, "a fan of long thin straight bare stems rising from behind the south-bank hall's roof (conf low): shoot tree, the coppice fan");
t('S2.tree.dark_trunk_willow_20530', ['willow_burl_4', 'willow_burl_2', WB], false, "massive old pollard on the south bank, the darkest thing at the bottom: a thick gnarled knotty bole to a knobbed head, one pale limb leaning far up-west, bare shoots rising over the water: the colossal burled willow (14 m mapped), leaning west");
t('S2.tree.willow_great_21345', ['willow_burl_5', 'willow_burl_1', WB], true, "huge old pollard on the south bank: a massive knobbed hollow trunk leaning north, a heavy eastern limb whose whips sweep far out over the water to the east (15 m mapped): burled willow, the hollow bole leaning hard, mirrored so its crown sweeps east; two birds perch in it");
t('S2.tree.willow_split_22285', ['willow_burl_6', WB], false, "huge old pollard whose trunk splits into two legs like an inverted V joined in one knobbed head, whips spraying every way: the split-bole burled willow drawn for it");
t('S2.tree.willow_great_27068', ['willow_burl_7', WB], false, "huge old willow: a thick twisted trunk from the bank's foot leans far up north-west to a massive knobbed head lying almost level, whips spreading every way: the burled willow drawn for it, leaning west as painted");
t('S2.tree.shrub_or_screen_22416', ['leafy_1'], null, "a dark densely hatched mass at the house's corner, read as a dense low shrub (conf low): the dotted-leaf evergreen shrub");
t('S2.tree.shrub_mound_21605', ['whip_clump_1', 'whip_clump_2'], null, "a small branching shrub on the south mound's crest (conf low): low stem clump");
t('S2.tree.weed_clump_22665', ['whip_clump_2', 'whip_clump_1'], true, "tall weed stems arching east from a leafy mass at the house's corner: low stem clump, the tuft with arching stems");
t('S2.tree.shrub_row_22805', ['hedge_1'], false, "a continuous knee-high row of small leafy shrubs along the long house's wall foot, 2.6 m long, one entity for the strip: the hedge row drawn for it (tallest at its west end, where the weed clump stands)");
t('S2.tree.willow_top_26605', ['willow_burl_6', 'willow_fan_4', WF], null, "old pollarded willow on the far street at the top edge, a dark knobbed head on two short legs, bare whips spraying up and out: the split-bole burled willow (its two legs, as painted)");
t('S2.tree.stems_behind_top_house_27790', ['slender_6', 'slender_3', SL], null, "two straight parallel stems behind the long tiled roof, their crown above the silk (conf low): slender, two stems from one foot");
t('S2.tree.willow_27925', ['willow_fan_3', WF], null, "willow behind the long north shed, one thick trunk or two stems, fine whips over the roof at the silk's top (feet hidden): willow");
t('S2.tree.bare_28130', ['elm_claw_3', 'elm_claw_1', EC], null, "bare elm-like tree, a single twisted trunk with a wide crown of crooked branches tipped with small dark tufts: elm, the wide crown");
t('S2.tree.elm_top_28292', ['elm_claw_2', 'elm_claw_6', EC], null, "elm-like tree with a straight dark trunk by the 望火楼's stair, crooked branches spreading west and east: elm");
t('S2.tree.willow_behind_shed_28555', ['willow_fan_4', WF], null, "a second fan of straight willow whips radiating from the roof's back slope (conf low): willow");
t('S2.tree.willow_behind_shed_28612', ['willow_fan_2', WF], null, "pollarded willow behind the long thatched shed: only its knobbed head and a dense fan of straight new whips above the ridge: willow");
t('S2.tree.far_tree_28603', ['slender_1', SL], null, "a dark vertical trunk from the silk's top edge with a fork, its crown above the silk: slender, dead straight");
t('S2.tree.far_tree_28655', ['slender_2', 'slender_4', SL], null, "a second dark trunk from the top edge, a rounded dark mass at its foot: slender");
t('S2.tree.small_tree_or_post_28880', ['shoot_tree_3', ST], null, "a thick slanting dark stroke with a fork at its top (conf low; the small bare tree reading): shoot tree, the narrow forking one");

// ---------------------------------------------------------------- S1: great willows (隋堤烟柳)
t('S1.tree.willow_burl_29090', ['willow_burl_4', 'willow_burl_3', WB], false, "huge old pollard at the silk's bottom edge by the S2 seam: a massive dark knotted bole with buttress roots to a broad clubbed head, a fountain of bare whips, leaning up and west (13 m mapped): the colossal burled willow");
t('S1.tree.willow_leaning_hut_31240', ['willow_burl_5', WB], false, "great old willow leaning hard north-west: a huge low hollow bole at the hut's east end, the trunk running up-left to a pollard head, whips fanning over the hut's roof: the burled willow drawn for it");
t('S1.tree.willow_great_31620', ['willow_burl_3', 'willow_burl_2', WB], false, "great old willow, the westernmost of four: a massive pale-barked trunk with a big hollow eye, leaning north-west to a broad knobbly head, whips fanning far west: burled willow leaning west");
t('S1.tree.willow_great_31715', ['willow_burl_1', 'willow_burl_2', WB], false, "great old willow: a massive dark burled trunk leaning north-east, dividing above into two knobbly stems to a clubbed head: burled willow, the bole leaning east");
t('S1.tree.willow_great_31910', ['willow_burl_2', 'willow_burl_3', WB], null, "great old willow: a tall trunk leaning north-west, dark swollen burls in its middle, to a knobbly head: burled willow");
t('S1.tree.willow_great_burl_32065', ['willow_burl_4', 'willow_burl_5', WB], null, "the largest of the four great willows (15.7 m): a huge dark burled bole with big swollen burls, rising slightly north-west to a clubbed head with a dome of fine whips, roots spreading like rocks both ways: the colossal burled willow");
t('S1.tree.willow_burl_forked_32448', ['willow_burl_2', 'willow_burl_6', WB], null, "huge old pollard: a thick burled bole leaning west, forking into two short limbs each ending in a knobbly clubbed head with fans of whips: burled willow with clubbed heads");
t('S1.tree.willow_burl_great_32620', ['willow_burl_4', WB], false, "the largest tree of the countryside (16.9 m): a massive dark lumpy moss-dotted bole leaning west, exposed knobbly roots running east like rocks, a fountain of bare whips: the colossal burled willow drawn for it, leaning west, roots east");
t('S1.tree.willow_burl_leaning_east_32805', ['willow_burl_3', 'willow_burl_7', WB], true, "huge old pollard leaning east from a root flare, forking into knobbly heads, long bare whips sweeping far east: burled willow, mirrored so it leans east");
t('S1.tree.willow_far_31190', ['willow_burl_7', 'willow_burl_3', WB], false, "far pollarded old willow at the top of the silk, a stout trunk leaning north-west to a clubbed head, one long limb reaching far west (drawn small): burled willow leaning west");
t('S1.tree.willow_far_31245', ['willow_burl_2', WB], null, "far pollarded old willow, an upright trunk to a knobbly head with a fan of bare shoots (drawn small): burled willow, upright");
t('S1.tree.willow_far_31443', ['willow_burl_3', 'willow_burl_6', WB], null, "far pollarded old willow, a short thick trunk to a dark knobbly head, shoots fanning to the silk's top (drawn small): burled willow");
t('S1.tree.willow_far_31505', ['willow_burl_1', 'willow_burl_6', WB], true, "far pollarded old willow, nearer than its neighbour: a heavier knobbly trunk to a clubbed head throwing fans of shoots up and east (drawn small): burled willow");
// S1: willows with fans of shoots
t('S1.tree.willow_stall_a_29178', ['willow_fan_1', WF], false, "willow with a thick dark trunk leaning north-west from the ground west of the stall, forking into limbs with fans of rising bare shoots: willow leaning west");
t('S1.tree.willow_stall_b_29262', ['willow_fan_2', 'willow_fan_4', WF], null, "willow with a massive dark knotty trunk rising nearly upright at the stall's west end, limbs with fans of rising shoots: willow, tall and upright");
t('S1.tree.willow_stall_c_29300', ['willow_fan_4', 'willow_fan_3', WF], null, "willow whose trunk leans steeply north-east across the stall's open front, then turns up to fork above the thatched roof: willow");
t('S1.tree.willow_east_29845', ['willow_fan_1', 'willow_fan_4', WF], true, "willow with a knotted trunk leaning north-east from spreading roots, forking into a broad crown of fans: willow, mirrored so it leans east");
t('S1.tree.willow_twin_29970', ['willow_fan_3', WF], null, "willow with two stems from one foot, a thick one leaning east and a slender straight one, both ending in fans of rising shoots: willow, twin trunks");
t('S1.tree.willow_fan_30632', ['willow_fan_2', 'willow_fan_4', WF], null, "slender willow leaning a little east, forking at two-thirds of its height into knobbly heads with fans of straight bare shoots, the west one of a pair: willow, tall and upright");
t('S1.tree.willow_fan_30712', ['willow_fan_4', 'willow_fan_1', WF], true, "the east one of the pair: a slender trunk nearly upright to knobbly heads whose fans spread east: willow");
t('S1.tree.willow_pollard_35128', ['willow_fan_4', 'willow_fan_1', WF], null, "pollarded willow beside the threshing floor: a pale twisted trunk to a big knobbly head of several knobs, a broad fan of shoots arching over on the east side: willow, the stout low-dividing one");
t('S1.tree.far_willow_top_29290', ['willow_fan_2', WF], null, "small far tree on the terraced fields at the top: a short dark trunk with a small round crown of fine shoots (a far willow crown)");
t('S1.tree.willow_far_30500', ['willow_fan_4', WF], null, "far willow up the slope north of the chasers' bank: a dark knobbly pollard head throwing a fan of fine bare shoots in all directions, a faint short trunk (a far crown)");
t('S1.tree.far_willow_34995', ['willow_fan_3', 'willow_fan_1', 'slender_5', WF], null, "a small fan of long thin pale shoots rising north-west from behind the long farmhouse's ridge (conf low; a far willow crown, head and trunk hidden)");
t('S1.tree.far_crown_35150', ['willow_fan_2', 'willow_fan_1', 'slender_7', WF], null, "a faint rounded crown of fine shoots drawn in pale ink above the pollarded willow's fan (conf low; a farther willow crown, trunk hidden)");
t('S1.tree.far_crown_35990', ['willow_fan_2', 'willow_fan_1', WF], null, "a small far crown of fine rising shoots in a fan at the top of the silk behind the bare elms, trunk unseen (conf low)");
t('S1.tree.far_crown_36070', ['willow_fan_3', 'willow_fan_4', WF], null, "far tree behind the tall bare tree: two or three pale fans of fine rising shoots from knobbly heads, trunk hidden (conf low): willow");
t('S1.tree.far_fan_tree_36300', ['willow_fan_4', WF], null, "far tree in pale ink: fans of long fine straight pale shoots rising from a head over a faint short trunk (a far willow; the other reading pine-like)");
t('S1.tree.far_fan_tree_36465', ['willow_fan_2', WF], null, "tall far tree in pale ink behind the big bare tree: a straight pale trunk and faint wide fans of long fine straight shoots (a far willow; the other reading pine-like)");
// S1: bare elms
t('S1.tree.elm_bare_37140', ['elm_claw_3', 'elm_claw_1', EC], true, "big bare elm on the bank at the scroll's start: a thick gnarled trunk forking low into three limbs, the longest reaching far east: elm with wide level limbs, mirrored so they reach east");
t('S1.tree.elm_bare_36660', ['elm_claw_3', 'elm_claw_1', EC], false, "big old bare elm at the small bridge's east end: a thick gnarled trunk leaning north-west, a long low limb sweeping west over the charcoal train: elm, wide level west limbs");
t('S1.tree.bare_elm_tall_36070', ['elm_claw_6', EC], false, "tall bare tree at the stream's edge: a straight slender dark trunk leaning slightly east, forking near the top into a spreading crab-claw head: the tall slender elm drawn for it");
t('S1.tree.bare_elm_twin_35920', ['elm_claw_5', EC], true, "big bare elm with two stems from one gnarled foot on the stream bank: the west stem rises and arches over, the east one leans steeply north-east: the two-stemmed elm drawn for it, mirrored so the leaning stem goes east");
t('S1.tree.bare_elm_35840', ['elm_claw_1', 'elm_claw_3', EC], false, "big bare elm with one dark twisted trunk dividing at two-thirds of its height into an upright limb and long low limbs reaching far west over the grove: elm, a limb leaning west and one upright");
t('S1.tree.bare_elm_tall_34703', ['elm_claw_6', 'elm_claw_2', 'elm_claw_1', EC], null, "the tallest of the farmstead's bare elms: a straight slender trunk to a high crab-claw crown with crows' nests: the tall slender elm");
t('S1.tree.bare_elm_twin_34640', ['elm_claw_1', 'elm_claw_5', EC], false, "smaller bare elm with two stems from one foot, the west one curving up and a little west, the east one straight: elm, a limb leaning west and one upright");
t('S1.tree.bare_elm_twin_34552', ['elm_claw_5', EC], false, "bare elm with two stems from one foot: the west stem leans and curves north-west to a crown with a crow's nest, the east stem rises nearly upright: the two-stemmed elm drawn for it");
t('S1.tree.elm_34110', ['elm_claw_2', 'elm_claw_6', 'elm_claw_4', EC], null, "bare elm at the farmyard's west edge: a straight pale trunk forking high into a broad crown of crab-claw twigs (a bird in it): elm, upright");
t('S1.tree.elm_spreading_34030', ['elm_claw_3', 'elm_claw_1', EC], true, "large bare elm whose straight trunk sends two long heavy limbs east, level over the farmyard: elm with wide level limbs, mirrored so they reach east");
t('S1.tree.elm_twin_33936', ['elm_claw_5', 'elm_claw_1', 'elm_claw_3', EC], true, "bare elm with two stems from one foot: a near-vertical stem and a long stem leaning north-east across the roof: elm, two stems, mirrored so the leaning one goes east");
t('S1.tree.elm_slender_33906', ['elm_claw_6'], null, "slender bare tree rising straight to a crown spreading north-east in long crab-claw branches, a nest at the top: the tall slender elm");
t('S1.tree.elm_forked_33785', ['elm_claw_1', 'elm_claw_5', 'elm_claw_3', EC], false, "bare elm with roots spreading west and a short trunk forking low into tall stems, the west ones leaning up-left, the east one rising: elm, a limb leaning west and one upright");
t('S1.tree.elm_33592', ['elm_claw_2', 'elm_claw_4', 'elm_claw_5', EC], null, "bare elm behind the long farmhouse, its trunk drawn as two parallel lines to a rounded crown of crab-claw twigs: elm, upright");
t('S1.tree.elm_tall_33552', ['elm_claw_6', 'elm_claw_2', 'elm_claw_1', EC], null, "tall bare elm behind the long farmhouse: a straight slender trunk to a high flat crown of crab-claw clusters: the tall slender elm");
t('S1.tree.elm_forked_33433', ['elm_claw_1', 'elm_claw_3', 'elm_claw_5', EC], false, "bare elm forking into two twisting stems: the west stem bends up-left into a broad flat crown, the east stem rises north-east to a second head: elm, a limb leaning west and one upright");
t('S1.tree.far_bare_elm_33061', ['elm_claw_4', 'elm_claw_2', EC], null, "far bare elm, a straight trunk forking into two limbs with angular crab-claw twigs (drawn small): elm");
t('S1.tree.far_bare_elm_33009', ['elm_claw_2', 'elm_claw_4', EC], null, "far bare elm, a straight dark trunk to angular crab-claw branches with knobbly twig clusters (drawn small): elm");
t('S1.tree.far_bare_elm_32932', ['elm_claw_4', 'elm_claw_3', EC], null, "small far bare elm: a short dark trunk with angular crab-claw branches spreading west and east (drawn small): elm, the small young one");
t('S1.tree.far_bare_leaning_32628', ['elm_claw_3', 'elm_claw_1', EC], false, "far bare elm: a thin trunk leaning west under a flat crown of twisted horizontal branches with knotty twig clusters (drawn small): elm, wide level limbs");
t('S1.tree.far_bare_elm_32510', ['elm_claw_2', 'elm_claw_3', EC], null, "far bare elm seen above the great willows' crowns: a straight trunk carrying a spreading crown of crab-claw branches (drawn small): elm");
// S1: slender trees
const GROVE = ['slender_5', 'slender_7', 'slender_6', 'slender_3', 'slender_8', 'willow_fan_2', 'willow_fan_3', 'willow_fan_4', 'willow_fan_1'];
const grove = (id, first, what) => t(id, [...new Set([...first, ...GROVE])], null, `${what}; one of the pale grove of seven slender fan-headed trees behind the bare elms (between slender_3 and the far willow crowns, the map says)`);
grove('S1.tree.grove_fan_35485', ['slender_7'], "the broadest and palest trunk of the grove, with the largest fan of fine rising shoots (conf low)");
grove('S1.tree.grove_fan_35535', ['slender_5'], "a slender pale trunk, bare for most of its height, to a fan-shaped head of fine rising shoots");
grove('S1.tree.grove_fan_35593', ['slender_3'], "a slender pale trunk with a dark knot, its own fan head mixed with its neighbours'");
grove('S1.tree.grove_fan_35632', ['slender_6'], "several stems spreading up into a fan head of fine rising shoots");
grove('S1.tree.grove_fan_35678', ['slender_8', 'slender_5'], "the darkest trunk of the grove, with a lower fan head");
grove('S1.tree.grove_fan_35785', ['slender_7', 'willow_fan_2'], "a pale trunk widening down, its fan head behind the bare elm's limbs (conf low)");
grove('S1.tree.grove_fan_35823', ['willow_fan_3', 'slender_6'], "a pale trunk with fan heads behind the bare elms' twigs, perhaps two heads of one tree (conf low)");
t('S1.tree.slender_bare_37018', ['slender_2', SL], false, "tall slender bare tree east of the train: a thin dark trunk rising almost straight to a small crown whose limbs bend over and reach far west: slender, the long curve to the west");
t('S1.tree.elm_tall_33865', ['slender_1', 'elm_claw_6', SL], null, "the tallest tree of the farmhouse grove: a long straight slender bare trunk to a small high crown of crab-claw twigs: slender, dead straight (the slender elm card stands 0.6 m away on 33906)");
t('S1.tree.pale_trunk_34474', ['slender_7', 'slender_5', SL], null, "a tall straight trunk drawn only in pale outline, rising from behind the shrub belt, its crown lost among the elm's twigs (perhaps a willow): slender, pale-trunked");
t('S1.tree.pale_trunk_34412', ['slender_5', 'slender_1', SL], null, "a thinner pale vertical trunk line just west of the other, drawn very faint (conf low): slender, pale-trunked");
t('S1.tree.far_slender_32866', ['slender_3', 'slender_1', SL], null, "far slender bare tree: a thin straight trunk with a spray of upright forking bare branches at the top (drawn small)");
t('S1.tree.far_slender_32786', ['slender_6', SL], null, "far slender bare tree: a thin trunk with a second, thinner stem beside it, both rising to small forks of bare twigs (drawn small)");
t('S1.tree.far_slender_32753', ['slender_1', SL], null, "far slender bare tree: a thin straight trunk forking near the top into a few bare branches (drawn small)");
t('S1.tree.far_slender_faint_32717', ['slender_4', 'slender_2', SL], null, "very faint thin bare sapling in the far grove, a single stem with a small fork at the top (conf low; drawn small)");
t('S1.tree.far_twin_stem_32838', ['slender_6', 'slender_3', SL], null, "far bare tree of two thin stems from one hidden foot, each forking at the top into upright twigs (drawn small)");
t('S1.tree.far_pale_33455', ['slender_5', 'slender_7', SL], null, "a faint, pale-inked far tree behind the westernmost thatched house: a thin pale trunk and a small crown of pale twigs (conf low)");
t('S1.tree.far_pale_33720', ['slender_7', 'slender_5', SL], null, "a faint pale broad trunk with no dark outline behind the long thatched farmhouse, a few claw twigs perhaps its crown (conf low; no mapped height)");
t('S1.tree.far_tree_top_29428', ['slender_1', 'slender_4', SL], null, "far tree on the terraced fields: a tall straight dark trunk with a flared foot rising to the silk's top edge, its crown cut by the edge");
// S1: the 菜地's young trees
const SAPS = ['sapling_1', 'sapling_2', 'sapling_3', 'sapling_4', 'sapling_5', 'sapling_6', 'sapling_7'];
const sap = (id, first, what) => t(id, [...new Set([...first, ...SAPS])], null, `${what}: sapling`);
sap('S1.tree.young_bare_29558', ['sapling_1'], "a young bare tree of the 菜地's close grove of fourteen: a thin dark trunk with a small twiggy crown of crab-claw twigs, its foot under the great willow's whips");
sap('S1.tree.young_bare_29655', ['sapling_5'], "a young bare tree of the 菜地's grove, forked from the foot (a second stem joins it low)");
sap('S1.tree.young_bare_29733', ['sapling_6'], "a young bare tree of the 菜地's grove with a low crown, the west group's west end");
sap('S1.tree.young_bare_29757', [], "a young bare tree of the 菜地's grove: a thin dark trunk with a small twiggy crown");
sap('S1.tree.young_bare_29775', [], "a young bare tree of the 菜地's grove: a thin dark trunk with a small twiggy crown");
sap('S1.tree.young_bare_29795', [], "a young bare tree of the 菜地's grove: a thin dark trunk with a small twiggy crown");
sap('S1.tree.young_bare_29836', [], "a young bare tree of the 菜地's grove, the west group's east end");
sap('S1.tree.young_bare_29862', ['sapling_4'], "the tallest stem of the 菜地 grove's east group: a thin dark trunk with a small twiggy crown");
sap('S1.tree.young_bare_29882', [], "a young bare tree of the 菜地's grove: a thin dark trunk with a small twiggy crown");
sap('S1.tree.young_bare_29902', ['sapling_7'], "a young bare tree of the 菜地's grove on a thick, slightly bent stem");
sap('S1.tree.young_bare_29918', [], "a young bare tree of the 菜地's grove: a thin dark trunk with a small twiggy crown");
sap('S1.tree.young_bare_29932', [], "a young bare tree of the 菜地's grove: a thin dark trunk with a small twiggy crown");
sap('S1.tree.young_bare_29948', [], "a young bare tree at the east end of the 菜地's grove, its crown tangled with its neighbour's");
sap('S1.tree.young_bare_29968', ['sapling_3'], "the fourteenth young tree of the 菜地's grove (conf low), a thin stem beside the west traveller's head");
sap('S1.tree.sapling_far_31328', ['sapling_5', 'sapling_6'], "a small far sapling under the far willows' crowns, a short stem with a second stroke beside it (conf low; a sapling, a post or a stump)");
// S1: the rest
t('S1.tree.far_tree_top_30297', ['shoot_tree_3', ST], false, "small far tree at the top edge: a dark stem slanting up north-west with fans of fine twiggy branches spreading west, cut by the edge (conf low): shoot tree, the narrow forking one leaning west");
t('S1.tree.far_shrubs_30860', ['leafy_1'], null, "far shrubs cut by the silk's top edge, dark knotted blotches along a distant ridge (conf low): the dotted-leaf shrub at the page's smallest scale");
t('S1.tree.far_tree_30985', ['whip_clump_1'], null, "a far tree or shrub crown cut by the silk's top edge, knotted blotches on the far ridge (conf low): low stem clump");

export const KIT = { 'S4b.tree.stump_14805': "a short, thick, gnarled trunk outlined in moss dots, hooking east to a dark knob, no crown (conf low): built as a solid model in S4b's kit (kit_outer_road_2), not a card (catalogue §5)" };
