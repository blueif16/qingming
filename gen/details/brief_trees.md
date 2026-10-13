# Brief: trees in 3D (details pass, agent "trees")

The user (2026-10-13): "there's something wrong with the 3D trees. It doesn't seem to be as 3D as the other stuff.
They look like they are fake and just made with images. ... we have full access to Meshy so we can just continue to
generate wherever we need ... try not to hurt the performance a lot. Try to have the exact same way of rendering as
current best methods."

## What exists (read first)

- `qingming/CLAUDE.md`. Its "Foliage" line says AI 3D generators turn willow strands into slabs, so cards were
  chosen. That decision is now reopened: trees must read as 3D.
- `map/BUILDING.md`: the loyalty rules and the new "Trees in 3D" line, still one tree per mapped tree, of its
  painted form.
- `trees/notes.md`, `trees/types.md`, `trees/cards.json`: 12 painted forms and 52 cards (shyfai-painted alpha cards,
  `tools/tree_cards.mjs`), and every mapped tree assigned a card in `trees/assign/<S>.json` (about 224 trees in eight
  sections).
- The page: `web/src/world.js` `cardKind` / `buildCardMesh` / `placeTrees` / `removeTrees` / `sharpenCards`. Each card
  kind is one InstancedMesh, alpha-tested, shadow-casting, with 256 px cards first and then sharpened.
- Performance: `gen/perf/proposal.md` and `gen/perf/batch1/notes.md`. Device tiers (`web/src/tiers.js`), budgets
  (`tools/budget_check.mjs`, `tools/budgets.json`), the GPU memory limit by the rivers (S4b + S3 + S2 hold 198 of
  200 MB in the streaming window), and the phone proxy.
- The skill `web-scene` (KTX2, budgets, bench) and the skill `scroll-section` "Machine resources".
- `reference/messenger_study/world_notes.md`, for study only (its "stick trees"; never copy assets).

## Do

1. **Research the current best method** for stylized trees in a WebGL/three.js world that runs on phones, in the
   painted style. Write a short survey and choose with reasons in `gen/details/trees/method.md`. Expected direction:
   - a real low-poly trunk and main limbs;
   - a crown of leaf-clump cards: alpha-tested quads placed in 3D over the branch ends and the crown volume, with
     normals spherised from the crown's centre so the crown shades as one soft volume;
   - for willows, hanging strand ribbons: curved strips;
   - wind sway in the vertex shader: trunk bend, clump flutter, strands swinging, each with a per-instance phase;
   - the current painted card as the far LOD, with a dithered cross-fade;
   - instanced per form, sharing textures, with shadows through an alpha-tested depth material.

   Leaf textures are cut from our painted cards, or painted by shyfai in the B1 style (all image work goes through
   `tools/shyfai_image.py`). The colours are the true daylight colours (`web/src/palette.js`).
2. **Trunks and limbs from Meshy** (hosted only; account `msy_VYNl`, `tools/meshy_task.py`; quality over credits; log
   every spend in `workshop_logs/credits.log`):
   1. A shyfai image of the bare tree of each form: trunk and main limbs, no leaves, in the B1 style.
   2. Meshy image-to-3D from it.
   3. Decimation and conversion to our spec: about 1-3k triangles near, a lower LOD, one material, ink outlines
      where the surface IDs change.

   For trees whose trunks are painted gnarled and old (the big old trees of S4), keep that character. A form may also
   be built procedurally if that serves better (willow whips, saplings, hedges); say which and why.
3. **Pilot first:** one form (the willow, the most common), in one view (S4 outer_road's willows, or the gate).
   - Before and after screenshots at the same views and hours.
   - Numbers before and after: draws, triangles, GPU MB and fps on high, and on the phone proxy at the low tier
     (`tools/bench_page.mjs`, `gen/perf/probe.mjs memory`).
   - Wind looked at in motion (`tools/film_page.mjs`).
   - The pilot is the standard. Record it, then scale to every form.
4. **Scale to all 12 forms and all mapped trees**, with tiers:
   - low: fewer clumps, the card LOD nearer;
   - mid and high: full detail.

   Then run `budget_check all` and the regression (`tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh
   <tag>` with `?start=0`), and update `tools/tree_cards.mjs check` or add a tree check: every mapped tree has its 3D
   form and its card LOD.

## Rules

- **Shared engine.** world.js belongs to the performance session (3d-director-04). Put the tree system in a new module
  (e.g. `web/src/trees3d.js`) with a small hook in world.js, so the card path still works with a switch (`?trees=cards`).
  Re-read world.js right before each edit, keep edits small, and message 3d-director-04 with SendMessage before you
  land the hook: it plans "256 px tree cards first" and two-layer shadows that touch the same code.
- Another session (3d-director-da) owns the start screen and the settings rows; ask it if you want a setting.
- `world.html` opens on a Start screen; load it with `?start=0`. Pages only through `tools/chrome_slot.sh` against
  `tools/check_server.sh` (5190). Blender only through `tools/blender_slot.sh`. Run `tools/machine.sh status` before
  heavy steps.
- Never deploy; the lead hands deploys to 3d-director-04. KTX2 for new textures (`tools/ktx2.mjs`), under
  `flock /tmp/qingming_charbuild.lock` (shared with the character agents).
- Record as you go in `gen/details/trees/notes.md`, and save state to the repo after each stage. Fold the method into
  `trees/notes.md` and the skill `web-scene` at the end.
- Finish with:
  - the method chosen;
  - credits spent;
  - before/after numbers per tier;
  - screenshots and a short film path;
  - what's left.
