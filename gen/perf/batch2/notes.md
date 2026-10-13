# Perf batch 2: what landed, numbers, next step

Lead: 3d-director-04, 2026-10-13. The user's frame for this batch: reach (phones first); "do the easy optimizations
that remain… we don't need solid rigid checks… tune settings and do it right now and be quick"; the middle version of
the world in cells approved ("if the middle version actually gives us such a boost in performance, then yes"). The
agents' brief: `brief.md`. Baseline: `before_build/` served on 5195 (`serve.py`), the tree at the start of the batch
with the lead's defaults below. A/B benches: `ab_bench.sh` (both sides the same query; Blender not counted, the user
keeps a GUI Blender open).

## Lead: defaults and boats by device (landed)

- **Stepped shading by default** (`world.js` `WORLD_DEFAULTS.shading = 'toon'`, the user). True colours were already on
  by default.
- **Saved settings versioned** (`s.v`): the page saves every key whenever one changes, so a new default never reached
  a returning visitor. v2 puts stepped shading and true colours over the saved copy once; choices made after stay.
- **Boats by device** (the user: "if his device supports then we do a more complex flow"; `map/BUILDING.md` "The
  river's flow, by device"): settings key `boats` = auto | moored | painted | waves (`world.js` `boatMode`/`boatCap`);
  auto gives light *painted* (`tiers.js` `flowCap` 0), balanced *waves* up to 3, full up to 6; waves chosen by hand on
  light: 2. `?boatflow=moored|painted|waves` and `?boatflowcap=N` win. Painted and waves switch live (the cap);
  to or from moored waits for the next visit. `boatflow.js`: the waves lanes are built at cap 0 too, and `pick()`
  holds active copies under the cap. `boats.js` takes `hooks.flow` from the page (other pages keep the URL switch).
- **The 船行 Boats row** in the settings' Display page (`ui/settings_screen.js`, `ui/settings_words.js`; the UI session
  that owned these was cleared and asked the lead to add it).
- Check: `check_deploy.mjs` PASS on the built snapshot (all sections, 34 boats, no errors).

## Agents

- Frame rate (`framerate.md`): boats' batches across sections, two-layer shadows, far people out of the shadow pass.
- Loading (`loading.md`): content-hashed GLB/JSON names cached immutably, small tree cards first.
- Cells (`cells.md`): the middle version (cells cut at export, one BatchedMesh per material, per-cell culling), pilot
  on rainbow_bridge, then all eight sections if the phone proxy gains.
- Held for the details session (3d-director-2e, rebuilding characters): the crowd's far LOD and per-clip animation
  files; they go on top of its rebuild, the clip-file format agreed with it first.

## Numbers

Live site before batch 2 (`probe.mjs load https://qingming-delta.vercel.app/world.html --net slow4g --throttle 4
--warm 1`, phone viewport; `live_before/load_slow4g.log`), i.e. batch 1 as deployed:

| | live, after batch 1 |
|---|---|
| cold: can walk | **25.1 s** (67 requests, 4.7 MB over the wire; was 76 s before batch 1) |
| cold: first window in | 137.0 s (250 requests, 23.7 MB) |
| second visit: can walk | 3.6 s (103 requests, 23 KB over the wire) |
| second visit: first window in | 9.1 s (239 requests, 62 KB) |

The cold walk waits for: kit and bodies 1.3 MB, the section 1.1 MB, the cast 0.9 MB, other 0.7 MB, code 0.4 MB.

## Next
