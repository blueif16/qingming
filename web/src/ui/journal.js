// The 圖志, the journal of places (J; gen/ui/r2_lore.md). An album of paper leaves over the street:
//   - on top, the whole scroll as a thin strip (assets/scroll/strip.webp, the scroll HUD's), veiled like unpainted silk
//     where you have not been and inked in round each landmark you have reached: progress is how much of the painting
//     shows, never a number. A tap on the strip turns to that region's leaf;
//   - under it, the leaves as seals, west to east as the strip lies: the colophons (題跋, mounted after the painting, so
//     at its left end), the seven regions, and the talk you have heard (見聞);
//   - a region's leaf: its name, its long text, then its landmarks west to east, each with the painting's own crop
//     (assets/ui/places/<id>.webp, tools/place_crops.mjs, fetched only as its leaf shows), the name, the short line, the
//     long text, a quote and the sources. A place not reached yet is a faint empty leaf;
//   - the 印譜, last: the things to do in the town (interact.js deeds(): the drum, the viewpoints, the poses), each a seal
//     stamped the first time you do it (prefs.discovered x:<key>), a faint blank till then.
// Everything it reads comes from places.json (already loaded), lore.json and talk.json; what you have found is in
// prefs.discovered (places.js). A lazy chunk: index.js imports this file on the first J, tap or settings row, so the
// first load carries none of it, and its words and long texts use the lazily fetched "lore" font subset.
// Keys: J or Esc close, ← → (A D) turn the leaf, ↑ ↓ PageUp PageDown scroll it. Mouse and touch: the strip, the seals,
// the close ring. While it is open the player stands still and the mouse is free (the scroll HUD does the same).
import './journal.css';
import { h, seal } from './components.js';
import { prefs } from './prefs.js';
import { loreBody } from './places.js';
import { JW } from './journal_words.js';

const STRIP = 'assets/scroll/strip.webp';
const SCAN_W = 38414; // the scan's width in px (assets/scroll/tiles.json); the strip spans it whole
const PAINT_U0 = 815; // where the painted silk starts at the scroll's left end (reference/scroll/sections.md)

export class Journal {
  // places: places.json; lore(): Promise of lore.json; talk: talk.json; data(): { places, talk } (the latest, if they
  // came later); player, canvas: to stand still and free the mouse; touch; sfx(name, gain); onClose()
  constructor({ places, lore, talk, data = null, player = null, canvas = null, touch = false, sfx = () => {}, onClose = () => {} }) {
    Object.assign(this, { places, loreFetch: lore, talkData: talk, data, player, canvas, touch, sfx, onClose });
    this.isOpen = false;
    this.lore = null;
    this.leafKey = null;
    this.build();
    addEventListener('keydown', (e) => this.onKey(e));
    addEventListener('resize', () => this.isOpen && this.drawStrip());
  }

  // ------------------------------------------------------------ the leaves, from the data
  get found() { return new Set(prefs.get('discovered') || []); }
  leaves() {
    const L = [];
    if (this.lore?.colophons) L.push({ kind: 'col', key: 'col', label: JW.colTab });
    const regions = Object.entries(this.lore?.regions || {}).map(([id, r]) => ({ id, ...r })).filter((r) => r.area).sort((a, b) => a.area[0] - b.area[0]);
    for (const r of regions) L.push({ kind: 'region', key: `r:${r.id}`, label: r.name, region: r });
    L.push({ kind: 'talk', key: 'talk', label: JW.talkTab });
    if (this.deeds?.length) L.push({ kind: 'deeds', key: 'deeds', label: JW.deedsTab });
    return L;
  }
  regionOfLandmark(m) { return this.places?.regions?.[m.section]?.id || null; }
  landmarksOf(rid) { return (this.places?.landmarks || []).filter((m) => this.regionOfLandmark(m) === rid).sort((a, b) => a.u - b.u); }

  // ------------------------------------------------------------ DOM
  build() {
    const root = (this.root = h('div', 'qm-jn', { role: 'dialog', 'aria-modal': 'true', 'aria-label': JW.aria, tabindex: '-1' }));
    root.hidden = true;
    const close = h('button', 'qm-ringbtn qm-jn-close', { type: 'button', title: JW.close, 'aria-label': JW.close,
      html: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>' });
    close.addEventListener('click', () => this.close());
    this.stripEl = h('canvas', 'qm-jn-strip-c', { 'aria-label': JW.strip, role: 'img' });
    this.tabsEl = h('nav', 'qm-jn-tabs', { role: 'tablist' });
    this.leafEl = h('section', 'qm-jn-leaf', { role: 'tabpanel', tabindex: '0' });
    const [hzh, hen] = this.touch ? JW.hintTouch : JW.hintDesktop;
    const book = h('div', 'qm-jn-book', {}, [
      h('header', 'qm-jn-head', {}, [h('h2', 'qm-jn-title', {}, [h('span', '', { text: JW.title }), seal('志', 'qm-jn-seal')]), close]),
      h('div', 'qm-jn-strip', {}, [this.stripEl]),
      this.tabsEl,
      this.leafEl,
      h('footer', 'qm-jn-foot', {}, [h('span', '', { text: hzh }), h('span', 'qm-gloss', { text: hen })]),
    ]);
    root.append(h('div', 'qm-jn-mask'), book);
    // the page's own wheel (camera distance), touches (thumb sticks) and clicks (pointer lock) stay out
    for (const t of ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'mousedown', 'click']) root.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
    root.querySelector('.qm-jn-mask').addEventListener('click', () => this.close());
    this.stripEl.addEventListener('click', (e) => this.stripClick(e));
    document.body.append(root);
  }

  async open({ at = null } = {}) {
    const d = this.data?.(); // places.json and talk.json may have arrived after this chunk was made
    if (d) { this.places = d.places || this.places; this.talkData = d.talk || this.talkData; this.deeds = d.deeds?.length ? d.deeds : this.deeds; }
    if (this.isOpen) { if (at) this.show(this.leafFor(at), at); return; }
    this.isOpen = true;
    this.relock = !!document.pointerLockElement;
    document.exitPointerLock?.();
    if (this.player) this.player.frozen = true;
    this.root.hidden = false;
    this.root.focus({ preventScroll: true });
    this.sfx('bubble_tap', 0.4);
    if (!this.lore) {
      this.leafEl.replaceChildren(h('p', 'qm-jn-wait', { text: '……' }));
      this.lore = await Promise.resolve(this.loreFetch()).catch(() => null);
      if (!this.isOpen) return;
    }
    if (!this.strip) { this.strip = new Image(); this.strip.decoding = 'async'; this.strip.onload = () => this.isOpen && this.drawStrip(); this.strip.src = STRIP; }
    const target = at || prefs.get('lastPlace');
    this.show(this.leafFor(target), target);
  }
  close({ relock = false } = {}) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.hidden = true;
    if (this.player) this.player.frozen = false;
    if (relock && this.relock) this.canvas?.requestPointerLock?.();
    this.onClose();
  }
  toggle(opts) { return this.isOpen ? this.close(opts) : this.open(opts); }

  // the leaf that holds a landmark, a region key, or else the region you are in (else the first region found)
  leafFor(at) {
    const L = this.leaves();
    if (!L.length) return null;
    if (at === 'col' || at === 'talk' || (at === 'deeds' && this.deeds?.length)) return at;
    const m = at && (this.places?.landmarks || []).find((x) => x.id === at);
    if (m) return `r:${this.regionOfLandmark(m)}`;
    if (at && L.some((l) => l.key === at)) return at;
    const reg = [...this.found].reverse().find((k) => k.startsWith('r:'));
    return reg || L.find((l) => l.kind === 'region')?.key || L[0].key;
  }

  show(key, focusId = null) {
    const L = this.leaves(), leaf = L.find((l) => l.key === key) || L.find((l) => l.kind === 'region') || L[0];
    if (!leaf) return;
    this.leafKey = leaf.key;
    this.renderTabs(L);
    const found = this.found;
    if (leaf.kind === 'region') this.renderRegion(leaf.region, found, focusId);
    else if (leaf.kind === 'talk') this.renderTalk(found);
    else if (leaf.kind === 'deeds') this.renderDeeds(found);
    else this.renderColophons();
    this.leafEl.scrollTop = 0;
    if (focusId) {
      const el = this.leafEl.querySelector(`[data-id="${CSS.escape(focusId)}"]`);
      if (el) { el.classList.add('qm-jn-here'); requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest' })); }
    }
    this.drawStrip();
  }
  turn(step) {
    const L = this.leaves(), i = L.findIndex((l) => l.key === this.leafKey);
    const j = Math.max(0, Math.min(L.length - 1, i + step));
    if (j !== i) { this.show(L[j].key); this.sfx('bubble_tap', 0.25); }
  }

  renderTabs(L) {
    const found = this.found;
    this.tabsEl.replaceChildren(...L.map((l) => {
      const visited = l.kind !== 'region' || found.has(l.key);
      const b = h('button', `qm-jn-tab${visited ? '' : ' qm-jn-tab-not'}`, { type: 'button', role: 'tab', 'aria-selected': String(l.key === this.leafKey), title: l.label },
        [h('span', 'qm-jn-tab-seal', {}, [...l.label].map((c) => h('span', '', { text: c })))]);
      b.style.setProperty('--tilt', `${((l.label.charCodeAt(0) % 5) - 2) * 1.2}deg`);
      b.addEventListener('click', () => this.show(l.key));
      return b;
    }));
  }

  renderRegion(r, found, focusId) {
    const lore = this.lore, seen = found.has(`r:${r.id}`);
    // with prefs.lang 'zh_en' the place names and lines have their English under them (the long texts: places.js loreBody)
    const en = (t) => (prefs.get('lang') === 'zh_en' && t ? h('span', 'qm-gloss qm-en', { text: t, lang: 'en' }) : null);
    const head = h('div', `qm-jn-rhead${seen ? '' : ' qm-jn-faint'}`, {}, [
      h('div', 'qm-jn-rname', {}, [h('span', 'qm-jn-rname-v', { text: r.name }), seal(r.seal || r.name[0], 'qm-jn-rseal')]),
      h('div', 'qm-jn-rtext', {}, seen ? [
        h('p', 'qm-jn-rsub', { text: r.sub }, [en([r.name_en, r.sub_en].filter(Boolean).join(' · '))]),
        (() => { const d = h('div', 'qm-jn-rbody'); loreBody(d, r); return d; })(),
      ] : [h('p', 'qm-jn-rsub', { text: r.sub }, [en([r.name_en, r.sub_en].filter(Boolean).join(' · '))]), h('p', 'qm-jn-not', { text: JW.regionNotYet })]),
    ]);
    const grid = h('div', 'qm-jn-grid');
    for (const m of this.landmarksOf(r.id)) {
      if (!found.has(m.id)) {
        grid.append(h('article', 'qm-jn-entry qm-jn-empty', { 'aria-label': JW.notYet }, [h('div', 'qm-jn-fig qm-jn-blank'), h('p', 'qm-jn-not', { text: JW.notYet })]));
        continue;
      }
      const L = lore?.landmarks?.[m.id] || null;
      const fig = h('figure', 'qm-jn-fig');
      if (L?.img) {
        const img = h('img', '', { src: L.img, alt: m.name, loading: 'lazy', decoding: 'async', width: '480', height: '320' });
        img.addEventListener('error', () => img.remove());
        fig.append(img);
      }
      const body = h('div', 'qm-jn-ebody');
      loreBody(body, L);
      grid.append(h('article', 'qm-jn-entry', { 'data-id': m.id }, [
        fig,
        h('h4', 'qm-jn-ename', {}, [seal(m.seal || '名'), h('span', '', { text: m.name }), en(m.name_en)]),
        h('p', 'qm-jn-eline', { text: m.line }, [en(m.line_en)]),
        body,
      ]));
    }
    this.leafEl.replaceChildren(head, grid);
    if (focusId && !this.leafEl.querySelector(`[data-id="${CSS.escape(focusId)}"]`)) this.leafEl.querySelector('.qm-jn-rhead')?.classList.add('qm-jn-here');
  }

  renderTalk(found) {
    const order = (s) => { const r = this.lore?.regions && Object.values(this.lore.regions).find((x) => x.folders.includes(s.section)); return r?.area?.[0] ?? 0; };
    const scenes = [...(this.talkData?.scenes || [])].sort((a, b) => order(a) - order(b) || a.X - b.X);
    const heard = scenes.filter((s) => found.has(`t:${s.id}`));
    const grid = h('div', 'qm-jn-grid qm-jn-talk');
    for (const s of scenes) {
      if (!found.has(`t:${s.id}`)) { grid.append(h('article', 'qm-jn-entry qm-jn-empty', { 'aria-label': JW.notYet }, [h('p', 'qm-jn-not', { text: JW.notYet })])); continue; }
      const region = this.places?.regions?.[s.section]?.name || '';
      grid.append(h('article', 'qm-jn-entry', { 'data-id': `t:${s.id}` }, [
        h('h4', 'qm-jn-ename', {}, [h('span', '', { text: s.title })]),
        h('p', 'qm-jn-eline', { text: region }),
        h('div', 'qm-jn-lines', {}, s.beats.map((b) => h('p', b.think ? 'qm-jn-think' : '', {}, [
          h('b', '', { text: s.roles[b.who]?.name || '' }), h('span', '', { text: b.think ? `（${b.text}）` : `「${b.text}」` }),
        ]))),
      ]));
    }
    // the plot lines (the life pass, gen/life/progress.md): a line shows once one of its steps is overheard, and then
    // only the steps heard, in their order along the line, with a brush gap where something is still unheard; never a
    // count or a list of what is left (STYLE.md §9, §15)
    // with prefs.lang 'zh_en' (3d-director-da's pref) each title, lead and step note has its English under it
    const threads = (this.talkData?.threads || []).map((th) => ({ th, got: th.steps.map((st) => found.has(`h:${st.id}`)) })).filter((x) => x.got.some(Boolean));
    const enOn = (prefs.get('lang') ?? 'zh') === 'zh_en';
    const gl = (t) => (enOn && t ? h('span', 'qm-jn-en', { text: t, lang: 'en' }) : null);
    const lines = threads.length ? h('div', 'qm-jn-threads', {}, [h('h3', 'qm-jn-th-head', { text: JW.threadsTitle }), ...threads.map(({ th, got }) => {
      const rows = [];
      th.steps.forEach((st, i) => {
        if (got[i]) rows.push(h('p', 'qm-jn-step', {}, [h('b', '', { text: this.places?.regions?.[st.section]?.name || '' }), h('span', '', { text: st.note }), gl(st.noteEn)]));
        else if (rows.length && rows[rows.length - 1].className !== 'qm-jn-gap') rows.push(h('p', 'qm-jn-gap', { text: '……', 'aria-hidden': 'true' }));
      });
      if (rows.length && rows[rows.length - 1].className === 'qm-jn-gap') rows.pop();
      return h('article', 'qm-jn-thread', { 'data-id': `th:${th.id}` }, [h('h4', 'qm-jn-ename', {}, [seal(JW.threadSeal), h('span', '', { text: th.title }), gl(th.titleEn)]),
        h('p', 'qm-jn-eline', {}, [th.lead, gl(th.leadEn)]), ...rows]);
    })]) : null;
    this.leafEl.replaceChildren(...[
      h('div', 'qm-jn-rhead', {}, [h('div', 'qm-jn-rname', {}, [h('span', 'qm-jn-rname-v', { text: JW.talkTitle })]),
        h('div', 'qm-jn-rtext', {}, [h('p', 'qm-jn-rsub', { text: heard.length || threads.length ? JW.talkLead : JW.talkNone })])]),
      lines,
      grid,
    ].filter(Boolean));
  }

  // the 印譜 (the user, 2026-10-13: the interactions recorded like a 成就系統): a seal for each thing done, in the data's
  // order; one not done yet is a faint blank with 未至, and nothing counts them (STYLE.md §9, §15)
  renderDeeds(found) {
    const enOn = prefs.get('lang') === 'zh_en';
    const en = (t) => (enOn && t ? h('span', 'qm-gloss qm-en', { text: t, lang: 'en' }) : null);
    const grid = h('div', 'qm-jn-grid qm-jn-deeds');
    for (const d of this.deeds) {
      if (!found.has(`x:${d.key}`)) {
        grid.append(h('article', 'qm-jn-entry qm-jn-empty', { 'aria-label': JW.notYet }, [h('div', 'qm-jn-fig qm-jn-blank'), h('p', 'qm-jn-not', { text: JW.notYet })]));
        continue;
      }
      const region = this.places?.regions?.[d.section]?.name || '';
      grid.append(h('article', 'qm-jn-entry', { 'data-id': `x:${d.key}` }, [
        h('figure', 'qm-jn-fig qm-jn-deed-fig', {}, [seal(d.seal, 'qm-jn-deed-seal')]),
        h('h4', 'qm-jn-ename', {}, [h('span', '', { text: d.name }), en(d.name_en)]),
        h('p', 'qm-jn-eline', { text: d.line }, [en(d.line_en)]),
        region ? h('p', 'qm-jn-deed-where', { text: region }) : null,
      ]));
    }
    const [lead, leadEn] = JW.deedsLead;
    this.leafEl.replaceChildren(
      h('div', 'qm-jn-rhead', {}, [h('div', 'qm-jn-rname', {}, [h('span', 'qm-jn-rname-v', { text: JW.deedsTitle }), seal(JW.deedsSeal, 'qm-jn-rseal')]),
        h('div', 'qm-jn-rtext', {}, [h('p', 'qm-jn-rsub', { text: lead }, [en(leadEn)])])]),
      grid,
    );
  }

  renderColophons() {
    const c = this.lore?.colophons;
    if (!c) return;
    const grid = h('div', 'qm-jn-cols');
    for (const it of c.items) {
      grid.append(h('article', 'qm-jn-col', {}, [
        h('p', 'qm-jn-col-text', { text: it.text }),
        h('h4', 'qm-jn-col-who', { text: it.who }),
        h('p', 'qm-jn-col-gloss', { text: it.gloss }),
      ]));
    }
    this.leafEl.replaceChildren(
      h('div', 'qm-jn-rhead', {}, [h('div', 'qm-jn-rname', {}, [h('span', 'qm-jn-rname-v', { text: c.title })]),
        h('div', 'qm-jn-rtext', {}, [h('p', 'qm-jn-lead', { text: c.lead })])]),
      grid,
    );
  }

  // ------------------------------------------------------------ the strip: the painting, inked in where you have been
  drawStrip() {
    const el = this.stripEl, img = this.strip;
    const w = el.getBoundingClientRect().width;
    if (!w) return;
    const dpr = Math.min(devicePixelRatio || 1, 2), hgt = Math.max(16, Math.round((w * 128) / 2731));
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(hgt * dpr)) { el.width = Math.round(w * dpr); el.height = Math.round(hgt * dpr); el.style.height = `${hgt}px`; }
    const ctx = el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hgt);
    const k = w / SCAN_W, ok = img?.complete && img.naturalWidth;
    const sk = ok ? img.naturalWidth / SCAN_W : 0;
    const paint = (u0, u1) => { if (ok && u1 > u0) ctx.drawImage(img, u0 * sk, 0, (u1 - u0) * sk, img.naturalHeight, u0 * k, 0, (u1 - u0) * k, hgt); };
    // the silk, veiled: the painting shows through faintly everywhere, like a scroll seen through mist
    ctx.fillStyle = '#d9cba9';
    ctx.fillRect(0, 0, w, hgt);
    if (ok) { ctx.globalAlpha = 0.22; paint(0, SCAN_W); ctx.globalAlpha = 1; }
    const found = this.found, regions = Object.entries(this.lore?.regions || {});
    for (const [id, r] of regions) {
      if (!r.area) continue;
      // a region you have entered: a little clearer; round each landmark reached: the painting in full
      if (found.has(`r:${id}`)) { ctx.globalAlpha = 0.45; paint(r.area[0], r.area[1]); ctx.globalAlpha = 1; }
      const lms = this.landmarksOf(id), span = (r.area[1] - r.area[0]) / Math.max(1, lms.length);
      for (const m of lms) {
        if (!found.has(m.id)) continue;
        const a = Math.max(r.area[0], m.u - span / 2), b = Math.min(r.area[1], m.u + span / 2);
        paint(a, b);
      }
    }
    // the region you are reading, bracketed in cinnabar; the region seams as faint ticks
    ctx.strokeStyle = 'rgba(42, 36, 32, 0.35)';
    ctx.lineWidth = 1;
    for (const [, r] of regions) if (r.area) { ctx.beginPath(); ctx.moveTo(r.area[0] * k + 0.5, 0); ctx.lineTo(r.area[0] * k + 0.5, hgt); ctx.stroke(); }
    const cur = this.leafKey?.startsWith('r:') ? this.lore?.regions?.[this.leafKey.slice(2)] : null;
    const box = cur?.area || (this.leafKey === 'col' ? [0, PAINT_U0] : null);
    if (box) {
      const x0 = box[0] * k + 1, x1 = box[1] * k - 1;
      ctx.strokeStyle = '#b5321e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + 6, 1); ctx.lineTo(x0, 1); ctx.lineTo(x0, hgt - 1); ctx.lineTo(x0 + 6, hgt - 1);
      ctx.moveTo(x1 - 6, 1); ctx.lineTo(x1, 1); ctx.lineTo(x1, hgt - 1); ctx.lineTo(x1 - 6, hgt - 1);
      ctx.stroke();
    }
    ctx.fillStyle = '#b5321e';
    for (const m of this.places?.landmarks || []) if (found.has(m.id)) { ctx.fillRect(m.u * k - 1.5, Math.min(hgt - 4, Math.max(1, (m.v / 1800) * hgt - 1.5)), 3, 3); }
  }
  stripClick(e) {
    const r = this.stripEl.getBoundingClientRect(), u = ((e.clientX - r.left) / r.width) * SCAN_W;
    if (u < PAINT_U0) return this.show('col');
    const hit = Object.entries(this.lore?.regions || {}).find(([, x]) => x.area && u >= x.area[0] && u < x.area[1]);
    if (hit) this.show(`r:${hit[0]}`);
  }

  onKey(e) {
    if (!this.isOpen || e.ctrlKey || e.metaKey || e.altKey) return;
    const c = e.code;
    if (c === 'Escape' || c === 'KeyJ') { e.preventDefault(); this.close({ relock: c === 'KeyJ' }); return; }
    if (c === 'ArrowLeft' || c === 'KeyA') { e.preventDefault(); this.turn(-1); return; }
    if (c === 'ArrowRight' || c === 'KeyD') { e.preventDefault(); this.turn(1); return; }
    const step = { ArrowDown: 60, ArrowUp: -60, PageDown: 0.85, PageUp: -0.85, KeyS: 60, KeyW: -60 }[c];
    if (step != null) { e.preventDefault(); this.leafEl.scrollBy({ top: Math.abs(step) < 1 ? step * this.leafEl.clientHeight : step, behavior: 'smooth' }); return; }
    if (c === 'Home') { e.preventDefault(); this.leafEl.scrollTop = 0; } else if (c === 'End') { e.preventDefault(); this.leafEl.scrollTop = this.leafEl.scrollHeight; }
    // the scroll HUD and the settings take over the screen: give way to them
    if (c === 'KeyO' && !e.repeat) this.close();
  }

  state() {
    return { open: this.isOpen, leaf: this.leafKey, entries: this.leafEl.querySelectorAll('.qm-jn-entry:not(.qm-jn-empty)').length,
      empty: this.leafEl.querySelectorAll('.qm-jn-empty').length, imgs: [...this.leafEl.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth).length };
  }
}
