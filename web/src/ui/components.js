// The ink UI's components as plain DOM (gen/ui/STYLE.md "Components"). The world (index.js) and the kit page (kit.js)
// both build them here, so the two can't drift apart. Styles: ui.css; frames: ink.js.
import { W } from './words.js';
import { longStroke } from './ink.js';
import { icons } from './icons.js';

export const isTouchDevice = () => matchMedia('(pointer: coarse)').matches;
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function h(tag, cls = '', attrs = {}, kids = []) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  }
  for (const k of [].concat(kids)) if (k) e.append(k);
  return e;
}

export const seal = (glyph, cls = '') => h('span', `qm-seal ${cls}`.trim(), { text: glyph, 'aria-hidden': 'true' });

// a vertical brush stroke (the banner's rule), from the same generator as the loading stroke
let ruleSvg = null;
function rule() {
  ruleSvg ??= `<svg viewBox="0 0 36 600" preserveAspectRatio="none" aria-hidden="true"><g transform="translate(36 0) rotate(90)"><path d="${longStroke({ seed: 31 })}" fill-rule="evenodd"/></g></svg>`;
  const e = h('div', 'qm-banner-rule', { html: ruleSvg });
  return e;
}

// region banner (江南百景圖's 「汴河漕運」): the name large and vertical inside a drifting block of mist, the region's seal
// under it, its sub-name a smaller column to its left, and a brush rule
export function regionBanner({ name, sub, seal: glyph }) {
  return h('div', 'qm-banner', { role: 'status', 'aria-live': 'polite', 'aria-label': `${name} ${sub || ''}`.trim() }, [
    h('div', 'qm-banner-wash'),
    rule(),
    h('p', 'qm-banner-name', { text: name }),
    glyph ? seal(glyph) : null,
    sub ? h('p', 'qm-banner-sub', { text: sub }) : null,
  ]);
}

// landmark plaque (江南百景圖's 茶棚 / 石橋): a white vertical slip with the name in black brush, hung on a string with a
// red bead over the landmark; the anchor point is the bead
export function plaque({ name }) {
  return h('div', 'qm-plaque', { 'aria-hidden': 'true' }, [h('span', 'qm-plaque-slip', { text: name }), h('span', 'qm-plaque-string')]);
}

// landmark toast: a paper slip, the seal as its icon, the name and one line from the painting's reading
export function landmarkToast({ name, line, seal: glyph }) {
  return h('div', 'qm-toast qm-slip', { role: 'status', 'aria-live': 'polite' }, [
    seal(glyph || '名'),
    h('div', 'qm-toast-text', {}, [h('b', 'qm-toast-name', { text: name }), line ? h('span', 'qm-toast-line', { text: line }) : null]),
  ]);
}

const TAIL_SAY = '<svg class="qm-bubble-tail" viewBox="0 0 22 22" aria-hidden="true"><path class="qm-tail-fill" d="M3 0 Q9 7 11 21 Q13 8 19 0Z"/><path class="qm-tail-line" d="M3 0 Q9 7 11 21 Q13 8 19 0"/></svg>';
const TAIL_THINK = '<svg class="qm-bubble-tail" viewBox="0 0 22 22" aria-hidden="true"><circle class="qm-tail-dot" cx="9" cy="6" r="4.2"/><circle class="qm-tail-dot" cx="12.5" cy="16" r="2.6"/></svg>';
const tailEl = (think) => h('span', '', { html: think ? TAIL_THINK : TAIL_SAY }).firstChild;

// the glyphs of a line, each stepping in (3 stop-motion frames) one after another; total ~30% of its reading time
function glyphs(text, { reveal = true } = {}) {
  const frag = document.createDocumentFragment();
  const chars = [...text], step = Math.max(22, Math.min(55, 650 / Math.max(1, chars.length)));
  chars.forEach((c, i) => {
    if (!reveal || reducedMotion()) { frag.append(c); return; }
    const s = h('span', 'qm-glyph', { text: c });
    s.style.animationDelay = `${Math.round(120 + i * step)}ms`;
    frag.append(s);
  });
  return { frag, ms: reveal ? 120 + chars.length * step + 150 : 0 };
}

// one speaker: a speech (or thought) bubble anchored at its foot, with the speaker's name tag on its left. en (the
// life pass: prefs.lang 'zh_en'): an English gloss under the Chinese line, with the speaker's role in English
export function speech({ text, think = false, name = '', reveal = true, en = '', nameEn = '' }) {
  const el = h('div', `qm-say${think ? ' qm-thought' : ''}`, { role: 'status', 'aria-live': 'polite' });
  const bubble = h('p', 'qm-bubble');
  let tail = tailEl(think);
  const tag = name ? h('span', 'qm-tag', { text: name }) : null;
  el.append(bubble, tail);
  if (tag) el.append(tag);
  const api = {
    el, think, name,
    revealMs: 0,
    set(t, isThink = think, gloss = '') {
      el.classList.toggle('qm-thought', isThink);
      if (isThink !== api.think) { const t2 = tailEl(isThink); tail.replaceWith(t2); tail = t2; }
      api.think = isThink;
      const g = glyphs(t, { reveal });
      bubble.replaceChildren(g.frag);
      if (gloss) bubble.append(h('span', 'qm-gloss qm-bubble-en', { text: nameEn ? `${nameEn}: ${gloss}` : gloss, lang: 'en' }));
      bubble.setAttribute('aria-label', gloss ? `${t} (${gloss})` : t);
      api.revealMs = g.ms;
      api.shownAt = performance.now();
    },
    // show every glyph at once (the first E press while a line is still stepping in)
    finish() { for (const s of bubble.querySelectorAll('.qm-glyph')) s.style.animation = 'none'; api.revealMs = 0; },
    revealing() { return performance.now() - api.shownAt < api.revealMs; },
  };
  api.set(text, think, en);
  return api;
}

// the interaction prompt: an E keycap and 搭話 (desktop), or a seal to tap (touch)
export function prompt({ touch = isTouchDevice(), onTap = null } = {}) {
  if (touch) {
    const b = h('button', 'qm-prompt', { type: 'button', 'aria-label': W.talkAria, title: W.talkAria }, [seal(W.talkSeal)]);
    if (onTap) {
      const go = (e) => { e.preventDefault(); e.stopPropagation(); onTap(); };
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      b.addEventListener('click', go);
    }
    return h('div', 'qm-prompt-touch-wrap', {}, [b, h('span', '', { text: W.talk })]);
  }
  return h('div', 'qm-prompt', { 'aria-label': W.talkAria }, [h('kbd', 'qm-kbd', { text: 'E' }), h('span', '', { text: W.talk })]);
}

const ICONS = {
  scroll: '<svg class="qm-help-icon" viewBox="0 0 28 28"><rect x="5" y="9" width="18" height="10" rx="1" fill="#e7d6ae" stroke="#2a2420" stroke-width="1.2"/><rect x="3" y="7" width="3" height="14" rx="1.5" fill="#7a2a1a" stroke="#2a2420"/><rect x="22" y="7" width="3" height="14" rx="1.5" fill="#7a2a1a" stroke="#2a2420"/></svg>',
  seal: `<span class="qm-seal" style="font-size:12px">${W.talkSeal}</span>`,
  bell: '<svg class="qm-help-icon" viewBox="0 0 30 30"><path d="M15 4 C10 4 9 9 9 13 L8 20 L22 20 L21 13 C21 9 20 4 15 4 Z" fill="none" stroke="#2a2420" stroke-width="1.8"/><path d="M6.5 20.5 L23.5 20.5" stroke="#2a2420" stroke-width="1.8"/><circle cx="15" cy="24.5" r="2.2" fill="#2a2420"/></svg>',
  // the direct HUD's view tiles and its › (hud.js, icons.js), drawn as they look on screen
  get view() { const I = icons(); return `<span class="qm-help-ic">${I.eye}</span><span class="qm-help-ic qm-sealed">${I.figure}</span>`; },
  get more() { return `<span class="qm-help-ic">${icons().more}</span>`; },
};

// the controls help: a paper slip (keys, 繁體, a small English gloss) that folds into a seal
export function helpPanel(host, { touch = isTouchDevice(), open = true } = {}) {
  const rows = touch ? W.helpTouch : W.helpDesktop;
  const lead = touch ? W.helpLead.touch : W.helpLead.desktop;
  const dl = h('dl');
  for (const [keys, zh, en] of rows) {
    const dt = h('dt');
    for (const k of keys) {
      if (k.startsWith('icon:')) dt.append(h('span', '', { html: ICONS[k.slice(5)] }));
      else dt.append(h('kbd', 'qm-kbd', { text: k }));
    }
    dl.append(dt, h('dd', '', { text: zh }), h('dd', 'qm-gloss', { text: en }));
  }
  const slip = h('div', 'qm-help qm-slip', { role: 'dialog', 'aria-label': W.helpAria }, [
    h('h2', '', {}, [h('span', '', { text: W.helpTitle }), h('span', 'qm-gloss', { text: 'controls' })]),
    h('p', 'qm-help-lead', {}, [h('span', '', { text: lead[0] }), ' ', h('span', 'qm-gloss', { text: lead[1] })]),
    dl,
    h('p', 'qm-credit', { text: W.credit }),
  ]);
  const btn = h('button', 'qm-ringbtn qm-help-seal', { type: 'button', title: W.helpAria, 'aria-label': W.helpAria }, [seal(W.helpSeal)]);
  btn.style.background = 'none';
  btn.style.filter = 'none';
  host.replaceChildren(slip, btn);
  const api = {
    open: false,
    onchange: null, // (open) => {}, after every change (index.js: the first fold marks prefs.helpSeen)
    set(o) {
      api.open = o;
      slip.hidden = !o;
      btn.hidden = o;
      api.onchange?.(o);
    },
    toggle() { api.set(!api.open); },
  };
  for (const e of [slip, btn]) {
    e.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    e.addEventListener('click', (ev) => { ev.stopPropagation(); api.toggle(); });
  }
  api.set(open);
  return api;
}
