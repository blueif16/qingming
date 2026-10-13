# Brief: the workshop: animals, vehicles and new characters for the joined world

You are the workshop agent for the 清明上河图 web world (`/home/ran/3d_director/qingming`), a first-person walkable
reconstruction of the scroll. Two area agents are mapping the areas east (S4, `sections/outer_road`) and west (S6,
`sections/inner_city`) of the finished gate scene (S5, `sections/gate`); the lead joins the three. You make the
things all three need and nobody has made yet: **the painted animals, the painted vehicles, and new characters.**

The user, today: "pls do create our new assets, I don't care about meshy credits, I want high quality work"; and
"keep in mind with all the lessons learnt from Messenger: as our game got bigger we need to mind the sizings and do
optimizations for both quality and sizing". The quality bar is Messenger (messenger.abeto.co): its creatures and
people are about 1.5–4k triangles, one shared skeleton per body type, colours from one palette, outlines where
surfaces split, one signature activity per character. Loyalty (`map/BUILDING.md`): each model is a painted thing,
built the way it is painted (its tack, its load, its harness).

## Read first

- `qingming/CLAUDE.md`, `qingming/README.md`, `map/BUILDING.md` (read the rows for animals and vehicles and the
  "Animals" paragraph: they were set today), `map/README.md` (points of animals and vehicles: fore, hind, head;
  front, rear, wheels);
- the skills in `/home/ran/3d_director/.claude/skills/`: `characters` (the character pipeline: you mirror it for
  animals), `web-scene` (the kit and the headless build);
- `characters/notes.md` (what Meshy gave, what the clip audit found: no carry clips without loads, read every clip's
  frame sheet before use);
- `blender/song_kit.py` (the construction kit: chamfered beams, soft pieces, the material table; vehicles are built
  from it), `reference/messenger_study/world_notes.md` (construction rules; study only, never copy);
- `map/text/S5.md` (the gate's 12 animals, 2 vehicles and 4 riders, in words) and `reference/scroll/sections.md` §2
  (what S4 and S6 paint).

## What you own (edit only these)

- **Animals:** `animals/` (one `animals/<type>.json` per animal type, like `characters/<name>.json`, plus
  `animals/notes.md`), `tools/animal.mjs` (the pipeline: compose the existing atomic scripts, as `character.mjs`
  does), `blender/rig_quadruped.py`, `prompts/animal_*.txt`, `gen/animals/`, `web/public/assets/animals/` (the
  GLBs and `animals.json`, the registry the page reads);
- **Vehicles:** `blender/kit_vehicles.py` (generic functions from song_kit primitives; the lead moves them into
  `song_kit.py` afterwards), `gen/vehicles/` (review renders);
- **Characters:** this session you run the character pipeline for everyone: `characters/` (new characters,
  `motions.json`, `notes.md`), `prompts/char_*.txt`, `prompts/motion_*.txt`, `gen/characters/`, `gen/motions/`,
  `web/public/assets/chars/` (GLBs and `characters.json`), and the character tools (`tools/character.mjs`,
  `tools/char_pipeline.py`, `tools/build_character.mjs`) if they need a change;
- **Review page:** `web/creatures.html` + `web/src/creatures.js` (yours, like `chars.html`; the dev server serves
  any page in `web/`).

Everything else belongs to the lead (`song_kit.py`, `street_b1.py`, the section builders, the page modules,
`people.js`, the other tools, the map) or to the area agents. If you need a change there, write the request in your
report.

## How the scenes will use your work (the formats; the lead implements the page side)

- **Vehicles** are built by each section's builder (Blender), inside `sb.entity(<vehicle map id>)`, by calling your
  kit: e.g. `kit_vehicles.covered_ox_cart(front=(X, D), rear=(X, D), wheels=[(X, D), ...], team=[(X, D, facing), ...])`.
  Positions always come from the caller (the map), sizes the strokes can't give are `choice:` in your code. A
  vehicle's harness (yoke, collar, traces, shafts) is part of the vehicle and reaches to its team's painted spots.
  Static: carts stand where they are painted.
- **Animals** are rigged GLBs placed by the page from `people.json`:
  `"animals": {"<slug>": {"model": "donkey", "do": [["idle", 10]], "load": "pack_saddle"}}`, at the map position
  (between fore and hind hooves), facing from hind to fore, scaled to the map's `length_m` within reason. Their clips
  must be named `idle`, `walk` (in place; the page moves the root and matches the stride, as people.js does for
  people), plus what the painting needs (`graze`/head down, `lie`). The registry `animals.json` gives per type: file,
  length_m, height_m, clips, the walk stride (m per cycle), the saddle point (bone name + offset) where a rider sits,
  and the loads/tack it carries (as named variants or attachable meshes on a named bone).
- **Riders** are characters with a `ride` clip, seated on the saddle point.
- **Budgets** (the user's sizing note): an animal 2–4k triangles, one 512 px texture (webp), one GLB of a few hundred
  KB with its clips; one shared quadruped skeleton per body plan if you can (equid, bovid, camelid), so clips can be
  shared; a vehicle 1–4k triangles of kit geometry, no textures of its own beyond the kit's materials.

## Run 1 (now)

1. **The vehicle kit** (`blender/kit_vehicles.py`), Song carts as painted, built like the rest of the kit (no
   plain boxes: chamfered members, spoked wheels with hub, felloes and spokes, framed bodies, mat roofs with
   thickness, loads as soft pieces). Types known now:
   - the big covered ox cart with a woven-mat barrel roof over a panelled body, two big spoked wheels, a basket at
     the rear (S5 `S5.veh.covered_ox_cart_9800`; S4's two three-ox covered carts are the same type);
   - the 串车: a barrow with one big spoked wheel under the middle, here under a huge domed sheet painted with
     cursive script, drawn by a trace donkey (S5 `S5.veh.cart_screen_8510`);
   - S6: two sedan chairs (轿) with their poles, two four-mule wagons (太平车), a donkey cart with two wine casks, a
     sack cart drawn west by a donkey team.
   Look at each on the scan before building it (`node tools/scroll_map.mjs S5 overlay --parts none --grid 20 --x
   U0-U1 --y V0-V1 --zoom 3 --out gen/vehicles/look/<file>.jpg`; S4/S6 positions: sections.md §2 until their maps
   land). Review: build each type headless (`scripts/blender_wsl.sh -b --factory-startup --python <your script>`; the
   live GUI is the lead's) into a review scene and render it from three angles to `gen/vehicles/`; read the renders
   next to the scroll crops. More vehicle types will come from the area agents' needs lists.
2. **The animals.** Types known now: the donkey (S5: 8 of its 12 animals, riding, pack, trace, head-down), the
   Bactrian camel laden with a pack frame (S5: 3), the ox (S4's carts, S5's covered cart: yellow draught cattle as
   painted), the mule and the horse (S6's wagons; S4's rider and the white horse lying in the courier post), small
   animals (a dog or piglet). Make them in this order: donkey, ox, camel, horse/mule.
   - **Meshy rigs only humanoids** (its rigging API: "only works well with standard humanoid (bipedal) assets"), so
     the body comes from Meshy (image-to-3D, Smart Topology, then retexture from your views, as the characters do)
     and the rig is ours: `blender/rig_quadruped.py` fits a quadruped skeleton (spine chain, neck, head, ears if
     they help, tail chain, four legs with the right joint order for a hoofed animal) to the mesh, skins it
     (automatic weights, then fix what deforms badly), and keys the clips: a calm idle (breathing, weight shifts,
     head and ear and tail moving), a walk with a true four-beat walk footfall (left hind, left fore, right hind,
     right fore), and what the painting needs (head down, lying). Export a GLB with named clips.
   - The sheet: ref crop of the painted animal (registered restyle `gen/sections/gate/mosaic.jpg` for S5's; the scan
     for the others until their restyles exist) + B1 (`prompts/style_B1.png`) through `tools/shyfai_image.py`. For a
     quadruped the side view carries the shape: test which view Meshy builds best from.
   - Review every animal by frame sheets of its clips (side and three-quarter), on the real GPU on your review page
     (`tools/clip_sheet.mjs` works on characters; extend or mirror it in your own tool) or as Blender renders. A
     walk that skates, legs that bend backward, or a mesh that tears at the shoulder is not done.
3. **Riding:** a `ride` custom action (Meshy Text to Motion, prime: sitting astride, legs apart round the barrel,
   hands forward on the reins, small sway) in `characters/motions.json` + `prompts/motion_ride.txt`; read its frame
   sheet; retarget it onto the characters that will ride (start with all 8; it is cheap).
4. **Record** in `animals/notes.md` and `characters/notes.md` (runs, credits, what worked), then **report**: the
   types made, their triangles and sizes, the clips and how they read, the kit functions and their parameters, the
   credits spent, the registry format as built, and anything the lead must add to the page (`people.js`) to place
   them.

## Run 2 (when the lead sends the area agents' needs)

New characters (one scroll figure each, through `tools/character.mjs`), the custom actions the areas need, the further
animal and vehicle types, carried props. You will get one combined list.

## Credits and keys

- Meshy credits: 387 at the start (check: `curl -s -H "Authorization: Bearer $MESHY_API_KEY"
  https://api.meshy.ai/openapi/v1/balance`). The user said to spend what quality needs. Record every spend. If the
  balance runs out, stop the paid steps, finish everything else, and say exactly what is pending: the user will top
  up. Meshy deletes outputs after 3 days: download everything into `gen/` at once.
- Images only through `tools/shyfai_image.py`. 3D only through hosted Meshy.
- `reference/messenger_study/` is study-only: never copy from it.
- Read every image you make before you rely on it.
