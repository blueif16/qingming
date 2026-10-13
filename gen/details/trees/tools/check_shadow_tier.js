// the cached world shadow layer is redrawn whenever the trees switch between 3D and cards (the lead's must-keep,
// 2026-10-13): by the tier (low keeps cards by the rivers), and by trees3d's own numbers alone (the shadow box unchanged)
const t = window.__test, L = t.shadowLayers, wait = (ms) => new Promise((r) => setTimeout(r, ms));
const casting = () => [...t.stream.internals.cardKinds.values()].length;
const snap = async (tag) => {
  const kinds = await Promise.all([...t.stream.internals.cardKinds.values()]);
  return { tag, tier: t.tiers.name, world: L.worldDraws, mover: L.moverDraws, trees3d: t.trees3d?.stats().instances, batch: t.trees3d?.trees.length,
    cardsCasting: kinds.filter((k) => k.mesh?.castShadow).map((k) => k.name).join(' ') };
};
const out = [];
await wait(1500); out.push(await snap('start'));
await wait(1500); out.push(await snap('1.5 s later, standing'));
t.tiers.apply('low', 'trees check'); await t.trees3d?.rebuilding; await wait(1500); out.push(await snap('tier low'));
await wait(1500); out.push(await snap('1.5 s later'));
t.tiers.apply('high', 'trees check'); await t.trees3d?.rebuilding; await wait(1500); out.push(await snap('tier high'));
const c = { ...t.tiers.cfg, detailScale: 1 };
t.trees3d.applyTier({ ...c, detail: { ...c.detail, trees: { ...c.detail.trees, meshNear: 0, meshNearRiver: 0 } } }); await t.trees3d.rebuilding; await wait(1500); out.push(await snap('trees3d off (same box)'));
t.trees3d.applyTier(c); await t.trees3d.rebuilding; await wait(1500); out.push(await snap('trees3d on again'));
t.trees3d.applyTier({ ...c, detailScale: 0.5 }); await wait(1500); out.push(await snap('detailScale 0.5'));
return out;
