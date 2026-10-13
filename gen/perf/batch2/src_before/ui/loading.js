// The loading/title screen (world.html #loading; its markup and CSS are inline there so it paints before any script):
// paper, mist, the title and seal, and the progress as one ink stroke drawing across, no numbers. The page reports
// progress at a few milestones; between them the stroke creeps on by itself. When the world is in, the id goes at once
// (tools treat any text left in #loading after window.__test as a failed load) and the paper wipes away to the street.
// Later the opening animation grows out of this: the same layers (.ld-paper, .ld-mist, .ld-mark, .ld-stroke) are what
// it animates, and done() is where it starts (gen/ui/STYLE.md "Loading and the opening").
export class Loading {
  constructor(el) {
    this.el = el;
    this.f = 0;
    if (!el) return;
    el.classList.add('ld-js');
    this.set(0.08);
  }

  set(f) {
    if (!this.el) return;
    this.f = Math.max(this.f, Math.min(1, f));
    this.el.style.setProperty('--ld', this.f.toFixed(3));
  }

  // a milestone: the stroke jumps there, then creeps a little towards the next one while we wait
  progress(f, next = Math.min(1, f + 0.12)) {
    this.set(f);
    clearInterval(this.creep);
    const t0 = performance.now();
    this.creep = setInterval(() => {
      const k = 1 - Math.exp(-(performance.now() - t0) / 4000);
      this.set(f + (next - f) * 0.8 * k);
    }, 250);
  }

  done() {
    clearInterval(this.creep);
    const el = this.el;
    if (!el) return;
    this.set(1);
    el.removeAttribute('id'); // the world is in: no #loading for the tools from here on (its CSS is keyed on .ld, so it keeps its look)
    el.setAttribute('aria-hidden', 'true');
    if (!el.querySelector('.ld-paper')) { el.remove(); return; } // a page with the old plain loading line (gate.html)
    el.classList.add('ld-out');
    setTimeout(() => el.remove(), 1400);
  }
}
