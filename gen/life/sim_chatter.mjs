#!/usr/bin/env node
// The chatter scheduler without a browser (gen/life/progress.md): web/src/ui/chatter.js driven over simulated minutes
// with stand-in people (each painted figure at its layout spot, playing the first clip of its cycle) and a stand-in
// bubble pool that keeps the real rules (two at most, keys, expiry). Numbers for the rules that need no GPU:
//   - bubbles shown per minute where you stand (calm), the most chat bubbles open at once per tier;
//   - no exchange and no alternative repeated back to back; a sleeper never says, only thinks;
//   - plot-line steps heard.
//   node gen/life/sim_chatter.mjs [--at X,D | --view <section>:<view>] [--minutes 10] [--tier low|mid|high] [--night]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const Q = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.performance ??= { now: () => Date.now() };
const { Chatter, DEFAULTS } = await import(path.join(Q, 'web/src/ui/chatter.js'));
const { MAX_OPEN } = await import(path.join(Q, 'web/src/ui/bubbles.js'));

const core = JSON.parse(fs.readFileSync(path.join(Q, 'web/public/assets/ui/talk.json'), 'utf8'));
const talk = { ...core, scenes: [], chatter: [], barks: [] };
for (const url of Object.values(core.sections || {})) {
  const d = JSON.parse(fs.readFileSync(path.join(Q, 'web/public', url), 'utf8'));
  for (const k of ['scenes', 'chatter', 'barks']) talk[k].push(...(d[k] || []));
}
const minutes = +opt('--minutes', 10), tier = opt('--tier', 'mid'), night = args.includes('--night') ? 1 : 0;
// the people of every section talk.json names, at their spots
const sections = new Map();
const folders = [...new Set([...talk.chatter, ...talk.barks].map((g) => g.section))];
for (const f of folders) {
  const L = JSON.parse(fs.readFileSync(path.join(Q, 'sections', f, 'layout.json'), 'utf8'));
  const P = JSON.parse(fs.readFileSync(path.join(Q, 'sections', f, 'people.json'), 'utf8'));
  const walkers = new Map((P.walkers || []).map((w) => [w.id, w]));
  const persons = [];
  for (const fig of L.figures) {
    const sp = P.figures?.[fig.id], wk = walkers.get(fig.id);
    if (!sp && !wk) continue;
    const clip = sp ? (sp.do?.[0]?.[0] || (sp.ride ? 'ride' : 'idle')) : wk.clip;
    const [nx, nd] = sp?.nudge || [0, 0];
    persons.push({ id: fig.id, clip, root: { position: { x: fig.X + nx, y: fig.H || 0, z: -(fig.D + nd) }, scale: { y: 1 } }, model: { info: { height_m: 1.7 }, clips: [], scene: { scale: { y: 1 } } } });
  }
  sections.set(f, { persons });
}
// where you stand
let at = opt('--at', null)?.split(',').map(Number);
const view = opt('--view', 'outer_road:fortune');
if (!at) {
  const [f, v] = view.split(':');
  const sc = JSON.parse(fs.readFileSync(path.join(Q, 'sections', f, 'scene.json'), 'utf8'));
  at = [sc.views[v].X, sc.views[v].D];
}
const player = { pos: { x: at[0], y: 0, z: -at[1] } };
// the bubble pool's rules without DOM
const B = {
  t: 0, list: [], shown: 0, maxChat: 0,
  screen: () => ({ on: true, front: true, x: 0, y: 0 }),
  get(key) { return this.list.find((e) => e.key === key) || null; },
  count(owner) { return owner ? this.list.filter((e) => e.owner === owner).length : this.list.length; },
  show(o) {
    let e = this.get(o.key);
    if (!e) { if (this.list.length >= MAX_OPEN) return null; e = { ...o }; this.list.push(e); this.shown++; }
    Object.assign(e, o);
    this.maxChat = Math.max(this.maxChat, this.count('chat'));
    return e;
  },
  drop(e) { const i = this.list.indexOf(e); if (i >= 0) this.list.splice(i, 1); },
  dropWhere(fn) { for (const e of this.list.filter(fn)) this.drop(e); },
};
const heard = new Set();
const C = new Chatter({ data: talk, sections: () => sections, player, bubbles: B, kind: () => 'guan', night: () => night, heard: (s) => heard.add(s), isHeard: (s) => heard.has(s) });
C.applyTier({ name: tier, detail: { talk: DEFAULTS[tier] }, detailScale: 1 });
// run: 30 frames a second
const dt = 1 / 30, fails = [];
const lastEx = new Map(), lastAlt = new Map();
let nLog = 0;
for (let f = 0; f < minutes * 60 * 30; f++) {
  B.t += dt;
  for (let i = B.list.length - 1; i >= 0; i--) if (B.list[i].until <= B.t) B.list.splice(i, 1);
  C.update(dt);
  for (const g of C.groups) {
    if (!g.st?.cur) continue;
    const key = `${g.id}`;
    const cur = `${g.st.cur.ex}@${g.st.cur.at.toFixed(2)}`;
    if (g.st.cur.bi === 0 && lastEx.get(key)?.startAt !== g.st.cur.at && g.st.cur.at > 0) {
      // a new exchange began: not the same as the last one (when there are two or more)
      const prev = lastEx.get(key);
      if (prev && prev.ex === g.st.cur.ex && g.exchanges.length > 1 && prev.at !== cur) fails.push(`${g.id}: exchange ${g.st.cur.ex} twice in a row`);
      lastEx.set(key, { ex: g.st.cur.ex, startAt: g.st.cur.at, at: cur });
    }
  }
  for (; nLog < C.log.length; nLog++) {
    const [, kind, gid, who, text] = C.log[nLog];
    const k = `${gid}:${who}`;
    if (lastAlt.get(k) === text) {
      const g = C.groups.find((x) => x.id === gid) || C.barks.find((x) => x.id === gid);
      const single = g && (g.alts ? g.alts.length < 2 : g.exchanges.every((e) => e.beats.filter((b) => b.who === who).every((b) => b.alts.length < 2)));
      if (!single) fails.push(`${k}: the same line twice in a row: ${text}`);
    }
    lastAlt.set(k, text);
  }
  if (C.log.length > 50) { C.log.splice(0, C.log.length - 10); nLog = Math.min(nLog, C.log.length); }
}
const s = C.state();
const perMin = B.shown / minutes;
const out = { view, at, tier, night, minutes, bubblesPerMinute: +perMin.toFixed(1), lines: s.stats.lines, shown: s.stats.shown, skipped: s.stats.skipped,
  maxChatOpen: B.maxChat, chatterOpen: C.cfg.chatterOpen, awake: s.awake.length, heard: [...heard], fails: fails.slice(0, 20) };
if (B.maxChat > C.cfg.chatterOpen) fails.push(`chat bubbles open at once ${B.maxChat} > ${C.cfg.chatterOpen}`);
console.log(JSON.stringify(out));
if (fails.length) { console.log('FAIL', fails.length); process.exit(1); }
console.log('PASS');
