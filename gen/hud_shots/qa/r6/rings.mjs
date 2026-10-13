// independent: map frames -> scan point at H 0 for each shot's player X, D; compare with the drawn ring
import fs from 'node:fs';
const Q = '/home/ran/3d_director/qingming';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const fr = {}; for (const S of ['S4', 'S5', 'S6']) fr[S] = JSON.parse(fs.readFileSync(`${Q}/map/frames/${S}.json`, 'utf8'));
const dxAt = (k, u) => { if (u <= k[0][0]) return k[0][1]; for (let i = 0; i + 1 < k.length; i++) if (u <= k[i + 1][0]) return k[i][1] + (k[i + 1][1] - k[i][1]) * (u - k[i][0]) / (k[i + 1][0] - k[i][0]); return k[k.length - 1][1]; };
for (const [n, s] of Object.entries(d)) {
  if (Array.isArray(s)) continue;
  const f = fr[s.you.section].frames[0], { X, D } = s.player;
  let u = f.origin[0] + f.x[0] * X; for (let i = 0; i < 200; i++) u = f.origin[0] + f.x[0] * X + dxAt(f.dx_knots, u) * D;
  const v0 = f.origin[1] + f.d[1] * D;
  console.log(n, 'player', s.player, 'H0 ring', u.toFixed(1), v0.toFixed(1), '| drawn', s.view.u.toFixed(1), s.view.v.toFixed(1), '=> H used', ((v0 - s.view.v) / f.h).toFixed(3), 'du', (s.view.u - u).toFixed(1));
}
console.log('supports', JSON.stringify(fr.S4.supports), '\n', JSON.stringify(Object.fromEntries(Object.entries(fr.S5.supports).map(([k, v]) => [k, v.H]))), JSON.stringify(Object.fromEntries(Object.entries(fr.S6.supports || {}).map(([k, v]) => [k, v.H]))));
