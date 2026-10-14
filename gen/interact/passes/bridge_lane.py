"""How wide the way is between two places round the Rainbow Bridge's south-west foot (bridge pass, 2026-10-14).

Input: the JSON that gen/interact/passes/grid_bridge_probe.js prints (via gen/interact/tools/probe.mjs). In the capsule
centre's space: geometry from the probe's 0.25 m grid (the ground map, plus the ramp's own map inside it), standing
bodies (people.js circles; walkers left out, they move) grown by the player's 0.3 m, on a 0.05 m grid. For each pair of
named places it finds the widest way (the path whose narrowest point is widest) and prints that narrowest clearance c
and the free width between the bodies there, about 2c + 0.6 m, with the bodies that bound it.
  python3 gen/interact/passes/bridge_lane.py <probe.json> [--pairs foot-bank_e,road-bank_e] [--move <id>:dX,dD ...]
         [--narrow] [--path] [--comfy]
--move tries a figure's move before making it; --narrow lists every point under 1.2 m on the widest way; --comfy prints
a comfortable line (clearance-weighted shortest path) as waypoints, the source of the walks in walks.json."""
import json, sys, math, heapq
argv = sys.argv[1:]
moves = {}
for i, a in enumerate(argv):
    if a.startswith('--move'):
        k, v = (a.split('=', 1)[1] if '=' in a else argv[i + 1]).split(':')
        moves[k] = tuple(map(float, v.split(',')))
args = [a for a in argv if a.endswith('.json')]
o = json.load(open(args[0]))['out']
X0, D1, st = o['X0'], o['D1'], o['step']
G = [l[7:] for l in o['ground']]; K = [l[7:] for l in o['deck']]
def geom_free(x, d):
    i, j = round((D1 - d) / st), round((x - X0) / st)
    if not (0 <= i < len(G) and 0 <= j < len(G[0])): return False
    g, k = G[i][j], K[i][j]
    return g in '.ow' or k in '.ow'
bodies = [dict(b) for b in o['bodies'] if not b['walker'] and b['H'] < 0.9]
for b in bodies:
    if b['id'] in moves: b['X'] += moves[b['id']][0]; b['D'] += moves[b['id']][1]
xa, xb, da, db = 124, 140, 3, 12
f = 0.05
nx, nd = int((xb - xa) / f) + 1, int((db - da) / f) + 1
blocked = [[False] * nx for _ in range(nd)]
for a in range(nd):
    d = da + a * f
    for c in range(nx):
        x = xa + c * f
        if not geom_free(x, d): blocked[a][c] = True; continue
        for b in bodies:
            if (x - b['X']) ** 2 + (d - b['D']) ** 2 < (b['r'] + 0.3) ** 2: blocked[a][c] = True; break
# clearance: exact euclidean distance transform by brute force over blocked boundary cells (small grid)
bnd = [(a, c) for a in range(nd) for c in range(nx) if blocked[a][c] and any(0 <= a + u < nd and 0 <= c + v < nx and not blocked[a + u][c + v] for u in (-1, 0, 1) for v in (-1, 0, 1))]
# bucket boundary cells for speed
from collections import defaultdict
B = defaultdict(list)
for a, c in bnd: B[(a // 20, c // 20)].append((a, c))
clr = [[0.0] * nx for _ in range(nd)]
for a in range(nd):
    for c in range(nx):
        if blocked[a][c]: continue
        best = 9.0
        ba, bc = a // 20, c // 20
        for R in range(0, 6):
            for u in range(ba - R, ba + R + 1):
                for v in range(bc - R, bc + R + 1):
                    if max(abs(u - ba), abs(v - bc)) != R: continue
                    for (p, q) in B.get((u, v), ()):
                        dd = math.hypot(p - a, q - c) * f
                        if dd < best: best = dd
            if best < (R * 20) * f: break
        clr[a][c] = best
def ij(x, d): return (round((d - da) / f), round((x - xa) / f))
def widest(A, Bp):
    (ai, aj), (bi, bj) = ij(*A), ij(*Bp)
    best = [[-1.0] * nx for _ in range(nd)]; prev = {}
    best[ai][aj] = clr[ai][aj]; pq = [(-best[ai][aj], ai, aj)]
    while pq:
        v, i, j = heapq.heappop(pq); v = -v
        if (i, j) == (bi, bj): break
        if v < best[i][j]: continue
        for u in (-1, 0, 1):
            for w in (-1, 0, 1):
                p, q = i + u, j + w
                if 0 <= p < nd and 0 <= q < nx and not blocked[p][q]:
                    nv = min(v, clr[p][q])
                    if nv > best[p][q]: best[p][q] = nv; prev[(p, q)] = (i, j); heapq.heappush(pq, (-nv, p, q))
    if best[bi][bj] <= 0: return 0, None, []
    path = [(bi, bj)]
    while path[-1] != (ai, aj): path.append(prev[path[-1]])
    path.reverse()
    k = min(range(len(path)), key=lambda n: clr[path[n][0]][path[n][1]])
    pt = (xa + path[k][1] * f, da + path[k][0] * f)
    return best[bi][bj], pt, [(round(xa + q * f, 2), round(da + p * f, 2)) for p, q in path]
PTS = {'foot': (127.0, 9.5), 'footn': (128.6, 9.3), 'bank_e': (136.5, 9.0), 'arch': (141.0, 8.5), 'road': (131.0, 3.0), 'prepinch': (132.6, 5.9), 'skirt': (132.9, 10.1), 'onramp': (127.5, 11.5), 'corner': (129.15, 7.2), 'south': (128.0, 5.9), 'rump': (131.4, 5.8)}
pairs = [tuple(p.split('-')) for p in (sys.argv[sys.argv.index('--pairs') + 1].split(',') if '--pairs' in sys.argv else ['foot-bank_e', 'road-bank_e'])]
for a, b in pairs:
    c, pt, path = widest(PTS[a], PTS[b])
    if not pt: print(a, b, 'no way'); continue
    near = sorted(bodies, key=lambda q: math.hypot(q['X'] - pt[0], q['D'] - pt[1]) - q['r'])[:3]
    print(f'{a}->{b}: clearance {c:.2f} -> free width ~{2 * c + 0.6:.2f} m at ({pt[0]:.2f}, {pt[1]:.2f}); near: ' + ', '.join(f"{q['id']} ({q['X']:.2f},{q['D']:.2f}) {math.hypot(q['X'] - pt[0], q['D'] - pt[1]) - q['r'] - 0.3:.2f}" for q in near))
    if '--path' in sys.argv: print('   path:', path[::10])
    # all narrow points along the path below the target
    if '--narrow' in sys.argv:
        seen = []
        for (x, d) in path:
            i, j = ij(x, d)
            if clr[i][j] < 0.3 and all(math.hypot(x - s[0], d - s[1]) > 0.5 for s in seen):
                seen.append((x, d))
                nb = sorted(bodies, key=lambda q: math.hypot(q['X'] - x, q['D'] - d) - q['r'])[:2]
                print(f'   narrow {clr[i][j]:.2f} at ({x:.2f},{d:.2f}) ' + ', '.join(f"{q['id']} {math.hypot(q['X'] - x, q['D'] - d) - q['r'] - 0.3:.2f}" for q in nb))

def comfy(A, Bp, k=0.6, cmin=0.3):
    """Shortest path weighted by 1 + k / clearance, only through cells with clearance >= cmin."""
    (ai, aj), (bi, bj) = ij(*A), ij(*Bp)
    dist = {(ai, aj): 0.0}; prev = {}; pq = [(0.0, ai, aj)]
    while pq:
        dd, i, j = heapq.heappop(pq)
        if (i, j) == (bi, bj): break
        if dd > dist.get((i, j), 1e9): continue
        for u in (-1, 0, 1):
            for w in (-1, 0, 1):
                if not (u or w): continue
                p, q = i + u, j + w
                if 0 <= p < nd and 0 <= q < nx and not blocked[p][q] and clr[p][q] >= cmin:
                    nd_ = dd + math.hypot(u, w) * f * (1 + k / max(clr[p][q], 0.05))
                    if nd_ < dist.get((p, q), 1e9): dist[(p, q)] = nd_; prev[(p, q)] = (i, j); heapq.heappush(pq, (nd_, p, q))
    if (bi, bj) not in prev: return None
    path = [(bi, bj)]
    while path[-1] != (ai, aj): path.append(prev[path[-1]])
    path.reverse()
    pts = [(xa + q * f, da + p * f, clr[p][q]) for p, q in path]
    # simplify: keep a point when the straight line from the last kept one would pass closer than cmin to a block
    def ok(a, b):
        n = max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) / f))
        for t in range(n + 1):
            x = a[0] + (b[0] - a[0]) * t / n; d = a[1] + (b[1] - a[1]) * t / n
            i, j = ij(x, d)
            if blocked[i][j] or clr[i][j] < cmin + 0.05: return False
        return True
    keep = [pts[0]]; last = 0
    for m in range(2, len(pts)):
        if not ok(keep[-1], pts[m]): keep.append(pts[m - 1])
    keep.append(pts[-1])
    return [(round(x, 2), round(d, 2), round(c, 2)) for x, d, c in keep], min(c for _, _, c in pts)
if '--comfy' in sys.argv:
    for a, b in pairs:
        r = comfy(PTS[a], PTS[b])
        print(a, b, r)
