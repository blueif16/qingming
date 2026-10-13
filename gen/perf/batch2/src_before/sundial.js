// The time, shown as people of the scroll's day read it: a Song equatorial sundial (日晷). Its face is the painted
// stone disc (tools/make_sundial.mjs), seen from the north as it stands tilted towards the pole; the twelve double
// hours (时辰) are carved round it, 子 (midnight) at the top and 午 (noon) at the bottom, with the hundred 刻 of the day
// as ticks. In April the sun is north of the equator, so it lights this upper face all day and the gnomon's shadow
// sweeps it evenly, 15 degrees an hour, clockwise: it points at the double hour you are in, whose character is filled
// with cinnabar. The disc takes the world's light (dawn pink, noon white, dusk gold, night blue). After dark there
// (or in twilight) there is no shadow; the moon, at tonight's real phase, rides the ring instead.
// Hovering shows the reading in words and the clock time.
import * as THREE from 'three';
import { BRANCHES, GLYPHS } from './sundial_glyphs.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent = null) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const WATCHES = ['一更', '二更', '三更', '四更', '五更']; // the night watches, drummed from 戌 (19:00) to the end of 寅 (05:00)
const GLYPH_R = 57, GLYPH_SIZE = 22, MOON_R = 80;

// the double hour at `hour`: its branch (0 = 子, 23:00-01:00) and its half (初, the first hour; 正, the second)
export function doubleHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  const i = Math.floor(((h + 1) % 24) / 2);
  return { index: i, name: BRANCHES[i] + (Math.floor(h) % 2 === 1 ? '初' : '正') };
}

// the lit part of a moon of radius r at phase p (0 new, 0.5 full), waxing lit on the right as seen from the north
function moonPath(r, p) {
  const waxing = p < 0.5, c = Math.cos(2 * Math.PI * p), rx = Math.max(0.01, Math.abs(c) * r);
  const outer = waxing ? 1 : 0, term = waxing ? (c < 0 ? 1 : 0) : (c > 0 ? 1 : 0);
  return `M0 ${-r} A${r} ${r} 0 0 ${outer} 0 ${r} A${rx} ${r} 0 0 ${term} 0 ${-r}Z`;
}

const toCss = ([r, g, b]) => `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
const NIGHT_FLOOR = [0.42, 0.47, 0.62]; // sRGB: the dial still reads by moonlight and starlight
const lit = new THREE.Color(), tmp = new THREE.Color();

export class Sundial {
  constructor(parent, faceUrl = 'assets/ui/sundial_face.webp') {
    this.root = document.createElement('div');
    this.root.className = 'sundial';
    parent.appendChild(this.root);
    const svg = el('svg', { viewBox: '-100 -100 200 200', role: 'img' });
    this.root.appendChild(svg);
    this.label = el('title', {}, svg);
    const defs = el('defs', {}, svg);
    const blur = el('filter', { id: 'sundial-soft', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: 1.1 }, blur);
    const clip = el('clipPath', { id: 'sundial-disc' }, defs);
    el('circle', { r: 99 }, clip);

    el('image', { href: faceUrl, x: -100, y: -100, width: 200, height: 200 }, svg);
    const carved = el('g', { 'clip-path': 'url(#sundial-disc)' }, svg);
    // the hundred 刻 (from midnight, 3.6 degrees apart) and the twelve boundaries between double hours
    let ticks = '', bounds = '';
    for (let k = 0; k < 100; k++) {
      const a = (k * 3.6 * Math.PI) / 180, s = Math.sin(a), c = -Math.cos(a);
      ticks += `M${(s * 76).toFixed(2)} ${(c * 76).toFixed(2)}L${(s * 81).toFixed(2)} ${(c * 81).toFixed(2)}`;
    }
    for (let k = 0; k < 12; k++) {
      const a = ((k * 30 + 15) * Math.PI) / 180, s = Math.sin(a), c = -Math.cos(a);
      bounds += `M${(s * 67).toFixed(2)} ${(c * 67).toFixed(2)}L${(s * 82).toFixed(2)} ${(c * 82).toFixed(2)}`;
    }
    for (const [d, w, o] of [[ticks, 0.7, 0.5], [bounds, 1.1, 0.7]]) {
      el('path', { d, stroke: '#fff', 'stroke-width': w, opacity: 0.35, transform: 'translate(0.5 0.6)' }, carved);
      el('path', { d, stroke: '#2a2420', 'stroke-width': w, opacity: o }, carved);
    }
    // the branches, upright, each a carved cut: a light lower edge under the dark stroke
    this.glyphs = [];
    for (let k = 0; k < 12; k++) {
      const a = (k * 30 * Math.PI) / 180, x = Math.sin(a) * GLYPH_R, y = -Math.cos(a) * GLYPH_R;
      const t = `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${GLYPH_SIZE / 100})`;
      const d = GLYPHS[BRANCHES[k]];
      el('path', { d, fill: '#fff', opacity: 0.4, transform: `translate(${(x + 0.5).toFixed(2)} ${(y + 0.7).toFixed(2)}) scale(${GLYPH_SIZE / 100})` }, carved);
      this.glyphs.push(el('path', { d, fill: '#2a2420', opacity: 0.85, transform: t }, carved));
    }
    // the gnomon's shadow: a narrow band from the pin to the ring, softening towards its end
    this.shadow = el('g', {}, carved);
    el('path', { d: 'M-2.1 0L-2.6 -82Q0 -85 2.6 -82L2.1 0Z', fill: '#1d2230', filter: 'url(#sundial-soft)' }, this.shadow);
    el('circle', { r: 4.5, fill: '#1d2230', opacity: 0.5, filter: 'url(#sundial-soft)', transform: 'translate(0 -1)' }, this.shadow);
    // the world's light on the stone
    this.tint = el('circle', { r: 100, fill: '#fff', style: 'mix-blend-mode: multiply' }, svg);
    // the moon on the ring after dark
    this.moon = el('g', { opacity: 0 }, svg);
    el('circle', { r: 13, fill: '#dfe6ff', opacity: 0.22, filter: 'url(#sundial-soft)' }, this.moon);
    el('circle', { r: 9, fill: '#2b3350', stroke: '#c9d2ea', 'stroke-width': 0.8, opacity: 0.92 }, this.moon);
    this.moonLit = el('path', { fill: '#f3eedb' }, this.moon);
    this.current = -1;
  }

  // hour: the world's time of day; light: daylight.js lightAt(); local: whether the hour is the viewer's own clock
  set(hour, light, { local = true, clockText = '' } = {}) {
    const h = ((hour % 24) + 24) % 24, angle = h * 15;
    const { index, name } = doubleHour(h);
    if (index !== this.current) {
      if (this.current >= 0) { this.glyphs[this.current].setAttribute('fill', '#2a2420'); this.glyphs[this.current].setAttribute('opacity', 0.85); }
      this.glyphs[index].setAttribute('fill', '#a3352a');
      this.glyphs[index].setAttribute('opacity', 0.95);
      this.current = index;
    }
    // the shadow, as strong as the sunlight
    const sun = THREE.MathUtils.clamp(light.sunIntensity / 2.2, 0, 1);
    this.shadow.setAttribute('transform', `rotate(${angle.toFixed(2)})`);
    this.shadow.setAttribute('opacity', (0.62 * sun).toFixed(3));
    // the light on the face: sky fill, sun and moon, relative to noon, never darker than the night floor
    lit.copy(light.hemiSky).multiplyScalar(light.hemiIntensity * 0.6)
      .add(tmp.copy(light.sunColor).multiplyScalar(Math.min(light.sunIntensity, 3) * 0.16))
      .add(tmp.copy(light.moonColor).multiplyScalar(light.moonIntensity * 0.3))
      .multiplyScalar(1 / 0.82);
    lit.convertLinearToSRGB(); // from here r, g, b hold sRGB values
    this.tint.setAttribute('fill', toCss([lit.r, lit.g, lit.b].map((v, i) => Math.min(1, Math.max(NIGHT_FLOOR[i], v)))));
    // the moon on the ring, at the hour, after dark
    const a = (angle * Math.PI) / 180;
    this.moon.setAttribute('transform', `translate(${(Math.sin(a) * MOON_R).toFixed(2)} ${(-Math.cos(a) * MOON_R).toFixed(2)})`);
    // shown from the moment the shadow fades (twilight has no shadow yet no stars either)
    this.moon.setAttribute('opacity', Math.max(light.night, 1 - THREE.MathUtils.smoothstep(sun, 0, 0.25)).toFixed(3));
    if (this.moonPhase !== light.moonPhase) { this.moonLit.setAttribute('d', moonPath(9, light.moonPhase)); this.moonPhase = light.moonPhase; }
    // in words, on hover
    const watch = h >= 19 || h < 5 ? WATCHES[Math.floor(((h - 19 + 24) % 24) / 2)] + ' · ' : '';
    const text = `${watch}${name} · ${clockText}${local ? ' (your local time)' : ' (set in the panel)'}`;
    if (this.label.textContent !== text) this.label.textContent = text;
  }
}
