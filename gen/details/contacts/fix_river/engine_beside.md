# Engine item E1 (fix-river, 2026-10-13): walkers beside a walking animal

For 3d-director-04, which owns `web/src/`. S1's two charcoal drivers (`charcoal_driver_36797`, `charcoal_driver_36250`)
are painted driving the charcoal train, a hand on a donkey's load (`drive_donkeys`: the left palm flat on the load
beside him every step). Today each walker and each walking donkey keep their own pace, random stops and turns, so the
hand is 0.7 and 1.7 m off any load at the dump (contact_check FAIL). people.js already walks traffic pairs abreast
(`follower` / `leader` / `partner`, addTraffic). This patch lets a people.json walker join a walking animal the same way.

Data (already in `sections/countryside/people.json` and shipped; ignored until the patch lands):
`walkers[].beside = {animal: <slug>, gap: -0.57, along: 0}`. gap is the lateral offset, + = left of travel
(Path.at). -0.57 puts the donkey on his left: the pannier's half-width 0.47, his palm 0.08 left of his centre, and a
1.6 cm rest.

File `web/src/world.js`, the section's walkers:

old:
```js
  for (const w of spec.walkers || []) {
    const f = byId[w.figure];
    made.push(people.addWalker({ ...cast(w), path: routePath(sec.layout.route, w.path), startAt: f ? [f.X, f.D] : undefined }).p);
  }
```
new:
```js
  for (const w of spec.walkers || []) {
    const f = byId[w.figure];
    // beside: a driver walking at a painted walking animal's side, a hand on its load (people.json walkers[].beside
    // {animal: <slug>, gap: m across, + = left of travel, along: m ahead}; gen/details/contacts/fix_river/engine_beside.md):
    // he walks the animal's own path as the follower of a pair (as addTraffic's pairs), at its place and pace, stopping
    // and turning with it
    const L = w.beside && people.walkers.find((q) => q.p.id === w.beside.animal);
    const a = people.addWalker({ ...cast(w), path: L ? spec.animals[w.beside.animal].path : routePath(sec.layout.route, w.path), startAt: f ? [f.X, f.D] : undefined });
    if (L) {
      Object.assign(a, { follower: true, leader: L, gap: w.beside.gap ?? -0.57, sOff: w.beside.along || 0, sOffTarget: w.beside.along || 0, speed: L.speed });
      L.partner = a;
      a.l = a.targetL = people.laneOf(a);
      people.startWalking(a);
    }
    made.push(a.p);
  }
```

To check on review:
- the animals are added before the walkers (they are: `addAnimal` runs first), and addAnimal sets `p.id` to the slug
  after its walker is made, so `people.walkers.find(q => q.p.id === slug)` finds it;
- the follower code in `walkStep` / `plan` (single file behind the leader when there's no room beside it) keeps him
  beside a 0.94 m-wide laden donkey on an open road;
- at the leader's stops, `partnerStop` plays the follower's `talk` clips or idle. A driver has none, so he idles.

After it lands: a fresh page dump, then `node tools/contact_check.mjs countryside`. If the hand lands on the far side,
flip the gap's sign in `sections/countryside/contact_fixes.json` "walkers" and rerun the casting script.

## E1 on the page (landed by 04, 2026-10-13 ~06:15) and follow-up E1b (proposed)

The first dump after E1 put the drivers on their donkeys' left (the far side for drive_donkeys' left palm), so the data
gap became +0.57. The second dump (06:20) has both on the donkeys' right, palm_L 0.30 / 0.03 m off the load (from 1.64 /
0.70):
- charcoal_driver_36797: 0.415 m beside D5, level with it. His palm sinks 3.9 cm into the pannier (gap_q 0.022, pen_q
  -0.039; the tolerance is 0.03 / 0.02). He walks 0.20 m lower than his donkey: the bank falls away from the path.
- charcoal_driver_36250: 0.48 m beside D1 but 0.44 m behind it. plan()'s single-file fallback (`sOffTarget = -0.8`
  when the lane isn't free) drew him back.

E1b keeps a `beside` follower at its set place; the traffic pairs' fallbacks (single file when crowded, the lane
clamped to the corridor) don't apply to a driver whose hand is on his animal's load. Exact text:

File `web/src/people.js`, `plan()`:

old:
```js
    if (a.follower) {
      // beside the leader if there's room on this side of everyone; otherwise in single file behind it
      const ok = (mine && lane >= mine[0] && lane <= mine[1]) || (!mine && free.some(([f0, f1]) => lane >= f0 && lane <= f1));
      a.sOffTarget = ok ? 0 : -0.8;
      target = ok ? lane : a.leader.l;
    } else if (mine) target = THREE.MathUtils.clamp(lane, mine[0], mine[1]);
```
new:
```js
    if (a.follower && a.beside) {
      // a driver at his animal's side (world.js walkers[].beside): he keeps his place by it, his hand on its load,
      // whatever the corridor or the bodies round the pair (they move as one; gen/details/contacts/fix_river/engine_beside.md)
      a.sOffTarget = a.beside.along || 0;
      target = lane0;
    } else if (a.follower) {
      // beside the leader if there's room on this side of everyone; otherwise in single file behind it
      const ok = (mine && lane >= mine[0] && lane <= mine[1]) || (!mine && free.some(([f0, f1]) => lane >= f0 && lane <= f1));
      a.sOffTarget = ok ? 0 : -0.8;
      target = ok ? lane : a.leader.l;
    } else if (mine) target = THREE.MathUtils.clamp(lane, mine[0], mine[1]);
```

File `web/src/world.js`, the walkers (E1's line):

old:
```js
      Object.assign(a, { follower: true, leader: L, gap: w.beside.gap ?? -0.57, sOff: w.beside.along || 0, sOffTarget: w.beside.along || 0, speed: L.speed });
```
new:
```js
      Object.assign(a, { follower: true, leader: L, beside: w.beside, gap: w.beside.gap ?? -0.57, sOff: w.beside.along || 0, sOffTarget: w.beside.along || 0, speed: L.speed });
```

After E1b: retune `gap` per driver in sections/countryside/contact_fixes.json "walkers". The bank slope means his feet
sit 0.2 m under the donkey's, so the gap that puts his palm on the pannier's face is measured on the dump, not taken from
the flat-ground 0.57.

## E1b on the page (landed by 04, ~06:35) and the gaps

With E1b, a beside driver keeps his set place. Scanned on the page dump across and along each donkey on the real ground
(the bank falls 0.15-0.28 m away from the path under the driver), the palm is within 1 cm of the pannier at gap +0.40,
along -0.15. Shipped in countryside people.json (06:4x). Dump at ~06:45:
- charcoal_driver_36797: 0.400 m beside D5, 0.150 m back: palm gap_q 0.009, pen_q -0.006: PASS.
- charcoal_driver_36250: caught while the pair turns round at the end of D1's 2.3 m path. A follower's lane is
  `gap * dir` along the path's normal, so when the direction flips he crosses to the other side of the path at
  LAT_RATE while the donkey turns in place: palm 4.6 cm off. That is about 2 s of each ~10 s cycle, and a dump about
  8 s after load lands in it. Mid-walk he is placed as 36797 is.

## E1c (optional, not sent): a beside driver turns with his animal

Placing a beside follower in his animal's own frame, instead of on the path's normal, would keep his hand on the load
through the turns at the path's ends, as riders are kept on their saddles. File `web/src/people.js`, end of
`walkStep(a, dt)`:

old:
```js
    y += (a.groundY - y) * Math.min(1, dt * 12);
    p.root.position.set(this.v.x, y, this.v.z);
    p.root.rotation.y = a.heading;
  }
```
new:
```js
    y += (a.groundY - y) * Math.min(1, dt * 12);
    p.root.position.set(this.v.x, y, this.v.z);
    p.root.rotation.y = a.heading;
    if (a.beside) {
      // a driver at his animal's side keeps its frame (gap: + its left, along: + ahead), so his hand stays on its load
      // while it turns round at the ends of its path (E1c, gen/details/contacts/fix_river/engine_beside.md)
      const L = a.leader.p.root, h = L.rotation.y, gx = a.gap, gz = a.beside.along || 0;
      const x = L.position.x + gx * Math.cos(h) + gz * Math.sin(h), z = L.position.z - gx * Math.sin(h) + gz * Math.cos(h);
      p.root.position.set(x, this.hooks.ground(x, z, L.position.y + 1.5), z);
      p.root.rotation.y = h;
    }
  }
```
(gap's sign then means the animal's left, not left of travel: the data becomes gap -0.40, the donkey on his left.)
