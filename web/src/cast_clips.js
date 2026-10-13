// The clips a section's people play, per character (perf batch 2, per-clip animation files: tools/clip_split.mjs).
// world.js fetches them with the section's cast while the section loads, so no figure starts a clip that isn't there;
// tools/budget_check.mjs and tools/cast_clips_check.mjs count the same. Plain data in and out (no three.js), so the
// tools import it too.
//   people  a section's people.json
//   castAs  (spec) -> the character a figure or walker is drawn with (world.js castAs: its own, its stand-in, the townsman)
// A figure or walker asks for every string in its own entry that names a clip of its character (do steps, walk, pause,
// stops, talk, ...), and for what the engine plays without being told: idle (every routine's fallback and halt), walk
// (walkers), ride (a rider's default), and its boat's haul walk and stand for a tracker (people.json
// boats.<slug>.haul.<figure>). Strings that aren't clips (names, reasons) match nothing and cost nothing.
// Returns Map character -> Set of names (clips and other strings; the caller keeps the character's clips).
export function castClips(people, castAs) {
  const out = new Map();
  const add = (ch, names) => { let s = out.get(ch); if (!s) out.set(ch, (s = new Set())); for (const n of names) s.add(n); };
  const strings = (x, acc = []) => {
    if (typeof x === 'string') acc.push(x);
    else if (Array.isArray(x)) for (const y of x) strings(y, acc);
    else if (x && typeof x === 'object') for (const y of Object.values(x)) strings(y, acc);
    return acc;
  };
  const haul = {};
  for (const b of Object.values(people.boats || {})) for (const [id, h] of Object.entries(b?.haul || {})) haul[id] = h;
  for (const [id, f] of Object.entries(people.figures || {})) {
    if (f.carried_by) continue; // drawn by its carrier's prop
    add(castAs(f), ['idle', ...(f.ride ? ['ride'] : []), ...strings(f), ...(haul[id] ? ['walk', ...strings(haul[id])] : [])]);
  }
  for (const w of people.walkers || []) add(castAs(w), ['idle', 'walk', ...strings(w)]);
  return out;
}

// the load test's extra traffic (people.json load_test_traffic, world.js setCrowd): its kinds' clips
export function trafficClips(spec) {
  const out = new Map();
  for (const k of spec?.kinds || []) {
    const s = out.get(k.character) || new Set(['idle', 'walk']);
    for (const n of [k.clip, k.walkWith, ...(k.stops || []), ...(k.talk || [])].flat()) if (typeof n === 'string') s.add(n);
    out.set(k.character, s);
  }
  return out;
}

// A person asks for a clip its split model doesn't have yet (one no section's routines listed: world.js fetches those
// with the section): it is fetched, and the person plays its fallback (idle) until it is in, then the clip (people.js
// loadClips calls its playPending); one not drawn yet waits unseen (crowd.js Crowd.update). Called by play(name) of
// people.js Person and crowd.js CrowdPerson: a clip the model has drops any wait. Each wait is counted in LATE_CLIPS
// (world.js __test.stream.stats().lateClips: stays empty while every clip a routine names comes with its section).
export const LATE_CLIPS = [];
export function settlePending(p, name, opts) {
  const m = p.model, has = m.clips.some((c) => c.name === name);
  if (p.pending && (has || p.pending.name !== name)) { m.waiting?.delete(p); p.pending = null; }
  if (has || p.pending || !m.lazy?.has(name)) return; // in, asked for already, or not one of its clips
  p.pending = { name, opts };
  (m.waiting ||= new Set()).add(p);
  LATE_CLIPS.push(`${m.name}/${name}`);
  if (LATE_CLIPS.length > 200) LATE_CLIPS.shift();
  m.fetchClip(name);
}
