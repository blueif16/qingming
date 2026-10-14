// The start screen (the user, 2026-10-13: "the game shouldn't just load there automatically. It should wait for me to
// press Start so that we can show some info on the start screen"; "show them the painting underneath so they can feel
// like, okay, we're actually going to the scroll"). Its markup and CSS are inline in world.html (.ld-start and the
// painting's band .ld-band inside #loading, shown while #loading has .ld-wait), so it paints before any script, on the
// same paper the loading stroke then draws across. Behind it world.js already loads the section you start in, its kit,
// your character and then its cast (the user, 2026-10-13: "pre loading some of the assets at the start screen ... and
// then we can continue with the progressive loadings"), so a visitor who reads it a while walks in almost at once; the
// rest of the window streams in after the press, as before. Pressing it: the band glides to where you start (its
// data-focus, a scan u) and swells into the paper, the lines fade, and the stroke takes their place.
// waitForStart() resolves at the press with the glide's length in ms (0 when the screen was skipped or motion is
// reduced): world.js lifts the paper no sooner, so the glide always lands.
// No wait with ?start=0, on a page without the screen (gate.html), or in a browser under automation (navigator.webdriver:
// the headless checks, benches and the deploy check), so the tools never stop at it and never see the band.
import './start.css';

const LEAVE_MS = 400;
const GLIDE_MS = 1800; // the band's glide to where you start (focusBand)
// the checks drive headless Chrome over CDP without --enable-automation, where navigator.webdriver stays false; its
// user agent still says HeadlessChrome
const automated = () => navigator.webdriver || /HeadlessChrome/.test(navigator.userAgent);

export function waitForStart(query = new URLSearchParams(location.search)) {
  const box = document.getElementById('loading');
  const panel = box?.querySelector('.ld-start');
  if (!panel) return Promise.resolve(0);
  const band = box.querySelector('.ld-band');
  // the info goes (no text may stay in #loading for the tools), and the stroke and its hint take its place
  const swap = () => {
    panel.remove();
    box.classList.remove('ld-wait', 'ld-leaving');
    box.classList.add('ld-entered');
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', '清明上河圖 · 載入中');
    box.removeAttribute('aria-modal');
  };
  if (query.get('start') === '0' || automated()) { band?.remove(); swap(); return Promise.resolve(0); }
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) focusBand(band, 0); // no drift: the band rests where you will start
  addAbout(box, panel);
  return new Promise((resolve) => {
    const btn = panel.querySelector('.ld-go');
    // the world's keys (Space, V, O, M, WASD ...) wait too. Enter or Space on the focused button presses it (its default
    // action, which stopping the event's propagation leaves alone); Enter anywhere else starts as well.
    const keys = (e) => {
      if (e.key === 'Tab') return;
      e.stopImmediatePropagation();
      if (e.type === 'keydown' && e.key === 'Enter' && e.target !== btn) { e.preventDefault(); go(); }
    };
    const go = () => {
      removeEventListener('keydown', keys, true);
      removeEventListener('keyup', keys, true);
      btn.disabled = true;
      // back to the top at once (the band's glide is measured from there), and the 卷記 goes
      box.scrollTo({ top: 0, behavior: 'instant' });
      box.querySelector('.ld-about')?.remove();
      // the band swells until it fills the screen top to bottom, so the painting lies under the whole loading paper
      if (band) box.style.setProperty('--zoom', Math.max(2.6, (innerHeight * 1.1) / band.clientHeight).toFixed(2));
      if (!still) focusBand(band, GLIDE_MS);
      box.classList.add('ld-entering', 'ld-leaving');
      setTimeout(swap, still ? 0 : LEAVE_MS);
      resolve(still ? 0 : GLIDE_MS);
    };
    addEventListener('keydown', keys, true);
    addEventListener('keyup', keys, true);
    btn.addEventListener('click', go, { once: true });
    btn.focus({ preventScroll: true, focusVisible: false }); // Enter and Space press it; the ring shows once you Tab
    if (window.__qmEarlyGo) go(); // pressed before this script was in (world.html keeps that tap): it counts
  });
}

// the 卷記 under the band (about.json; the user, 2026-10-13: why the scroll was painted, its time, was the city
// prosperous, what the painter meant, and a short note on the maker): a lazy chunk with its own lazy font subset, so a
// visit that goes straight in pays almost nothing for it. The 卷記 link under the credits scrolls down to it.
function addAbout(box, panel) {
  const el = (tag, cls, kids = [], attrs = {}) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    for (const c of [].concat(kids)) if (c != null) n.append(c);
    return n;
  };
  const gloss = (t) => (t ? el('span', 'ld-gloss', t) : null);
  import('./about.json').then(({ default: a }) => {
    if (!box.classList.contains('ld-wait')) return; // already gone in
    const main = el('div', 'ld-about-main', [el('h2', '', [a.title, gloss(a.title_en)])]);
    for (const s of a.sections) {
      main.append(el('section', '', [
        el('h3', '', [el('span', 'ld-seal', s.seal, { 'aria-hidden': 'true' }), s.head, gloss(s.head_en)]),
        ...s.body.map((p, i) => el('p', '', [p, gloss(s.body_en?.[i])])),
      ]));
    }
    const m = a.maker;
    const maker = el('aside', 'ld-maker', [
      el('h4', '', [m.head, gloss(m.head_en)]),
      el('p', 'ld-name', [m.name, gloss(m.name_en)]),
      el('p', '', [m.line, gloss(m.line_en)]),
      el('div', 'ld-links', m.links.map((l) => el('a', '', l.label, { href: l.href, target: '_blank', rel: 'noopener' }))),
    ]);
    const about = el('div', 'ld-about', [main, maker], { id: 'ld-about' });
    box.append(about);
    const more = el('a', 'ld-more', [a.title, gloss(`${a.title_en} ↓`)], { href: '#ld-about' });
    more.addEventListener('click', (e) => { e.preventDefault(); about.scrollIntoView({ behavior: 'smooth' }); });
    panel.append(more);
  }).catch((err) => console.warn('卷記 failed to load:', err));
}

// slide the band so its focus point (data-focus, in scan u between data-u0 and data-u1) sits mid-screen, from wherever
// its drift has got to; the zoom round the middle is the CSS of .ld-entering
function focusBand(band, ms) {
  const inner = band?.querySelector('.ld-band-in'), img = inner?.querySelector('img');
  if (!inner || !img) return;
  const { u0, u1, focus } = band.dataset;
  const f = (Number(focus) - Number(u0)) / (Number(u1) - Number(u0));
  const w = img.getBoundingClientRect().width || (band.clientHeight * img.width) / img.height;
  const x = band.clientWidth / 2 - f * w;
  const from = getComputedStyle(inner).transform;
  inner.style.animation = 'none';
  inner.style.transform = `translateX(${x}px)`;
  if (ms && from && from !== 'none') inner.animate([{ transform: from }, { transform: `translateX(${x}px)` }], { duration: ms, easing: 'cubic-bezier(0.6, 0, 0.2, 1)' });
}
