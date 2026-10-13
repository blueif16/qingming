# S4b's moorings: the boat and water pilot, for the user's review

The first river, moorings and walkable moving decks of the world (S4b, `outer_road_2`, 2026-10-12). Everything is shot
on the page (`web/world.html?sections=outer_road_2`, S4b alone; S3 isn't built, so its painted panel stands east and
the river runs on into the mist), on the real GPU, at 10:00 unless the name says another hour.

**The films** (mp4, at walking speed; the .jpg beside each is a strip of 12 frames):
- `film_cross_the_raft.mp4`: from the bank onto the arched-awning boat's bow, along its foredeck, across onto the
  laden mat-cargo boat, on onto the long boat past its two boatmen, and down onto the round-matted boat at the top of
  the raft, then standing there (third person; the north end lies in light mist past the silk's top edge).
- `film_board_big_boat.mp4`: from the bank onto the big cabin boat's side deck, aft past its cabin to the stern
  gallery and the sweep, then standing still on the moored deck while it rides the water (third person).
- `film_moorings_from_bank.mp4`: 10 s standing on the bank between the bows, looking down the channel between the
  long boat and the laden mat-cargo boat: the boats ride, the current lines drift east, the Rainbow Bridge's panel
  beyond.
- `film_from_tea_house.mp4`: 8 s from under the tea house's canopy, north-east over the bank to the big boat's stern
  and the river.
- `strip_from_tea_house.jpg`, `strip_from_road.jpg`, `strip_moorings_from_bank.jpg`: the same views as 12-frame strips
  from `tools/film_page.mjs`.

**The shots** (`shots_10h/`, one PNG each and `sheet.jpg`):
1. the moorings' bows from the bank path by the gangplank; 2. from the mooring post (the big boat's curled stem post and
ropes); 3. the channel between the bows; 4. from the tea house; 5. from the road, the big boat's side and stern;
6. the cove's north corner (the long boat's bow, the round-matted boat); 7. the raft from above the road's east end
(the big cabin boat with the man on its roof); 8. the cove from above, the north boats in the mist.

**The water at three hours:** `water_0830/`, `water_1300/`, `water_1800/` (the channel, the mooring post, the tea
house, above): one flat surface with the painted current lines drifting downstream, a pale band at the shores, a wet
ring round each hull, no reflections.

**The hulls at real size beside their painted spots:** `moorings_plan.png` (top-down: black lines are the painted
waterlines, the filled shapes the built gunwales; red dashes are S3's boats past the seam) against
`moorings_kit_default.png` (the kit's default sizes on the painted spots: ten overlapping pairs, hulls on the bank).

What to look at, and the choices behind it (`sections/outer_road_2/build_choices.json`, `notes.md`):
- **Real size, painted place:** the painter draws the moorings at the far-row scale, so the frame's cove is 13-15 m
  across where a raft of five real hulls needs about 20 m. The boats are 0.6 of their types' length (11.4-12 m; the
  painted waterlines are 6-12 m), 3.0-3.2 m in the beam, in their painted order with 0.15-0.4 m between them, each
  moved out from the bank until its bow touches it; **the far bank is moved 5.5 m north** to give the raft its width,
  so the two northern boats and the far bank stand in light mist past the silk's top edge.
- **Walkable decks:** from the bank you step onto the big boat's side deck and over the arched-awning, mat-cargo and
  long boats' bows; the rafted decks connect where they lie side by side (walks.json: 26/26); rails stand where a deck
  touches nothing; standing on a moored deck you ride it (1 cm of drift while it bobs 6-7 cm). **The mat-cargo boat's
  painted gangplank stands but can't be walked yet** (a page and kit fault, reported to the lead): its porter walks to
  its foot.
- **Moving:** all six boats are painted moored, so they ride the water in place; none travels (the boats under way are
  S3's and S2's).
