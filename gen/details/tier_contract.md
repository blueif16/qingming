# Detail systems and the auto-tuner (contract, proposed 2026-10-13)

The user: "we have a very pretty customized system that's sort of like auto-tunes based on the device performance ...
think of what is the best performance-friendly yet detail-rich way. We want to suit our current auto-tuning
performance system."

The auto-tuner is `web/src/tiers.js`, owned by the performance session (3d-director-04):
- a guess per device (low, mid, high);
- a first check over 3 s of real frames: CPU-bound → a tier down, GPU-bound → the render scale to its floor;
- Messenger's controller: the render scale ±0.1 every 4 s; held at the floor and slow for 8 s → a tier down;
- `?tier=`, the Quality setting, the choice remembered per GPU.

Every detail system (trees3d, ambient, the talk chatter) follows these rules:
1. **Numbers per tier, as data.** One block per system under `TIERS.<tier>.detail.<system>`. Until tiers.js has it,
   keep a `DEFAULTS = { low: {...}, mid: {...}, high: {...} }` of exactly that shape at the top of your module.
2. **`applyTier(cfg)`.** It reads only `cfg.detail.<system>` (or your DEFAULTS[cfg.name]) and re-scales live when the
   tier changes: counts, distances, densities. No reload.
   - It registers through `web/src/detail.js` (`register(name, { applyTier, stats })`), one line in world.js, once
     3d-director-04 agrees.
   - It multiplies its counts by `cfg.detailScale ?? 1` if the controller ever adds one.
3. **CPU per frame near zero.** Animate on the GPU (instanced meshes, shader time uniforms, paths as functions of
   time). The controller reads a CPU-bound frame as a reason to drop a whole tier, so a CPU-heavy detail costs every
   other system its tier.
   - A handful of CPU agents at most (the reactive sparrows), updated at ≤ 10 Hz.
   - No per-object JS work in the frame loop.
4. **GPU cost as alpha-tested overdraw,** which the render-scale step relieves.
   - Alpha-test, not blend, where possible.
   - Small shared atlases in KTX2.
   - No new shadow casters, except trees in the cached static layer at rest pose.
5. **Report** from `stats()`: draws, triangles, instances, texture MB, and an estimate of CPU ms. Bench every tier
   before and after on high and on the phone proxy at the low tier (`tools/bench_page.mjs`,
   `gen/perf/probe.mjs memory`). Low must stay within noise; high may spend a few percent.
6. **Every tier shows everything the painting has.** Tiers trim only the additions: ambient counts, 3D tree
   distance, chatter. A light tier keeps cards for trees and the sparse ambient.

## Landed (3d-director-04, 2026-10-13)

- `tiers.js` gives every TIERS entry a `detail` block:
  - trees {meshNear 25/45/70, meshNearRiver 0/45/70, clumpDensity, strands, windFar 15/30/60};
  - ambient {birds, particles, sparrows, smoke, bannerSway};
  - talk {chatterOpen, marks}.

  Numbers only; the agents tune them there.
- `web/src/detail.js`: `register(name, { applyTier(cfg), stats() })` returns an unregister function. applyTier
  receives cfg plus `cfg.detailScale`, at register time and on every tier or scale change. stats() returns
  { draws, triangles, instances, cpuMs }.
- world.js calls applyDetail at start and on every tier change; `__test.details()` returns every system's stats.
- `detailScale`: held at the render-scale floor and under 30 fps for 8 s, the controller lowers it 1 → 0.75 → 0.5
  before stepping an automatic tier down. It resets on a tier change and never applies to a tier picked by hand.
