// Small brush icons for the ink UI (gen/ui/STYLE.md §14): the view tiles' eye and figure, the › of the direct HUD and
// the settings screen's steppers. Tapered strokes from ink.js, drawn once from fixed seeds, as inline SVG strings
// (fill: currentColor; the eye's light is .qm-ic-hi, filled with --qm-ic-hole by the CSS).
import { strokePath, rng } from './ink.js';

const curve = (a, c, b, n = 14) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
});
const svg = (body, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
let ICONS = null;
export function icons() {
  if (ICONS) return ICONS;
  const r = rng(61);
  // an eye: the upper lid a full brush stroke, the lower a thin one, the pupil with a light in it
  const lids = strokePath(curve([1.8, 12.8], [12, 2.6], [22.2, 11.8]), 2.7, 1.2, { r, jitter: 0.12 })
    + strokePath(curve([3.6, 13.4], [12, 20.4], [20.6, 12.4]), 1.5, 0.8, { r, jitter: 0.1 });
  const eye = svg(`<path d="${lids}"/><circle cx="12" cy="12.2" r="3.5"/><circle class="qm-ic-hi" cx="13.3" cy="11" r="1.05"/>`);
  // a figure from behind in a robe, a topknot, its shadow on the ground (you, seen from the camera)
  const r2 = rng(67);
  const ground = strokePath(curve([3.2, 21.7], [12, 23.1], [20.8, 21.5]), 1.5, 0.7, { r: r2, jitter: 0.1 });
  const figure = svg(`<circle cx="12" cy="2.9" r="1.25"/><circle cx="12" cy="6.1" r="2.65"/>`
    + `<path d="M8.6 9.3 Q12 7.8 15.4 9.3 Q18.5 10.6 18.9 14.3 L16.7 14.6 L17.6 19.5 Q12 20.8 6.4 19.5 L7.3 14.6 L5.1 14.3 Q5.5 10.6 8.6 9.3 Z"/><path d="${ground}"/>`);
  // the arrow: two brush strokes meeting at the point
  const r3 = rng(71);
  const chevR = strokePath(curve([7.6, 3.8], [11.2, 7.6], [16.2, 12]), 2.9, 2.2, { r: r3, jitter: 0.1 })
    + strokePath(curve([16.2, 12], [11.4, 16.4], [7.8, 20.2]), 2.3, 1.0, { r: r3, jitter: 0.1 });
  const more = svg(`<path d="${chevR}"/>`);
  ICONS = { eye, figure, more, right: more, left: svg(`<path d="${chevR}" transform="translate(24 0) scale(-1 1)"/>`) };
  return ICONS;
}

