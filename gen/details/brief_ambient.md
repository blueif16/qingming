# Brief: ambient life (details pass, agent "ambient")

The user (2026-10-13): "small tiny details ... create some of the small objects, like small events. They are not
part of the original scroll but we think there could be, for example, birds flying or leaves falling ... some of the
tiny movements that can happen in a realistic scenario. Think of what you actually see to make it feel even more
real. You don't need to add a lot but I think a few would increase our depth. ... we have full access to Meshy ...
try not to hurt the performance a lot. Try to have the exact same way of rendering as current best methods."

## The rule (now in `map/BUILDING.md`, "Ambient life")

Ambient life is the one place the world adds what the scroll doesn't paint, limited to motion and air:
- birds in flight and small birds on the ground, insects;
- falling leaves, willow catkins (柳絮: 清明 is their season), petals;
- smoke and steam from painted fires and stoves;
- dust at painted wheels;
- the wind's sway on cloth, banners and signs.

It is never people, owned animals, buildings, props or traffic. It is never built into a section GLB. It is placed
from the map's own things: birds near trees, roofs and the river; catkins under willows; smoke over painted stoves
and cooking (`map/text/<S>.md` says what is painted where). It stays sparse: "you don't need to add a lot". The
trees themselves (3D trunks, crowns, their sway) belong to the trees agent (`gen/details/brief_trees.md`). Share one
wind with it: one uniform (direction, strength, gusts) that both use, so willow strands, catkins, banners and smoke
all move together. Agree its name and home with the trees agent; a tiny `web/src/wind.js` is a good place.

## Do

1. **Look first, then pick.** Write `gen/details/ambient/plan.md`: what you would really see on a spring (清明)
   morning-to-evening in a Song river town and its countryside, ranked by depth gained per cost. Pick about five to
   eight for the pilot. Likely candidates:
   - a flock wheeling high over the river now and then;
   - swallows skimming low along the street and the water;
   - sparrows hopping and pecking on the ground near grain, food and stalls, flying up when you come close;
   - crows or egrets over the water;
   - catkins drifting down near willows;
   - a few leaves falling;
   - banners, shop flags (酒旗) and awnings fluttering in the wind;
   - a thin cooking-smoke column and steam at painted kitchens;
   - butterflies in the countryside, dragonflies over the river;
   - by the hour (the world clock is the viewer's local time): birds roost at dusk, bats at dusk, fireflies at
     night in the fields.
2. **Make them the cheap way:**
   - GPU-instanced and shader-animated (flight and flap in the vertex shader; particles whose paths are a function of
     time, with no per-particle CPU work);
   - a handful of CPU agents at most, for the reactive sparrows;
   - one module, `web/src/ambient.js`, plus tiny hooks;
   - painted-style textures (shyfai, `tools/shyfai_image.py`, the B1 style, true colours from `web/src/palette.js`);
   - small birds as low-poly kit shapes or a Meshy model (hosted only, account `msy_VYNl`, log the spend in
     `workshop_logs/credits.log`) with a two-bone flap.

   Look at the existing kit-built crow (`animals/bird.json`, `blender/rig_quadruped.py` bird plan) first. Sound
   hooks: ask the sound records (`gen/life/`, `web/src/sound.js` is owned by a sound session) before adding any
   sound; add none yourself.
3. **Tiers.** low: the cheapest two or three, sparse. mid: more. high: all. Use `web/src/tiers.js`.
4. **Pilot in one section** (S4 outer_road: willows, the open road, the ditch), then scale to all eight. Each effect
   is placed from map data, never by eye.
5. **Numbers:**
   - draws, triangles, CPU ms per frame and GPU MB added, before and after, at high and on the phone proxy at the low
     tier (`tools/bench_page.mjs`, `gen/perf/probe.mjs`), at the storyteller and crown views;
   - the target is within noise of before on low, and a few percent on high;
   - the regression (`tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh <tag>` with `?start=0`) passes as
     before;
   - a short film of each effect (`tools/film_page.mjs`) and a few stills for the lead's final look.

## Rules

- **Shared engine.**
  - world.js and the other engine files belong to the performance session (3d-director-04). Keep hooks to a few
    lines, re-read before each edit, and message 3d-director-04 (SendMessage) with what you added.
  - The trees agent touches the tree code in world.js; coordinate with it through the lead if you both need the
    same spot.
  - 3d-director-da owns the start screen and the settings; ask it for an "ambient" settings row if you want one.
- `world.html` opens on a Start screen; load it with `?start=0`. Pages only through `tools/chrome_slot.sh` against
  `tools/check_server.sh` (5190). Blender only through `tools/blender_slot.sh`. Run `tools/machine.sh status` before
  heavy steps.
- Never deploy. KTX2 for new textures, under `flock /tmp/qingming_charbuild.lock`.
- Record as you go in `gen/details/ambient/notes.md`. Fold the lasting rules into the skill `web-scene` at the end.
- Finish with:
  - what was added, per section and tier;
  - credits spent;
  - numbers before and after;
  - film and still paths;
  - ideas left for later.
