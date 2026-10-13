# A planner over S3's colliders (probe/hits.json at 0.1 m), people's bodies (probe/people.json) and the edge walls
# (polylines below), for designing walk_page routes. plan(start, goal) -> legs [[heading, seconds], ...] at 2.2 m/s.
import json, math, heapq, os
Q = os.path.dirname(os.path.abspath(__file__))
X0, X1, D0, D1, ST = 78, 164, -8, 36, 0.1
RAW = json.load(open(f'{Q}/probe/' + os.environ.get('HITS', 'hits2.json')))
HITS = [[sorted(-(v + 1000) if v <= -1000 else v for v in c) for c in row] for row in RAW]
DOWN = [[[-(v + 1000) for v in c if v <= -1000] for c in row] for row in RAW]
PEOPLE = json.load(open(f'{Q}/probe/people.json'))
plan = json.load(open('/home/ran/3d_director/qingming/gen/sections/rainbow_bridge/bridge_plan.json'))
river = json.load(open('/home/ran/3d_director/qingming/gen/sections/rainbow_bridge/river_plan.json'))
TAB = [(r['s'], r['H']) for r in plan['deck_table']]
C0 = (126.472, 10.63); U = (0.66, 0.751); N = (-0.751, 0.66)
def so(X, D): dx, dd = X - C0[0], D - C0[1]; return dx * U[0] + dd * U[1], dx * N[0] + dd * N[1]
def xy(s, o): return (C0[0] + U[0] * s + N[0] * o, C0[1] + U[1] * s + N[1] * o)
def deckH(s):
    if s <= TAB[0][0] or s >= TAB[-1][0]: return 0.0
    for (a, ha), (b, hb) in zip(TAB, TAB[1:]):
        if a <= s <= b: return ha + (hb - ha) * (s - a) / (b - a)
NR, NC = len(HITS), len(HITS[0])
def rc(X, D): return round((D1 - D) / ST), round((X - X0) / ST)
def XD(r, c): return X0 + c * ST, D1 - r * ST
FLOOR = [[None] * NC for _ in range(NR)]; BLOCK = [[False] * NC for _ in range(NR)]
for r in range(NR):
    for c in range(NC):
        hs = HITS[r][c]
        if not hs: BLOCK[r][c] = True; continue
        X, D = XD(r, c); s, o = so(X, D)
        f = None
        if -0.5 <= s <= 26.5 and abs(o) <= 4.3:
            h0 = deckH(s); near = [h for h in hs if abs(h - h0) < 0.35]
            if near: f = near[-1]
        if f is None:
            g = [h for h in hs if h >= -1.6]
            f = g[0] if g else hs[-1]
        FLOOR[r][c] = f
        if f < -0.45: BLOCK[r][c] = True  # the bank below the shore line: the shore walls stop you before it
        if any(f + 0.36 < h < f + 1.85 for h in hs): BLOCK[r][c] = True
        if any(f + 0.05 < h < f + 1.85 for h in DOWN[r][c]): BLOCK[r][c] = True
WALLS = [[(95.98, -4.39), (88.39, 14.11)], [(160.85, -4.39), (156.16, 7.49)], [(149.37, 24.68), (147.06, 30.54)],
         [(95.98, -4.39), (160.85, -4.39)], [(81.65, 30.54), (138.479, 30.54)], [(144.907, 30.54), (147.06, 30.54)]]
en = plan['edge_north']['polyline']
WALLS += [[tuple(a), tuple(b)] for a, b in zip(en, en[1:])]
WALLS += [[xy(0, 4.126), xy(25.52, 4.126)], [xy(0, -4.126), xy(25.52, -4.126)]]  # the railings' walls
NW = len(WALLS)
for side in ('south', 'north'):
    sh = river['banks'][side]['shore']
    WALLS += [[tuple(a), tuple(b)] for a, b in zip(sh, sh[1:])]
def seg_d(px, pd, a, b):
    ax, ad = a; bx, bd = b; vx, vd = bx - ax, bd - ad; L = vx * vx + vd * vd
    t = max(0, min(1, ((px - ax) * vx + (pd - ad) * vd) / L)) if L else 0
    return math.hypot(px - ax - t * vx, pd - ad - t * vd)
CL = float(os.environ.get('CL', '0.38'))
def build_free(skip_people=()):
    # inflate blocks by CL, people by CL + r, walls by CL
    free = [[not BLOCK[r][c] for c in range(NC)] for r in range(NR)]
    k = int(math.ceil(CL / ST))
    blk = [(r, c) for r in range(NR) for c in range(NC) if BLOCK[r][c]]
    for r, c in blk:
        for dr in range(-k, k + 1):
            for dc in range(-k, k + 1):
                if dr * dr + dc * dc <= k * k:
                    rr, cc = r + dr, c + dc
                    if 0 <= rr < NR and 0 <= cc < NC: free[rr][cc] = False
    for p in PEOPLE:
        if p['id'] in skip_people or p.get('w'): continue
        for (x, d, rad) in p['c']:
            R = rad + CL; r0, c0 = rc(x, d); kk = int(math.ceil(R / ST))
            for dr in range(-kk, kk + 1):
                for dc in range(-kk, kk + 1):
                    rr, cc = r0 + dr, c0 + dc
                    if not (0 <= rr < NR and 0 <= cc < NC): continue
                    X, D = XD(rr, cc)
                    f = FLOOR[rr][cc]
                    if f is not None and abs(f - p['H']) > 1.2: continue
                    if math.hypot(X - x, D - d) < R: free[rr][cc] = False
    for wi, (a, b) in enumerate(WALLS):
        L = math.hypot(b[0] - a[0], b[1] - a[1]); n = int(L / 0.05) + 1
        for i in range(n + 1):
            x = a[0] + (b[0] - a[0]) * i / n; d = a[1] + (b[1] - a[1]) * i / n
            r0, c0 = rc(x, d); kk = int(math.ceil(CL / ST))
            for dr in range(-kk, kk + 1):
                for dc in range(-kk, kk + 1):
                    rr, cc = r0 + dr, c0 + dc
                    if 0 <= rr < NR and 0 <= cc < NC and (dr * dr + dc * dc) * ST * ST <= CL * CL:
                        if wi >= NW and FLOOR[rr][cc] is not None and FLOOR[rr][cc] > 1.0: continue  # the shore walls stand -1.3..1.3
                        free[rr][cc] = False
    return free
_FREE = None
def FREE():
    global _FREE
    if _FREE is None: _FREE = build_free()
    return _FREE
def step_ok(a, b):
    fa, fb = FLOOR[a[0]][a[1]], FLOOR[b[0]][b[1]]
    return fa is not None and fb is not None and fb - fa < 0.3  # no ledges higher than the step
def plan_path(start, goal, free=None):
    free = free or FREE()
    st, gl = rc(*start), rc(*goal)
    if not free[st[0]][st[1]]: return None, 'start blocked'
    if not free[gl[0]][gl[1]]: return None, 'goal blocked'
    g = {st: 0}; prev = {}; pq = [(0, st)]
    while pq:
        _, c = heapq.heappop(pq)
        if c == gl: break
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if not dr and not dc: continue
                n = (c[0] + dr, c[1] + dc)
                if not (0 <= n[0] < NR and 0 <= n[1] < NC) or not free[n[0]][n[1]] or not step_ok(c, n): continue
                cost = g[c] + math.hypot(dr, dc)
                if cost < g.get(n, 1e18):
                    g[n] = cost; prev[n] = c
                    heapq.heappush(pq, (cost + math.hypot(gl[0] - n[0], gl[1] - n[1]), n))
    if gl not in prev: return None, 'no path'
    path = [gl]
    while path[-1] != st: path.append(prev[path[-1]])
    path.reverse()
    def clear(a, b):
        n = max(abs(b[0] - a[0]), abs(b[1] - a[1])) * 2 + 1
        last = a
        for k in range(n + 1):
            q = (round(a[0] + (b[0] - a[0]) * k / n), round(a[1] + (b[1] - a[1]) * k / n))
            if not free[q[0]][q[1]] or not step_ok(last, q): return False
            last = q
        return True
    simp = [path[0]]; i = 0
    while i < len(path) - 1:
        j = len(path) - 1
        while j > i + 1 and not clear(path[i], path[j]): j -= 1
        simp.append(path[j]); i = j
    pts = [XD(*q) for q in simp]
    legs = []
    for A, B in zip(pts, pts[1:]):
        hd = math.degrees(math.atan2(B[1] - A[1], B[0] - A[0])) % 360
        legs.append([round(hd, 1), round(math.hypot(B[0] - A[0], B[1] - A[1]) / 2.2, 2)])
    return {'start': [round(v, 2) for v in pts[0]], 'pts': [[round(a, 2), round(b, 2)] for a, b in pts], 'legs': legs, 'floor_end': FLOOR[gl[0]][gl[1]]}, 'ok'
def floor(X, D): r, c = rc(X, D); return FLOOR[r][c], BLOCK[r][c], FREE()[r][c]
if __name__ == '__main__':
    import sys
    a = [float(v) for v in sys.argv[1:5]]
    print(json.dumps(plan_path((a[0], a[1]), (a[2], a[3]))))
