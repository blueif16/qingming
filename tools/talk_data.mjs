// The talk data (the life pass, gen/life/progress.md; standard gen/ui/STYLE.md §12): every section's talk.json (near
// talks, chatter, barks) and sections/world/talk.json (who-you-play kinds, plot lines), checked and bundled. Called by
// tools/ui_data.mjs (check | build) with its own `look` (simplified characters, digits, line lengths, glyph sets).
//
// sections/<folder>/talk.json
//   scenes:  near talks (press E): { id, title, host, reading, group?, roles: { key: { fig, name, src } },
//            beats: [{ who, say|think, src, optional?, as?: { kind: line }, only?: [kind], not?: [kind] }],
//            again?: [{ beats: [...], step? }], step? }
//   chatter: a group talking by itself: { id, title, group, reading, roles, gap?: [a, b] s,
//            exchanges: [{ beats: [{ who, say|think: line | [line...], src, optional?, when?: [clip], as?: { kind: [line] },
//            wait? }], linked?, step? }] }
//   barks:   a lone figure's word now and then: { id, who: { fig, name, src }, say|think: [line...], src, every?: [a, b],
//            close?, when?, as?, step? }
// sections/world/talk.json
//   kinds:   { avatar: kind } (kind: guan official, shi scholar, seng monk, fu woman, tong child, jun soldier,
//            li labourer, min anyone else), kindNames
//   threads: plot lines across the scroll: { id, title, lead, src, steps: [{ id, section, note, src }] }; a step is
//            heard through the scene, exchange or bark that carries its id in `step`
// English (the user, 2026-10-13: Chinese plus English): every shown string has an English gloss beside it, its key with
// the suffix _en (say_en, think_en, name_en, title_en, as_en, lead_en, note_en; parallel arrays for alternatives). The
// page shows it under the Chinese only when prefs.lang is 'zh_en'.
// Checks (FAIL): every speaker is a painted figure of that section's map (layout.json) placed by people.json; every line
// has a src; lines within the bubble's limit; a figure whose whole cycle is asleep only thinks; `when` names clips of
// the speaker's cycle; kinds are known; steps exist and every step is told somewhere in its section; ids unique.
import fs from 'node:fs';
import path from 'node:path';

export const KINDS = ['guan', 'shi', 'seng', 'fu', 'tong', 'jun', 'li', 'min'];
// a chatter group's intent mark (web/src/ui/marks.js PICTOS)
export const MARKS = ['coin', 'scale', 'bow', 'paper', 'zzz', 'alarm', 'cup', 'sack', 'book', 'boat', 'voice', 'flower', 'fan', 'wheel', 'rope', 'bowl'];
const SLEEPY = /sleep|doze/;
const LINE_MAX = 16, NAME_MAX = 4, TITLE_MAX = 8;

export function talkData({ ROOT, sections, read, fail, note, look, eager, lazyText, lazyNames }) {
  const world = read(path.join(ROOT, 'sections/world/talk.json')) || {};
  const bundle = { about: 'Built by tools/ui_data.mjs (tools/talk_data.mjs) from sections/*/talk.json; do not edit.', kinds: world.kinds || {}, threads: [], scenes: [], chatter: [], barks: [] };
  for (const [a, k] of Object.entries(bundle.kinds)) if (!KINDS.includes(k)) fail(`world/talk.json kinds: ${a} -> ${k} is not a kind (${KINDS.join(' ')})`);
  // the plot lines
  const lines = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  // the English gloss of a string (or of each alternative): present, parallel, short, no digits
  const EN_MAX = 72;
  let soft = false; // a section not yet written in the life pass (no chatter): its missing glosses are notes, not FAILs
  const en = (where, v, n, max = EN_MAX) => {
    const out = lines(v);
    if (out.length !== n) { (soft ? note : fail)(`${where}: ${out.length ? `${out.length} English glosses for ${n} lines` : 'no English gloss (_en)'}`); return out.length ? out : Array(n).fill(''); }
    for (const e of out) {
      if (typeof e !== 'string' || !e.trim()) fail(`${where}: empty English gloss`);
      else if (/[0-9]/.test(e)) fail(`${where}: digits in the English 「${e}」 (no numbers on screen)`);
      else if (e.length > max) fail(`${where}: English 「${e}」 is ${e.length} characters (at most ${max})`);
    }
    return out;
  };
  const steps = new Map(); // step id -> { thread, section, used }
  const ids = new Set();
  for (const th of world.threads || []) {
    const tag = `thread ${th.id}`;
    if (!th.id || ids.has(th.id)) fail(`${tag}: missing or repeated id`);
    ids.add(th.id);
    look(`${tag} title`, th.title, 6, lazyNames);
    look(`${tag} lead`, th.lead, 28, lazyText);
    if (!th.src) fail(`${tag}: no src`);
    if (!(th.steps?.length >= 2)) fail(`${tag}: a plot line needs at least two steps`);
    const out = { id: th.id, title: th.title, titleEn: en(`${tag} title`, th.title_en, 1)[0], lead: th.lead, leadEn: en(`${tag} lead`, th.lead_en, 1, 110)[0], steps: [] };
    for (const st of th.steps || []) {
      if (!st.id?.startsWith(`${th.id}.`)) fail(`${tag} step ${st.id}: its id must start with "${th.id}."`);
      if (steps.has(st.id)) fail(`${tag} step ${st.id}: repeated`);
      if (!sections.includes(st.section)) fail(`${tag} step ${st.id}: section ${st.section} is not a built section`);
      look(`${tag} step ${st.id} note`, st.note, 24, lazyText);
      if (!st.src) fail(`${tag} step ${st.id}: no src`);
      steps.set(st.id, { thread: th.id, section: st.section, used: 0 });
      out.steps.push({ id: st.id, section: st.section, note: st.note, noteEn: en(`${tag} step ${st.id} note`, st.note_en, 1, 110)[0] });
    }
    bundle.threads.push(out);
  }
  const useStep = (where, section, step) => {
    if (step == null) return null;
    const s = steps.get(step);
    if (!s) { fail(`${where}: step ${step} is not a step of any plot line (sections/world/talk.json threads)`); return null; }
    if (s.section !== section) fail(`${where}: step ${step} belongs to ${s.section}, not ${section}`);
    s.used++;
    return step;
  };
  const kindsOk = (where, keys) => { for (const k of keys || []) if (!KINDS.includes(k)) fail(`${where}: ${k} is not a kind (${KINDS.join(' ')})`); };

  const seen = new Set();
  const uniq = (where, id) => { if (!id || seen.has(id)) fail(`${where}: missing or repeated id ${id}`); seen.add(id); };
  let nLines = 0;

  for (const name of sections) {
    const tk = read(path.join(ROOT, 'sections', name, 'talk.json'));
    if (!tk) { note(`${name}: no talk.json`); continue; }
    soft = !tk.chatter;
    if (soft) note(`${name}: talk.json not yet written in the life pass (no chatter)`);
    const L = read(path.join(ROOT, 'sections', name, 'layout.json'));
    const P = read(path.join(ROOT, 'sections', name, 'people.json')) || {};
    const figs = new Map((L.figures || []).map((f) => [f.id, f]));
    const walkers = new Map((P.walkers || []).map((w) => [w.id, w]));
    // what a figure plays: its cycle's clips
    const clipsOf = (fig) => {
      const sp = P.figures?.[fig], wk = walkers.get(fig);
      // a clip variant (`push~<figure>`, `sit~soles`: the contact pass's IK variants) is its base clip
      const base = (c) => String(c).split('~')[0];
      if (sp) return (sp.do || (sp.ride ? [['ride', 8]] : [['idle', 6]])).map(([c]) => base(c));
      if (wk) return [wk.clip, ...(wk.pause ? [wk.pause[0]] : [])].map(base);
      return null;
    };
    const pos = (fig) => { const f = figs.get(fig); if (!f) return null; const [nx, nd] = P.figures?.[fig]?.nudge || [0, 0]; return [f.X + nx, f.D + nd]; };
    const role = (where, r) => {
      if (!r?.fig) { fail(`${where}: no fig`); return null; }
      const f = figs.get(r.fig), spec = P.figures?.[r.fig];
      if (!f) fail(`${where}: ${r.fig} is not a painted figure of ${name} (layout.json)`);
      else if (!spec && !walkers.has(r.fig)) fail(`${where}: ${r.fig} is not placed by people.json`);
      if (r.name) look(`${where} name`, r.name, NAME_MAX, lazyNames);
      if (!r.src) fail(`${where}: no src`);
      return { fig: r.fig, name: r.name || '', nameEn: r.name ? en(`${where} name`, r.name_en, 1)[0] : '', carriedBy: spec?.carried_by || null };
    };
    const roleTable = (tag, roles) => {
      const out = {};
      for (const [k, r] of Object.entries(roles || {})) { const x = role(`${tag} role ${k}`, r); if (x) out[k] = x; }
      return out;
    };
    // one beat's line(s): length, glyphs, the speaker able to say it
    const beatLines = (where, b, fig, max = 4) => {
      const think = b.think != null;
      const alts = lines(b.say ?? b.think);
      if (!alts.length) fail(`${where}: no line`);
      if (alts.length > max) fail(`${where}: ${alts.length} alternatives (at most ${max})`);
      alts.forEach((s, i) => look(`${where}${alts.length > 1 ? ` alt ${i + 1}` : ''}`, s, LINE_MAX, lazyText));
      if (!b.src) fail(`${where}: no src (every line cites its reading)`);
      const clips = fig ? clipsOf(fig) : null;
      if (clips && !think && clips.every((c) => SLEEPY.test(c))) fail(`${where}: ${fig} sleeps through its whole cycle (${clips.join(', ')}): it can only think`);
      if (b.when) {
        if (!clips) fail(`${where}: when given, but ${fig} plays nothing`);
        // people.json is another session's and its cycles change: a line whose clip is gone is never said (the chatter
        // skips it), so it is a note to revisit, not a FAIL
        else if (!b.when.some((c) => clips.includes(c))) note(`${where}: never said now: when ${b.when.join(',')} never happens (${fig} plays ${clips.join(', ')})`);
      }
      const altsEn = en(where, b.say_en ?? b.think_en, alts.length);
      const as = {}, asEn = {};
      kindsOk(`${where} as`, Object.keys(b.as || {}));
      for (const [k, v] of Object.entries(b.as || {})) {
        as[k] = lines(v);
        as[k].forEach((s) => look(`${where} as ${k}`, s, LINE_MAX, lazyText));
        asEn[k] = en(`${where} as ${k}`, b.as_en?.[k], as[k].length);
      }
      for (const k of Object.keys(b.as_en || {})) if (!b.as?.[k]) fail(`${where}: as_en.${k} without as.${k}`);
      kindsOk(`${where} only`, b.only); kindsOk(`${where} not`, b.not);
      nLines += alts.length + Object.values(as).reduce((a, x) => a + x.length, 0);
      return { alts, altsEn, think, as: Object.keys(as).length ? as : undefined, asEn: Object.keys(as).length ? asEn : undefined };
    };

    // ---- near talks
    for (const sc of tk.scenes || []) {
      const tag = `${name} talk ${sc.id}`;
      uniq(tag, sc.id);
      if (!sc.reading) fail(`${tag}: no reading`);
      if (!sc.roles?.[sc.host]) fail(`${tag}: host ${sc.host} is not a role`);
      look(`${tag} title`, sc.title, TITLE_MAX, lazyNames);
      const roles = roleTable(tag, sc.roles);
      const set = (list, label) => {
        const beats = [];
        for (const [i, b] of (list || []).entries()) {
          const w = `${tag}${label} beat ${i + 1}`;
          if (!roles[b.who]) { fail(`${w}: speaker ${b.who} is not a role`); continue; }
          const r = beatLines(w, b, roles[b.who].fig, 1);
          beats.push({ who: b.who, text: r.alts[0], en: r.altsEn[0], think: r.think, optional: !!b.optional,
            ...(r.as ? { as: Object.fromEntries(Object.entries(r.as).map(([k, v]) => [k, v[0]])), asEn: Object.fromEntries(Object.entries(r.asEn).map(([k, v]) => [k, v[0]])) } : {}),
            ...(b.only ? { only: b.only } : {}), ...(b.not ? { not: b.not } : {}) });
        }
        // every kind of player gets two to six beats
        for (const k of KINDS) {
          const n = beats.filter((b) => (!b.only || b.only.includes(k)) && !(b.not && b.not.includes(k))).length;
          if (n < 2 || n > 6) fail(`${tag}${label}: ${n} beats for a player of kind ${k} (2-6)`);
        }
        return beats;
      };
      const beats = set(sc.beats, '');
      const again = (sc.again || []).map((a, i) => ({ beats: set(a.beats, ` again ${i + 1}`), ...(a.step ? { step: useStep(`${tag} again ${i + 1}`, name, a.step) } : {}) }));
      const host = roles[sc.host] && pos(roles[sc.host].fig);
      bundle.scenes.push({ id: sc.id, section: name, title: sc.title, titleEn: en(`${tag} title`, sc.title_en, 1)[0], host: sc.host, roles, beats, ...(again.length ? { again } : {}),
        ...(sc.step ? { step: useStep(tag, name, sc.step) } : {}), X: host?.[0], D: host?.[1] });
    }

    // ---- chatter
    for (const g of tk.chatter || []) {
      const tag = `${name} chatter ${g.id}`;
      uniq(tag, g.id);
      if (!g.reading) fail(`${tag}: no reading`);
      look(`${tag} title`, g.title, TITLE_MAX, new Set()); // a chatter group's title is the writers' (never shown)
      const roles = roleTable(tag, g.roles);
      if (Object.keys(roles).length < 1) fail(`${tag}: no roles`);
      const gap = g.gap || [10, 26];
      if (!(gap[0] >= 4 && gap[1] >= gap[0])) fail(`${tag}: gap ${gap} (seconds of quiet between exchanges, at least 4)`);
      const exchanges = [];
      if (!(g.exchanges?.length >= 1)) fail(`${tag}: no exchanges`);
      for (const [j, ex] of (g.exchanges || []).entries()) {
        const et = `${tag} exchange ${j + 1}`;
        if (!(ex.beats?.length >= 1 && ex.beats.length <= 5)) fail(`${et}: ${ex.beats?.length || 0} beats (1-5)`);
        const beats = [];
        for (const [i, b] of (ex.beats || []).entries()) {
          const w = `${et} beat ${i + 1}`;
          if (!roles[b.who]) { fail(`${w}: speaker ${b.who} is not a role`); continue; }
          const r = beatLines(w, b, roles[b.who].fig);
          beats.push({ who: b.who, alts: r.alts, altsEn: r.altsEn, think: r.think, ...(b.optional ? { optional: true } : {}), ...(b.when ? { when: b.when } : {}),
            ...(r.as ? { as: r.as, asEn: r.asEn } : {}), ...(b.wait != null ? { wait: b.wait } : {}) });
        }
        exchanges.push({ beats, ...(ex.linked ? { linked: true } : {}), ...(ex.step ? { step: useStep(et, name, ex.step) } : {}) });
      }
      const pts = Object.values(roles).map((r) => pos(r.fig)).filter(Boolean);
      const X = pts.reduce((a, p) => a + p[0], 0) / Math.max(1, pts.length), D = pts.reduce((a, p) => a + p[1], 0) / Math.max(1, pts.length);
      en(`${tag} title`, g.title_en, 1);
      if (g.mark != null && !MARKS.includes(g.mark)) fail(`${tag}: mark ${g.mark} is not a pictogram (${MARKS.join(' ')})`);
      bundle.chatter.push({ id: g.id, section: name, ...(g.mark ? { mark: g.mark } : {}), roles, X: +X.toFixed(2), D: +D.toFixed(2), gap, exchanges });
    }

    // ---- barks
    for (const b of tk.barks || []) {
      const tag = `${name} bark ${b.id}`;
      uniq(tag, b.id);
      const r = role(`${tag} who`, b.who);
      if (!r) continue;
      const every = b.every || [50, 120];
      if (!(every[0] >= (b.close ? 20 : 30) && every[1] >= every[0])) fail(`${tag}: every ${every} (rare: at least ${b.close ? 20 : 30} s)`);
      const x = beatLines(tag, b, r.fig);
      const p = pos(r.fig);
      bundle.barks.push({ id: b.id, section: name, role: r, alts: x.alts, altsEn: x.altsEn, think: x.think, every, ...(b.close ? { close: true } : {}),
        ...(b.when ? { when: b.when } : {}), ...(x.as ? { as: x.as, asEn: x.asEn } : {}), ...(b.step ? { step: useStep(tag, name, b.step) } : {}), X: p?.[0], D: p?.[1] });
    }
  }
  for (const [id, s] of steps) {
    if (s.used) continue;
    const has = !!read(path.join(ROOT, 'sections', s.section, 'talk.json'))?.chatter;
    (has ? fail : note)(`plot line step ${id}: told nowhere (no scene, exchange or bark in ${s.section} has step "${id}")${has ? '' : ': its section is not written yet'}`);
  }
  return { bundle, nLines };
}

// the glyphs a font's @font-face rules cover (web/public/assets/ui/fonts/fonts.css), by family
export function fontCoverage(ROOT) {
  const css = path.join(ROOT, 'web/public/assets/ui/fonts/fonts.css');
  if (!fs.existsSync(css)) return null;
  const out = new Map();
  for (const m of fs.readFileSync(css, 'utf8').matchAll(/font-family:\s*"([^"]+)"[\s\S]*?unicode-range:\s*([^;]+);/g)) {
    const set = out.get(m[1]) || new Set();
    for (const part of m[2].split(',')) {
      const [a, b] = part.trim().replace(/^U\+/i, '').split('-').map((x) => parseInt(x, 16));
      for (let c = a; c <= (b ?? a); c++) set.add(c);
    }
    out.set(m[1], set);
  }
  return out;
}
