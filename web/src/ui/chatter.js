// Earshot (gen/life/design.md distance 2; gen/life/progress.md): the painted groups talk among themselves, and lone
// figures say a word now and then, whether or not you stand there. Text only, in the shared bubble pool (bubbles.js):
// at most two bubbles on screen with the near talk, the near talk wins, and a line is drawn only when its speaker is
// within SHOW_M of you and on screen, nearest first.
// Data (assets/ui/talk/<section>.json, added per section as it streams in; tools/ui_data.mjs): chatter groups { id, section, roles, X, D, gap: [a, b] s of quiet
// between exchanges, exchanges: [{ beats: [{ who, alts: [line...], think, optional, when: [clip...], as: { kind:
// [line...] }, wait }], linked, step }] } and barks { id, section, role, alts, think, every: [a, b], close, when, as,
// X, D, step }.
// Timing, so it feels said and not played: a group wakes when you come within WAKE_M (staggered: some are mid-talk, some
// quiet); an exchange is two to four turns, each line up for its reading time; the next speaker starts as the last
// line is ending (turn-taking), the same speaker after a breath; between exchanges a quiet gap (longer at night).
// Exchanges and alternatives are picked without repeating the last; a linked exchange takes the same alternative in
// every beat (so a reply fits its line). A line waits for its speaker's clip: a sleeper (sleep/doze clips) only
// thinks; a beat with `when` is said only while its speaker plays one of those clips, else skipped. Barks are rare:
// a lone figure's word every `every` s while you are near; a `close` bark (a hawker's call to you) fires once as you
// come within CLOSE_M, then rests until you leave.
// Plot lines (threads): an exchange, bark or near talk with a `step` ticks that step into the 圖志 when a line of it is
// on screen (heard(step)). A group near you prefers an exchange whose step you have not heard.
// Cost: the scan runs scanHz times a second (the tier's; at most 10) over the groups of the loaded sections (a distance each); per frame nothing (the
// bubbles' placing is bubbles.js's, the same for one bubble or two).
import * as THREE from 'three';
import { headOfRole, castOf, readSecs, MAX_OPEN, withEnglish } from './bubbles.js';

const CLOSE_M = 3.6, BARK_WAKE = 16;
// The device tier's numbers (gen/details/tier_contract.md; tiers.js TIERS.<tier>.detail.talk overrides, detail.js
// calls applyTier): chatterOpen = chat bubbles open at once (the near talk keeps its two), marks = intent marks (not
// built yet), scanHz = the scheduler's rate, wakeM = groups that keep talking round you, showM / barkM = how near a
// speaker must be to be drawn, gapScale = quiet between exchanges (longer on the light tier: fewer new bubbles).
export const DEFAULTS = {
  low: { chatterOpen: 1, marks: 0, scanHz: 3, wakeM: 20, showM: 9, barkM: 7, gapScale: 1.35, perMin: 5 },
  mid: { chatterOpen: 2, marks: 4, scanHz: 4, wakeM: 26, showM: 10, barkM: 8, gapScale: 1, perMin: 8 },
  high: { chatterOpen: 2, marks: 6, scanHz: 4, wakeM: 26, showM: 10, barkM: 8, gapScale: 1, perMin: 9 },
};
const SLEEPY = /sleep|doze/;
const MIN_NEW_S = 1.0; // calm: at most one new chat bubble this often
const BURST = 3; // and the tier's perMin new exchanges a minute on screen, with a small burst (a token bucket)
const v = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);

// pick an index in [0, n) other than `last` (n >= 2), else 0
const pickNot = (n, last) => (n <= 1 ? 0 : (last + 1 + Math.floor(Math.random() * (n - 1))) % n);

export class Chatter {
  // data: talk.json; sections(): loaded sections; player: { pos }; camera; bubbles (bubbles.js); kind(): who you play;
  // night(): 0..1; heard(step): a thread step was on screen; isHeard(step); enabled(): prefs.chatter; quiet(): true
  // while a near talk is open or another screen owns the view
  constructor({ data, sections, player, bubbles, kind = () => 'min', night = () => 0, heard = () => {}, isHeard = () => false,
    enabled = () => true, quiet = () => false }) {
    Object.assign(this, { sections, player, bubbles, kind, night, heard, isHeard, enabled, quiet });
    this.groups = (data?.chatter || []).map((g) => ({ ...g, rt: null, st: null }));
    this.barks = (data?.barks || []).map((b) => ({ ...b, roles: { one: b.role }, rt: null, st: null }));
    this.acc = 0;
    this.lastNew = -1e9;
    this.tier = 'mid';
    this.cfg = { ...DEFAULTS.mid };
    this.on = true; // the A/B switch for the cost runs (test.chatter)
    this.stats = { scans: 0, scanMs: 0, awake: 0, lines: 0, shown: 0, skipped: 0 };
    this.log = [];
  }

  get t() { return this.bubbles.t; }

  // a section's talk (assets/ui/talk/<section>.json), added as the section streams in
  add(data) {
    for (const g of data?.chatter || []) if (!this.groups.some((x) => x.id === g.id)) this.groups.push({ ...g, rt: null, st: null });
    for (const b of data?.barks || []) if (!this.barks.some((x) => x.id === b.id)) this.barks.push({ ...b, roles: { one: b.role }, rt: null, st: null });
  }

  // the calm budget: perMin new exchanges a minute on screen, at most BURST at once
  refill() {
    const now = this.t, rate = (this.cfg.perMin || 9) / 60;
    this.tokens = Math.min(BURST, (this.tokens ?? BURST) + (now - (this.tokAt ?? now)) * rate);
    this.tokAt = now;
  }

  // the device tier (detail.js): its numbers over DEFAULTS, counts times detailScale; live, no reload
  applyTier(cfg) {
    const name = DEFAULTS[cfg?.name] ? cfg.name : 'mid', k = cfg?.detailScale ?? 1;
    const c = { ...DEFAULTS[name], ...(cfg?.detail?.talk || {}) };
    c.chatterOpen = c.chatterOpen > 0 ? Math.max(1, Math.round(c.chatterOpen * k)) : 0;
    c.marks = Math.round((c.marks || 0) * k);
    c.gapScale = (c.gapScale || 1) / Math.max(0.25, k);
    c.scanHz = Math.min(10, Math.max(1, c.scanHz || 4)); // the contract: at most 10 Hz
    this.tier = name;
    this.cfg = c;
    // fewer chat bubbles now: the farthest go
    const chat = this.bubbles.list.filter((e) => e.owner === 'chat').sort((a, b) => b.dist - a.dist);
    for (const e of chat.slice(0, Math.max(0, chat.length - c.chatterOpen))) this.bubbles.drop(e);
  }

  update(dt) {
    this.acc += dt;
    if (this.acc < 1 / this.cfg.scanHz) return;
    this.acc = 0;
    const t0 = performance.now();
    this.scan();
    this.stats.scans++;
    this.stats.scanMs += performance.now() - t0;
  }

  scan() {
    const P = this.player.pos, secs = this.sections();
    const live = this.on && this.enabled() && this.cfg.chatterOpen > 0;
    const { wakeM: WAKE_M, showM: SHOW_M } = this.cfg;
    const silent = !live || this.quiet(); // exchanges go on, nothing is drawn
    if (!live) this.bubbles.dropWhere((e) => e.owner === 'chat');
    let awake = 0;
    for (const g of this.groups) {
      const sec = secs.get(g.section);
      if (!live || !sec?.persons) { if (g.st) this.sleep(g); continue; }
      const d = Math.hypot(g.X - P.x, -g.D - P.z);
      if (d > WAKE_M) { if (g.st) this.sleep(g); continue; }
      if (!g.st) this.wake(g);
      awake++;
      this.step(g, silent);
    }
    for (const b of this.barks) {
      const sec = secs.get(b.section);
      if (!live || !sec?.persons) { b.st = null; continue; }
      const rt = castOf(b, this.sections), p = rt?.roles.one.p;
      const X = p ? p.root.position.x : b.X, Z = p ? p.root.position.z : -b.D;
      const d = Math.hypot(X - P.x, Z - P.z);
      if (d > BARK_WAKE) { b.st = null; continue; }
      if (!b.st) b.st = { next: this.t + (b.close ? 0 : rnd(3, b.every[0])), armed: d > CLOSE_M + 1 };
      awake++;
      this.barkStep(b, d, silent);
    }
    this.stats.awake = awake;
    this.marks?.choose(silent);
  }

  wake(g) {
    // what was picked and shown last lives on the group, so a group you walk away from and back to doesn't repeat itself
    g.mem ??= { lastEx: -1, last: new Map(), said: new Map() };
    g.st = { next: this.t + rnd(0.5, g.gap[0]), cur: null, lastEx: g.mem.lastEx, last: g.mem.last, said: g.mem.said };
    // some groups are already talking when you arrive (they pick up mid-exchange)
    if (Math.random() < 0.35 && g.exchanges.length) this.begin(g, 1 + Math.floor(Math.random() * 2));
  }
  sleep(g) {
    this.bubbles.dropWhere((e) => e.group === g);
    g.st = null;
  }

  begin(g, at = 0) {
    const st = g.st, n = g.exchanges.length;
    let ex = pickNot(n, st.lastEx);
    // near you, a step of a plot line you have not heard comes first, more often than not
    const P = this.player.pos;
    if (Math.hypot(g.X - P.x, -g.D - P.z) < this.cfg.showM + 2 && Math.random() < 0.6) {
      const fresh = g.exchanges.map((e, i) => (e.step && !this.isHeard(e.step) && i !== st.lastEx ? i : -1)).filter((i) => i >= 0);
      if (fresh.length) ex = fresh[Math.floor(Math.random() * fresh.length)];
    }
    st.lastEx = g.mem.lastEx = ex;
    const E = g.exchanges[ex];
    const na = Math.max(...E.beats.map((b) => b.alts.length));
    let alt = E.linked ? pickNot(na, st.last.get(`${ex}`) ?? -1) : null;
    // a linked exchange: not the one whose first line its speaker was last seen saying
    const b0 = E.beats[0];
    if (alt != null && na > 1 && b0.alts[alt % b0.alts.length] === st.said.get(b0.who)) alt = pickNot(na, alt);
    if (alt != null) st.last.set(`${ex}`, alt);
    // the beat to play first: step() moves on to it at the next scan
    st.cur = { ex, bi: Math.min(at, E.beats.length - 1) - 1, at: this.t, alt };
  }

  step(g, silent) {
    const st = g.st;
    if (!st.cur) {
      if (this.t < st.next || !g.exchanges.length) return;
      this.begin(g);
    }
    if (this.t < st.cur.at) return;
    st.cur.bi++;
    const E = g.exchanges[st.cur.ex];
    if (st.cur.bi >= E.beats.length) {
      st.cur = null;
      st.next = this.t + rnd(g.gap[0], g.gap[1]) * (1 + 0.8 * (this.night?.() || 0)) * this.cfg.gapScale;
      return;
    }
    this.beat(g, silent);
  }

  // the current beat of a group's exchange: its line, its timing, and a bubble if you can see and hear it
  beat(g, silent) {
    const st = g.st, E = g.exchanges[st.cur.ex];
    const b = E.beats[st.cur.bi];
    const rt = castOf(g, this.sections), role = rt?.roles[b.who];
    const clip = (role?.p?.clip || '').split('~')[0]; // a contact variant (push~<figure>) is its base clip
    // a sleeper only thinks; a beat tied to clips waits for none: it is skipped
    if (!role || (!role.p && !role.carrier) || (b.when && !b.when.includes(clip)) || (!b.think && SLEEPY.test(clip))) {
      st.cur.at = this.t;
      this.stats.skipped++;
      return;
    }
    const kind = this.kind();
    const mine = b.as?.[kind];
    const alts = mine || b.alts, altsEn = (mine ? b.asEn?.[kind] : b.altsEn) || [];
    const lk = `${st.cur.ex}.${st.cur.bi}`;
    let i = st.cur.alt != null ? st.cur.alt % alts.length : pickNot(alts.length, st.last.get(lk) ?? -1);
    // never the line this speaker was last seen saying (a pick that wasn't drawn doesn't count as a change)
    if (st.cur.alt == null && alts.length > 1 && alts[i] === st.said.get(b.who)) i = pickNot(alts.length, i);
    st.last.set(lk, i);
    const text = alts[i], en = altsEn[i] || '', secs = readSecs(text);
    st.cur.role = role; // the intent mark (marks.js) hangs over whoever speaks
    const nb = E.beats[st.cur.bi + 1];
    st.cur.at = this.t + (b.wait ?? (nb && nb.who === b.who ? secs + 0.5 : secs * 0.72 + rnd(0.3, 1.0)));
    this.stats.lines++;
    if (!silent) this.offer({ g, role, who: b.who, text, en, think: !!b.think, secs, step: E.step, optional: b.optional });
  }

  barkStep(b, d, silent) {
    const st = b.st;
    if (b.close) {
      if (d > CLOSE_M + 1) st.armed = true;
      if (!st.armed || d > CLOSE_M || this.t < st.next) return;
      st.armed = false;
      st.next = this.t + b.every[0];
    } else {
      if (this.t < st.next) return;
      st.next = this.t + rnd(b.every[0], b.every[1]) * this.cfg.gapScale;
      if (d > this.cfg.barkM) return;
    }
    const rt = castOf(b, this.sections), role = rt?.roles.one, clip = (role?.p?.clip || '').split('~')[0];
    if (!role || (!role.p && !role.carrier) || (b.when && !b.when.includes(clip)) || (!b.think && SLEEPY.test(clip))) { this.stats.skipped++; return; }
    const mine = b.as?.[this.kind()];
    const alts = mine || b.alts, altsEn = (mine ? b.asEn?.[this.kind()] : b.altsEn) || [];
    b.mem ??= { last: -1, said: null };
    let i = pickNot(alts.length, b.mem.last);
    if (alts.length > 1 && alts[i] === b.mem.said) i = pickNot(alts.length, i);
    b.mem.last = i;
    this.stats.lines++;
    if (!silent) this.offer({ g: b, role, who: 'one', text: alts[i], en: altsEn[i] || '', think: !!b.think, secs: readSecs(alts[i]), step: b.step, bark: true });
  }

  // a line wants a bubble: only near you and on screen; a free slot, or the farthest chat bubble gives way to a nearer
  // speaker; one new chat bubble at most every MIN_NEW_S
  offer({ g, role, who, text, en = '', think, secs, step, bark = false }) {
    const at = headOfRole(role, v);
    if (!at) return;
    const P = this.player.pos, dist = Math.hypot(at.x - P.x, at.z - P.z);
    if (dist > this.cfg.showM) return;
    const s = this.bubbles.screen(at);
    if (!s.on) return;
    const key = `chat:${g.id}:${who}`;
    const B = this.bubbles;
    // a new exchange (or a bark) on screen spends a token; its next lines don't, so a dialogue that has begun goes on
    const cont = !bark && g.st?.cur?.shown;
    this.refill();
    if (!cont && this.tokens < 1) return;
    if (!B.get(key)) {
      if (this.t - this.lastNew < MIN_NEW_S && !B.list.some((e) => e.group === g)) return;
      if (B.list.length >= MAX_OPEN || B.count('chat') >= this.cfg.chatterOpen) {
        // the near talk's bubbles never give way here. A reply takes the place of its own group's older line (with one
        // chat bubble, on the light tier, the talk goes on line by line); else the farthest chat bubble that has had a
        // moment gives way to a nearer speaker
        const chat = B.list.filter((e) => e.owner === 'chat');
        const far = chat.filter((e) => e.group === g).sort((a, b) => a.born - b.born)[0]
          || chat.filter((e) => e.dist > dist + 1 && this.t - e.born > 1.2).sort((a, b) => b.dist - a.dist)[0];
        if (!far) return;
        B.drop(far);
      }
      this.lastNew = this.t;
    }
    const e = B.show({ key, owner: 'chat', head: (out) => headOfRole(role, out), text, think, name: role.name, en, nameEn: role.nameEn,
      until: this.t + secs + (withEnglish() ? 2.4 : 1.2), dist, gain: 0.55 });
    if (!e) return;
    if (!e.born || e.group !== g) e.born = this.t;
    e.group = g;
    if (!cont) this.tokens -= 1;
    if (!bark && g.st?.cur) g.st.cur.shown = true;
    if (bark) g.mem.said = text; else g.st.said.set(who, text);
    this.stats.shown++;
    this.log.push([+this.t.toFixed(2), bark ? 'bark' : 'chat', g.id, who, text]);
    if (this.log.length > 60) this.log.shift();
    if (step) this.heard(step);
  }

  state() {
    return {
      on: this.on && this.enabled(),
      tier: this.tier, cfg: this.cfg,
      awake: this.groups.filter((g) => g.st).map((g) => ({ id: g.id, cur: g.st.cur ? `${g.st.cur.ex}.${g.st.cur.bi}` : null, next: +(g.st.next - this.t).toFixed(1) })),
      barks: this.barks.filter((b) => b.st).map((b) => b.id),
      open: this.bubbles.list.map((e) => ({ key: e.key, owner: e.owner, text: e.text, dist: +(e.dist || 0).toFixed(1) })),
      stats: { ...this.stats, scanMsMean: this.stats.scans ? +(this.stats.scanMs / this.stats.scans).toFixed(4) : 0 },
      log: this.log.slice(-30),
    };
  }
}
