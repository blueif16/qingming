# Lessons for the skill `web-scene` (perf batch 2, frame-rate agent)

Merge into `.claude/skills/web-scene/SKILL.md` (or its perf section), under the batch 1 lessons. Exact text:

---

### Frame rate: what batch 2 learned (gen/perf/batch2/framerate.md)

- **Shadows come in two layers** (`world.js` `shadowLayers`). Every direct child of the scene is the world's layer
  by default: drawn into the shadow map only when the box's snapped centre or the sun steps, a section comes or goes,
  the camera moves 1 m (the tree cards turn to it), or a static direct child of the scene is added or removed; its depth
  is kept and copied back (blitFramebuffer) on the people's redraws, which draw only the movers over it. **A thing you
  add that moves and casts a shadow must set `userData.shadowMover = true` on the object it adds to the scene** (the
  crowd's group, a Person's root and the boats' batches do), or its shadow stays put until the world's layer is
  redrawn. Nested flags are not read. A shader-only sway (wind) is no move: cast from the rest pose. A static change
  inside an object already in the scene asks for a redraw with `shadowLayers.world = true`. `?shadowcache=0`: one
  layer, for A/B.
- **An empty instanced batch still costs a draw.** three runs its per-object work (render list, program, uniforms,
  onBeforeRender, a 0-instance draw) for a mesh with `count = 0`; cutting a count to 0 in onBeforeShadow keeps that
  cost. Hide such a mesh (`visible = false`, `castShadow = false`) instead: `crowd.js` does it per batch every frame
  (`crowd.skipEmpty`), -15...-37% CPU on the phone proxy, the same picture.
- **Boats share one batch per material across sections** (`boats.js` join/leave, `this.pool`): a section's pieces go
  in when it joins, out when it leaves (after its flow copies); never keep a batch id past its section (`set.joined`).
- **Measure small changes in one page.** On the shared machine the same view swings 2x between page loads, so a
  two-page A/B can't see 5-10%. Flip a runtime switch between short measures, A B B A for 10 rounds, medians
  (`gen/perf/batch2/framerate/inpage_ab.mjs --a '<js>' --b '<js>'`); time a pass itself when you can
  (`framerate/shadow_split.mjs`). Give every perf change a runtime or `?` switch so it can be measured this way.
- Full tier: people cast shadows to 40 m (`tiers.js` high `peopleFar`), the box's centre snapped to 1 m.
