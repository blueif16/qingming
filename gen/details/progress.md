# Details pass: progress (lead: session 3d-director-2e)

2026-10-13
- Plan: plan.md. The user: "use mathematical ways", and the screenshots are examples only, so check every figure
  and every character.
- Agents started, each with a brief file:
  - contacts: measurement only (owners geometry, joint tracks, placements dump, rules, contact_check) over all
    eight sections; brief_contacts.md;
  - eyes: eye_check over all 34 characters, then the texture fix for the FAILs; brief_eyes.md;
  - children: real child models posed by IK as the four carried-child props, plus carry_check;
    brief_children.md.
- Shared: character builds and KTX2 run under `flock /tmp/qingming_charbuild.lock`.
- Performance batch 2 (session 3d-director-04) agreed the order: our character rebuilds first, its crowd LOD and
  per-clip files on top. Deploys go through that session.
- Next, after the contacts measurement: a pilot fix on S4 (solver, object fit, IK clip variants, the missing stool),
  then one fixer per section.
- Added at the user's request: the life agent (brief_life.md). It covers chatter that starts by itself, more and
  deeper press-E talks, plot lines across scenes (inked into the 圖志 journal), and intent marks if time allows. All
  eight sections, pilot first. It owns web/src/ui/ and sections/*/talk.json; tiny engine hooks only, announced to
  3d-director-04.
- Added: the sky agent, a quick hunt for the 'weird symbol in the sky' (no screenshot from the user). It shoots the sky at several views, hours and tiers, finds the object, proves it by hiding it, and fixes it if small; notes in gen/details/sky/.
- Session 3d-director-da added a Start screen (web/src/ui/start.js; it skips on ?start=0, webdriver or HeadlessChrome),
  so every agent loads world.html with start=0. qingming is now its own git repo (github blueif16/qingming), and its
  skills live in qingming/.claude/.
- The bilingual split agreed with da:
  - the life agent writes `_en` siblings on every talk.json line, and talk.js renders them behind the pref
    (`prefs.lang` 'zh' | 'zh_en' unless da names another);
  - da owns the pref and settings, places.json, place and map names, and journal.js (the life agent asks da before
    adding plot-line entries there).
- Added at the user's request:
  - the trees agent (brief_trees.md): true 3D trees, with Meshy trunks, painted leaf-clump crowns, willow ribbons,
    wind and the card as the far LOD; pilot one form, then all 12;
  - the ambient agent (brief_ambient.md): sparse ambient life not in the scroll (birds, catkins and leaves, banners,
    smoke), placed from map data and cut by tier.
  Both share one wind (web/src/wind.js). The user's exception is recorded in map/BUILDING.md ("Ambient life",
  "Trees in 3D") and in memory. The perf lead (3d-director-04) has been told.
- Running now: contacts, eyes, children, life, sky, trees, ambient (seven agents).
- Perf lead's order for trees and ambient:
  - build in their own modules now; the world.js hooks land after the 256 px cards and the two-layer shadows (perf
    messages);
  - trees cast into the cached static shadow layer at rest pose (no wind in the depth material);
  - ambient casts no shadows;
  - section GLBs are being re-cut into ~10 m BatchedMesh cells: nobody relies on node or mesh names;
  - S4b+S3+S2 sit at 198/200 MB of GPU, so 3D trees there need room first or stay as cards on the light tier.
- The user asked that every detail fit the auto-tuner. Contract in tier_contract.md, proposed to 3d-director-04 (a detail block per tier, applyTier, a registry, GPU-only animation).
- **Sky symbol, done.**
  - What the user saw: the mist effect drawn onto the sky. Looking up, sky pixels (depth 1) project to 300 m
    along the view, landing inside the backdrop ring's mist ellipse, so a pale lens with a blue hole appeared in
    every section, at every hour and on every tier.
  - The fix: one line in `web/src/post.js` (no mist at depth 1), accepted by 3d-director-04. It ships with the next
    deploy.
  - Proof: `gen/details/sky/before_after_*.jpg`; the same-load diff shows 0% change on ground frames.
  - Side finding, not fixed: hairline cracks in the countryside ground near the farmsteads, where the sky shows
    through.
- **Eyes: 17 of 20 dot-eyed characters fixed and verified** (`tools/eye_check.mjs`; a pass needs lid reach ≥ 6.8 mm,
  margin ×2.36, and width ≥ 17.2 mm, margin ×1.40).
  - Fixed: boatman, butcher, camel_driver, carter, child, child_red, child_robed, fortune_teller, grain_porter, idler,
    inspector, monk, official, official_rider, porter, robed_man, sightseer.
  - Each has `"eyes": {"from": "bearer"|"youth"}` in its character file; only texture pixels changed (glb_diff);
    KTX2 check PASS.
  - The lead looked at the zoomed pairs: almond, lidded eyes replace the dots.
  - Left for the eyes agent's follow-up: scholar, hat_traveller, hat_traveller_dark (UV islands too small, so the eye
    area gets re-UV'd into its own patch), and hat_traveller_dark's recolour nose blotch.
  - For the user: the character prompts literally ask for "dark dot eyes".
- **Eyes, round 2: all 34 characters PASS.**
  - scholar: re-UV'd into one face-front island (66×71 texels). The whole face is now clean, where before it was
    smeared across slivers; no seam was added; only UVs and texture pixels changed.
  - hat_traveller and hat_traveller_dark: no room for an island, so the eye sits 12 mm lower on whole cheek islands.
  - hat_traveller_dark's nose blotch is gone: a new recolour `spare` mask, 0 face texels, hat texels unchanged.
  - KTX2 PASS for every character texture; trees3d/bark.webp is the trees agent's to encode.
  - All 29 character prompts say "dark dot eyes" (not edited; the user's call).
- **fix-S4 done.**
  - S4 failing figures: 28 → 1. That one is a cross-seam table, now with fix-s4b.
  - All sections: 343 → 247 failing figures, 694 → 483 FAILs. Most of the drop came from engine P1 (soles) and P2
    (root_h), both landed by 3d-director-04; P3 was reverted, and the bridge was fixed in data instead.
  - Tools: contact_solve, ik_clip (+ `ik:` clip sources), ik_targets, clip_ground, contact_fixes.py and
    sections/<s>/contact_fixes.json.
  - The standard: contacts/fix_standard.md. Stills: contacts/fix_s4/stills/before_after.jpg (the lead looked: the
    fortune teller seated at his table, bearers under the poles, palms on the ox).
- **Rollout started** (brief_contacts_rollout.md): fix-gate (gate + city_end; song_kit hall floor first), fix-inner
  (S6; the leg-IK op first), fix-bridge (S3), fix-river (S2 + S1), fix-s4b (S4b + the S4 child), fix-boats (cover
  and fix the 116 crews). Shared files only under the charbuild flock.
- **Deploy guard (lead).**
  - characters.json had dropped 7 IK variants that the shipped S4 people.json used (a stale key at 02:43). I
    rebuilt bearer, fortune_teller, robed_man and hat_traveller under the flock: registry fixed, clip_ground,
    joint_tracks and KTX2 done.
  - New `tools/cast_clips_check.mjs`: shipped PASS; the sources have 6 missing, still in flight with fix-river and
    fix-bridge. Asked 04 to add it to the pre-deploy regression.
- **Flips for batch 2's deploy:** ambient off (?ambient=1) and talk off (?talk=1), both proven. The shipped child
  props pass (idler, woman, woman_pale; townsman and the arms child are still the old primitive). trees3d pending.
- **clip_meta incident (03:45–04:20):** sole_m diverged to −18 m through repeated clip_ground runs on stale tracks.
  It was repaired, and the lead made clip_ground idempotent (sole_m_tracked) and found the shared-hips-array root
  cause (now with fix-inner). Nothing shipped in that window (04 confirmed). Whitelist: the two knees_up values.
- **Children done (2 of 4):** child_on_back (idler) and child_on_lap (woman, woman_pale) are now real child models
  that pass carry_check. child_in_arms and child_on_shoulders keep the old primitive: their clips make contact
  impossible without IK variants pinned in a bone frame (proposal in gen/details/children/notes.md).
- **Life done:** 64 press-E scenes, 148 chatter groups, 89 barks, 30 plot-line steps in 8 plot lines, `_en`
  everywhere, behind ?talk=1. All checks pass, and the phone cost is about 0.2 ms per frame. Nine questions for the
  user are in gen/life/progress.md.
- **Usage-limit stop, about 04:30–04:50:** all eight running agents stopped mid-step. At 06:01 the lead found no
  stuck locks or processes. A cut-off rebuild had dropped the idler and scholar IK variants from characters.json:
  the lead rebuilt both, and cast_clips_check, ktx2 and clip_meta are clean. Budget: all PASS, but rainbow_bridge is
  at 27.19 / 28 MB and canal at 26.18 (IK variants are full clip copies), so fixers now prefer shared specs; asked
  04 about per-clip files. All eight resumed with resume_0600.md.
- **fix-inner landed three things:**
  - shared hips arrays are fixed (each variant's hips is signed; the build fails on sharing);
  - the build can no longer silently drop a variant (the registry lists what the GLB holds; stale local clips are
    remade or the build fails);
  - the elbow-op bug is fixed (the forearm had turned 163°; canal sightseer lean_chin~man_at_railing_27650 rebuilt).
  It also added the bone-frame IK op for the children. The lead rebuilt child_red and hat_traveller_dark: registry
  equals GLB, cast_clips_check PASS, hat_traveller_dark's eyes still PASS. The children agent resumed for
  child_in_arms and child_on_shoulders.
- 04 at 06:30: the crown drop was world.js's teleport overlap (fixed), so fix-bridge was cleared to export; cells
  are opt-in, with no re-cut this batch; per-clip files come after the deploy, so a hard cap per section holds
  (budget_check PASS); gate, city_end, canal and countryside are exported and ship with this deploy.
- **fix-gate done:** gate failing figures 35 → 1, city_end 4 → 0; both exported (owners MATCH), loyalty PASS,
  regression world 211/211.
  - Left: gate tree_leaner_7952 needs a tree-trunk target in contact_check and a map decision on the willow's
    estimated base. Owner: lead.
  - Lessons passed to all fixers: the staff_foot spec, the edge trap, the locomotion trap (fix-inner fixing it at
    the source).
- **Trees done, behind ?trees=3d:** all 223 mapped trees plus the stump are 3D.
  - Method: Meshy trunks for the gnarled forms, tube wood for the thin forms, painted clump crowns from a 32-cell
    atlas, vertex wind via wind.js, the card dither-fading over 6 m as the far level, one BatchedMesh draw per pass.
  - Credits: 345 (225 left on msy_VYNl).
  - Performance: phone-proxy low within noise (the crown 38 → 47 fps, the gate 26.7 → 28.7); only mid at the grain
    wharf drops 17%, beyond the ±30% noise. GPU at the crown on high 200.6 → 205.1 MB.
  - The off path is identical (draws and triangles equal). The GL warning was not reproduced, with 0 deleted-program
    queries.
  - Lead's look (final_h10 sheet): gnarled trunks now read as real 3D (holes, roots, volume), a big gain. Pines are
    fuller and bluer and less like the painting's layered cloud pine (the agent lists this as polish).
  - Before turning it on by default:
    - the user's sign-off;
    - trunk colliders sized from trees3d.json (big boles are 0.8–1.8 m in radius against 0.35 m colliders, so you
      can walk into their edges);
    - the CLAUDE.md Foliage line.
  - Polish: a low-tier wood LOD, pine colour, KTX2 for the 256 px cards.
- **Deployed by 04 (06:3x), https://qingming-delta.vercel.app.**
  - Live: the sky fix; the eyes (34/34); the S4, S5, S7, S2 and S1 contact fixes and exports; the bridge's root_h;
    engine P1, P2, P4 and E1 plus walk-beside; the passing child props; the characters and clip_meta.
  - Off by default: ?trees=3d, ?ambient=1, ?talk=1.
  - Held-tree checks: world 210/211 (an S2 flake), low 211/211, boats 12/12, cast clips, ktx2 and the sole_m guard
    all PASS.
  - The lead released the hold; boats exports are now open. Next with 04: the per-clip animation file format.
- 04 started two batch-2 agents on top of our casts: per-clip animation files (layout to be forwarded before it lands) and an index-only far LOD for people. Both are briefed with our five terms. The lead flagged the multi-bone child props and the scholar's re-UV for the LOD.
- **Ambient done, behind ?ambient=1:** all eight sections, placed from the map.
  - Content: crows, pigeons, swallows, egrets, sparrows that flush, catkins and seeds, smoke and steam over painted
    kitchens, cloth sway, dusk bats, butterflies.
  - Cost: 0 credits, all in shaders. Phone-proxy low: +2 draws, about +0.4 ms CPU, fps −0.6 to −2.7%; regression as
    baseline.
  - Films: gen/details/ambient/final/ (index.txt). Ideas left: boat awning sway, fish rings, cart dust, roof-ridge
    sparrows, moths. Flipping it on by default, and an Ambient settings row (via da), wait for the user's sign-off.
- **fix-inner's ik_clip fixes landed** (it is rebuilding every variant):
  - poseAt evaluates tracks directly;
  - a post-build verify fails any op that misses its target by more than 1 cm;
  - walking variants inherit locomotion;
  - knee and elbow poles carry the offset (bearer knees 49° → 5°; an elbow flip of 95–150° fixed);
  - a new `fade` option.
  The lead landed its contact_check diff (root_h figures are judged by their contacts). Prediction: outer_road
  0 failing, inner_city 13 (mid-rebuild).
- **fix-river done:** canal 41 → 2 failing, countryside 8 → 1 (non-crew). Both exported and live with batch 2.
  - Left: canal man_leaning_over_donkey_29000 (the donkey at real size is far taller than painted, so no bench
    reaches; needs the user's call on scale or a new take); countryside charcoal_driver_36250 (a turn-round instant,
    optional engine E1c for 04); canal shop_man_dark_cap_23963, which the lead has now fixed.
- **Second sole_m divergence, lead-fixed:** three variants' hips key counts changed in fix-inner's rebuild, so the
  page ignored their stale clip_meta entries while clip_ground kept adding. fix-inner's isStale guard plus the
  lead's joint_tracks v7 `meta_stale` now cover it; reconverged, 0 clips off by more than 5 mm.
- **fix-inner rebuilt every variant with the fixed ik_clip** (verify ≤ 2 mm; moved list: contacts/fix_inner/moved_variants.md). The lead re-predicted the finished sections: gate 1 (the tree leaner), city_end 0, outer_road 0, countryside 1, canal unchanged, so no regression. s4b, bridge and boats were told to re-check their moved variants.
- **Children done (4/4 pass carry_check, 6/6 strict and --page).** child_in_arms and child_on_shoulders use the shared variants hold_child~child and carry_child~child. Shipping dependency: outer_road people.json goes with fix-s4b's S4b export and inner_city's with fix-inner's export; 04 waits for the lead's 'ready' before the next deploy.
- Per-clip files (04's clips agent): full chars/<name>.glb unchanged; derived body/<name>.glb + clips/<name>/<clip>.glb + clips.json; stale split falls back to full GLB; cast_clips_check FAILs stale. Lead chose (b): clip_split at end of character.mjs build (in flock), char_lod must re-split, budget_check to count real downloads, atomic writes. Cast download e.g. rainbow_bridge 15.2→8.7 MB.
- fix-s4b shipped: outer_road_2 exported (owners MATCH) and outer_road people.json shipped (includes children's person_with_child). Fresh dump: outer_road 0/64 failing, outer_road_2 2/66 (wheelwright_bending_13620 needs a new take or raised wheel — user's call; seated_boatman_stern is fix-boats'). Ready-gate: outer_road side done; waiting on inner_city.
- **READY sent to 04 (06:47).** The carriers' sections are in, with outer_road and inner_city people.json shipped.
  - cast_clips_check PASS; carry_check --play 6/6 PASS.
  - Fresh page dump plus contact_check all: **55 of 807 failing (from 343)**: city_end 0, outer_road 0, inner_city 1,
    gate 1, countryside 1, outer_road_2 2, canal 15 (mostly crews), rainbow_bridge 35 (fix-bridge and fix-boats still
    working).
- Correction: fix-boats DID export (4 boats GLBs and 3 people.json at 06:44–06:45, included in the 06:46 dump). Fresh dump at ~06:50: **54 of 807 failing**: city_end 0, inner_city 0 (fix-inner shipped, from 63), outer_road 0, gate 1, countryside 1, outer_road_2 2, canal 15, rainbow_bridge 35. 04's next deploy waits for its clips and crowd agents, then a hold.
- **fix-s4b done:** S4b 26 → 1 (the wheelwright, which needs a new take or a raised wheel: user's call) plus 1 crew (fix-boats); S4 1 → 0. Exported, loyalty PASS, regression OK. Lessons in contacts/fix_s4b/notes.md.
- **The per-clip split has landed (04),** with the lead's conditions met. budget_check now counts real downloads: rainbow_bridge 27.86 → 21.75 MB, canal 26.77 → 20.54, others 8.6–15.8. The IK-variant cap pressure is gone; bridge and boats were told.
- **fix-inner done:** inner_city 63 → 0 failing (178 people). The ik_clip, character.mjs and clip_ground hardening
  is listed in contacts/fix_inner/notes.md. Its regression found 2 world walks failing since about 06:45 (S2 boarding
  the hooded-bow cargo boat; S3 north edge), probably fix-boats' 06:44 boats exports. Routed to fix-boats (urgent:
  bisect and fix) and fix-bridge (hold its S3 export while the walk fails). The next deploy waits on clean walks.
- Walk regressions diagnosed: (1) S2 cargo-boat boarding: the hatch covers are now walkable (the painted geometry); fix-boats widened the walk's expect D with a why, accepted by the lead. (2) S3 north edge: fix-bridge's cart_puller_19870 move onto the walk line went live early via fix-boats' whole-file people.json copy; routed to fix-bridge (urgent). New rule: a ship copies only your own entries.
- fix-bridge fixed the S3 north-edge walk (cart puller solved clear of the line with steer~cart_puller_19870) and exported rainbow_bridge (owners MATCH, loyalty PASS). New: the S3 shore walk at the S4b seam ends 0.1 m past bound since its export; routed back to fix-bridge to bisect. The S2 walk was accepted with a widened expect.
- S3 shore walk (S4b seam): the lead found a deterministic FAIL that doesn't depend on split clips, boats or tier; the capsule is fixed and sections.json is unchanged. Suspect a person pushing (S3 people.json 07:01); fix-bridge is testing with push-out off.
- S3 shore walk: fix-bridge proved no person and no section geometry is involved; the cause is S4b's moored boat_big_cabin_14928 colliders changed in fix-boats' 06:44 boats export. Routed to fix-boats (urgent): decide by the painting whether to adjust the walk or fix the kit, then confirm 211/211.
- **Walks clean: 211/211** (fix_boats_w2). S3 shore at the S4b seam: expect X widened 92.3 → 92.5 with a why (the walker ends against the moored boat's stern, which is painted there; slide direction depends on load order). Boats kept, not reverted. contacts: 41 of 807 failing. cast_clips PASS. 04 told the tree is ready for its hold.
- **fix-boats done:** crews 97 → 42 failing (251 → 79 FAILs); every remaining one has a reason and owner (contacts/fix_boats/remaining_after2.txt). Boats exports for 4 sections (MATCH); crew coverage tooling built; fix_standard.md updated. Running now: fix-bridge only.

## Final state of the details pass (lead, 2026-10-13 ~07:30)

Measured on a fresh page dump of all 897 people, 07:28:
- **Contacts:** 807 people checked (the 116 boat crews included), **39 failing**, down from 343 at the first
  measurement (03:06):
  | section | failing |
  |---|---|
  | city_end, inner_city, outer_road | 0 each |
  | gate, outer_road_2, countryside | 1 each |
  | rainbow_bridge | 21 (17 crews) |
  | canal | 15 (crews mostly) |

  Each remaining figure is listed with its reason and owner in contacts/fix_*/notes.md.
- **Eyes:** 34/34 PASS (townsman is a borderline PASS~: left eye reach 5.5 mm, as at the first measurement).
- **Carried children:** 4/4 real child models; carry_check --play 6/6 PASS.
- cast_clips_check PASS (the split is current for 34); ktx2 PASS; world walks 211/211, boats 12/12, rides 5/5.
- Live since 06:3x: sky, eyes, S4/S5/S7/S2/S1 contacts, engine P1/P2/P4/E1, the back and lap children. The rest
  (inner_city, S4b, S3, boats, the arm and shoulder children) ships with 04's next deploy, after its round 2, under a
  hold.
- Off by default, waiting for the user: ?trees=3d, ?ambient=1, ?talk=1.
- **For the user:**
  - sign-off on trees, ambient and talk (and the life agent's 9 questions in gen/life/progress.md);
  - the "dark dot eyes" wording in 29 character prompts;
  - painting-vs-real-size calls:
    - canal man_leaning_over_donkey_29000;
    - S4b wheelwright_bending_13620 (a new take, about 10 credits, or raise the wheel);
    - S3 donkey_man_west_18728 (a recorded move);
    - S3 far_bank_figure_16722 (figure or post?);
    - gate tree_leaner_7952 (needs a trunk target and a decision on the willow's base).
- **Technical follow-ups:**
  - trees3d trunk colliders (needed before turning trees on);
  - an ik_clip steady-hips op on walking clips (cart_puller, barrow_pusher);
  - 42 crew items, including new fend-pole takes, the mast fall rope, hold-awning hatches, and the tow line end
    (04's E-item);
  - the countryside charcoal driver at the turn (E1c);
  - ambient ideas (boat awning sway, fish rings);
  - trees polish (pine colour, a low-tier wood LOD, KTX2 for the 256 px cards).
- 07:35: 04's crowd LOD landed (07:11); the lead's post-LOD checks pass (eyes 34/34, carry 6/6, cast clips, ktx2). The S2 back-ashore walk ended exactly at its D bound (20.0) after the hatch change; the lead widened it to 20.4 with a why (both walks.json); it passes. All details agents finished; the tree is ready for 04's hold and deploy.
- **Deployed by 04 (07:4x):** everything of the details pass up to the hold is live (inner_city, S4b, S3, boats and crews, the arm and shoulder children, the walk fixes), plus 04's per-clip files and far LOD. Held-tree checks: world 211/211 at default and low, boats 12/12, rides 5/5, cast clips, char_lod, clip_split, ktx2, sole_m guard and budget PASS. The lead released the lock.

## Sign-off: trees, ambient and talk on by default (lead 2e, 2026-10-13 ~10:00)

The user: "we can just say yes and default to all them and now just do the fix and turn everything on" (the life
agent's nine questions answered yes, recorded in gen/life/progress.md), and, mid-round, "pre loading some of the
assets at the start screen ... then we can continue with the progressive loadings". 3d-director-04 and -da had exited,
so 2e ran the checks and the deploy.
- **On by default:** trees3d.js `TREES3D_ON` (off: `?trees=cards`), ambient.js (off: `?ambient=0`), ui/index.js +
  ui/settings_screen.js life (off: `?talk=0`; `gen/life/off_check.mjs` now checks `?talk=0`). CLAUDE.md "Foliage",
  map/BUILDING.md "Trees in 3D" and the web-scene skill updated.
- **Trunk colliders:** trees3d.js `trunkColliders` (placement shared with the batch via `treeMatrix`), built in
  world.js `placeTrees` as `sec.trunks` (one BVH a section, in `rebuildCollider`'s list, disposed in `removeTrees`).
  One open 10-sided tube per bole wider than 0.45 m (wider than any builder cylinder; 48 trees), from 0.6 m under the
  foot to 2.6 m above; shrubs (leafy, whip_clump, hedge) and thin trunks keep the builders' cylinders. No caps: a cap
  stood a figure by a tree on a higher bank on it (people.js grounding casts through player.bvh; contacts 39 -> 40,
  back after the caps went). Applies with `?trees=cards` too (the card paints the same bole).
- **Walks re-routed round the boles** (7 in sections/world/walks.json, the same in sections/countryside and canal
  walks.json, each with a why): S1 road W->E 3 / E->W 3 / W->E 4 (the road's turn moved to (312.4, 0.3), south-east
  of the great burled willow's bole), the S1 dyke-top pair (now "the bole stops you": three great willows' boles fill
  the dyke's top between X 305 and 311), S2's south-bank shore wall (X 168 -> 173: the great willow's bole reaches the
  water and the bank group stands west of it), S2's north bank E->W (first leg under willow_split's bole). Tools:
  gen/details/trees/collider_walks/ (boles.mjs, heights.mjs, near.mjs, trace.mjs, people_in_boles.mjs, try1-3).
- **Found, not fixed:** canal figure_under_eave_20625 stands inside dark_trunk_willow_20530's drawn bole (1.38 m from
  its centre, r 1.53), a 3D-trees overlap independent of the colliders (people_in_boles.mjs). The map places both;
  a recorded move or the willow's variant is the call.
- **Start-screen preload** (world.js start block, ui/start.js): the small JSONs, your section (fetch, parse, its
  shaders compiled via addSection), your character and then the section's cast load behind the start screen; the
  press finds them in. The frames (warmUp), the paper and the stream of the rest of the window wait for the press, so
  the order after it is as before; the paper lifts no sooner than the band's 1.8 s glide. Headless tools skip the
  screen, so their order is unchanged. Check: gen/perf/start_preload/preload_check.mjs (a phone UA, CPU 4x, fast 4G,
  cold: press at once vs after reading 12 s).
- **Preload measured** (gen/perf/start_preload/fast4g.json; the deployed build served locally, a phone's UA and
  viewport, CPU 4x, fast 4G, cold cache, 2 reps): pressing as soon as the press takes, walking 8.5 / 9.2 s after it
  (1.8 MB in before the press); after 12 s on the start screen, 2.7 / 2.8 s (11.6 MB already in; 1.8 s of it is the
  band's glide, the floor the page keeps). With trees, ambient and talk on, 15 MB at walking.
- **Found, not ours:** the 入畫 button is in world.html's markup before the script that answers it has loaded, so an
  early tap on a slow link does nothing (the check needed 5-6 tries over ~1.5 s). A fix: an inline flag set by an
  early click that waitForStart honours, or the button disabled until start.js attaches. Owner: the start screen's
  session (da, now f1's area).
- **Deployed 2026-10-13 ~10:33** by 2e (tools/deploy_web.sh: check PASS), with f1's 鳥瞰 (its "ship it"); f1's film
  tool (film.js, after 10:35) is not in it. Live check: trees3d 1 draw / 38 near, ambient 129 birds, talk life on,
  trunk BVHs built, __test.birdseye, no page errors. Final regression on the tree that shipped: world 210/211 at
  default and at low (the one miss differs run to run: the S2 / S4b boat walks, a flake class since 10-12 night),
  boats 12/12, rides 5/5, contacts 39 (the baseline), people the two known gate stands.
- **Thin margins to watch:** S2's trackers' bank walks (W->E ends X 169.2 against 169.0; E->W 150.2 against 150.4):
  the tow-line trackers (tracker_rear_22172 at 168.0, 23.0) stand between the split willow's bole and the water, and
  they move with their boat, so the strip is open or not by the clock.

## After the deploy (2e, 2026-10-13 ~10:50; the user: "yes, do it")

- **Early tap fixed** (web/world.html: an inline script after the 入畫 button keeps a tap made before the scripts load
  and shows the button pressed, `.ld-early`; ui/start.js takes it as the press once waitForStart is set up). Check:
  `gen/perf/start_preload/press_debug.mjs <url> 0 --phone --net --cpu --cold` (one DOM click right away): entered,
  walking at 10 s; before, that tap did nothing. The timing check (preload_check.mjs) now presses until it takes.
- **The four question-8 figures:** an agent, brief `gen/life/brief_q8_figures.md`, record `gen/life/q8_figures.md`
  (verify in the strokes first; map, cast and voice only what is painted).
- **Commit:** everything of today but f1's (鳥瞰, film: its files and hunks, the list it sent), built in a temporary
  index.
