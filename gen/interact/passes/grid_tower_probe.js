const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ix = t.interact, P = t.player;
await t.view('tower'); await wait(3500);
const sp = ix.state().spots.find((s) => s.id === 'tower');
const V = P.pos.constructor;
const rows = [], step = 0.25;
const X0 = -24, X1 = -8, D0 = -4, D1 = 9;
for (let D = D1; D >= D0; D -= step) {
  let line = '';
  for (let X = X0; X <= X1; X += step) {
    const g = ix.ground(X, D, 9.6);
    if (!g || g.y < 9.4 || g.y > 10.6) { line += g && g.y > 10.6 ? '^' : ' '; continue; }
    const p = new V(X, g.y + 0.03, -D), r = P.resolve(p.clone());
    const moved = Math.hypot(r.x - p.x, r.z - p.z), up = r.y - p.y;
    line += moved < 0.02 && up < 0.05 ? '.' : moved < 0.1 ? '+' : '#';
  }
  rows.push(D.toFixed(2).padStart(6) + ' ' + line);
}
// the same, one level up: the balcony floor (12.06)
const rows2 = [];
for (let D = D1; D >= D0; D -= step) {
  let line = '';
  for (let X = X0; X <= X1; X += step) {
    const g = ix.ground(X, D, 11.8);
    if (!g || g.y < 11.6 || g.y > 12.6) { line += ' '; continue; }
    const p = new V(X, g.y + 0.03, -D), r = P.resolve(p.clone());
    const moved = Math.hypot(r.x - p.x, r.z - p.z), up = r.y - p.y;
    line += moved < 0.02 && up < 0.05 ? '.' : moved < 0.1 ? '+' : '#';
  }
  rows2.push(D.toFixed(2).padStart(6) + ' ' + line);
}
return { spot: sp.p, X0, X1, step, terrace: rows, balcony: rows2 };
