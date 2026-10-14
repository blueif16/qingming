// Steady labels (the user, 2026-10-13: "a lot of times if you are just walking, there might be flashing of these tags
// and dialogues"): which anchored labels show (plaques, intent marks, the talk prompt), chosen so that none blinks.
// Each check, every candidate gives two gates: `ok`, what it takes to appear, and `keep`, the looser one it takes to
// stay. A label at a threshold (a distance, the screen's edge, the facing angle) sits inside the band between them and
// holds still. On top of that:
//  - debounce: it appears once `ok` has held showAfter s, and goes once `keep` has failed for hideAfter s, so one
//    occlusion ray grazing a roof edge, or a head bobbing over a line, never blinks it;
//  - dwell: once shown it stays at least minOn s, and once gone it waits minOff s before it may come back;
//  - sticky ranks: with at most `max` shown, the ones showing rank as if `stick` times nearer, so two places at about
//    the same distance don't swap as you walk.
// `drop: true` on a candidate takes it away now (its words are up in a bubble, a conversation started).
// A candidate missing from a check counts as failing both gates. Cost: a Map lookup per candidate per check.
export class Steady {
  constructor({ max = Infinity, showAfter = 0, hideAfter = 0.4, minOn = 1.2, minOff = 0.8, stick = 0.75 } = {}) {
    Object.assign(this, { max, showAfter, hideAfter, minOn, minOff, stick });
    this.st = new Map(); // key -> { on, since, okSince, badSince, score, seen }
  }

  // t: seconds; cands: [{ key, score (lower ranks first, e.g. a distance), ok, keep, drop }]; returns the keys to show
  update(t, cands) {
    const rows = [];
    for (const c of cands) {
      let s = this.st.get(c.key);
      if (!s) this.st.set(c.key, (s = { on: false, since: -Infinity, okSince: null, badSince: null }));
      s.seen = t;
      s.score = c.score;
      s.okSince = c.ok && !c.drop ? s.okSince ?? t : null;
      s.badSince = c.keep && !c.drop ? null : s.badSince ?? t;
      if (c.drop) { if (s.on) { s.on = false; s.since = t; } continue; }
      this.consider(t, c.key, s, rows);
    }
    // the ones showing that weren't offered: failing, they go once their dwell and debounce are over
    for (const [key, s] of this.st) {
      if (s.seen === t) continue;
      s.okSince = null;
      s.badSince ??= t;
      if (s.on) this.consider(t, key, s, rows);
      else if (t - s.since > 30) this.st.delete(key);
    }
    // the ones still in their dwell keep their places; the rest by score, the showing ones a little ahead
    rows.sort((a, b) => (b.locked - a.locked) || a.score - b.score);
    const show = new Set(rows.slice(0, this.max).map((r) => r.key));
    for (const [key, s] of this.st) {
      const want = show.has(key);
      if (want !== s.on) { s.on = want; s.since = t; }
    }
    return show;
  }

  consider(t, key, s, rows) {
    if (s.on) {
      const locked = t - s.since < this.minOn;
      if (locked || s.badSince == null || t - s.badSince < this.hideAfter) rows.push({ key, score: s.score * this.stick, locked });
    } else if (s.okSince != null && t - s.okSince >= this.showAfter && t - s.since >= this.minOff) rows.push({ key, score: s.score, locked: false });
  }

  isOn(key) { return !!this.st.get(key)?.on; }
  reset() { this.st.clear(); }
}
