import * as E from './eye_check.mjs';
const [names, src] = [process.argv[2].split(','), process.argv[3] === 'src'];
for (const name of names) {
  const cf = E.charFiles(name);
  const doc = await (await E.getIO()).read(E.ROOT + '/' + (src ? cf.rigged : cf.glb));
  const g = E.bodyGeom(doc), t = await E.decodeTex(g.tex), fr = E.faceRender(g, t), skin = E.skinTone(fr);
  const [cx, cy] = process.argv.slice(4, 6).map(Number);
  console.log(name, 'skin lum', skin.lum.toFixed(2), 'sat', skin.sat.toFixed(2));
  for (let y = cy + 12; y >= cy - 10; y -= 1) {
    let line = '', line2 = '';
    for (let x = cx - 24; x <= cx + 24; x += 1) {
      const k = E.pyOf(y) * fr.Wd + E.pxOf(x), c = [fr.rgb[k * 3], fr.rgb[k * 3 + 1], fr.rgb[k * 3 + 2]];
      const D = 1 - E.lumOf(c) / skin.lum, [h, s, v] = E.hsv(...c);
      // symbol: # D>=.38, + D>=.2, . D>=.1, ' ' skin, o sclera (lighter & less saturated)
      line += D >= 0.38 ? '#' : D >= 0.2 ? '+' : D >= 0.1 ? '.' : (D <= -0.03 && s <= skin.sat * 0.75) ? 'o' : (s <= skin.sat * 0.75) ? '-' : ' ';
    }
    console.log(String(y).padStart(4), line);
  }
}
