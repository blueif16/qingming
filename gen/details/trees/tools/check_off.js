// the off path (no ?trees=3d) draws exactly what ?trees=cards draws: same draws, triangles, card meshes and shadows
const t = window.__test, wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
for (const v of ['bridge', 'crown']) {
  await t.view(v);
  await t.stream.settle?.(true);
  await wait(2500);
  const L = t.shadowLayers, w0 = L.worldDraws, m0 = L.moverDraws;
  const m = await t.measure(2);
  const cards = t.scene.children.filter((o) => /^trees_/.test(o.name));
  out[v] = { calls: m.calls, tris: m.tris, cardMeshes: cards.length, cardsCasting: cards.filter((o) => o.castShadow).length,
    cardPrograms: [...new Set(cards.map((o) => o.material.customProgramCacheKey()))].length,
    sceneChildren: t.scene.children.length, trees3dInScene: !!t.scene.getObjectByName('trees3d'),
    worldDraws: L.worldDraws - w0, moverDraws: L.moverDraws - m0, details: t.details?.().trees ?? null, trees3d: t.trees3d ? (t.trees3d.on ? 'on' : 'inert') : null };
}
return out;
