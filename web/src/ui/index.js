// The ink UI on the world page (gen/ui/STYLE.md): loading/title screen, region banners and landmark toasts, near
// conversations with name tags and bubbles, the controls help, and the restyle of the page's existing chrome (sundial
// frame, bell, scroll HUD, tuning panel, stats made debug-only). world.js makes one with createUI() and calls:
//   ui.progress(f)   loading milestones (0..1)        ui.loaded()   the world is in: the paper wipes away
//   ui.frame(dt)     every drawn frame (not while the scroll HUD is open)
//   ui.regionTitle(folder)   the region's 繁體 name, for the scroll HUD's title
//   ui.test          hooks for the checks and the shots (banner, toast, talk, state)
// URL: ?stats=1 shows the debug stats line; ?ui=0 leaves out the notifications and talk (A/B; the restyle stays).
import './ui.css';
import { applyInk } from './ink.js';
import { h, helpPanel, isTouchDevice } from './components.js';
import { Loading } from './loading.js';
import { Places } from './places.js';
import { Talk } from './talk.js';
import { Bubbles } from './bubbles.js';
import { Chatter } from './chatter.js';
import { Marks } from './marks.js';
import './life.css';
import { register as registerDetail } from '../detail.js';
import { W } from './words.js';
import { createHud } from './hud.js';
import { prefs } from './prefs.js';
import { Steady } from './steady.js';

const THEMES = {
  day: { paper: '#efe4cc', bubble: '#f7efdc', ink: '#2a2420' },
  night: { paper: '#e8d9b8', bubble: '#efe2c4', ink: '#2a2420' },
};
const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

// o: { camera, player, sections() (loaded: name -> sec), current() (your section's folder), night() (0..1),
//      ahead() (a section you stand in or near still loading: the 前路漸展 note),
//      hudOpen(), sfx(name, gain), hud (the ScrollHud, for its chrome), query (URLSearchParams),
//      settings: { s, set(k, v), reset() } (world.js's tuning object and its one setter), time (the time agent's
//      object, r2_time.md), sound() (sound.js, once built), canvas (for the pointer lock), tune: { get, set } (the
//      lil-gui panel behind ?tune=1), sky: { get, set } (鳥瞰, birdseye.js) }: the direct HUD and the settings screen
//      (hud.js, settings_screen.js)
export function createUI(o) {
  const html = document.documentElement, query = o.query || new URLSearchParams(location.search);
  const touch = isTouchDevice();
  const off = query.get('ui') === '0';
  if (query.get('stats') === '1') html.classList.add('qm-debug');
  if (touch) html.classList.add('qm-touch');
  let theme = 'day';
  applyInk(html, THEMES.day);
  const loading = new Loading(document.getElementById('loading'));

  const root = h('div', 'qm-ui', { id: 'qm-ui' });
  const banner = h('div', 'qm-banner-layer'), toasts = h('div', 'qm-toasts'), anchors = h('div', 'qm-anchors');
  root.append(anchors, banner, toasts);
  document.body.append(root);

  // the 圖志 journal (journal.js; lore agent, gen/ui/r2_lore.md): a lazy chunk, made on the first J, toast foot or settings
  // row. lore.json (the long texts) is fetched once, by the first unfolded toast or the journal, never at first load.
  let loreP = null, jn = null, jnLoading = null, placesData = null, talkData = null;
  const lore = () => (loreP ??= json('assets/ui/lore.json'));
  const journal = {
    isOpen: () => !!jn?.isOpen,
    async open(opts = {}) {
      if (off || o.hudOpen() || dhud.isOpen()) return;
      await talkAll().catch(() => {}); // every section's talks, for the 見聞 leaf
      jnLoading ??= import('./journal.js').then((m) => (jn = new m.Journal({ places: placesData, talk: talkData, data: () => ({ places: placesData, talk: talkData }), lore, player: o.player,
        canvas: o.canvas || o.hud?.canvas, touch, sfx: o.sfx })));
      try { await jnLoading; } catch (err) { console.warn('journal failed to load:', err); jnLoading = null; return; }
      return jn.open(opts);
    },
    close: (opts) => jn?.close(opts),
    toggle(opts) { return jn?.isOpen ? jn.close(opts) : journal.open(opts); },
    state: () => jn?.state() ?? { open: false },
  };
  // J's tap target on a touch screen: a 志 seal beside the 說明 seal (places.css)
  if (touch && !off) {
    const jb = h('button', 'qm-ringbtn qm-jn-open', { type: 'button', title: W.lore.journalAria, 'aria-label': W.lore.journalAria },
      [h('span', 'qm-seal', { text: W.lore.journalSeal, 'aria-hidden': 'true' })]);
    jb.addEventListener('pointerdown', (e) => e.stopPropagation());
    jb.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    jb.addEventListener('click', (e) => { e.stopPropagation(); journal.toggle(); });
    document.body.append(jb);
  }

  // the controls help (STYLE.md §14): open on the first visit until you have walked a while (at least HELP_MIN s and
  // HELP_WALK m, or HELP_MAX s), then folded into its 說明 seal for good (prefs.helpSeen, also set by any fold); later
  // visits start folded, the seal stamping in once. H (or ?), the seal, or the settings' 說明 row open it again.
  const HELP_MIN = 25, HELP_WALK = 12, HELP_MAX = 75;
  const helpHost = document.getElementById('help');
  const firstVisit = !prefs.get('helpSeen');
  const help = helpHost ? helpPanel(helpHost, { touch, open: firstVisit }) : null;
  let helpT = firstVisit ? 0 : -1, walked = 0, last = null;
  if (help) help.onchange = (open) => { if (!open && helpT >= 0) { helpT = -1; prefs.set('helpSeen', true); } };
  // the direct HUD (hud.js): the view tiles and the › to the settings screen, by the time instrument (#dial)
  const dhud = createHud({
    view: { get: () => o.settings?.s.view, set: (v) => o.settings?.set('view', v) },
    sky: o.sky,
    hudOpen: () => o.hudOpen(),
    blocked: () => journal.isOpen(),
    settings: o.settings ? { world: o.settings, time: o.time, sound: o.sound, player: o.player, canvas: o.canvas || o.hud?.canvas,
      help: () => help, journal: () => ui?.journal ?? null, tune: o.tune, touch } : null,
  });
  if (o.hud) o.hud.blocked = () => dhud.isOpen() || journal.isOpen(); // no scroll HUD (Space) over the settings screen or the journal
  addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    if (dhud.isOpen()) return; // the settings screen takes its own keys
    if ((e.key === '?' || (e.code === 'Slash' && e.shiftKey) || e.code === 'KeyH') && !o.hudOpen()) help?.toggle();
    if (o.hudOpen()) return;
    if (journal.isOpen()) return; // the journal takes its own keys (journal.js: J or Esc close it)
    if (e.code === 'KeyJ') { journal.open(); return; }
    if (e.code === 'KeyE') talk?.interact();
    if (e.code === 'Escape') talk?.close();
  });

  // the scroll HUD's chrome in 繁體 (its own words stay in scroll_hud.js; the title comes from regionTitle)
  if (o.hud?.root) {
    const hint = o.hud.root.querySelector('.sh-hint'), credit = o.hud.root.querySelector('.sh-credit');
    const [zh, en] = touch ? W.hud.hintTouch : o.hud.tune ? W.hud.hintTune : W.hud.hintDesktop;
    if (hint) hint.replaceChildren(zh, h('span', 'qm-gloss', { text: en }));
    if (credit) credit.textContent = W.hud.credit;
  }

  let places = null, talk = null, chatter = null, bubbles = null, marks = null;
  // who you play (the life pass, gen/life/progress.md): the avatar's kind, from talk.json's table (guan, shi, seng, fu,
  // tong, jun, li, min); the painted people answer each kind in its own words
  const kind = () => (query.get('talk') !== '0' && talkData?.kinds?.[o.settings?.s?.avatar]) || 'min';
  // a plot line's step overheard (a chatter exchange, a bark or a near talk with a `step`): into the 圖志, with a small
  // ink note the first time (no counter, no quest log: STYLE.md §9, §15)
  let heardEl = null, heardTimer = 0;
  const heard = (step) => {
    const key = `h:${step}`;
    if (!places || places.found.has(key)) return;
    places.discover(key);
    const th = (talkData?.threads || []).find((x) => x.steps.some((st) => st.id === step));
    if (!th || !(prefs.get('placeNotes') ?? true)) return;
    heardEl?.remove();
    heardEl = h('div', 'qm-heard qm-slip', { role: 'status', 'aria-live': 'polite' }, [
      h('span', 'qm-seal', { text: W.heard.seal, 'aria-hidden': 'true' }),
      h('span', 'qm-heard-text', {}, [h('b', '', { text: th.title }), h('span', '', { text: W.heard.line }),
        (prefs.get('lang') ?? 'zh') === 'zh_en' && th.titleEn ? h('i', '', { text: `${th.titleEn}: ${W.heard.lineEn}`, lang: 'en' }) : null]),
    ]);
    root.append(heardEl);
    o.sfx('bubble_tap', 0.4);
    clearTimeout(heardTimer);
    const el = heardEl;
    heardTimer = setTimeout(() => { el.classList.add('qm-out'); setTimeout(() => el.remove(), 650); }, 3600);
  };
  // the way ahead still coming in (the user, 2026-10-13: at the end of a section the walk sometimes stopped while the
  // next one loaded): a small ink slip, bottom centre, a brush ring turning beside 前路漸展 (中英: its gloss under it).
  // o.ahead() (world.js) is true while a section you stand in or near isn't in yet. The slip shows only when the wait is
  // real (true for showAfter s: a section that comes in in time never flashes it) and stays a moment once up (steady.js).
  const RING = '<svg viewBox="0 0 24 24"><circle class="qm-ahead-groove" cx="12" cy="12" r="8.6"/><circle class="qm-ahead-brush" cx="12" cy="12" r="8.6" pathLength="100"/></svg>';
  const aheadSteady = new Steady({ max: 1, showAfter: 0.6, hideAfter: 0.4, minOn: 1.6, minOff: 1.0 });
  let aheadEl = null, aheadAcc = 0, aheadT = 0;
  const aheadNote = (dt) => {
    aheadT += dt;
    aheadAcc += dt;
    if (aheadAcc < 0.25 || !o.ahead) return;
    aheadAcc = 0;
    const want = !!o.ahead();
    const on = aheadSteady.update(aheadT, [{ key: 'ahead', score: 0, ok: want, keep: want }]).size > 0;
    if (on && !aheadEl) {
      aheadEl = h('div', 'qm-ahead qm-slip', { role: 'status', 'aria-live': 'polite' }, [
        h('span', 'qm-ahead-ring', { html: RING, 'aria-hidden': 'true' }),
        h('span', 'qm-ahead-text', {}, [h('b', '', { text: W.ahead.line }),
          (prefs.get('lang') ?? 'zh') === 'zh_en' ? h('i', 'qm-gloss', { text: W.ahead.en, lang: 'en' }) : null]),
      ]);
      root.append(aheadEl);
    } else if (!on && aheadEl) {
      const el = aheadEl;
      aheadEl = null;
      el.classList.add('qm-out');
      setTimeout(() => el.remove(), 650);
    }
  };
  const ready = json('assets/ui/places.json').then((pl) => {
    if (off) return;
    const where = () => { const p = o.player.pos; return { X: p.x, D: -p.z, H: p.y }; };
    places = new Places({ layer: { banner, toasts, anchors }, data: pl, current: o.current, where, sfx: o.sfx, camera: o.camera, bvh: () => o.player.bvh,
      lore, touch, blocked: () => o.hudOpen() || dhud.isOpen() || journal.isOpen(), journal: (id) => journal.open({ at: id }) });
    placesData = pl;
    if (o.hud) o.hud.decorate = (...a) => places.hudMarks(...a);
  });
  // talk.json (who you play, the plot lines, an index) comes after the places; each section's near talks, chatter and
  // barks (assets/ui/talk/<section>.json) are fetched as that section streams in (talkSync), all of them only when the
  // journal opens (its 見聞 leaf lists every talk)
  // On by default since the user's sign-off (2026-10-13): everything new in the life layer (chatter, barks, the new near
  // talks, who-you-play lines, again sets, plot lines and their journal block, intent marks, the 扮作 and 街談 settings
  // rows). ?talk=0: the page as before, the six press-E scenes of the ink UI round with their first lines only (their
  // English glosses are fine), no chatter, no plot lines.
  const life = query.get('talk') !== '0';
  const ORIGINAL = ['V5.1', 'V5.5', 'V5.11', 'V6.5', 'V6.2', 'V4.2'];
  const asBefore = (d) => ({ scenes: (d.scenes || []).filter((x) => ORIGINAL.includes(x.id)).map(({ again, step, ...x }) => ({
    ...x, beats: x.beats.filter((b) => !b.only).map(({ as, asEn, only, not, ...b }) => b) })) });
  const talkFiles = new Map(); // section -> Promise
  const talkOf = (sec) => {
    const url = talkData?.sections?.[sec];
    if (!url || talkFiles.has(sec)) return talkFiles.get(sec) ?? Promise.resolve();
    const p = json(url).then((d) => { if (d) { talk?.add(life ? d : asBefore(d)); if (life) chatter?.add(d); } });
    talkFiles.set(sec, p);
    return p;
  };
  const talkAll = () => Promise.all(Object.keys(talkData?.sections || {}).map(talkOf));
  let talkSyncT = 0;
  const talkSync = (dt) => { talkSyncT -= dt; if (talkSyncT > 0 || !talkData) return; talkSyncT = 1; for (const sec of o.sections().keys()) talkOf(sec); };
  const talkReady = Promise.all([ready, json('assets/ui/talk.json')]).then(([, tk]) => {
    if (off || !places) return;
    if (!life) tk.threads = []; // no plot lines (nor their journal block, nor the heard note) with ?talk=0
    talkData = tk;
    bubbles = new Bubbles({ layer: anchors, camera: o.camera, touch, sfx: o.sfx });
    talk = new Talk({ layer: anchors, data: tk, sections: o.sections, player: o.player, camera: o.camera, bubbles, sfx: o.sfx, touch, kind, heard });
    tk.scenes = talk.scenes; // the journal's 見聞 reads the scenes as they come in
    chatter = new Chatter({ data: tk, sections: o.sections, player: o.player, bubbles, kind, heard, night: () => o.night?.() ?? 0,
      isHeard: (step) => places.found.has(`h:${step}`), enabled: () => life && prefs.get('chatter') !== false,
      quiet: () => !!talk.conv || journal.isOpen() || dhud.isOpen() });
    // intent marks over groups up to something, seen from beyond earshot (marks.js; the tier's detail.talk.marks)
    marks = chatter.marks = new Marks({ layer: anchors, chatter, camera: o.camera, player: o.player, bvh: () => o.player.bvh });
    // the device tier (gen/details/tier_contract.md, detail.js): the chatter's numbers re-scale live; its stats() is in
    // __test.details(): open bubbles as instances, the life layer's CPU per frame (talk + chatter + bubbles)
    registerDetail('talk', {
      applyTier: (cfg) => chatter.applyTier(cfg),
      stats: () => ({ draws: 0, triangles: 0, instances: bubbles.list.length + marks.shown.size, marks: marks.shown.size, cpuMs: +(lifeCost.n ? lifeCost.ms / lifeCost.n : 0).toFixed(4),
        scheduled: chatter.state().awake.length, tier: chatter.tier, chatterOpen: chatter.cfg.chatterOpen,
        life, chatter: life ? chatter.groups.length : 0, barks: life ? chatter.barks.length : 0, scenes: talk.scenes.length }),
    });
    // the journal's memory and the painting's marks (lore agent): a conversation heard goes in 見聞; the scroll HUD draws
    // a cinnabar seal on each landmark reached (scroll_hud.js calls hud.decorate)
    const start = talk.start.bind(talk);
    talk.start = (sc) => { const ok = start(sc); if (ok) places.discover(`t:${sc.id}`); return ok; };
    // the talk's own font subsets (text-talk, display-talk: lazy, gen/ui/fonts/roles.json), asked for at idle so the
    // first bubble on the street doesn't flash in the system 楷 while they come
    setTimeout(() => {
      try {
        const chars = new Set(), names = new Set();
        for (const g of [...chatter.groups, ...chatter.barks, ...talk.scenes]) {
          for (const r of Object.values(g.roles || { one: g.role })) for (const c of r?.name || '') names.add(c);
          for (const t of [...(g.alts || []), ...(g.exchanges || []).flatMap((e) => e.beats.flatMap((b) => b.alts)), ...(g.beats || []).map((b) => b.text)]) for (const c of t) chars.add(c);
        }
        document.fonts?.load('18px "QM Text"', [...chars].join('')).catch(() => {});
        document.fonts?.load('17px "QM Display"', [...names].join('')).catch(() => {});
      } catch { /* fonts are optional */ }
    }, 6000);
  });

  let started = false, nightAcc = 0;
  const cost = { ms: 0, n: 0 }; // the UI's own script time per frame (the checks read it: test.cost())
  const lifeCost = { ms: 0, n: 0 }; // the life layer's share (talk, chatter, bubbles): detail.js stats, a running mean
  const ui = {
    root, places: () => places, talk: () => talk, chatter: () => chatter, help, hud: dhud, journal,
    progress: (f) => loading.progress(f),
    loaded() {
      loading.done();
      if (!firstVisit) setTimeout(() => helpHost?.querySelector('.qm-help-seal')?.classList.add('qm-stamp-in'), 1200);
      // the first banner after the paper has wiped away
      ready.then(() => setTimeout(() => { started = true; }, 900));
    },
    frame(dt) {
      if (!started) return;
      const t0 = performance.now();
      // anything the UI throws turns the UI off, never the page (as sound.js does)
      try {
        if (places) places.update(dt);
        const t1 = performance.now();
        talkSync(dt);
        if (talk) talk.update(dt);
        if (chatter) chatter.update(dt);
        if (bubbles) bubbles.update(dt);
        if (marks) marks.update();
        lifeCost.ms += performance.now() - t1;
        if (++lifeCost.n >= 600) { lifeCost.ms /= 2; lifeCost.n /= 2; } // a running mean over the last few hundred frames
      } catch (err) { console.warn('ui stopped:', err); started = false; root.hidden = true; return; }
      cost.ms += performance.now() - t0;
      cost.n++;
      // the help folds away on the first visit, once you have walked a while (help.onchange marks it seen)
      if (help?.open && helpT >= 0) {
        helpT += dt;
        const p = o.player.pos;
        if (last) walked += Math.hypot(p.x - last.x, p.z - last.z);
        last = { x: p.x, z: p.z };
        if ((helpT > HELP_MIN && walked > HELP_WALK) || helpT > HELP_MAX) help.set(false);
      }
      aheadNote(dt);
      dhud.sync(dt);
      // lamp-lit paper after dark
      nightAcc += dt;
      if (nightAcc > 2) {
        nightAcc = 0;
        const t = (o.night?.() ?? 0) > 0.5 ? 'night' : 'day';
        if (t !== theme) { theme = t; applyInk(html, THEMES[t]); if (t === 'night') html.dataset.night = ''; else delete html.dataset.night; }
      }
    },
    regionTitle(folder) { const r = places?.regionOf(folder); return r ? (innerWidth < 640 ? r.name : `${r.name} · ${r.sub}`) : null; },
    test: {
      ready: () => Promise.all([ready, talkReady]).then(() => !!places && !!talk),
      started: () => started,
      banner: (folder) => places?.fireRegion(folder),
      toast: (id, open = false) => places?.fireLandmark(id, { open }),
      // the lore (r2_lore.md): unfold the toast showing; mark places found (the journal and the HUD marks); the journal
      unfold: (open = true) => places?.unfold(open),
      untoast: () => places?.clearToasts(),
      discover: (ids) => { for (const id of [].concat(ids)) { const m = places?.byId.get(id); if (m) places.reached(m); else places?.discover(id); } return places?.found.size ?? 0; },
      journal: { open: (at) => journal.open({ at }), close: () => journal.close(), state: () => journal.state(), turn: (step) => jn?.turn(step) },
      talk: (id) => { const sc = talk?.scenes.find((s) => s.id === id); return sc ? talk.start(sc) : false; },
      // the life pass (gen/life/progress.md): chatter on/off (the cost A/B), its state and scan cost, the bubbles on
      // screen (the overlap check), who you play
      chatter: (on) => { if (chatter) { chatter.on = !!on; if (!on) bubbles?.dropWhere((e) => e.owner === 'chat'); } return chatter?.on ?? null; },
      chatterState: () => (chatter ? { ...chatter.state(), marks: marks?.state() ?? [] } : null),
      chatterStats: (reset = false) => { if (!chatter) return null; const r = chatter.state().stats; if (reset) Object.assign(chatter.stats, { scans: 0, scanMs: 0, lines: 0, shown: 0, skipped: 0 }); return r; },
      bubbles: () => ({ open: bubbles?.list.length ?? 0, maxSeen: bubbles?.maxSeen ?? 0, shown: bubbles?.shown ?? 0, boxes: bubbles?.boxes() ?? [] }),
      kind: () => kind(),
      life: () => life,
      loadTalk: () => talkAll().then(() => ({ scenes: talk?.scenes.length ?? 0, chatter: chatter?.groups.length ?? 0, barks: chatter?.barks.length ?? 0 })),
      heard: (step) => heard(step),
      next: () => talk?.interact(),
      heads: (id) => talk?.headsOf(id) ?? null,
      // a near talk's host in the world and how far you are from it (reachable: within 3.2 m and 1.6 m of height)
      hostOf: (id) => { const sc = talk?.scenes.find((s) => s.id === id), p = sc && talk.people(sc)?.roles[sc.host]?.p; if (!p) return null;
        const q = p.root.position, P = o.player.pos; return { x: q.x, y: q.y, z: q.z, dist: Math.hypot(q.x - P.x, q.z - P.z), dh: q.y - P.y }; },
      close: () => talk?.close(),
      help: (open) => help?.set(open),
      // the direct HUD and the settings screen (hud.js, settings_screen.js)
      settings: {
        open: (cat) => dhud.open({ cat }),
        close: () => dhud.close(),
        state: () => dhud.screen()?.state() ?? { open: false },
        page: (cat) => dhud.screen()?.setCat(cat),
        select: (id) => { const sc = dhud.screen(), i = sc ? sc.specs.findIndex((r) => r.id === id) : -1; if (i >= 0) sc.select(i); return i; },
      },
      night: (on) => { theme = on ? 'night' : 'day'; applyInk(html, THEMES[theme]); if (on) html.dataset.night = ''; else delete html.dataset.night; nightAcc = -1e9; },
      ahead: () => ({ loading: !!o.ahead?.(), shown: !!aheadEl }), // the 前路漸展 note: is a section near you loading, is the note up
      cost: (reset = false) => { const r = { msPerFrame: cost.n ? cost.ms / cost.n : 0, frames: cost.n }; if (reset) { cost.ms = 0; cost.n = 0; } return r; },
      state: () => ({ started, theme, places: places?.state() ?? null, talk: talk?.state() ?? null, help: help?.open ?? null, helpSeen: prefs.get('helpSeen'), settings: dhud.isOpen() }),
      scenes: () => talk?.scenes.map((s) => ({ id: s.id, section: s.section, host: s.roles[s.host].fig, X: s.X, D: s.D })) ?? [],
      landmarks: () => places?.lm.map((m) => ({ id: m.id, section: m.section, name: m.name, X: m.X, D: m.D, r: m.r })) ?? [],
    },
  };
  return ui;
}
