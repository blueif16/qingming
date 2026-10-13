# Walk planner over a grid.json (free floors per cell from the page's own capsule) and the people's bodies, for
# designing walk_page routes: plan(waypoints) -> legs [[facing_deg, seconds], ...] at 2.2 m/s and the end point.
# python3 planner.py <grid.json> "X,D;X,D;..." [--level lo,hi] [--cl 0.15] [--skip id,id]
import json, math, heapq, sys, os
SPEED = 2.2

class Grid:
    def __init__(self, path, cl=0.15, skip=(), lvl=None):
        G = json.load(open(path))
        self.x0, self.d1, self.st = G['x0'], G['d1'], G['st']
        self.rows = G['rows']; self.NR = len(self.rows); self.NC = len(self.rows[0])
        self.people = G.get('people', [])
        self.cl = cl
        NR, NC, st = self.NR, self.NC, self.st
        # the floor of each cell: the free floor nearest to the level band (default: ground and decks -1.2..2.5)
        lo, hi = lvl or (-1.25, 2.6)
        self.F = [[None] * NC for _ in range(NR)]
        geom = os.environ.get('GEOM') == '1'
        for r in range(NR):
            for c in range(NC):
                if geom:
                    hs = self.rows[r][c][0]  # all surfaces, top first
                    fl = None
                    for i, y in enumerate(hs):
                        if lo <= y <= hi and (i == 0 or hs[i - 1] - y > 1.9):
                            fl = y; break
                    self.F[r][c] = fl
                    continue
                fs = [y for y in self.rows[r][c][1] if lo <= y <= hi]
                self.F[r][c] = min(fs) if fs else None  # lowest free floor in band
        free = [[self.F[r][c] is not None for c in range(NC)] for r in range(NR)]
        if geom and os.environ.get('CAPS') == '1':
            # the capsule test (rows[r][c][1]: floors where the page's capsule stands unmoved) at the cell's floor; a
            # wall shows as a band of failing cells, a slope's false negative as an isolated one: block only cells that
            # fail with at least two failing neighbours
            fail = [[free[r][c] and not any(abs(y - self.F[r][c]) < 0.06 for y in self.rows[r][c][1]) for c in range(NC)] for r in range(NR)]
            for r in range(NR):
                for c in range(NC):
                    if not fail[r][c]: continue
                    n = sum(1 for dr in (-1, 0, 1) for dc in (-1, 0, 1) if (dr or dc) and 0 <= r + dr < NR and 0 <= c + dc < NC and fail[r + dr][c + dc])
                    if n >= 2: free[r][c] = False
        # clearance: a cell is usable if all cells within cl are free with a floor within a step
        k = int(math.ceil(cl / st))
        self.free = [[False] * NC for _ in range(NR)]
        for r in range(NR):
            for c in range(NC):
                if not free[r][c]: continue
                f = self.F[r][c]; ok = True
                for dr in range(-k, k + 1):
                    for dc in range(-k, k + 1):
                        if dr * dr + dc * dc > k * k: continue
                        rr, cc = r + dr, c + dc
                        if not (0 <= rr < NR and 0 <= cc < NC) or not free[rr][cc] or abs(self.F[rr][cc] - f) > 0.4: ok = False; break
                    if not ok: break
                self.free[r][c] = ok
        for p in self.people:
            if p['id'] in skip: continue
            for (x, d, rad) in p['c']:
                R = rad + 0.3 + cl; r0, c0 = self.rc(x, d); kk = int(math.ceil(R / st))
                for dr in range(-kk, kk + 1):
                    for dc in range(-kk, kk + 1):
                        rr, cc = r0 + dr, c0 + dc
                        if not (0 <= rr < NR and 0 <= cc < NC): continue
                        X, D = self.XD(rr, cc); f = self.F[rr][cc]
                        if f is not None and abs(f - p['H']) > 1.2: continue
                        if math.hypot(X - x, D - d) < R: self.free[rr][cc] = False
        if os.environ.get('WALKERS') == '1':
            P = json.load(open('/home/ran/3d_director/qingming/sections/canal/people.json'))
            R = 0.26 + 0.3 + cl + 0.1
            for w in P.get('walkers', []):
                pts = w['path']
                for a_, b_ in zip(pts, pts[1:]): self.block_seg(a_, b_, R)
            Lf = {f['id']: f for f in json.load(open('/home/ran/3d_director/qingming/sections/canal/layout.json'))['figures']}
            for b in (P.get('boats') or {}).values():
                for tid in (b.get('haul') or {}):
                    f = Lf.get(tid)
                    if f: self.block_seg((f['X'] - 4.6, f['D'] + 0.4), (f['X'] + 0.6, f['D'] - 0.4), R)

    def block_seg(self, a, b, R):
        n = int(math.hypot(b[0] - a[0], b[1] - a[1]) / (self.st / 2)) + 1
        for i in range(n + 1):
            x, d = a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n
            r0, c0 = self.rc(x, d); kk = int(math.ceil(R / self.st))
            for dr in range(-kk, kk + 1):
                for dc in range(-kk, kk + 1):
                    rr, cc = r0 + dr, c0 + dc
                    if 0 <= rr < self.NR and 0 <= cc < self.NC:
                        X, D = self.XD(rr, cc)
                        if math.hypot(X - x, D - d) < R: self.free[rr][cc] = False

    def rc(self, X, D): return round((self.d1 - D) / self.st), round((X - self.x0) / self.st)
    def XD(self, r, c): return self.x0 + c * self.st, self.d1 - r * self.st

    def nearest_free(self, X, D, rad=1.0):
        r0, c0 = self.rc(X, D); best = None; k = int(rad / self.st)
        for dr in range(-k, k + 1):
            for dc in range(-k, k + 1):
                r, c = r0 + dr, c0 + dc
                if 0 <= r < self.NR and 0 <= c < self.NC and self.free[r][c]:
                    d = dr * dr + dc * dc
                    if best is None or d < best[0]: best = (d, (r, c))
        return best[1] if best else None

    def astar(self, a, b):
        st, gl = self.nearest_free(*a), self.nearest_free(*b)
        if not st or not gl: return None, f'no free cell near {"start" if not st else "goal"}'
        g = {st: 0}; prev = {}; pq = [(0, st)]
        while pq:
            _, c = heapq.heappop(pq)
            if c == gl: break
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    if not dr and not dc: continue
                    n = (c[0] + dr, c[1] + dc)
                    if not (0 <= n[0] < self.NR and 0 <= n[1] < self.NC) or not self.free[n[0]][n[1]]: continue
                    if self.F[n[0]][n[1]] - self.F[c[0]][c[1]] > 0.3: continue
                    cost = g[c] + math.hypot(dr, dc)
                    if cost < g.get(n, 1e18):
                        g[n] = cost; prev[n] = c
                        heapq.heappush(pq, (cost + math.hypot(gl[0] - n[0], gl[1] - n[1]), n))
        if gl != st and gl not in prev: return None, 'no path'
        path = [gl]
        while path[-1] != st: path.append(prev[path[-1]])
        path.reverse()
        return path, None

    def clear(self, a, b):
        n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1])) * 3) + 1
        f0 = self.F[a[0]][a[1]]
        for i in range(n + 1):
            r = round(a[0] + (b[0] - a[0]) * i / n); c = round(a[1] + (b[1] - a[1]) * i / n)
            if not self.free[r][c]: return False
        return True

    def simplify(self, path):
        out = [path[0]]; i = 0
        while i < len(path) - 1:
            j = len(path) - 1
            while j > i + 1 and not self.clear(path[i], path[j]): j -= 1
            out.append(path[j]); i = j
        return out

    def legs(self, wps):
        pts = []
        for a, b in zip(wps, wps[1:]):
            p, err = self.astar(a, b)
            if err: return None, f'{a}->{b}: {err}'
            pts += p if not pts else p[1:]
        s = self.simplify(pts)
        XY = [self.XD(*q) for q in s]
        L = []
        for (x0, d0), (x1, d1) in zip(XY, XY[1:]):
            dist = math.hypot(x1 - x0, d1 - d0)
            if dist < 0.05: continue
            L.append([round(math.degrees(math.atan2(d1 - d0, x1 - x0)) % 360, 1), round(dist / SPEED, 2)])
        return {'start': [round(XY[0][0], 2), round(XY[0][1], 2)], 'legs': L, 'end': [round(XY[-1][0], 2), round(XY[-1][1], 2)],
                'endF': self.F[s[-1][0]][s[-1][1]], 'pts': [[round(x, 2), round(d, 2)] for x, d in XY]}, None

if __name__ == '__main__':
    a = sys.argv[1:]
    cl = float(a[a.index('--cl') + 1]) if '--cl' in a else 0.15
    skip = a[a.index('--skip') + 1].split(',') if '--skip' in a else ()
    lvl = tuple(map(float, a[a.index('--level') + 1].split(','))) if '--level' in a else None
    G = Grid(a[0], cl, skip, lvl)
    wps = [tuple(map(float, w.split(','))) for w in a[1].split(';')]
    r, err = G.legs(wps)
    print(json.dumps(r) if r else err)
