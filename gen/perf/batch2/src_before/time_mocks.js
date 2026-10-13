// The time instruments that were weighed and not chosen (gen/ui/r2_time.md "Options"), as live mock-ups for the kit
// page's "time" scene (ui.html?frame&scene=time). Each one is draggable and reads the same hour; dev-only, never
// imported by the world, and kept out of web/src/ui/ so its words don't grow the shipped font subset. The chosen one
// (晝夜卷 with its 時牌) is the real component, ui/time.js.
//   甲 日晷   the round-1 sundial, bigger, with the 時辰 named beside it: drag the gnomon's shadow round the dial
//   乙 蓮花漏 燕肅's lotus clepsydra (1030): water rises in the vessel and lifts the arrow (箭) with its 刻; the lip of
//            the vessel reads the hour. Drag the arrow up or down
//   丙 十二時辰輪 the twelve 時辰 as brush characters on a ring that turns under a fixed pointer; the current one named
//            large in the middle. Drag the ring round
import { Sundial } from './sundial.js';
import { BRANCHES, hourWords } from './ui/time_words.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, parent = null) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const div = (cls, parent, text) => { const e = document.createElement('div'); e.className = cls; if (text) e.textContent = text; if (parent) parent.append(e); return e; };
const wrap = (h) => ((h % 24) + 24) % 24;

// a big name tag beside an instrument: the 時辰 in brush, its 初/正 and 刻 under it
function nameTag(parent) {
  const box = div('tmm-name', parent);
  const big = div('tmm-big', box), small = div('tmm-small', box);
  return (h) => { const w = hourWords(h), night = h >= 19 || h < 5; big.textContent = w.name; small.textContent = night ? `${w.watch}${w.point}` : w.sub; };
}

// pointer drag on `el`: fn(dx, dy, x, y, start) per move
function dragOn(el, fn) {
  let d = null;
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); d = { x: e.clientX, y: e.clientY, id: e.pointerId }; fn(0, 0, e.clientX, e.clientY, true); });
  el.addEventListener('pointermove', (e) => { if (d && e.pointerId === d.id) fn(e.clientX - d.x, e.clientY - d.y, e.clientX, e.clientY, false); });
  const end = (e) => { if (d && e.pointerId === d.id) d = null; };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// 甲 the sundial, dragged by its shadow
export function mockSundial(parent, hub) {
  const box = div('tmm-inst tmm-dial', parent);
  const host = div('tmm-dial-host', box);
  const dial = new Sundial(host);
  const name = nameTag(box);
  dragOn(host, (dx, dy, x, y) => {
    const r = host.getBoundingClientRect(), a = Math.atan2(x - (r.left + r.width / 2), -(y - (r.top + r.height / 2)));
    hub.set(wrap((a * 180) / Math.PI / 15));
  });
  return (h, light) => { dial.set(h, light, { local: false, clockText: '' }); name(h); };
}

// 乙 the lotus clepsydra: the vessel, the water, the float and its arrow graduated in 時辰 and 刻; the arrow rises a
// 時辰 every so many pixels; the vessel's lip is the index
export function mockClepsydra(parent, hub) {
  const box = div('tmm-inst tmm-lou', parent);
  const W = 120, H = 210, LIP = 92, PER = 30; // the lip's height on the drawing; px per 時辰 on the arrow
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tmm-lou-svg' }, box);
  const defs = svg('defs', {}, s);
  const clip = svg('clipPath', { id: 'tmm-lou-clip' }, defs);
  svg('rect', { x: 0, y: 0, width: W, height: LIP }, clip);
  // the arrow above the lip (clipped there): a slender rod with its 刻 and the twelve 時辰, moved up and down
  const arrowWin = svg('g', { 'clip-path': 'url(#tmm-lou-clip)' }, s);
  const arrow = svg('g', {}, arrowWin);
  svg('rect', { x: W / 2 - 9, y: -40 * PER, width: 18, height: 80 * PER, fill: '#f3ead2', stroke: '#2a2420', 'stroke-width': 1 }, arrow);
  for (let k = -36; k <= 36; k++) { // 時辰 k centred at y = k * PER (子 at 0), later hours lower down the arrow
    const y = k * PER;
    svg('line', { x1: W / 2 - 9, x2: W / 2 + 9, y1: y + PER / 2, y2: y + PER / 2, stroke: '#2a2420', 'stroke-width': 0.8 }, arrow);
    for (let q = 1; q < 8; q++) svg('line', { x1: W / 2 + 9 - (q % 4 === 0 ? 7 : 3.5), x2: W / 2 + 9, y1: y + PER / 2 - (q * PER) / 8, y2: y + PER / 2 - (q * PER) / 8, stroke: '#2a2420', 'stroke-width': 0.5 }, arrow);
    const t = svg('text', { x: W / 2 - 3, y: y + 4.5, 'font-size': 12, 'text-anchor': 'middle', class: 'tmm-lou-glyph' }, arrow);
    t.textContent = BRANCHES[((k % 12) + 12) % 12];
  }
  // the lotus lid and the vessel (壺) in ink, the water inside
  svg('path', { d: `M18 ${LIP} Q20 ${H - 20} ${W / 2} ${H - 14} Q${W - 20} ${H - 20} ${W - 18} ${LIP} Z`, fill: '#5d5143', stroke: '#2a2420', 'stroke-width': 1.5 }, s);
  svg('path', { d: `M26 ${LIP + 10} Q28 ${H - 28} ${W / 2} ${H - 22} Q${W - 28} ${H - 28} ${W - 26} ${LIP + 10} Z`, fill: '#4f7a9a', opacity: 0.75 }, s);
  svg('path', { d: `M10 ${LIP} Q${W / 2} ${LIP - 16} ${W - 10} ${LIP} Q${W / 2} ${LIP + 9} 10 ${LIP} Z`, fill: '#c9a26b', stroke: '#2a2420', 'stroke-width': 1.2 }, s);
  for (let i = 0; i < 6; i++) svg('path', { d: `M${18 + i * 17} ${LIP - 2} q 8 -12 16 0`, fill: 'none', stroke: '#2a2420', 'stroke-width': 0.9 }, s); // lotus petals on the lid
  svg('line', { x1: W / 2 - 16, x2: W / 2 + 16, y1: LIP - 1, y2: LIP - 1, stroke: '#b5321e', 'stroke-width': 1.6 }, s); // the index
  const name = nameTag(box);
  let h0 = 0;
  dragOn(s, (dx, dy, x, y, start) => { if (start) h0 = hub.hour; else hub.set(wrap(h0 - (dy / PER) * 2)); });
  return (h) => {
    // the arrow rises as the day goes: the hour now stands just above the lip, the hours gone above it
    const y = LIP - 10 - (wrap(h) / 2) * PER;
    arrow.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
    name(h);
  };
}

// 丙 the twelve 時辰 as a turning ring of brush characters under a fixed pointer; day and night arcs on it
export function mockRing(parent, hub) {
  const box = div('tmm-inst tmm-ring', parent);
  const R = 70;
  const s = svg('svg', { viewBox: '-100 -100 200 200', class: 'tmm-ring-svg' }, box);
  svg('circle', { r: 96, fill: '#f3ead2', stroke: '#2a2420', 'stroke-width': 2 }, s);
  const ring = svg('g', {}, s);
  // night from 戌 to 寅 (19:00-05:00), the arc behind the characters in indigo; the day's arc pale
  const arc = (h0, h1, color) => {
    const a0 = (h0 * 15 * Math.PI) / 180, a1 = (h1 * 15 * Math.PI) / 180, r = 84;
    const p = (a) => `${(Math.sin(a) * r).toFixed(2)} ${(-Math.cos(a) * r).toFixed(2)}`;
    svg('path', { d: `M${p(a0)} A${r} ${r} 0 ${((h1 - h0 + 24) % 24) > 12 ? 1 : 0} 1 ${p(a1)}`, fill: 'none', stroke: color, 'stroke-width': 18, opacity: 0.85 }, ring);
  };
  arc(19, 5, '#2b3452');
  arc(5, 19, '#e8dcc0');
  const glyphs = [];
  for (let k = 0; k < 12; k++) {
    const a = (k * 30 * Math.PI) / 180;
    const t = svg('text', { x: (Math.sin(a) * R).toFixed(1), y: (-Math.cos(a) * R + 7).toFixed(1), 'font-size': 20, 'text-anchor': 'middle', class: 'tmm-ring-glyph' }, ring);
    t.textContent = BRANCHES[k];
    glyphs.push(t);
  }
  svg('path', { d: 'M0 -99 L-6 -88 L6 -88 Z', fill: '#b5321e' }, s); // the pointer
  const big = svg('text', { x: 0, y: 8, 'font-size': 34, 'text-anchor': 'middle', class: 'tmm-ring-big' }, s);
  const small = svg('text', { x: 0, y: 32, 'font-size': 13, 'text-anchor': 'middle', class: 'tmm-ring-small' }, s);
  let a0 = 0, h0 = 0;
  dragOn(s, (dx, dy, x, y, start) => {
    const r = s.getBoundingClientRect(), a = Math.atan2(x - (r.left + r.width / 2), -(y - (r.top + r.height / 2)));
    if (start) { a0 = a; h0 = hub.hour; return; }
    let d = a - a0;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    hub.set(wrap(h0 - (d * 180) / Math.PI / 15)); // turning the ring clockwise brings earlier hours under the pointer
  });
  return (h) => {
    ring.setAttribute('transform', `rotate(${(-wrap(h) * 15).toFixed(2)})`);
    const w = hourWords(h), night = h >= 19 || h < 5;
    for (const [k, g] of glyphs.entries()) {
      g.setAttribute('class', `tmm-ring-glyph${k === w.index ? ' on' : ''}${(k >= 10 || k <= 2) ? ' n' : ''}`);
      g.setAttribute('transform', `rotate(${(wrap(h) * 15).toFixed(2)} ${g.getAttribute('x')} ${(+g.getAttribute('y') - 7).toFixed(1)})`); // keep them upright
    }
    big.textContent = w.name;
    small.textContent = night ? `${w.watch}${w.point}` : w.sub;
  };
}

// the kit's panel: its title and the three figures (their words live here, out of the shipped font subset)
export const PANEL_TITLE = '時辰 · 三種未選的樣式';
export const FIGS = [
  [mockSundial, '甲 · 日晷', 'the round-1 dial, bigger; drag the shadow'],
  [mockClepsydra, '乙 · 蓮花漏', "Yan Su's lotus clepsydra; drag the arrow"],
  [mockRing, '丙 · 十二時辰輪', 'the hours as a turning ring; drag it round'],
];

// the kit's style for the mocks (inline, dev-only)
export const MOCK_CSS = `
.tmm-panel { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 820; display: grid; grid-template-columns: repeat(3, auto); gap: 26px;
  padding: 22px 28px 18px; border: 12px solid transparent; border-image: var(--qm-frame-slip) 24 / 12px / 0 stretch; border-image-slice: 24 fill; filter: var(--qm-lift);
  color: var(--qm-ink); font-family: var(--qm-font-text); user-select: none; touch-action: none; }
.tmm-panel h3 { grid-column: 1 / -1; margin: 0; font: 400 22px/1.2 var(--qm-font-title); letter-spacing: 0.1em; }
.tmm-panel figure { margin: 0; display: grid; justify-items: center; gap: 8px; }
.tmm-panel figcaption { font-size: 14px; text-align: center; max-width: 220px; line-height: 1.35; }
.tmm-panel figcaption b { font: 400 18px/1 var(--qm-font-title); display: block; margin-bottom: 3px; }
.tmm-inst { display: flex; align-items: center; gap: 10px; cursor: grab; }
.tmm-dial-host { position: relative; width: 150px; height: 150px; }
.tmm-dial-host .sundial { position: static !important; width: 150px !important; height: 150px !important; }
.tmm-lou-svg { width: 120px; height: 210px; }
.tmm-lou-glyph, .tmm-ring-glyph { font-family: var(--qm-font-text); fill: #2a2420; }
.tmm-ring-svg { width: 190px; height: 190px; }
.tmm-ring-glyph.n { fill: #e9e2cf; } .tmm-ring-glyph.on { fill: #b5321e; }
.tmm-ring-big { font-family: var(--qm-font-text); fill: #1d1916; } .tmm-ring-small { font-family: var(--qm-font-text); fill: #2a2420; }
.tmm-name { writing-mode: vertical-rl; text-orientation: upright; display: flex; gap: 4px; align-items: flex-start; padding: 8px 6px;
  border: 6px solid transparent; border-image: var(--qm-frame-plaque) 24 / 6px / 0 stretch; border-image-slice: 24 fill; }
.tmm-big { font: 400 28px/1 var(--qm-font-text); color: #1d1916; } .tmm-small { font: 400 14px/1 var(--qm-font-text); }
@media (max-width: 640px) {
  .tmm-panel { grid-template-columns: 1fr; gap: 10px; padding: 10px 12px; top: auto; bottom: 10px; transform: translateX(-50%); max-height: 70vh; overflow: auto; }
  .tmm-panel figure { grid-template-columns: auto 1fr; justify-items: start; align-items: center; }
  .tmm-dial-host, .tmm-dial-host .sundial { width: 96px !important; height: 96px !important; }
  .tmm-lou-svg { width: 70px; height: 122px; } .tmm-ring-svg { width: 110px; height: 110px; } .tmm-big { font-size: 22px; }
  .tmm-panel figcaption { font-size: 12px; text-align: left; }
}`;
