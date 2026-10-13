import * as E from './eye_check.mjs';
for (const name of process.argv[2].split(',')) {
  const c = await E.checkCharacter(name, { src: process.argv[3] === 'src' });
  const skin = c.m.skin;
  for (const T of [0.38, 0.5, 0.62]) {
    const ic = E.inkComponents(c.fr, skin, { ink: T });
    for (const p of E.mirroredPairs(ic.comps)) {
      const ok = p.minArea >= 12 && p.fill >= 0.45 && p.elong <= 2.4 && p.gap >= 12 && p.sep >= 35;
      console.log(name, T, ok ? 'EYEISH' : '      ', 'y', p.cy.toFixed(1), 'sep', p.sep.toFixed(1), 'mid', p.mid.toFixed(1), 'gap', p.gap.toFixed(1), 'w', p.a.w.toFixed(1), p.b.w.toFixed(1), 'h', p.a.h.toFixed(1), p.b.h.toFixed(1), 'minA', p.minArea.toFixed(0), 'fill', p.fill.toFixed(2), 'elong', p.elong.toFixed(2));
    }
  }
}
