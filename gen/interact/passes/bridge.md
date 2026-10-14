# The Rainbow Bridge's left end: a way past the crowd at the south foot (2026-10-14)

The user: "the left end of the big bridge: it's hard to squeeze through and you can never get past it. There are
people there ... push some of the assets away a bit to make room for the pass-through."

## Where it was stuck, and why

The left end is the south-west ramp's foot (S3, the foot runs from its near corner (129.6, 7.9) to its far corner
(123.4, 13.4)). Down the ramp and west along the bank, or up the ramp from the west bank, there is room (1.5 m or
more). The stuck way is **east**: off the foot onto the bank under the arch (the big boat, the mat sheds, on to the S2
seam), and back.

The ramp and its skirts reach the water, so the way east goes round the near (east) railing's end, and there the
painted crowd at the south foot closes the bank from the railing to the mat sheds:
- **Round the railing's end: no way at all.** The big parasol's crowd stands against the railing (the child in red,
  the man in the dark cap and dark robe, the light-jacket man, the man under the parasol's rim, the goods stand and the
  parasol's pole), and the pack donkey `donkey_sack_18535` has its head at the railing's end.
- **The crowd's south edge: 0.79 m** between the pack donkey's rump and its driver `donkey_walker_18481`.
- **The one gap onto the bank under the arch: 1.05 m** at (134.1, 6.35), between the man in the dark cap behind the
  crowd `man_dark_cap_18812` and the long-robed man seen from behind `long_robe_back_18806` (the stout man
  `stout_man_18750` 1.17 m from the latter), reached only by a detour south of the driver, with an S-bend.

A 0.6 m capsule fits 0.79 and 1.05 m, so the old walk "from the south foot east under the arch" (14 legs) threads it,
but a player steering by hand does not. All people (figures and the donkey), not props or the bridge's geometry.

How it was found: `grid_bridge_probe.js` (capsule fit on 0.25 m cells at bank level and on the ramp, the painted
people's and animals' bodies as people.js `pushOut` has them; several rays per cell, so no air) →
`bridge_before.txt` / `bridge_before.json`; `bridge_lane.py` (the widest way between two places and what bounds it);
walks on the page (below).

## What moved

Three figures, within their groups (`gen/sections/rainbow_bridge/choices/pass.json` → `merge_choices.py` →
`sections/rainbow_bridge/build_choices.json`, each with its reason; `map_layout.mjs S3`; `make_people.py`; export):

| figure | move (dX, dD) | now | why |
|---|---|---|---|
| `man_dark_cap_18812` | +0.05, +0.30 | 133.89, 7.42 | the gap's north side; still behind the crowd under the parasol's east rim (foot est in the map) |
| `stout_man_18750` | −0.15, +0.10 | 133.02, 6.87 | the gap's south-west side; still in the middle of the parasol crowd |
| `donkey_walker_18481` | 0, −0.50 | 130.41, 4.51 | the crowd's south edge; still behind the pack donkey's rump, driving it |

Result (`bridge_after.txt` / `bridge_after.json`): one lane of **1.3 m or more** from the foot round the crowd's south
edge (west of the tall man in the dark robe 1.4 m, past the donkey's rump 1.30 m, along the stout man, through the gap
1.33 m) and north onto the bank under the arch; from the railing's end, the pocket south of it joins it (1.30 m). The
railing's end itself stays closed (opening it would move 4-5 figures and the donkey 0.6-1.5 m into the parasol crowd).
Screenshot from the lane, first person: `bridge_pass.jpg` (parasol crowd left, long-robed men right, the bank, the big
boat).

people.json: the same figures, cycles and nudges (only the file's order of `stout_man_18750` changed); seats.json and
the scene GLB unchanged (no prop or set piece moved, so no rebuild).

## Checks

- Walks, `sections/rainbow_bridge/walks.json` + 2: "the bridge pass, east" (down the ramp, round the crowd, onto the
  bank under the arch, the shore stops you) and "the bridge pass, west" (back round, up the ramp, the far railing stops
  you). Alone 44/44 PASS; the two in the joined world (default `world.html`) PASS; `walks_joined.json` (S4b) 7/7 PASS.
  They are not in `sections/world/walks.json` (lead-owned).
- Sloppy steering (the two routes with every waypoint shifted 0.18-0.25 m, 7 variants each way): eastbound, with the
  figures put back, 3 of 7 stuck in the crowd; after, 7 of 7 reach the bank (one ends 0.3 m west of its window).
  Westbound passes either way (the gap funnels you in from the bank).
- `loyalty_check S3` PASS; `ktx2.mjs check` PASS; export: scroll index max 0.55 px, GLB byte-identical.
- Regression `tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh bridge_pass`
  (`gen/expand/round2/page_qa/bridge_pass/`): world walks 211/211, boats 12/12, rides 5/5; people FAIL on the two
  known baseline spots only ("nobody went round the player" at the gate road X 7 D 3.9 and X -8 D 4.1; routines stuck
  0); contacts REPORT 807 people, 39 failing, 71 FAILs (rerun `bridge_pass_c2`: the same). Against the committed
  baseline (70) the one new FAIL is `boat_body` of `man_in_hatch_20148` on the moored south-bank boat at X 151.9:
  overlap 0.061 against 0.060 then, the boat's bob at the dump's moment; the three moved figures pass every contact
  check.
- `people_check` on S3 alone (`?window=all`, into `man_dark_cap_18812`, road spots in the lane (131.5, 5.05) and
  (133.6, 5.05) on the porter's walk): PASS, the porter goes round you, nobody stuck.
- Not run: `people_precompute` (no walker path or collider changed, so `corridors.json` stays valid).
