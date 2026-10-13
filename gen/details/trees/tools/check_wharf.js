// what differs at the grain wharf on the low tier with 3D trees: the people's part over time, shadow redraws, rebuilds
const t = window.__test, wait = (ms) => new Promise((r) => setTimeout(r, ms));
await t.view('grain_wharf');
const out = [];
const T0 = performance.now();
for (let k = 0; k < 8; k++) {
  const L = t.shadowLayers, w0 = L.worldDraws, m0 = L.moverDraws;
  const m = await t.measure(2);
  out.push({ s: +((performance.now() - T0) / 1000).toFixed(1), fps: +m.fps.toFixed(1), cpu: +m.cpuMs.toFixed(2), anim: +m.animMs.toFixed(2), gpu: m.gpuMs && +m.gpuMs.toFixed(2), calls: m.calls,
    world: L.worldDraws - w0, mover: L.moverDraws - m0, loaded: [...t.loaded.keys()].join(','), trees3d: t.trees3d?.on ? t.trees3d.stats() : null, rebuilding: !!t.trees3d?.rebuilding,
    stream: t.stream.stats?.()?.pending ?? null });
  await wait(1000);
}
return out;
