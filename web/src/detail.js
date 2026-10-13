// The detail systems' tier contract (the lead and the details session, 2026-10-13). A system that adds optional detail
// (3D trees, ambient life, the chatter bubbles) registers here and tunes only through the device tier:
//   register(name, { applyTier(cfg), stats() })
//   - applyTier(cfg) reads cfg.detail[name] (tiers.js TIERS[tier].detail, numbers only) and cfg.detailScale (1, lowered
//     to 0.75 and 0.5 by the controller before an automatic tier steps down: counts multiply by it). It is called at
//     register with the current tier, and again on every tier or scale change, so it must re-scale live.
//   - stats() -> { draws, triangles, instances, cpuMs } for the bench and __test.details().
// Details animate on the GPU (instanced, shader time), so their CPU cost per frame stays near zero and the
// controller's CPU-bound path is untouched; their GPU cost (mostly alpha overdraw) is what the render scale relieves.
const systems = new Map();
let current = null; // the tier's cfg with its detailScale

function call(name, sys) {
  try { sys.applyTier?.(current); } catch (e) { console.warn(`detail ${name}: applyTier`, e); }
}

export function register(name, sys) {
  systems.set(name, sys);
  if (current) call(name, sys);
  return () => systems.delete(name);
}

// the page: at start and on every tier or scale change (world.js)
export function applyDetail(cfg, detailScale = 1) {
  current = { ...cfg, detailScale };
  for (const [name, sys] of systems) call(name, sys);
}

export function detailStats() {
  const out = {};
  for (const [name, sys] of systems) { try { out[name] = sys.stats?.() ?? null; } catch (e) { out[name] = { error: String(e) }; } }
  return out;
}
