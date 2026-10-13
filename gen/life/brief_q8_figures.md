# Brief: the four figures of question 8 (lead 2e, 2026-10-13)

The user answered yes to the life agent's question 8 (`gen/life/progress.md`, "Questions for the user" and "The
user's answers"): the map should add four figures the writers found in the sources, so that they can speak:
1. S4b: the woman at the palm cart's curtain (名画记 27's "heart"; the first or second palm-covered family cart,
   `S4b.veh.palm_cart_13070` / `S4b.veh.palm_cart_13455`, `map/text/S4b.md`);
2. S6: the fat butcher owner (名画记 40; the butcher's shop in the inner city, `map/text/S6.md`);
3. S3: the groom inside the fence (名画记 24; `map/text/S3.md`);
4. S3: the woman at the boat window (名画记 19; a passenger boat's window, `map/text/S3.md`).

## The rule that comes first: loyalty (`map/BUILDING.md`, memory "Loyal to the painting", "Map from strokes")

A figure goes in only if the strokes show it. For each, look at the scroll scan where the source puts it (the
`scroll-section` skill: how to crop the scan at a u/v, the map's frames, `map/README.md` for the entry format). If
you can point at the figure's strokes (head, body, its outline against the curtain, fence or window), map it. If
the silk shows nothing there, or nothing you can tell from a stain, don't add it: record what you saw (crop path,
u/v) and why it stays out. Never invent one to make a line work.

## For each figure the strokes show

1. **Map it** the way the section's other figures are mapped (`map/world/<S>.json` and `map/text/<S>.md`, the ID by
   its u, foot point and facing from the strokes, the support it stands or sits on: a cart bed, a deck, a floor).
   Then `node tools/map_layout.mjs <section>` so `sections/<section>/layout.json` has it. Positions only from the map.
2. **Cast it** in `sections/<section>/people.json` with an existing character of the right kind (the `characters`
   skill; `characters/*.json`; e.g. a woman, the butcher, the groom). A new Meshy character only if nothing fits, and
   then stop and report instead of spending credits. Give it the action its figure really does (memory "Realistic
   actions": seated, leaning at a window, holding a halter), from the clips that exist (`assets/chars/clips.json`).
   A figure seen only from the waist up in a window or behind a curtain is placed and posed so that the rest is
   hidden by what the painting hides it with.
3. **Give it its lines**: the life layer's format in `sections/<section>/talk.json` (a near press-E scene and/or a
   chatter line, Chinese with `_en` glosses, consistent with what the writers proposed in gen/life). Then
   `node tools/ui_data.mjs build` and `check`. New glyphs need the talk fonts regenerated (`tools/font_subset.py`;
   another session regenerated the ui fonts today, so regenerate from the current state, don't revert theirs).

## Checks (all must pass, numbers in your notes)

- `node tools/loyalty_check.mjs <section>` PASS;
- `tools/chrome_slot.sh node tools/people_dump.mjs` then `node tools/contact_check.mjs <section>`: no new FAIL
  (today's baseline: 39 figures failing over all eight sections; the per-section counts are in
  `gen/details/progress.md`, "Final state");
- `node tools/cast_clips_check.mjs` PASS;
- `tools/chrome_slot.sh node gen/life/life_check.mjs` on the section's views, and `gen/life/off_check.mjs` PASS;
- `tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh q8 world people`: world 210-211 of 211 (the one
  miss is a known S2/S4b boat-walk flake), people only the two known gate stands.

## How to work

- The check server is 5190 (`tools/check_server.sh`), one Chrome slot at a time (`tools/chrome_slot.sh`). Never
  `pkill -f` with a pattern that appears in your own command line (it kills your shell).
- Another session (3d-director-f1) is working in `web/src/` (world.js, people.js, film.js, the HUD). Don't edit
  `web/src/`; data files only (map/, sections/, characters/ if needed, gen/life/). Character builds and KTX2 run under
  `flock /tmp/qingming_charbuild.lock`.
- Record as you go in `gen/life/q8_figures.md`: per figure, the crop you looked at, the decision, the map entry, the
  cast, the lines, the checks, and the next command.
- No deploy and no git commit: the lead does both. End with a short report: per figure mapped or not (and why), the
  files you changed (every path), and the check results.
